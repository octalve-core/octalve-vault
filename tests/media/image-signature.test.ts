import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

test("magic-byte detector accepts only approved image signatures", async () => {
  assert.equal(existsSync("src/server/media/image-signature.ts"), true);
  const { detectImageSignature } = await import("../../src/server/media/image-signature.ts");

  assert.equal(detectImageSignature(Uint8Array.from([0xff, 0xd8, 0xff, 0x00])), "image/jpeg");
  assert.equal(
    detectImageSignature(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/png",
  );
  assert.equal(
    detectImageSignature(Uint8Array.from([0x52,0x49,0x46,0x46,0,0,0,0,0x57,0x45,0x42,0x50])),
    "image/webp",
  );
  assert.equal(
    detectImageSignature(Uint8Array.from([0,0,0,0,0x66,0x74,0x79,0x70,0x61,0x76,0x69,0x66,0,0,0,0])),
    "image/avif",
  );
  assert.equal(detectImageSignature(new TextEncoder().encode("<script>alert(1)</script>")), null);
});
