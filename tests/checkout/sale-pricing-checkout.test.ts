import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const checkout = readFileSync(
  new URL("../../src/server/payments/checkout-pricing.ts", import.meta.url),
  "utf8",
);

test("checkout snapshots effective sale price before coupon calculation", () => {
  assert.match(checkout, /resolveEffectiveProductPrice/);
  assert.match(checkout, /const effectivePrice\s*=\s*resolveEffectiveProductPrice\(/);
  assert.match(checkout, /amountMinor:\s*price\.amountMinor/);
  assert.match(checkout, /saleAmountMinor:\s*price\.saleAmountMinor/);
  assert.match(checkout, /unitAmount:\s*effectivePrice\.effectiveAmountMinor/);
  assert.match(checkout, /totalAmount:\s*effectivePrice\.effectiveAmountMinor/);
  assert.doesNotMatch(checkout, /unitAmount:\s*price\.amountMinor/);

  const effective = checkout.indexOf("const effectivePrice =");
  const subtotal = checkout.indexOf("const subtotalAmount =");
  const coupon = checkout.indexOf("const coupon = await resolveCouponForCheckout");
  assert.ok(effective >= 0 && subtotal > effective && coupon > subtotal);
  assert.match(checkout, /resolveCouponForCheckout\(db,\s*\{[\s\S]*?subtotalAmount,[\s\S]*?items:\s*itemData/);

  assert.match(checkout, /status:\s*"ACTIVE"/);
  assert.match(checkout, /where:\s*\{\s*status:\s*"PUBLISHED"\s*\}/);
});
