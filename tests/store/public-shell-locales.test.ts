import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const LEGAL_COPY_SHA256 = "7513ae5f3f672cc557ef6585565f267d895fd305a65c02f984a4963b142932d3";

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("localized public shell preserves EN/FR/AR direction and the shared Octalve header/footer", () => {
  const layout = read("src/app/[locale]/layout.tsx");
  assert.match(layout, /SiteHeader locale=\{locale\}/);
  assert.match(layout, /SiteFooter locale=\{locale\}/);
  assert.match(layout, /dir=\{isRtlLocale\(locale\) \? "rtl" : "ltr"\}/);
  assert.match(layout, /lang=\{locale\}/);
  assert.match(layout, /bg-\[#F8FAFC\]/);
  assert.match(layout, /text-\[#000A16\]/);
});

test("legal copy remains byte-stable while its presentation adopts Octalve medium typography", () => {
  const legal = read("src/features/legal/legal-page.tsx");
  const start = legal.indexOf("const copy:");
  const end = legal.indexOf("\nexport function LegalPage");
  assert.ok(start >= 0 && end > start, "legal copy block must remain identifiable");
  const copyHash = createHash("sha256").update(legal.slice(start, end)).digest("hex");
  assert.equal(copyHash, LEGAL_COPY_SHA256, "legal wording must not change during shell migration");

  assert.match(legal, /max-w-\[860px\]/);
  assert.match(legal, /font-medium/);
  assert.match(legal, /bg-white/);
  assert.doesNotMatch(legal, /font-black|font-extrabold/);
});

test("all legal routes remain localized thin compositions", () => {
  for (const route of ["privacy", "terms", "refund-policy", "digital-product-license"]) {
    const source = read(`src/app/[locale]/${route}/page.tsx`);
    assert.match(source, /isLocale/);
    assert.match(source, /notFound/);
    assert.match(source, /LegalPage/);
    assert.doesNotMatch(source, /prisma\.|fetch\(|<section|<article/);
  }
});

test("header and footer continue generating locale-relative public destinations", () => {
  const header = read("src/features/store/layout/site-header.tsx");
  const footer = read("src/features/store/layout/site-footer.tsx");
  assert.match(header, /locale=\{locale\}/);
  assert.match(footer, /localeHref\(locale, "\/products"\)/);
  assert.match(footer, /localeHref\(locale, "\/privacy"\)/);
  assert.match(footer, /localeHref\(locale, "\/terms"\)/);
});
