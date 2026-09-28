import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("asset publish route serializes Prisma BigInt sizeBytes before JSON response", () => {
  const routePath = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "admin",
    "assets",
    "[id]",
    "publish",
    "route.ts",
  );

  const source = readFileSync(routePath, "utf8");

  assert.match(
    source,
    /sizeBytes:\s*asset\.sizeBytes\.toString\(\)/,
    "publish response must serialize ProductAsset.sizeBytes as a string",
  );

  assert.doesNotMatch(
    source,
    /asset:\s*await\s+publishProductAsset\(/,
    "publish route must not return the raw Prisma ProductAsset directly",
  );
});
