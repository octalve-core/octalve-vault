import { after, NextResponse } from "next/server";
import { processPaymentWebhook } from "@/server/payments/webhook-service";
import { processPendingNotifications } from "@/server/notifications/outbox-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const result = await processPaymentWebhook("FLUTTERWAVE", request);
    after(() => processPendingNotifications(5));
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error("Flutterwave webhook processing failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ received: false }, { status: 500 });
  }
}
