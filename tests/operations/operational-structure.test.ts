import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const required = [
  "src/app/api/health/route.ts",
  "src/app/api/admin/refunds/route.ts",
  "src/app/admin/(protected)/security/page.tsx",
  "src/app/[locale]/privacy/page.tsx",
  "src/app/[locale]/terms/page.tsx",
  "src/app/[locale]/refund-policy/page.tsx",
  "src/app/[locale]/digital-product-license/page.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
];

test("operational, legal and SEO surfaces exist", () => {
  for (const path of required) assert.equal(existsSync(path), true, `${path} should exist`);
});

test("legal route components stay compositional and do not read env directly", () => {
  for (const path of required.filter((path) => path.includes("[locale]"))) {
    if (!existsSync(path)) continue;
    const source = readFileSync(path, "utf8");
    assert.ok(source.split("\n").length <= 70, `${path} should remain thin`);
    assert.equal(source.includes("process.env"), false);
  }
});

test("security headers are centralized in Next config", () => {
  const source = readFileSync("next.config.ts", "utf8");
  assert.match(source, /Content-Security-Policy/);
  assert.match(source, /X-Content-Type-Options/);
  assert.match(source, /Referrer-Policy/);
});

test("refund policy revokes access only after provider-confirmed full refund", () => {
  const source = readFileSync("src/features/legal/legal-page.tsx", "utf8");
  assert.match(source, /When a full refund is confirmed by the payment provider/);
  assert.match(source, /Lorsqu.un remboursement intégral est confirmé par le prestataire de paiement/);
  assert.match(source, /عند تأكيد مزود الدفع لاسترداد كامل/);
  assert.equal(source.includes("When a full refund is initiated for an order"), false);
});
test("checkout binds idempotency and new payment attempts to the provider environment", () => {
  const source = readFileSync("src/server/payments/checkout-service.ts", "utf8");

  assert.match(
    source,
    /const\s+environment\s*=\s*adapter\.configuredEnvironment\(\)/,
  );

  assert.match(
    source,
    /existing\.environment\s*!==\s*environment/,
  );

  assert.match(
    source,
    /createOrderAndReservation\(\{[\s\S]*provider:\s*input\.provider,[\s\S]*environment,/,
  );

  assert.match(
    source,
    /async function createOrderAndReservation\(input:\s*\{[\s\S]*environment:\s*PaymentEnvironment/,
  );

  assert.match(
    source,
    /payments:\s*\{[\s\S]*create:\s*\{[\s\S]*environment:\s*input\.environment,/,
  );

  const publicInput = source.match(
    /export async function initializeCheckoutPayment\(input:\s*\{([\s\S]*?)\}\)\s*\{/,
  );

  assert.ok(publicInput);
  assert.doesNotMatch(publicInput[1] ?? "", /\benvironment\s*:/);
});

test("payment webhook history and deduplication are namespaced by provider environment", () => {
  const source = readFileSync("src/server/payments/webhook-service.ts", "utf8");

  assert.match(
    source,
    /const\s+environment\s*=\s*adapter\.configuredEnvironment\(\)/,
  );

  assert.match(
    source,
    /provider_environment_providerEventId/,
  );

  assert.match(
    source,
    /provider:\s*providerId,\s*environment,\s*providerEventId:\s*eventId/,
  );

  assert.match(
    source,
    /const\s+verification\s*=\s*await\s+adapter\.verify\(reference\)/,
  );

  assert.match(
    source,
    /settleVerifiedPayment\(\{\s*paymentAttemptId:\s*attempt\.id,\s*verification\s*\}\)/,
  );

  assert.doesNotMatch(
    source,
    /settleVerifiedPayment\([^)]*environment/,
  );
});

test("settlement enforces payment environment before idempotency or value mutation", () => {
  const source = readFileSync("src/server/vault/settlement-service.ts", "utf8");

  assert.match(
    source,
    /const\s+providerId\s*=\s*attempt\.provider\s+as\s+PaymentProviderId/,
  );

  assert.match(source, /getPaymentProvider\(providerId\)/);
  assert.match(source, /adapter\.configuredEnvironment\(\)/);
  assert.match(source, /assertSettlementEnvironmentAgreement\(/);

  const guard = source.indexOf("assertSettlementEnvironmentAgreement(");
  const verification = source.indexOf("assertVerificationMatchesAttempt(");
  const disposition = source.indexOf("settlementDisposition(");
  const paymentMutation = source.indexOf("tx.paymentAttempt.update(");
  const grantMutation = source.indexOf("tx.downloadGrant.upsert(");

  assert.ok(
    guard >= 0 && guard < verification,
    "environment guard must precede payment-field verification",
  );

  assert.ok(
    guard < disposition,
    "environment guard must precede idempotent settlement disposition",
  );

  assert.ok(
    guard < paymentMutation,
    "environment guard must precede payment mutation",
  );

  assert.ok(
    guard < grantMutation,
    "environment guard must precede grant mutation",
  );
});

test("settlement enforces payment environment before idempotency or value mutation", () => {
  const source = readFileSync("src/server/vault/settlement-service.ts", "utf8");

  assert.match(
    source,
    /const\s+providerId\s*=\s*attempt\.provider\s+as\s+PaymentProviderId/,
  );

  assert.match(source, /getPaymentProvider\(providerId\)/);
  assert.match(source, /adapter\.configuredEnvironment\(\)/);
  assert.match(source, /assertSettlementEnvironmentAgreement\(/);

  const guard = source.indexOf("assertSettlementEnvironmentAgreement(");
  const verification = source.indexOf("assertVerificationMatchesAttempt(");
  const disposition = source.indexOf("settlementDisposition(");
  const paymentMutation = source.indexOf("tx.paymentAttempt.update(");
  const grantMutation = source.indexOf("tx.downloadGrant.upsert(");

  assert.ok(
    guard >= 0 && guard < verification,
    "environment guard must precede payment-field verification",
  );

  assert.ok(
    guard < disposition,
    "environment guard must precede idempotent settlement disposition",
  );

  assert.ok(
    guard < paymentMutation,
    "environment guard must precede payment mutation",
  );

  assert.ok(
    guard < grantMutation,
    "environment guard must precede grant mutation",
  );
});