import { timingSafeEqual } from "node:crypto";
import { generateOpaqueToken } from "../../domain/random.ts";
import { hashBearerToken } from "../auth/token-hash.ts";

export type DownloadTicketInspection = "VALID" | "INVALID" | "EXPIRED";

export function createDownloadTicketToken(input: { secret: string; bytes?: number }): {
  token: string;
  tokenHash: string;
} {
  const token = generateOpaqueToken(input.bytes ?? 32);
  return { token, tokenHash: hashBearerToken(token, input.secret) };
}

export function inspectDownloadTicket(input: {
  rawToken: string;
  storedTokenHash: string;
  secret: string;
  expiresAt: Date;
  now?: Date;
}): DownloadTicketInspection {
  const now = input.now ?? new Date();
  if (Number.isNaN(input.expiresAt.getTime()) || input.expiresAt.getTime() <= now.getTime()) return "EXPIRED";

  let candidateHash: string;
  try {
    candidateHash = hashBearerToken(input.rawToken, input.secret);
  } catch {
    return "INVALID";
  }

  const candidate = Buffer.from(candidateHash, "utf8");
  const stored = Buffer.from(input.storedTokenHash, "utf8");
  if (candidate.length !== stored.length) return "INVALID";
  return timingSafeEqual(candidate, stored) ? "VALID" : "INVALID";
}
