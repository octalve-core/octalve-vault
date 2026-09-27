import test from "node:test";
import assert from "node:assert/strict";
import { nextPaymentResultState, type PaymentResultState } from "../../src/features/store/payment-result/state.ts";

const verifying: PaymentResultState = { kind: "verifying", attempt: 1 };

test("verified API result transitions to success", () => {
  assert.deepEqual(nextPaymentResultState(verifying, { verified: true, status: "successful", reference: "OV-1" }), {
    kind: "success",
    reference: "OV-1",
  });
});

test("processing results retry until the configured cap", () => {
  assert.deepEqual(nextPaymentResultState({ kind: "verifying", attempt: 2 }, { verified: false, status: "processing", reference: "OV-1" }, 5), {
    kind: "pending",
    attempt: 3,
    reference: "OV-1",
  });
  assert.deepEqual(nextPaymentResultState({ kind: "verifying", attempt: 5 }, { verified: false, status: "processing", reference: "OV-1" }, 5), {
    kind: "pending-final",
    reference: "OV-1",
  });
});

test("failed and malformed verification responses fail closed", () => {
  assert.deepEqual(nextPaymentResultState(verifying, { verified: false, status: "failed", reference: "OV-1" }), {
    kind: "failed",
    reference: "OV-1",
  });
  assert.deepEqual(nextPaymentResultState(verifying, { error: "bad request" }), {
    kind: "failed",
    reference: null,
  });
});
