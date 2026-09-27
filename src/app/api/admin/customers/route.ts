import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { listAdminCustomers } from "@/server/admin/operations-service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireAdminPermission(request, "customer.read"); return NextResponse.json({ customers: await listAdminCustomers() }); } catch (error) { return adminError(error); } }
