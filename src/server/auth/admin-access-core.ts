import type { AdminRole } from "../../domain/constants.ts";
import { hasPermission, type Permission } from "../../domain/permissions.ts";

export function adminSessionActive(
  session: { userId: string; expiresAt: Date; revokedAt: Date | null },
  user: { id: string; active: boolean },
  now = new Date(),
): boolean {
  return user.active && session.userId === user.id && !session.revokedAt && session.expiresAt.getTime() > now.getTime();
}

export function assertAdminPermission(role: AdminRole, permission: Permission): void {
  if (!hasPermission(role, permission)) throw new Error(`Admin permission required: ${permission}`);
}
