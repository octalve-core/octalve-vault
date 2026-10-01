import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("active Product editor has a distinct public Product media panel", () => {
  const panel = "src/features/admin/products/product-media-panel.tsx";
  assert.equal(existsSync(panel), true);
  const editor = readFileSync("src/features/admin/products/product-editor.tsx", "utf8");
  const page = readFileSync("src/app/admin/(protected)/products/[id]/page.tsx", "utf8");
  assert.match(editor, /ProductMediaPanel/);
  assert.match(editor, /Private product files/);
  assert.match(page, /getAdminProductMedia/);
  assert.match(page, /productMedia=/);
});

test("Product media routes are specific permission-gated operations", () => {
  for (const path of [
    "src/app/api/admin/products/[id]/media/route.ts",
    "src/app/api/admin/products/[id]/media/reorder/route.ts",
    "src/app/api/admin/products/[id]/media/[productMediaId]/route.ts",
    "src/app/api/admin/products/[id]/media/[productMediaId]/primary/route.ts",
  ]) {
    assert.equal(existsSync(path), true, path);
    assert.match(readFileSync(path, "utf8"), /requireAdminPermission/);
  }
});

test("Product creation accepts only an optional MediaAsset identifier and retains DRAFT lifecycle", () => {
  const service = readFileSync("src/server/admin/products-service.ts", "utf8");
  const route = readFileSync("src/app/api/admin/products/route.ts", "utf8");
  const form = readFileSync("src/features/admin/products/product-create-page-form.tsx", "utf8");
  assert.match(service, /primaryMediaAssetId\?:\s*string/);
  assert.match(service, /status:\s*"DRAFT"/);
  assert.match(service, /PRODUCT_MEDIA_INVALID/);
  assert.match(route, /primaryMediaAssetId/);
  assert.match(form, /MediaPicker/);
  assert.match(form, /primaryMediaAssetId/);
  assert.doesNotMatch(route + form, /imageUrl|providerFilePath|providerAssetId/);
});
