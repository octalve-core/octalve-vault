import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { getAdminMediaSummary, listAdminMedia, parseMediaIndexParams } from "@/server/admin/media-index";
import { requireAdminPermission } from "@/server/auth/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminPermission(request, "product.write");
    const input = parseMediaIndexParams(new URL(request.url).searchParams);
    const [result, summary] = await Promise.all([
      listAdminMedia(input),
      getAdminMediaSummary(),
    ]);
    return NextResponse.json({ ...result, summary });
  } catch (error) {
    return adminError(error, "Unable to load media.");
  }
}
