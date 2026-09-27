"use client";

import { isCurrency } from "@/config/currencies";
import type { CurrencyCode } from "@/domain/constants";

const STORAGE_KEY = "octalve_vault_currency";
const EVENT_NAME = "octalve-vault-currency-updated";

export function readCurrency(): CurrencyCode | null {
  if (typeof window === "undefined") return null;
  const value = window.localStorage.getItem(STORAGE_KEY);
  return value && isCurrency(value) ? value : null;
}

export function setCurrency(currency: CurrencyCode): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, currency);
  document.cookie = `vault_currency=${currency}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function subscribeCurrency(callback: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  const handler = () => callback();
  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
