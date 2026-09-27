import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { upsertProductPrice } from "@/server/admin/products-service";

export const runtime = "nodejs";
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminPermission(request, "product.price.write"); const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.currency !== "string" || typeof body.amountMinor !== "number" || typeof body.isActive !== "boolean") throw new Error("Currency, amountMinor and isActive are required.");
    const price = await upsertProductPrice(auth.user.id, id, { currency: body.currency, amountMinor: body.amountMinor, isActive: body.isActive });
    return NextResponse.json({ price });
  } catch (error) { return adminError(error); }
}
