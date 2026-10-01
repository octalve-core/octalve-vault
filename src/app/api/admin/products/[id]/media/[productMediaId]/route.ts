import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { detachProductMedia, updateProductMediaAlt } from "@/server/media/media-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; productMediaId: string }> },
) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    const { id, productMediaId } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (!(typeof body.altText === "string" || body.altText === null)) {
      throw new Error("Alt text must be text or null.");
    }
    await updateProductMediaAlt(
      auth.user.id,
      id,
      productMediaId,
      body.altText as string | null,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error, "Unable to update image alt text.");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; productMediaId: string }> },
) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    const { id, productMediaId } = await params;
    await detachProductMedia(auth.user.id, id, productMediaId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error, "Unable to remove product image.");
  }
}
