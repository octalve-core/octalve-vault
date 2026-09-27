import { normalizeEmail } from "../../domain/email.ts";
import type { CurrencyCode } from "../../domain/constants.ts";

export type ExpectedPayment = {
  reference: string;
  amountMinor: number;
  currency: CurrencyCode;
  email: string;
};

export type VerifiedPayment = {
  successful: boolean;
  reference: string;
  amountMinor?: number;
  currency?: CurrencyCode;
  email?: string | null;
};

export function assertVerificationMatchesAttempt(expected: ExpectedPayment, verified: VerifiedPayment): void {
  if (!verified.successful) throw new Error("Payment is not successful.");
  if (verified.reference !== expected.reference) throw new Error("Payment reference does not match the attempt.");
  if (verified.amountMinor !== expected.amountMinor) throw new Error("Payment amount does not match the order.");
  if (verified.currency !== expected.currency) throw new Error("Payment currency does not match the order.");
  if (verified.email && normalizeEmail(verified.email) !== normalizeEmail(expected.email)) {
    throw new Error("Payment customer does not match the order.");
  }
}
