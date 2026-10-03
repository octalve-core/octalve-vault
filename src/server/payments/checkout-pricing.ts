import type { Prisma } from "@prisma/client";
import type { CurrencyCode, Locale } from "../../domain/constants.ts";
import { normalizeEmail } from "../../domain/email.ts";
import { resolveEffectiveProductPrice } from "../../domain/product-pricing.ts";
import {
  resolveAffiliateForCheckout,
  resolveCouponForCheckout,
} from "../promotions/checkout-promotions.ts";

export type CheckoutItemInput = { productId: string; quantity?: number };

type CheckoutDb = Pick<
  Prisma.TransactionClient,
  "product" | "coupon" | "couponRedemption" | "affiliate"
>;

export function normalizeCheckoutItems(items: CheckoutItemInput[]) {
  if (!Array.isArray(items) || items.length < 1 || items.length > 25) {
    throw new Error("Cart must contain between 1 and 25 products.");
  }

  const normalized = items.map((item) => ({
    productId: item.productId.trim(),
    quantity: item.quantity ?? 1,
  }));

  if (new Set(normalized.map((item) => item.productId)).size !== normalized.length) {
    throw new Error("Cart contains duplicate products.");
  }
  if (normalized.some((item) => !item.productId || item.quantity !== 1)) {
    throw new Error("Digital Vault products can be purchased once per order item.");
  }

  return normalized;
}

export async function resolveCheckoutPricing(
  db: CheckoutDb,
  input: {
    email: string;
    locale: Locale;
    currency: CurrencyCode;
    items: CheckoutItemInput[];
    couponCode?: string | null;
    affiliateCode?: string | null;
    now?: Date;
  },
) {
  const email = normalizeEmail(input.email);
  const normalizedItems = normalizeCheckoutItems(input.items);

  const products = await db.product.findMany({
    where: {
      id: { in: normalizedItems.map((item) => item.productId) },
      status: "ACTIVE",
    },
    include: {
      translations: { where: { locale: { in: [input.locale, "en"] } } },
      prices: { where: { currency: input.currency, isActive: true } },
      assets: {
        where: { status: "PUBLISHED" },
        orderBy: { version: "desc" },
        take: 1,
      },
    },
  });

  const byId = new Map(products.map((product) => [product.id, product]));
  const itemData = normalizedItems.map(({ productId }) => {
    const product = byId.get(productId);
    if (!product) throw new Error(`Product ${productId} is unavailable.`);

    const price = product.prices[0];
    const asset = product.assets[0];
    if (!price) {
      throw new Error(`Product ${productId} has no active ${input.currency} price.`);
    }
    if (!asset) {
      throw new Error(`Product ${productId} does not have a published digital asset.`);
    }

    const translation =
      product.translations.find((entry) => entry.locale === input.locale) ??
      product.translations.find((entry) => entry.locale === "en");
    if (!translation) {
      throw new Error(`Product ${productId} has no usable translation.`);
    }

    const effectivePrice = resolveEffectiveProductPrice({
      amountMinor: price.amountMinor,
      saleAmountMinor: price.saleAmountMinor,
    });

    return {
      productId: product.id,
      productAssetId: asset.id,
      productSlug: product.slug,
      productTitle: translation.title,
      unitAmount: effectivePrice.effectiveAmountMinor,
      quantity: 1,
      totalAmount: effectivePrice.effectiveAmountMinor,
      currency: input.currency,
    };
  });

  const subtotalAmount = itemData.reduce(
    (sum, item) => sum + item.totalAmount,
    0,
  );
  if (!Number.isSafeInteger(subtotalAmount) || subtotalAmount <= 0) {
    throw new Error("Invalid order total.");
  }

  const coupon = await resolveCouponForCheckout(db, {
    code: input.couponCode,
    email,
    currency: input.currency,
    subtotalAmount,
    items: itemData,
    now: input.now,
  });
  const affiliate = await resolveAffiliateForCheckout(db, {
    code: input.affiliateCode,
  });

  const discountAmount = coupon?.discountAmount ?? 0;
  const totalAmount = subtotalAmount - discountAmount;
  if (!Number.isSafeInteger(totalAmount) || totalAmount <= 0) {
    throw new Error("Invalid payable order total.");
  }

  return {
    email,
    itemData,
    subtotalAmount,
    discountAmount,
    totalAmount,
    coupon,
    affiliate,
  };
}
