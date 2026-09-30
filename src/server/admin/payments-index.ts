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

export const PAYMENT_STATUSES = [
  "PENDING",
  "INITIALIZED",
  "PROCESSING",
  "SUCCEEDED",
  "FAILED",
  "CANCELLED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

export const PAYMENT_INDEX_SORTS = [
  "newest",
  "oldest",
  "recently-updated",
  "status",
  "provider",
] as const;

export type PaymentStatusFilter = (typeof PAYMENT_STATUSES)[number];
export type PaymentIndexSort = (typeof PAYMENT_INDEX_SORTS)[number];

export type PaymentIndexInput = ResourceIndexBase<PaymentIndexSort> & {
  status?: PaymentStatusFilter;
  environment?: PaymentEnvironment;
  provider?: PaymentProviderId;
  currency?: CurrencyCode;
  created: ParsedDateRange;
  updated: ParsedDateRange;
};

export function parsePaymentIndexParams(params: URLSearchParams): PaymentIndexInput {
  return {
    query: normalizeSearchText(params.get("q")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("pageSize")),
    sort: parseSort(params.get("sort"), PAYMENT_INDEX_SORTS, "newest"),
    status: optionalEnumParam(
      params.get("status"),
      PAYMENT_STATUSES,
      "Invalid payment status filter.",
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
    updated: parseDateRange(params.get("updatedFrom"), params.get("updatedTo")),
  };
}

export function buildPaymentWhere(
  input: PaymentIndexInput,
): Prisma.PaymentAttemptWhereInput {
  const clauses: Prisma.PaymentAttemptWhereInput[] = [];

  if (input.query) {
    clauses.push({
      OR: [
        { providerReference: { contains: input.query, mode: "insensitive" } },
        { providerTxId: { contains: input.query, mode: "insensitive" } },
        { order: { reference: { contains: input.query, mode: "insensitive" } } },
        { order: { email: { contains: input.query, mode: "insensitive" } } },
      ],
    });
  }

  if (input.status) clauses.push({ status: input.status });
  if (input.environment) clauses.push({ environment: input.environment });
  if (input.provider) clauses.push({ provider: input.provider });
  if (input.currency) clauses.push({ currency: input.currency });

  const createdAt = rangeWhere(input.created);
  const updatedAt = rangeWhere(input.updated);
  if (createdAt) clauses.push({ createdAt });
  if (updatedAt) clauses.push({ updatedAt });

  return clauses.length ? { AND: clauses } : {};
}

export function buildPaymentOrderBy(
  input: PaymentIndexInput,
): Prisma.PaymentAttemptOrderByWithRelationInput[] {
  switch (input.sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "recently-updated":
      return [{ updatedAt: "desc" }, { id: "asc" }];
    case "status":
      return [{ status: "asc" }, { createdAt: "desc" }, { id: "asc" }];
    case "provider":
      return [{ provider: "asc" }, { createdAt: "desc" }, { id: "asc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export function paymentIndexWindow(input: PaymentIndexInput) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };
}

export function paymentIndexActiveFilters(
  input: PaymentIndexInput,
): ResourceIndexActiveFilter[] {
  const filters: ResourceIndexActiveFilter[] = [];
  if (input.query) filters.push({ key: "query", label: "Search", value: input.query, params: ["q"] });
  if (input.status) filters.push({ key: "status", label: "Status", value: input.status, params: ["status"] });
  if (input.environment) filters.push({ key: "environment", label: "Environment", value: input.environment, params: ["environment"] });
  if (input.provider) filters.push({ key: "provider", label: "Provider", value: input.provider, params: ["provider"] });
  if (input.currency) filters.push({ key: "currency", label: "Currency", value: input.currency, params: ["currency"] });
  const created = dateRangeFilter("created", "Created", ["createdFrom", "createdTo"], input.created);
  const updated = dateRangeFilter("updated", "Updated", ["updatedFrom", "updatedTo"], input.updated);
  if (created) filters.push(created);
  if (updated) filters.push(updated);
  return filters;
}
