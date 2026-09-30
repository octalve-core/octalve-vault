# Octalve Vault Admin Operations & Discovery — Design

**Status:** Implemented — D1–D5 verified
**Date:** 2026-09-30
**Baseline:** `1d0da7653ca70e5e8905a541efd1554aed09df7c`
**Scope:** Admin Products, Orders, Payments, Customers, Downloads, Marketing, Team, Audit Logs
**Execution batches:** D1–D5

## 1. Context

Octalve Vault now has a strong Admin Overview with clear operational cards and explicit LIVE business context, while most resource-specific Admin pages still present tables or management forms without the same one-page operational summary, server-backed discovery, or consistent pagination.

Products is the current reference implementation for Admin discovery. It already uses typed URL parsing, normalized search, validated filters, date ranges, deterministic sorting, pagination, active-filter descriptors, and database-backed filtering through `src/server/admin/products-index.ts` and `src/server/admin/resource-index.ts`.

Orders, Payments, Customers, Downloads, Marketing, Team, and Audit Logs are currently less mature. Several still use fixed `take: 200` / `take: 300` queries or aggregate in application memory. This design brings those pages to one coherent Admin operations standard without changing checkout, payment settlement, refund, delivery, RBAC, or database schema authority.

## 2. Goals

1. Give every major Admin resource page a concise, useful summary of current operational state.
2. Reuse the visual language approved on the Admin Overview:
   - four-card desktop grid where appropriate,
   - soft color-coded Lucide icon tiles,
   - clear numeric hierarchy,
   - short supporting descriptions,
   - restrained bottom accent,
   - explicit environment context where relevant.
3. Add deliberate server-backed search, filters, sorting, and pagination to all eight resource areas.
4. Keep URL state reload-safe and shareable.
5. Preserve LIVE/TEST separation:
   - business KPIs are LIVE-backed,
   - operational history may expose TEST and LIVE explicitly.
6. Preserve existing RBAC and mutation workflows.
7. Keep Admin `page.tsx` files composition-focused.
8. Avoid fake cross-currency totals and avoid browser-side full-dataset filtering.

## 3. Non-goals

This work does **not**:

- add ProductMedia,
- add sale pricing,
- change checkout pricing authority,
- change payment provider behavior,
- change refund rules,
- change download authorization,
- add a generic metadata-driven CRUD framework,
- introduce live-on-every-keystroke Admin search,
- combine NGN/USD or other currencies into one monetary KPI,
- change Prisma schema unless a separately reviewed performance requirement later proves it necessary.

No schema migration is planned for D1–D5.

## 4. Architecture choice

Use a shared Admin discovery foundation with resource-specific query contracts.

Do **not** create eight unrelated implementations, and do **not** build a fully generic metadata-driven Admin framework.

### 4.1 Shared server foundation

Keep and extend:

- `src/server/admin/resource-index.ts`

Each resource receives a pure typed index module following the Products pattern:

- `orders-index.ts`
- `payments-index.ts`
- `customers-index.ts`
- `downloads-index.ts`
- `marketing-index.ts`
- `team-index.ts`
- `audit-index.ts`

Each index module owns, as applicable:

- supported sort constants,
- typed parsed input,
- query normalization,
- enum validation,
- date range parsing,
- Prisma `where` construction,
- deterministic `orderBy`,
- `skip` / `take`,
- active-filter descriptors.

Resource-specific database reads stay with the existing service ownership where possible. D1–D5 must not refactor unrelated service boundaries merely for aesthetics.

### 4.2 Shared UI foundation

Add reusable presentation primitives such as:

- `AdminSummaryGrid`
- `AdminSummaryCard`
- `AdminIndexPanel`
- `AdminActiveFilters`
- `AdminPagination`

The exact filenames may vary during implementation if existing shared Admin components make a smaller extension safer, but behavior and boundaries in this spec must remain unchanged.

Page-specific filter controls remain explicit. Orders should not inherit Product-only filters, and Audit Logs should not inherit Payment filters.

## 5. Interaction model

Admin discovery remains deliberate:

- GET forms,
- `Apply filters`,
- `Clear`,
- URL-backed query state,
- server/database-backed result sets,
- no page-local `.filter()` over a preloaded full resource collection.

This intentionally differs from the public Shop's debounced instant search. Admin screens frequently combine status, environment, provider, date, and sort constraints, so deliberate submission is clearer and reduces unnecessary database traffic.

Changing sort, filters, search, or page size resets the logical result set to page 1. Pagination preserves all validated current query parameters.

Invalid query values fail closed to the resource parser contract rather than being passed unchecked to Prisma.

## 6. Environment policy

### 6.1 Business summary cards

Commerce/business cards are LIVE-backed unless the card is explicitly non-commerce inventory data.

Examples:

- Product inventory counts are environment-neutral.
- Paid order KPIs require qualifying LIVE payment evidence.
- Customer KPIs require qualifying LIVE paid orders.
- Download business KPIs require grants backed by qualifying LIVE payments.
- Marketing redemption/attribution KPIs require qualifying LIVE payment evidence.

### 6.2 Detailed operational history

Orders, Payments, Downloads, and other diagnostic tables may include TEST and LIVE records when useful, but the environment must be explicit and filterable.

A TEST record must never silently inflate a card labeled as a business KPI.

### 6.3 Qualifying LIVE payment evidence

Unless a resource requires a narrower rule, qualifying LIVE commercial evidence means a related `PaymentAttempt` where:

- `environment = LIVE`, and
- status is one of:
  - `SUCCEEDED`
  - `PARTIALLY_REFUNDED`
  - `REFUNDED`

Where the business meaning requires currently active paid access, use the narrower set:

- `SUCCEEDED`
- `PARTIALLY_REFUNDED`

Existing checkout/settlement rules remain authoritative.

## 7. Shared summary-card behavior

Summary cards are operational context, not filter-result totals.

By default, resource filters affect the detailed result set only. Summary cards remain stable for the resource's defined business scope so administrators always have a consistent one-page overview.

Cards must:

- use real database-backed counts,
- define their environment scope,
- never aggregate monetary values across currencies,
- use concise supporting descriptions,
- avoid heavy `font-black` / `font-extrabold` typography,
- remain responsive and keyboard/reader neutral.

If a later requirement asks for filter-sensitive cards, that is a separate design decision.

## 8. Products

### 8.1 Existing discovery

Keep the current Product query architecture and controls.

### 8.2 Summary cards

1. **Total products**
   - all `Product` rows,
   - all lifecycle states.

2. **Ready to sell**
   - `status = ACTIVE`,
   - at least one `ProductAsset.status = PUBLISHED`,
   - at least one active `ProductPrice`,
   - currency-neutral summary card.

3. **Coming Soon**
   - `status = COMING_SOON`.

4. **Needs attention**
   - `status = DRAFT`, or
   - `status = ACTIVE` but fails the readiness rule above.
   - `ARCHIVED` is excluded because archival can be intentional.

### 8.3 Detailed filters

Preserve current search, status, category, featured, readiness, asset, active currency, created range, updated range, sort, page size, pagination.

## 9. Orders

### 9.1 Summary cards

1. **LIVE orders**
   - orders with at least one related LIVE payment attempt.

2. **Paid / fulfilled**
   - order status in `PAID`, `FULFILLED`, `PARTIALLY_FULFILLED`,
   - related LIVE `SUCCEEDED` payment.

3. **Pending / in progress**
   - order status in `PENDING`, `INITIALIZED`,
   - at least one LIVE payment attempt.

4. **Refunded**
   - order status in `PARTIALLY_REFUNDED`, `REFUNDED`,
   - qualifying LIVE refunded/partially-refunded payment evidence.

### 9.2 Search

Case-insensitive search across:

- order reference,
- customer email,
- `OrderItem.productTitle`,
- `OrderItem.productSlug`.

### 9.3 Filters

- order status,
- payment environment through related attempts,
- provider,
- currency,
- created-from / created-to,
- paid-from / paid-to where useful.

### 9.4 Sorts

At minimum:

- newest,
- oldest,
- recently updated,
- status,
- email/reference deterministic tie-break.

### 9.5 Pagination

Database-backed, deterministic, no fixed `take: 200` ceiling as the user-facing navigation model.

## 10. Payments

### 10.1 Summary cards

1. **LIVE attempts**
   - `PaymentAttempt.environment = LIVE`.

2. **Successful**
   - LIVE `SUCCEEDED`.

3. **Pending / processing**
   - LIVE status in `PENDING`, `INITIALIZED`, `PROCESSING`.

4. **Refunded**
   - LIVE status in `PARTIALLY_REFUNDED`, `REFUNDED`.

### 10.2 Search

Case-insensitive search across:

- provider reference,
- provider transaction ID when present,
- order reference,
- order customer email.

### 10.3 Filters

- payment status,
- environment,
- provider,
- currency,
- created date range,
- updated date range.

### 10.4 Sorts

- newest,
- oldest,
- recently updated,
- status,
- provider.

Detailed Payment history may show both TEST and LIVE, always labeled explicitly.

## 11. Customers

A customer is derived from qualifying LIVE commercial orders; there is no separate Customer model.

### 11.1 Qualifying customer order

An order counts toward customer metrics when:

- order status is one of `PAID`, `FULFILLED`, `PARTIALLY_FULFILLED`, and
- it has a LIVE `SUCCEEDED` payment.

### 11.2 Summary cards

1. **LIVE customers**
   - distinct normalized qualifying order email values.

2. **Repeat buyers**
   - distinct emails with at least two qualifying orders.

3. **Single-order buyers**
   - distinct emails with exactly one qualifying order.

4. **Paid LIVE orders**
   - total qualifying orders.

### 11.3 Discovery

Use database grouping/aggregation, not full unbounded order loading followed by application-only filtering.

Search:

- customer email.

Filters:

- buyer segment: repeat / single-order,
- order currency,
- last-order date range.

Sorts:

- most recent order,
- oldest last order,
- most orders,
- email A–Z.

Pagination applies to grouped customer rows.

Per-customer monetary totals remain currency-keyed records; never merge currencies into one amount.

## 12. Downloads

DownloadGrant has no direct environment field, so environment is derived through:

`DownloadGrant -> OrderItem -> Order -> PaymentAttempt`.

### 12.1 LIVE-backed grant

A grant is LIVE-backed when its order has qualifying LIVE commercial payment evidence.

### 12.2 Summary cards

1. **Active LIVE grants**
   - LIVE-backed,
   - `revokedAt IS NULL`,
   - `expiresAt IS NULL OR expiresAt > now`.

2. **Used**
   - active LIVE grant,
   - `downloadCount > 0`.

3. **Unused**
   - active LIVE grant,
   - `downloadCount = 0`.

4. **Revoked / expired**
   - LIVE-backed,
   - `revokedAt IS NOT NULL` or expired.

### 12.3 Search

Case-insensitive search across:

- grant email,
- order reference,
- product slug/title,
- asset download filename where appropriate.

### 12.4 Filters

- grant state: active / used / unused / revoked / expired,
- derived environment: TEST / LIVE,
- product,
- created date range,
- expiry date range.

### 12.5 Sorts

- newest,
- oldest,
- most downloaded,
- expiry soonest,
- email.

Existing revoke actions and permission checks remain unchanged.

## 13. Marketing

Marketing keeps Coupons and Affiliates conceptually separate while sharing one page-level summary.

### 13.1 Page structure

Use a URL-backed view:

- `view=coupons`
- `view=affiliates`

Default view: `coupons`.

The summary cards remain visible in either view.

### 13.2 Summary cards

1. **Active coupons**
   - `active = true`,
   - and current time is inside optional start/end window.

2. **LIVE coupon redemptions**
   - `CouponRedemption.status = REDEEMED`,
   - linked order has qualifying LIVE commercial payment evidence.

3. **Active affiliates**
   - `Affiliate.active = true`.

4. **LIVE attributed orders**
   - `Order.affiliateId IS NOT NULL`,
   - linked order has qualifying LIVE commercial payment evidence.

Raw `_count.orders` must not be used as a LIVE business KPI because it is environment-agnostic.

### 13.3 Coupon discovery

Search:

- coupon code,
- coupon name.

Filters:

- active/currently usable state,
- discount type,
- currency,
- date window where useful.

Sort:

- newest,
- oldest,
- code/name,
- active state.

### 13.4 Affiliate discovery

Search:

- affiliate code,
- display name,
- email.

Filters:

- active state,
- has commission / no commission if useful.

Sort:

- newest,
- oldest,
- display name/code,
- active state.

Creation, activation/deactivation, auditing, and RBAC remain unchanged.

## 14. Team

### 14.1 Summary cards

1. **Team members**
   - all `AdminUser` rows.

2. **Active**
   - `active = true`.

3. **Disabled**
   - `active = false`.

4. **Never signed in**
   - `lastLoginAt IS NULL`.

### 14.2 Search

Case-insensitive:

- display name,
- email.

### 14.3 Filters

- role,
- active state,
- login state: never signed in / has signed in.

### 14.4 Sorts

- name A–Z,
- newest,
- oldest,
- most recent login,
- role.

Pagination is database-backed.

Existing permission checks for team mutations remain unchanged.

## 15. Audit Logs

### 15.1 Summary cards

1. **Events**
   - total audit events.

2. **Human actions**
   - `actorAdminId IS NOT NULL`.

3. **System actions**
   - `actorAdminId IS NULL`.

4. **Active actors**
   - distinct non-null `actorAdminId` values represented in the audit log.

These are audit-log metrics, not security-severity metrics.

### 15.2 Search

Case-insensitive where structurally possible across:

- action,
- entity type,
- entity ID,
- actor display name/email through relation.

Do not full-text search arbitrary JSON metadata in D4.

### 15.3 Filters

- entity type,
- actor,
- human/system origin,
- created-from / created-to.

### 15.4 Sorts

- newest,
- oldest,
- action,
- entity type.

### 15.5 Pagination

Replace the fixed latest-300 navigation model with deterministic database pagination.

Audit records remain immutable.

## 16. Page composition

Each resource page should compose, in order:

1. `AdminPageHeader`
2. summary grid
3. discovery controls
4. active-filter context where useful
5. result count / pagination context
6. existing table/list/manager/action surface
7. pagination

Protected Admin `page.tsx` files remain composition-focused and do not become client-state managers.

## 17. RBAC and action safety

This work changes discovery and presentation, not authorization.

Existing permission boundaries remain authoritative, including:

- product write,
- refund actions,
- download revoke,
- marketing mutation,
- team mutation,
- audit read.

Search/filter query parameters never grant additional access.

No resource index query may return fields that the current page/permission boundary is not already authorized to expose.

## 18. Data and performance rules

1. Use Prisma filtering before pagination.
2. Use deterministic secondary ordering (`id` or another stable key) where necessary.
3. Avoid unbounded `findMany()` followed by browser or application filtering.
4. Customer grouping must be database-backed.
5. Marketing LIVE KPIs must traverse qualifying LIVE payment evidence.
6. Derived Download environment must come from related PaymentAttempt records.
7. Do not add indexes or schema migrations inside D1–D5 unless measured query behavior proves a need and a separate schema design is approved.
8. No N+1 query loops for table rows.

## 19. Error handling

Query parsers must:

- normalize search text,
- reject invalid enum/sort/page values consistently,
- parse strict UTC date-only ranges using shared helpers,
- use bounded page sizes,
- fail closed before issuing unsafe Prisma queries.

UI should show a stable empty state when a valid filter returns no rows.

## 20. Testing strategy

Every batch follows strict RED → GREEN.

### Pure index tests

For each resource:

- supported parameter parsing,
- invalid parameter rejection,
- Prisma `where` construction,
- deterministic sort,
- page window,
- active-filter descriptors.

### Service/query tests

Verify:

- database filtering occurs before pagination,
- environment rules are preserved,
- summary metrics use correct LIVE scope,
- fixed `take: 200/300` list ceilings are removed from user-facing pagination flows where replaced,
- no currency aggregation across currencies.

### UI regression tests

Verify:

- summary cards use the approved medium-weight aesthetic,
- controls are present and URL-backed,
- page files remain composition-focused,
- existing mutation controls remain present and permission-gated,
- environment is labeled where operational history mixes TEST/LIVE.

### Release gate

Each implementation batch runs:

- focused RED / GREEN tests,
- relevant existing regression tests,
- `pnpm typecheck`,
- `pnpm lint`,
- protected authority checks,
- exact changed-file boundary.

D5 runs:

- full `pnpm test`,
- `pnpm typecheck`,
- `pnpm lint`,
- `pnpm verify:source`,
- `pnpm build`,
- `git diff --check`,
- protected authority verification,
- known-good pnpm store check,
- clean `HEAD == origin/main` proof after push.

## 21. Protected authority

At minimum, D1–D5 must protect unless explicitly required by an approved subtask:

- checkout pricing authority,
- payment initialization/verification/settlement,
- provider environment enforcement,
- webhook handling,
- refunds,
- Customer Vault authorization,
- download tickets/Worker delivery,
- Prisma schema,
- pnpm lockfile.

Changing Admin read queries must not alter customer-facing commercial authority.

## 22. Implementation batches

### D1 — Shared Admin primitives + Products summary

- shared summary card/grid primitives,
- shared discovery/pagination presentation where reuse is clear,
- Products summary service/query,
- integrate summary above existing Product discovery,
- preserve current Products filters unchanged.

### D2 — Orders + Payments

- typed order index,
- typed payment index,
- summary metrics,
- query-backed search/filter/sort/pagination,
- preserve refund/payment environment actions and labels.

### D3 — Customers + Downloads

- grouped customer index,
- customer summary metrics,
- download index with derived environment,
- summary metrics,
- preserve grant revoke behavior.

### D4 — Marketing + Team + Audit Logs

- Marketing coupon/affiliate tabbed discovery,
- LIVE-safe marketing metrics,
- Team summary/discovery,
- Audit summary/discovery,
- preserve all mutation/RBAC/audit behaviors.

### D5 — Admin-wide release verification

- cross-page consistency regression,
- page composition checks,
- LIVE/TEST KPI isolation checks,
- pagination/query-backed discovery checks,
- full release-quality verification.

## 23. Rollback strategy

Each D batch is independently revertible.

A batch executor must:

- require the exact expected baseline commit,
- require clean working tree,
- verify expected source shapes before mutation,
- constrain dirty files to the batch allow-list,
- roll back uncommitted batch changes on failure,
- never reset unrelated user work,
- commit only after focused and batch verification,
- push once only after all gates pass.

No manual Vercel CLI production deployment is part of these batches; GitHub-connected Vercel deployment remains the production path.

## 24. Acceptance criteria

The Admin-wide upgrade is complete when:

1. Products, Orders, Payments, Customers, Downloads, Marketing, Team, and Audit Logs each present useful summary context.
2. Every detailed resource list is server/query-backed for search/filter/sort/pagination.
3. Products retains its current mature discovery behavior.
4. Business KPIs exclude TEST activity unless explicitly labeled otherwise.
5. Detailed operational history labels TEST/LIVE where both may appear.
6. No combined cross-currency monetary KPI is introduced.
7. Existing mutations and RBAC remain unchanged.
8. No customer-facing payment/refund/download authority is weakened.
9. All Admin pages use a coherent visual and interaction system.
10. D5 full release verification passes from a clean repository.

## 25. Implementation record

- D1 shared foundation and Product operations summary: `c19bdedfd7ecd285752b3e0b2ee39079690a2d89`
- D2–D4 Admin-wide operations discovery batch: `759e69b79ea61efc1d94b2202b5e96a02467167b`
- Full-regression compatibility repair: `df9045795abfe77e9960a64e47f1e3d7b95db2aa`
- D5 cross-page release contract: `31bc6bbd1137d38a998a9b2844d02203f36ab25f`
- Full release gate: tests, typecheck, lint, source verification, production build, protected-authority hashes, pnpm store and clean-worktree checks passed before this record was committed.
- Deployment path: GitHub-connected Vercel only; no manual production CLI deployment.
