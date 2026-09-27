import { NextResponse } from "next/server";
import { ADMIN_ROLES } from "@/domain/constants";
import { normalizeEmail } from "@/domain/email";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/server/auth/password";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { writeAdminAudit } from "@/server/admin/audit";

export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireAdminPermission(request, "admin.read"); const users = await prisma.adminUser.findMany({ select: { id: true, email: true, displayName: true, role: true, active: true, lastLoginAt: true, createdAt: true }, orderBy: { createdAt: "asc" } }); return NextResponse.json({ users }); } catch (error) { return adminError(error); } }
export async function POST(request: Request) {
  try {
    const auth = await requireAdminPermission(request, "admin.write"); const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email !== "string" || typeof body.displayName !== "string" || typeof body.password !== "string" || typeof body.role !== "string") throw new Error("Email, name, password and role are required.");
    if (!(ADMIN_ROLES as readonly string[]).includes(body.role)) throw new Error("Invalid role.");
    const email = normalizeEmail(body.email); const displayName = body.displayName.trim(); if (!displayName || displayName.length > 100) throw new Error("Invalid display name.");
    const user = await prisma.adminUser.create({ data: { email, displayName, passwordHash: await hashPassword(body.password), role: body.role as (typeof ADMIN_ROLES)[number] }, select: { id: true, email: true, displayName: true, role: true, active: true } });
    await writeAdminAudit({ actorAdminId: auth.user.id, action: "ADMIN_USER_CREATED", entityType: "AdminUser", entityId: user.id, metadata: { role: user.role } });
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) { return adminError(error); }
}
