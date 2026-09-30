# Admin Operations D3 — Customers & Downloads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-09-30-admin-operations-discovery-design.md`

**Goal:** Replace unbounded customer aggregation and fixed-size Download listings with server-backed grouped/paginated discovery plus LIVE-safe summary cards.

**Architecture:** Customer rows are grouped from qualifying LIVE paid Orders in the database; only the current page of customer emails is expanded into per-currency totals. Download environment is derived from related Order PaymentAttempts. Existing revoke mutation/RBAC stays in the current client table.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma/PostgreSQL, Tailwind, Node test runner.

## Global Constraints

- Prerequisite: D2 pushed clean; D3 executor pins exact D2 SHA.
- Customer commercial qualification is Order status `PAID|FULFILLED|PARTIALLY_FULFILLED` + LIVE `SUCCEEDED` payment.
- Customer monetary totals remain keyed by currency; never merge currencies.
- Download LIVE backing is derived through DownloadGrant → OrderItem → Order → PaymentAttempt.
- Existing download revoke endpoint/component behavior remains unchanged.
- No Prisma schema migration.
- GET Apply/Clear discovery; no client-side full-data filter.

## Review Focus

1. Two orders in different currencies for one email must remain separate totals.
2. Repeat/single customer segment filtering must be based on qualifying order count only.
3. Customer page ordering by last order must be deterministic for equal timestamps.
4. Expired Download grant must not count active even when not revoked.
5. Download environment filter must use related payment attempts, not whichever payment happens to display first.

---

## File map

**Create**
- `src/server/admin/customers-index.ts`
- `src/server/admin/customers-service.ts`
- `src/server/admin/downloads-index.ts`
- `src/server/admin/downloads-service.ts`
- `src/features/admin/customers/customer-index-controls.tsx`
- `src/features/admin/downloads/download-index-controls.tsx`
- `tests/admin/customers-index.test.ts`
- `tests/admin/downloads-index.test.ts`
- `tests/admin/customers-downloads-ui.test.ts`

**Modify**
- `src/server/admin/operations-service.ts`
- `src/app/admin/(protected)/customers/page.tsx`
- `src/app/admin/(protected)/downloads/page.tsx`
- `src/features/admin/customers/customers-table.tsx`
- `src/features/admin/downloads/downloads-table.tsx`

### Task 1: Customer grouped index contract

**Interfaces:**
- `CustomerSegment = "repeat" | "single"`.
- `CUSTOMER_INDEX_SORTS = ["recent","oldest-last-order","most-orders","email"]`.
- `CustomerIndexInput` with `segment?`, `currency?`, `lastOrder` date range.
- `qualifyingCustomerOrderWhere(input)` plus parse/window/active-filter functions.

- [ ] RED parser/qualification/segment/date tests.
- [ ] Implement qualifying LIVE order predicate once and reuse it.
- [ ] GREEN.
- [ ] Commit `feat: add admin customer index contract`.

### Task 2: Database-backed Customer page and summary

**Interfaces:**
- `AdminCustomerRow = { email; orders; lastOrderAt; totals: Record<string, number> }`
- `AdminCustomerSummary = { liveCustomers; repeatBuyers; singleOrderBuyers; paidLiveOrders }`
- `listAdminCustomers(input): Promise<ResourceIndexResult<AdminCustomerRow>>`
- `getAdminCustomerSummary(): Promise<AdminCustomerSummary>`

- [ ] RED: no unbounded qualifying Order `findMany`; grouping happens with Prisma `groupBy`.
- [ ] Page customer groups use `skip/take`; use a second grouped query for per-currency totals only for emails on the page.
- [ ] Total grouped-customer count may be derived from database `groupBy` email keys, never from full Order rows.
- [ ] Summary: distinct LIVE customers, repeat, single, qualifying order count.
- [ ] Remove old application-Map `listAdminCustomers()` from `operations-service.ts`.
- [ ] GREEN + type/lint.
- [ ] Commit `feat: add query-backed admin customers`.

### Task 3: Customer UI

- [ ] RED: summary cards, search Email, Segment, Currency, Last-order date range, Sort, Page size, shared results.
- [ ] Cards: LIVE customers / Repeat buyers / Single-order buyers / Paid LIVE orders.
- [ ] Preserve per-currency amount pills in CustomersTable.
- [ ] GREEN and commit `feat: add customer operations discovery`.

### Task 4: Download typed index contract

**Interfaces:**
- `DownloadGrantState = "active" | "used" | "unused" | "revoked" | "expired"`.
- `DOWNLOAD_INDEX_SORTS = ["newest","oldest","most-downloaded","expiry-soonest","email"]`.
- `DownloadIndexInput` with `state?`, `environment?`, `product?`, `created`, `expiry`.
- parse/where/order/window/active-filters.

- [ ] RED: state predicates, derived TEST/LIVE environment relation, search email/order/product/asset filename.
- [ ] Expiry uses current `now` injected into `buildDownloadWhere(input, now)` for deterministic tests.
- [ ] Implement and GREEN.
- [ ] Commit `feat: add admin download index contract`.

### Task 5: Download summary and paginated read service

**Interfaces:**
- `AdminDownloadSummary = { activeLive; used; unused; revokedExpired }`
- `listAdminDownloads(input, now = new Date())`
- `getAdminDownloadSummary(now = new Date())`

- [ ] RED: database paging, related payment environment selection, correct active/expired split.
- [ ] Implement include needed by current DownloadsTable without N+1.
- [ ] Remove old `take: 200` `listAdminDownloads()` from `operations-service.ts`.
- [ ] Keep revoke route/service byte-stable.
- [ ] GREEN + revoke regressions.
- [ ] Commit `feat: add query-backed admin downloads`.

### Task 6: Downloads UI

- [ ] RED summary/controls/pagination.
- [ ] Controls: Search, State, Environment, Product, Created range, Expiry range, Sort, Page size.
- [ ] Cards: Active LIVE grants / Used / Unused / Revoked or expired.
- [ ] DownloadsTable keeps revoke dialog/action/status and displays derived environment explicitly.
- [ ] GREEN + type/lint.
- [ ] Commit `feat: add download operations discovery`.

### Task 7: D3 verification

- [ ] Customer/Download/Admin/revoke tests.
- [ ] typecheck/lint/source/build.
- [ ] protected hashes.
- [ ] one push; record D3 SHA for D4.
