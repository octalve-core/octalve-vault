import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const dialogPath =
  "src/features/admin/shared/confirm-action-dialog.tsx";
const downloadsPath =
  "src/features/admin/downloads/downloads-table.tsx";
const standalonePath =
  "src/features/admin/downloads/revoke-grant-button.tsx";
const refundPath =
  "src/features/admin/refunds/refund-panel.tsx";

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("shared confirmation dialog is accessible, keyboard-safe and pending-locked", () => {
  assert.equal(
    existsSync(dialogPath),
    true,
    "shared confirmation dialog component must exist",
  );

  const dialog = source(dialogPath);

  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /aria-labelledby=\{titleId\}/);
  assert.match(dialog, /aria-describedby=\{descriptionId\}/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(
    dialog,
    /event\.key\s*(?:===|!==)\s*"Tab"/,
  );
  assert.match(dialog, /previousFocus\?\.focus\(\)/);
  assert.match(dialog, /aria-busy=\{pending\}/);
  assert.match(dialog, /disabled=\{pending\}/);
  assert.match(dialog, /confirmLabel/);
  assert.match(dialog, /pendingLabel/);
});

test("both download revoke surfaces require the shared confirmation dialog", () => {
  const downloads = source(downloadsPath);
  const standalone = source(standalonePath);

  assert.match(
    downloads,
    /import \{ ConfirmActionDialog \} from "@\/features\/admin\/shared\/confirm-action-dialog";/,
  );
  assert.match(
    downloads,
    /const \[confirmGrantId, setConfirmGrantId\] = useState<string \| null>\(null\);/,
  );
  assert.match(
    downloads,
    /onClick=\{\(\) => setConfirmGrantId\(grant\.id\)\}/,
  );
  assert.match(
    downloads,
    /open=\{confirmGrantId !== null\}/,
  );
  assert.match(
    downloads,
    /title="Revoke download access\?"/,
  );
  assert.match(
    downloads,
    /confirmLabel="Revoke access"/,
  );
  assert.doesNotMatch(downloads, /\bconfirm\(/);

  assert.match(
    standalone,
    /import \{ ConfirmActionDialog \} from "@\/features\/admin\/shared\/confirm-action-dialog";/,
  );
  assert.match(
    standalone,
    /const \[confirmOpen, setConfirmOpen\] = useState\(false\);/,
  );
  assert.match(
    standalone,
    /onClick=\{\(\) => setConfirmOpen\(true\)\}/,
  );
  assert.match(
    standalone,
    /open=\{confirmOpen\}/,
  );
  assert.doesNotMatch(standalone, /\bconfirm\(/);
  assert.doesNotMatch(standalone, /\bwindow\.confirm\(/);
});

test("refund initiation requires confirmation after validation but Sync stays immediate", () => {
  const refund = source(refundPath);

  assert.match(
    refund,
    /import \{ ConfirmActionDialog \} from "@\/features\/admin\/shared\/confirm-action-dialog";/,
  );
  assert.match(
    refund,
    /const \[pendingRefundForm, setPendingRefundForm\] = useState<FormData \| null>\(null\);/,
  );
  assert.match(
    refund,
    /function requestRefund\(form: FormData\)/,
  );
  assert.match(refund, /setPendingRefundForm\(form\)/);
  assert.match(refund, /action=\{requestRefund\}/);
  assert.match(
    refund,
    /open=\{pendingRefundForm !== null\}/,
  );
  assert.match(
    refund,
    /title="Initiate provider refund\?"/,
  );
  assert.match(
    refund,
    /confirmLabel="Initiate refund"/,
  );
  assert.match(
    refund,
    /await submit\(form\)/,
  );

  assert.match(
    refund,
    /onClick=\{\(\) => void sync\(refund\.id\)\}/,
  );
  assert.match(
    refund,
    /\{syncingId === refund\.id \? "Syncing\.\.\." : "Sync"\}/,
  );

  assert.equal(
    (refund.match(/<ConfirmActionDialog/g) ?? []).length,
    1,
    "RefundPanel should confirm initiation only, not routine Sync",
  );
});

test("PS1-03 action feedback and duplicate locks remain present", () => {
  const downloads = source(downloadsPath);
  const standalone = source(standalonePath);
  const refund = source(refundPath);

  assert.match(downloads, /<AdminActionStatus/);
  assert.match(downloads, /if \(busy !== null\) return;/);
  assert.match(downloads, /aria-busy=\{busy === grant\.id\}/);

  assert.match(standalone, /<AdminActionStatus/);
  assert.match(standalone, /if \(busy\) return;/);
  assert.match(standalone, /aria-busy=\{busy\}/);

  assert.match(refund, /<AdminActionStatus/);
  assert.match(refund, /if \(syncingId !== null\) return;/);
  assert.match(refund, /if \(submitting\) return;/);
  assert.match(refund, /aria-busy=\{submitting\}/);
});
