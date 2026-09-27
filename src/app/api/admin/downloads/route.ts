import { NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { listAdminDownloads } from "@/server/admin/operations-service";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { try { await requireAdminPermission(request, "download.read"); return NextResponse.json({ grants: await listAdminDownloads() }); } catch (error) { return adminError(error); } }
