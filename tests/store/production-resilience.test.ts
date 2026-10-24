import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("public shell degrades safely when the database is unavailable", () => {
  const root = read("src/app/page.tsx");
  const layout = read("src/app/[locale]/layout.tsx");
  const home = read("src/app/[locale]/page.tsx");
  const shop = read("src/app/[locale]/products/page.tsx");
  const cart = read("src/app/[locale]/cart/page.tsx");
  const checkout = read("src/app/[locale]/checkout/page.tsx");

  assert.match(root, /DEFAULT_COMMERCE_SETTINGS/);
  assert.match(root, /catch/);
  assert.match(layout, /DEFAULT_COMMERCE_SETTINGS/);
  assert.match(layout, /products \?/);
  assert.match(home, /StoreServiceUnavailable/);
  assert.match(shop, /StoreServiceUnavailable/);
  assert.match(cart, /StoreServiceUnavailable/);
  assert.match(checkout, /StoreServiceUnavailable/);
});

test("liveness does not wake PostgreSQL while readiness still checks it", () => {
  const health = read("src/app/api/health/route.ts");
  const ready = read("src/app/api/ready/route.ts");

  assert.doesNotMatch(health, /prisma|SELECT 1/);
  assert.match(ready, /prisma/);
  assert.match(ready, /SELECT 1/);
  assert.match(ready, /status: 503/);
});

test("notification recovery no longer polls the database every five minutes", () => {
  const wrangler = read("workers/vault-download/wrangler.toml");
  assert.match(wrangler, /crons = \["0 \* \* \* \*"\]/);
  assert.doesNotMatch(wrangler, /\*\/5 \* \* \* \*/);
});

test("admin login distinguishes service outage from invalid credentials without leaking internals", () => {
  const route = read("src/app/api/admin/auth/login/route.ts");

  assert.match(route, /status: 401/);
  assert.match(route, /status: 503/);
  assert.match(route, /Administration is temporarily unavailable/);
  assert.doesNotMatch(route, /DATABASE_URL|PrismaClient|P1001/);
});

test("product detail preserves real not-found semantics outside the outage catch", () => {
  const page = read("src/app/[locale]/products/[slug]/page.tsx");
  const catchIndex = page.indexOf("catch {");
  const notFoundIndex = page.lastIndexOf("if (!product) notFound()");
  assert.ok(catchIndex >= 0);
  assert.ok(notFoundIndex > catchIndex, "Missing products must still reach notFound after DB errors are handled.");
});
