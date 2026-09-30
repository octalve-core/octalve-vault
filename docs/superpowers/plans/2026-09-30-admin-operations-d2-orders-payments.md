# Admin Operations D2 — Orders & Payments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-09-30-admin-operations-discovery-design.md`

**Goal:** Give Orders and Payments their own LIVE-aware summary cards plus server-backed search, filters, sorting, and pagination while leaving refund/payment authority unchanged.

**Architecture:** Add pure Orders/Payments index modules and dedicated read services. Remove the old fixed-size Orders/Payments list functions from `operations-service.ts`, but preserve `getDashboardData()` and `listAdminRefundableOrders()` exactly in authority and behavior. UI uses D1 shared summary/result primitives.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma/PostgreSQL, Tailwind, Node test runner.

## Global Constraints

- Prerequisite: D1 is pushed and clean; the D2 executor pins the exact D1 SHA before mutation.
- No Prisma schema migration.
- Business summary cards are LIVE-backed.
- Detailed Orders/Payments history may show TEST and LIVE but environment must be explicit/filterable.
- No cross-currency monetary KPI.
- Refund panel, refund service, provider registry, checkout, webhook and settlement files remain protected.
- Admin search/filter interaction is deliberate GET + Apply/Clear.
- Every task follows RED → GREEN with an independently reviewable commit.

## Review Focus

1. Order environment filter must use related PaymentAttempt environment, not infer from Order status.
2. Order search for product title/slug must traverse OrderItem and still paginate at Order level.
3. Payment search must include provider reference and order reference/email without exposing secrets.
4. TEST attempts must appear only when selected/allowed in detail and must never inflate LIVE cards.
5. Refundable-order flow must remain independent of the new Payments list pagination.

---

## File map

**Create**
- `src/server/admin/orders-index.ts`
- `src/server/admin/orders-service.ts`
- `src/server/admin/payments-index.ts`
- `src/server/admin/payments-service.ts`
- `src/features/admin/orders/order-index-controls.tsx`
- `src/features/admin/payments/payment-index-controls.tsx`
- `tests/admin/orders-index.test.ts`
- `tests/admin/payments-index.test.ts`
- `tests/admin/orders-payments-ui.test.ts`

**Modify**
- `src/server/admin/operations-service.ts`
- `src/app/admin/(protected)/orders/page.tsx`
- `src/app/admin/(protected)/payments/page.tsx`
- `src/features/admin/orders/orders-table.tsx`
- `src/features/admin/payments/payments-table.tsx`

### Task 1: Orders typed index contract

**Interfaces:**
- `ORDER_INDEX_SORTS = ["newest","oldest","recently-updated","status","email"]`.
- `OrderIndexInput extends ResourceIndexBase<OrderIndexSort>` with `status?`, `environment?`, `provider?`, `currency?`, `created`, `paid`.
- `parseOrderIndexParams`, `buildOrderWhere`, `buildOrderOrderBy`, `orderIndexWindow`, `orderIndexActiveFilters`.

- [ ] Write failing parser/where/order/window/filter tests.
- [ ] Assert invalid status/environment/provider/currency/date inputs fail closed.
- [ ] Assert query searches reference, email, item productTitle and productSlug.
- [ ] Run RED.
- [ ] Implement minimal index module using D1 shared resource helpers.
- [ ] Run GREEN.
- [ ] Commit `feat: add admin order index contract`.

### Task 2: Orders summary and paginated database service

**Interfaces:**
- `AdminOrderSummary = { liveOrders; paidFulfilled; pendingInProgress; refunded }`
- `listAdminOrders(input: OrderIndexInput): Promise<ResourceIndexResult<AdminOrderListItem>>`
- `getAdminOrderSummary(): Promise<AdminOrderSummary>`

- [ ] Write RED tests/source assertions for `count({where})`, `skip/take`, exact LIVE summary predicates.
- [ ] Implement list with include of items and payments ordered newest first.
- [ ] Implement summary counts from spec.
- [ ] Remove old `listAdminOrders()` fixed `take: 200` function from `operations-service.ts`.
- [ ] Run focused Orders regressions + type/lint.
- [ ] Commit `feat: add query-backed admin orders`.

### Task 3: Orders page discovery and summary UI

**Files:** Orders page, controls, table, UI test.

- [ ] RED: route consumes `searchParams`, parser, summary/list in parallel, summary grid, GET controls, `AdminIndexResults`.
- [ ] Implement Search, Status, Environment, Provider, Currency, Created from/to, Paid from/to, Sort, Page size.
- [ ] Render cards: LIVE orders / Paid & fulfilled / Pending & in progress / Refunded.
- [ ] Keep existing immutable snapshot/payment-environment details in OrdersTable.
- [ ] Run GREEN + page composition check.
- [ ] Commit `feat: add order operations discovery`.

### Task 4: Payments typed index contract

**Interfaces:**
- `PAYMENT_INDEX_SORTS = ["newest","oldest","recently-updated","status","provider"]`.
- `PaymentIndexInput` with `status?`, `environment?`, `provider?`, `currency?`, `created`, `updated`.
- `parsePaymentIndexParams`, `buildPaymentWhere`, `buildPaymentOrderBy`, `paymentIndexWindow`, `paymentIndexActiveFilters`.

- [ ] RED parser/where/order/pagination tests.
- [ ] Search providerReference, providerTransactionId, order.reference, order.email.
- [ ] Invalid enum/date tests.
- [ ] Implement and GREEN.
- [ ] Commit `feat: add admin payment index contract`.

### Task 5: Payments summary and paginated service

**Interfaces:**
- `AdminPaymentSummary = { liveAttempts; successful; pendingProcessing; refunded }`
- `listAdminPayments(input)`
- `getAdminPaymentSummary()`

- [ ] RED: list uses database filter + pagination; cards explicitly LIVE.
- [ ] Implement list include order reference/email.
- [ ] Implement summary counts.
- [ ] Remove old fixed `listAdminPayments()` `take: 300` from `operations-service.ts`.
- [ ] Prove `listAdminRefundableOrders()` source and behavior unchanged.
- [ ] Run GREEN + refund regressions.
- [ ] Commit `feat: add query-backed admin payments`.

### Task 6: Payments page discovery and summary UI

- [ ] RED page/controls assertions.
- [ ] Integrate summary + controls + shared index results above PaymentsTable.
- [ ] Controls: search, Status, Environment, Provider, Currency, Created range, Updated range, Sort, Page size.
- [ ] Render LIVE Attempts / Successful / Pending & processing / Refunded cards.
- [ ] Keep `RefundPanel` outside paginated Payments result and feed it from unchanged refundable-order/refund queries.
- [ ] Explicitly display TEST/LIVE in table.
- [ ] Run GREEN + refund/security tests + type/lint.
- [ ] Commit `feat: add payment operations discovery`.

### Task 7: D2 verification

- [ ] Run Orders/Payments/Admin/refund/payment-environment tests.
- [ ] `pnpm typecheck`
- [ ] `pnpm lint`
- [ ] `pnpm verify:source`
- [ ] `pnpm build`
- [ ] protected authority hashes
- [ ] clean tree, one push, record exact D2 SHA for D3.
