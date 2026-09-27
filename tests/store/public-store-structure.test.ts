import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const pages = [
  "src/app/[locale]/page.tsx",
  "src/app/[locale]/products/page.tsx",
  "src/app/[locale]/products/[slug]/page.tsx",
  "src/app/[locale]/cart/page.tsx",
];

test("localized public store routes exist", () => {
  for (const page of pages) {
    assert.equal(existsSync(resolve(root, page)), true, `${page} must exist`);
  }
});

test("public page.tsx files stay focused on composition", () => {
  for (const page of pages) {
    const source = readFileSync(resolve(root, page), "utf8");
    const lines = source.split(/\r?\n/).length;
    assert.ok(lines <= 90, `${page} is ${lines} lines; split sections instead`);
    assert.doesNotMatch(source, /localStorage|sessionStorage|window\./, `${page} must not own browser state`);
  }
});
