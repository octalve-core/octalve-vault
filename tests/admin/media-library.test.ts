import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("Media Library is a protected server-backed Admin resource", () => {
  const page = "src/app/admin/(protected)/media/page.tsx";
  assert.equal(existsSync(page), true);
  const source = readFileSync(page, "utf8");
  assert.match(source, /requireAdminPage\("product\.write"\)/);
  assert.match(source, /listAdminMedia/);
  assert.match(source, /getAdminMediaSummary/);
  assert.ok(source.split(/\r?\n/).length <= 100);
});

test("Admin shell exposes Media under existing catalogue authority", () => {
  const shell = readFileSync("src/features/admin/layout/admin-shell.tsx", "utf8");
  assert.match(shell, /href:\s*"\/admin\/media"[\s\S]*permission:\s*"product\.write"/);
});

test("retirement uses confirmation, stays soft and blocks in-use media", () => {
  const service = readFileSync("src/server/media/media-service.ts", "utf8");
  const ui = readFileSync("src/features/admin/media/media-library.tsx", "utf8");
  assert.match(service, /Remove or replace those usages first/);
  assert.match(service, /status:\s*"RETIRED"/);
  assert.doesNotMatch(service, /deleteFile|bulkDelete|method:\s*"DELETE"/i);
  assert.match(ui, /ConfirmActionDialog/);
  assert.match(ui, /View usage/);
  assert.match(ui, /Previous/);
  assert.match(ui, /Next/);
});
