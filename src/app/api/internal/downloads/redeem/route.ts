import { requiredEnv } from "@/config/env.server";
import { verifyInternalBearer } from "@/server/security/internal-auth";
import { redeemDownloadTicket } from "@/server/vault/download-ticket-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  const authorized = verifyInternalBearer(
    request.headers.get("authorization"),
    requiredEnv("INTERNAL_DOWNLOAD_SECRET"),
  );
  if (!authorized) return Response.json({ error: "Not found." }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  const token = typeof (body as { token?: unknown })?.token === "string" ? (body as { token: string }).token : "";
  if (!/^[A-Za-z0-9_-]{32,512}$/.test(token)) {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const redeemed = await redeemDownloadTicket({ rawToken: token });
  if (!redeemed) return Response.json({ error: "Not found." }, { status: 404 });
  return Response.json(redeemed, {
    status: 200,
    headers: { "cache-control": "private, no-store" },
  });
}
