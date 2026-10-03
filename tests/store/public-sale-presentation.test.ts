import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import type { PublicProduct } from "../../src/features/store/catalogue/types.ts";
import { toProductViewModel } from "../../src/features/store/products/product-view-model.ts";

const root = process.cwd();
const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

function product(
  overrides: Partial<PublicProduct> = {},
): PublicProduct {
  return {
    id: "vp_sale",
    slug: "sale-product",
    category: "Strategy",
    imagePath: null,
    featured: false,
    status: "ACTIVE",
    purchasable: true,
    title: "Sale Product",
    shortDescription: "Useful product",
    description: null,
    businessBenefits: [],
    productivityBenefits: [],
    prices: { NGN: 40_000 },
    priceDetails: {
      NGN: {
        regularAmountMinor: 50_000,
        saleAmountMinor: 40_000,
        effectiveAmountMinor: 40_000,
        discountPercent: 20,
        isOnSale: true,
      },
    },
    ...overrides,
  };
}

test("sale-aware product view model exposes regular sale and effective presentation", () => {
  const view = toProductViewModel(product(), "NGN", "en");

  assert.equal(view.locale, "en");
  assert.equal(view.regularAmountMinor, 50_000);
  assert.equal(view.saleAmountMinor, 40_000);
  assert.equal(view.effectiveAmountMinor, 40_000);
  assert.equal(view.amountMinor, 40_000);

  assert.equal(view.discountPercent, 20);
  assert.equal(view.isOnSale, true);

  assert.notEqual(view.formattedRegularPrice, null);
  assert.notEqual(view.formattedEffectivePrice, null);
  assert.equal(view.formattedPrice, view.formattedEffectivePrice);

  assert.equal(view.purchaseAvailable, true);
});

test("regular legacy-compatible presentation stays a single effective price", () => {
  const view = toProductViewModel(
    product({
      prices: { NGN: 50_000 },
      priceDetails: undefined,
    }),
    "NGN",
    "en",
  );

  assert.equal(view.regularAmountMinor, 50_000);
  assert.equal(view.saleAmountMinor, null);
  assert.equal(view.effectiveAmountMinor, 50_000);
  assert.equal(view.discountPercent, null);
  assert.equal(view.isOnSale, false);
  assert.equal(view.formattedPrice, view.formattedEffectivePrice);
});

test("Coming Soon can present a sale without becoming purchasable", () => {
  const view = toProductViewModel(
    product({
      status: "COMING_SOON",
      purchasable: false,
    }),
    "NGN",
    "en",
  );

  assert.equal(view.isOnSale, true);
  assert.equal(view.effectiveAmountMinor, 40_000);
  assert.equal(view.purchaseAvailable, false);
});

test("missing selected-currency price remains unavailable", () => {
  const view = toProductViewModel(product(), "USD", "en");

  assert.equal(view.regularAmountMinor, null);
  assert.equal(view.saleAmountMinor, null);
  assert.equal(view.effectiveAmountMinor, null);
  assert.equal(view.formattedEffectivePrice, null);
  assert.equal(view.isOnSale, false);
  assert.equal(view.purchaseAvailable, false);
});

test("shared public sale-price presentation is semantic and reused", () => {
  const displayPath = resolve(
    root,
    "src/features/store/products/product-price-display.tsx",
  );

  assert.equal(
    existsSync(displayPath),
    true,
    "shared ProductPriceDisplay must exist",
  );

  const display = readFileSync(displayPath, "utf8");
  const card = source("src/features/store/products/product-card.tsx");
  const actions = source(
    "src/features/store/products/product-detail-actions.tsx",
  );
  const modal = source(
    "src/features/store/products/product-detail-modal.tsx",
  );

  assert.match(display, /<s[\s>]/);
  assert.match(display, /formattedRegularPrice/);
  assert.match(display, /formattedEffectivePrice/);
  assert.match(display, /discountPercent/);
  assert.match(display, /product\.regularPrice/);
  assert.match(display, /product\.salePrice/);
  assert.match(display, /product\.off/);
  assert.match(display, /sr-only/);

  assert.match(card, /<ProductPriceDisplay view=\{view\} compact/);
  assert.match(actions, /<ProductPriceDisplay view=\{view\}/);
  assert.match(modal, /<ProductPriceDisplay view=\{product\}/);
});

test("sale-aware view model preserves Batch F public media fields", () => {
  const gallery = [
    {
      id: "pm_gallery",
      imagePath: "https://ik.example.com/detail.jpg",
      thumbnailPath: "https://ik.example.com/thumb.jpg",
      altText: "Gallery image",
      position: 0,
    },
  ];

  const view = toProductViewModel(
    product({
      imagePath: "https://ik.example.com/detail-primary.jpg",
      cardImagePath: "https://ik.example.com/card-primary.jpg",
      imageAlt: "Sale Product cover",
      gallery,
    }),
    "NGN",
    "en",
  );

  assert.equal(
    view.imagePath,
    "https://ik.example.com/detail-primary.jpg",
  );
  assert.equal(
    view.cardImagePath,
    "https://ik.example.com/card-primary.jpg",
  );
  assert.equal(
    view.imageAlt,
    "Sale Product cover",
  );
  assert.deepEqual(view.gallery, gallery);
});
test("sale-price accessibility labels exist in EN FR and AR dictionaries", () => {
  const messages = source("src/i18n/messages.ts");

  assert.equal(
    (messages.match(/"product\.regularPrice":/g) ?? []).length,
    3,
  );
  assert.equal(
    (messages.match(/"product\.salePrice":/g) ?? []).length,
    3,
  );
  assert.equal(
    (messages.match(/"product\.off":/g) ?? []).length,
    3,
  );
});
