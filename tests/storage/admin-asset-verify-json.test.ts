import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

test("asset verification route serializes Prisma BigInt sizeBytes before JSON response", () => {
  const routePath = path.join(
    process.cwd(),
    "src",
    "app",
    "api",
    "admin",
    "assets",
    "[id]",
    "verify",
    "route.ts",
  );

  const source = readFileSync(routePath, "utf8");

  assert.match(
    source,
    /sizeBytes:\s*asset\.sizeBytes\.toString\(\)/,
    "verification response must serialize ProductAsset.sizeBytes as a string",
  );

  assert.doesNotMatch(
    source,
    /NextResponse\.json\(\{\s*asset\s*\}\)/s,
    "verification route must not return the raw Prisma ProductAsset object",
  );
});
