import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function read(path: string) {
  const url = new URL(path, import.meta.url);
  assert.ok(existsSync(fileURLToPath(url)), `${path} must exist`);
  return readFileSync(url, "utf8");
}

test("Prisma schema and migration model coupon reservations and affiliate attribution", () => {
  const schema = read("../../prisma/schema.prisma");
  assert.match(schema, /enum\s+CouponDiscountType\s+\{/);
  assert.match(schema, /enum\s+CouponRedemptionStatus\s+\{/);
  for (const model of ["Coupon", "CouponProduct", "CouponRedemption", "Affiliate"]) {
    assert.match(schema, new RegExp(`model\\s+${model}\\s+\\{`));
  }
  assert.match(schema, /model\s+Order[\s\S]*couponId\s+String\?/);
  assert.match(schema, /model\s+Order[\s\S]*couponCode\s+String\?/);
  assert.match(schema, /model\s+Order[\s\S]*affiliateId\s+String\?/);
  assert.match(schema, /model\s+Order[\s\S]*affiliateCode\s+String\?/);
  assert.match(schema, /model\s+Order[\s\S]*affiliateCommissionBps\s+Int\?/);
  assert.match(schema, /model\s+CouponRedemption[\s\S]*reservationExpiresAt\s+DateTime/);
  const migration = read("../../prisma/migrations/20260927133000_checkout_promotions/migration.sql");
  assert.match(migration, /CREATE TABLE "Coupon"/);
  assert.match(migration, /CREATE TABLE "CouponRedemption"/);
  assert.match(migration, /"reservationExpiresAt" TIMESTAMP\(3\) NOT NULL/);
  assert.match(migration, /CREATE TABLE "Affiliate"/);
  assert.match(migration, /Coupon_discount_configuration_check/);
  assert.match(migration, /Coupon_window_check/);
  assert.match(migration, /minimumSubtotal" >= 0 AND "currency" IS NOT NULL/);
  assert.match(migration, /Affiliate_commission_check/);
  assert.match(migration, /Order_affiliate_commission_check/);
});

test("quote and initialize routes accept codes but never a trusted browser amount", () => {
  const quote = read("../../src/app/api/checkout/quote/route.ts");
  const initialize = read("../../src/app/api/payments/initialize/route.ts");
  for (const source of [quote, initialize]) {
    assert.match(source, /couponCode/);
    assert.match(source, /affiliateCode/);
    assert.doesNotMatch(source, /body\.(?:amount|subtotal|discount|total)/);
  }
  assert.match(initialize, /initializeCheckoutPayment/);
});

test("checkout service recomputes discount and final amount server-side and settlement redeems reservations", () => {
  const service = read("../../src/server/payments/checkout-service.ts");
  const settlement = read("../../src/server/vault/settlement-service.ts");
  assert.match(service, /discountAmount/);
  assert.match(service, /totalAmount/);
  assert.match(service, /couponCode/);
  assert.match(service, /affiliateCode/);
  assert.match(service, /CouponRedemption|couponRedemption|redemption/i);
  assert.match(service, /isolationLevel:\s*"Serializable"/);
  assert.match(service, /sameProductIds/);
  assert.match(service, /existing\.order\.couponCode\s*!==\s*couponCode/);
  assert.match(service, /existing\.order\.affiliateCode\s*!==\s*affiliateCode/);
  assert.match(service, /existing\.order\.locale\s*!==\s*input\.locale/);
  assert.match(service, /amount:\s*pricing\.totalAmount/);
  assert.match(service, /amountMinor:\s*pricing\.totalAmount/);
  assert.match(service, /status:\s*"RELEASED"/);
  assert.match(settlement, /couponRedemption/);
  assert.match(settlement, /REDEEMED/);
  assert.match(settlement, /releasedAt:\s*null/);
});

test("checkout presentation keeps canonical two-column layout and submits only IDs, codes and checkout identity", () => {
  const view = read("../../src/features/store/checkout/checkout-view.tsx");
  const route = read("../../src/app/[locale]/checkout/page.tsx");
  assert.match(view, /lg:grid-cols-\[1fr_360px\]/);
  assert.match(view, /couponCode/);
  assert.match(view, /affiliateCode/);
  assert.match(view, /\/api\/checkout\/quote/);
  assert.match(view, /\/api\/payments\/initialize/);
  assert.doesNotMatch(view, /JSON\.stringify\([^)]*(?:subtotal|discountAmount|totalAmount|amount)/s);
  assert.doesNotMatch(route, /font-black/);
});

test("checkout releases a coupon only when gateway initialization itself fails", () => {
  const service = read("../../src/server/payments/checkout-service.ts");
  assert.match(service, /async function failCheckoutInitialization/);
  assert.match(
    service,
    /let initialized:[\s\S]*?try \{[\s\S]*?initialized = await adapter\.initialize[\s\S]*?\} catch \(error\) \{[\s\S]*?await failCheckoutInitialization\([\s\S]*?throw error;[\s\S]*?\}\s*await prisma\.\$transaction/s,
  );
});
