import test from "node:test";
import assert from "node:assert/strict";
import {
  GENERIC_ACCESS_RESPONSE,
  challengeCanBeVerified,
  isGrantEligible,
  nextChallengeAttempt,
} from "../../src/server/vault/customer-access-core.ts";

test("customer access request copy is deliberately generic", () => {
  assert.equal(GENERIC_ACCESS_RESPONSE, "If eligible purchases exist for this email, a verification code has been sent.");
});

test("challenge verification fails closed for used, locked, expired or exhausted challenges", () => {
  const now = new Date("2026-09-26T17:00:00Z");
  const base = { attempts: 1, maxAttempts: 6, expiresAt: new Date("2026-09-26T17:10:00Z"), usedAt: null, lockedAt: null };
  assert.equal(challengeCanBeVerified(base, now), true);
  assert.equal(challengeCanBeVerified({ ...base, usedAt: now }, now), false);
  assert.equal(challengeCanBeVerified({ ...base, lockedAt: now }, now), false);
  assert.equal(challengeCanBeVerified({ ...base, expiresAt: now }, now), false);
  assert.equal(challengeCanBeVerified({ ...base, attempts: 6 }, now), false);
});

test("wrong OTP increments attempts and locks exactly at the maximum", () => {
  assert.deepEqual(nextChallengeAttempt(4, 6), { attempts: 5, lock: false });
  assert.deepEqual(nextChallengeAttempt(5, 6), { attempts: 6, lock: true });
});

test("download grants require active entitlement and paid order", () => {
  const now = new Date("2026-09-26T17:00:00Z");
  assert.equal(isGrantEligible({ revokedAt: null, expiresAt: null, orderStatus: "PAID" }, now), true);
  assert.equal(isGrantEligible({ revokedAt: now, expiresAt: null, orderStatus: "PAID" }, now), false);
  assert.equal(isGrantEligible({ revokedAt: null, expiresAt: new Date("2026-09-26T16:59:59Z"), orderStatus: "PAID" }, now), false);
  assert.equal(isGrantEligible({ revokedAt: null, expiresAt: null, orderStatus: "PENDING" }, now), false);
});
