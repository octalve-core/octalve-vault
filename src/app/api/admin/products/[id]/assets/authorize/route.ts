import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { createAssetUploadAuthorization } from "@/server/storage/asset-upload-service";

export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminPermission(request, "product.write"); const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.originalFilename !== "string" || typeof body.sizeBytes !== "number") throw new Error("File name and size are required.");
    const upload = await createAssetUploadAuthorization({ productId: id, originalFilename: body.originalFilename, sizeBytes: body.sizeBytes, createdByAdminId: auth.user.id });
    return NextResponse.json(upload, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) { return adminError(error); }
}
