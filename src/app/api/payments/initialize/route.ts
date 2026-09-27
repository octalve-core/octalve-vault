import { NextResponse } from "next/server";

import { isCurrency } from "@/config/currencies";
import { isLocale } from "@/config/locales";
import { PAYMENT_PROVIDERS, type PaymentProviderId } from "@/domain/constants";
import { normalizeEmail } from "@/domain/email";
import { initializeCheckoutPayment } from "@/server/payments/checkout-service";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { requestIp } from "@/server/security/request-fingerprint";
import { generateOpaqueToken } from "@/domain/random";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isProvider(value: string): value is PaymentProviderId {
  return (PAYMENT_PROVIDERS as readonly string[]).includes(value);
}

function optionalCode(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error(`${key} must be a string.`);
  return value;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email !== "string") throw new Error("Email is required.");
    if (typeof body.currency !== "string" || !isCurrency(body.currency)) throw new Error("Unsupported currency.");
    if (typeof body.locale !== "string" || !isLocale(body.locale)) throw new Error("Unsupported locale.");
    if (typeof body.provider !== "string" || !isProvider(body.provider)) throw new Error("Unsupported payment provider.");
    if (!Array.isArray(body.items)) throw new Error("Cart items are required.");
    if (body.couponCode !== undefined && body.couponCode !== null && typeof body.couponCode !== "string") throw new Error("Coupon code is invalid.");
    if (body.affiliateCode !== undefined && body.affiliateCode !== null && typeof body.affiliateCode !== "string") throw new Error("Affiliate code is invalid.");

    const email = normalizeEmail(body.email);
    const couponCode = optionalCode(body, "couponCode");
    const affiliateCode = optionalCode(body, "affiliateCode");
    const ip = requestIp(request) ?? "unknown";
    await enforceRateLimit({ action: "payment.initialize", identifier: `${ip}:${email}`, limit: 8, windowSeconds: 300 });
    const headerKey = request.headers.get("idempotency-key")?.trim();
    const idempotencyKey = headerKey && /^[A-Za-z0-9._:-]{16,128}$/.test(headerKey)
      ? headerKey
      : `checkout:${generateOpaqueToken(24)}`;

    const result = await initializeCheckoutPayment({
      email,
      currency: body.currency,
      locale: body.locale,
      provider: body.provider,
      idempotencyKey,
      couponCode,
      affiliateCode,
      items: body.items.map((item) => {
        if (!item || typeof item !== "object" || typeof (item as Record<string, unknown>).productId !== "string") {
          throw new Error("Invalid cart item.");
        }
        return { productId: String((item as Record<string, unknown>).productId), quantity: 1 };
      }),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const resetAt = error && typeof error === "object" && "resetAt" in error ? (error as { resetAt?: Date }).resetAt : undefined;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to initialize payment.", ...(resetAt ? { resetAt } : {}) },
      { status: resetAt ? 429 : 400 },
    );
  }
}
