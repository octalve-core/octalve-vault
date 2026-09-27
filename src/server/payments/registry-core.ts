import type { CurrencyCode, PaymentProviderId } from "../../domain/constants.ts";
import { PAYMENT_PROVIDER_CAPABILITIES } from "../../config/payments.ts";

export function providersForCurrency(
  currency: CurrencyCode,
  enabled: readonly PaymentProviderId[],
): PaymentProviderId[] {
  return enabled.filter((provider) => PAYMENT_PROVIDER_CAPABILITIES[provider].includes(currency));
}
