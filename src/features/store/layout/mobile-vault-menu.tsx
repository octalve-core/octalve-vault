"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import { CurrencySelector } from "../currency/currency-selector";
import { CartNavAction } from "./cart-nav-action";
import { LocaleSwitcher } from "./locale-switcher";
import { buildVaultNav, isVaultNavActive } from "./vault-nav";

export function MobileVaultMenu({
  locale,
  pathname,
  onNavigate,
}: {
  locale: Locale;
  pathname: string;
  onNavigate: () => void;
}) {
  const messages = getMessages(locale);
  const nav = buildVaultNav(locale);

  return (
    <div
      id="octalve-vault-mobile-menu"
      className="max-h-[calc(100vh-125px)] overflow-y-auto overflow-x-hidden border-b border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.14)] xl:hidden"
    >
      <div className="mx-auto w-full max-w-[760px] px-4 py-5 sm:px-6">
        <nav className="grid gap-1 rounded-3xl border border-slate-200 bg-white p-2" aria-label="Mobile navigation">
          {nav.map((item) => {
            if (item.key === "cart") {
              return <CartNavAction key={item.key} locale={locale} variant="mobile" onNavigate={onNavigate} />;
            }

            const active = isVaultNavActive(pathname, item.href);
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-4 py-3 text-[15px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40 ${
                  active
                    ? "bg-[#F1F6FF] text-[#0064E0]"
                    : "text-[#000A16] hover:bg-[#F8FAFC]"
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 grid min-w-0 gap-3 rounded-3xl border border-slate-200 bg-[#F8FAFC] p-4 sm:grid-cols-2">
          <CurrencySelector />
          <LocaleSwitcher locale={locale} />
        </div>

        <Link
          href={localeHref(locale, "/vault")}
          onClick={onNavigate}
          className="mt-4 flex min-h-11 w-full items-center justify-between rounded-xl bg-[#0064E0] px-5 py-3 text-[15px] shadow-[0_14px_30px_rgba(10,132,255,0.20)] transition hover:bg-[#0057C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40 text-white font-medium"
        >
          <span>{translate(messages, "nav.myVault")}</span>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
