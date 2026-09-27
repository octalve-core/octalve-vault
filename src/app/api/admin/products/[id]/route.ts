import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { getAdminProduct, updateAdminProduct } from "@/server/admin/products-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try { await requireAdminPermission(request, "product.read"); const { id } = await context.params; const product = await getAdminProduct(id); return product ? NextResponse.json({ product }) : NextResponse.json({ error: "Product not found." }, { status: 404 }); }
  catch (error) { return adminError(error); }
}
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminPermission(request, "product.write"); const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    const product = await updateAdminProduct(auth.user.id, id, {
      slug: typeof body.slug === "string" ? body.slug : undefined,
      category: typeof body.category === "string" ? body.category : undefined,
      status: typeof body.status === "string" ? body.status : undefined,
      featured: typeof body.featured === "boolean" ? body.featured : undefined,
    });
    return NextResponse.json({ product });
  } catch (error) { return adminError(error); }
}
