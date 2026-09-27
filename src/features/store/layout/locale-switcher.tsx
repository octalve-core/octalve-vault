"use client";

import { usePathname, useRouter } from "next/navigation";
import type { Locale } from "@/domain/constants";
import { replaceLocaleInPath } from "@/i18n/routing";
import { useCommercePreferences } from "../preferences/commerce-preferences";

const LABELS: Record<Locale, string> = { en: "EN", fr: "FR", ar: "AR" };

export function LocaleSwitcher({ locale, dark = false }: { locale: Locale; dark?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { enabledLocales } = useCommercePreferences();

  return (
    <label className="relative inline-flex min-w-0 items-center">
      <span className="sr-only">Language</span>
      <select
        aria-label="Language"
        value={locale}
        onChange={(event) => {
          const nextLocale = event.target.value as Locale;
          if (nextLocale !== locale) router.push(replaceLocaleInPath(pathname, nextLocale));
        }}
        className={
          dark
            ? "h-11 max-w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-3 pe-8 text-xs font-medium text-white outline-none transition focus:border-white/40 focus-visible:ring-2 focus-visible:ring-white/30"
            : "h-11 max-w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pe-8 text-xs font-medium text-[#000A16] outline-none transition hover:border-[#0A84FF]/50 focus:border-[#0A84FF] focus-visible:ring-2 focus-visible:ring-[#0A84FF]/30"
        }
      >
        {enabledLocales.map((item) => (
          <option key={item} value={item} className="text-slate-950">
            {LABELS[item]}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute end-3 text-[10px] opacity-60">⌄</span>
    </label>
  );
}
