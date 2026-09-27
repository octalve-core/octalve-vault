import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { writeAdminAudit } from "@/server/admin/audit";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const auth = await requireAdminPermission(request, "download.revoke"); const { id } = await context.params; const grant = await prisma.downloadGrant.update({ where: { id }, data: { revokedAt: new Date() } }); await writeAdminAudit({ actorAdminId: auth.user.id, action: "DOWNLOAD_GRANT_REVOKED", entityType: "DownloadGrant", entityId: id }); return NextResponse.json({ grant }); }
  catch (error) { return adminError(error); }
}
