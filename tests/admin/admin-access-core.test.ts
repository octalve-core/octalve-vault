import test from "node:test";
import assert from "node:assert/strict";
import { PERMISSIONS, hasPermission } from "../../src/domain/permissions.ts";
import { adminSessionActive, assertAdminPermission } from "../../src/server/auth/admin-access-core.ts";

test("role permission boundaries are enforced", () => {
  assert.equal(hasPermission("SUPPORT", "product.price.write"), false);
  assert.equal(hasPermission("CATALOG_MANAGER", "admin.write"), false);
  assert.equal(hasPermission("AUDITOR", "product.write"), false);
  for (const permission of PERMISSIONS) assert.equal(hasPermission("SUPER_ADMIN", permission), true);
});

test("assertAdminPermission fails closed", () => {
  assert.throws(() => assertAdminPermission("SUPPORT", "product.price.write"), /permission/i);
  assert.doesNotThrow(() => assertAdminPermission("ADMIN", "product.price.write"));
});

test("revoked, expired, inactive or mismatched sessions are rejected", () => {
  const now = new Date("2026-09-26T18:00:00Z");
  const user = { id: "u1", active: true };
  const session = { userId: "u1", expiresAt: new Date("2026-09-26T19:00:00Z"), revokedAt: null };
  assert.equal(adminSessionActive(session, user, now), true);
  assert.equal(adminSessionActive({ ...session, revokedAt: now }, user, now), false);
  assert.equal(adminSessionActive({ ...session, expiresAt: now }, user, now), false);
  assert.equal(adminSessionActive(session, { ...user, active: false }, now), false);
  assert.equal(adminSessionActive(session, { ...user, id: "u2" }, now), false);
});
