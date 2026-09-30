import { prisma } from "../../lib/prisma";
import {
  auditIndexActiveFilters,
  auditIndexWindow,
  buildAuditOrderBy,
  buildAuditWhere,
  type AuditIndexInput,
} from "./audit-index";
import {
  paginationMeta,
  type ResourceIndexResult,
} from "./resource-index";

export type AdminAuditRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: Date;
  actor: {
    displayName: string;
    email: string;
  } | null;
};

export type AdminAuditActor = {
  id: string;
  displayName: string;
  email: string;
};

export type AdminAuditSummary = {
  events: number;
  humanActions: number;
  systemActions: number;
  activeActors: number;
};

export async function listAdminAuditLogs(
  input: AuditIndexInput,
): Promise<ResourceIndexResult<AdminAuditRow>> {
  const where = buildAuditWhere(input);
  const { skip, take } = auditIndexWindow(input);

  const [total, items] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      include: {
        actor: {
          select: {
            displayName: true,
            email: true,
          },
        },
      },
      orderBy: buildAuditOrderBy(input),
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
    activeFilters: auditIndexActiveFilters(input),
  };
}

export async function listAdminAuditActors(): Promise<AdminAuditActor[]> {
  return prisma.adminUser.findMany({
    where: {
      auditLogs: {
        some: {},
      },
    },
    select: {
      id: true,
      displayName: true,
      email: true,
    },
    orderBy: [
      { displayName: "asc" },
      { email: "asc" },
    ],
  });
}

export async function listAdminAuditEntityTypes(): Promise<string[]> {
  const groups = await prisma.adminAuditLog.groupBy({
    by: ["entityType"],
    orderBy: {
      entityType: "asc",
    },
  });

  return groups.map((group) => group.entityType);
}

export async function getAdminAuditSummary(): Promise<AdminAuditSummary> {
  const [
    events,
    humanActions,
    systemActions,
    actors,
  ] = await Promise.all([
    prisma.adminAuditLog.count(),
    prisma.adminAuditLog.count({
      where: {
        actorAdminId: {
          not: null,
        },
      },
    }),
    prisma.adminAuditLog.count({
      where: {
        actorAdminId: null,
      },
    }),
    prisma.adminAuditLog.groupBy({
      by: ["actorAdminId"],
      where: {
        actorAdminId: {
          not: null,
        },
      },
    }),
  ]);

  return {
    events,
    humanActions,
    systemActions,
    activeActors: actors.length,
  };
}
