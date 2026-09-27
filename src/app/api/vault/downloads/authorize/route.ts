import { NextResponse } from "next/server";
import { authenticateCustomerRequest } from "@/server/auth/customer-session";
import { issueDownloadTicket } from "@/server/vault/download-ticket-service";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { assertSameOriginMutation } from "@/server/security/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  assertSameOriginMutation(request);
  const session = await authenticateCustomerRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.grantId !== "string" || !body.grantId.trim()) throw new Error("Grant is required.");
    await enforceRateLimit({ action: "vault.download.authorize", identifier: `${session.id}:${body.grantId}`, limit: 20, windowSeconds: 300 });
    const ticket = await issueDownloadTicket({ grantId: body.grantId, customerSessionId: session.id });
    return NextResponse.json({ url: ticket.url, expiresAt: ticket.expiresAt }, { headers: { "cache-control": "no-store", "referrer-policy": "no-referrer" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Download authorization failed." }, { status: 400 });
  }
}
