import type { CurrencyCode, Locale, PaymentEnvironment, PaymentProviderId } from "../../domain/constants";
import { normalizeEmail } from "../../domain/email";
import { requiredEnv } from "../../config/env.server";
import { prisma } from "../../lib/prisma";
import {
  COUPON_RESERVATION_TTL_MS,
} from "../promotions/checkout-promotions";
import { normalizePromotionCode } from "../promotions/promotion-core";
import { getCommerceSettings } from "../settings/commerce-settings";
import {
  normalizeCheckoutItems,
  resolveCheckoutPricing,
  type CheckoutItemInput,
} from "./checkout-pricing";
import { generatePaymentReference } from "./reference";
import { availablePaymentProviders, getPaymentProvider } from "./registry";

export type { CheckoutItemInput } from "./checkout-pricing";

function sameProductIds(
  existing: Array<{ productId: string }>,
  requested: CheckoutItemInput[],
): boolean {
  const left = existing.map((item) => item.productId).sort();
  const right = requested.map((item) => item.productId).sort();
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

function isSerializableRetry(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "P2034",
  );
}

async function failCheckoutInitialization(orderId: string, attemptId: string) {
  const failedAt = new Date();
  await prisma.$transaction([
    prisma.paymentAttempt.update({
      where: { id: attemptId },
      data: { status: "FAILED" },
    }),
    prisma.order.update({
      where: { id: orderId },
      data: { status: "FAILED" },
    }),
    prisma.couponRedemption.updateMany({
      where: { orderId, status: "RESERVED" },
      data: { status: "RELEASED", releasedAt: failedAt },
    }),
  ]);
}

export async function initializeCheckoutPayment(input: {
  email: string;
  locale: Locale;
  currency: CurrencyCode;
  provider: PaymentProviderId;
  items: CheckoutItemInput[];
  couponCode?: string | null;
  affiliateCode?: string | null;
  idempotencyKey: string;
}) {
  const email = normalizeEmail(input.email);
  const items = normalizeCheckoutItems(input.items);
  const couponCode = normalizePromotionCode(input.couponCode);
  const affiliateCode = normalizePromotionCode(input.affiliateCode);

  const settings = await getCommerceSettings();
  if (!settings.enabledCurrencies.includes(input.currency)) {
    throw new Error(`${input.currency} is currently disabled for this store.`);
  }
  if (!availablePaymentProviders(input.currency).includes(input.provider)) {
    throw new Error(`${input.provider} is not configured for ${input.currency}.`);
  }
  if (!/^[A-Za-z0-9._:-]{16,128}$/.test(input.idempotencyKey)) {
    throw new Error("A valid idempotency key is required.");
  }

  const adapter = getPaymentProvider(input.provider);
  const environment = adapter.configuredEnvironment();

  const existing = await prisma.paymentAttempt.findUnique({
    where: { idempotencyKey: input.idempotencyKey },
    include: { order: { include: { items: { select: { productId: true } } } } },
  });

  if (existing) {
    if (
      existing.provider !== input.provider ||
      existing.environment !== environment ||
      existing.order.email !== email ||
      existing.order.currency !== input.currency ||
      existing.order.locale !== input.locale ||
      existing.order.couponCode !== couponCode ||
      existing.order.affiliateCode !== affiliateCode ||
      !sameProductIds(existing.order.items, items)
    ) {
      throw new Error(
        "Idempotency key has already been used for a different payment request.",
      );
    }

    if (existing.authorizationUrl) {
      return {
        orderId: existing.orderId,
        reference: existing.providerReference,
        authorizationUrl: existing.authorizationUrl,
        provider: existing.provider,
      };
    }

    throw new Error("This payment request is already being initialized.");
  }

  const now = new Date();
  let creation: Awaited<ReturnType<typeof createOrderAndReservation>> | undefined;
  let lastTransactionError: unknown;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      creation = await createOrderAndReservation({
        email,
        locale: input.locale,
        currency: input.currency,
        provider: input.provider,
        environment,
        items,
        couponCode,
        affiliateCode,
        idempotencyKey: input.idempotencyKey,
        now,
      });
      break;
    } catch (error) {
      if (!isSerializableRetry(error) || attempt === 2) throw error;
      lastTransactionError = error;
    }
  }

  if (!creation) {
    throw lastTransactionError instanceof Error
      ? lastTransactionError
      : new Error("Unable to reserve checkout safely. Please retry.");
  }

  const { order, attempt, pricing } = creation;
  const reference = order.reference;
  const appUrl = requiredEnv("APP_URL").replace(/\/$/, "");
  const callbackUrl = `${appUrl}/${input.locale}/payment/${input.provider.toLowerCase()}/success?reference=${encodeURIComponent(reference)}`;

  let initialized: Awaited<ReturnType<typeof adapter.initialize>>;
  try {
    initialized = await adapter.initialize({
      reference,
      email,
      amountMinor: pricing.totalAmount,
      currency: input.currency,
      callbackUrl,
      metadata: {
        orderId: order.id,
        orderReference: reference,
        source: "octalve-vault",
        productIds: pricing.itemData.map((item) => item.productId),
      },
    });
  } catch (error) {
    await failCheckoutInitialization(order.id, attempt.id);
    throw error;
  }

  await prisma.$transaction([
    prisma.paymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "INITIALIZED",
        authorizationUrl: initialized.authorizationUrl,
        accessCode: initialized.accessCode ?? null,
        rawInitialize: initialized.raw as object,
      },
    }),
    prisma.order.update({
      where: { id: order.id },
      data: { status: "INITIALIZED" },
    }),
  ]);

  return {
    orderId: order.id,
    reference,
    authorizationUrl: initialized.authorizationUrl,
    provider: input.provider,
  };

}

async function createOrderAndReservation(input: {
  email: string;
  locale: Locale;
  currency: CurrencyCode;
  provider: PaymentProviderId;
  environment: PaymentEnvironment;
  items: CheckoutItemInput[];
  couponCode: string | null;
  affiliateCode: string | null;
  idempotencyKey: string;
  now: Date;
}) {
  return prisma.$transaction(
    async (tx) => {
      const pricing = await resolveCheckoutPricing(tx, {
        email: input.email,
        locale: input.locale,
        currency: input.currency,
        items: input.items,
        couponCode: input.couponCode,
        affiliateCode: input.affiliateCode,
        now: input.now,
      });

      const reference = generatePaymentReference();
      const order = await tx.order.create({
        data: {
          reference,
          email: pricing.email,
          locale: input.locale,
          currency: input.currency,
          subtotalAmount: pricing.subtotalAmount,
          discountAmount: pricing.discountAmount,
          totalAmount: pricing.totalAmount,
          provider: input.provider,
          couponId: pricing.coupon?.id ?? null,
          couponCode: pricing.coupon?.code ?? null,
          affiliateId: pricing.affiliate?.id ?? null,
          affiliateCode: pricing.affiliate?.code ?? null,
          affiliateCommissionBps: pricing.affiliate?.commissionBps ?? null,
          items: { create: pricing.itemData },
          payments: {
            create: {
              provider: input.provider,
              environment: input.environment,
              providerReference: reference,
              idempotencyKey: input.idempotencyKey,
              amount: pricing.totalAmount,
              currency: input.currency,
              status: "PENDING",
            },
          },
        },
        include: { payments: true },
      });

      if (pricing.coupon) {
        await tx.couponRedemption.create({
          data: {
            couponId: pricing.coupon.id,
            orderId: order.id,
            email: pricing.email,
            status: "RESERVED",
            discountAmount: pricing.discountAmount,
            currency: input.currency,
            reservationExpiresAt: new Date(
              input.now.getTime() + COUPON_RESERVATION_TTL_MS,
            ),
          },
        });
      }

      const paymentAttempt = order.payments[0];
      if (!paymentAttempt) throw new Error("Payment attempt was not created.");

      return { order, attempt: paymentAttempt, pricing };
    },
    { isolationLevel: "Serializable" },
  );
}
