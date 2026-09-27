import test from "node:test";
import assert from "node:assert/strict";
import { notificationDue, notificationDedupeKey } from "../../src/server/notifications/outbox-core.ts";
import { assertRefundAmount, refundOrderDisposition } from "../../src/server/refunds/refund-core.ts";
import { healthPayload } from "../../src/server/health/health-core.ts";

test("notification outbox dedupe keys are stable and due rules fail closed", () => {
  assert.equal(notificationDedupeKey("DOWNLOAD_READY", "order_123"), "download-ready:order_123");
  const now = new Date("2026-09-26T20:00:00Z");
  assert.equal(notificationDue({ status: "PENDING", nextAttemptAt: null, attempts: 0 }, now), true);
  assert.equal(notificationDue({ status: "FAILED", nextAttemptAt: new Date("2026-09-26T19:59:00Z"), attempts: 2 }, now), true);
  assert.equal(notificationDue({ status: "PROCESSING", nextAttemptAt: null, attempts: 0 }, now), false);
  assert.equal(notificationDue({ status: "SENT", nextAttemptAt: null, attempts: 0 }, now), false);
  assert.equal(notificationDue({ status: "FAILED", nextAttemptAt: new Date("2026-09-26T20:01:00Z"), attempts: 2 }, now), false);
  assert.equal(notificationDue({ status: "FAILED", nextAttemptAt: null, attempts: 5 }, now), false);
});

test("refund amount cannot exceed the unsettled refundable balance", () => {
  assert.equal(assertRefundAmount(10_000, 0, 10_000), 10_000);
  assert.equal(assertRefundAmount(10_000, 2_500, 5_000), 5_000);
  assert.throws(() => assertRefundAmount(10_000, 2_500, 7_501), /refundable/i);
  assert.throws(() => assertRefundAmount(10_000, 0, 0), /positive/i);
});

test("full refund revokes delivery while partial refund preserves entitlement", () => {
  assert.equal(refundOrderDisposition(10_000, 10_000), "FULL");
  assert.equal(refundOrderDisposition(10_000, 4_000), "PARTIAL");
});

test("health payload exposes service state without infrastructure or secret details", () => {
  const payload = healthPayload("ok", "2026-09-26T20:00:00.000Z");
  assert.deepEqual(payload, { status: "ok", service: "octalve-vault", timestamp: "2026-09-26T20:00:00.000Z" });
  const serialized = JSON.stringify(payload).toLowerCase();
  for (const forbidden of ["database_url", "secret", "r2_", "paystack", "flutterwave"]) assert.equal(serialized.includes(forbidden), false);
});
