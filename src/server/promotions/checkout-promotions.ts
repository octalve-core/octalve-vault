import type { Prisma } from "@prisma/client";
import type { CurrencyCode } from "../../domain/constants.ts";
import {
  assertCouponActiveWindow,
  calculateCouponDiscount,
  normalizePromotionCode,
} from "./promotion-core.ts";

export const COUPON_RESERVATION_TTL_MS = 30 * 60 * 1000;

type PromotionDb = Pick<
  Prisma.TransactionClient,
  "coupon" | "couponRedemption" | "affiliate"
>;

type PricedItem = { productId: string; totalAmount: number };

function activeReservationWhere(now: Date) {
  return {
    OR: [
      { status: "REDEEMED" as const },
      {
        status: "RESERVED" as const,
        OR: [
          { reservationExpiresAt: { gt: now } },
          { order: { status: "INITIALIZED" as const } },
          { order: { status: "PAID" as const } },
          { order: { status: "FULFILLED" as const } },
          { order: { status: "PARTIALLY_FULFILLED" as const } },
          { order: { status: "PARTIALLY_REFUNDED" as const } },
        ],
      },
    ],
  };
}

export type ResolvedCoupon = {
  id: string;
  code: string;
  discountAmount: number;
};

export type ResolvedAffiliate = {
  id: string;
  code: string;
  commissionBps: number | null;
};

export async function resolveCouponForCheckout(
  db: PromotionDb,
  input: {
    code?: string | null;
    email: string;
    currency: CurrencyCode;
    subtotalAmount: number;
    items: PricedItem[];
    now?: Date;
  },
): Promise<ResolvedCoupon | null> {
  const code = normalizePromotionCode(input.code);
  if (!code) return null;

  const now = input.now ?? new Date();
  const coupon = await db.coupon.findUnique({
    where: { code },
    include: { products: { select: { productId: true } } },
  });
  if (!coupon) throw new Error("Coupon code is invalid or unavailable.");

  try {
    assertCouponActiveWindow(coupon, now);
  } catch {
    throw new Error("Coupon code is invalid or unavailable.");
  }

  const restrictedIds = new Set(coupon.products.map((item) => item.productId));
  const eligibleSubtotal = input.items
    .filter(
      (item) => restrictedIds.size === 0 || restrictedIds.has(item.productId),
    )
    .reduce((sum, item) => sum + item.totalAmount, 0);

  const discountAmount = calculateCouponDiscount(
    {
      discountType: coupon.discountType,
      percentageBps: coupon.percentageBps,
      fixedAmountMinor: coupon.fixedAmountMinor,
      currency: coupon.currency,
      minimumSubtotal: coupon.minimumSubtotal,
    },
    {
      currency: input.currency,
      subtotalAmount: input.subtotalAmount,
      eligibleSubtotal,
    },
  );

  const activeWhere = activeReservationWhere(now);
  if (coupon.maxRedemptions !== null) {
    const used = await db.couponRedemption.count({
      where: { couponId: coupon.id, ...activeWhere },
    });
    if (used >= coupon.maxRedemptions) {
      throw new Error("Coupon code is invalid or unavailable.");
    }
  }

  if (coupon.perEmailLimit !== null) {
    const usedByEmail = await db.couponRedemption.count({
      where: { couponId: coupon.id, email: input.email, ...activeWhere },
    });
    if (usedByEmail >= coupon.perEmailLimit) {
      throw new Error("Coupon code is invalid or unavailable.");
    }
  }

  return { id: coupon.id, code: coupon.code, discountAmount };
}

export async function resolveAffiliateForCheckout(
  db: PromotionDb,
  input: { code?: string | null },
): Promise<ResolvedAffiliate | null> {
  const code = normalizePromotionCode(input.code);
  if (!code) return null;

  const affiliate = await db.affiliate.findUnique({ where: { code } });
  if (!affiliate?.active) {
    throw new Error("Affiliate code is invalid or unavailable.");
  }

  if (
    affiliate.commissionBps !== null &&
    (!Number.isSafeInteger(affiliate.commissionBps) ||
      affiliate.commissionBps < 0 ||
      affiliate.commissionBps > 10_000)
  ) {
    throw new Error("Affiliate code is invalid or unavailable.");
  }

  return {
    id: affiliate.id,
    code: affiliate.code,
    commissionBps: affiliate.commissionBps,
  };
}
