import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const required = [
  "src/app/api/health/route.ts",
  "src/app/api/admin/refunds/route.ts",
  "src/app/admin/(protected)/security/page.tsx",
  "src/app/[locale]/privacy/page.tsx",
  "src/app/[locale]/terms/page.tsx",
  "src/app/[locale]/refund-policy/page.tsx",
  "src/app/[locale]/digital-product-license/page.tsx",
  "src/app/robots.ts",
  "src/app/sitemap.ts",
];

test("operational, legal and SEO surfaces exist", () => {
  for (const path of required) assert.equal(existsSync(path), true, `${path} should exist`);
});

test("legal route components stay compositional and do not read env directly", () => {
  for (const path of required.filter((path) => path.includes("[locale]"))) {
    if (!existsSync(path)) continue;
    const source = readFileSync(path, "utf8");
    assert.ok(source.split("\n").length <= 70, `${path} should remain thin`);
    assert.equal(source.includes("process.env"), false);
  }
});

test("security headers are centralized in Next config", () => {
  const source = readFileSync("next.config.ts", "utf8");
  assert.match(source, /Content-Security-Policy/);
  assert.match(source, /X-Content-Type-Options/);
  assert.match(source, /Referrer-Policy/);
});

test("refund policy revokes access only after provider-confirmed full refund", () => {
  const source = readFileSync("src/features/legal/legal-page.tsx", "utf8");
  assert.match(source, /When a full refund is confirmed by the payment provider/);
  assert.match(source, /Lorsqu.un remboursement intégral est confirmé par le prestataire de paiement/);
  assert.match(source, /عند تأكيد مزود الدفع لاسترداد كامل/);
  assert.equal(source.includes("When a full refund is initiated for an order"), false);
});
