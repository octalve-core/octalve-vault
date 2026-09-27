import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { createAdminProduct, listAdminProducts } from "@/server/admin/products-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try { await requireAdminPermission(request, "product.read"); return NextResponse.json({ products: await listAdminProducts() }); }
  catch (error) { return adminError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.slug !== "string" || typeof body.title !== "string" || typeof body.category !== "string") throw new Error("Slug, title and category are required.");
    const product = await createAdminProduct(auth.user.id, { slug: body.slug, title: body.title, category: body.category });
    return NextResponse.json({ product }, { status: 201 });
  } catch (error) { return adminError(error); }
}
