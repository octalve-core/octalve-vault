import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("upload request allowlists extension MIME and size", async () => {
  assert.equal(existsSync("src/server/media/media-validation.ts"), true);
  const { validateMediaUploadRequest } = await import("../../src/server/media/media-validation.ts");

  assert.equal(
    validateMediaUploadRequest({ originalFilename: "product.webp", mimeType: "image/webp", sizeBytes: 1024 }).extension,
    ".webp",
  );
  assert.throws(() => validateMediaUploadRequest({ originalFilename: "evil.svg", mimeType: "image/svg+xml", sizeBytes: 10 }));
  assert.throws(() => validateMediaUploadRequest({ originalFilename: "evil.jpg.exe", mimeType: "image/jpeg", sizeBytes: 10 }));
  assert.throws(() => validateMediaUploadRequest({ originalFilename: "fake.jpg", mimeType: "text/html", sizeBytes: 10 }));
  assert.throws(() => validateMediaUploadRequest({ originalFilename: "huge.jpg", mimeType: "image/jpeg", sizeBytes: 11 * 1024 * 1024 }));
});

test("provider validation rejects wrong folder private unpublished and decompression-bomb dimensions", async () => {
  assert.equal(existsSync("src/server/media/media-validation.ts"), true);
  const { validateProviderImage } = await import("../../src/server/media/media-validation.ts");
  const good = {
    fileType: "image",
    mime: "image/png",
    size: 1000,
    width: 1000,
    height: 1000,
    filePath: "/octalve-vault/products/a.png",
    isPrivateFile: false,
    isPublished: true,
  };
  assert.equal(validateProviderImage(good), "image/png");
  for (const mime of [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]) {
    assert.equal(
      validateProviderImage({
        ...good,
        mime,
        filePath: "/octalve-vault/products/opaque-provider-name",
      }),
      mime,
    );
  }
  assert.throws(() =>
    validateProviderImage({ ...good, mime: "image/svg+xml" }),
  );
  assert.throws(() => validateProviderImage({ ...good, filePath: "/other/a.png" }));
  assert.throws(() => validateProviderImage({ ...good, isPrivateFile: true }));
  assert.throws(() => validateProviderImage({ ...good, isPublished: false }));
  assert.throws(() => validateProviderImage({ ...good, width: 12001 }));
  assert.throws(() => validateProviderImage({ ...good, width: 10000, height: 6000 }));
});

test("upload auth and registration are same-origin Admin POST routes with dual rate limits", () => {
  for (const route of [
    "src/app/api/admin/media/upload-auth/route.ts",
    "src/app/api/admin/media/register/route.ts",
  ]) assert.equal(existsSync(route), true);

  const auth = readFileSync("src/app/api/admin/media/upload-auth/route.ts", "utf8");
  const register = readFileSync("src/app/api/admin/media/register/route.ts", "utf8");
  assert.match(auth, /export async function POST/);
  assert.match(auth, /requireAdminPermission\(request,\s*"product\.write"\)/);
  assert.match(auth, /admin\.media\.upload-auth\.hour/);
  assert.match(auth, /admin\.media\.upload-auth\.day/);
  assert.match(auth, /limit:\s*20/);
  assert.match(auth, /limit:\s*60/);
  assert.match(register, /requireAdminPermission\(request,\s*"product\.write"\)/);
  assert.match(register, /registerMediaAsset/);
  assert.doesNotMatch(auth + register, /NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY/);
});
