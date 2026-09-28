import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8");

const requiredModels = [
  "Product",
  "ProductTranslation",
  "ProductPrice",
  "ProductAsset",
  "Order",
  "OrderItem",
  "PaymentAttempt",
  "WebhookEvent",
  "Refund",
  "DownloadGrant",
  "DownloadTicket",
  "DownloadEvent",
  "CustomerAccessChallenge",
  "CustomerSession",
  "AdminUser",
  "AdminSession",
  "AdminAuditLog",
  "SecurityEvent",
  "NotificationJob",
  "RateLimitBucket",
  "StoreSetting",
];

test("standalone schema contains every production subsystem model", () => {
  for (const model of requiredModels) {
    assert.match(schema, new RegExp(`model\\s+${model}\\s+\\{`), `missing model ${model}`);
  }
});

test("product translations and prices cannot duplicate locale/currency", () => {
  assert.match(schema, /@@unique\(\[productId, locale\]\)/);
  assert.match(schema, /@@unique\(\[productId, currency\]\)/);
});

test("product asset versions and object keys are unique", () => {
  assert.match(schema, /objectKey\s+String\s+@unique/);
  assert.match(schema, /@@unique\(\[productId, version\]\)/);
});

test("order items snapshot financial and product identity", () => {
  for (const field of ["productTitle", "productSlug", "unitAmount", "quantity", "totalAmount", "currency"]) {
    assert.match(schema, new RegExp(`\\b${field}\\b`));
  }
});

test("download tickets store hashes rather than raw bearer tokens", () => {
  assert.match(schema, /model\s+DownloadTicket[\s\S]*tokenHash\s+String\s+@unique/);
  assert.doesNotMatch(schema, /model\s+DownloadTicket[\s\S]*\n\s+token\s+String/);
});

test("sessions are revocable and expiring", () => {
  assert.match(schema, /model\s+AdminSession[\s\S]*expiresAt\s+DateTime[\s\S]*revokedAt\s+DateTime\?/);
  assert.match(schema, /model\s+CustomerSession[\s\S]*expiresAt\s+DateTime[\s\S]*revokedAt\s+DateTime\?/);
});

test("payment environment is explicit and provider-neutral across financial records", () => {
  assert.match(schema, /enum\s+PaymentEnvironment\s+\{\s*TEST\s+LIVE\s*\}/s);

  for (const model of ["PaymentAttempt", "WebhookEvent", "Refund"]) {
    const match = schema.match(new RegExp(`model\\s+${model}\\s+\\{([\\s\\S]*?)\\n\\}`));
    assert.ok(match, `missing model ${model}`);
    const body = match[1] ?? "";
    assert.match(body, /\benvironment\s+PaymentEnvironment\b/);
    assert.doesNotMatch(body, /\benvironment\s+PaymentEnvironment[^\n]*@default/);
  }
});

test("payment environment participates in financial indexes and uniqueness namespaces", () => {
  assert.match(schema, /model\s+PaymentAttempt[\s\S]*@@index\(\[provider, environment, status\]\)/);
  assert.doesNotMatch(schema, /model\s+PaymentAttempt[\s\S]*@@index\(\[provider, status\]\)/);

  assert.match(schema, /model\s+WebhookEvent[\s\S]*@@unique\(\[provider, environment, providerEventId\]\)/);
  assert.doesNotMatch(schema, /model\s+WebhookEvent[\s\S]*@@unique\(\[provider, providerEventId\]\)/);

  assert.doesNotMatch(schema, /model\s+Refund[\s\S]*providerReference\s+String\?\s+@unique/);
  assert.match(schema, /model\s+Refund[\s\S]*@@unique\(\[provider, environment, providerReference\]\)/);
});

test("Prisma reserves future providers while runtime exposes only implemented adapters", () => {
  const constants = readFileSync(new URL("../../src/domain/constants.ts", import.meta.url), "utf8");
  for (const provider of ["PAYSTACK", "FLUTTERWAVE", "STRIPE", "PAYPAL", "CRYPTO"]) {
    assert.match(schema, new RegExp(`\\b${provider}\\b`));
  }
  assert.match(constants, /PAYMENT_PROVIDERS\s*=\s*\["PAYSTACK",\s*"FLUTTERWAVE"\]/);
  assert.doesNotMatch(constants, /PAYMENT_PROVIDERS[^\n]*STRIPE/);
  assert.doesNotMatch(constants, /PAYMENT_PROVIDERS[^\n]*PAYPAL/);
  assert.doesNotMatch(constants, /PAYMENT_PROVIDERS[^\n]*CRYPTO/);
});
