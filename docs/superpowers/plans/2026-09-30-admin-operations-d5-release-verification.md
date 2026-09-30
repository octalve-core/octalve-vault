# Admin Operations D5 — Admin-wide Release Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-09-30-admin-operations-discovery-design.md`

**Goal:** Prove the complete Admin Operations & Discovery rollout is coherent, server-backed, LIVE/TEST-safe, regression-free, and production-buildable before Phase 2 begins.

**Architecture:** D5 adds one cross-page static/contract regression suite and performs no business-feature redesign. It verifies the D1–D4 interfaces together, protects commercial authority, and runs the complete project release gate from a clean D4 baseline.

**Tech Stack:** Node test runner, TypeScript, ESLint, Next.js production build, Git verification.

## Global Constraints

- Prerequisite: D4 pushed clean; D5 pins exact D4 SHA.
- No new feature scope.
- No schema migration.
- No payment/refund/download authority modification.
- All eight resource pages must now use summary + server-backed discovery.
- Business cards exclude TEST unless explicitly defined otherwise.
- No fake cross-currency KPI.
- D5 may only change verification tests/docs needed to lock the delivered architecture.

## Review Focus

1. Every Admin page must remain composition-focused rather than containing Prisma or page-local filtering logic.
2. No replaced resource route may still depend on fixed `take: 200/300` as its user-facing navigation ceiling.
3. TEST environment must remain visible in operational history and excluded from LIVE business cards.
4. Products existing mature filter contract must remain unchanged after shared-primitives refactor.
5. Mutation/RBAC surfaces for Refunds, Downloads, Marketing, Team and audit-writing must remain present and protected.

---

## File map

**Create**
- `tests/admin/admin-operations-discovery-release.test.ts`

**Potential documentation-only modify after all checks**
- `docs/superpowers/specs/2026-09-30-admin-operations-discovery-design.md` — change status to Implemented only after the full release gate passes.

### Task 1: Cross-page release contract test

- [ ] **Step 1: Write RED/contract test**
  Assert all eight pages:
  - render or consume `AdminSummaryGrid`,
  - parse URL-backed index params,
  - call database-backed paginated services,
  - use `AdminIndexResults`,
  - do not import Prisma directly in route pages,
  - do not perform page-local `.filter()` over full resource datasets.

- [ ] Assert Orders/Payments/Downloads operational history exposes environment filtering.
- [ ] Assert Customer/Marketing summary service source contains explicit LIVE payment qualification.
- [ ] Assert Product controls still contain every pre-D1 filter name.
- [ ] Assert RefundPanel, revoke endpoint calls, Marketing mutation endpoints, Team mutation endpoints, and audit writer remain present.
- [ ] Run test; if any assertion fails, fix the owning D1–D4 batch implementation rather than weakening the D5 test.
- [ ] Commit only once contract is GREEN: `test: lock admin operations discovery rollout`.

### Task 2: Focused security/authority verification

- [ ] Hash/compare protected files against D4 baseline:
  - checkout pricing and payment initialization/verification,
  - webhook/settlement,
  - refunds,
  - Customer Vault authorization,
  - download tickets and Worker,
  - Prisma schema,
  - pnpm lockfile.
- [ ] Run existing payment environment, refund, lifecycle, download authorization, RBAC and promotion-authority tests.
- [ ] Expected: all PASS; no protected drift.

### Task 3: Full release-quality gate

- [ ] `pnpm test`
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm verify:source`
- [ ] `pnpm build`
- [ ] `git diff --check`
- [ ] `pnpm store status`
- [ ] Confirm expected changed-file boundary only.
- [ ] Confirm working tree clean after D5 commit.

### Task 4: Mark spec implemented

- [ ] Only after Tasks 1–3 pass, change the design spec Status line from approved/pending implementation to `Implemented — D1–D5 verified`.
- [ ] Add final D1–D5 commit SHAs to a short implementation record section.
- [ ] `git diff --check`.
- [ ] Commit `docs: record admin discovery rollout`.

### Task 5: Push and production handoff

- [ ] Fetch `origin/main`; require it still equals the exact D4/D5 expected parent.
- [ ] Push once.
- [ ] Fetch again and prove `HEAD == origin/main`.
- [ ] Prove clean worktree.
- [ ] No manual `vercel deploy --prod`.
- [ ] User confirms Vercel Production `Ready` for the D5 final SHA.
- [ ] Visually inspect at minimum Products, Orders, Payments, Customers, Downloads, Marketing, Team, Audit Logs on production.
- [ ] Only then begin Phase 2 ProductMedia.
