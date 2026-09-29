import type { Locale } from "@/domain/constants";

export function shouldShowMobileCartBar(
  pathname: string,
  locale: Locale,
): boolean {
  const root = `/${locale}`;
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/u, "") : pathname;

  return (
    normalized === root ||
    normalized === `${root}/products` ||
    normalized.startsWith(`${root}/products/`) ||
    normalized === `${root}/contact`
  );
}
