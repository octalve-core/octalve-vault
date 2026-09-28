import type { PaymentProviderId } from "../../domain/constants";
import { prisma } from "../../lib/prisma";
import { getPaymentProvider } from "./registry";
import { settleVerifiedPayment } from "../vault/settlement-service";
import { requestFingerprint } from "../security/request-fingerprint";

export async function processPaymentWebhook(providerId: PaymentProviderId, request: Request) {
  const adapter = getPaymentProvider(providerId);
  const rawBody = await request.text();
  if (!adapter.verifyWebhookSignature(rawBody, request)) {
    const fingerprint = requestFingerprint(request);
    await prisma.securityEvent.create({
      data: {
        type: "INVALID_PAYMENT_WEBHOOK_SIGNATURE",
        severity: "HIGH",
        ipHash: fingerprint.ipHash,
        userAgentHash: fingerprint.userAgentHash,
        metadata: { provider: providerId },
      },
    });
    return { status: 401, body: { error: "Invalid webhook signature." } };
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { status: 400, body: { error: "Invalid JSON payload." } };
  }

  const environment = adapter.configuredEnvironment();
  const eventId = adapter.extractWebhookEventId(payload);
  if (eventId) {
    const duplicate = await prisma.webhookEvent.findUnique({
      where: {
        provider_environment_providerEventId: {
          provider: providerId,
          environment,
          providerEventId: eventId,
        },
      },
    });
    if (duplicate?.processedAt) return { status: 200, body: { received: true, duplicate: true } };
  }

  const reference = adapter.extractWebhookReference(payload);
  const attempt = reference
    ? await prisma.paymentAttempt.findUnique({ where: { providerReference: reference } })
    : null;

  const event = await prisma.webhookEvent.create({
    data: {
      orderId: attempt?.orderId ?? null,
      provider: providerId,
      environment,
      providerEventId: eventId,
      eventType: adapter.extractWebhookEventType(payload),
      signatureValid: true,
      payload: payload as object,
    },
  });

  if (!reference || !attempt || attempt.provider !== providerId) {
    await prisma.webhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return { status: 200, body: { received: true, matched: false } };
  }

  const verification = await adapter.verify(reference);
  if (verification.successful) {
    await settleVerifiedPayment({ paymentAttemptId: attempt.id, verification });
  } else {
    await prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: { status: ["failed", "abandoned", "cancelled"].includes(verification.status) ? "FAILED" : "PROCESSING", rawVerify: verification.raw as object },
    });
  }
  await prisma.webhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
  return { status: 200, body: { received: true, verified: verification.successful } };
}
