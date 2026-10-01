import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { reorderProductMedia } from "@/server/media/media-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;
    if (!Array.isArray(body.orderedIds) || body.orderedIds.some((item) => typeof item !== "string")) {
      throw new Error("A complete media order is required.");
    }
    await reorderProductMedia(auth.user.id, id, body.orderedIds as string[]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return adminError(error, "Unable to reorder product images.");
  }
}
