import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const heroPath = resolve(root, "src/features/store/home/sections/hero.tsx");
const categoryPath = resolve(root, "src/features/store/home/sections/product-categories.tsx");
const featuredPath = resolve(root, "src/features/store/home/sections/featured-products.tsx");
const faqPath = resolve(root, "src/features/store/home/sections/faq.tsx");
const routePath = resolve(root, "src/app/[locale]/page.tsx");
const source = (path: string) => readFileSync(path, "utf8");

test("home hero restores the canonical Octalve Vault composition", () => {
  const hero = source(heroPath);
  assert.match(hero, /Lock in with innovation and/);
  assert.match(hero, /growth assets\./);
  assert.match(hero, /\/brand\/vault-logo\.png/);
  assert.match(hero, /\/brand\/mx-logo\.png/);
  assert.match(hero, /localeHref\(locale, "\/products"\)/);
  assert.match(hero, /#vault-faq/);
  assert.match(hero, /bg-\[#040506\]/i);
  assert.match(hero, /linear-gradient\(90deg, #E61525/i);
  assert.match(hero, /bg-\[#E61525\]/i);
  assert.doesNotMatch(hero, /\/vault\/shop/);
});

test("category/resource labels are generated from DB-backed product input", () => {
  assert.equal(existsSync(categoryPath), true, "product-categories.tsx must exist");
  const categories = source(categoryPath);
  assert.match(categories, /PublicProduct\[\]/);
  assert.match(categories, /products/);
  assert.match(categories, /product\.category/);
  assert.doesNotMatch(categories, /Business & Startup|Operations & Admin|Website & Launch|Resource Bundles/);
});

test("featured products and FAQ remain typed presentation boundaries", () => {
  const featured = source(featuredPath);
  assert.match(featured, /products: PublicProduct\[\]/);
  assert.match(featured, /ProductCard/);
  assert.match(featured, /font-medium/);
  assert.doesNotMatch(featured, /font-black|font-extrabold/);

  assert.equal(existsSync(faqPath), true, "faq.tsx must exist");
  const faq = source(faqPath);
  assert.match(faq, /id="vault-faq"/);
  assert.match(faq, /font-medium/);
  assert.doesNotMatch(faq, /7-day money-back|7 days money back/i, "FAQ must not invent a refund guarantee");
});

test("localized home route stays thin and composes only DB-backed sections", () => {
  const route = source(routePath);
  assert.match(route, /getPublicProducts\(locale\)/);
  assert.match(route, /FeaturedProductsSection/);
  assert.match(route, /ProductCategoriesSection/);
  assert.match(route, /VaultFaq/);
  assert.doesNotMatch(route, /from "@\/features\/store\/home\/sections\/categories"|<CategoriesSection|WhyVaultSection/);
  assert.doesNotMatch(route, /vault-products|localStorage|sessionStorage/);
  assert.ok(route.split(/\r?\n/).length <= 80, "home route must remain composition-focused");
});
