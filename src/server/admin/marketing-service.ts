import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import {
  buildAffiliateOrderBy,
  buildAffiliateWhere,
  buildCouponOrderBy,
  buildCouponWhere,
  marketingIndexActiveFilters,
  marketingIndexWindow,
  type MarketingIndexInput,
} from "./marketing-index";
import {
  paginationMeta,
  type ResourceIndexResult,
} from "./resource-index";

const couponInclude = {
  products: {
    select: {
      productId: true,
    },
  },
  _count: {
    select: {
      redemptions: true,
      orders: true,
    },
  },
} satisfies Prisma.CouponInclude;

const affiliateInclude = {
  _count: {
    select: {
      orders: true,
    },
  },
} satisfies Prisma.AffiliateInclude;

export type AdminCouponListItem =
  Prisma.CouponGetPayload<{
    include: typeof couponInclude;
  }>;
export type AdminAffiliateListItem =
  Prisma.AffiliateGetPayload<{
    include: typeof affiliateInclude;
  }>;

export type AdminMarketingSummary = {
  activeCoupons: number;
  liveCouponRedemptions: number;
  activeAffiliates: number;
  liveAttributedOrders: number;
};

export async function listAdminCoupons(
  input: MarketingIndexInput,
): Promise<ResourceIndexResult<AdminCouponListItem>> {
  const where = buildCouponWhere(input);
  const { skip, take } = marketingIndexWindow(input);

  const [total, items] = await Promise.all([
    prisma.coupon.count({ where }),
    prisma.coupon.findMany({
      where,
      include: couponInclude,
      orderBy: buildCouponOrderBy(input),
      skip,
      take,
    }),
  ]);

  return {
    items,
    meta: paginationMeta(
      input.page,
      input.pageSize,
      total,
    ),
    activeFilters: marketingIndexActiveFilters(input),
  };
}

export async function listAdminAffiliates(
  input: MarketingIndexInput,
): Promise<ResourceIndexResult<AdminAffiliateListItem>> {
  const where = buildAffiliateWhere(input);
  const { skip, take } = marketingIndexWindow(input);

  const [total, items] = await Promise.all([
    prisma.affiliate.count({ where }),
    prisma.affiliate.findMany({
      where,
      include: affiliateInclude,
      orderBy: buildAffiliateOrderBy(input),
      skip,
      take,
    }),
  ]);

  return {
    items,
    meta: paginationMeta(
      input.page,
      input.pageSize,
      total,
    ),
    activeFilters: marketingIndexActiveFilters(input),
  };
}

export async function getAdminMarketingSummary(
  now = new Date(),
): Promise<AdminMarketingSummary> {
  const liveEvidence = {
    some: {
      environment: "LIVE" as const,
      status: {
        in: [
          "SUCCEEDED" as const,
          "PARTIALLY_REFUNDED" as const,
          "REFUNDED" as const,
        ],
      },
    },
  };

  const [
    activeCoupons,
    liveCouponRedemptions,
    activeAffiliates,
    liveAttributedOrders,
  ] = await Promise.all([
    prisma.coupon.count({
      where: {
        active: true,
        AND: [
          {
            OR: [
              { startsAt: null },
              { startsAt: { lte: now } },
            ],
          },
          {
            OR: [
              { endsAt: null },
              { endsAt: { gt: now } },
            ],
          },
        ],
      },
    }),
    prisma.couponRedemption.count({
      where: {
        status: "REDEEMED",
        order: {
          payments: liveEvidence,
        },
      },
    }),
    prisma.affiliate.count({
      where: {
        active: true,
      },
    }),
    prisma.order.count({
      where: {
        affiliateId: {
          not: null,
        },
        payments: liveEvidence,
      },
    }),
  ]);

  return {
    activeCoupons,
    liveCouponRedemptions,
    activeAffiliates,
    liveAttributedOrders,
  };
}


export type AdminMarketingRow =
  | {
      kind: "coupon";
      id: string;
      code: string;
      name: string;
      discountType: "PERCENTAGE" | "FIXED_AMOUNT";
      percentageBps: number | null;
      fixedAmountMinor: number | null;
      currency: string | null;
      minimumSubtotal: number | null;
      maxRedemptions: number | null;
      perEmailLimit: number | null;
      active: boolean;
      startsAt: string | null;
      endsAt: string | null;
      productIds: string[];
      redemptionCount: number;
      orderCount: number;
    }
  | {
      kind: "affiliate";
      id: string;
      code: string;
      displayName: string;
      email: string | null;
      commissionBps: number | null;
      active: boolean;
      orderCount: number;
    };

export async function listAdminMarketing(
  input: MarketingIndexInput,
): Promise<ResourceIndexResult<AdminMarketingRow>> {
  if (input.view === "coupons") {
    const result = await listAdminCoupons(input);
    return {
      ...result,
      items: result.items.map((coupon) => ({
        kind: "coupon" as const,
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        discountType: coupon.discountType,
        percentageBps: coupon.percentageBps,
        fixedAmountMinor: coupon.fixedAmountMinor,
        currency: coupon.currency,
        minimumSubtotal: coupon.minimumSubtotal,
        maxRedemptions: coupon.maxRedemptions,
        perEmailLimit: coupon.perEmailLimit,
        active: coupon.active,
        startsAt: coupon.startsAt?.toISOString() ?? null,
        endsAt: coupon.endsAt?.toISOString() ?? null,
        productIds: coupon.products.map((item) => item.productId),
        redemptionCount: coupon._count.redemptions,
        orderCount: coupon._count.orders,
      })),
    };
  }

  const result = await listAdminAffiliates(input);
  return {
    ...result,
    items: result.items.map((affiliate) => ({
      kind: "affiliate" as const,
      id: affiliate.id,
      code: affiliate.code,
      displayName: affiliate.displayName,
      email: affiliate.email,
      commissionBps: affiliate.commissionBps,
      active: affiliate.active,
      orderCount: affiliate._count.orders,
    })),
  };
}
