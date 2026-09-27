import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function read(path: string) {
  const url = new URL(path, import.meta.url);
  const file = fileURLToPath(url);
  assert.ok(existsSync(file), `${path} must exist`);
  return readFileSync(file, "utf8");
}

test("checkout uses the canonical Octalve two-column form and summary presentation", () => {
  const view = read("../../src/features/store/checkout/checkout-view.tsx");
  const route = read("../../src/app/[locale]/checkout/page.tsx");
  assert.match(view, /lg:grid-cols-\[1fr_360px\]/);
  assert.match(view, /Customer details|checkout\.customerDetails/);
  assert.match(view, /Delivery rule|checkout\.deliveryRule/);
  assert.match(view, /Order summary|checkout\.summary/);
  assert.doesNotMatch(view, /font-black/);
  assert.doesNotMatch(route, /font-black/);
});

test("checkout exposes coupon and affiliate inputs without making browser totals authoritative", () => {
  const view = read("../../src/features/store/checkout/checkout-view.tsx");
  assert.match(view, /couponCode/);
  assert.match(view, /affiliateCode/);
  assert.match(view, /\/api\/checkout\/quote/);
  assert.match(view, /\/api\/payments\/initialize/);
  assert.match(view, /idempotencyKeyRef/);
  assert.match(view, /idempotencySignatureRef/);
  assert.match(view, /idempotencySignatureRef\.current\s*!==\s*paymentSignature/);
  assert.match(view, /paymentSignature[\s\S]*effectiveProvider/);
  assert.match(view, /const promotionNeedsQuote\s*=/);
  assert.match(view, /unavailablePrice\s*\|\|\s*promotionNeedsQuote/);
  assert.doesNotMatch(
    view,
    /JSON\.stringify\([^)]*(?:subtotalAmount|discountAmount|totalAmount|amountMinor)/s,
  );
});

test("checkout providers remain capability-driven and legal links remain localized", () => {
  const view = read("../../src/features/store/checkout/checkout-view.tsx");
  const route = read("../../src/app/[locale]/checkout/page.tsx");
  assert.match(view, /providersByCurrency/);
  assert.match(view, /localeHref\(locale, "\/terms"\)/);
  assert.match(view, /localeHref\(locale, "\/refund-policy"\)/);
  assert.doesNotMatch(view, /Stripe|PayPal|Crypto/);
  assert.match(route, /availablePaymentProviders/);
});

test("unavailable product prices still block checkout submission", () => {
  const view = read("../../src/features/store/checkout/checkout-view.tsx");
  assert.match(view, /unavailablePrice/);
  assert.match(view, /disabled=\{[^}]*unavailablePrice/);
});
