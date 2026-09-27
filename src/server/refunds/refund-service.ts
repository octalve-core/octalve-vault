import { PAYMENT_PROVIDERS, type PaymentProviderId } from "../../domain/constants";
import { prisma } from "../../lib/prisma";
import { getPaymentProvider } from "../payments/registry";
import type { PaymentRefundResult } from "../payments/types";
import { notificationDedupeKey } from "../notifications/outbox-core.ts";
import { assertRefundAmount, refundOrderDisposition } from "./refund-core.ts";

const REFUNDABLE_PAYMENT_STATUSES = ["SUCCEEDED", "PARTIALLY_REFUNDED", "REFUNDED"] as const;
const RESERVED_REFUND_STATUSES = ["PENDING", "PROCESSING", "SUCCEEDED"] as const;

function isImplementedPaymentProvider(value: string): value is PaymentProviderId {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

async function applyRefundResult(refundId: string, result: PaymentRefundResult) {
  return prisma.$transaction(async (tx) => {
    const refund = await tx.refund.update({
      where: { id: refundId },
      data: {
        providerReference: result.providerReference,
        status: result.status,
        rawResponse: result.raw as object,
      },
      include: { order: true, paymentAttempt: true },
    });

    if (result.status !== "SUCCEEDED") return refund;

    const succeeded = await tx.refund.aggregate({
      where: { orderId: refund.orderId, status: "SUCCEEDED" },
      _sum: { amount: true },
    });
    const cumulative = succeeded._sum.amount ?? 0;
    const disposition = refundOrderDisposition(refund.order.totalAmount, cumulative);
    const orderStatus = disposition === "FULL" ? "REFUNDED" : "PARTIALLY_REFUNDED";
    const paymentStatus = disposition === "FULL" ? "REFUNDED" : "PARTIALLY_REFUNDED";

    await tx.order.update({ where: { id: refund.orderId }, data: { status: orderStatus } });
    if (refund.paymentAttemptId) {
      await tx.paymentAttempt.update({
        where: { id: refund.paymentAttemptId },
        data: { status: paymentStatus },
      });
    }

    if (disposition === "FULL") {
      await tx.downloadGrant.updateMany({
        where: { orderItem: { orderId: refund.orderId } },
        data: { revokedAt: new Date() },
      });
      await tx.orderItem.updateMany({
        where: { orderId: refund.orderId },
        data: { deliveryStatus: "REVOKED" },
      });
    }

    await tx.notificationJob.upsert({
      where: { dedupeKey: notificationDedupeKey("REFUND_CONFIRMATION", refund.id) },
      update: {},
      create: {
        type: "REFUND_CONFIRMATION",
        dedupeKey: notificationDedupeKey("REFUND_CONFIRMATION", refund.id),
        recipientEmail: refund.order.email,
        payload: {
          orderId: refund.orderId,
          refundId: refund.id,
          amountMinor: refund.amount,
          currency: refund.currency,
          disposition,
        },
      },
    });

    return refund;
  });
}

export async function initiateRefund(input: {
  orderId: string;
  amountMinor: number;
  reason: string;
}) {
  const reservation = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: input.orderId },
      include: {
        payments: { orderBy: { createdAt: "desc" } },
        refunds: true,
      },
    });

    if (
      !order ||
      !["PAID", "FULFILLED", "PARTIALLY_FULFILLED", "PARTIALLY_REFUNDED"].includes(order.status)
    ) {
      throw new Error("Order is not refundable.");
    }

    const attempt = order.payments.find((item) =>
      (REFUNDABLE_PAYMENT_STATUSES as readonly string[]).includes(item.status),
    );

    if (!attempt) {
      throw new Error("No refundable successful payment attempt was found.");
    }

    if (!isImplementedPaymentProvider(attempt.provider)) {
      throw new Error(`Refunds are not implemented for payment provider ${attempt.provider}.`);
    }

    const reserved = order.refunds
      .filter((item) =>
        (RESERVED_REFUND_STATUSES as readonly string[]).includes(item.status),
      )
      .reduce((sum, item) => sum + item.amount, 0);

    const amount = assertRefundAmount(order.totalAmount, reserved, input.amountMinor);
    const reason = input.reason.trim();

    if (reason.length < 3 || reason.length > 500) {
      throw new Error("A refund reason between 3 and 500 characters is required.");
    }

    const refund = await tx.refund.create({
      data: {
        orderId: order.id,
        paymentAttemptId: attempt.id,
        provider: attempt.provider,
        amount,
        currency: order.currency,
        status: "PENDING",
        reason,
      },
    });

    return {
      refund,
      attempt,
      provider: attempt.provider,
      currency: order.currency as "NGN" | "USD" | "GBP" | "EUR",
    };
  }, { isolationLevel: "Serializable" });

  try {
    const adapter = getPaymentProvider(reservation.provider);
    const result = await adapter.refund({
      paymentReference: reservation.attempt.providerReference,
      providerTxId: reservation.attempt.providerTxId,
      amountMinor: reservation.refund.amount,
      currency: reservation.currency,
      reason: reservation.refund.reason ?? "Customer refund",
    });

    return await applyRefundResult(reservation.refund.id, result);
  } catch (error) {
    await prisma.refund.update({
      where: { id: reservation.refund.id },
      data: {
        status: "FAILED",
        rawResponse: {
          error: error instanceof Error ? error.message : "Refund initiation failed",
        },
      },
    });
    throw error;
  }
}

export async function refreshRefund(refundId: string) {
  const refund = await prisma.refund.findUnique({
    where: { id: refundId },
    include: { paymentAttempt: true },
  });

  if (
    !refund ||
    !refund.provider ||
    !refund.providerReference ||
    !refund.paymentAttempt
  ) {
    throw new Error("Refund cannot be refreshed yet.");
  }

  if (!isImplementedPaymentProvider(refund.provider)) {
    throw new Error(`Refunds are not implemented for payment provider ${refund.provider}.`);
  }

  const result = await getPaymentProvider(refund.provider).fetchRefund(
    refund.providerReference,
  );

  return applyRefundResult(refund.id, result);
}

export async function listRefunds() {
  return prisma.refund.findMany({
    include: {
      order: {
        select: {
          reference: true,
          email: true,
          totalAmount: true,
        },
      },
      paymentAttempt: {
        select: {
          provider: true,
          providerReference: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
}
