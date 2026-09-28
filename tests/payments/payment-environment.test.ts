import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("shared payment environment module and adapter contract exist", () => {
  assert.equal(existsSync("src/server/payments/environment.ts"), true);
  const types = readFileSync("src/server/payments/types.ts", "utf8");
  assert.match(types, /configuredEnvironment\(\):\s*PaymentEnvironment/);
  assert.match(types, /type PaymentVerification[\s\S]*environment\?:\s*PaymentEnvironment/);
  assert.match(types, /type PaymentRefundResult[\s\S]*environment:\s*PaymentEnvironment/);
});

import {
  assertStoredEnvironmentMatchesConfigured,
  assertVerifiedEnvironmentMatchesAttempt,
  parsePaymentEnvironment,
} from "../../src/server/payments/environment.ts";

test("payment environment parsing accepts only exact TEST or LIVE values", () => {
  assert.equal(parsePaymentEnvironment(" TEST ", "PAYMENT_ENV"), "TEST");
  assert.equal(parsePaymentEnvironment("LIVE", "PAYMENT_ENV"), "LIVE");
  assert.throws(() => parsePaymentEnvironment(undefined, "PAYMENT_ENV"), /PAYMENT_ENV/);
  assert.throws(() => parsePaymentEnvironment("test", "PAYMENT_ENV"), /PAYMENT_ENV/);
  assert.throws(() => parsePaymentEnvironment("PROD", "PAYMENT_ENV"), /PAYMENT_ENV/);
});

test("stored payment environment must match configured provider environment", () => {
  assert.doesNotThrow(() => assertStoredEnvironmentMatchesConfigured("TEST", "TEST"));
  assert.doesNotThrow(() => assertStoredEnvironmentMatchesConfigured("LIVE", "LIVE"));
  assert.throws(() => assertStoredEnvironmentMatchesConfigured("TEST", "LIVE"), /environment mismatch/i);
  assert.throws(() => assertStoredEnvironmentMatchesConfigured("LIVE", "TEST"), /environment mismatch/i);
});

test("verified payment environment is required when provider evidence is authoritative", () => {
  assert.doesNotThrow(() => assertVerifiedEnvironmentMatchesAttempt("TEST", "TEST", { required: true }));
  assert.throws(() => assertVerifiedEnvironmentMatchesAttempt("LIVE", "TEST", { required: true }), /environment mismatch/i);
  assert.throws(() => assertVerifiedEnvironmentMatchesAttempt("TEST", undefined, { required: true }), /environment/i);
  assert.doesNotThrow(() => assertVerifiedEnvironmentMatchesAttempt("TEST", undefined, { required: false }));
});
