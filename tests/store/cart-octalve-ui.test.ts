import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const cartViewPath = resolve(root, "src/features/store/cart/cart-view.tsx");
const cartStorePath = resolve(root, "src/features/store/cart/cart-store.ts");
const cartHookPath = resolve(root, "src/features/store/cart/use-cart.ts");
const cartRoutePath = resolve(root, "src/app/[locale]/cart/page.tsx");
const source = (path: string) => readFileSync(path, "utf8");

test("cart presentation uses canonical list, controls, and order summary over current state", () => {
  const view = source(cartViewPath);
  assert.match(view, /useCart\(\)/);
  assert.match(view, /useCurrency\(\)/);
  assert.match(view, /toProductViewModel/);
  assert.match(view, /cart\.remove/);
  assert.match(view, /cart\.clear/);
  assert.match(view, /cart\.continue/);
  assert.match(view, /cart\.summary/);
  assert.match(view, /cart\.products/);
  assert.match(view, /font-medium/);
  assert.doesNotMatch(view, /font-black|font-extrabold/);
  assert.doesNotMatch(view, /useVaultCart|vault-cart|vaultProducts/);
});

test("cart reconciles local IDs to the DB catalogue and missing prices disable checkout", () => {
  const view = source(cartViewPath);
  assert.match(view, /validProductIds/);
  assert.match(view, /const \{ ids, remove, clear \} = useCart\(\);/);
  assert.match(view, /remove\(item\.id\)/);
  assert.match(view, /purchaseAvailable/);
  assert.match(view, /aria-disabled=\{unavailable\}/);
  assert.match(view, /localeHref\(locale, "\/checkout"\)/);
  assert.doesNotMatch(view, /prices\[currency\]\s*\?\?\s*0/);
});

test("cart route remains thin and DB-backed", () => {
  const route = source(cartRoutePath);
  assert.match(route, /getPublicProducts\(locale\)/);
  assert.match(route, /<CartView products=\{products\} locale=\{locale\}/);
  assert.doesNotMatch(route, /font-black|font-extrabold|localStorage|sessionStorage|useVaultCart/);
  assert.ok(route.split(/\r?\n/).length <= 35, "cart route must remain composition-focused");
});

test("stable React 19 cart store remains the authoritative client state implementation", () => {
  const store = source(cartStorePath);
  const hook = source(cartHookPath);
  assert.match(store, /octalve_vault_cart_v2/);
  assert.match(store, /cachedRaw/);
  assert.match(store, /cachedSnapshot/);
  assert.match(store, /Object\.freeze/);
  assert.match(hook, /useSyncExternalStore/);
  assert.doesNotMatch(store, /useVaultCart/);
});

test("cart reconciliation effect depends only on stable cart members", () => {
  const view = readFileSync(cartViewPath, "utf8");
  assert.match(view, /const \{ ids, remove, clear \} = useCart\(\);/);
  assert.doesNotMatch(view, /const cart = useCart\(\);/);
  assert.match(view, /\[ids, remove, validProductIds\]/);
});
