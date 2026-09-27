import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const moduleUrl = new URL("../../src/server/promotions/promotion-core.ts", import.meta.url);
const modulePath = fileURLToPath(moduleUrl);

test("promotion codes normalize safely and reject malformed values", async () => {
  assert.ok(existsSync(modulePath), "promotion-core.ts must exist");
  const { normalizePromotionCode } = await import(moduleUrl.href);
  assert.equal(normalizePromotionCode("  save-25  "), "SAVE-25");
  assert.equal(normalizePromotionCode(""), null);
  assert.throws(() => normalizePromotionCode("bad code"), /code/i);
  assert.throws(() => normalizePromotionCode("X".repeat(41)), /code/i);
});

test("coupon discount calculation is currency-aware, bounded, and never creates a free order", async () => {
  assert.ok(existsSync(modulePath), "promotion-core.ts must exist");
  const { calculateCouponDiscount } = await import(moduleUrl.href);

  assert.equal(calculateCouponDiscount({
    discountType: "PERCENTAGE",
    percentageBps: 1250,
    fixedAmountMinor: null,
    currency: null,
    minimumSubtotal: null,
  }, { currency: "NGN", subtotalAmount: 20_000, eligibleSubtotal: 12_000 }), 1_500);

  assert.equal(calculateCouponDiscount({
    discountType: "FIXED_AMOUNT",
    percentageBps: null,
    fixedAmountMinor: 2_500,
    currency: "NGN",
    minimumSubtotal: 10_000,
  }, { currency: "NGN", subtotalAmount: 20_000, eligibleSubtotal: 12_000 }), 2_500);

  assert.throws(() => calculateCouponDiscount({
    discountType: "FIXED_AMOUNT",
    percentageBps: null,
    fixedAmountMinor: 12_000,
    currency: "NGN",
    minimumSubtotal: null,
  }, { currency: "NGN", subtotalAmount: 12_000, eligibleSubtotal: 12_000 }), /payable|discount/i);

  assert.throws(() => calculateCouponDiscount({
    discountType: "PERCENTAGE",
    percentageBps: 1000,
    fixedAmountMinor: null,
    currency: "USD",
    minimumSubtotal: null,
  }, { currency: "NGN", subtotalAmount: 20_000, eligibleSubtotal: 20_000 }), /currency/i);
});

test("coupon active-window validation fails closed", async () => {
  assert.ok(existsSync(modulePath), "promotion-core.ts must exist");
  const { assertCouponActiveWindow } = await import(moduleUrl.href);
  const now = new Date("2026-09-27T12:30:00Z");
  assert.doesNotThrow(() => assertCouponActiveWindow({ active: true, startsAt: null, endsAt: null }, now));
  assert.throws(() => assertCouponActiveWindow({ active: false, startsAt: null, endsAt: null }, now), /unavailable/i);
  assert.throws(() => assertCouponActiveWindow({ active: true, startsAt: new Date("2026-09-28T00:00:00Z"), endsAt: null }, now), /unavailable/i);
  assert.throws(() => assertCouponActiveWindow({ active: true, startsAt: null, endsAt: new Date("2026-09-26T00:00:00Z") }, now), /unavailable/i);
});
