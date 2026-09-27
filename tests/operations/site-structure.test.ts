import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

test("health, robots, sitemap and localized legal routes exist", () => {
  const files = [
    "src/app/api/health/route.ts",
    "src/app/robots.ts",
    "src/app/sitemap.ts",
    "src/app/[locale]/privacy/page.tsx",
    "src/app/[locale]/terms/page.tsx",
    "src/app/[locale]/refund-policy/page.tsx",
    "src/app/[locale]/digital-product-license/page.tsx",
  ];
  for (const file of files) assert.equal(existsSync(file), true, `${file} should exist`);
});

test("security headers are centrally configured", () => {
  const source = readFileSync("next.config.ts", "utf8");
  for (const directive of ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy"]) {
    assert.equal(source.includes(directive), true, `${directive} should be configured`);
  }
});
