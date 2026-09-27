import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const pages = [
  "src/app/admin/login/page.tsx",
  "src/app/admin/(protected)/page.tsx",
  "src/app/admin/(protected)/products/page.tsx",
  "src/app/admin/(protected)/products/[id]/page.tsx",
  "src/app/admin/(protected)/orders/page.tsx",
  "src/app/admin/(protected)/customers/page.tsx",
  "src/app/admin/(protected)/downloads/page.tsx",
  "src/app/admin/(protected)/team/page.tsx",
  "src/app/admin/(protected)/audit/page.tsx",
  "src/app/admin/(protected)/settings/page.tsx",
];

test("admin routes are present", () => {
  for (const page of pages) assert.equal(existsSync(resolve(page)), true, `${page} must exist`);
});

test("admin page.tsx files stay compositional", () => {
  for (const page of pages) {
    if (!existsSync(resolve(page))) continue;
    const source = readFileSync(resolve(page), "utf8");
    assert.ok(source.split(/\r?\n/).length <= 100, `${page} should be split into focused components`);
    assert.doesNotMatch(source, /localStorage|window\.|process\.env/, `${page} must not own browser or env infrastructure logic`);
  }
});
