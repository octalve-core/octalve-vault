import type { Prisma } from "@prisma/client";

import {
  CURRENCIES,
  PRODUCT_STATUSES,
  type CurrencyCode,
  type ProductStatus,
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
  type ResourceIndexResult,
} from "./resource-index.ts";

export const PRODUCT_INDEX_SORTS = [
  "newest",
  "oldest",
  "recently-updated",
  "title",
  "status",
] as const;

export type ProductIndexSort = (typeof PRODUCT_INDEX_SORTS)[number];
export type ProductReadinessFilter = "ready" | "not-ready";
export type ProductAssetFilter = "published" | "missing";

export type ProductIndexInput = ResourceIndexBase<ProductIndexSort> & {
  status?: ProductStatus;
  category?: string;
  featured?: boolean;
  readiness?: ProductReadinessFilter;
  asset?: ProductAssetFilter;
  currency?: CurrencyCode;
  created: ParsedDateRange;
  updated: ParsedDateRange;
};

export type ProductIndexActiveFilter = ResourceIndexActiveFilter;
export type ProductIndexResult<T> = ResourceIndexResult<T>;

function invalid(message: string): never {
  throw new Error(message);
}

function optionalEnum<T extends string>(
  value: string | null,
  allowed: readonly T[],
  message: string,
): T | undefined {
  if (!value) return undefined;
  if (!(allowed as readonly string[]).includes(value)) invalid(message);
  return value as T;
}

function optionalBoolean(value: string | null): boolean | undefined {
  if (!value) return undefined;
  if (value === "true") return true;
  if (value === "false") return false;
  return invalid("Invalid featured filter.");
}

export function parseProductIndexParams(
  params: URLSearchParams,
): ProductIndexInput {
  return {
    query: normalizeSearchText(params.get("q")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("pageSize")),
    sort: parseSort(
      params.get("sort"),
      PRODUCT_INDEX_SORTS,
      "recently-updated",
    ),
    status: optionalEnum(
      params.get("status"),
      PRODUCT_STATUSES,
      "Invalid product status filter.",
    ),
    category: normalizeSearchText(params.get("category")) || undefined,
    featured: optionalBoolean(params.get("featured")),
    readiness: optionalEnum(
      params.get("readiness"),
      ["ready", "not-ready"] as const,
      "Invalid product readiness filter.",
    ),
    asset: optionalEnum(
      params.get("asset"),
      ["published", "missing"] as const,
      "Invalid product asset filter.",
    ),
    currency: optionalEnum(
      params.get("currency"),
      CURRENCIES,
      "Invalid currency filter.",
    ),
    created: parseDateRange(
      params.get("createdFrom"),
      params.get("createdTo"),
    ),
    updated: parseDateRange(
      params.get("updatedFrom"),
      params.get("updatedTo"),
    ),
  };
}

function rangeFilter(
  range: ParsedDateRange,
): { gte?: Date; lt?: Date } | undefined {
  if (!range.from && !range.toExclusive) return undefined;

  return {
    ...(range.from ? { gte: range.from } : {}),
    ...(range.toExclusive ? { lt: range.toExclusive } : {}),
  };
}

export function buildProductReadyWhere(
  currency?: CurrencyCode,
): Prisma.ProductWhereInput {
  return {
    status: "ACTIVE",
    assets: { some: { status: "PUBLISHED" } },
    prices: currency
      ? { some: { currency, isActive: true } }
      : { some: { isActive: true } },
  };
}

export function buildProductWhere(
  input: ProductIndexInput,
): Prisma.ProductWhereInput {
  const clauses: Prisma.ProductWhereInput[] = [];

  if (input.query) {
    clauses.push({
      OR: [
        { slug: { contains: input.query, mode: "insensitive" } },
        { category: { contains: input.query, mode: "insensitive" } },
        {
          translations: {
            some: {
              title: {
                contains: input.query,
                mode: "insensitive",
              },
            },
          },
        },
      ],
    });
  }

  if (input.status) clauses.push({ status: input.status });

  if (input.category) {
    clauses.push({
      category: { equals: input.category, mode: "insensitive" },
    });
  }

  if (input.featured !== undefined) {
    clauses.push({ featured: input.featured });
  }

  const ready = buildProductReadyWhere(input.currency);
  if (input.readiness === "ready") clauses.push(ready);
  if (input.readiness === "not-ready") clauses.push({ NOT: ready });

  if (input.asset === "published") {
    clauses.push({
      assets: { some: { status: "PUBLISHED" } },
    });
  } else if (input.asset === "missing") {
    clauses.push({
      assets: { none: { status: "PUBLISHED" } },
    });
  }

  if (input.currency) {
    clauses.push({
      prices: {
        some: {
          currency: input.currency,
          isActive: true,
        },
      },
    });
  }

  const createdAt = rangeFilter(input.created);
  const updatedAt = rangeFilter(input.updated);

  if (createdAt) clauses.push({ createdAt });
  if (updatedAt) clauses.push({ updatedAt });

  return clauses.length > 0 ? { AND: clauses } : {};
}

export function buildProductOrderBy(
  input: ProductIndexInput,
): Prisma.ProductOrderByWithRelationInput[] {
  switch (input.sort) {
    case "newest":
      return [{ createdAt: "desc" }, { id: "asc" }];
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "status":
      return [{ status: "asc" }, { id: "asc" }];
    case "recently-updated":
    default:
      return [{ updatedAt: "desc" }, { id: "asc" }];
  }
}

export function productIndexWindow(
  input: ProductIndexInput,
): {
  skip: number;
  take: number;
} {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };
}

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function productIndexActiveFilters(
  input: ProductIndexInput,
): ProductIndexActiveFilter[] {
  const filters: ProductIndexActiveFilter[] = [];

  if (input.query) {
    filters.push({
      key: "query",
      label: "Search",
      value: input.query,
      params: ["q"],
    });
  }

  if (input.status) {
    filters.push({
      key: "status",
      label: "Status",
      value: input.status,
      params: ["status"],
    });
  }

  if (input.category) {
    filters.push({
      key: "category",
      label: "Category",
      value: input.category,
      params: ["category"],
    });
  }

  if (input.featured !== undefined) {
    filters.push({
      key: "featured",
      label: "Featured",
      value: input.featured ? "Yes" : "No",
      params: ["featured"],
    });
  }

  if (input.readiness) {
    filters.push({
      key: "readiness",
      label: "Readiness",
      value: input.readiness,
      params: ["readiness"],
    });
  }

  if (input.asset) {
    filters.push({
      key: "asset",
      label: "Asset",
      value: input.asset,
      params: ["asset"],
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

  if (input.created.from || input.created.toExclusive) {
    filters.push({
      key: "created",
      label: "Created",
      value: `${
        input.created.from ? dateOnly(input.created.from) : "…"
      } – ${
        input.created.toExclusive
          ? dateOnly(
              new Date(
                input.created.toExclusive.getTime() - 86400000,
              ),
            )
          : "…"
      }`,
      params: ["createdFrom", "createdTo"],
    });
  }

  if (input.updated.from || input.updated.toExclusive) {
    filters.push({
      key: "updated",
      label: "Updated",
      value: `${
        input.updated.from ? dateOnly(input.updated.from) : "…"
      } – ${
        input.updated.toExclusive
          ? dateOnly(
              new Date(
                input.updated.toExclusive.getTime() - 86400000,
              ),
            )
          : "…"
      }`,
      params: ["updatedFrom", "updatedTo"],
    });
  }

  return filters;
}
