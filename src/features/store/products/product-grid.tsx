"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";

import type { Locale } from "@/domain/constants";
import type {
  PublicCatalogueIndexInput,
  PublicCatalogueSort,
} from "@/features/store/catalogue/catalogue-index";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import type { PublicProduct } from "../catalogue/types";
import { useCart } from "../cart/use-cart";
import { ProductCard } from "./product-card";

const ALL_LABEL: Record<Locale, string> = {
  en: "All",
  fr: "Tous",
  ar: "الكل",
};

const SORT_KEYS: Array<{ value: PublicCatalogueSort; key: string }> = [
  { value: "featured", key: "shop.sortFeatured" },
  { value: "newest", key: "shop.sortNewest" },
  { value: "oldest", key: "shop.sortOldest" },
  { value: "title", key: "shop.sortTitle" },
];

function shopHref(
  locale: Locale,
  input: PublicCatalogueIndexInput,
  changes: Partial<PublicCatalogueIndexInput>,
): string {
  const next = { ...input, ...changes };
  const params = new URLSearchParams();
  if (next.query) params.set("q", next.query);
  if (next.category) params.set("category", next.category);
  if (next.availability) params.set("availability", next.availability);
  if (next.sort !== "featured") params.set("sort", next.sort);
  const query = params.toString();
  const base = localeHref(locale, "/products");
  return query ? `${base}?${query}` : base;
}

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

          <form
            method="get"
            action={localeHref(locale, "/products")}
            className="mt-9 grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_190px_190px_auto]"
          >
            {input.category ? <input type="hidden" name="category" value={input.category} /> : null}
            <label className="text-sm font-medium text-slate-700">
              {translate(messages, "shop.search")}
              <input
                name="q"
                defaultValue={input.query}
                placeholder={translate(messages, "shop.searchPlaceholder")}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 font-normal outline-none focus:border-[#0064E0]"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              {translate(messages, "shop.availability")}
              <select
                name="availability"
                defaultValue={input.availability ?? ""}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
              >
                <option value="">{translate(messages, "shop.allAvailability")}</option>
                <option value="available">{translate(messages, "shop.availableNow")}</option>
                <option value="coming-soon">{translate(messages, "shop.comingSoon")}</option>
              </select>
            </label>
            <label className="text-sm font-medium text-slate-700">
              {translate(messages, "shop.sort")}
              <select
                name="sort"
                defaultValue={input.sort}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 font-normal outline-none focus:border-[#0064E0]"
              >
                {SORT_KEYS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {translate(messages, option.key)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-medium text-white transition hover:bg-[#0064E0]"
              >
                {translate(messages, "shop.apply")}
              </button>
              <Link
                href={localeHref(locale, "/products")}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {translate(messages, "shop.clear")}
              </Link>
            </div>
          </form>

          {categories.length > 1 ? (
            <div
              className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-2"
              aria-label={translate(messages, "shop.categories")}
            >
              <Link
                href={shopHref(locale, input, { category: undefined })}
                aria-current={!input.category ? "page" : undefined}
                className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
                  !input.category
                    ? "border-[#0A84FF] bg-[#0A84FF] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-[#0A84FF]/40"
                }`}
              >
                {ALL_LABEL[locale]}
              </Link>
              {categories.map((category) => (
                <Link
                  key={category}
                  href={shopHref(locale, input, { category })}
                  aria-current={input.category === category ? "page" : undefined}
                  className={`inline-flex min-h-11 shrink-0 items-center rounded-full border px-4 text-sm font-medium transition ${
                    input.category === category
                      ? "border-[#0A84FF] bg-[#0A84FF] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-[#0A84FF]/40"
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>
          ) : null}

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
