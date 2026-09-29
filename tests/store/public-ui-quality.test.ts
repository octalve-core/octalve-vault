import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function sourceFiles(root: string): string[] {
  if (!existsSync(root)) return [];
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
    const path = join(root, entry);
    if (statSync(path).isDirectory()) files.push(...sourceFiles(path));
    else if (/\.(?:ts|tsx)$/.test(entry)) files.push(path.replaceAll("\\", "/"));
  }
  return files;
}

const publicFeatureFiles = [
  ...sourceFiles("src/features/store"),
  ...sourceFiles("src/features/customer-vault"),
  ...sourceFiles("src/features/legal"),
];

test("public storefront avoids heavy SaaS typography and old Holding commerce imports", () => {
  assert.ok(publicFeatureFiles.length > 0);
  for (const file of publicFeatureFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /font-black|font-extrabold/, `${file} must use the approved lighter Octalve typography`);
    assert.doesNotMatch(
      source,
      /@\/features\/models\/vault|vault-products|vault-catalog|use-vault-cart|octalve-holding/,
      `${file} must not restore Holding commerce/business logic`,
    );
  }
});

test("public navigation retains accessible labels, focus states and >=44px mobile targets", () => {
  const header = readFileSync("src/features/store/layout/site-header.tsx", "utf8");
  const mobile = readFileSync("src/features/store/layout/mobile-vault-menu.tsx", "utf8");
  const cart = readFileSync("src/features/store/layout/cart-nav-action.tsx", "utf8");

  assert.match(header, /aria-label="Primary navigation"/);
  assert.match(header, /aria-label="Toggle navigation menu"/);
  assert.match(header, /aria-expanded=\{mobileOpen\}/);
  assert.match(header, /aria-controls="octalve-vault-mobile-menu"/);
  assert.match(header, /focus-visible:ring-2/);
  assert.match(header, /bg-\[#0064E0\][^"\n]*text-white/);

  assert.match(mobile, /aria-label="Mobile navigation"/);
  assert.match(mobile, /min-h-11/);
  assert.match(mobile, /overflow-x-hidden/);
  assert.match(mobile, /focus-visible:ring-2/);

  assert.match(cart, /aria-label=\{`\$\{label\} \(\$\{cart\.count\}\)`\}/);
  assert.match(cart, /h-11 w-11/);
});

test("every localized public page route stays thin and browser-state free", () => {
  const pages = sourceFiles("src/app/[locale]").filter((file) => file.endsWith("/page.tsx"));
  assert.ok(pages.length >= 10, "expected the localized Vault public routes");

  for (const page of pages) {
    const source = readFileSync(page, "utf8");
    const lines = source.split(/\r?\n/).length;
    assert.ok(lines <= 90, `${page} is ${lines} lines; move UI logic into features`);
    assert.doesNotMatch(source, /localStorage|sessionStorage|window\./, `${page} must not own browser state`);
  }
});

test("public source does not introduce raw HTML injection surfaces", () => {
  for (const file of publicFeatureFiles) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /dangerouslySetInnerHTML|\beval\s*\(|new Function\s*\(/, `${file} must not introduce unsafe executable/HTML injection`);
  }
});
