import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const dynamicStoreRoutes = [
  "src/app/[locale]/page.tsx",
  "src/app/[locale]/products/page.tsx",
  "src/app/[locale]/products/[slug]/page.tsx",
  "src/app/[locale]/cart/page.tsx",
  "src/app/[locale]/checkout/page.tsx",
];

test("database-backed storefront routes render dynamically", () => {
  for (const path of dynamicStoreRoutes) {
    const source = readFileSync(path, "utf8");
    assert.match(source, /export const dynamic = ["']force-dynamic["']/,
      `${path} must remain runtime-dynamic so Admin catalogue changes do not require a rebuild`);
  }
});

const releaseFiles = [
  ".env.example",
  "README.md",
  "DEPLOYMENT.md",
  "SECURITY.md",
  "OPERATIONS.md",
  "ENVIRONMENT.md",
  "scripts/verify-source.mjs",
  "scripts/verify.ps1",
  "scripts/verify.sh",
  "scripts/bootstrap-admin.mjs",
  "prisma/migrations/migration_lock.toml",
  "prisma/migrations/20260926190000_initial/migration.sql",
];

test("production deployment and verification artifacts exist", () => {
  for (const path of releaseFiles) assert.equal(existsSync(path), true, `${path} should exist`);
});


test("pnpm 12 lockfile keeps package-manager environment separate from verified project graph", () => {
  const lock = readFileSync("pnpm-lock.yaml", "utf8");
  const workspace = readFileSync("pnpm-workspace.yaml", "utf8");
  assert.equal((lock.match(/^---$/gm) ?? []).length, 2);
  assert.match(lock, /packageManagerDependencies:\s+pnpm:\s+specifier: 12\.7\.0\s+version: 12\.7\.0/);
  assert.match(lock, /deepmerge-ts@:\s+8\.0\.2/);
  assert.doesNotMatch(lock, /deepmerge-ts@7\./);
  assert.match(workspace, /["']@pnpm\/exe["']:\s+true/);
});
