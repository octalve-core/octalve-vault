import type { CurrencyCode } from "../../domain/constants.ts";

export type CouponDiscountTypeValue = "PERCENTAGE" | "FIXED_AMOUNT";

export type CouponPricingRule = {
  discountType: CouponDiscountTypeValue;
  percentageBps: number | null;
  fixedAmountMinor: number | null;
  currency: string | null;
  minimumSubtotal: number | null;
};

export function normalizePromotionCode(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new Error("Promotion code must be a string.");
  const normalized = value.trim().toUpperCase();
  if (!normalized) return null;
  if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(normalized)) {
    throw new Error("Promotion code is invalid.");
  }
  return normalized;
}

export function assertCouponActiveWindow(
  coupon: { active: boolean; startsAt: Date | null; endsAt: Date | null },
  now = new Date(),
): void {
  if (!coupon.active) throw new Error("Coupon is unavailable.");
  if (coupon.startsAt && coupon.startsAt.getTime() > now.getTime()) {
    throw new Error("Coupon is unavailable.");
  }
  if (coupon.endsAt && coupon.endsAt.getTime() <= now.getTime()) {
    throw new Error("Coupon is unavailable.");
  }
}

export function calculateCouponDiscount(
  rule: CouponPricingRule,
  input: { currency: CurrencyCode; subtotalAmount: number; eligibleSubtotal: number },
): number {
  if (!Number.isSafeInteger(input.subtotalAmount) || input.subtotalAmount <= 0) {
    throw new Error("Invalid order subtotal.");
  }
  if (!Number.isSafeInteger(input.eligibleSubtotal) || input.eligibleSubtotal <= 0 || input.eligibleSubtotal > input.subtotalAmount) {
    throw new Error("Coupon is not applicable to this order.");
  }
  if (rule.currency && rule.currency !== input.currency) {
    throw new Error("Coupon is unavailable for this currency.");
  }
  if (rule.minimumSubtotal !== null) {
    if (!Number.isSafeInteger(rule.minimumSubtotal) || rule.minimumSubtotal < 0) {
      throw new Error("Coupon configuration is invalid.");
    }
    if (input.subtotalAmount < rule.minimumSubtotal) {
      throw new Error("Order does not meet the coupon minimum subtotal.");
    }
  }

  let discount: number;
  if (rule.discountType === "PERCENTAGE") {
    if (!Number.isSafeInteger(rule.percentageBps) || rule.percentageBps === null || rule.percentageBps < 1 || rule.percentageBps > 9_999 || rule.fixedAmountMinor !== null) {
      throw new Error("Coupon configuration is invalid.");
    }
    discount = Math.floor((input.eligibleSubtotal * rule.percentageBps) / 10_000);
  } else if (rule.discountType === "FIXED_AMOUNT") {
    if (!Number.isSafeInteger(rule.fixedAmountMinor) || rule.fixedAmountMinor === null || rule.fixedAmountMinor <= 0 || rule.percentageBps !== null || !rule.currency) {
      throw new Error("Coupon configuration is invalid.");
    }
    discount = rule.fixedAmountMinor;
  } else {
    throw new Error("Coupon configuration is invalid.");
  }

  if (!Number.isSafeInteger(discount) || discount <= 0 || discount >= input.subtotalAmount || discount > input.eligibleSubtotal) {
    throw new Error("Coupon discount would leave no payable balance or exceeds eligible products.");
  }
  return discount;
}
