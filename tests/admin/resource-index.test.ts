import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeSearchText,
  paginationMeta,
  parseDateRange,
  parsePage,
  parsePageSize,
  parseSort,
} from "../../src/server/admin/resource-index.ts";

test("normalizes search and bounded pagination inputs", () => {
  assert.equal(normalizeSearchText("  alpha   beta  "), "alpha beta");
  assert.equal(normalizeSearchText(null), "");
  assert.equal(parsePage("0"), 1);
  assert.equal(parsePage("-4"), 1);
  assert.equal(parsePage("3"), 3);
  assert.equal(parsePageSize("10"), 10);
  assert.equal(parsePageSize("100"), 100);
  assert.equal(parsePageSize("999"), 25);
  assert.equal(parseSort("oldest", ["newest", "oldest"] as const, "newest"), "oldest");
  assert.equal(parseSort("bad", ["newest", "oldest"] as const, "newest"), "newest");
});

test("date ranges are strict UTC date-only ranges with inclusive to-day semantics", () => {
  const range = parseDateRange("2026-09-01", "2026-09-30");
  assert.equal(range.from?.toISOString(), "2026-09-01T00:00:00.000Z");
  assert.equal(range.toExclusive?.toISOString(), "2026-10-01T00:00:00.000Z");
  assert.equal(parseDateRange("", "2026-09-30").from, undefined);
  assert.throws(() => parseDateRange("2026-02-31", ""), /Invalid date filter/);
  assert.throws(() => parseDateRange("2026-10-01", "2026-09-30"), /Invalid date range/);
});

test("pagination metadata preserves the requested page and exact total", () => {
  assert.deepEqual(paginationMeta(3, 25, 0), {
    page: 3,
    pageSize: 25,
    total: 0,
    totalPages: 0,
  });
  assert.deepEqual(paginationMeta(3, 25, 61), {
    page: 3,
    pageSize: 25,
    total: 61,
    totalPages: 3,
  });
});
