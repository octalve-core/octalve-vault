import type { PaymentEnvironment } from "../../../../domain/constants";
import { parsePaymentEnvironment } from "../../environment.ts";

export function validateFlutterwaveEnvironment(
  rawEnvironment: string | undefined,
  secret: string | undefined,
): PaymentEnvironment {
  const environment = parsePaymentEnvironment(rawEnvironment, "FLUTTERWAVE_ENVIRONMENT");
  const key = secret?.trim() ?? "";
  const looksFlutterwave = key.startsWith("FLWSECK");
  const isTestKey = key.startsWith("FLWSECK_TEST");
  const valid = looksFlutterwave && (environment === "TEST" ? isTestKey : !isTestKey);
  if (!valid) throw new Error("Flutterwave environment and secret-key configuration mismatch.");
  return environment;
}
