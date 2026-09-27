import type { Locale } from "../domain/constants.ts";

export function localeHref(locale: Locale, pathname: string): string {
  const normalized = pathname === "/" ? "" : `/${pathname.replace(/^\/+|\/+$/g, "")}`;
  return `/${locale}${normalized}`;
}

export function replaceLocaleInPath(pathname: string, locale: Locale): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "en" || parts[0] === "fr" || parts[0] === "ar") parts.shift();
  return `/${[locale, ...parts].join("/")}`;
}
