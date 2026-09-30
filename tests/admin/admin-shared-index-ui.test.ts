import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  adminIndexHref,
  toAdminUrlSearchParams,
} from "../../src/features/admin/shared/admin-search-params.ts";

const root = process.cwd();
const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

test("Admin searchParams records preserve repeated values", () => {
  const params = toAdminUrlSearchParams({
    q: "alpha",
    status: ["ACTIVE", "DRAFT"],
    empty: undefined,
  });

  assert.equal(params.get("q"), "alpha");
  assert.deepEqual(params.getAll("status"), ["ACTIVE", "DRAFT"]);
  assert.equal(params.has("empty"), false);
});

test("removing an Admin filter preserves unrelated query state and resets page", () => {
  assert.equal(
    adminIndexHref(
      "/admin/products",
      "q=alpha&status=ACTIVE&page=3&sort=oldest&pageSize=50",
      { removeParams: ["q"], resetPage: true },
    ),
    "/admin/products?status=ACTIVE&sort=oldest&pageSize=50",
  );
});

test("Admin pagination preserves validated query state and omits page one", () => {
  assert.equal(
    adminIndexHref(
      "/admin/products",
      "q=alpha&status=ACTIVE&page=3&pageSize=25",
      { page: 1 },
    ),
    "/admin/products?q=alpha&status=ACTIVE&pageSize=25",
  );

  assert.equal(
    adminIndexHref(
      "/admin/products",
      "q=alpha&status=ACTIVE&pageSize=25",
      { page: 2 },
    ),
    "/admin/products?q=alpha&status=ACTIVE&pageSize=25&page=2",
  );
});

test("shared Admin result presentation owns filter chips and pagination links", () => {
  const results = source(
    "src/features/admin/shared/admin-index-results.tsx",
  );

  assert.match(results, /ResourceIndexActiveFilter/);
  assert.match(results, /adminIndexHref/);
  assert.match(results, /filter\.params/);
  assert.match(results, /resetPage:\s*true/);
  assert.match(results, /Previous/);
  assert.match(results, /Next/);
});

test("shared Admin summary cards preserve the approved visual system", () => {
  const summary = source(
    "src/features/admin/shared/admin-summary-grid.tsx",
  );

  for (const tone of [
    "bg-blue-50",
    "bg-violet-50",
    "bg-amber-50",
    "bg-emerald-50",
  ]) {
    assert.match(summary, new RegExp(tone));
  }

  assert.match(summary, /rounded-\[28px\]/);
  assert.match(summary, /border-b-\[3px\]/);
  assert.match(summary, /shadow-\[0_12px_36px_rgba\(15,23,42,0\.04\)\]/);
  assert.match(summary, /LucideIcon/);
  assert.match(summary, /sm:grid-cols-2/);
  assert.match(summary, /xl:grid-cols-4/);
  assert.doesNotMatch(summary, /font-black|font-extrabold/);
});
