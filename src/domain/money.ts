import type { CurrencyCode, Locale } from "./constants.ts";

const INTL_LOCALE: Record<Locale, string> = {
  en: "en-NG",
  fr: "fr-FR",
  ar: "ar-EG",
};

export function assertMinorAmount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error("Money amounts must be non-negative safe integers in minor units.");
  }
  return value;
}

export function formatMoney(
  amountMinor: number,
  currency: CurrencyCode,
  locale: Locale,
): string {
  assertMinorAmount(amountMinor);
  return new Intl.NumberFormat(INTL_LOCALE[locale], {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amountMinor / 100);
}


export function decimalMajorToMinor(value: string | number): number {
  const text = typeof value === "number" ? String(value) : value.trim();
  if (!/^\d+(?:\.\d{1,2})?$/.test(text)) {
    throw new Error("Money value must have no more than two decimal places.");
  }
  const [whole, fraction = ""] = text.split(".");
  const minor = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return assertMinorAmount(minor);
}

export function minorToMajorString(amountMinor: number): string {
  assertMinorAmount(amountMinor);
  const whole = Math.floor(amountMinor / 100);
  const cents = amountMinor % 100;
  if (cents === 0) return String(whole);
  if (cents % 10 === 0) return `${whole}.${cents / 10}`;
  return `${whole}.${String(cents).padStart(2, "0")}`;
}
