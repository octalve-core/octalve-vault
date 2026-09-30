# Admin Operations D4 — Marketing, Team & Audit Logs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-09-30-admin-operations-discovery-design.md`

**Goal:** Complete Admin-wide resource discovery by adding LIVE-safe Marketing summaries, Team discovery, and paginated Audit Logs while preserving all mutation and RBAC behavior.

**Architecture:** Marketing keeps Coupon and Affiliate views separate under one URL-backed page and leaves promotion mutations in `promotions-service.ts`. New read/query services own discovery. Team moves direct Prisma reads out of the route. Audit read logic moves out of the page while immutable audit writes remain untouched.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma/PostgreSQL, Tailwind, Node test runner.

## Global Constraints

- Prerequisite: D3 pushed clean; D4 pins exact D3 SHA.
- Marketing business KPIs traverse qualifying LIVE payment evidence; raw `_count.orders` is not a LIVE KPI.
- Promotion create/activate APIs and audit writes remain authoritative and unchanged.
- Team mutation API/permissions remain unchanged.
- Audit records remain immutable; no mutation UI.
- No arbitrary JSON metadata full-text search.
- No schema migration.
- All three resources use GET Apply/Clear + server pagination.

## Review Focus

1. Expired/not-yet-started active Coupon must not count as `Active coupons`.
2. Coupon redemption and affiliate attribution cards must exclude TEST-only Orders.
3. Marketing view switch must preserve relevant validated query state without mixing coupon-only/affiliate-only filters.
4. Team `Never signed in` means `lastLoginAt IS NULL` regardless of active state.
5. Audit human/system origin is determined solely by `actorAdminId` nullability; actor search must not search metadata JSON.

---

## File map

**Create**
- `src/server/admin/marketing-index.ts`
- `src/server/admin/marketing-service.ts`
- `src/server/admin/team-index.ts`
- `src/server/admin/team-service.ts`
- `src/server/admin/audit-index.ts`
- `src/server/admin/audit-query-service.ts`
- `src/features/admin/marketing/marketing-index-controls.tsx`
- `src/features/admin/team/team-index-controls.tsx`
- `src/features/admin/audit/audit-index-controls.tsx`
- `tests/admin/marketing-index.test.ts`
- `tests/admin/team-index.test.ts`
- `tests/admin/audit-index.test.ts`
- `tests/admin/marketing-team-audit-ui.test.ts`

**Modify**
- `src/server/admin/promotions-service.ts`
- `src/app/admin/(protected)/marketing/page.tsx`
- `src/app/admin/(protected)/team/page.tsx`
- `src/app/admin/(protected)/audit/page.tsx`
- `src/features/admin/marketing/marketing-manager.tsx`
- `src/features/admin/team/team-manager.tsx`
- `src/features/admin/audit/audit-list.tsx`

### Task 1: Marketing index contract

**Interfaces:**
- `MarketingView = "coupons" | "affiliates"`.
- Coupon sorts: newest/oldest/code/status.
- Affiliate sorts: newest/oldest/name/status.
- One parsed Marketing input containing `view`, common query/page/pageSize, and validated view-specific filters.

- [ ] RED parser/view/filter/sort tests.
- [ ] Invalid view/filter combinations fail closed or normalize to the active view.
- [ ] Implement and GREEN.
- [ ] Commit `feat: add admin marketing index contract`.

### Task 2: LIVE-safe Marketing summary and paginated reads

**Interfaces:**
- `AdminMarketingSummary = { activeCoupons; liveCouponRedemptions; activeAffiliates; liveAttributedOrders }`
- `listAdminMarketing(input)`
- `getAdminMarketingSummary(now = new Date())`

- [ ] RED LIVE-payment qualification tests/source assertions.
- [ ] Active coupons honor `active`, optional startsAt and endsAt.
- [ ] Redemption count requires REDEEMED + linked qualifying LIVE order.
- [ ] Attributed orders require affiliateId + qualifying LIVE payment.
- [ ] Paginate only current view; include fields current MarketingManager needs.
- [ ] Remove read-only `listMarketingPromotions()` fixed `take: 300` from `promotions-service.ts`; keep all mutation exports unchanged.
- [ ] GREEN + promotion mutation regressions.
- [ ] Commit `feat: add query-backed admin marketing`.

### Task 3: Marketing page/UI

- [ ] RED: summary + URL-backed Coupons/Affiliates view + GET controls + shared results.
- [ ] Render cards: Active coupons / LIVE coupon redemptions / Active affiliates / LIVE attributed orders.
- [ ] Controls for current view only.
- [ ] Refactor MarketingManager to render creation forms plus only the current paginated resource rows; preserve create/toggle fetch behavior.
- [ ] GREEN + type/lint.
- [ ] Commit `feat: add marketing operations discovery`.

### Task 4: Team index/service

**Interfaces:**
- `TEAM_INDEX_SORTS = ["name","newest","oldest","recent-login","role"]`.
- Team filters: role, active, login state.
- `AdminTeamSummary = { members; active; disabled; neverSignedIn }`
- `listAdminTeam(input)`, `getAdminTeamSummary()`.

- [ ] RED parse/where/order/window tests.
- [ ] Search displayName/email case-insensitive.
- [ ] Move direct Prisma read out of Team page into service.
- [ ] Summary count tests.
- [ ] GREEN.
- [ ] Commit `feat: add query-backed admin team`.

### Task 5: Team UI

- [ ] RED: cards, controls, shared results.
- [ ] Cards: Team members / Active / Disabled / Never signed in.
- [ ] Controls: Search, Role, Status, Login state, Sort, Page size.
- [ ] Preserve TeamManager create/role/status mutations and `canWrite`.
- [ ] GREEN + RBAC tests.
- [ ] Commit `feat: add team operations discovery`.

### Task 6: Audit index/query service

**Interfaces:**
- `AuditOrigin = "human" | "system"`.
- `AUDIT_INDEX_SORTS = ["newest","oldest","action","entity"]`.
- Filters: entityType, actorAdminId, origin, created range.
- `AdminAuditSummary = { events; humanActions; systemActions; activeActors }`
- `listAdminAuditLogs(input)`, `getAdminAuditSummary()`, `listAdminAuditActors()`.

- [ ] RED parser/where/order/window/search tests.
- [ ] Search action/entityType/entityId and actor displayName/email only.
- [ ] Summary human/system/active distinct actors.
- [ ] Replace page-level direct `findMany(...take:300)` with service pagination.
- [ ] Keep `src/server/admin/audit.ts` write behavior untouched.
- [ ] GREEN.
- [ ] Commit `feat: add query-backed admin audit logs`.

### Task 7: Audit UI

- [ ] RED: summary, controls, actor filter, shared results, no metadata JSON search.
- [ ] Cards: Events / Human actions / System actions / Active actors.
- [ ] Controls: Search, Entity type, Actor, Origin, Created range, Sort, Page size.
- [ ] Preserve immutable AuditList display semantics.
- [ ] GREEN + type/lint.
- [ ] Commit `feat: add audit operations discovery`.

### Task 8: D4 verification

- [ ] Marketing/Team/Audit + mutation/RBAC/audit-write tests.
- [ ] typecheck/lint/source/build.
- [ ] protected hashes.
- [ ] one push; record exact D4 SHA for D5.
