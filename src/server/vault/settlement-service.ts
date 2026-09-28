import type { PaymentProviderId } from "../../domain/constants";
import type { PaymentVerification } from "../payments/types";
import { assertSettlementEnvironmentAgreement } from "../payments/environment";
import { getPaymentProvider } from "../payments/registry";
import { assertVerificationMatchesAttempt } from "../payments/verification";
import { settlementDisposition } from "./settlement-core";
import { prisma } from "../../lib/prisma";

export async function settleVerifiedPayment(input: {
  paymentAttemptId: string;
  verification: PaymentVerification;
}) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.paymentAttempt.findUnique({
      where: { id: input.paymentAttemptId },
      include: {
        order: {
          include: {
            items: { include: { downloadGrant: true } },
            couponRedemption: true,
          },
        },
      },
    });
    if (!attempt) throw new Error("Payment attempt not found.");

    const providerId = attempt.provider as PaymentProviderId;
    const adapter = getPaymentProvider(providerId);
    const configuredEnvironment = adapter.configuredEnvironment();

    assertSettlementEnvironmentAgreement(
      attempt.environment,
      configuredEnvironment,
      input.verification.environment,
    );

    assertVerificationMatchesAttempt(
      {
        reference: attempt.providerReference,
        amountMinor: attempt.amount,
        currency: attempt.currency as "NGN" | "USD" | "GBP" | "EUR",
        email: attempt.order.email,
      },
      input.verification,
    );

    if (settlementDisposition(attempt.status, attempt.order.status) === "ALREADY_SETTLED") {
      return {
        orderId: attempt.orderId,
        alreadySettled: true,
        grants: attempt.order.items.flatMap((item) => (item.downloadGrant ? [item.downloadGrant.id] : [])),
      };
    }

    for (const item of attempt.order.items) {
      if (!item.productAssetId) throw new Error(`Order item ${item.id} has no purchased asset snapshot.`);
    }

    await tx.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "SUCCEEDED",
        providerTxId: input.verification.providerTxId ?? null,
        rawVerify: input.verification.raw as object,
      },
    });
    const paidAt = input.verification.paidAt ?? new Date();
    await tx.order.update({
      where: { id: attempt.orderId },
      data: {
        status: "PAID",
        provider: attempt.provider,
        paidAt,
      },
    });

    if (
      attempt.order.couponRedemption &&
      attempt.order.couponRedemption.status !== "REDEEMED"
    ) {
      await tx.couponRedemption.update({
        where: { id: attempt.order.couponRedemption.id },
        data: { status: "REDEEMED", redeemedAt: paidAt, releasedAt: null },
      });
    }

    const grantIds: string[] = [];
    for (const item of attempt.order.items) {
      const grant = await tx.downloadGrant.upsert({
        where: { orderItemId: item.id },
        update: {
          productAssetId: item.productAssetId!,
          email: attempt.order.email,
          revokedAt: null,
        },
        create: {
          orderItemId: item.id,
          productAssetId: item.productAssetId!,
          email: attempt.order.email,
        },
      });
      grantIds.push(grant.id);
      await tx.orderItem.update({ where: { id: item.id }, data: { deliveryStatus: "READY" } });
    }

    await tx.notificationJob.upsert({
      where: { dedupeKey: `download-ready:${attempt.orderId}` },
      update: {},
      create: {
        type: "DOWNLOAD_READY",
        dedupeKey: `download-ready:${attempt.orderId}`,
        recipientEmail: attempt.order.email,
        payload: { orderId: attempt.orderId },
      },
    });
    await tx.order.update({
      where: { id: attempt.orderId },
      data: { status: "FULFILLED", fulfilledAt: new Date() },
    });
    return { orderId: attempt.orderId, alreadySettled: false, grants: grantIds };
  });
}
