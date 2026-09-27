import { CURRENCIES, type CurrencyCode } from "../domain/constants.ts";
import { DEFAULT_CURRENCY } from "./app.ts";

export function isCurrency(value: string): value is CurrencyCode {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function resolveCurrency(value: string | undefined | null): CurrencyCode {
  return value && isCurrency(value) ? value : DEFAULT_CURRENCY;
}
