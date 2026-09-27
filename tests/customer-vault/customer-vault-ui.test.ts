import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

function read(path: string) {
  const url = new URL(path, import.meta.url);
  assert.ok(existsSync(fileURLToPath(url)), `${path} must exist`);
  return readFileSync(url, "utf8");
}

test("Customer Vault keeps generic access, Turnstile, OTP and grant authorization endpoints", () => {
  const vault = read("../../src/features/customer-vault/customer-vault.tsx");
  const access = read("../../src/features/customer-vault/sections/access-panel.tsx");
  assert.match(vault, /\/api\/vault\/session/);
  assert.match(vault, /\/api\/vault\/grants\?locale=/);
  assert.match(vault, /\/api\/vault\/access\/request/);
  assert.match(vault, /messages\["vault\.genericMessage"\]/);
  assert.match(vault, /\/api\/vault\/access\/verify/);
  assert.match(vault, /\/api\/vault\/downloads\/authorize/);
  assert.match(vault, /\/api\/vault\/logout/);
  assert.match(access, /TurnstileWidget/);
  assert.match(access, /action="vault_access"/);
});

test("Customer Vault panels use Octalve medium-weight public presentation", () => {
  const files = [
    "../../src/features/customer-vault/sections/access-panel.tsx",
    "../../src/features/customer-vault/sections/otp-panel.tsx",
    "../../src/features/customer-vault/sections/downloads-panel.tsx",
  ];
  for (const path of files) {
    const source = read(path);
    assert.match(source, /font-medium/);
    assert.doesNotMatch(source, /font-black/);
    assert.doesNotMatch(source, /font-bold/);
  }
  const access = read(files[0]);
  assert.match(access, /#0064E0|#0A84FF/);
  assert.match(access, /rounded-\[28px\]|rounded-\[32px\]/);
});

test("payment result keeps verification state machine while adopting Octalve typography", () => {
  const result = read("../../src/features/store/payment-result/payment-result-client.tsx");
  assert.match(result, /nextPaymentResultState/);
  assert.match(result, /\/api\/payments\/verify\?provider=/);
  assert.match(result, /clearCart\(\)/);
  assert.match(result, /MAX_ATTEMPTS/);
  assert.match(result, /RETRY_MS/);
  assert.match(result, /font-medium/);
  assert.doesNotMatch(result, /font-black/);
  assert.doesNotMatch(result, /font-bold/);
});
