import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { parseOrderIndexParams } from "@/server/admin/orders-index";
import { listAdminOrders } from "@/server/admin/orders-service";
import { requireAdminPermission } from "@/server/auth/admin-session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminPermission(request, "order.read");
    const input = parseOrderIndexParams(
      new URL(request.url).searchParams,
    );
    const result = await listAdminOrders(input);
    return NextResponse.json({
      orders: result.items,
      meta: result.meta,
      activeFilters: result.activeFilters,
    });
  } catch (error) {
    return adminError(error);
  }
}
