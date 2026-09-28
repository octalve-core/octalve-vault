import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { publishProductAsset } from "@/server/admin/products-service";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminPermission(request, "product.publish");
    const { id } = await context.params;

    const asset = await publishProductAsset(auth.user.id, id);

    return NextResponse.json({
      asset: {
        ...asset,
        sizeBytes: asset.sizeBytes.toString(),
      },
    });
  } catch (error) {
    return adminError(error);
  }
}
