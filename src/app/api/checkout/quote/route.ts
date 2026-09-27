import { NextResponse } from "next/server";

import { isCurrency } from "@/config/currencies";
import { isLocale } from "@/config/locales";
import { normalizeEmail } from "@/domain/email";
import { prisma } from "@/lib/prisma";
import { resolveCheckoutPricing } from "@/server/payments/checkout-pricing";
import { enforceRateLimit } from "@/server/security/rate-limit";
import { requestIp } from "@/server/security/request-fingerprint";
import { getCommerceSettings } from "@/server/settings/commerce-settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    if (typeof body.currency !== "string" || !isCurrency(body.currency)) {
      throw new Error("Unsupported currency.");
    }
    if (typeof body.locale !== "string" || !isLocale(body.locale)) {
      throw new Error("Unsupported locale.");
    }
    if (!Array.isArray(body.items)) throw new Error("Cart items are required.");

    const email = normalizeEmail(body.email);
    const couponCode = optionalCode(body, "couponCode");
    const affiliateCode = optionalCode(body, "affiliateCode");
    const ip = requestIp(request) ?? "unknown";
    await enforceRateLimit({
      action: "checkout.quote",
      identifier: `${ip}:${email}`,
      limit: 20,
      windowSeconds: 300,
    });

    const settings = await getCommerceSettings();
    if (!settings.enabledCurrencies.includes(body.currency)) {
      throw new Error(`${body.currency} is currently disabled for this store.`);
    }

    const pricing = await resolveCheckoutPricing(prisma, {
      email,
      currency: body.currency,
      locale: body.locale,
      couponCode,
      affiliateCode,
      items: body.items.map((item) => {
        if (
          !item ||
          typeof item !== "object" ||
          typeof (item as Record<string, unknown>).productId !== "string"
        ) {
          throw new Error("Invalid cart item.");
        }
        return {
          productId: String((item as Record<string, unknown>).productId),
          quantity: 1,
        };
      }),
    });

    return NextResponse.json({
      currency: body.currency,
      subtotalAmount: pricing.subtotalAmount,
      discountAmount: pricing.discountAmount,
      totalAmount: pricing.totalAmount,
      coupon: pricing.coupon ? { code: pricing.coupon.code } : null,
      affiliate: pricing.affiliate ? { code: pricing.affiliate.code } : null,
    });
  } catch (error) {
    const resetAt =
      error && typeof error === "object" && "resetAt" in error
        ? (error as { resetAt?: Date }).resetAt
        : undefined;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to calculate checkout totals.",
        ...(resetAt ? { resetAt } : {}),
      },
      { status: resetAt ? 429 : 400 },
    );
  }
}
