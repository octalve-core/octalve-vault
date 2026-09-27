import { NextResponse } from "next/server";
import { authenticateAdminRequest } from "@/server/auth/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const auth = await authenticateAdminRequest(request);
  if (!auth) return NextResponse.json({ authenticated: false }, { status: 401, headers: { "cache-control": "no-store" } });
  return NextResponse.json({ authenticated: true, user: { id: auth.user.id, displayName: auth.user.displayName, email: auth.user.email, role: auth.user.role } }, { headers: { "cache-control": "no-store" } });
}
