import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyPaystackWebhookSignature(rawBody: string, provided: string | null, secret: string): boolean {
  if (!provided || !secret) return false;
  const expected = Buffer.from(createHmac("sha512", secret).update(rawBody).digest("hex"), "utf8");
  const actual = Buffer.from(provided, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
