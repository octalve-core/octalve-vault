import { createHmac, timingSafeEqual } from "node:crypto";

function safeEqualText(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

export function verifyFlutterwaveWebhookSignature(
  rawBody: string,
  signatures: { currentSignature?: string | null; legacySignature?: string | null },
  secretHash: string,
): boolean {
  if (!secretHash) return false;
  if (signatures.currentSignature) {
    const expected = createHmac("sha256", secretHash).update(rawBody).digest("base64");
    return safeEqualText(signatures.currentSignature, expected);
  }
  if (signatures.legacySignature) {
    return safeEqualText(signatures.legacySignature, secretHash);
  }
  return false;
}
