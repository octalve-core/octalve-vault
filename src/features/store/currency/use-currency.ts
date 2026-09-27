"use client";

import { useSyncExternalStore } from "react";
import type { CurrencyCode } from "@/domain/constants";
import { useCommercePreferences } from "../preferences/commerce-preferences";
import { readCurrency, setCurrency as persistCurrency, subscribeCurrency } from "./currency-store";

export function useCurrency() {
  const preferences = useCommercePreferences();
  const stored = useSyncExternalStore(subscribeCurrency, readCurrency, () => null);
  const currency = stored && preferences.enabledCurrencies.includes(stored)
    ? stored
    : preferences.defaultCurrency;

  function setCurrency(currency: CurrencyCode) {
    if (!preferences.enabledCurrencies.includes(currency)) return;
    persistCurrency(currency);
  }

  return { currency, setCurrency, enabledCurrencies: preferences.enabledCurrencies, defaultCurrency: preferences.defaultCurrency };
}
