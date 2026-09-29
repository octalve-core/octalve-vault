import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const STATUS = "src/features/admin/shared/admin-action-status.tsx";
const DOWNLOADS = "src/features/admin/downloads/downloads-table.tsx";
const REVOKE = "src/features/admin/downloads/revoke-grant-button.tsx";
const REFUNDS = "src/features/admin/refunds/refund-panel.tsx";

function source(file: string) {
  return readFileSync(file, "utf8");
}

test("shared Admin action status provides accessible pending, success and error feedback", () => {
  assert.equal(
    existsSync(STATUS),
    true,
    "shared Admin action status component must exist",
  );

  const value = source(STATUS);

  assert.match(value, /state: "idle" \| "pending" \| "success" \| "error"/);
  assert.match(value, /role=\{feedback\.state === "error" \? "alert" : "status"\}/);
  assert.match(value, /aria-live=\{feedback\.state === "error" \? "assertive" : "polite"\}/);
});

test("download revoke table action is a visible semantic button with one in-flight lock and live result feedback", () => {
  const value = source(DOWNLOADS);

  assert.match(value, /type="button"/);
  assert.match(value, /disabled=\{busy !== null\}/);
  assert.match(value, /aria-busy=\{busy === grant\.id\}/);
  assert.match(value, /busy === grant\.id \? "Revoking\.\.\." : "Revoke"/);
  assert.match(value, /setFeedback\(\{\s*state: "pending",\s*message: "Revoking download access\.\.\.",?\s*\}\)/s);
  assert.match(value, /setFeedback\(\{\s*state: "success",\s*message: "Download access revoked\.",?\s*\}\)/s);
  assert.match(value, /state: "error"/);
  assert.match(value, /<AdminActionStatus[\s\S]*feedback=\{feedback\}/);

  assert.match(
    value,
    /fetch\(`\/api\/admin\/downloads\/\$\{id\}\/revoke`, \{\s*method: "POST",?\s*\}\)/s,
  );
});

test("standalone revoke preserves PS1-03 feedback while PS1-04 uses the shared confirmation dialog", () => {
  const source = readFileSync(
    "src/features/admin/downloads/revoke-grant-button.tsx",
    "utf8",
  );

  assert.match(source, /type="button"/);
  assert.match(source, /disabled=\{busy\}/);
  assert.match(source, /aria-busy=\{busy\}/);
  assert.match(source, /if \(busy\) return;/);
  assert.match(source, /<AdminActionStatus feedback=\{feedback\} \/>/);

  assert.match(
    source,
    /import \{ ConfirmActionDialog \} from "@\/features\/admin\/shared\/confirm-action-dialog";/,
  );
  assert.match(
    source,
    /const \[confirmOpen, setConfirmOpen\] = useState\(false\);/,
  );
  assert.match(
    source,
    /onClick=\{\(\) => setConfirmOpen\(true\)\}/,
  );
  assert.match(source, /open=\{confirmOpen\}/);
  assert.match(source, /confirmLabel="Revoke access"/);
  assert.match(source, /await revoke\(\)/);

  assert.doesNotMatch(source, /\bconfirm\(/);
  assert.doesNotMatch(source, /\bwindow\.confirm\(/);
  assert.doesNotMatch(source, /\balert\(/);
});
test("refund Sync is buttonized and both Sync and initiation prevent duplicate submission with visible feedback", () => {
  const value = source(REFUNDS);

  assert.match(value, /const \[syncingId, setSyncingId\] = useState<string \| null>\(null\)/);
  assert.match(value, /const \[submitting, setSubmitting\] = useState\(false\)/);
  assert.match(value, /disabled=\{syncingId !== null\}/);
  assert.match(value, /aria-busy=\{syncingId === refund\.id\}/);
  assert.match(value, /syncingId === refund\.id \? "Syncing\.\.\." : "Sync"/);
  assert.match(value, /disabled=\{submitting\}/);
  assert.match(value, /aria-busy=\{submitting\}/);
  assert.match(value, /submitting \? "Submitting\.\.\." : "Initiate provider refund"/);
  assert.match(value, /<AdminActionStatus feedback=\{feedback\}/);

  assert.match(
    value,
    /fetch\(`\/api\/admin\/refunds\/\$\{id\}\/refresh`, \{\s*method: "POST",?\s*\}\)/s,
  );
  assert.match(value, /fetch\("\/api\/admin\/refunds", \{/);
  assert.match(value, /orderId: form\.get\("orderId"\)/);
  assert.match(value, /amountMinor: Math\.round\(amountMajor \* 100\)/);
  assert.match(value, /reason: form\.get\("reason"\)/);

  assert.doesNotMatch(value, /confirm\(/);
});
