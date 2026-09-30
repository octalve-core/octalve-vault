import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (relative: string) => readFileSync(resolve(root, relative), "utf8");

test("Shop route is URL/query-backed and the browser no longer filters the full product set", () => {
  const indexPath = resolve(root, "src/features/store/catalogue/catalogue-index.ts");
  assert.equal(existsSync(indexPath), true, "catalogue-index.ts must exist");
  const route = source("src/app/[locale]/products/page.tsx");
  const grid = source("src/features/store/products/product-grid.tsx");
  const service = source("src/features/store/catalogue/catalogue-service.ts");

  assert.match(route, /searchParams/);
  assert.match(route, /parsePublicCatalogueParams/);
  assert.match(route, /getPublicProducts\(locale,\s*input\)/);
  assert.match(route, /listPublicProductCategories/);
  assert.match(service, /buildPublicProductWhere\(input\)/);
  assert.match(service, /prisma\.product\.findMany/);
  assert.match(service, /input\.sort === "title"/);
  assert.match(grid, /method="get"/);
  assert.match(grid, /name="q"/);
  assert.match(grid, /name="availability"/);
  assert.match(grid, /name="sort"/);
  assert.match(grid, /shopHref/);
  assert.doesNotMatch(grid, /useState|useMemo|products\.filter/);
  assert.doesNotMatch(grid, /type="date"|createdFrom|updatedFrom/);
});

test("Shop discovery exposes Available Now and Coming Soon without weakening lifecycle purchase rules", () => {
  const grid = source("src/features/store/products/product-grid.tsx");
  const service = source("src/features/store/catalogue/catalogue-service.ts");
  const messages = source("src/i18n/messages.ts");
  assert.match(grid, /value="available"/);
  assert.match(grid, /value="coming-soon"/);
  assert.match(service, /purchasable:\s*product\.status === "ACTIVE" && product\.assets\.length > 0/);
  assert.match(messages, /"shop\.availableNow"/);
  assert.match(messages, /"shop\.comingSoon"/);
  assert.match(messages, /"shop\.sortTitle"/);
});
