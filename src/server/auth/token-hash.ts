import { createHmac } from "node:crypto";

export function hashBearerToken(token: string, secret: string): string {
  if (!token || token.length > 2048) throw new Error("Invalid bearer token.");
  if (Buffer.byteLength(secret) < 32) throw new Error("Token hashing secret must be at least 32 bytes.");
  return createHmac("sha256", secret).update(token).digest("base64url");
}
