import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

function source(relativePath: string): string {
  return readFileSync(path.join(root, relativePath), "utf8");
}

test("product creation requests token entropy accepted by the shared token contract", () => {
  const random = source("src/domain/random.ts");
  const products = source("src/server/admin/products-service.ts");

  const minimumMatch = random.match(/bytes\s*<\s*(\d+)/);
  assert.ok(minimumMatch, "shared token helper minimum entropy guard must be explicit");

  const createStart = products.indexOf("export async function createAdminProduct");
  assert.notEqual(createStart, -1, "createAdminProduct must exist");

  const createEnd = products.indexOf("export async function", createStart + 1);
  const createBlock =
    createEnd === -1 ? products.slice(createStart) : products.slice(createStart, createEnd);

  const call = createBlock.match(/generateOpaqueToken\((\d+)\)/);
  assert.ok(call, "createAdminProduct must generate an opaque product id token");

  const minimumBytes = Number(minimumMatch[1]);
  const requestedBytes = Number(call[1]);

  assert.ok(
    requestedBytes >= minimumBytes,
    `product creation requests ${requestedBytes} bytes but the shared token helper requires at least ${minimumBytes}`,
  );
});

test("product creation has a dedicated safe error mapping contract", async () => {
  const mapperRelative = "src/server/admin/admin-errors.ts";
  const mapperPath = path.join(root, mapperRelative);

  assert.equal(
    existsSync(mapperPath),
    true,
    `${mapperRelative} must exist so product creation can distinguish safe validation errors from internal failures`,
  );

  const mapperModule = await import(pathToFileURL(mapperPath).href);
  assert.equal(
    typeof mapperModule.mapProductAdminError,
    "function",
    "admin-errors.ts must export mapProductAdminError",
  );

  const invalidSlug = mapperModule.mapProductAdminError(new Error("Invalid product slug."));
  assert.deepEqual(invalidSlug, {
    status: 400,
    body: {
      code: "PRODUCT_SLUG_INVALID",
      field: "slug",
      error: "Use lowercase letters, numbers and hyphens only.",
    },
  });

  const internal = mapperModule.mapProductAdminError(
    new Error("Token entropy must be between 16 and 128 bytes."),
  );
  assert.deepEqual(internal, {
    status: 500,
    body: {
      code: "PRODUCT_CREATE_FAILED",
      error: "We couldn't create the product. Review the details and try again.",
    },
  });
});

test("POST /api/admin/products uses the safe product error mapping before generic Admin errors", () => {
  const route = source("src/app/api/admin/products/route.ts");

  assert.match(
    route,
    /mapProductAdminError/,
    "product POST route must use the product-specific safe error mapper",
  );

  assert.match(
    route,
    /PRODUCT_CREATE_FAILED|mappedProductError|productError/,
    "product POST route must turn mapped product failures into the safe response",
  );
});
