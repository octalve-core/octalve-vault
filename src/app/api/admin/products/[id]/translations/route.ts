import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { upsertProductTranslation } from "@/server/admin/products-service";

export const runtime = "nodejs";
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminPermission(request, "product.write"); const { id } = await context.params;
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.locale !== "string" || typeof body.title !== "string" || typeof body.shortDescription !== "string") throw new Error("Locale, title and short description are required.");
    const translation = await upsertProductTranslation(auth.user.id, id, { locale: body.locale, title: body.title, shortDescription: body.shortDescription, description: typeof body.description === "string" ? body.description : null });
    return NextResponse.json({ translation });
  } catch (error) { return adminError(error); }
}
