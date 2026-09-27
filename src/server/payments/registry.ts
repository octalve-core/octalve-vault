import { booleanEnv, requiredEnv } from "../../config/env.server";
import { parseProviderCurrencies } from "../../config/payments";
import type { CurrencyCode, PaymentProviderId } from "../../domain/constants";
import type { PaymentProviderAdapter } from "./types";
import { FlutterwaveAdapter } from "./providers/flutterwave/adapter";
import { PaystackAdapter } from "./providers/paystack/adapter";

const adapters: Record<PaymentProviderId, PaymentProviderAdapter> = {
  PAYSTACK: new PaystackAdapter(),
  FLUTTERWAVE: new FlutterwaveAdapter(),
};

const currencyEnv: Record<PaymentProviderId, string> = {
  PAYSTACK: "PAYSTACK_ENABLED_CURRENCIES",
  FLUTTERWAVE: "FLUTTERWAVE_ENABLED_CURRENCIES",
};

export function enabledPaymentProviderIds(): PaymentProviderId[] {
  const enabled: PaymentProviderId[] = [];
  if (booleanEnv("PAYMENT_PROVIDER_PAYSTACK_ENABLED", false)) enabled.push("PAYSTACK");
  if (booleanEnv("PAYMENT_PROVIDER_FLUTTERWAVE_ENABLED", false)) enabled.push("FLUTTERWAVE");
  return enabled;
}

export function configuredProviderCurrencies(id: PaymentProviderId): CurrencyCode[] {
  return parseProviderCurrencies(id, requiredEnv(currencyEnv[id]));
}

export function getPaymentProvider(id: PaymentProviderId): PaymentProviderAdapter {
  if (!enabledPaymentProviderIds().includes(id)) throw new Error(`${id} is not enabled.`);
  return adapters[id];
}

export function availablePaymentProviders(currency: CurrencyCode): PaymentProviderId[] {
  return enabledPaymentProviderIds().filter((provider) => configuredProviderCurrencies(provider).includes(currency));
}
