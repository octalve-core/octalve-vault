import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function read(path: string) {
  const url = new URL(path, import.meta.url);
  const file = fileURLToPath(url);
  assert.ok(existsSync(file), `${path} must exist`);
  return readFileSync(file, "utf8");
}

test("contact route stays thin and composes the Octalve Vault contact view", () => {
  const route = read("../../src/app/[locale]/contact/page.tsx");
  assert.match(route, /ContactView/);
  assert.match(route, /isLocale/);
  assert.match(route, /publicEnv\.supportEmail/);
  assert.doesNotMatch(route, /<form|fetch\(|prisma\./);
});

test("contact view uses approved support methods and localized Vault destinations without a fake form", () => {
  const view = read("../../src/features/store/contact/contact-view.tsx");
  assert.match(view, /supportEmail/);
  assert.match(view, /\+234 807 345 9090/);
  assert.match(view, /wa\.me\/2348073459090/);
  assert.match(view, /localeHref\(locale, "\/products"\)/);
  assert.match(view, /localeHref\(locale, "\/vault"\)/);
  assert.match(view, /font-medium/);
  assert.doesNotMatch(view, /font-black|font-extrabold/);
  assert.doesNotMatch(view, /<form|onSubmit|\/api\/contact/);
  assert.doesNotMatch(view, /Anafaraa|Gwarimpa|office address/i);
});

test("header and footer expose the localized Contact destination", () => {
  const nav = read("../../src/features/store/layout/vault-nav.ts");
  const footer = read("../../src/features/store/layout/site-footer.tsx");
  assert.match(nav, /path:\s*"\/contact"/);
  assert.match(footer, /localeHref\(locale, "\/contact"\)/);
});
