import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("ImageKit configuration is server-only and uses a clean HTTPS endpoint", async () => {
  const modulePath = "src/server/media/imagekit-config.ts";
  assert.equal(existsSync(modulePath), true);
  const source = readFileSync(modulePath, "utf8");
  assert.match(source, /IMAGEKIT_PRIVATE_KEY/);
  assert.match(source, /IMAGEKIT_PUBLIC_KEY/);
  assert.match(source, /IMAGEKIT_URL_ENDPOINT/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY/);

  const { normalizeImageKitEndpoint } = await import("../../src/server/media/imagekit-config.ts");
  assert.equal(
    normalizeImageKitEndpoint("https://ik.imagekit.io/demo/"),
    "https://ik.imagekit.io/demo",
  );
  assert.throws(() => normalizeImageKitEndpoint("http://ik.imagekit.io/demo"));
  assert.throws(() => normalizeImageKitEndpoint("https://user:pass@example.com/demo"));
  assert.throws(() => normalizeImageKitEndpoint("https://example.com/demo?x=1"));
});

test("ImageKit keys are documented with empty example values", () => {
  const env = readFileSync(".env.example", "utf8");
  assert.match(env, /^IMAGEKIT_PRIVATE_KEY=$/m);
  assert.match(env, /^IMAGEKIT_PUBLIC_KEY=$/m);
  assert.match(env, /^IMAGEKIT_URL_ENDPOINT=$/m);
});
