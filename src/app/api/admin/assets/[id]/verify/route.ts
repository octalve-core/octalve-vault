import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { verifyUploadedAsset } from "@/server/storage/asset-upload-service";
import { writeAdminAudit } from "@/server/admin/audit";

export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const auth = await requireAdminPermission(request, "product.write"); const { id } = await context.params; const asset = await verifyUploadedAsset({ assetId: id }); await writeAdminAudit({ actorAdminId: auth.user.id, action: "PRODUCT_ASSET_VERIFIED", entityType: "ProductAsset", entityId: id }); return NextResponse.json({ asset }); }
  catch (error) { return adminError(error); }
}
