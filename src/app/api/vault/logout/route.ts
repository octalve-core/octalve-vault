import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE, secureSessionCookie } from "@/server/auth/cookies";
import { revokeCustomerSession } from "@/server/auth/customer-session";
import { assertSameOriginMutation } from "@/server/security/same-origin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  assertSameOriginMutation(request);
  await revokeCustomerSession(request);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(CUSTOMER_SESSION_COOKIE, "", { ...secureSessionCookie(0), maxAge: 0 });
  return response;
}
