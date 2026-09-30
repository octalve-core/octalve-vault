# Octalve Vault — Batch E Admin Action Notifications & Instant Freshness Design

**Status:** Implemented
**Date:** 2026-09-30
**Baseline:** `f4253c78c4b4f448dd04944fcbdfc1785c1e2d7e`
**Scope:** Admin mutation feedback, authoritative state refresh, and final Phase 1 closure

## 1. Intent

Batch E closes Phase 1, but only after Octalve Vault Admin receives a consistent, prominent in-app action-notification system and the known stale-after-save behavior is removed.

The design must satisfy two goals:

1. Every meaningful Admin mutation visibly acknowledges pending, success, and failure states.
2. After authoritative server success, the visible Admin state updates automatically without requiring a manual browser refresh.

Notifications are presentation only. They never become financial, lifecycle, entitlement, RBAC, or payment authority.

## 2. Evidence-based current-state findings

The existing repository already has useful building blocks:

- `AdminActionStatus` already models accessible `idle | pending | success | error` feedback.
- Download revocation and refund actions already use richer inline feedback and call `router.refresh()` after successful server mutations.
- Product basics/lifecycle changes already refresh the current route after success.
- Product asset upload verification and publication already refresh after success.
- Marketing coupon/affiliate create/status actions already call `router.refresh()`.
- Team creation/update flows already call `router.refresh()` in the main Team manager.
- Standalone Product translation and price forms show success text but do not refresh the current route.
- Store settings show success text but do not refresh the current route.
- Several mutation surfaces still use small inline messages that are easy to miss.
- At least one legacy Team table path uses browser `alert()` on failure and should not remain as a competing feedback pattern.

This means the stale-state problem is not one universal cache defect. Some mutation surfaces already refresh correctly; some do not.

## 3. Options considered

### Option A — Inline feedback only

Extend `AdminActionStatus` everywhere but keep messages local to each form.

**Pros**
- Minimal architectural change.
- Existing component can be reused.

**Cons**
- Important success/failure messages remain easy to miss.
- Feedback position changes by page.
- Does not meet the requested PalmPay-style prominent notification experience.

**Decision:** Reject as the sole solution.

### Option B — Hybrid shared notification layer + contextual inline feedback

Add a global Admin notification provider/viewport mounted once in the protected Admin layout. Keep inline status where it adds local context, but emit the important pending/success/error state globally as well.

**Pros**
- Strong visibility.
- Consistent across Products, Refunds, Downloads, Marketing, Team, and Settings.
- Reuses existing concepts rather than replacing them.
- No third-party dependency.
- Stable notification IDs can transform one pending notification into success/error.
- Accessibility can be centrally enforced.

**Cons**
- Requires a small shared client-side subsystem.
- Existing mutation components must be migrated carefully.

**Decision:** Recommended.

### Option C — Add a third-party toast package

Use a toast library and retrofit mutations.

**Pros**
- Fast to style.
- Queueing/dismissal often included.

**Cons**
- Adds runtime/package surface for behavior simple enough to implement with existing React/Tailwind primitives.
- May compete with `AdminActionStatus`.
- Introduces another dependency immediately before Phase 1 closure.

**Decision:** Reject unless implementation research proves a missing capability. Current evidence does not justify it.

## 4. Recommended architecture

### 4.1 Shared notification model

Create a shared typed notification model:

```ts
type AdminNoticeState =
  | "pending"
  | "success"
  | "warning"
  | "error";

type AdminNotice = {
  id: string;
  state: AdminNoticeState;
  title: string;
  message?: string;
  dismissible?: boolean;
  createdAt: number;
};
```

Expose an Admin notification API conceptually equivalent to:

```ts
const notices = useAdminNotifications();

const id = notices.pending({
  title: "Activating product",
  message: "Validating readiness and saving the new lifecycle state…",
});

notices.success(id, {
  title: "Product activated",
  message: "The latest confirmed server state is now displayed.",
});

notices.error(id, {
  title: "Activation failed",
  message: safeErrorMessage,
});
```

A stable ID updates the same notification in place instead of generating a pending toast, then a second success toast.

### 4.2 Placement

Mount the provider/viewport once inside the protected Admin shell/layout.

Recommended presentation:

- Desktop: fixed top-right, below the Admin header.
- Mobile/tablet: top-center with safe horizontal margins.
- Stack newest-first with a small bounded queue.
- Notifications must never cover destructive confirmation dialogs.
- Use `pointer-events-none` on the viewport and restore pointer events on interactive notification cards.

### 4.3 Visual language

Use existing Octalve Admin visual language:

- white surface
- slate border
- rounded 20–24px card
- soft shadow
- small icon tile
- medium typography
- no heavy `font-black`/`font-extrabold`
- pending: spinner/progress icon
- success: check icon with subtle emerald treatment
- warning: amber
- error: red
- close button on dismissible completed states

No attempt should be made to imitate PalmPay branding. Only the prominent heads-up interaction pattern is borrowed.

## 5. Accessibility contract

- A live region exists from initial Admin render.
- Pending/success/informational notices use `role="status"`, `aria-live="polite"`, and `aria-atomic="true"`.
- Error notices use `role="alert"` only for genuine errors requiring immediate attention.
- Notifications do not steal focus.
- Manual close controls are keyboard focusable with accessible labels.
- Motion respects `prefers-reduced-motion`.
- Auto-dismiss must not make important error text disappear too quickly.
- Pending notices never auto-dismiss while the mutation is in flight.

## 6. Freshness contract

### 6.1 Client refresh rule

For client components that mutate through existing Route Handlers:

1. start pending notice;
2. disable duplicate submission;
3. execute mutation;
4. parse safe response;
5. if server rejects: update notice to error; do not refresh;
6. if server confirms mutation: update notice to the correct success semantics;
7. call `router.refresh()` for server-rendered state that depends on the mutation;
8. preserve current URL/search/filter state.

`router.refresh()` is appropriate for current-route Server Component freshness because it requests a new Server Component payload while preserving unaffected browser/client state.

### 6.2 Server cache rule

`router.refresh()` does not invalidate server-side caches by itself. Therefore Batch E must inspect any mutation whose effects are consumed by cached paths.

Where a Route Handler updates data used by cached routes, use targeted `revalidatePath()`/tag invalidation only where current repository caching actually requires it. Do not add blanket global revalidation.

### 6.3 No arbitrary delays

No `setTimeout()` is permitted as a state-consistency mechanism.

Timers may only control visual dismissal after a completed notification.

## 7. Mutation inventory and required behavior

| Mutation | Current evidence | Batch E behavior |
|---|---|---|
| Product creation | busy state; dedicated create route | pending “Creating product…” → success before navigation/editor load; preserve safe POST mapping |
| Product basics/status/featured | success text + `router.refresh()` | global pending/success/error; retain refresh |
| Product price | success text; no refresh | global feedback + `router.refresh()` after success |
| Product translation | success text; no refresh | global feedback + `router.refresh()` after success |
| Asset upload authorize → R2 PUT → verify | inline busy/message + refresh after verify | one stable progress notification across authorize/upload/verify; final state “Upload verified” |
| Asset publish | inline message + refresh | “Publishing…” → “Asset published”; refresh product readiness/status |
| Refund initiation | inline feedback + refresh | “Initiating refund…” → **“Refund initiated”**, never “Refund completed” unless provider-confirmed state proves that |
| Refund synchronization | inline feedback + refresh | “Checking refund status…” → state-aware result; refresh |
| Download revoke | inline feedback + refresh | confirmation preserved; “Revoking access…” → “Download access revoked”; refresh |
| Coupon creation | inline message + refresh | global feedback + refresh |
| Affiliate creation | inline message + refresh | global feedback + refresh |
| Coupon/Affiliate active state | refresh but weak/no success feedback | global pending/success/error + refresh |
| Team creation | message + refresh | global feedback + refresh |
| Team role/status update | refresh; limited success feedback | global feedback + duplicate lock + refresh |
| Store settings | success text; no refresh | global feedback + `router.refresh()` after success |
| Login/logout | navigation-specific | keep separate from normal mutation toasts unless a failure requires accessible feedback |

## 8. Financial and asynchronous semantics

### Immediate final success allowed

These can normally say “successful” after a successful authoritative server response:

- Product basics/lifecycle save
- Product price save
- Translation save
- Asset verification complete
- Asset publication
- Download grant revocation
- Coupon/Affiliate creation and status change
- Team creation/update
- Store settings save

### Initiated/processing semantics required

Refunds must not collapse provider lifecycle into a false final success:

- POST accepted/provider initiation succeeded → **Refund initiated**
- provider still processing → **Refund processing**
- refresh/provider result confirms success → **Refund confirmed**
- provider confirms failure/cancellation → corresponding final state

The browser must never infer a provider-completed refund from HTTP 2xx alone unless the returned authoritative refund status is final.

## 9. Shared component strategy

Keep `AdminActionStatus` for contextual inline status where useful.

Add shared components/hooks conceptually:

- `src/features/admin/shared/admin-notification-provider.tsx`
- `src/features/admin/shared/admin-notification-viewport.tsx`
- `src/features/admin/shared/use-admin-notifications.ts` or provider-exported hook
- optional `admin-mutation-feedback.ts` utility for common safe mutation lifecycle behavior

Do not add a new npm dependency unless implementation proves necessary.

Mount the provider in the protected Admin layout/shell so every protected Admin mutation can use it.

## 10. Likely migration targets

Primary mutation surfaces:

- `src/features/admin/products/product-editor.tsx`
- `src/features/admin/products/product-basics-form.tsx`
- `src/features/admin/products/product-prices-form.tsx`
- `src/features/admin/products/product-translation-form.tsx`
- `src/features/admin/products/product-assets-panel.tsx`
- product creation form currently used by `/admin/products/new`
- `src/features/admin/refunds/refund-panel.tsx`
- `src/features/admin/downloads/downloads-table.tsx`
- `src/features/admin/downloads/revoke-grant-button.tsx`
- `src/features/admin/marketing/marketing-manager.tsx`
- `src/features/admin/team/team-manager.tsx`
- `src/features/admin/team/team-create-form.tsx` / legacy table only if still reachable
- `src/features/admin/settings/settings-form.tsx`
- protected Admin layout/shell for provider mounting

Exact reachability and duplicate/legacy components must be rechecked from baseline before modification. Unused components should not be migrated blindly.

## 11. RED → GREEN test plan

### Shared notification RED

Add tests that fail until the provider exists and verifies:

- pending/success/warning/error states
- stable ID update-in-place contract
- polite status vs assertive error semantics
- close control
- no focus theft
- reduced-motion class/behavior
- bounded stack/queue

### Product freshness RED

Verify:

- Product lifecycle save emits pending then success/error
- successful lifecycle mutation calls `router.refresh()`
- Product price save calls `router.refresh()`
- Product translation save calls `router.refresh()`
- asset verify/publish retain refresh
- product readiness is refreshed after asset publication

### Operational action RED

Verify:

- refund initiation says “Refund initiated,” not “Refund completed”
- refund sync uses state-aware wording
- download revoke keeps confirmation + duplicate lock + refresh
- Marketing create/status emits global feedback + refresh
- Team create/update emits global feedback + refresh
- Settings save refreshes after success
- browser `alert()`/`confirm()` are not reintroduced in migrated surfaces

### Full regression

Run all existing tests plus new Batch E tests, TypeScript, ESLint, source verification, Prisma generation, and production build.

Tests must enforce behavior/architecture, not whitespace formatting.

## 12. Protected authority boundaries

Batch E must not modify financial or commercial authority unless a narrowly required cache invalidation hook is proven necessary.

Protected by hash unless explicitly justified:

- payment checkout pricing authority
- webhook settlement
- refund service/provider result semantics
- download ticket/settlement service
- Worker private delivery logic
- Prisma schema
- pnpm lockfile

No Prisma migration is planned.

## 13. Internal Batch E execution sequence

### E1 — Baseline and mutation inventory lock

- require baseline `f4253c78c4b4f448dd04944fcbdfc1785c1e2d7e`
- clean tree
- fresh origin check
- run complete existing suite before mutation
- audit actual current reachable mutation surfaces

### E2 — Shared notification system

RED:
- provider/viewport/accessibility/update-in-place tests

GREEN:
- shared notification provider/viewport
- mount once in protected Admin shell/layout
- preserve existing `AdminActionStatus`

### E3 — Product mutations and freshness

Migrate only current reachable Product mutation components.

Special focus:
- lifecycle
- price
- translation
- upload/verify
- publish
- product creation

### E4 — Operational mutations and freshness

Migrate:
- refunds
- downloads
- Marketing
- Team
- settings

Preserve confirmations, RBAC, environment checks, audit writes, and duplicate-submission locks.

### E5 — Phase 1 closure verification

- targeted Batch E tests
- complete regression suite
- TypeScript
- ESLint
- source verification
- Prisma generate
- Next production build
- protected hashes
- pnpm store status
- exact mutation boundary
- clean tree
- one controlled push
- no manual Vercel CLI deployment
- production Ready verification
- update Phase 1 documentation to mark closure

## 14. Failure/rollback policy

Each internal stage is fail-closed.

- No remote push before every Batch E gate passes.
- If a stage fails before commit, restore only that stage’s allowlisted files.
- If a stage has already been committed locally, preserve the checkpoint and resume from it.
- Do not use broad reset/revert operations that could destroy unrelated work.
- Final push requires a fresh remote check showing `origin/main` still equals the Batch E starting baseline.
- No manual Vercel deployment.

## 15. Implementation status

Batch E implementation is recorded as complete only after the repository RED→GREEN stages and complete Phase 1 release gate pass locally. The final remote push remains the single GitHub publication step for this batch.

## 16. Research conclusion

The recommended solution is **Option B: hybrid global Admin notifications plus contextual inline feedback**, implemented with existing React/Tailwind primitives and no new dependency.

The stale-data issue is partly real and partly perception:

- several important flows already call `router.refresh()` but their completion feedback is easy to miss;
- Product price, Product translation, and Store settings are confirmed examples where the UI lacks a post-success route refresh;
- every mutation must be individually audited rather than applying blanket cache invalidation.

This design keeps the server/database authoritative, makes actions visibly trustworthy, removes manual-refresh dependence from current mutation flows, and closes Phase 1 without introducing new financial authority.
