import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { parseCustomerIndexParams } from "@/server/admin/customers-index";
import { listAdminCustomers } from "@/server/admin/customers-service";
import { requireAdminPermission } from "@/server/auth/admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminPermission(request, "customer.read");
    const input = parseCustomerIndexParams(
      new URL(request.url).searchParams,
    );
    const result = await listAdminCustomers(input);
    return NextResponse.json({
      customers: result.items,
      meta: result.meta,
      activeFilters: result.activeFilters,
    });
  } catch (error) {
    return adminError(error);
  }
}
