"use client";

const STORAGE_KEY = "octalve_vault_cart_v2";
const EVENT_NAME = "octalve-vault-cart-updated";
const EMPTY: readonly string[] = Object.freeze([]);

let cachedRaw: string | null | undefined;
let cachedSnapshot: readonly string[] = EMPTY;

function browser(): boolean {
  return typeof window !== "undefined";
}

function parseCartIds(raw: string | null): readonly string[] {
  if (raw === null) return EMPTY;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return EMPTY;

    const ids = [...new Set(
      parsed.filter(
        (value): value is string =>
          typeof value === "string" && /^vp_[a-z0-9_-]+$/i.test(value),
      ),
    )].slice(0, 25);

    return ids.length === 0 ? EMPTY : Object.freeze(ids);
  } catch {
    return EMPTY;
  }
}

export function cartSnapshot(): readonly string[] {
  if (!browser()) return EMPTY;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedSnapshot;

    cachedRaw = raw;
    cachedSnapshot = parseCartIds(raw);
    return cachedSnapshot;
  } catch {
    return EMPTY;
  }
}

export function cartServerSnapshot(): readonly string[] {
  return EMPTY;
}

export function readCartIds(): string[] {
  return [...cartSnapshot()];
}

function writeCartIds(ids: string[]): void {
  if (!browser()) return;

  const normalized = [...new Set(ids)].slice(0, 25);
  const raw = JSON.stringify(normalized);

  window.localStorage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw;
  cachedSnapshot =
    normalized.length === 0 ? EMPTY : Object.freeze([...normalized]);

  window.dispatchEvent(new Event(EVENT_NAME));
}

export function addCartId(productId: string): void {
  const current = readCartIds();
  if (!current.includes(productId)) writeCartIds([...current, productId]);
}

export function removeCartId(productId: string): void {
  writeCartIds(readCartIds().filter((id) => id !== productId));
}

export function clearCart(): void {
  writeCartIds([]);
}

export function subscribeCart(callback: () => void): () => void {
  if (!browser()) return () => undefined;

  const handler = () => callback();

  window.addEventListener(EVENT_NAME, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", handler);
  };
}
