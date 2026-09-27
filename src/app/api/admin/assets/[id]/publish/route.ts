import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { publishProductAsset } from "@/server/admin/products-service";

export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try { const auth = await requireAdminPermission(request, "product.publish"); const { id } = await context.params; return NextResponse.json({ asset: await publishProductAsset(auth.user.id, id) }); }
  catch (error) { return adminError(error); }
}
