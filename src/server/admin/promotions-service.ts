import { CURRENCIES, type CurrencyCode } from "../../domain/constants";
import { normalizeEmail } from "../../domain/email";
import { prisma } from "../../lib/prisma";
import { normalizePromotionCode } from "../promotions/promotion-core";
import { writeAdminAudit } from "./audit";

type CouponDiscountTypeInput = "PERCENTAGE" | "FIXED_AMOUNT";

export type CreateCouponInput = {
  code: string;
  name: string;
  discountType: CouponDiscountTypeInput;
  percentageBps?: number | null;
  fixedAmountMinor?: number | null;
  currency?: string | null;
  minimumSubtotal?: number | null;
  maxRedemptions?: number | null;
  perEmailLimit?: number | null;
  startsAt?: string | Date | null;
  endsAt?: string | Date | null;
  productIds?: string[];
};

export type CreateAffiliateInput = {
  code: string;
  displayName: string;
  email?: string | null;
  commissionBps?: number | null;
};

function text(value: string, label: string, max = 160): string {
  const normalized = value.trim();
  if (!normalized || normalized.length > max) {
    throw new Error(`${label} is required and must be at most ${max} characters.`);
  }
  return normalized;
}

function optionalPositiveInteger(value: number | null | undefined, label: string) {
  if (value === null || value === undefined) return null;
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }
  return value;
}

function optionalNonNegativeInteger(value: number | null | undefined, label: string) {
  if (value === null || value === undefined) return null;
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
  return value;
}

function optionalDate(value: string | Date | null | undefined, label: string) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} is invalid.`);
  return date;
}

function optionalCurrency(value: string | null | undefined): CurrencyCode | null {
  if (value === null || value === undefined || value === "") return null;
  if (!(CURRENCIES as readonly string[]).includes(value)) {
    throw new Error("Unsupported coupon currency.");
  }
  return value as CurrencyCode;
}

function normalizeProductIds(value: string[] | undefined): string[] {
  if (!value) return [];
  if (!Array.isArray(value) || value.length > 100) {
    throw new Error("Coupon product restrictions are invalid.");
  }
  const ids = [...new Set(value.map((item) => item.trim()).filter(Boolean))];
  if (ids.some((id) => !/^vp_[a-z0-9_-]+$/i.test(id))) {
    throw new Error("Coupon contains an invalid product identifier.");
  }
  return ids;
}

export async function listMarketingPromotions() {
  const [coupons, affiliates] = await Promise.all([
    prisma.coupon.findMany({
      include: {
        products: { select: { productId: true } },
        _count: { select: { redemptions: true, orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.affiliate.findMany({
      include: { _count: { select: { orders: true } } },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
  ]);
  return { coupons, affiliates };
}

export async function createCoupon(
  actorAdminId: string,
  input: CreateCouponInput,
) {
  const code = normalizePromotionCode(input.code);
  if (!code) throw new Error("Coupon code is required.");
  const name = text(input.name, "Coupon name");
  const currency = optionalCurrency(input.currency);
  const minimumSubtotal = optionalNonNegativeInteger(
    input.minimumSubtotal,
    "Minimum subtotal",
  );
  if (minimumSubtotal !== null && !currency) {
    throw new Error("A coupon minimum subtotal requires an explicit currency.");
  }
  const maxRedemptions = optionalPositiveInteger(
    input.maxRedemptions,
    "Maximum redemptions",
  );
  const perEmailLimit = optionalPositiveInteger(
    input.perEmailLimit,
    "Per-email limit",
  );
  const startsAt = optionalDate(input.startsAt, "Start date");
  const endsAt = optionalDate(input.endsAt, "End date");
  if (startsAt && endsAt && endsAt <= startsAt) {
    throw new Error("Coupon end date must be after the start date.");
  }

  let percentageBps: number | null = null;
  let fixedAmountMinor: number | null = null;
  if (input.discountType === "PERCENTAGE") {
    percentageBps = optionalPositiveInteger(
      input.percentageBps,
      "Percentage basis points",
    );
    if (percentageBps === null || percentageBps > 9_999) {
      throw new Error("Percentage discount must be between 0.01% and 99.99%.");
    }
    if (input.fixedAmountMinor !== null && input.fixedAmountMinor !== undefined) {
      throw new Error("Percentage coupons cannot include a fixed amount.");
    }
  } else if (input.discountType === "FIXED_AMOUNT") {
    fixedAmountMinor = optionalPositiveInteger(
      input.fixedAmountMinor,
      "Fixed discount amount",
    );
    if (fixedAmountMinor === null || !currency) {
      throw new Error("Fixed-amount coupons require an amount and currency.");
    }
    if (input.percentageBps !== null && input.percentageBps !== undefined) {
      throw new Error("Fixed-amount coupons cannot include a percentage.");
    }
  } else {
    throw new Error("Unsupported coupon discount type.");
  }

  const existingCoupon = await prisma.coupon.findUnique({ where: { code }, select: { id: true } });
  if (existingCoupon) throw new Error("Coupon code already exists.");

  const productIds = normalizeProductIds(input.productIds);
  if (productIds.length) {
    const count = await prisma.product.count({ where: { id: { in: productIds } } });
    if (count !== productIds.length) {
      throw new Error("One or more coupon products do not exist.");
    }
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      name,
      discountType: input.discountType,
      percentageBps,
      fixedAmountMinor,
      currency,
      minimumSubtotal,
      maxRedemptions,
      perEmailLimit,
      startsAt,
      endsAt,
      createdByAdminId: actorAdminId,
      products: productIds.length
        ? { create: productIds.map((productId) => ({ productId })) }
        : undefined,
    },
    include: { products: { select: { productId: true } } },
  });

  await writeAdminAudit({
    actorAdminId,
    action: "COUPON_CREATED",
    entityType: "Coupon",
    entityId: coupon.id,
    metadata: {
      code: coupon.code,
      discountType: coupon.discountType,
      currency: coupon.currency,
      productCount: coupon.products.length,
    },
  });
  return coupon;
}

export async function setCouponActive(
  actorAdminId: string,
  id: string,
  active: boolean,
) {
  const coupon = await prisma.coupon.update({ where: { id }, data: { active } });
  await writeAdminAudit({
    actorAdminId,
    action: "COUPON_STATUS_UPDATED",
    entityType: "Coupon",
    entityId: id,
    metadata: { code: coupon.code, active },
  });
  return coupon;
}

export async function createAffiliate(
  actorAdminId: string,
  input: CreateAffiliateInput,
) {
  const code = normalizePromotionCode(input.code);
  if (!code) throw new Error("Affiliate code is required.");
  const displayName = text(input.displayName, "Affiliate display name");
  const email = input.email?.trim() ? normalizeEmail(input.email) : null;
  const commissionBps = optionalNonNegativeInteger(
    input.commissionBps,
    "Affiliate commission basis points",
  );
  if (commissionBps !== null && commissionBps > 10_000) {
    throw new Error("Affiliate commission cannot exceed 100%.");
  }

  const existingAffiliate = await prisma.affiliate.findUnique({ where: { code }, select: { id: true } });
  if (existingAffiliate) throw new Error("Affiliate code already exists.");

  const affiliate = await prisma.affiliate.create({
    data: {
      code,
      displayName,
      email,
      commissionBps,
      createdByAdminId: actorAdminId,
    },
  });

  await writeAdminAudit({
    actorAdminId,
    action: "AFFILIATE_CREATED",
    entityType: "Affiliate",
    entityId: affiliate.id,
    metadata: {
      code: affiliate.code,
      commissionBps: affiliate.commissionBps,
    },
  });
  return affiliate;
}

export async function setAffiliateActive(
  actorAdminId: string,
  id: string,
  active: boolean,
) {
  const affiliate = await prisma.affiliate.update({
    where: { id },
    data: { active },
  });
  await writeAdminAudit({
    actorAdminId,
    action: "AFFILIATE_STATUS_UPDATED",
    entityType: "Affiliate",
    entityId: id,
    metadata: { code: affiliate.code, active },
  });
  return affiliate;
}
