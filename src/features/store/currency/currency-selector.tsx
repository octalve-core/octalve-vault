"use client";

import type { CurrencyCode } from "@/domain/constants";
import { useCurrency } from "./use-currency";

export function CurrencySelector({ compact = false }: { compact?: boolean }) {
  const { currency, setCurrency, enabledCurrencies } = useCurrency();
  return (
    <label className="relative inline-flex min-w-0 items-center">
      <span className="sr-only">Currency</span>
      <select
        aria-label="Currency"
        value={currency}
        onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
        className={compact
          ? "h-11 max-w-full appearance-none rounded-xl border border-white/15 bg-white/10 px-3 pe-8 text-xs font-medium text-white outline-none transition focus:border-white/40 focus-visible:ring-2 focus-visible:ring-white/30"
          : "h-11 max-w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pe-8 text-xs font-medium text-[#000A16] outline-none transition hover:border-[#0A84FF]/50 focus:border-[#0A84FF] focus-visible:ring-2 focus-visible:ring-[#0A84FF]/30"}
      >
        {enabledCurrencies.map((code) => <option key={code} value={code} className="text-slate-950">{code}</option>)}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute end-3 text-[10px] opacity-60">⌄</span>
    </label>
  );
}
