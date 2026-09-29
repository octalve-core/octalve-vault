"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";

import type { Locale } from "@/domain/constants";
import { formatMoney } from "@/domain/money";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import { useCart } from "../cart/use-cart";
import type { PublicProduct } from "../catalogue/types";
import { useCurrency } from "../currency/use-currency";
import { toProductViewModel } from "../products/product-view-model";
import { shouldShowMobileCartBar } from "./mobile-cart-visibility";

export function CartCheckoutBar({
  products,
  locale,
}: {
  products: PublicProduct[];
  locale: Locale;
}) {
  const pathname = usePathname();
  const { ids, remove } = useCart();
  const { currency } = useCurrency();
  const messages = getMessages(locale);

  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  useEffect(() => {
    for (const id of ids) {
      if (!productsById.has(id)) remove(id);
    }
  }, [ids, productsById, remove]);

  const selected = ids
    .map((id) => productsById.get(id))
    .filter((product): product is PublicProduct => Boolean(product));

  const items = selected.map((product) =>
    toProductViewModel(product, currency, locale),
  );
  const unavailable = items.some((item) => !item.purchaseAvailable);
  const subtotal = items.reduce(
    (sum, item) => sum + (item.amountMinor ?? 0),
    0,
  );

  if (!shouldShowMobileCartBar(pathname, locale) || items.length === 0) {
    return null;
  }

  const cartLabel = translate(messages, "nav.cart");

  return (
    <aside
      aria-label={translate(messages, "cart.summary")}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:px-5 lg:px-6"
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-xl items-center gap-3 rounded-2xl border border-white/10 bg-[#000A16] p-3 text-white shadow-[0_18px_55px_rgba(0,10,22,0.28)] sm:max-w-[720px] sm:gap-4 sm:p-4 lg:max-w-[880px]">
        <Link
          href={localeHref(locale, "/cart")}
          aria-label={`${cartLabel} (${items.length})`}
          className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
        >
          <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
          <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#E61525] px-1 text-[10px] font-medium leading-none text-white">
            {items.length}
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-white/65">
            {translate(messages, "cart.subtotal")}
          </p>
          <p className="mt-0.5 truncate text-base font-medium text-white">
            {unavailable
              ? messages["checkout.unavailable"]
              : formatMoney(subtotal, currency, locale)}
          </p>
        </div>

        {!unavailable ? (
          <Link
            href={localeHref(locale, "/checkout")}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#0064E0] px-3.5 text-sm font-medium text-white transition hover:bg-[#0057C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#000A16]"
          >
            <span className="hidden min-[390px]:inline">
              {translate(messages, "cart.checkout")}
            </span>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
