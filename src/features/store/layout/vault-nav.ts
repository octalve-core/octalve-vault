import type { Locale } from "../../../domain/constants.ts";
import { getMessages, translate } from "../../../i18n/messages.ts";
import { localeHref } from "../../../i18n/routing.ts";

export type VaultNavItem = Readonly<{
  key: "vault" | "shop" | "cart" | "checkout" | "contact";
  label: string;
  path: "/" | "/products" | "/cart" | "/checkout" | "/contact";
  href: string;
}>;

const NAV_DEFINITION = [
  { key: "vault", messageKey: "nav.vault", path: "/" },
  { key: "shop", messageKey: "nav.shop", path: "/products" },
  { key: "cart", messageKey: "nav.cart", path: "/cart" },
  { key: "checkout", messageKey: "nav.checkout", path: "/checkout" },
  { key: "contact", messageKey: "nav.contact", path: "/contact" },
] as const;

export function buildVaultNav(locale: Locale): readonly VaultNavItem[] {
  const messages = getMessages(locale);
  return NAV_DEFINITION.map((item) => ({
    key: item.key,
    label: translate(messages, item.messageKey),
    path: item.path,
    href: localeHref(locale, item.path),
  }));
}

export function isVaultNavActive(pathname: string, href: string): boolean {
  const segments = href.split("/").filter(Boolean);
  if (segments.length === 1) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
