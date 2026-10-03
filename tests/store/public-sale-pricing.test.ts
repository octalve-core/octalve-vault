import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

async function pricingModule() {
  return import("../../src/features/store/catalogue/public-product-price.ts");
}

test("public regular price stays effective when no sale exists", async () => {
  const { resolvePublicProductPrice } = await pricingModule();

  assert.deepEqual(
    resolvePublicProductPrice({
      amountMinor: 50_000,
      saleAmountMinor: null,
    }),
    {
      regularAmountMinor: 50_000,
      saleAmountMinor: null,
      effectiveAmountMinor: 50_000,
      discountPercent: null,
      isOnSale: false,
    },
  );
});

test("public sale price reuses Batch G effective-price authority", async () => {
  const { buildPublicPriceMaps } = await pricingModule();

  const result = buildPublicPriceMaps([
    {
      currency: "NGN",
      amountMinor: 50_000,
      saleAmountMinor: 40_000,
    },
  ]);

  assert.equal(result.prices.NGN, 40_000);

  assert.deepEqual(result.priceDetails.NGN, {
    regularAmountMinor: 50_000,
    saleAmountMinor: 40_000,
    effectiveAmountMinor: 40_000,
    discountPercent: 20,
    isOnSale: true,
  });
});

test("invalid sale rows fail closed per currency", async () => {
  const { buildPublicPriceMaps } = await pricingModule();

  for (const saleAmountMinor of [
    50_000,
    60_000,
    0,
    -1,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    const result = buildPublicPriceMaps([
      {
        currency: "NGN",
        amountMinor: 50_000,
        saleAmountMinor,
      },
    ]);

    assert.equal(result.prices.NGN, undefined);
    assert.equal(result.priceDetails.NGN, undefined);
  }

  const invalidRegular = buildPublicPriceMaps([
    {
      currency: "NGN",
      amountMinor: Number.MAX_SAFE_INTEGER + 1,
      saleAmountMinor: null,
    },
  ]);

  assert.equal(invalidRegular.prices.NGN, undefined);
  assert.equal(invalidRegular.priceDetails.NGN, undefined);
});

test("unsupported currency rows are ignored without fallback", async () => {
  const { buildPublicPriceMaps } = await pricingModule();

  const result = buildPublicPriceMaps([
    {
      currency: "CAD",
      amountMinor: 10_000,
      saleAmountMinor: 8_000,
    },
  ]);

  assert.deepEqual(result.prices, {});
  assert.deepEqual(result.priceDetails, {});
});

test("catalogue delegates public prices to the validated H2 mapper", () => {
  const source = readFileSync(
    new URL(
      "../../src/features/store/catalogue/catalogue-service.ts",
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(source, /buildPublicPriceMaps/);
  assert.match(source, /priceDetails/);

  assert.doesNotMatch(
    source,
    /prices\[price\.currency\]\s*=\s*price\.amountMinor/,
  );
});
