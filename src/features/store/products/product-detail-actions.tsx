"use client";

import { Check, ShoppingBag } from "lucide-react";

import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import type { PublicProduct } from "../catalogue/types";
import { useCart } from "../cart/use-cart";
import { useCurrency } from "../currency/use-currency";
import { toProductViewModel } from "./product-view-model";

export function ProductDetailActions({ product, locale }: { product: PublicProduct; locale: Locale }) {
  const cart = useCart();
  const { currency } = useCurrency();
  const messages = getMessages(locale);
  const view = toProductViewModel(product, currency, locale);
  const added = cart.has(product.id);
  const comingSoon = view.status === "COMING_SOON";

  return (
    <div className="mt-8 rounded-[24px] border border-slate-200 bg-slate-50 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{view.currency}</p>
      <p className="mt-1 text-3xl font-medium tracking-[-0.04em] text-slate-950">
        {view.formattedPrice ?? translate(messages, "product.unavailableCurrency")}
      </p>
      {comingSoon ? (
        <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800">
          {translate(messages, "product.coming")}
        </p>
      ) : null}
      <button
        type="button"
        disabled={!view.purchaseAvailable || added}
        onClick={() => { if (view.purchaseAvailable) cart.add(view.id); }}
        className={`mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition ${
          !view.purchaseAvailable
            ? "cursor-not-allowed bg-slate-200 text-slate-400"
            : added
              ? "cursor-default bg-emerald-100 text-emerald-800"
              : "bg-[#0A84FF] text-white hover:bg-[#0064E0]"
        }`}
      >
        {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <ShoppingBag className="h-4 w-4" aria-hidden="true" />}
        {comingSoon
          ? translate(messages, "product.coming")
          : !view.purchaseAvailable
            ? translate(messages, "product.unavailableCurrency")
            : added
              ? translate(messages, "product.added")
              : translate(messages, "product.add")}
      </button>
    </div>
  );
}
