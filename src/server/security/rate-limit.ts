import { createHmac } from "node:crypto";
import { requiredEnv } from "../../config/env.server.ts";

export function rateWindowStart(now: Date, windowSeconds: number): Date {
  if (!Number.isSafeInteger(windowSeconds) || windowSeconds <= 0) {
    throw new Error("Rate limit window must be a positive integer.");
  }
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs);
}

export function hashRateLimitKey(value: string, secret: string): string {
  if (Buffer.byteLength(secret) < 32) throw new Error("Rate-limit secret must be at least 32 bytes.");
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export async function enforceRateLimit(input: {
  action: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
  now?: Date;
}): Promise<{ remaining: number; resetAt: Date }> {
  if (!Number.isSafeInteger(input.limit) || input.limit <= 0) throw new Error("Rate limit must be positive.");
  const { prisma } = await import("../../lib/prisma");
  const now = input.now ?? new Date();
  const windowStart = rateWindowStart(now, input.windowSeconds);
  const resetAt = new Date(windowStart.getTime() + input.windowSeconds * 1000);
  const keyHash = hashRateLimitKey(input.identifier, requiredEnv("RATE_LIMIT_SECRET"));

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { keyHash_action_windowStart: { keyHash, action: input.action, windowStart } },
    create: { keyHash, action: input.action, windowStart, expiresAt: resetAt, count: 1 },
    update: { count: { increment: 1 }, expiresAt: resetAt },
    select: { count: true },
  });

  if (bucket.count > input.limit) {
    const error = new Error("Too many requests. Please try again later.");
    Object.assign(error, { code: "RATE_LIMITED", resetAt });
    throw error;
  }
  return { remaining: Math.max(0, input.limit - bucket.count), resetAt };
}
