import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { setPrimaryProductMedia } from "@/server/media/media-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; productMediaId: string }> },
) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    const { id, productMediaId } = await params;
    await setPrimaryProductMedia(auth.user.id, id, productMediaId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error, "Unable to set primary image.");
  }
}
