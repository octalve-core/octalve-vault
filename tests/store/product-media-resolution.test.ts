import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

test("legacy and Vault fallback remain safe when ImageKit endpoint is not configured", async () => {
  assert.equal(existsSync("src/server/media/public-media.ts"), true);
  const previous = process.env.IMAGEKIT_URL_ENDPOINT;
  delete process.env.IMAGEKIT_URL_ENDPOINT;
  try {
    const { resolvePublicProductMedia } = await import("../../src/server/media/public-media.ts");
    assert.equal(
      resolvePublicProductMedia({ title: "Alpha", legacyImagePath: "/products/a.png", primary: null, gallery: [] }).imagePath,
      "/products/a.png",
    );
    assert.equal(
      resolvePublicProductMedia({ title: "Alpha", legacyImagePath: null, primary: null, gallery: [] }).imagePath,
      "/brand/vault-logo.png",
    );
  } finally {
    if (previous) process.env.IMAGEKIT_URL_ENDPOINT = previous;
  }
});

test("READY primary media wins and retired media never enters the public gallery", async () => {
  const previous = process.env.IMAGEKIT_URL_ENDPOINT;
  process.env.IMAGEKIT_URL_ENDPOINT = "https://ik.imagekit.io/demo";
  try {
    const { resolvePublicProductMedia } = await import("../../src/server/media/public-media.ts");
    const result = resolvePublicProductMedia({
      title: "Alpha",
      legacyImagePath: "/products/legacy.png",
      primary: {
        id: "pm1",
        altText: "Primary alpha",
        position: 1,
        mediaAsset: { providerFilePath: "/octalve-vault/products/a.webp", status: "READY" },
      },
      gallery: [
        {
          id: "pm2",
          altText: null,
          position: 2,
          mediaAsset: { providerFilePath: "/octalve-vault/products/b.webp", status: "RETIRED" },
        },
        {
          id: "pm1",
          altText: "Primary alpha",
          position: 1,
          mediaAsset: { providerFilePath: "/octalve-vault/products/a.webp", status: "READY" },
        },
      ],
    });
    assert.match(result.imagePath, /\/tr:w-1400/);
    assert.match(result.cardImagePath, /\/tr:w-800/);
    assert.equal(result.imageAlt, "Primary alpha");
    assert.equal(result.gallery.length, 1);
  } finally {
    if (previous) process.env.IMAGEKIT_URL_ENDPOINT = previous;
    else delete process.env.IMAGEKIT_URL_ENDPOINT;
  }
});
