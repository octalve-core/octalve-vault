import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (relative: string) => readFileSync(resolve(root, relative), "utf8");

test("Admin dashboard metrics use distinct visual identities with useful operational context", () => {
  const metrics = source("src/features/admin/dashboard/sections/metrics-grid.tsx");
  assert.match(metrics, /Paid LIVE orders/);
  assert.match(metrics, /Verified production purchases/);
  assert.match(metrics, /Access unlocked from LIVE purchases/);
  assert.match(metrics, /Unique LIVE buyers/);
  assert.match(metrics, /All lifecycle states/);
  assert.match(metrics, /bg-blue-50/);
  assert.match(metrics, /bg-violet-50/);
  assert.match(metrics, /bg-amber-50/);
  assert.match(metrics, /bg-emerald-50/);
  assert.match(metrics, /border-b-blue-500/);
  assert.match(metrics, /border-b-violet-500/);
  assert.match(metrics, /border-b-amber-500/);
  assert.match(metrics, /border-b-emerald-500/);
  assert.match(metrics, /rounded-\[28px\]/);
  assert.doesNotMatch(metrics, /font-black|font-extrabold/);
});

test("Recent dashboard orders state their LIVE-only scope without changing order data authority", () => {
  const orders = source("src/features/admin/dashboard/sections/recent-orders.tsx");
  const service = source("src/server/admin/operations-service.ts");
  assert.match(orders, /Recent LIVE orders/);
  assert.match(orders, /Latest production purchases\. TEST activity is excluded\./);
  assert.match(orders, /Production/);
  assert.match(orders, /rounded-\[28px\]/);
  assert.doesNotMatch(orders, /font-black|font-extrabold/);
  assert.match(service, /export async function getDashboardData/);
  assert.match(service, /prisma\.product\.count\(\)/);
  assert.match(service, /environment:\s*"LIVE"/);
});
