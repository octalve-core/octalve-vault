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

test("Admin commerce history renders explicit TEST or LIVE payment environment", () => {
  const orders = readFileSync("src/features/admin/orders/orders-table.tsx", "utf8");
  const payments = readFileSync("src/features/admin/payments/payments-table.tsx", "utf8");
  const downloads = readFileSync("src/features/admin/downloads/downloads-table.tsx", "utf8");
  const downloadsPage = readFileSync(
    "src/app/admin/(protected)/downloads/page.tsx",
    "utf8",
  );

  for (const source of [orders, payments, downloads]) {
    assert.match(source, /environment/);
  }

  assert.match(
    orders,
    /provider.*environment.*status|environment.*status/s,
  );
  assert.match(payments, /environment/);
  assert.match(downloadsPage, /environment/);

  // Preserve the newer production promotion presentation.
  assert.match(orders, /discountAmount/);
  assert.match(orders, /couponCode/);
  assert.match(orders, /affiliateCode/);
});

test("Admin payments page delegates refundable-order environment filtering to the server", () => {
  const page = readFileSync(
    "src/app/admin/(protected)/payments/page.tsx",
    "utf8",
  );

  assert.match(page, /listAdminRefundableOrders/);
  assert.doesNotMatch(page, /orders\.filter\(/);
});
