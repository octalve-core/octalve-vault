import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("catalogue resolves ProductMedia without changing private-asset purchase readiness", () => {
  const catalogue = readFileSync("src/features/store/catalogue/catalogue-service.ts", "utf8");
  assert.match(catalogue, /primaryMedia/);
  assert.match(catalogue, /media:/);
  assert.match(catalogue, /resolvePublicProductMedia/);
  assert.match(catalogue, /product\.status === "ACTIVE" && product\.assets\.length > 0/);
});

test("card modal and SEO detail use accessible resolved media", () => {
  assert.equal(existsSync("src/features/store/products/product-gallery.tsx"), true);
  const card = readFileSync("src/features/store/products/product-card.tsx", "utf8");
  const modal = readFileSync("src/features/store/products/product-detail-modal.tsx", "utf8");
  const detail = readFileSync("src/features/store/products/product-detail.tsx", "utf8");
  const gallery = readFileSync("src/features/store/products/product-gallery.tsx", "utf8");
  assert.match(card, /view\.cardImagePath/);
  assert.match(card, /view\.imageAlt/);
  assert.match(modal, /ProductGallery/);
  assert.match(detail, /ProductGallery/);
  assert.match(gallery, /aria-pressed/);
  assert.match(gallery, /unoptimized=/);
});

test("CSP and Next image policy allow only the configured ImageKit delivery origin and upload endpoint", () => {
  const config = readFileSync("next.config.ts", "utf8");
  assert.match(config, /IMAGEKIT_URL_ENDPOINT/);
  assert.match(config, /upload\.imagekit\.io/);
  assert.match(config, /remotePatterns/);
  assert.doesNotMatch(config, /img-src[^"`\n]*\shttps:\s/);
  assert.match(config, /object-src 'none'/);
});
