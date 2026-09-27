export const GENERIC_ACCESS_RESPONSE = "If eligible purchases exist for this email, a verification code has been sent.";

export type ChallengeState = {
  attempts: number;
  maxAttempts: number;
  expiresAt: Date;
  usedAt: Date | null;
  lockedAt: Date | null;
};

export function challengeCanBeVerified(challenge: ChallengeState, now = new Date()): boolean {
  return !challenge.usedAt && !challenge.lockedAt && challenge.attempts < challenge.maxAttempts && challenge.expiresAt.getTime() > now.getTime();
}

export function nextChallengeAttempt(attempts: number, maxAttempts: number): { attempts: number; lock: boolean } {
  const next = attempts + 1;
  return { attempts: next, lock: next >= maxAttempts };
}

export function isGrantEligible(
  grant: { revokedAt: Date | null; expiresAt: Date | null; orderStatus: string },
  now = new Date(),
): boolean {
  const paid = ["PAID", "FULFILLED", "PARTIALLY_FULFILLED"].includes(grant.orderStatus);
  return !grant.revokedAt && (!grant.expiresAt || grant.expiresAt.getTime() > now.getTime()) && paid;
}
