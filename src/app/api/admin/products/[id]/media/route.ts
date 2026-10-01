import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { attachProductMedia, getAdminProductMedia } from "@/server/media/media-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminPermission(request, "product.read");
    const { id } = await params;
    return NextResponse.json({ media: await getAdminProductMedia(id) });
  } catch (error) {
    return adminError(error, "Unable to load product media.");
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.mediaAssetId !== "string") throw new Error("Media asset ID is required.");
    await attachProductMedia(auth.user.id, id, body.mediaAssetId);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return adminError(error, "Unable to add image to product.");
  }
}
