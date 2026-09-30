import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

test("Product summary uses database counts and the shared readiness predicate", () => {
  const service = source("src/server/admin/products-service.ts");

  assert.match(service, /export type AdminProductSummary/);
  assert.match(service, /buildProductReadyWhere\(\)/);
  assert.match(service, /prisma\.product\.count\(\)/);
  assert.match(service, /prisma\.product\.count\(\{\s*where:\s*readyWhere\s*\}\)/);
  assert.match(service, /status:\s*"COMING_SOON"/);
});

test("Product needs-attention includes DRAFT and ACTIVE-not-ready but excludes ARCHIVED", () => {
  const service = source("src/server/admin/products-service.ts");
  const summaryStart = service.indexOf(
    "export async function getAdminProductSummary",
  );
  assert.notEqual(summaryStart, -1);

  const summary = service.slice(summaryStart);

  assert.match(summary, /status:\s*"DRAFT"/);
  assert.match(
    summary,
    /AND:\s*\[\s*\{\s*status:\s*"ACTIVE"\s*\},\s*\{\s*NOT:\s*readyWhere\s*\}/,
  );
  assert.doesNotMatch(summary, /status:\s*"ARCHIVED"/);
});
