import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { PublicProduct } from "../../src/features/store/catalogue/types.ts";
import { toProductViewModel } from "../../src/features/store/products/product-view-model.ts";

const root = process.cwd();
const source = (relative: string) => readFileSync(resolve(root, relative), "utf8");

test("public catalogue encodes the approved lifecycle boundary", () => {
  const types = source("src/features/store/catalogue/types.ts");
  const catalogue = source("src/features/store/catalogue/catalogue-service.ts");
  const catalogueIndex = source("src/features/store/catalogue/catalogue-index.ts");
  assert.match(types, /status:\s*ProductStatus/);
  assert.match(types, /purchasable:\s*boolean/);
  assert.match(catalogueIndex, /status:\s*"COMING_SOON"/);
  assert.match(catalogueIndex, /status:\s*"ACTIVE"[\s\S]*assets:\s*\{\s*some:\s*\{\s*status:\s*"PUBLISHED"/);
  assert.match(catalogue, /product\.status === "ACTIVE" && product\.assets\.length > 0/);
  assert.doesNotMatch(catalogueIndex, /status:\s*"DRAFT"/);
  assert.doesNotMatch(catalogueIndex, /status:\s*"ARCHIVED"/);
});
test("Coming Soon can display a price without becoming purchasable", () => {
  const comingSoon: PublicProduct = {
    id: "vp_soon",
    slug: "soon",
    category: "Strategy",
    imagePath: null,
    featured: true,
    status: "COMING_SOON",
    purchasable: false,
    title: "Coming Soon",
    shortDescription: "Preview",
    description: null,
    businessBenefits: [],
    productivityBenefits: [],
    prices: { NGN: 500000 },
  };

  const view = toProductViewModel(comingSoon, "NGN", "en");
  assert.equal(view.status, "COMING_SOON");
  assert.equal(view.amountMinor, 500000);
  assert.notEqual(view.formattedPrice, null);
  assert.equal(view.purchaseAvailable, false);
});

test("ACTIVE still requires lifecycle eligibility and selected-currency price in the view model", () => {
  const active: PublicProduct = {
    id: "vp_active",
    slug: "active",
    category: "Strategy",
    imagePath: null,
    featured: false,
    status: "ACTIVE",
    purchasable: true,
    title: "Active",
    shortDescription: "Ready",
    description: null,
    businessBenefits: [],
    productivityBenefits: [],
    prices: { NGN: 500000 },
  };

  assert.equal(toProductViewModel(active, "NGN", "en").purchaseAvailable, true);
  assert.equal(toProductViewModel(active, "USD", "en").purchaseAvailable, false);
});

test("server checkout remains authoritative for stale or forged lifecycle requests", () => {
  const checkout = source("src/server/payments/checkout-pricing.ts");
  assert.match(checkout, /status:\s*"ACTIVE"/);
  assert.match(checkout, /where:\s*\{\s*status:\s*"PUBLISHED"\s*\}/);
  assert.match(checkout, /Product \$\{productId\} is unavailable/);
});
