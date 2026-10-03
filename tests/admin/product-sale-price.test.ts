import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("Admin pricing carries nullable sale authority through service, route, audit and editor", () => {
  const service = source("src/server/admin/products-service.ts");
  const route = source("src/app/api/admin/products/[id]/prices/route.ts");
  const editor = source("src/features/admin/products/product-editor.tsx");

  assert.match(service, /resolveEffectiveProductPrice/);
  assert.match(service, /saleAmountMinor:\s*number\s*\|\s*null/);
  assert.match(service, /saleAmountMinor:\s*input\.saleAmountMinor/);
  assert.match(service, /PRODUCT_PRICE_UPDATED/);

  assert.match(route, /product\.price\.write/);
  assert.match(route, /body\.saleAmountMinor\s*!==\s*null/);
  assert.match(route, /typeof body\.saleAmountMinor\s*!==\s*"number"/);
  assert.match(route, /saleAmountMinor,/);

  assert.match(editor, /saleAmountMinor:\s*number\s*\|\s*null/);
  assert.match(editor, /name="saleAmountMajor"/);
  assert.match(editor, /Sale price \(optional\)/);
  assert.match(editor, /saleAmountMinor,/);
});
