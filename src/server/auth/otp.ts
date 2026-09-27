import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { normalizeEmail } from "../../domain/email.ts";

function otpMaterial(otp: string, challengeId: string, email: string): string {
  return `${challengeId}:${normalizeEmail(email)}:${otp}`;
}

export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashOtp(otp: string, challengeId: string, email: string, secret: string): string {
  if (!/^\d{6}$/.test(otp)) throw new Error("OTP must contain exactly six digits.");
  if (Buffer.byteLength(secret) < 32) throw new Error("OTP secret must be at least 32 bytes.");
  return createHmac("sha256", secret).update(otpMaterial(otp, challengeId, email)).digest("base64url");
}

export function verifyOtpHash(
  otp: string,
  challengeId: string,
  email: string,
  secret: string,
  expectedDigest: string,
): boolean {
  try {
    const actual = Buffer.from(hashOtp(otp, challengeId, email, secret), "base64url");
    const expected = Buffer.from(expectedDigest, "base64url");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
