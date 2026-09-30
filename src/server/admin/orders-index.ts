import type { Prisma } from "@prisma/client";

import {
  CURRENCIES,
  PAYMENT_ENVIRONMENTS,
  PAYMENT_PROVIDERS,
  type CurrencyCode,
  type PaymentEnvironment,
  type PaymentProviderId,
} from "../../domain/constants.ts";
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
  rangeWhere,
} from "./resource-index-helpers.ts";

export const ORDER_STATUSES = [
  "PENDING",
  "INITIALIZED",
  "PAID",
  "FAILED",
  "CANCELLED",
  "FULFILLED",
  "PARTIALLY_FULFILLED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

export const ORDER_INDEX_SORTS = [
  "newest",
  "oldest",
  "recently-updated",
  "status",
  "email",
] as const;

export type OrderStatusFilter = (typeof ORDER_STATUSES)[number];
export type OrderIndexSort = (typeof ORDER_INDEX_SORTS)[number];

export type OrderIndexInput = ResourceIndexBase<OrderIndexSort> & {
  status?: OrderStatusFilter;
  environment?: PaymentEnvironment;
  provider?: PaymentProviderId;
  currency?: CurrencyCode;
  created: ParsedDateRange;
  paid: ParsedDateRange;
};

export function parseOrderIndexParams(params: URLSearchParams): OrderIndexInput {
  return {
    query: normalizeSearchText(params.get("q")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("pageSize")),
    sort: parseSort(params.get("sort"), ORDER_INDEX_SORTS, "newest"),
    status: optionalEnumParam(
      params.get("status"),
      ORDER_STATUSES,
      "Invalid order status filter.",
    ),
    environment: optionalEnumParam(
      params.get("environment"),
      PAYMENT_ENVIRONMENTS,
      "Invalid payment environment filter.",
    ),
    provider: optionalEnumParam(
      params.get("provider"),
      PAYMENT_PROVIDERS,
      "Invalid payment provider filter.",
    ),
    currency: optionalEnumParam(
      params.get("currency"),
      CURRENCIES,
      "Invalid currency filter.",
    ),
    created: parseDateRange(params.get("createdFrom"), params.get("createdTo")),
    paid: parseDateRange(params.get("paidFrom"), params.get("paidTo")),
  };
}

export function buildOrderWhere(input: OrderIndexInput): Prisma.OrderWhereInput {
  const clauses: Prisma.OrderWhereInput[] = [];

  if (input.query) {
    clauses.push({
      OR: [
        { reference: { contains: input.query, mode: "insensitive" } },
        { email: { contains: input.query, mode: "insensitive" } },
        {
          items: {
            some: {
              OR: [
                { productTitle: { contains: input.query, mode: "insensitive" } },
                { productSlug: { contains: input.query, mode: "insensitive" } },
              ],
            },
          },
        },
      ],
    });
  }

  if (input.status) clauses.push({ status: input.status });
  if (input.currency) clauses.push({ currency: input.currency });
  if (input.environment) {
    clauses.push({ payments: { some: { environment: input.environment } } });
  }
  if (input.provider) {
    clauses.push({ payments: { some: { provider: input.provider } } });
  }

  const createdAt = rangeWhere(input.created);
  const paidAt = rangeWhere(input.paid);
  if (createdAt) clauses.push({ createdAt });
  if (paidAt) clauses.push({ paidAt });

  return clauses.length ? { AND: clauses } : {};
}

export function buildOrderOrderBy(
  input: OrderIndexInput,
): Prisma.OrderOrderByWithRelationInput[] {
  switch (input.sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "recently-updated":
      return [{ updatedAt: "desc" }, { id: "asc" }];
    case "status":
      return [{ status: "asc" }, { reference: "asc" }, { id: "asc" }];
    case "email":
      return [{ email: "asc" }, { reference: "asc" }, { id: "asc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export function orderIndexWindow(input: OrderIndexInput) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };
}

export function orderIndexActiveFilters(
  input: OrderIndexInput,
): ResourceIndexActiveFilter[] {
  const filters: ResourceIndexActiveFilter[] = [];
  if (input.query) filters.push({ key: "query", label: "Search", value: input.query, params: ["q"] });
  if (input.status) filters.push({ key: "status", label: "Status", value: input.status, params: ["status"] });
  if (input.environment) filters.push({ key: "environment", label: "Environment", value: input.environment, params: ["environment"] });
  if (input.provider) filters.push({ key: "provider", label: "Provider", value: input.provider, params: ["provider"] });
  if (input.currency) filters.push({ key: "currency", label: "Currency", value: input.currency, params: ["currency"] });
  const created = dateRangeFilter("created", "Created", ["createdFrom", "createdTo"], input.created);
  const paid = dateRangeFilter("paid", "Paid", ["paidFrom", "paidTo"], input.paid);
  if (created) filters.push(created);
  if (paid) filters.push(paid);
  return filters;
}
