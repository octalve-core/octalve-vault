import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, secureSessionCookie } from "@/server/auth/cookies";
import { revokeAdminSession } from "@/server/auth/admin-session";
import { assertSameOriginMutation } from "@/server/security/same-origin";

export const runtime = "nodejs";
export async function POST(request: Request) {
  assertSameOriginMutation(request);
  await revokeAdminSession(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...secureSessionCookie(0), maxAge: 0 });
  return response;
}
