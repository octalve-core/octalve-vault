import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const specPath = "docs/superpowers/specs/2026-09-30-batch-e-admin-notification-freshness-design.md";
const planPath = "docs/superpowers/plans/2026-09-30-batch-e-phase1-closure.md";

test("Batch E design and execution record close Phase 1 only after implementation", () => {
  assert.equal(existsSync(specPath), true, "Batch E design record must exist");
  assert.equal(existsSync(planPath), true, "Batch E execution plan must exist");
  const spec = readFileSync(specPath, "utf8");
  const plan = readFileSync(planPath, "utf8");
  assert.match(spec, /Status:\*\* Implemented/);
  assert.match(plan, /Status:\*\* Implemented/);
  assert.match(spec, /Phase 1/);
  assert.match(plan, /Phase 1/);
  assert.match(spec, /Refund initiated/);
  assert.match(plan, /one remote push/i);
});
