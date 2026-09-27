"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import { useCart } from "../cart/use-cart";

export function CartNavAction({
  locale,
  variant = "desktop",
  onNavigate,
}: {
  locale: Locale;
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const cart = useCart();
  const label = translate(getMessages(locale), "nav.cart");
  const href = localeHref(locale, "/cart");

  if (variant === "mobile") {
    return (
      <Link
        href={href}
        onClick={onNavigate}
        className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-4 py-3 text-[15px] font-medium text-[#000A16] transition hover:bg-[#F1F6FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40"
        aria-label={`${label} (${cart.count})`}
      >
        <span className="inline-flex items-center gap-3">
          <ShoppingBag className="h-4 w-4" aria-hidden="true" />
          {label}
        </span>
        {cart.count > 0 ? (
          <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#E61525] px-1.5 text-[11px] font-medium text-white">
            {cart.count}
          </span>
        ) : (
          <span className="text-xs text-slate-400">0</span>
        )}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-[#000A16] transition hover:border-[#0A84FF] hover:text-[#0064E0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40"
      aria-label={`${label} (${cart.count})`}
    >
      <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
      {cart.count > 0 ? (
        <span className="absolute -end-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#E61525] px-1 text-[10px] font-medium leading-none text-white">
          {cart.count}
        </span>
      ) : null}
    </Link>
  );
}
