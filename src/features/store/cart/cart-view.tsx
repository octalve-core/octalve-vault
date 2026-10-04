"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useMemo } from "react";

import type { Locale } from "@/domain/constants";
import { formatMoney } from "@/domain/money";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import type { PublicProduct } from "../catalogue/types";
import { useCurrency } from "../currency/use-currency";
import { ProductPriceDisplay } from "../products/product-price-display";
import { toProductViewModel } from "../products/product-view-model";
import { useCart } from "./use-cart";

export function CartView({ products, locale }: { products: PublicProduct[]; locale: Locale }) {
  const { ids, remove, clear } = useCart();
  const { currency } = useCurrency();
  const messages = getMessages(locale);

  const validProductIds = useMemo(() => new Set(products.map((product) => product.id)), [products]);
  const productsById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);

  useEffect(() => {
    for (const id of ids) {
      if (!validProductIds.has(id)) remove(id);
    }
  }, [ids, remove, validProductIds]);

  const selected = ids
    .map((id) => productsById.get(id))
    .filter((product): product is PublicProduct => Boolean(product));
  const items = selected.map((product) => toProductViewModel(product, currency, locale));
  const unavailable = items.some((item) => !item.purchaseAvailable);
  const subtotal = items.reduce((sum, item) => sum + (item.amountMinor ?? 0), 0);

  return (
    <section className="px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-[1100px]">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#0064E0]">
          {translate(messages, "cart.eyebrow")}
        </p>
        <h1 className="mt-4 text-4xl font-medium leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl">
          {translate(messages, "cart.reviewTitle")}
        </h1>

        {items.length === 0 ? (
          <div className="mt-10 rounded-[28px] border border-slate-200 bg-white p-8">
            <p className="text-lg font-medium text-slate-950">{translate(messages, "cart.empty")}</p>
            <p className="mt-3 max-w-2xl text-base leading-8 text-slate-600">
              {translate(messages, "cart.emptyBody")}
            </p>
            <Link
              href={localeHref(locale, "/products")}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0064E0] px-5 py-3 text-sm transition hover:bg-[#0057C2] text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
            >
              {translate(messages, "cart.continue")}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_340px]">
            <div className="rounded-[28px] border border-slate-200 bg-white p-5 sm:p-6 md:p-8">
              <div className="space-y-5">
                {items.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-5 sm:flex-row">
                      <div className="relative h-44 w-full overflow-hidden rounded-2xl bg-white sm:h-28 sm:w-36">
                        <Image
                          src={item.imagePath}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 640px) 100vw, 144px"
                        />
                      </div>

                      <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#0064E0]">
                            {item.category}
                          </p>
                          <h2 className="mt-2 text-lg font-medium text-slate-950">{item.title}</h2>
                          <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                            {item.shortDescription}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                          <ProductPriceDisplay view={item} compact />
                          <button
                            type="button"
                            onClick={() => remove(item.id)}
                            className="min-h-11 text-sm font-medium text-rose-600 transition-colors hover:text-rose-700"
                          >
                            {translate(messages, "cart.remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={localeHref(locale, "/products")}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  {translate(messages, "cart.continue")}
                </Link>
                <button
                  type="button"
                  onClick={clear}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                >
                  {translate(messages, "cart.clear")}
                </button>
              </div>
            </div>

            <aside className="h-fit rounded-[28px] border border-slate-200 bg-slate-50 p-6 md:p-8 lg:sticky lg:top-28">
              <h2 className="text-lg font-medium text-slate-950">{translate(messages, "cart.summary")}</h2>
              <div className="mt-6 space-y-4 text-sm text-slate-600">
                <div className="flex items-center justify-between gap-4">
                  <span>{translate(messages, "cart.products")}</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4 text-base font-medium text-slate-950">
                  <span>{translate(messages, "cart.subtotal")}</span>
                  <span>{formatMoney(subtotal, currency, locale)}</span>
                </div>
              </div>

              {unavailable ? (
                <p className="mt-4 text-sm leading-6 text-amber-700">
                  {translate(messages, "cart.currencyUnavailable")}
                </p>
              ) : null}

              <Link
                aria-disabled={unavailable}
                href={unavailable ? localeHref(locale, "/cart") : localeHref(locale, "/checkout")}
                className={`mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2 ${
                  unavailable
                    ? "pointer-events-none bg-slate-200 text-slate-400"
                    : "bg-[#0064E0] text-white hover:bg-[#0057C2]"
                }`}
              >
                {translate(messages, "cart.checkout")}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
