import type { PaymentEnvironment } from "../../../../domain/constants";
import { parsePaymentEnvironment } from "../../environment.ts";

export function paymentEnvironmentFromPaystackDomain(
  domain: string | null | undefined,
): PaymentEnvironment | undefined {
  const normalized = domain?.trim().toLowerCase();
  if (normalized === "test") return "TEST";
  if (normalized === "live") return "LIVE";
  return undefined;
}

export function validatePaystackEnvironment(
  rawEnvironment: string | undefined,
  secret: string | undefined,
): PaymentEnvironment {
  const environment = parsePaymentEnvironment(rawEnvironment, "PAYSTACK_ENVIRONMENT");
  const key = secret?.trim() ?? "";
  const valid = environment === "TEST" ? key.startsWith("sk_test_") : key.startsWith("sk_live_");
  if (!valid) throw new Error("Paystack environment and secret-key configuration mismatch.");
  return environment;
}
