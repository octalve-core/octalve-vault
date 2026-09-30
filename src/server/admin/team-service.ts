import { prisma } from "../../lib/prisma";
import {
  buildTeamOrderBy,
  buildTeamWhere,
  teamIndexActiveFilters,
  teamIndexWindow,
  type TeamIndexInput,
} from "./team-index";
import {
  paginationMeta,
  type ResourceIndexResult,
} from "./resource-index";

export type AdminTeamRow = {
  id: string;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  lastLoginAt: Date | null;
};

export type AdminTeamSummary = {
  members: number;
  active: number;
  disabled: number;
  neverSignedIn: number;
};

export async function listAdminTeam(
  input: TeamIndexInput,
): Promise<ResourceIndexResult<AdminTeamRow>> {
  const where = buildTeamWhere(input);
  const { skip, take } = teamIndexWindow(input);

  const [total, items] = await Promise.all([
    prisma.adminUser.count({ where }),
    prisma.adminUser.findMany({
      where,
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        active: true,
        lastLoginAt: true,
      },
      orderBy: buildTeamOrderBy(input),
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
    activeFilters: teamIndexActiveFilters(input),
  };
}

export async function getAdminTeamSummary(): Promise<AdminTeamSummary> {
  const [
    members,
    active,
    disabled,
    neverSignedIn,
  ] = await Promise.all([
    prisma.adminUser.count(),
    prisma.adminUser.count({
      where: { active: true },
    }),
    prisma.adminUser.count({
      where: { active: false },
    }),
    prisma.adminUser.count({
      where: { lastLoginAt: null },
    }),
  ]);

  return {
    members,
    active,
    disabled,
    neverSignedIn,
  };
}
