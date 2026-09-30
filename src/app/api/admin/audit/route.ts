import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { parseAuditIndexParams } from "@/server/admin/audit-index";
import { listAdminAuditLogs } from "@/server/admin/audit-query-service";
import { requireAdminPermission } from "@/server/auth/admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminPermission(request, "audit.read");
    const input = parseAuditIndexParams(
      new URL(request.url).searchParams,
    );
    const result = await listAdminAuditLogs(input);
    return NextResponse.json({
      logs: result.items,
      meta: result.meta,
      activeFilters: result.activeFilters,
    });
  } catch (error) {
    return adminError(error);
  }
}
