import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  customerGroupHaving,
  parseCustomerIndexParams,
  qualifyingCustomerOrderWhere,
} from "../../src/server/admin/customers-index.ts";
import {
  buildDownloadWhere,
  parseDownloadIndexParams,
} from "../../src/server/admin/downloads-index.ts";

const root = process.cwd();
const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

test("Customers are derived only from qualifying LIVE paid orders", () => {
  const input = parseCustomerIndexParams(
    new URLSearchParams({
      q: "buyer@example.com",
      segment: "repeat",
      currency: "USD",
    }),
  );

  const where = JSON.stringify(
    qualifyingCustomerOrderWhere(input),
  );
  const having = JSON.stringify(
    customerGroupHaving(input),
  );

  assert.match(where, /"environment":"LIVE"/);
  assert.match(where, /"status":"SUCCEEDED"/);
  assert.match(where, /"currency":"USD"/);
  assert.match(having, /"_count":\{"gte":2\}/);
});

test("Download state and environment filters are derived server-side", () => {
  const input = parseDownloadIndexParams(
    new URLSearchParams({
      q: "guide",
      state: "expired",
      environment: "LIVE",
      product: "vp_001",
    }),
  );
  const now = new Date("2026-09-30T12:00:00.000Z");
  const serialized = JSON.stringify(
    buildDownloadWhere(input, now),
  );

  assert.match(serialized, /downloadFilename/);
  assert.match(serialized, /productSlug/);
  assert.match(serialized, /"environment":"LIVE"/);
  assert.match(serialized, /expiresAt/);
  assert.match(serialized, /revokedAt/);
});

test("Customer grouping and Download pagination replace unbounded legacy list functions", () => {
  const customers = source(
    "src/server/admin/customers-service.ts",
  );
  const downloads = source(
    "src/server/admin/downloads-service.ts",
  );
  const operations = source(
    "src/server/admin/operations-service.ts",
  );

  assert.match(customers, /prisma\.order\.groupBy/);
  assert.match(customers, /skip,\s*take/);
  assert.match(customers, /by:\s*\["email",\s*"currency"\]/);
  assert.match(downloads, /skip,\s*take/);
  assert.match(downloads, /environment:\s*"LIVE"/);
  assert.doesNotMatch(
    operations,
    /export async function listAdminCustomers/,
  );
  assert.doesNotMatch(
    operations,
    /export async function listAdminDownloads/,
  );
});

test("Customer and Download pages use the common operations presentation", () => {
  for (const relative of [
    "src/app/admin/(protected)/customers/page.tsx",
    "src/app/admin/(protected)/downloads/page.tsx",
  ]) {
    const page = source(relative);
    assert.match(page, /AdminIndexResults/);
    assert.match(page, /IndexControls/);
    assert.match(page, /Summary/);
    assert.ok(
      page.split(/\r?\n/).length <= 90,
      `${relative} should remain composition-focused`,
    );
  }

  const downloadsPage = source(
    "src/app/admin/(protected)/downloads/page.tsx",
  );
  const downloadsTable = source(
    "src/features/admin/downloads/downloads-table.tsx",
  );
  assert.match(downloadsPage, /environment/);
  assert.match(downloadsTable, /EXPIRED/);
  assert.match(downloadsTable, /\/revoke/);
});
