import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildPublicProductWhere,
  parsePublicCatalogueParams,
} from "../../src/features/store/catalogue/catalogue-index.ts";
import { filterPublicProductsOnSale } from "../../src/features/store/catalogue/public-sale-discovery.ts";
import type {
  PublicProduct,
  PublicProductPrice,
} from "../../src/features/store/catalogue/types.ts";

const root = process.cwd();

const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

function price(
  regularAmountMinor: number,
  saleAmountMinor: number | null,
): PublicProductPrice {
  const isOnSale = saleAmountMinor !== null;

  return {
    regularAmountMinor,
    saleAmountMinor,
    effectiveAmountMinor:
      saleAmountMinor ?? regularAmountMinor,
    discountPercent: isOnSale ? 20 : null,
    isOnSale,
  };
}

function product(
  id: string,
  priceDetails: PublicProduct["priceDetails"],
  status: PublicProduct["status"] = "ACTIVE",
): PublicProduct {
  return {
    id,
    slug: id,
    category: "Strategy",
    imagePath: null,
    featured: false,
    status,
    purchasable: status === "ACTIVE",
    title: id,
    shortDescription: id,
    description: null,
    businessBenefits: [],
    productivityBenefits: [],
    prices: {
      NGN: 40_000,
      USD: 3_000,
    },
    priceDetails,
  };
}

test("On Sale discovery follows the selected currency exactly and preserves order", () => {
  const regular = product("regular", {
    NGN: price(50_000, null),
    USD: price(4_000, null),
  });

  const ngnSale = product("ngn-sale", {
    NGN: price(50_000, 40_000),
    USD: price(4_000, null),
  });

  const usdSale = product("usd-sale", {
    NGN: price(50_000, null),
    USD: price(4_000, 3_200),
  });

  const comingSoonNgnSale = product(
    "soon-ngn-sale",
    {
      NGN: price(50_000, 40_000),
    },
    "COMING_SOON",
  );

  const products = [
    regular,
    ngnSale,
    usdSale,
    comingSoonNgnSale,
  ];

  assert.deepEqual(
    filterPublicProductsOnSale(products, "NGN").map(
      (item) => item.id,
    ),
    ["ngn-sale", "soon-ngn-sale"],
  );

  assert.deepEqual(
    filterPublicProductsOnSale(products, "USD").map(
      (item) => item.id,
    ),
    ["usd-sale"],
  );
});

test("On Sale discovery fails closed without a valid selected currency", () => {
  const sale = product("sale", {
    NGN: price(50_000, 40_000),
  });

  assert.deepEqual(
    filterPublicProductsOnSale([sale], null),
    [],
  );
});

test("On Sale query parsing accepts only supported currencies", () => {
  const valid = parsePublicCatalogueParams(
    new URLSearchParams(
      "availability=on-sale&currency=NGN",
    ),
  );

  assert.equal(valid.availability, "on-sale");
  assert.equal(valid.currency, "NGN");

  const invalid = parsePublicCatalogueParams(
    new URLSearchParams(
      "availability=on-sale&currency=CAD",
    ),
  );

  assert.equal(invalid.availability, "on-sale");
  assert.equal(invalid.currency, null);

  const missing = parsePublicCatalogueParams(
    new URLSearchParams(
      "availability=on-sale",
    ),
  );

  assert.equal(missing.availability, "on-sale");
  assert.equal(missing.currency, null);
});

test("On Sale stays outside raw Prisma sale filtering", () => {
  const all = buildPublicProductWhere(
    parsePublicCatalogueParams(
      new URLSearchParams(),
    ),
  );

  const onSale = buildPublicProductWhere(
    parsePublicCatalogueParams(
      new URLSearchParams(
        "availability=on-sale&currency=NGN",
      ),
    ),
  );

  assert.deepEqual(onSale, all);

  const indexSource = source(
    "src/features/store/catalogue/catalogue-index.ts",
  );

  assert.doesNotMatch(
    indexSource,
    /saleAmountMinor/,
  );
});

test("public catalogue filters mapped products through structured sale authority", () => {
  const catalogue = source(
    "src/features/store/catalogue/catalogue-service.ts",
  );

  const helper = source(
    "src/features/store/catalogue/public-sale-discovery.ts",
  );

  assert.match(catalogue, /filterPublicProductsOnSale/);
  assert.match(catalogue, /input\.availability === "on-sale"/);
  assert.match(
    helper,
    /priceDetails\?\.\[currency\]\?\.isOnSale === true/,
  );
  assert.doesNotMatch(helper, /saleAmountMinor/);
});

test("Shop synchronizes selected currency into On Sale server discovery", () => {
  const controls = source(
    "src/features/store/products/shop-discovery-controls.tsx",
  );

  assert.match(controls, /useCurrency/);
  assert.match(controls, /value="on-sale"/);
  assert.match(controls, /shop\.onSale/);
  assert.match(
    controls,
    /next\.set\("currency", changes\.currency\)/,
  );
  assert.match(
    controls,
    /next\.get\("availability"\) !== "on-sale"/,
  );
  assert.match(
    controls,
    /input\.availability !== "on-sale"/,
  );
  assert.match(controls, /router\.replace/);
});

test("On Sale labels exist across EN FR and AR dictionaries", () => {
  const messages = source(
    "src/i18n/messages.ts",
  );

  assert.equal(
    (messages.match(/"shop\.onSale":/g) ?? []).length,
    3,
  );
});
