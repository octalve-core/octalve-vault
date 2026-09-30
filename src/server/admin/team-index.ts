import type { Prisma } from "@prisma/client";

import {
  ADMIN_ROLES,
  type AdminRole,
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

export const TEAM_LOGIN_STATES = [
  "never",
  "signed-in",
] as const;
export const TEAM_INDEX_SORTS = [
  "name",
  "newest",
  "oldest",
  "recent-login",
  "role",
] as const;

export type TeamLoginState =
  (typeof TEAM_LOGIN_STATES)[number];
export type TeamIndexSort =
  (typeof TEAM_INDEX_SORTS)[number];

export type TeamIndexInput =
  ResourceIndexBase<TeamIndexSort> & {
    role?: AdminRole;
    active?: boolean;
    loginState?: TeamLoginState;
  };

export function parseTeamIndexParams(
  params: URLSearchParams,
): TeamIndexInput {
  return {
    query: normalizeSearchText(params.get("q")),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("pageSize")),
    sort: parseSort(
      params.get("sort"),
      TEAM_INDEX_SORTS,
      "name",
    ),
    role: optionalEnumParam(
      params.get("role"),
      ADMIN_ROLES,
      "Invalid admin role filter.",
    ),
    active: optionalBooleanParam(
      params.get("active"),
      "Invalid team active filter.",
    ),
    loginState: optionalEnumParam(
      params.get("loginState"),
      TEAM_LOGIN_STATES,
      "Invalid login state filter.",
    ),
  };
}

export function buildTeamWhere(
  input: TeamIndexInput,
): Prisma.AdminUserWhereInput {
  const clauses: Prisma.AdminUserWhereInput[] = [];

  if (input.query) {
    clauses.push({
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
    });
  }

  if (input.role) clauses.push({ role: input.role });
  if (input.active !== undefined) {
    clauses.push({ active: input.active });
  }

  if (input.loginState === "never") {
    clauses.push({ lastLoginAt: null });
  } else if (input.loginState === "signed-in") {
    clauses.push({
      lastLoginAt: {
        not: null,
      },
    });
  }

  return clauses.length ? { AND: clauses } : {};
}

export function buildTeamOrderBy(
  input: TeamIndexInput,
): Prisma.AdminUserOrderByWithRelationInput[] {
  switch (input.sort) {
    case "newest":
      return [{ createdAt: "desc" }, { id: "asc" }];
    case "oldest":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "recent-login":
      return [
        {
          lastLoginAt: {
            sort: "desc",
            nulls: "last",
          },
        },
        { displayName: "asc" },
        { id: "asc" },
      ];
    case "role":
      return [
        { role: "asc" },
        { displayName: "asc" },
        { id: "asc" },
      ];
    case "name":
    default:
      return [
        { displayName: "asc" },
        { email: "asc" },
        { id: "asc" },
      ];
  }
}

export function teamIndexWindow(input: TeamIndexInput) {
  return {
    skip: (input.page - 1) * input.pageSize,
    take: input.pageSize,
  };
}

export function teamIndexActiveFilters(
  input: TeamIndexInput,
): ResourceIndexActiveFilter[] {
  const filters: ResourceIndexActiveFilter[] = [];

  if (input.query) filters.push({ key: "query", label: "Search", value: input.query, params: ["q"] });
  if (input.role) filters.push({ key: "role", label: "Role", value: input.role, params: ["role"] });
  if (input.active !== undefined) filters.push({ key: "active", label: "Status", value: input.active ? "Active" : "Disabled", params: ["active"] });
  if (input.loginState) filters.push({ key: "loginState", label: "Login", value: input.loginState, params: ["loginState"] });

  return filters;
}
