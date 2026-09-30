import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const providerPath = "src/features/admin/shared/admin-notification-provider.tsx";
const shellPath = "src/features/admin/layout/admin-shell.tsx";

test("shared Admin notification provider has a stable accessible lifecycle", () => {
  assert.equal(existsSync(providerPath), true, "Admin notification provider must exist");
  const source = readFileSync(providerPath, "utf8");
  assert.match(source, /"pending"\s*\|\s*"success"\s*\|\s*"warning"\s*\|\s*"error"/);
  assert.match(source, /octalve:admin-notice/);
  assert.match(source, /MAX_NOTICES\s*=\s*4/);
  assert.match(source, /adminNotice/);
  assert.match(source, /pending\(/);
  assert.match(source, /success\(/);
  assert.match(source, /warning\(/);
  assert.match(source, /error\(/);
  assert.match(source, /dismiss\(/);
  assert.match(source, /role=\{notice\.state === "error" \? "alert" : "status"\}/);
  assert.match(source, /aria-live=\{notice\.state === "error" \? "assertive" : "polite"\}/);
  assert.match(source, /aria-atomic="true"/);
  assert.match(source, /motion-reduce:/);
});

test("Admin shell mounts exactly one shared notification provider", () => {
  const shell = readFileSync(shellPath, "utf8");
  assert.match(shell, /AdminNotificationProvider/);
  assert.equal((shell.match(/<AdminNotificationProvider\s*\/>/g) ?? []).length, 1);
});
