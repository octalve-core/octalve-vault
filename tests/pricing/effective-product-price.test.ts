import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

const moduleUrl = new URL("../../src/domain/product-pricing.ts", import.meta.url);

type Resolver = (input: {
  amountMinor: number;
  saleAmountMinor?: number | null;
}) => {
  regularAmountMinor: number;
  saleAmountMinor: number | null;
  effectiveAmountMinor: number;
  discountPercent: number | null;
  isOnSale: boolean;
};

async function loadResolver(): Promise<Resolver> {
  assert.ok(existsSync(moduleUrl), "effective product pricing authority must exist");
  const loaded = await import(moduleUrl.href);
  assert.equal(typeof loaded.resolveEffectiveProductPrice, "function");
  return loaded.resolveEffectiveProductPrice as Resolver;
}

test("regular price remains effective when no sale is configured", async () => {
  const resolve = await loadResolver();
  assert.deepEqual(resolve({ amountMinor: 50_000 }), {
    regularAmountMinor: 50_000,
    saleAmountMinor: null,
    effectiveAmountMinor: 50_000,
    discountPercent: null,
    isOnSale: false,
  });
  assert.deepEqual(resolve({ amountMinor: 0, saleAmountMinor: null }), {
    regularAmountMinor: 0,
    saleAmountMinor: null,
    effectiveAmountMinor: 0,
    discountPercent: null,
    isOnSale: false,
  });
});

test("valid sale price becomes effective and derives the discount percentage", async () => {
  const resolve = await loadResolver();
  assert.deepEqual(resolve({ amountMinor: 50_000, saleAmountMinor: 40_000 }), {
    regularAmountMinor: 50_000,
    saleAmountMinor: 40_000,
    effectiveAmountMinor: 40_000,
    discountPercent: 20,
    isOnSale: true,
  });
});

test("invalid sale prices fail closed", async () => {
  const resolve = await loadResolver();
  for (const saleAmountMinor of [0, -1, 50_000, 50_001, 40_000.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => resolve({ amountMinor: 50_000, saleAmountMinor }),
      /Sale price must be a positive safe integer below the regular price/,
    );
  }
});

test("regular price authority accepts only non-negative safe integer minor units", async () => {
  const resolve = await loadResolver();
  for (const amountMinor of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(
      () => resolve({ amountMinor }),
      /Regular price must be a non-negative safe integer in minor units/,
    );
  }
});
