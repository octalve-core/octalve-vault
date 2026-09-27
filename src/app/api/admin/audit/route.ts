import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireAdminPermission(request, "audit.read"); const logs = await prisma.adminAuditLog.findMany({ include: { actor: { select: { displayName: true, email: true } } }, orderBy: { createdAt: "desc" }, take: 300 }); return NextResponse.json({ logs }); } catch (error) { return adminError(error); } }
