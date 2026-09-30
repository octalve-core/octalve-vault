import type { Prisma } from "@prisma/client";

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

export const AUDIT_ORIGINS = [
  "human",
  "system",
] as const;
export const AUDIT_INDEX_SORTS = [
  "newest",
  "oldest",
  "action",
  "entity",
] as const;

export type AuditOrigin =
  (typeof AUDIT_ORIGINS)[number];
export type AuditIndexSort =
  (typeof AUDIT_INDEX_SORTS)[number];

export type AuditIndexInput =
  ResourceIndexBase<AuditIndexSort> & {
    entityType?: string;
    actorAdminId?: string;
    origin?: AuditOrigin;
    created: ParsedDateRange;
  };

export function parseAuditIndexParams(
  params: URLSearchParams,
): AuditIndexInput {
  return {
    query: normalizeSearchText(params.get("q")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("pageSize")),
    sort: parseSort(
      params.get("sort"),
      AUDIT_INDEX_SORTS,
      "newest",
    ),
    entityType:
      normalizeSearchText(params.get("entityType")) ||
      undefined,
    actorAdminId:
      normalizeSearchText(params.get("actor")) ||
      undefined,
    origin: optionalEnumParam(
      params.get("origin"),
      AUDIT_ORIGINS,
      "Invalid audit origin filter.",
    ),
    created: parseDateRange(
      params.get("createdFrom"),
      params.get("createdTo"),
    ),
  };
}

export function buildAuditWhere(
  input: AuditIndexInput,
): Prisma.AdminAuditLogWhereInput {
  const clauses: Prisma.AdminAuditLogWhereInput[] = [];

  if (input.query) {
    clauses.push({
      OR: [
        {
          action: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        {
          entityType: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        {
          entityId: {
            contains: input.query,
            mode: "insensitive",
          },
        },
        {
          actor: {
            OR: [
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
          },
        },
      ],
    });
  }

  if (input.entityType) {
    clauses.push({
      entityType: {
        equals: input.entityType,
        mode: "insensitive",
      },
    });
  }

  if (input.actorAdminId) {
    clauses.push({
      actorAdminId: input.actorAdminId,
    });
  }

  if (input.origin === "human") {
    clauses.push({
      actorAdminId: {
        not: null,
      },
    });
  } else if (input.origin === "system") {
    clauses.push({
      actorAdminId: null,
    });
  }

  const createdAt = rangeWhere(input.created);
  if (createdAt) clauses.push({ createdAt });

  return clauses.length ? { AND: clauses } : {};
}

export function buildAuditOrderBy(
  input: AuditIndexInput,
): Prisma.AdminAuditLogOrderByWithRelationInput[] {
  switch (input.sort) {
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "action":
      return [
        { action: "asc" },
        { createdAt: "desc" },
        { id: "asc" },
      ];
    case "entity":
      return [
        { entityType: "asc" },
        { createdAt: "desc" },
        { id: "asc" },
      ];
    case "newest":
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
}

export function auditIndexWindow(input: AuditIndexInput) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };
}

export function auditIndexActiveFilters(
  input: AuditIndexInput,
): ResourceIndexActiveFilter[] {
  const filters: ResourceIndexActiveFilter[] = [];

  if (input.query) filters.push({ key: "query", label: "Search", value: input.query, params: ["q"] });
  if (input.entityType) filters.push({ key: "entityType", label: "Entity", value: input.entityType, params: ["entityType"] });
  if (input.actorAdminId) filters.push({ key: "actor", label: "Actor", value: input.actorAdminId, params: ["actor"] });
  if (input.origin) filters.push({ key: "origin", label: "Origin", value: input.origin, params: ["origin"] });

  const created = dateRangeFilter(
    "created",
    "Created",
    ["createdFrom", "createdTo"],
    input.created,
  );
  if (created) filters.push(created);

  return filters;
}
