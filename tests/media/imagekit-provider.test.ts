import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("ImageKit provider keeps private-key operations server-side and never accepts arbitrary verification URLs", () => {
  const path = "src/server/media/imagekit-provider.ts";
  assert.equal(existsSync(path), true);
  const source = readFileSync(path, "utf8");
  assert.match(source, /getUploadAuthParams/);
  assert.match(source, /api\.imagekit\.io\/v1\/files/);
  assert.match(source, /authorization:\s*basicAuth/);
  assert.match(source, /imageKitOriginalUrl\(filePath\)/);
  assert.match(source, /orig-true/);
  assert.match(source, /range:\s*"bytes=0-63"/);
  assert.doesNotMatch(source, /fetch\(input\.url|fetch\(body\.url|fetch\(.*browser/i);
});
