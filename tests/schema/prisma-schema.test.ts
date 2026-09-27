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
