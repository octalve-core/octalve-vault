import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { mapProductAdminError } from "@/server/admin/admin-errors";
import { createAdminProduct, listAdminProducts } from "@/server/admin/products-service";
import { parseProductIndexParams } from "@/server/admin/products-index";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminPermission(request, "product.read");
    const input = parseProductIndexParams(new URL(request.url).searchParams);
    const result = await listAdminProducts(input);
    return NextResponse.json({
      products: result.items,
      meta: result.meta,
      activeFilters: result.activeFilters,
    });
  } catch (error) {
    return adminError(error);
  }
}
export async function POST(request: Request) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.slug !== "string" || typeof body.title !== "string" || typeof body.category !== "string") throw new Error("Slug, title and category are required.");
    if (!(body.primaryMediaAssetId === undefined || body.primaryMediaAssetId === null || typeof body.primaryMediaAssetId === "string")) throw new Error("Primary media asset ID must be a string.");

    try {
      const product = await createAdminProduct(auth.user.id, {
        slug: body.slug,
        title: body.title,
        category: body.category,
        primaryMediaAssetId: typeof body.primaryMediaAssetId === "string" ? body.primaryMediaAssetId : undefined,
      });
      return NextResponse.json({ product }, { status: 201 });
    } catch (error) {
      const mappedProductError = mapProductAdminError(error);
      return NextResponse.json(mappedProductError.body, { status: mappedProductError.status });
    }
  } catch (error) {
    return adminError(error);
  }
}
