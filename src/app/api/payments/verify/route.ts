import { after, NextResponse } from "next/server";

import { PAYMENT_PROVIDERS, type PaymentProviderId } from "@/domain/constants";
import { prisma } from "@/lib/prisma";
import { getPaymentProvider } from "@/server/payments/registry";
import { settleVerifiedPayment } from "@/server/vault/settlement-service";
import { processPendingNotifications } from "@/server/notifications/outbox-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isProvider(value: string): value is PaymentProviderId {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const providerText = url.searchParams.get("provider")?.toUpperCase() || "";
    const reference = url.searchParams.get("reference")?.trim() || "";
    if (!isProvider(providerText) || !reference) throw new Error("Provider and reference are required.");

    const attempt = await prisma.paymentAttempt.findUnique({ where: { providerReference: reference }, include: { order: true } });
    if (!attempt || attempt.provider !== providerText) return NextResponse.json({ error: "Payment attempt not found." }, { status: 404 });

    const verification = await getPaymentProvider(providerText).verify(reference);
    if (!verification.successful) {
      await prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: { status: ["failed", "abandoned", "cancelled"].includes(verification.status) ? "FAILED" : "PROCESSING", rawVerify: verification.raw as object },
      });
      return NextResponse.json({ verified: false, status: verification.status, reference });
    }

    const result = await settleVerifiedPayment({ paymentAttemptId: attempt.id, verification });
    after(() => processPendingNotifications(5));
    return NextResponse.json({ verified: true, status: "successful", reference, orderId: result.orderId, grantsCreated: result.grants.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Payment verification failed." }, { status: 400 });
  }
}
