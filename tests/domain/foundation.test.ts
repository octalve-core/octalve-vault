import test from "node:test";
import assert from "node:assert/strict";

import { normalizeEmail } from "../../src/domain/email.ts";
import { formatMoney, assertMinorAmount } from "../../src/domain/money.ts";
import { hasPermission, permissionsForRole } from "../../src/domain/permissions.ts";
import { generateOpaqueToken } from "../../src/domain/random.ts";
import { CURRENCIES, LOCALES } from "../../src/domain/constants.ts";

test("normalizes customer emails deterministically", () => {
  assert.equal(normalizeEmail("  Buyer@Example.COM  "), "buyer@example.com");
  assert.throws(() => normalizeEmail("not-an-email"));
});

test("money requires non-negative integer minor units", () => {
  assert.equal(assertMinorAmount(1500000), 1500000);
  assert.throws(() => assertMinorAmount(12.5));
  assert.throws(() => assertMinorAmount(-1));
});

test("formats NGN and USD from minor units", () => {
  assert.match(formatMoney(1500000, "NGN", "en"), /15,000/);
  assert.match(formatMoney(1250, "USD", "en"), /12\.50/);
});

test("supported locale and currency lists are explicit", () => {
  assert.deepEqual(LOCALES, ["en", "fr", "ar"]);
  assert.deepEqual(CURRENCIES, ["NGN", "USD", "GBP", "EUR"]);
});

test("support cannot mutate product pricing while super admin can", () => {
  assert.equal(hasPermission("SUPPORT", "product.price.write"), false);
  assert.equal(hasPermission("SUPER_ADMIN", "product.price.write"), true);
  assert.equal(hasPermission("AUDITOR", "audit.read"), true);
  assert.equal(hasPermission("AUDITOR", "download.revoke"), false);
  assert.ok(permissionsForRole("CATALOG_MANAGER").includes("product.publish"));
});

test("opaque tokens are high entropy URL-safe values", () => {
  const a = generateOpaqueToken(32);
  const b = generateOpaqueToken(32);
  assert.notEqual(a, b);
  assert.match(a, /^[A-Za-z0-9_-]+$/);
  assert.ok(a.length >= 40);
});
