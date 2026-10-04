import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();

const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

test("cart reuses the shared semantic sale-price component", () => {
  const cart = source("src/features/store/cart/cart-view.tsx");

  assert.match(
    cart,
    /import \{ ProductPriceDisplay \} from "\.\.\/products\/product-price-display";/,
  );
  assert.match(cart, /<ProductPriceDisplay view=\{item\} compact \/>/);
  assert.match(cart, /item\.amountMinor \?\? 0/);
  assert.match(cart, /toProductViewModel/);
});

test("checkout derives presentation models but leaves quote and payment authority on selected product ids", () => {
  const checkout = source("src/features/store/checkout/checkout-view.tsx");

  assert.match(checkout, /toProductViewModel/);
  assert.match(checkout, /const displayItems = selected\.map/);
  assert.match(checkout, /displayItems\.map\(\(product\) =>/);
  assert.match(checkout, /<ProductPriceDisplay view=\{product\} compact \/>/);
  assert.match(
    checkout,
    /items: selected\.map\(\(product\) => \(\{ productId: product\.id \}\)\)/,
  );
  assert.match(checkout, /activeQuote\?\.subtotalAmount \?\? subtotal/);
  assert.match(checkout, /activeQuote\?\.totalAmount \?\? subtotal/);
});

test("checkout presentation cannot submit browser sale arithmetic as authority", () => {
  const checkout = source("src/features/store/checkout/checkout-view.tsx");

  assert.doesNotMatch(checkout, /saleAmountMinor\s*[-+*/]/);
  assert.match(checkout, /fetch\("\/api\/checkout\/quote"/);
  assert.match(checkout, /fetch\("\/api\/payments\/initialize"/);
});
