import type { Locale } from "../../domain/constants.ts";
import { OTP_MAX_ATTEMPTS, OTP_TTL_SECONDS } from "../../config/app.ts";
import { requiredEnv } from "../../config/env.server.ts";
import { normalizeEmail } from "../../domain/email.ts";
import { generateOpaqueToken } from "../../domain/random.ts";
import { prisma } from "../../lib/prisma";
import { generateOtp, hashOtp, verifyOtpHash } from "../auth/otp.ts";
import { createCustomerSession } from "../auth/customer-session.ts";
import { sendVaultAccessOtpEmail } from "../notifications/resend.ts";
import { enforceRateLimit, hashRateLimitKey } from "../security/rate-limit.ts";
import { requestFingerprint, requestIp } from "../security/request-fingerprint.ts";
import { verifyTurnstileToken } from "../security/turnstile.ts";
import { GENERIC_ACCESS_RESPONSE, challengeCanBeVerified, nextChallengeAttempt } from "./customer-access-core.ts";

export async function requestCustomerVaultAccess(input: { email: string; locale: Locale; turnstileToken: string; request: Request; now?: Date }) {
  const now = input.now ?? new Date();
  const email = normalizeEmail(input.email);
  const ip = requestIp(input.request) ?? "unknown";
  await enforceRateLimit({ action: "vault.access.request", identifier: `${ip}:${email}`, limit: 5, windowSeconds: 3600, now });
  await verifyTurnstileToken({ token: input.turnstileToken, action: "vault_access", remoteIp: requestIp(input.request), idempotencyKey: generateOpaqueToken(18) });

  const challengeId = `vac_${generateOpaqueToken(18)}`;
  const otp = generateOtp();
  const otpHash = hashOtp(otp, challengeId, email, requiredEnv("OTP_SECRET"));
  const expiresAt = new Date(now.getTime() + OTP_TTL_SECONDS * 1000);

  await prisma.$transaction([
    prisma.customerAccessChallenge.updateMany({ where: { email, usedAt: null, lockedAt: null }, data: { lockedAt: now } }),
    prisma.customerAccessChallenge.create({ data: { id: challengeId, email, otpHash, maxAttempts: OTP_MAX_ATTEMPTS, expiresAt, lastSentAt: now } }),
  ]);

  const eligibleCount = await prisma.downloadGrant.count({
    where: {
      email,
      revokedAt: null,
      AND: [{ OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }],
      orderItem: { order: { status: { in: ["PAID", "FULFILLED", "PARTIALLY_FULFILLED"] } } },
    },
  });

  if (eligibleCount > 0) {
    try {
      await sendVaultAccessOtpEmail({ email, otp, locale: input.locale });
    } catch (error) {
      const fingerprint = requestFingerprint(input.request);
      await prisma.securityEvent.create({
        data: {
          type: "VAULT_OTP_EMAIL_FAILED",
          severity: "HIGH",
          emailHash: hashRateLimitKey(email, requiredEnv("RATE_LIMIT_SECRET")),
          ipHash: fingerprint.ipHash,
          userAgentHash: fingerprint.userAgentHash,
          metadata: { message: error instanceof Error ? error.message : "Email delivery failed" },
        },
      });
    }
  }
  return { message: GENERIC_ACCESS_RESPONSE, challengeId };
}

export async function verifyCustomerVaultOtp(input: { challengeId: string; otp: string; request: Request; now?: Date }) {
  const now = input.now ?? new Date();
  const ip = requestIp(input.request) ?? "unknown";
  await enforceRateLimit({ action: "vault.access.verify", identifier: `${ip}:${input.challengeId}`, limit: 10, windowSeconds: 900, now });

  const challenge = await prisma.customerAccessChallenge.findUnique({ where: { id: input.challengeId } });
  if (!challenge || !challengeCanBeVerified(challenge, now)) throw new Error("Invalid or expired verification code.");
  const valid = verifyOtpHash(input.otp, challenge.id, challenge.email, requiredEnv("OTP_SECRET"), challenge.otpHash);
  if (!valid) {
    const next = nextChallengeAttempt(challenge.attempts, challenge.maxAttempts);
    await prisma.customerAccessChallenge.update({ where: { id: challenge.id }, data: { attempts: next.attempts, lockedAt: next.lock ? now : null } });
    throw new Error("Invalid or expired verification code.");
  }

  await prisma.customerAccessChallenge.update({ where: { id: challenge.id }, data: { usedAt: now } });
  return createCustomerSession({ email: challenge.email, request: input.request, now });
}
