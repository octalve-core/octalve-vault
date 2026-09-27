import { randomBytes } from "node:crypto";

export function generatePaymentReference(now = Date.now()): string {
  return `OV-${now.toString(36).toUpperCase()}-${randomBytes(8).toString("hex").toUpperCase()}`;
}
