import type { Prisma } from "@prisma/client";

import { CURRENCIES, type CurrencyCode } from "../../domain/constants.ts";
import {
  normalizeSearchText,
  parseDateRange,
  parsePage,
  parsePageSize,
  parseSort,
  type ParsedDateRange,
  type ResourceIndexActiveFilter,
  type ResourceIndexBase,
} from "./resource-index.ts";
import {
  dateRangeFilter,
  optionalEnumParam,
} from "./resource-index-helpers.ts";

export const CUSTOMER_SEGMENTS = ["repeat", "single"] as const;
export const CUSTOMER_INDEX_SORTS = [
  "recent",
  "oldest-last-order",
  "most-orders",
  "email",
] as const;

export type CustomerSegment = (typeof CUSTOMER_SEGMENTS)[number];
export type CustomerIndexSort = (typeof CUSTOMER_INDEX_SORTS)[number];

export type CustomerIndexInput = ResourceIndexBase<CustomerIndexSort> & {
  segment?: CustomerSegment;
  currency?: CurrencyCode;
  lastOrder: ParsedDateRange;
};

export function parseCustomerIndexParams(
  params: URLSearchParams,
): CustomerIndexInput {
  return {
    query: normalizeSearchText(params.get("q")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("pageSize")),
    sort: parseSort(params.get("sort"), CUSTOMER_INDEX_SORTS, "recent"),
    segment: optionalEnumParam(
      params.get("segment"),
      CUSTOMER_SEGMENTS,
      "Invalid customer segment filter.",
    ),
    currency: optionalEnumParam(
      params.get("currency"),
      CURRENCIES,
      "Invalid currency filter.",
    ),
    lastOrder: parseDateRange(
      params.get("lastOrderFrom"),
      params.get("lastOrderTo"),
    ),
  };
}

export function qualifyingCustomerOrderWhere(
  input?: Pick<CustomerIndexInput, "query" | "currency">,
): Prisma.OrderWhereInput {
  const clauses: Prisma.OrderWhereInput[] = [
    {
      status: {
        in: ["PAID", "FULFILLED", "PARTIALLY_FULFILLED"],
      },
      payments: {
        some: {
          environment: "LIVE",
          status: "SUCCEEDED",
        },
      },
    },
  ];

  if (input?.query) {
    clauses.push({
      email: {
        contains: input.query,
        mode: "insensitive",
      },
    });
  }

  if (input?.currency) {
    clauses.push({
      currency: input.currency,
    });
  }

  return { AND: clauses };
}

export function customerGroupHaving(
  input: CustomerIndexInput,
): Prisma.OrderScalarWhereWithAggregatesInput | undefined {
  const clauses: Prisma.OrderScalarWhereWithAggregatesInput[] = [];

  if (input.segment === "repeat") {
    clauses.push({
      email: {
        _count: {
          gte: 2,
        },
      },
    });
  } else if (input.segment === "single") {
    clauses.push({
      email: {
        _count: {
          equals: 1,
        },
      },
    });
  }

  if (input.lastOrder.from) {
    clauses.push({
      createdAt: {
        _max: {
          gte: input.lastOrder.from,
        },
      },
    });
  }

  if (input.lastOrder.toExclusive) {
    clauses.push({
      createdAt: {
        _max: {
          lt: input.lastOrder.toExclusive,
        },
      },
    });
  }

  return clauses.length ? { AND: clauses } : undefined;
}

export function customerGroupOrderBy(
  input: CustomerIndexInput,
) {
  switch (input.sort) {
    case "oldest-last-order":
      return [
        { _max: { createdAt: "asc" as const } },
        { email: "asc" as const },
      ];
    case "most-orders":
      return [
        { _count: { email: "desc" as const } },
        { email: "asc" as const },
      ];
    case "email":
      return [{ email: "asc" as const }];
    case "recent":
    default:
      return [
        { _max: { createdAt: "desc" as const } },
        { email: "asc" as const },
      ];
  }
}

export function customerIndexWindow(input: CustomerIndexInput) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };
}

export function customerIndexActiveFilters(
  input: CustomerIndexInput,
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

  if (input.segment) {
    filters.push({
      key: "segment",
      label: "Buyer segment",
      value: input.segment,
      params: ["segment"],
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

  const lastOrder = dateRangeFilter(
    "lastOrder",
    "Last order",
    ["lastOrderFrom", "lastOrderTo"],
    input.lastOrder,
  );
  if (lastOrder) filters.push(lastOrder);

  return filters;
}
