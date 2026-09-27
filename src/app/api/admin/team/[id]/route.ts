import { NextResponse } from "next/server";
import { ADMIN_ROLES } from "@/domain/constants";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { writeAdminAudit } from "@/server/admin/audit";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminPermission(request, "admin.write"); const { id } = await context.params; const body = (await request.json()) as Record<string, unknown>;
    if (id === auth.user.id && body.active === false) throw new Error("You cannot disable your own active admin account.");
    const data: { role?: (typeof ADMIN_ROLES)[number]; active?: boolean; displayName?: string } = {};
    if (typeof body.role === "string") { if (!(ADMIN_ROLES as readonly string[]).includes(body.role)) throw new Error("Invalid role."); data.role = body.role as (typeof ADMIN_ROLES)[number]; }
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.displayName === "string") { const value = body.displayName.trim(); if (!value || value.length > 100) throw new Error("Invalid display name."); data.displayName = value; }
    const user = await prisma.adminUser.update({ where: { id }, data, select: { id: true, email: true, displayName: true, role: true, active: true } });
    if (data.active === false || data.role) await prisma.adminSession.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    await writeAdminAudit({ actorAdminId: auth.user.id, action: "ADMIN_USER_UPDATED", entityType: "AdminUser", entityId: id, metadata: data });
    return NextResponse.json({ user });
  } catch (error) { return adminError(error); }
}
