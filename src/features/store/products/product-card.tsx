"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Plus } from "lucide-react";
import { useState } from "react";

import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import type { PublicProduct } from "../catalogue/types";
import { useCart } from "../cart/use-cart";
import { useCurrency } from "../currency/use-currency";
import { ProductDetailModal } from "./product-detail-modal";
import { toProductViewModel } from "./product-view-model";

export function ProductCard({ product, locale }: { product: PublicProduct; locale: Locale }) {
  const messages = getMessages(locale);
  const cart = useCart();
  const { currency } = useCurrency();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const view = toProductViewModel(product, currency, locale);
  const added = cart.has(product.id);
  const comingSoon = view.status === "COMING_SOON";

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(15,23,42,0.08)]">
        <Link
          href={localeHref(locale, `/products/${view.slug}`)}
          className="relative block aspect-[4/3] overflow-hidden bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
          aria-label={view.title}
        >
          <Image
            src={view.imagePath}
            alt={view.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
          {comingSoon ? (
            <span className="absolute left-4 top-4 rounded-full bg-slate-950/90 px-3 py-1.5 text-xs font-medium text-white">
              {translate(messages, "product.coming")}
            </span>
          ) : null}
        </Link>

        <div className="flex flex-1 flex-col p-6">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#0064E0]">
            {view.category}
          </p>
          <h3 className="mt-3 text-xl font-medium tracking-[-0.025em] text-slate-950">
            <Link href={localeHref(locale, `/products/${view.slug}`)} className="hover:text-[#0064E0]">
              {view.title}
            </Link>
          </h3>

          <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="me-2 inline-flex font-medium text-[#0A84FF] transition-colors hover:text-[#0064E0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
            >
              {translate(messages, "product.details")} →
            </button>
            <span>{view.shortDescription}</span>
          </p>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-base font-medium text-slate-950">
              {view.formattedPrice ?? translate(messages, "product.unavailableCurrency")}
            </p>

            {view.purchaseAvailable && added ? (
              <Link
                href={localeHref(locale, "/cart")}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                {translate(messages, "product.added")}
              </Link>
            ) : (
              <button
                type="button"
                disabled={!view.purchaseAvailable}
                onClick={() => { if (view.purchaseAvailable) cart.add(view.id); }}
                className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                  view.purchaseAvailable
                    ? "bg-[#0A84FF] text-white hover:bg-[#0064E0]"
                    : "cursor-not-allowed bg-slate-100 text-slate-400"
                }`}
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                {comingSoon
                  ? translate(messages, "product.coming")
                  : view.purchaseAvailable
                    ? translate(messages, "product.add")
                    : translate(messages, "product.unavailableCurrency")}
              </button>
            )}
          </div>
        </div>
      </article>

      <ProductDetailModal
        product={view}
        locale={locale}
        open={detailsOpen}
        added={added}
        onAdd={() => { if (view.purchaseAvailable) cart.add(view.id); }}
        onClose={() => setDetailsOpen(false)}
      />
    </>
  );
}
