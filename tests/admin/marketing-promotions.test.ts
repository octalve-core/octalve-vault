import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function read(path: string) {
  const url = new URL(path, import.meta.url);
  assert.ok(existsSync(fileURLToPath(url)), `${path} must exist`);
  return readFileSync(url, "utf8");
}

test("promotion and affiliate Admin surfaces are permission-gated and audited", () => {
  const permissions = read("../../src/domain/permissions.ts");
  const route = read("../../src/app/api/admin/promotions/route.ts");
  const page = read("../../src/app/admin/(protected)/marketing/page.tsx");
  const service = read("../../src/server/admin/promotions-service.ts");
  const ordersTable = read("../../src/features/admin/orders/orders-table.tsx");
  assert.match(permissions, /marketing\.read/);
  assert.match(permissions, /marketing\.write/);
  assert.match(route, /requireAdminPermission\(request, "marketing\.read"\)/);
  assert.match(route, /requireAdminPermission\(request, "marketing\.write"\)/);
  assert.match(page, /requireAdminPage\("marketing\.read"\)/);
  assert.match(service, /writeAdminAudit/);
  assert.match(service, /COUPON_/);
  assert.match(service, /AFFILIATE_/);
  const adminBlock = permissions.match(/ADMIN:\s*\[([\s\S]*?)\],/)?.[1] ?? "";
  assert.match(adminBlock, /marketing\.read/);
  assert.match(adminBlock, /marketing\.write/);
  const auditorBlock = permissions.match(/AUDITOR:\s*\[([\s\S]*?)\],/)?.[1] ?? "";
  assert.match(auditorBlock, /marketing\.read/);
  assert.doesNotMatch(auditorBlock, /marketing\.write/);
  assert.match(ordersTable, /couponCode/);
  assert.match(ordersTable, /affiliateCode/);
  assert.match(ordersTable, /affiliateCommissionBps/);
});
