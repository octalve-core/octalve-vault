"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import { CurrencySelector } from "../currency/currency-selector";
import { CartNavAction } from "./cart-nav-action";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileVaultMenu } from "./mobile-vault-menu";
import { buildVaultNav, isVaultNavActive } from "./vault-nav";

export function SiteHeader({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const headerRef = useRef<HTMLElement | null>(null);
  const nav = buildVaultNav(locale);
  const messages = getMessages(locale);

  useEffect(() => {
    function handleOutside(event: MouseEvent) {
      if (mobileOpen && headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setMobileOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setMobileOpen(false);
    }

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  return (
    <header ref={headerRef} className="sticky top-0 z-50 w-full">
      <div className="flex h-1 w-full" aria-hidden="true">
        <div className="w-1/4 bg-[#E61525]" />
        <div className="w-1/4 bg-[#0064E0]" />
        <div className="w-1/4 bg-[#29BE3E]" />
        <div className="w-1/4 bg-[#FC7E24]" />
      </div>

      <div className="flex min-h-9 flex-wrap items-center justify-center gap-x-2 gap-y-1 bg-[#0F3D33] px-4 py-2 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-white sm:text-xs sm:tracking-[0.20em]">
        <span>Quick Response</span>
        <span aria-hidden="true" className="opacity-50">|</span>
        <Link href={localeHref(locale, "/contact")} className="underline-offset-4 hover:underline">
          Vault Support
        </Link>
      </div>

      <div className="border-b border-slate-200 bg-[#F8FAFC]">
        <div className="mx-auto flex h-[80px] w-full max-w-[1540px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            href={localeHref(locale, "/")}
            className="flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40"
            aria-label="Octalve Vault home"
          >
            <span className="relative h-12 w-12 overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
              <Image src="/brand/octalve-logo.png" alt="Octalve" fill className="object-contain p-1" sizes="48px" priority />
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex" aria-label="Primary navigation">
            {nav.map((item) => {
              const active = isVaultNavActive(pathname, item.href);
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative inline-flex h-11 items-center rounded-xl px-3 text-[14px] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40 ${
                    active
                      ? "bg-[#F1F6FF] text-[#0064E0]"
                      : "text-[#000A16] hover:bg-white hover:text-[#0064E0]"
                  }`}
                >
                  {item.label}
                  {active ? <span className="absolute inset-x-3 bottom-1.5 h-0.5 rounded-full bg-[#0A84FF]" aria-hidden="true" /> : null}
                </Link>
              );
            })}
          </nav>

          <div className="hidden shrink-0 items-center gap-2 xl:flex">
            <CurrencySelector />
            <LocaleSwitcher locale={locale} />
            <CartNavAction locale={locale} />
            <Link
              href={localeHref(locale, "/vault")}
              className="inline-flex h-11 items-center justify-center whitespace-nowrap rounded-xl bg-[#0A84FF] px-4 text-[14px] font-medium text-white shadow-[0_14px_30px_rgba(10,132,255,0.20)] transition hover:bg-[#006FE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40"
            >
              {translate(messages, "nav.myVault")}
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-[#000A16] shadow-sm transition hover:border-[#0A84FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40 xl:hidden"
            aria-expanded={mobileOpen}
            aria-controls="octalve-vault-mobile-menu"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {mobileOpen ? (
        <MobileVaultMenu
          locale={locale}
          pathname={pathname}
          onNavigate={() => setMobileOpen(false)}
        />
      ) : null}
    </header>
  );
}
