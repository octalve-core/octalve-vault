import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { formatMoney } from "../../src/domain/money.ts";
import type { PublicProduct } from "../../src/features/store/catalogue/types.ts";

const root = process.cwd();
const viewModelPath = resolve(root, "src/features/store/products/product-view-model.ts");
const cardPath = resolve(root, "src/features/store/products/product-card.tsx");
const modalPath = resolve(root, "src/features/store/products/product-detail-modal.tsx");
const gridPath = resolve(root, "src/features/store/products/product-grid.tsx");
const detailPath = resolve(root, "src/features/store/products/product-detail.tsx");
const actionsPath = resolve(root, "src/features/store/products/product-detail-actions.tsx");
const shopRoutePath = resolve(root, "src/app/[locale]/products/page.tsx");
const detailRoutePath = resolve(root, "src/app/[locale]/products/[slug]/page.tsx");
const source = (path: string) => readFileSync(path, "utf8");

const product: PublicProduct = {
  id: "vp_alpha",
  slug: "alpha-resource",
  category: "Strategy",
  imagePath: "/products/vp001.png",
  featured: true,
  status: "ACTIVE",
  purchasable: true,
  title: "Localized Alpha",
  shortDescription: "Short localized description",
  description: "Full localized description",
  businessBenefits: ["Benefit one"],
  productivityBenefits: ["Impact one"],
  prices: { NGN: 125000 },
};

test("product view model preserves DB presentation fields and selected-currency authority", async () => {
  assert.equal(existsSync(viewModelPath), true, "product-view-model.ts must exist");
  const { toProductViewModel } = await import("../../src/features/store/products/product-view-model.ts");

  const ngn = toProductViewModel(product, "NGN", "en");
  assert.equal(ngn.title, "Localized Alpha");
  assert.equal(ngn.shortDescription, "Short localized description");
  assert.equal(ngn.description, "Full localized description");
  assert.equal(ngn.imagePath, "/products/vp001.png");
  assert.equal(ngn.currency, "NGN");
  assert.equal(ngn.amountMinor, 125000);
  assert.equal(ngn.formattedPrice, formatMoney(125000, "NGN", "en"));
  assert.equal(ngn.purchaseAvailable, true);

  const usd = toProductViewModel(product, "USD", "en");
  assert.equal(usd.currency, "USD");
  assert.equal(usd.amountMinor, null);
  assert.equal(usd.formattedPrice, null);
  assert.equal(usd.purchaseAvailable, false);
});

test("canonical product card and details modal use the adapter without fabricated social proof", () => {
  const card = source(cardPath);
  assert.match(card, /toProductViewModel/);
  assert.match(card, /ProductDetailModal/);
  assert.match(card, /font-medium/);
  assert.doesNotMatch(card, /font-black|font-extrabold/);
  assert.doesNotMatch(card, /reviewCount|rating=/, "card must not fabricate ratings or reviews");

  assert.equal(existsSync(modalPath), true, "product-detail-modal.tsx must exist");
  const modal = source(modalPath);
  assert.match(modal, /role="dialog"/);
  assert.match(modal, /aria-modal="true"/);
  assert.match(modal, /businessBenefits/);
  assert.match(modal, /productivityBenefits/);
  assert.match(modal, /purchaseAvailable/);
  assert.doesNotMatch(modal, /reviewCount|rating=/);
});

test("shop grid renders query-backed DB products and keeps canonical Octalve hierarchy", () => {
  const grid = source(gridPath);
  assert.match(grid, /products: PublicProduct\[\]/);
  assert.match(grid, /categories: string\[\]/);
  assert.match(grid, /ProductCard/);
  assert.match(grid, /font-medium/);
  assert.doesNotMatch(grid, /vaultProducts|vault-catalog|Business & Startup|Operations & Admin/);
  assert.doesNotMatch(grid, /products\.filter|useState|useMemo/);
  const shopRoute = source(shopRoutePath);
  assert.match(shopRoute, /getPublicProducts\(locale,\s*input\)/);
  assert.match(shopRoute, /ProductGrid/);
  assert.doesNotMatch(shopRoute, /font-black|font-extrabold|localStorage|vaultProducts/);
  assert.ok(shopRoute.split(/\r?\n/).length <= 70, "shop route must stay composition-focused");
});
test("SEO product detail matches Octalve medium-weight family while keeping independent route", () => {
  const detail = source(detailPath);
  const actions = source(actionsPath);
  const route = source(detailRoutePath);

  assert.match(detail, /font-medium/);
  assert.doesNotMatch(detail, /font-black|font-extrabold/);
  assert.match(actions, /toProductViewModel/);
  assert.match(actions, /purchaseAvailable/);
  assert.doesNotMatch(actions, /font-black|font-extrabold/);
  assert.match(route, /getPublicProductBySlug/);
  assert.match(route, /generateMetadata/);
  assert.match(route, /ProductDetail/);
  assert.doesNotMatch(route, /vaultProducts|vault-catalog|localStorage/);
});

test("product details modal manages keyboard focus as a real modal dialog", () => {
  const modal = source(modalPath);
  assert.match(modal, /useRef/);
  assert.match(modal, /previousFocused/);
  assert.match(modal, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(modal, /event\.key === "Tab"/);
  assert.match(modal, /querySelectorAll<HTMLElement>/);
  assert.match(modal, /previousFocused\?\.focus\(\)/);
});
