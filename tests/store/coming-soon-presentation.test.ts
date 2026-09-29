import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (relative: string) => readFileSync(resolve(root, relative), "utf8");

test("Coming Soon cards are explicit and cannot execute add-to-cart", () => {
  const card = source("src/features/store/products/product-card.tsx");
  assert.match(card, /view\.status === "COMING_SOON"/);
  assert.match(card, /product\.coming/);
  assert.match(card, /if \(view\.purchaseAvailable\) cart\.add\(view\.id\)/);
  assert.match(card, /view\.formattedPrice/);
});

test("Coming Soon detail and modal use the lifecycle state instead of currency unavailability", () => {
  const actions = source("src/features/store/products/product-detail-actions.tsx");
  const detail = source("src/features/store/products/product-detail.tsx");
  const modal = source("src/features/store/products/product-detail-modal.tsx");

  assert.match(actions, /view\.status === "COMING_SOON"/);
  assert.match(actions, /product\.coming/);
  assert.match(detail, /product\.status === "COMING_SOON"/);
  assert.match(detail, /product\.coming/);
  assert.match(modal, /product\.status === "COMING_SOON"/);
  assert.match(modal, /product\.coming/);
  assert.match(modal, /if \(product\.purchaseAvailable\) onAdd\(\)/);
});

test("homepage featured section defends the featured-only contract", () => {
  const featured = source("src/features/store/home/sections/featured-products.tsx");
  assert.match(featured, /products\.filter\(\(product\) => product\.featured\)/);
  assert.match(featured, /featuredProducts\.slice\(0,\s*6\)/);
});

test("ACTIVE purchase actions remain present", () => {
  const card = source("src/features/store/products/product-card.tsx");
  const actions = source("src/features/store/products/product-detail-actions.tsx");
  assert.match(card, /product\.add/);
  assert.match(actions, /product\.add/);
  assert.match(card, /cart\.add/);
  assert.match(actions, /cart\.add/);
});
