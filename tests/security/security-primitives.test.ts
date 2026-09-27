import test from "node:test";
import assert from "node:assert/strict";

import { hashPassword, verifyPassword } from "../../src/server/auth/password.ts";
import { signSessionJwt, verifySessionJwt } from "../../src/server/auth/jwt.ts";
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
} from "../../src/server/auth/otp.ts";
import { hashBearerToken } from "../../src/server/auth/token-hash.ts";
import { rateWindowStart } from "../../src/server/security/rate-limit.ts";
import { verifyTurnstileResponse } from "../../src/server/security/turnstile.ts";

test("password hashes are salted and verify in constant-format storage", async () => {
  const a = await hashPassword("Strong passphrase 123!");
  const b = await hashPassword("Strong passphrase 123!");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("Strong passphrase 123!", a), true);
  assert.equal(await verifyPassword("wrong", a), false);
});

test("signed session JWT detects tampering and expiry", () => {
  const secret = "s".repeat(64);
  const token = signSessionJwt(
    { sub: "admin_1", sid: "session_1", role: "SUPER_ADMIN", kind: "admin" },
    secret,
    60,
    1_000,
  );
  const payload = verifySessionJwt(token, secret, 1_030);
  assert.equal(payload.sub, "admin_1");
  assert.equal(payload.sid, "session_1");
  assert.throws(() => verifySessionJwt(`${token.slice(0, -1)}x`, secret, 1_030));
  assert.throws(() => verifySessionJwt(token, secret, 1_061));
});

test("OTP generation is six digits and hashing binds challenge identity", () => {
  const otp = generateOtp();
  assert.match(otp, /^\d{6}$/);
  const secret = "o".repeat(64);
  const digest = hashOtp(otp, "challenge-1", "buyer@example.com", secret);
  assert.equal(verifyOtpHash(otp, "challenge-1", "buyer@example.com", secret, digest), true);
  assert.equal(verifyOtpHash(otp, "challenge-2", "buyer@example.com", secret, digest), false);
});

test("bearer token hashes are stable without storing raw tokens", () => {
  const secret = "d".repeat(64);
  assert.equal(hashBearerToken("abc", secret), hashBearerToken("abc", secret));
  assert.notEqual(hashBearerToken("abc", secret), hashBearerToken("abcd", secret));
});

test("rate limit windows are deterministic", () => {
  assert.equal(rateWindowStart(new Date("2026-09-26T17:12:45.000Z"), 60).toISOString(), "2026-09-26T17:12:00.000Z");
});

test("Turnstile response requires success and expected action", () => {
  assert.equal(verifyTurnstileResponse({ success: true, action: "vault_access" }, "vault_access"), true);
  assert.equal(verifyTurnstileResponse({ success: true, action: "admin_login" }, "vault_access"), false);
  assert.equal(verifyTurnstileResponse({ success: false, action: "vault_access" }, "vault_access"), false);
});
