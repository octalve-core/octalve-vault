import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (relative: string) => readFileSync(resolve(root, relative), "utf8");

test("Shop route is URL/query-backed and the browser no longer filters the full product set", () => {
  const indexPath = resolve(root, "src/features/store/catalogue/catalogue-index.ts");
  const controlsPath = resolve(root, "src/features/store/products/shop-discovery-controls.tsx");
  assert.equal(existsSync(indexPath), true, "catalogue-index.ts must exist");
  assert.equal(existsSync(controlsPath), true, "Shop discovery controls must exist");

  const route = source("src/app/[locale]/products/page.tsx");
  const grid = source("src/features/store/products/product-grid.tsx");
  const controls = source("src/features/store/products/shop-discovery-controls.tsx");
  const service = source("src/features/store/catalogue/catalogue-service.ts");

  assert.match(route, /searchParams/);
  assert.match(route, /parsePublicCatalogueParams/);
  assert.match(route, /getPublicProducts\(locale,\s*input\)/);
  assert.match(route, /listPublicProductCategories/);
  assert.match(service, /buildPublicProductWhere\(input\)/);
  assert.match(service, /prisma\.product\.findMany/);
  assert.match(service, /input\.sort === "title"/);
  assert.match(grid, /ShopDiscoveryControls/);
  assert.match(controls, /name="q"/);
  assert.match(controls, /name="availability"/);
  assert.match(controls, /name="sort"/);
  assert.match(controls, /router\.replace/);
  assert.doesNotMatch(grid, /useState|useMemo|products\.filter/);
  assert.doesNotMatch(controls, /products\.filter|type="date"|createdFrom|updatedFrom/);
});

test("Shop discovery exposes Available Now and Coming Soon without weakening lifecycle purchase rules", () => {
  const controls = source("src/features/store/products/shop-discovery-controls.tsx");
  const service = source("src/features/store/catalogue/catalogue-service.ts");
  const messages = source("src/i18n/messages.ts");
  assert.match(controls, /value="available"/);
  assert.match(controls, /value="coming-soon"/);
  assert.match(service, /purchasable:\s*product\.status === "ACTIVE" && product\.assets\.length > 0/);
  assert.match(messages, /"shop\.availableNow"/);
  assert.match(messages, /"shop\.comingSoon"/);
  assert.match(messages, /"shop\.sortTitle"/);
});
