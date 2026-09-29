import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (relative: string) => readFileSync(resolve(root, relative), "utf8");

test("product title slug helper supports auto generation and normalized category discovery", async () => {
  const helpers = await import("../../src/features/admin/products/product-create-state.ts");
  assert.equal(helpers.slugifyProductTitle("  Vault E-commerce  "), "vault-e-commerce");
  assert.equal(helpers.slugifyProductTitle("Café & Launch Kit!"), "cafe-launch-kit");
  assert.deepEqual(
    helpers.filterProductCategories(["Strategy", "Website & Launch", "strategy"], "strat"),
    ["Strategy"],
  );
  assert.equal(helpers.canAddProductCategory(["Strategy"], " strategy "), false);
  assert.equal(helpers.canAddProductCategory(["Strategy"], "Operations"), true);
});

test("dedicated new-product route replaces inline creation and remains permission-gated", () => {
  const route = resolve(root, "src/app/admin/(protected)/products/new/page.tsx");
  assert.equal(existsSync(route), true, "dedicated /admin/products/new page must exist");
  const routeSource = source("src/app/admin/(protected)/products/new/page.tsx");
  const indexSource = source("src/app/admin/(protected)/products/page.tsx");
  assert.match(routeSource, /requireAdminPage\("product\.write"\)/);
  assert.match(routeSource, /listAdminProductCategories/);
  assert.match(routeSource, /ProductCreatePageForm/);
  assert.match(indexSource, /href="\/admin\/products\/new"/);
  assert.doesNotMatch(indexSource, /ProductCreateForm/);
});

test("new-product form freezes automatic slug after manual edit and can regenerate", () => {
  const relative = "src/features/admin/products/product-create-page-form.tsx";
  assert.equal(existsSync(resolve(root, relative)), true, "new product form must exist");
  const form = source(relative);
  assert.match(form, /slugManual/);
  assert.match(form, /if \(!slugManual\) setSlug\(slugifyProductTitle\(value\)\)/);
  assert.match(form, /setSlugManual\(true\)/);
  assert.match(form, /Regenerate/);
  assert.match(form, /setSlugManual\(false\)/);
  assert.match(form, /role="combobox"/);
  assert.match(form, /role="listbox"/);
  assert.match(form, /\+ Add/);
  assert.match(form, /fetch\("\/api\/admin\/products"/);
  assert.match(form, /router\.push\(`\/admin\/products\/\$\{data\.product\.id\}`\)/);
});
