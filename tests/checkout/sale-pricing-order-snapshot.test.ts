import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("OrderItem keeps immutable product and effective-price snapshots", () => {
  const schema = source("prisma/schema.prisma");
  const match = schema.match(/model OrderItem\s*\{([\s\S]*?)\n\}/);
  assert.ok(match, "OrderItem model must exist");
  const orderItem = match[1];

  assert.match(orderItem, /\bproductId\s+String\b/);
  assert.match(orderItem, /\bproductAssetId\s+String\?/);
  assert.match(orderItem, /\bproductSlug\s+String\b/);
  assert.match(orderItem, /\bproductTitle\s+String\b/);
  assert.match(orderItem, /\bunitAmount\s+Int\b/);
  assert.match(orderItem, /\bquantity\s+Int\s+@default\(1\)/);
  assert.match(orderItem, /\btotalAmount\s+Int\b/);
  assert.match(orderItem, /\bcurrency\s+String\b/);

  assert.doesNotMatch(orderItem, /\bregularAmountMinor\b/);
  assert.doesNotMatch(orderItem, /\bsaleAmountMinor\b/);
  assert.doesNotMatch(orderItem, /\bproductPriceId\b/);
});

test("checkout persists the server-resolved itemData and order totals as snapshots", () => {
  const service = source("src/server/payments/checkout-service.ts");

  assert.match(service, /subtotalAmount:\s*pricing\.subtotalAmount/);
  assert.match(service, /discountAmount:\s*pricing\.discountAmount/);
  assert.match(service, /totalAmount:\s*pricing\.totalAmount/);
  assert.match(service, /items:\s*\{\s*create:\s*pricing\.itemData\s*\}/);
  assert.match(service, /amount:\s*pricing\.totalAmount/);
});

test("sale-adjusted effective item amounts are resolved before immutable order creation", () => {
  const pricing = source("src/server/payments/checkout-pricing.ts");
  const service = source("src/server/payments/checkout-service.ts");

  assert.match(pricing, /unitAmount:\s*effectivePrice\.effectiveAmountMinor/);
  assert.match(pricing, /totalAmount:\s*effectivePrice\.effectiveAmountMinor/);
  assert.match(pricing, /saleAmountMinor:\s*price\.saleAmountMinor/);

  const effective = pricing.indexOf("const effectivePrice =");
  const subtotal = pricing.indexOf("const subtotalAmount =");
  const coupon = pricing.indexOf("const coupon = await resolveCouponForCheckout");
  assert.ok(effective >= 0 && subtotal > effective && coupon > subtotal);

  assert.match(service, /items:\s*\{\s*create:\s*pricing\.itemData\s*\}/);
});
