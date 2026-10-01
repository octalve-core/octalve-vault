import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { retireMediaAsset } from "@/server/media/media-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    const { id } = await params;
    const asset = await retireMediaAsset(auth.user.id, id);
    return NextResponse.json({ asset });
  } catch (error) {
    return adminError(error, "Unable to retire image.");
  }
}
