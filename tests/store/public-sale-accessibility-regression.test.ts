import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();

const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

test("shared sale display retains semantic regular sale and discount accessibility", () => {
  const display = source(
    "src/features/store/products/product-price-display.tsx",
  );

  assert.match(display, /<s[\s>]/);
  assert.match(display, /sr-only/);
  assert.match(display, /product\.regularPrice/);
  assert.match(display, /product\.salePrice/);
  assert.match(display, /product\.off/);
  assert.match(display, /formattedRegularPrice/);
  assert.match(display, /formattedEffectivePrice/);
});

test("cart and checkout reuse the same sale presentation component", () => {
  const cart = source(
    "src/features/store/cart/cart-view.tsx",
  );
  const checkout = source(
    "src/features/store/checkout/checkout-view.tsx",
  );

  assert.match(
    cart,
    /<ProductPriceDisplay view=\{item\} compact \/>/,
  );
  assert.match(
    checkout,
    /<ProductPriceDisplay view=\{product\} compact \/>/,
  );
});

test("sale and price-sort labels exist in EN FR and AR", () => {
  const messages = source("src/i18n/messages.ts");

  for (const key of [
    "product.regularPrice",
    "product.salePrice",
    "product.off",
    "shop.sortPriceLowHigh",
    "shop.sortPriceHighLow",
  ]) {
    const escaped = key.replaceAll(".", "\\.");
    const pattern = new RegExp(`"${escaped}":`, "g");

    assert.equal(
      (messages.match(pattern) ?? []).length,
      3,
      `${key} must exist exactly once in each locale dictionary`,
    );
  }
});

test("public sale discovery consumes selected-currency validated sale authority", () => {
  const sale = source(
    "src/features/store/catalogue/public-sale-discovery.ts",
  );

  assert.match(
    sale,
    /priceDetails\?\.\[currency\]\?\.isOnSale === true/,
  );
  assert.doesNotMatch(sale, /saleAmountMinor/);
});

test("effective price sorting consumes validated selected-currency effective amount", () => {
  const sort = source(
    "src/features/store/catalogue/public-price-sort.ts",
  );

  assert.match(
    sort,
    /priceDetails\?\.\[currency\]\?\.effectiveAmountMinor/,
  );
  assert.match(sort, /left\.id\.localeCompare\(right\.id\)/);
  assert.doesNotMatch(sort, /saleAmountMinor/);
});

test("checkout keeps server quote totals and product-id-only authority", () => {
  const checkout = source(
    "src/features/store/checkout/checkout-view.tsx",
  );

  assert.match(
    checkout,
    /activeQuote\?\.subtotalAmount \?\? subtotal/,
  );
  assert.match(
    checkout,
    /activeQuote\?\.totalAmount \?\? subtotal/,
  );
  assert.match(
    checkout,
    /items: selected\.map\(\(product\) => \(\{ productId: product\.id \}\)\)/,
  );
  assert.match(
    checkout,
    /fetch\("\/api\/checkout\/quote"/,
  );
  assert.match(
    checkout,
    /fetch\("\/api\/payments\/initialize"/,
  );
  assert.doesNotMatch(
    checkout,
    /saleAmountMinor\s*[-+*/]/,
  );
});

test("price-sensitive Shop discovery remains URL-backed and selected-currency aware", () => {
  const controls = source(
    "src/features/store/products/shop-discovery-controls.tsx",
  );

  assert.match(controls, /input\.availability === "on-sale"/);
  assert.match(controls, /input\.sort === "price-asc"/);
  assert.match(controls, /input\.sort === "price-desc"/);
  assert.match(controls, /router\.replace/);
  assert.match(controls, /draftQueryRef/);
});
