import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { listAdminOrders } from "@/server/admin/operations-service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireAdminPermission(request, "order.read"); return NextResponse.json({ orders: await listAdminOrders() }); } catch (error) { return adminError(error); } }
