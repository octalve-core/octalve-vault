import type { CurrencyCode, PaymentProviderId } from "../domain/constants";

export const PAYMENT_PROVIDER_CAPABILITIES: Record<PaymentProviderId, readonly CurrencyCode[]> = {
  PAYSTACK: ["NGN", "USD"],
  FLUTTERWAVE: ["NGN", "USD", "GBP", "EUR"],
};

export function parseProviderCurrencies(provider: PaymentProviderId, raw: string): CurrencyCode[] {
  const supported = PAYMENT_PROVIDER_CAPABILITIES[provider];
  const requested = [...new Set(raw.split(",").map((value) => value.trim().toUpperCase()).filter(Boolean))];
  if (requested.length === 0) throw new Error(`${provider} must enable at least one currency.`);
  const unsupported = requested.filter((currency) => !(supported as readonly string[]).includes(currency));
  if (unsupported.length > 0) throw new Error(`${provider} has unsupported configured currencies: ${unsupported.join(", ")}.`);
  return requested as CurrencyCode[];
}
