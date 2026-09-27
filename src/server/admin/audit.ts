import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";

function toAuditMetadata(metadata: Record<string, unknown>): Prisma.InputJsonObject {
  // Round-trip through JSON so unsupported runtime values cannot reach Prisma's Json field.
  return JSON.parse(JSON.stringify(metadata)) as Prisma.InputJsonObject;
}

export async function writeAdminAudit(input: {
  actorAdminId: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  return prisma.adminAuditLog.create({
    data: {
      actorAdminId: input.actorAdminId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata === undefined ? undefined : toAuditMetadata(input.metadata),
    },
  });
}
