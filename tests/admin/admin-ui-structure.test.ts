import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const protectedPages = [
  "products/page.tsx",
  "products/[id]/page.tsx",
  "orders/page.tsx",
  "payments/page.tsx",
  "customers/page.tsx",
  "downloads/page.tsx",
  "team/page.tsx",
  "audit/page.tsx",
  "settings/page.tsx",
] as const;

test("operational Admin pages exist inside the protected route group", () => {
  for (const relative of protectedPages) {
    const path = `src/app/admin/(protected)/${relative}`;
    assert.equal(existsSync(path), true, `${path} should exist`);
  }
});

test("Admin page.tsx files remain composition-focused", () => {
  for (const relative of protectedPages) {
    const path = `src/app/admin/(protected)/${relative}`;
    if (!existsSync(path)) continue;
    const source = readFileSync(path, "utf8");
    assert.ok(source.split("\n").length <= 90, `${path} should remain a thin route component`);
    assert.equal(source.includes("process.env"), false, `${path} must not access environment variables directly`);
  }
});

test("product editor receives explicit RBAC capabilities from the protected page", () => {
  const page = readFileSync("src/app/admin/(protected)/products/[id]/page.tsx", "utf8");
  const editor = readFileSync("src/features/admin/products/product-editor.tsx", "utf8");
  assert.match(page, /hasPermission\(auth\.user\.role,\s*"product\.write"\)/);
  assert.match(page, /hasPermission\(auth\.user\.role,\s*"product\.price\.write"\)/);
  assert.match(page, /hasPermission\(auth\.user\.role,\s*"product\.publish"\)/);
  assert.match(editor, /canEditProduct/);
  assert.match(editor, /canEditPrice/);
  assert.match(editor, /canPublish/);
});
