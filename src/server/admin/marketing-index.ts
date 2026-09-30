import type { Prisma } from "@prisma/client";

import {
  CURRENCIES,
  type CurrencyCode,
} from "../../domain/constants.ts";
import {
  normalizeSearchText,
  parsePage,
  parsePageSize,
  parseSort,
  type ResourceIndexActiveFilter,
  type ResourceIndexBase,
} from "./resource-index.ts";
import {
  optionalBooleanParam,
  optionalEnumParam,
} from "./resource-index-helpers.ts";

export const MARKETING_VIEWS = [
  "coupons",
  "affiliates",
] as const;
export const COUPON_DISCOUNT_TYPES = [
  "PERCENTAGE",
  "FIXED_AMOUNT",
] as const;
export const COUPON_INDEX_SORTS = [
  "newest",
  "oldest",
  "code",
  "status",
] as const;
export const AFFILIATE_INDEX_SORTS = [
  "newest",
  "oldest",
  "name",
  "status",
] as const;

export type MarketingView =
  (typeof MARKETING_VIEWS)[number];
export type CouponIndexSort =
  (typeof COUPON_INDEX_SORTS)[number];
export type AffiliateIndexSort =
  (typeof AFFILIATE_INDEX_SORTS)[number];
export type MarketingIndexSort =
  | CouponIndexSort
  | AffiliateIndexSort;

export type MarketingIndexInput =
  ResourceIndexBase<MarketingIndexSort> & {
    view: MarketingView;
    active?: boolean;
    discountType?:
      (typeof COUPON_DISCOUNT_TYPES)[number];
    currency?: CurrencyCode;
  };

export function parseMarketingIndexParams(
  params: URLSearchParams,
): MarketingIndexInput {
  const view = optionalEnumParam(
    params.get("view"),
    MARKETING_VIEWS,
    "Invalid marketing view.",
  ) ?? "coupons";

  const sort =
    view === "coupons"
      ? parseSort(
          params.get("sort"),
          COUPON_INDEX_SORTS,
          "newest",
        )
      : parseSort(
          params.get("sort"),
          AFFILIATE_INDEX_SORTS,
          "newest",
        );

  return {
    query: normalizeSearchText(params.get("q")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("pageSize")),
    sort,
    view,
    active: optionalBooleanParam(
      params.get("active"),
      "Invalid marketing active filter.",
    ),
    discountType:
      view === "coupons"
        ? optionalEnumParam(
            params.get("discountType"),
            COUPON_DISCOUNT_TYPES,
            "Invalid coupon discount type.",
          )
        : undefined,
    currency:
      view === "coupons"
        ? optionalEnumParam(
            params.get("currency"),
            CURRENCIES,
            "Invalid coupon currency filter.",
          )
        : undefined,
  };
}

export function buildCouponWhere(
  input: MarketingIndexInput,
): Prisma.CouponWhereInput {
  const clauses: Prisma.CouponWhereInput[] = [];

  if (input.query) {
    clauses.push({
      OR: [
        {
          code: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        {
          name: {
            contains: input.query,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (input.active !== undefined) {
    clauses.push({ active: input.active });
  }
  if (input.discountType) {
    clauses.push({
      discountType: input.discountType,
    });
  }
  if (input.currency) {
    clauses.push({
      currency: input.currency,
    });
  }

  return clauses.length ? { AND: clauses } : {};
}

export function buildAffiliateWhere(
  input: MarketingIndexInput,
): Prisma.AffiliateWhereInput {
  const clauses: Prisma.AffiliateWhereInput[] = [];

  if (input.query) {
    clauses.push({
      OR: [
        {
          code: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        {
          displayName: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: input.query,
            mode: "insensitive",
          },
        },
      ],
    });
  }

  if (input.active !== undefined) {
    clauses.push({ active: input.active });
  }

  return clauses.length ? { AND: clauses } : {};
}

export function buildCouponOrderBy(
  input: MarketingIndexInput,
): Prisma.CouponOrderByWithRelationInput[] {
  switch (input.sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "code":
      return [{ code: "asc" }, { id: "asc" }];
    case "status":
      return [
        { active: "desc" },
        { createdAt: "desc" },
        { id: "asc" },
      ];
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export function buildAffiliateOrderBy(
  input: MarketingIndexInput,
): Prisma.AffiliateOrderByWithRelationInput[] {
  switch (input.sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "name":
      return [
        { displayName: "asc" },
        { code: "asc" },
        { id: "asc" },
      ];
    case "status":
      return [
        { active: "desc" },
        { displayName: "asc" },
        { id: "asc" },
      ];
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export function marketingIndexWindow(
  input: MarketingIndexInput,
) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };
}

export function marketingIndexActiveFilters(
  input: MarketingIndexInput,
): ResourceIndexActiveFilter[] {
  const filters: ResourceIndexActiveFilter[] = [];

  if (input.query) {
    filters.push({
      key: "query",
      label: "Search",
      value: input.query,
      params: ["q"],
    });
  }

  if (input.active !== undefined) {
    filters.push({
      key: "active",
      label: "Status",
      value: input.active ? "Active" : "Inactive",
      params: ["active"],
    });
  }

  if (input.discountType) {
    filters.push({
      key: "discountType",
      label: "Discount type",
      value: input.discountType,
      params: ["discountType"],
    });
  }

  if (input.currency) {
    filters.push({
      key: "currency",
      label: "Currency",
      value: input.currency,
      params: ["currency"],
    });
  }

  return filters;
}
