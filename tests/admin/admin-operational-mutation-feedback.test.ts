import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const refunds = readFileSync("src/features/admin/refunds/refund-panel.tsx", "utf8");
const downloads = readFileSync("src/features/admin/downloads/downloads-table.tsx", "utf8");
const marketing = readFileSync("src/features/admin/marketing/marketing-manager.tsx", "utf8");
const team = readFileSync("src/features/admin/team/team-manager.tsx", "utf8");
const settings = readFileSync("src/features/admin/settings/settings-form.tsx", "utf8");

test("refund notifications preserve initiated-versus-confirmed semantics", () => {
  assert.match(refunds, /adminNotice\.pending/);
  assert.match(refunds, /Initiating refund/);
  assert.match(refunds, /Refund initiated/);
  assert.match(refunds, /Checking refund status/);
  assert.match(refunds, /Refund status refreshed/);
  assert.doesNotMatch(refunds, /Refund completed/);
  assert.match(refunds, /ConfirmActionDialog/);
  assert.match(refunds, /router\.refresh\(\)/);
});

test("download revoke keeps confirmation locks and gains prominent notification feedback", () => {
  assert.match(downloads, /ConfirmActionDialog/);
  assert.match(downloads, /disabled=\{busy !== null\}/);
  assert.match(downloads, /adminNotice\.pending/);
  assert.match(downloads, /Download access revoked/);
  assert.match(downloads, /adminNotice\.error/);
  assert.match(downloads, /router\.refresh\(\)/);
});

test("Marketing and Team mutations report pending success and error while retaining refresh", () => {
  for (const [name, source] of [["Marketing", marketing], ["Team", team]]) {
    assert.match(source, /adminNotice\.pending/, name);
    assert.match(source, /adminNotice\.success/, name);
    assert.match(source, /adminNotice\.error/, name);
    assert.match(source, /router\.refresh\(\)/, name);
  }
});

test("Settings save refreshes confirmed server state and uses shared notification feedback", () => {
  assert.match(settings, /useRouter/);
  assert.match(settings, /adminNotice\.pending/);
  assert.match(settings, /Store settings saved/);
  assert.match(settings, /adminNotice\.error/);
  assert.match(settings, /router\.refresh\(\)/);
});

test("migrated active operational surfaces do not reintroduce browser alert or confirm", () => {
  for (const source of [refunds, downloads, marketing, team, settings]) {
    assert.doesNotMatch(source, /\bwindow\.alert\s*\(|\balert\s*\(|\bwindow\.confirm\s*\(|\bconfirm\s*\(/);
  }
});
