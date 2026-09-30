"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import type { Locale } from "@/domain/constants";
import type { PublicCatalogueIndexInput } from "@/features/store/catalogue/catalogue-index";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import type { PublicProduct } from "../catalogue/types";
import { useCart } from "../cart/use-cart";
import { ProductCard } from "./product-card";
import { ShopDiscoveryControls } from "./shop-discovery-controls";

export function ProductGrid({
  products,
  categories,
  input,
  locale,
}: {
  products: PublicProduct[];
  categories: string[];
  input: PublicCatalogueIndexInput;
  locale: Locale;
}) {
  const messages = getMessages(locale);
  const cart = useCart();

  return (
    <>
      <section className="px-4 py-16 sm:px-6 md:py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#0064E0]">
                {translate(messages, "shop.eyebrow")}
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-medium leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl md:text-6xl">
                {translate(messages, "shop.title")}
              </h1>
              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                {translate(messages, "shop.body")}
              </p>
            </div>

            <Link
              href={localeHref(locale, "/cart")}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-900 transition hover:border-[#0A84FF]/40 hover:text-[#0064E0]"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              {translate(messages, "nav.cart")}
              {cart.count > 0 ? ` (${cart.count})` : ""}
            </Link>
          </div>

          <ShopDiscoveryControls
            categories={categories}
            input={input}
            locale={locale}
          />

          <p className="mt-5 text-sm text-slate-500">
            {products.length} {translate(messages, "shop.results")}
          </p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-[1200px]">
          {products.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-12 text-center text-sm text-slate-500">
              {translate(messages, "shop.empty")}
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
