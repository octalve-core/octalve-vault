import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const schema = readFileSync(
  new URL("../../prisma/schema.prisma", import.meta.url),
  "utf8",
);

const match = schema.match(
  /model\s+ProductPrice\s+\{([\s\S]*?)\n\}/,
);

assert.ok(match, "ProductPrice model must exist");

const productPrice = match[1] ?? "";

test("ProductPrice keeps regular amount and adds optional per-currency sale amount", () => {
  assert.match(
    productPrice,
    /\bamountMinor\s+Int\b/,
    "amountMinor must remain the regular price",
  );

  assert.match(
    productPrice,
    /\bsaleAmountMinor\s+Int\?(?:\s|$)/,
    "Batch G requires nullable saleAmountMinor",
  );

  assert.match(
    productPrice,
    /@@unique\(\[productId,\s*currency\]\)/,
    "per-currency ProductPrice authority must remain",
  );
});

test("Batch G sale-pricing migration exists and stays additive", () => {
  const migrations = readdirSync(
    new URL("../../prisma/migrations/", import.meta.url),
  );

  const migration = migrations.find((name) =>
    /product_sale_pricing/i.test(name),
  );

  assert.ok(
    migration,
    "Batch G product_sale_pricing migration is missing",
  );

  const sql = readFileSync(
    new URL(
      `../../prisma/migrations/${migration}/migration.sql`,
      import.meta.url,
    ),
    "utf8",
  );

  assert.match(
    sql,
    /ADD\s+(?:COLUMN\s+)?"saleAmountMinor"\s+INTEGER/i,
  );

  assert.doesNotMatch(sql, /\bDROP\s+TABLE\b/i);
  assert.doesNotMatch(sql, /\bDROP\s+COLUMN\b/i);
  assert.doesNotMatch(sql, /\bRENAME\s+(?:TABLE|COLUMN)\b/i);
  assert.doesNotMatch(
    sql,
    /\b(?:CHECK|CONSTRAINT)\b/i,
    "sale price validity must remain server-authoritative",
  );

  for (const protectedTable of [
    "Order",
    "OrderItem",
    "PaymentAttempt",
    "Refund",
    "DownloadGrant",
    "DownloadTicket",
    "ProductAsset",
    "MediaAsset",
    "ProductMedia",
  ]) {
    assert.doesNotMatch(
      sql,
      new RegExp(`ALTER\\s+TABLE\\s+"?${protectedTable}"?`, "i"),
      `migration must not alter protected table ${protectedTable}`,
    );
  }
});