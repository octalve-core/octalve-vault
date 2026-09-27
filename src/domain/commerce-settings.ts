import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "../config/app.ts";
import { CURRENCIES, LOCALES, type CurrencyCode, type Locale } from "./constants.ts";

export type CommerceSettings = {
  defaultCurrency: CurrencyCode;
  defaultLocale: Locale;
  enabledCurrencies: CurrencyCode[];
  enabledLocales: Locale[];
};

export const DEFAULT_COMMERCE_SETTINGS: CommerceSettings = {
  defaultCurrency: DEFAULT_CURRENCY,
  defaultLocale: DEFAULT_LOCALE,
  enabledCurrencies: [...CURRENCIES],
  enabledLocales: [...LOCALES],
};

function uniqueSupported<T extends string>(input: unknown, supported: readonly T[]): T[] {
  if (!Array.isArray(input)) return [];
  const allowed = new Set<string>(supported);
  return [...new Set(input.filter((value): value is T => typeof value === "string" && allowed.has(value)))];
}

export function resolveCommerceSettings(value: unknown): CommerceSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      ...DEFAULT_COMMERCE_SETTINGS,
      enabledCurrencies: [...DEFAULT_COMMERCE_SETTINGS.enabledCurrencies],
      enabledLocales: [...DEFAULT_COMMERCE_SETTINGS.enabledLocales],
    };
  }
  const record = value as Record<string, unknown>;
  const enabledCurrencies = uniqueSupported(record.enabledCurrencies, CURRENCIES);
  const enabledLocales = uniqueSupported(record.enabledLocales, LOCALES);
  const defaultCurrency = typeof record.defaultCurrency === "string" && (CURRENCIES as readonly string[]).includes(record.defaultCurrency)
    ? record.defaultCurrency as CurrencyCode
    : null;
  const defaultLocale = typeof record.defaultLocale === "string" && (LOCALES as readonly string[]).includes(record.defaultLocale)
    ? record.defaultLocale as Locale
    : null;

  if (!defaultCurrency || !defaultLocale || !enabledCurrencies.includes(defaultCurrency) || !enabledLocales.includes(defaultLocale)) {
    return {
      ...DEFAULT_COMMERCE_SETTINGS,
      enabledCurrencies: [...DEFAULT_COMMERCE_SETTINGS.enabledCurrencies],
      enabledLocales: [...DEFAULT_COMMERCE_SETTINGS.enabledLocales],
    };
  }

  return { defaultCurrency, defaultLocale, enabledCurrencies, enabledLocales };
}
