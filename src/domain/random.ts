import { randomBytes } from "node:crypto";

export function generateOpaqueToken(bytes = 32): string {
  if (!Number.isInteger(bytes) || bytes < 16 || bytes > 128) {
    throw new Error("Token entropy must be between 16 and 128 bytes.");
  }
  return randomBytes(bytes).toString("base64url");
}
