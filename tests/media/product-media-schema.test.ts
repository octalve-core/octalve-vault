import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("Phase 2 adds provider-neutral first-class media and retains legacy imagePath", () => {
  assert.equal(existsSync("prisma/migrations/20261001070000_product_media_imagekit/migration.sql"), true);
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const migration = readFileSync("prisma/migrations/20261001070000_product_media_imagekit/migration.sql", "utf8");
  const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { dependencies?: Record<string, string> };

  assert.match(schema, /enum MediaProvider[\s\S]*IMAGEKIT/);
  assert.match(schema, /enum MediaAssetStatus[\s\S]*READY[\s\S]*RETIRED/);
  assert.match(schema, /model MediaAsset\s*{/);
  assert.match(schema, /model ProductMedia\s*{/);
  assert.match(schema, /imagePath\s+String\?/);
  assert.match(schema, /primaryMediaId\s+String\?/);
  assert.equal(pkg.dependencies?.["@imagekit/next"], "2.1.6");

  assert.match(migration, /CREATE TABLE "MediaAsset"/);
  assert.match(migration, /CREATE TABLE "ProductMedia"/);
  assert.match(migration, /ALTER TABLE "Product" ADD COLUMN "primaryMediaId"/);
  assert.doesNotMatch(migration, /\bDROP\s+(?:TABLE|COLUMN|TYPE)\b/i);
  assert.doesNotMatch(migration, /\bTRUNCATE\b|\bDELETE\s+FROM\b/i);
  for (const protectedTable of ["ProductAsset", "PaymentAttempt", "Refund", "DownloadGrant", "DownloadTicket"]) {
    assert.doesNotMatch(migration, new RegExp(`ALTER TABLE "${protectedTable}"`, "i"));
  }
});
