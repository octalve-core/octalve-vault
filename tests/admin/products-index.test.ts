import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildProductOrderBy,
  buildProductReadyWhere,
  buildProductWhere,
  parseProductIndexParams,
  productIndexActiveFilters,
  productIndexWindow,
} from "../../src/server/admin/products-index.ts";

const root = process.cwd();
const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

test("parses supported Product index parameters and rejects invalid values", () => {
  const params = new URLSearchParams({
    q: "  Alpha   Kit ",
    page: "3",
    pageSize: "25",
    sort: "oldest",
    status: "ACTIVE",
    category: "Strategy",
    featured: "true",
    readiness: "ready",
    asset: "published",
    currency: "NGN",
    createdFrom: "2026-09-01",
    createdTo: "2026-09-30",
  });

  const input = parseProductIndexParams(params);

  assert.equal(input.query, "Alpha Kit");
  assert.equal(input.page, 3);
  assert.equal(input.pageSize, 25);
  assert.equal(input.sort, "oldest");
  assert.equal(input.status, "ACTIVE");
  assert.equal(input.featured, true);
  assert.equal(input.currency, "NGN");
  assert.equal(
    input.created.toExclusive?.toISOString(),
    "2026-10-01T00:00:00.000Z",
  );

  assert.throws(
    () =>
      parseProductIndexParams(
        new URLSearchParams({ status: "DELETED" }),
      ),
    /Invalid product status filter/,
  );

  assert.throws(
    () =>
      parseProductIndexParams(
        new URLSearchParams({ featured: "maybe" }),
      ),
    /Invalid featured filter/,
  );
});

test("Product readiness requires ACTIVE + published asset + active price", () => {
  assert.deepEqual(buildProductReadyWhere(), {
    status: "ACTIVE",
    assets: { some: { status: "PUBLISHED" } },
    prices: { some: { isActive: true } },
  });

  assert.deepEqual(buildProductReadyWhere("USD"), {
    status: "ACTIVE",
    assets: { some: { status: "PUBLISHED" } },
    prices: {
      some: {
        currency: "USD",
        isActive: true,
      },
    },
  });
});

test("Product search and filters are translated before pagination", () => {
  const input = parseProductIndexParams(
    new URLSearchParams({
      q: "alpha",
      page: "3",
      pageSize: "25",
      readiness: "ready",
      asset: "published",
      currency: "USD",
      updatedFrom: "2026-09-01",
    }),
  );

  const where = buildProductWhere(input);
  const serialized = JSON.stringify(where);

  assert.match(serialized, /"slug"/);
  assert.match(serialized, /"category"/);
  assert.match(serialized, /"translations"/);
  assert.match(serialized, /"title"/);
  assert.match(serialized, /"mode":"insensitive"/);
  assert.match(serialized, /"PUBLISHED"/);
  assert.match(serialized, /"USD"/);
  assert.deepEqual(productIndexWindow(input), {
    skip: 50,
    take: 25,
  });
});

test("non-title sorts are deterministic", () => {
  const newest = parseProductIndexParams(
    new URLSearchParams({ sort: "newest" }),
  );
  assert.deepEqual(buildProductOrderBy(newest), [
    { createdAt: "desc" },
    { id: "asc" },
  ]);

  const status = parseProductIndexParams(
    new URLSearchParams({ sort: "status" }),
  );
  assert.deepEqual(buildProductOrderBy(status), [
    { status: "asc" },
    { id: "asc" },
  ]);
});

test("active filter descriptors are derived from validated state", () => {
  const input = parseProductIndexParams(
    new URLSearchParams({
      q: "kit",
      status: "COMING_SOON",
      currency: "NGN",
    }),
  );

  assert.deepEqual(
    productIndexActiveFilters(input).map((item) => ({
      key: item.key,
      params: item.params,
    })),
    [
      { key: "query", params: ["q"] },
      { key: "status", params: ["status"] },
      { key: "currency", params: ["currency"] },
    ],
  );
});

test("Admin Product discovery is database-query-backed rather than page-local filtering", () => {
  const service = source("src/server/admin/products-service.ts");
  const route = source("src/app/api/admin/products/route.ts");
  const page = source(
    "src/app/admin/(protected)/products/page.tsx",
  );
  const controls = source(
    "src/features/admin/products/product-index-controls.tsx",
  );
  const list = source(
    "src/features/admin/products/product-list.tsx",
  );

  assert.match(
    service,
    /prisma\.product\.count\(\{\s*where\s*\}\)/,
  );
  assert.match(service, /productIndexWindow\(input\)/);
  assert.match(service, /skip,\s*take/);
  assert.match(service, /prisma\.productTranslation\.findMany/);
  assert.match(service, /input\.sort === "title"/);
  assert.match(route, /parseProductIndexParams/);
  assert.match(route, /new URL\(request\.url\)\.searchParams/);
  assert.match(page, /searchParams/);
  assert.match(page, /parseProductIndexParams/);
  assert.match(controls, /method="get"/);
  assert.match(list, /AdminIndexResults/);
  assert.doesNotMatch(list, /\.filter\(\(product\)/);
});

test("Task 2 safe Product POST mapping remains present", () => {
  const route = source("src/app/api/admin/products/route.ts");
  assert.match(route, /mapProductAdminError/);
  assert.match(route, /mappedProductError/);
});
