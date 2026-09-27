import { NextResponse } from "next/server";
import { requiredEnv } from "@/config/env.server";
import { processPendingNotifications } from "@/server/notifications/outbox-service";
import { verifyInternalBearer } from "@/server/security/internal-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: Request) {
  if (!verifyInternalBearer(request.headers.get("authorization"), requiredEnv("INTERNAL_CRON_SECRET"))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try { const results = await processPendingNotifications(20); return NextResponse.json({ processed: results.length, results }); }
  catch { return NextResponse.json({ error: "Notification processing failed." }, { status: 500 }); }
}
export const GET = handle;
export const POST = handle;
