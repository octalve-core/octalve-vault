import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import { providersForCurrency } from "../../src/server/payments/registry-core.ts";
import { parseProviderCurrencies } from "../../src/config/payments.ts";
import { verifyPaystackWebhookSignature } from "../../src/server/payments/providers/paystack/signature.ts";
import { verifyFlutterwaveWebhookSignature } from "../../src/server/payments/providers/flutterwave/signature.ts";
import { assertVerificationMatchesAttempt } from "../../src/server/payments/verification.ts";
import { decimalMajorToMinor } from "../../src/domain/money.ts";
import { settlementDisposition } from "../../src/server/vault/settlement-core.ts";

test("provider currency configuration is account-aware and rejects unsupported values", () => {
  assert.deepEqual(parseProviderCurrencies("PAYSTACK", "NGN,USD,NGN"), ["NGN", "USD"]);
  assert.deepEqual(parseProviderCurrencies("FLUTTERWAVE", "NGN,EUR"), ["NGN", "EUR"]);
  assert.throws(() => parseProviderCurrencies("PAYSTACK", "NGN,EUR"), /unsupported/i);
  assert.throws(() => parseProviderCurrencies("PAYSTACK", ""), /at least one/i);
});

test("provider capability filtering is currency-aware", () => {
  assert.deepEqual(providersForCurrency("NGN", ["PAYSTACK", "FLUTTERWAVE"]), ["PAYSTACK", "FLUTTERWAVE"]);
  assert.deepEqual(providersForCurrency("EUR", ["PAYSTACK", "FLUTTERWAVE"]), ["FLUTTERWAVE"]);
  assert.deepEqual(providersForCurrency("GBP", ["PAYSTACK"]), []);
});

test("Paystack webhook signature is HMAC SHA512 of raw body", () => {
  const raw = '{"event":"charge.success"}';
  const secret = "test_paystack_webhook_secret";
  const sig = createHmac("sha512", secret).update(raw).digest("hex");
  assert.equal(verifyPaystackWebhookSignature(raw, sig, secret), true);
  assert.equal(verifyPaystackWebhookSignature(raw + " ", sig, secret), false);
});

test("Flutterwave webhook supports current HMAC signature and legacy secret hash", () => {
  const raw = '{"event":"charge.completed"}';
  const secret = "flutterwave_webhook_secret";
  const current = createHmac("sha256", secret).update(raw).digest("base64");
  assert.equal(verifyFlutterwaveWebhookSignature(raw, { currentSignature: current }, secret), true);
  assert.equal(verifyFlutterwaveWebhookSignature(raw, { legacySignature: secret }, secret), true);
  assert.equal(verifyFlutterwaveWebhookSignature(raw, { currentSignature: "invalid" }, secret), false);
});

test("Flutterwave-style major amounts convert exactly to minor units", () => {
  assert.equal(decimalMajorToMinor("15000"), 1_500_000);
  assert.equal(decimalMajorToMinor("12.50"), 1250);
  assert.equal(decimalMajorToMinor(12.5), 1250);
  assert.throws(() => decimalMajorToMinor("12.345"));
});

test("verified payment must match reference, amount, currency and email", () => {
  const attempt = {
    reference: "OV-123",
    amountMinor: 1_500_000,
    currency: "NGN" as const,
    email: "buyer@example.com",
  };
  const verified = {
    successful: true,
    reference: "OV-123",
    amountMinor: 1_500_000,
    currency: "NGN" as const,
    email: "BUYER@example.com",
  };
  assert.doesNotThrow(() => assertVerificationMatchesAttempt(attempt, verified));
  assert.throws(() => assertVerificationMatchesAttempt(attempt, { ...verified, amountMinor: 1_499_900 }));
  assert.throws(() => assertVerificationMatchesAttempt(attempt, { ...verified, currency: "USD" as const }));
  assert.throws(() => assertVerificationMatchesAttempt(attempt, { ...verified, reference: "other" }));
});

test("already successful attempts are idempotent no-op settlements", () => {
  assert.equal(settlementDisposition("SUCCEEDED", "PAID"), "ALREADY_SETTLED");
  assert.equal(settlementDisposition("INITIALIZED", "INITIALIZED"), "SETTLE");
});

import { mapFlutterwaveRefundStatus, mapPaystackRefundStatus } from "../../src/server/payments/refund-status.ts";

test("provider refund status mapping does not treat Flutterwave initiated completed as final success", () => {
  assert.equal(mapFlutterwaveRefundStatus("completed"), "PROCESSING");
  assert.equal(mapFlutterwaveRefundStatus("completed-mpgs"), "SUCCEEDED");
  assert.equal(mapFlutterwaveRefundStatus("processing"), "PROCESSING");
  assert.equal(mapPaystackRefundStatus("processed"), "SUCCEEDED");
  assert.equal(mapPaystackRefundStatus("pending"), "PROCESSING");
  assert.equal(mapPaystackRefundStatus("needs-attention"), "PROCESSING");
});
