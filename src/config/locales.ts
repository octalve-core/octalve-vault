import { LOCALES, type Locale } from "../domain/constants.ts";
import { DEFAULT_LOCALE } from "./app.ts";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined | null): Locale {
  return value && isLocale(value) ? value : DEFAULT_LOCALE;
}

export function isRtlLocale(locale: Locale): boolean {
  return locale === "ar";
}
