import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const footerPath = resolve(process.cwd(), "src/features/store/layout/site-footer.tsx");
const source = readFileSync(footerPath, "utf8");

test("footer uses the canonical Octalve dark greeting and social presentation", () => {
  assert.match(source, /bg-\[#020B1C\]/i);
  assert.match(source, /text-4xl/);
  assert.match(source, /#0A84FF/i);
  assert.match(source, /facebook\.com\/octalve/i);
  assert.match(source, /linkedin\.com\/company\/octalve/i);
  assert.match(source, /instagram\.com\/octalve_/i);
  assert.match(source, /x\.com\/octalve/i);
  assert.match(source, /\/brand\/octalve-logo\.png/);
});

test("footer contains Vault, Help & Support, Legal and Octalve groups", () => {
  for (const label of ["Vault", "Help & Support", "Legal", "Octalve"]) {
    assert.match(source, new RegExp(`>${label}<|\\"${label}\\"`), `${label} group must exist`);
  }
  assert.match(source, /localeHref\(locale, "\/products"\)/);
  assert.match(source, /localeHref\(locale, "\/cart"\)/);
  assert.match(source, /localeHref\(locale, "\/checkout"\)/);
  assert.match(source, /localeHref\(locale, "\/vault"\)/);
  assert.match(source, /localeHref\(locale, "\/contact"\)/);
  assert.match(source, /localeHref\(locale, "\/privacy"\)/);
  assert.match(source, /localeHref\(locale, "\/terms"\)/);
  assert.match(source, /localeHref\(locale, "\/refund-policy"\)/);
  assert.match(source, /localeHref\(locale, "\/digital-product-license"\)/);
});

test("footer does not restore Holding-only models or suite navigation", () => {
  assert.doesNotMatch(source, /Octalve Node|Octalve Consult|Launch-Suite|Impact-Suite|Growth-Suite/);
  assert.match(source, /https:\/\/octalve\.com/);
  assert.match(source, /border-white\/10/);
  assert.match(source, /font-medium/);
});
