# Octalve Vault — Batch E Phase 1 Closure Implementation Plan

**Status:** Implemented
**Date:** 2026-09-30
**Required baseline:** `f4253c78c4b4f448dd04944fcbdfc1785c1e2d7e`

## Goal

Close Phase 1 only after the Admin has:
1. a prominent shared notification system for pending/success/warning/error mutation feedback;
2. automatic server-state freshness after successful mutations on all currently reachable mutation surfaces in scope;
3. preserved commercial/payment/refund/download/RBAC authority;
4. a complete regression/typecheck/lint/source/build release gate;
5. one remote push only after all gates pass.

## Exact execution stages

### E1 — Preflight / authority lock

Require:
- repository `C:\Users\Bi Creativity\octalve-vault-new`
- branch `main`
- clean worktree
- `HEAD == origin/main == f4253c78c4b4f448dd04944fcbdfc1785c1e2d7e`
- fresh remote fetch (with bounded retry)
- known-good pnpm store healthy
- current protected Admin routes render the expected live components
- protected commercial authority hashes captured
- baseline tests/typecheck/lint/source verification pass before mutation

No source mutation occurs before this gate passes.

### E2 — Shared Admin notifications

RED:
- add `tests/admin/admin-notification-system.test.ts`
- prove the shared provider/mount contract does not yet exist

GREEN:
- add `src/features/admin/shared/admin-notification-provider.tsx`
- mount it once in `src/features/admin/layout/admin-shell.tsx`
- support `pending | success | warning | error`
- stable IDs update the same notification in place
- bounded stack
- polite status / assertive error semantics
- no focus theft
- manual dismiss
- reduced-motion support
- completed success/warning auto-dismiss; pending/error remain until transition/manual dismiss

Checkpoint:
- focused test
- TypeScript
- ESLint
- source verification
- protected hashes
- store status
- local commit only; no push

### E3 — Active Product mutations + freshness

RED:
- add `tests/admin/admin-product-mutation-feedback.test.ts`
- target the active `ProductEditor` and dedicated `/admin/products/new` form

GREEN:
- enhance `src/features/admin/products/product-editor.tsx`
  - core/lifecycle: Saving/Activating → Product saved/activated
  - translation: Saving translation → Translation saved
  - price: Saving price → Price saved
  - upload chain: Authorizing → Uploading → Verifying → Upload verified
  - publication: Publishing asset → Asset published
  - all server-confirmed mutations retain/use `router.refresh()`
- enhance `src/features/admin/products/product-create-page-form.tsx`
  - Creating product → Product created
  - preserve dedicated route, slug/category logic, and safe server error mapping

Do not mutate obsolete standalone Product form duplicates merely because they remain in the repository.

Checkpoint as E2; local commit only.

### E4 — Operational mutations + freshness

RED:
- add `tests/admin/admin-operational-mutation-feedback.test.ts`

GREEN:
- Refunds:
  - preserve shared destructive confirmation
  - preserve duplicate locks
  - “Initiating refund…” → **“Refund initiated”**
  - never claim completion from initiation
  - sync uses “Checking refund status…” → refreshed status
- Downloads:
  - preserve confirmation + locks + inline status
  - add prominent pending/success/error notification
  - refresh after confirmed revoke
- Marketing:
  - coupon create, affiliate create, active-state changes gain prominent feedback
  - preserve `router.refresh()`
- Team:
  - create/update gain prominent feedback
  - preserve RBAC and refresh
- Settings:
  - prominent feedback
  - add missing `router.refresh()` after successful PUT

No server authority rewrite.

Checkpoint as E2; local commit only.

### E5 — Phase 1 closure

RED:
- add `tests/admin/admin-phase1-closure.test.ts`
- it must fail until Batch E design/plan are recorded as Implemented

GREEN:
- write approved Batch E design and implementation plan under `docs/superpowers`
- mark them Implemented
- verify exact Batch E mutation boundary

Full release gate:
- full `pnpm test`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm verify:source`
- `pnpm build`
- `git diff --check`
- protected authority hashes unchanged
- Prisma schema unchanged
- pnpm lockfile unchanged
- package.json unchanged
- known-good pnpm store untouched
- working tree clean
- fresh `origin/main` still equals starting baseline before push
- one `git push origin main`
- post-push `HEAD == origin/main`
- no manual Vercel CLI

Production commit-specific Ready status is not claimed by the local runner unless separately observed after Vercel finishes its GitHub-triggered deployment.
