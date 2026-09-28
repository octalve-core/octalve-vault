import type { PaymentEnvironment } from "../../domain/constants";

export function parsePaymentEnvironment(raw: string | undefined, name: string): PaymentEnvironment {
  const value = raw?.trim();
  if (value === "TEST" || value === "LIVE") return value;
  throw new Error(`${name} must be configured as TEST or LIVE.`);
}

export function assertStoredEnvironmentMatchesConfigured(
  stored: PaymentEnvironment,
  configured: PaymentEnvironment,
): void {
  if (stored !== configured) throw new Error("Payment environment mismatch.");
}

export function assertVerifiedEnvironmentMatchesAttempt(
  attempt: PaymentEnvironment,
  verified: PaymentEnvironment | undefined,
  options: { required: boolean },
): void {
  if (verified === undefined) {
    if (options.required) throw new Error("Verified payment environment is required.");
    return;
  }
  if (verified !== attempt) throw new Error("Payment environment mismatch.");
}
