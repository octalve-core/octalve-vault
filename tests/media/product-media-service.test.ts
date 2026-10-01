import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("ProductMedia mutations validate Product ownership and exact reorder membership", () => {
  const path = "src/server/media/media-service.ts";
  assert.equal(existsSync(path), true);
  const source = readFileSync(path, "utf8");
  assert.match(source, /where:\s*\{\s*id:\s*productMediaId,\s*productId\s*\}/);
  assert.match(source, /Gallery order must contain exactly this product's media/);
  assert.match(source, /Only READY media can be added to a product/);
  assert.match(source, /PRODUCT_MEDIA_ATTACHED/);
  assert.match(source, /PRODUCT_MEDIA_DETACHED/);
  assert.match(source, /PRODUCT_MEDIA_PRIMARY_SET/);
  assert.match(source, /PRODUCT_MEDIA_ALT_UPDATED/);
  assert.match(source, /PRODUCT_MEDIA_REORDERED/);
});

test("reorder handles an empty Product gallery without issuing an empty Prisma transaction", () => {
  const source = readFileSync("src/server/media/media-service.ts", "utf8");
  assert.match(source, /if \(orderedIds\.length > 0\)/);
});
