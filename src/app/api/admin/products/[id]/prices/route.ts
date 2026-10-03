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
    if (body.saleAmountMinor !== null && typeof body.saleAmountMinor !== "number") throw new Error("saleAmountMinor must be a number or null.");
    const saleAmountMinor = body.saleAmountMinor as number | null;
    const price = await upsertProductPrice(auth.user.id, id, { currency: body.currency, amountMinor: body.amountMinor, saleAmountMinor, isActive: body.isActive });
    return NextResponse.json({ price });
  } catch (error) { return adminError(error); }
}
