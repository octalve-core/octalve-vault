import type { Prisma } from "@prisma/client";

import {
  PAYMENT_ENVIRONMENTS,
  type PaymentEnvironment,
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

export const DOWNLOAD_GRANT_STATES = [
  "active",
  "used",
  "unused",
  "revoked",
  "expired",
] as const;

export const DOWNLOAD_INDEX_SORTS = [
  "newest",
  "oldest",
  "most-downloaded",
  "expiry-soonest",
  "email",
] as const;

export type DownloadGrantState =
  (typeof DOWNLOAD_GRANT_STATES)[number];
export type DownloadIndexSort =
  (typeof DOWNLOAD_INDEX_SORTS)[number];

export type DownloadIndexInput =
  ResourceIndexBase<DownloadIndexSort> & {
    state?: DownloadGrantState;
    environment?: PaymentEnvironment;
    product?: string;
    created: ParsedDateRange;
    expiry: ParsedDateRange;
  };

export function parseDownloadIndexParams(
  params: URLSearchParams,
): DownloadIndexInput {
  return {
    query: normalizeSearchText(params.get("q")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("pageSize")),
    sort: parseSort(
      params.get("sort"),
      DOWNLOAD_INDEX_SORTS,
      "newest",
    ),
    state: optionalEnumParam(
      params.get("state"),
      DOWNLOAD_GRANT_STATES,
      "Invalid download state filter.",
    ),
    environment: optionalEnumParam(
      params.get("environment"),
      PAYMENT_ENVIRONMENTS,
      "Invalid payment environment filter.",
    ),
    product:
      normalizeSearchText(params.get("product")) || undefined,
    created: parseDateRange(
      params.get("createdFrom"),
      params.get("createdTo"),
    ),
    expiry: parseDateRange(
      params.get("expiryFrom"),
      params.get("expiryTo"),
    ),
  };
}

function activeGrantWhere(
  now: Date,
): Prisma.DownloadGrantWhereInput {
  return {
    revokedAt: null,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: now } },
    ],
  };
}

export function buildDownloadWhere(
  input: DownloadIndexInput,
  now: Date,
): Prisma.DownloadGrantWhereInput {
  const clauses: Prisma.DownloadGrantWhereInput[] = [];

  if (input.query) {
    clauses.push({
      OR: [
        {
          email: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        {
          orderItem: {
            order: {
              reference: {
                contains: input.query,
                mode: "insensitive",
              },
            },
          },
        },
        {
          orderItem: {
            productTitle: {
              contains: input.query,
              mode: "insensitive",
            },
          },
        },
        {
          orderItem: {
            productSlug: {
              contains: input.query,
              mode: "insensitive",
            },
          },
        },
        {
          productAsset: {
            downloadFilename: {
              contains: input.query,
              mode: "insensitive",
            },
          },
        },
      ],
    });
  }

  if (input.environment) {
    clauses.push({
      orderItem: {
        order: {
          payments: {
            some: {
              environment: input.environment,
            },
          },
        },
      },
    });
  }

  if (input.product) {
    clauses.push({
      orderItem: {
        OR: [
          {
            productId: input.product,
          },
          {
            productSlug: {
              contains: input.product,
              mode: "insensitive",
            },
          },
          {
            productTitle: {
              contains: input.product,
              mode: "insensitive",
            },
          },
        ],
      },
    });
  }

  if (input.state === "active") {
    clauses.push(activeGrantWhere(now));
  } else if (input.state === "used") {
    clauses.push({
      AND: [
        activeGrantWhere(now),
        { downloadCount: { gt: 0 } },
      ],
    });
  } else if (input.state === "unused") {
    clauses.push({
      AND: [
        activeGrantWhere(now),
        { downloadCount: 0 },
      ],
    });
  } else if (input.state === "revoked") {
    clauses.push({
      revokedAt: {
        not: null,
      },
    });
  } else if (input.state === "expired") {
    clauses.push({
      revokedAt: null,
      expiresAt: {
        lte: now,
      },
    });
  }

  const createdAt = rangeWhere(input.created);
  if (createdAt) clauses.push({ createdAt });

  if (input.expiry.from || input.expiry.toExclusive) {
    clauses.push({
      expiresAt: {
        ...(input.expiry.from
          ? { gte: input.expiry.from }
          : {}),
        ...(input.expiry.toExclusive
          ? { lt: input.expiry.toExclusive }
          : {}),
      },
    });
  }

  return clauses.length ? { AND: clauses } : {};
}

export function buildDownloadOrderBy(
  input: DownloadIndexInput,
): Prisma.DownloadGrantOrderByWithRelationInput[] {
  switch (input.sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "most-downloaded":
      return [
        { downloadCount: "desc" },
        { createdAt: "desc" },
        { id: "asc" },
      ];
    case "expiry-soonest":
      return [
        { expiresAt: { sort: "asc", nulls: "last" } },
        { id: "asc" },
      ];
    case "email":
      return [{ email: "asc" }, { id: "asc" }];
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export function downloadIndexWindow(input: DownloadIndexInput) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };
}

export function downloadIndexActiveFilters(
  input: DownloadIndexInput,
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

  if (input.state) {
    filters.push({
      key: "state",
      label: "State",
      value: input.state,
      params: ["state"],
    });
  }

  if (input.environment) {
    filters.push({
      key: "environment",
      label: "Environment",
      value: input.environment,
      params: ["environment"],
    });
  }

  if (input.product) {
    filters.push({
      key: "product",
      label: "Product",
      value: input.product,
      params: ["product"],
    });
  }

  const created = dateRangeFilter(
    "created",
    "Created",
    ["createdFrom", "createdTo"],
    input.created,
  );
  const expiry = dateRangeFilter(
    "expiry",
    "Expiry",
    ["expiryFrom", "expiryTo"],
    input.expiry,
  );
  if (created) filters.push(created);
  if (expiry) filters.push(expiry);

  return filters;
}
