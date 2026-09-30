import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (relative: string) => readFileSync(resolve(root, relative), "utf8");

test("Shop search debounces URL-backed server discovery without an Apply button", () => {
  const relative = "src/features/store/products/shop-discovery-controls.tsx";
  assert.equal(existsSync(resolve(root, relative)), true, "live Shop discovery controls must exist");
  const controls = source(relative);

  assert.match(controls, /SEARCH_DEBOUNCE_MS\s*=\s*350/);
  assert.match(controls, /handleSearchChange/);
  assert.match(controls, /window\.setTimeout/);
  assert.match(controls, /window\.clearTimeout/);
  assert.match(controls, /router\.replace/);
  assert.match(controls, /\{\s*scroll:\s*false\s*\}/);
  assert.match(controls, /aria-busy=\{isPending\}/);
  assert.doesNotMatch(controls, /shop\.apply|type="submit"/);
});

test("Search draft uses refs and an uncontrolled input instead of prop-to-state synchronization", () => {
  const controls = source("src/features/store/products/shop-discovery-controls.tsx");
  assert.match(controls, /defaultValue=\{input\.query\}/);
  assert.match(controls, /ref=\{inputRef\}/);
  assert.match(controls, /draftQueryRef/);
  assert.match(controls, /lastNavigatedQueryRef/);
  assert.match(controls, /inputRef\.current\.value = input\.query/);
  assert.doesNotMatch(controls, /useState|setQuery/);
});

test("Availability and Sort update immediately while preserving the latest typed search", () => {
  const controls = source("src/features/store/products/shop-discovery-controls.tsx");
  assert.match(controls, /changeAvailability/);
  assert.match(controls, /query:\s*draftQueryRef\.current/);
  assert.match(controls, /changeSort/);
  assert.match(controls, /clearPendingSearch/);
});

test("Category pills navigate immediately and keep the current search draft", () => {
  const controls = source("src/features/store/products/shop-discovery-controls.tsx");
  assert.match(controls, /changeCategory/);
  assert.match(controls, /"push"/);
  assert.match(controls, /onClick=\{\(\) => changeCategory\(category\)\}/);
  assert.match(controls, /aria-pressed=\{input\.category === category\}/);
});

test("ProductGrid delegates discovery without reintroducing browser-side product filtering", () => {
  const grid = source("src/features/store/products/product-grid.tsx");
  assert.match(grid, /ShopDiscoveryControls/);
  assert.match(grid, /categories=\{categories\}/);
  assert.match(grid, /input=\{input\}/);
  assert.doesNotMatch(grid, /method="get"|shop\.apply|shopHref|products\.filter|useState|useMemo/);
});
