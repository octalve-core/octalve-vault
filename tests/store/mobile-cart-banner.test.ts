import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const headerPath = "src/features/store/layout/site-header.tsx";
const layoutPath = "src/app/[locale]/layout.tsx";
const bannerPath = "src/features/store/layout/mobile-cart-checkout-bar.tsx";
const visibilityPath = "src/features/store/layout/mobile-cart-visibility.ts";

test("mobile cart visibility is limited to browsing routes", async () => {
  assert.equal(existsSync(visibilityPath), true);
  const url = pathToFileURL(resolve(visibilityPath)).href;
  const { shouldShowMobileCartBar } = await import(url);

  for (const [pathname, locale] of [
    ["/en", "en"],
    ["/en/", "en"],
    ["/en/products", "en"],
    ["/en/products/example", "en"],
    ["/en/contact", "en"],
    ["/fr", "fr"],
    ["/ar/products/example", "ar"],
  ] as const) {
    assert.equal(shouldShowMobileCartBar(pathname, locale), true, pathname);
  }

  for (const pathname of [
    "/en/cart",
    "/en/checkout",
    "/en/vault",
    "/en/payment/paystack/success",
    "/en/privacy",
    "/en/terms",
    "/en/refund-policy",
    "/en/digital-product-license",
  ]) {
    assert.equal(shouldShowMobileCartBar(pathname, "en"), false, pathname);
  }
});

test("mobile bar mirrors cart subtotal presentation but not payment authority", () => {
  assert.equal(existsSync(bannerPath), true);
  const source = readFileSync(bannerPath, "utf8");

  assert.match(source, /useCart\(\)/);
  assert.match(source, /useCurrency\(\)/);
  assert.match(source, /toProductViewModel\(product, currency, locale\)/);
  assert.match(source, /item\.amountMinor \?\? 0/);
  assert.match(source, /formatMoney\(subtotal, currency, locale\)/);
  assert.match(source, /translate\(messages, "cart\.subtotal"\)/);
  assert.match(source, /translate\(messages, "cart\.checkout"\)/);
  assert.match(source, /localeHref\(locale, "\/checkout"\)/);
  assert.match(source, /localeHref\(locale, "\/cart"\)/);
  assert.match(source, /safe-area-inset-bottom/);
  assert.match(source, /xl:hidden/);
  assert.match(source, /!unavailable \?/);
  assert.match(source, /ShoppingBag/);
  assert.match(source, /rtl:rotate-180/);

  assert.doesNotMatch(source, /\/api\/checkout\/quote/);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /couponCode|affiliateCode|totalAmount/);
  assert.doesNotMatch(source, /cart-store/);
});

test("localized layout gives the bar DB-backed public products", () => {
  const source = readFileSync(layoutPath, "utf8");
  assert.match(source, /getPublicProducts/);
  assert.match(source, /const products = await getPublicProducts\(locale\);/);
  assert.match(source, /<MobileCartCheckoutBar locale=\{locale\} products=\{products\} \/>/);
  assert.doesNotMatch(source, /checkout\/quote/);
});

test("mobile cart icon sits before the hamburger", () => {
  const source = readFileSync(headerPath, "utf8");
  const actions = [...source.matchAll(/<CartNavAction locale=\{locale\} \/>/g)];
  assert.equal(actions.length, 2);
  assert.match(source, /flex shrink-0 items-center gap-2 xl:hidden/);

  const mobileCart = actions[1]?.index ?? -1;
  const toggle = source.indexOf('aria-label="Toggle navigation menu"');
  assert.ok(mobileCart >= 0);
  assert.ok(toggle > mobileCart);
});
