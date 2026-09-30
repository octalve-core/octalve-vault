import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { parseDownloadIndexParams } from "@/server/admin/downloads-index";
import { listAdminDownloads } from "@/server/admin/downloads-service";
import { requireAdminPermission } from "@/server/auth/admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminPermission(request, "download.read");
    const input = parseDownloadIndexParams(
      new URL(request.url).searchParams,
    );
    const result = await listAdminDownloads(input);
    return NextResponse.json({
      grants: result.items,
      meta: result.meta,
      activeFilters: result.activeFilters,
    });
  } catch (error) {
    return adminError(error);
  }
}
