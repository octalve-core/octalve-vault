import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const navPath = resolve(root, "src/features/store/layout/vault-nav.ts");
const headerPath = resolve(root, "src/features/store/layout/site-header.tsx");
const cartActionPath = resolve(root, "src/features/store/layout/cart-nav-action.tsx");
const mobilePath = resolve(root, "src/features/store/layout/mobile-vault-menu.tsx");
const localePath = resolve(root, "src/features/store/layout/locale-switcher.tsx");
const currencyPath = resolve(root, "src/features/store/currency/currency-selector.tsx");

function source(path: string): string {
  return readFileSync(path, "utf8");
}

test("Vault navigation keeps the exact destination order and locale-aware hrefs", async () => {
  assert.equal(existsSync(navPath), true, "vault-nav.ts must exist");
  const { buildVaultNav } = await import("../../src/features/store/layout/vault-nav.ts");

  assert.deepEqual(
    buildVaultNav("en").map((item: { label: string }) => item.label),
    ["Vault", "Shop", "Cart", "Checkout", "Contact"],
  );
  assert.deepEqual(
    buildVaultNav("en").map((item: { href: string }) => item.href),
    ["/en", "/en/products", "/en/cart", "/en/checkout", "/en/contact"],
  );
  assert.deepEqual(
    buildVaultNav("fr").map((item: { href: string }) => item.href),
    ["/fr", "/fr/products", "/fr/cart", "/fr/checkout", "/fr/contact"],
  );
  assert.deepEqual(
    buildVaultNav("ar").map((item: { href: string }) => item.href),
    ["/ar", "/ar/products", "/ar/cart", "/ar/checkout", "/ar/contact"],
  );
});

test("public header uses the canonical Octalve shell and ordered utility actions", () => {
  const header = source(headerPath);
  assert.doesNotMatch(header, /VaultStripNav/);
  assert.match(header, /sticky top-0 z-50 w-full/);
  assert.match(header, /h-1 w-full/);
  assert.match(header, /#E61525/i);
  assert.match(header, /#0064E0/i);
  assert.match(header, /#29BE3E/i);
  assert.match(header, /#FC7E24/i);
  assert.match(header, /h-\[80px\]/);
  assert.match(header, /font-medium/);
  assert.match(header, /buildVaultNav/);

  const currency = header.indexOf("<CurrencySelector");
  const locale = header.indexOf("<LocaleSwitcher");
  const cart = header.indexOf("<CartNavAction");
  const vault = header.indexOf('localeHref(locale, "/vault")');
  assert.ok(currency >= 0 && locale > currency && cart > locale && vault > cart, "desktop utilities must be Currency → Language → Cart → My Vault");
});

test("cart action and mobile menu reuse current state and remain accessible", () => {
  assert.equal(existsSync(cartActionPath), true, "cart-nav-action.tsx must exist");
  assert.equal(existsSync(mobilePath), true, "mobile-vault-menu.tsx must exist");

  const cart = source(cartActionPath);
  assert.match(cart, /useCart\(\)/);
  assert.match(cart, /cart\.count > 0/);
  assert.match(cart, /aria-label/);

  const mobile = source(mobilePath);
  assert.match(mobile, /buildVaultNav/);
  assert.match(mobile, /CurrencySelector/);
  assert.match(mobile, /LocaleSwitcher/);
  assert.match(mobile, /CartNavAction/);
  assert.match(mobile, /min-h-11/);
  assert.doesNotMatch(mobile, /overflow-x-auto/);
});

test("currency and language controls use compact medium-weight Octalve controls", () => {
  const locale = source(localePath);
  const currency = source(currencyPath);
  assert.match(locale, /<select/);
  assert.match(locale, /font-medium/);
  assert.doesNotMatch(locale, /rounded-full.*p-1/);
  assert.match(currency, /font-medium/);
});
