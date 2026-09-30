# Admin Operations D1 — Shared Foundation & Products Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Spec:** `docs/superpowers/specs/2026-09-30-admin-operations-discovery-design.md`

**Goal:** Establish the reusable Admin summary/discovery presentation contract and add database-backed Product summary cards without changing the mature Product discovery behavior.

**Architecture:** Extend the existing `resource-index.ts`/Products pattern rather than replacing it. Add server-rendered shared summary/result primitives, make active-filter and pagination metadata reusable, and add a Product summary query that reuses the exact ACTIVE + published asset + active price readiness rule.

**Tech Stack:** Next.js 16.3.6 App Router, React 19.2.3, TypeScript 5.9.3, Prisma 6.19.3, PostgreSQL, Tailwind CSS 4.3.3, Lucide, Node test runner.

## Global Constraints

- Initial baseline must be exactly `b02c487b92e4f6b595782f11ad688b4c4b161b3e` on local `HEAD` and `origin/main`.
- No Prisma schema migration.
- No checkout, payment, refund, Customer Vault, download-ticket, Worker, or lockfile change.
- Products retain their current search/status/category/featured/readiness/asset/currency/date/sort/page-size behavior.
- Product summary cards are inventory context and do not change with the current Product filters.
- `Ready to sell` means `ACTIVE` + at least one `PUBLISHED` ProductAsset + at least one active ProductPrice.
- `Needs attention` means `DRAFT` OR `ACTIVE` failing the readiness rule; `ARCHIVED` is excluded.
- Admin discovery remains GET-form + Apply/Clear, not live-on-keystroke.
- Use medium-weight typography; no `font-black` or `font-extrabold`.
- Every task follows RED → GREEN and ends with a verified commit.

## Review Focus

1. ACTIVE Product with published asset but no active price must count as `Needs attention`, not `Ready to sell`; pin in Task 3 tests.
2. ARCHIVED Product must not count as `Needs attention`; pin in Task 3 tests.
3. Removing one active-filter chip must preserve unrelated filters and reset `page`; pin in Task 1 tests.
4. Pagination links must preserve validated query parameters and omit `page=1`; pin in Task 1 tests.
5. Product list must remain database-query-backed and must not reintroduce page-local Product filtering; pin in Task 4 tests.

---

## File map

**Create**
- `src/features/admin/shared/admin-summary-grid.tsx` — reusable aesthetic summary cards.
- `src/features/admin/shared/admin-index-results.tsx` — reusable result range, active-filter chips, and Previous/Next pagination.
- `src/features/admin/shared/admin-search-params.ts` — converts App Router `searchParams` records to `URLSearchParams`.
- `tests/admin/admin-shared-index-ui.test.ts` — shared Admin UI/query-link regression.
- `tests/admin/product-summary.test.ts` — Product summary semantics.

**Modify**
- `src/server/admin/resource-index.ts` — shared result/filter types only.
- `src/server/admin/products-index.ts` — exported readiness predicate and shared filter/result types.
- `src/server/admin/products-service.ts` — Product summary query.
- `src/features/admin/products/product-list.tsx` — delegate result metadata/pagination to shared primitive.
- `src/app/admin/(protected)/products/page.tsx` — fetch/render Product summary above existing controls.
- `tests/admin/products-index.test.ts` — readiness and shared-contract regression.

### Task 1: Shared resource-index result and URL presentation contract

**Files:**
- Modify: `src/server/admin/resource-index.ts`
- Create: `src/features/admin/shared/admin-search-params.ts`
- Create: `src/features/admin/shared/admin-index-results.tsx`
- Create: `tests/admin/admin-shared-index-ui.test.ts`

**Interfaces:**
- Produces `ResourceIndexActiveFilter = { key: string; label: string; value: string; params: string[] }`.
- Produces `ResourceIndexResult<T> = { items: T[]; meta: ResourceIndexMeta; activeFilters: ResourceIndexActiveFilter[] }`.
- Produces `toAdminUrlSearchParams(values: Record<string, string | string[] | undefined>): URLSearchParams`.
- Produces `<AdminIndexResults basePath queryString meta activeFilters noun children />`.

- [ ] **Step 1: Write failing shared-contract tests**
  Assert filter-chip URLs delete every `filter.params` entry, delete `page`, preserve unrelated parameters, and pagination preserves the query while omitting page 1.

- [ ] **Step 2: Run RED**
  Run: `node --experimental-strip-types --test tests/admin/admin-shared-index-ui.test.ts`
  Expected: FAIL because the shared modules/types do not yet exist.

- [ ] **Step 3: Implement the shared types and `toAdminUrlSearchParams`**
  Keep normalization/date/page parsing behavior in `resource-index.ts` unchanged.

- [ ] **Step 4: Implement `AdminIndexResults`**
  It must render `Showing X-Y of N <noun>`, active-filter chips, and deterministic Previous/Next links using `ResourceIndexMeta`.

- [ ] **Step 5: Run GREEN + type/lint**
  Run:
  - `node --experimental-strip-types --test tests/admin/admin-shared-index-ui.test.ts`
  - `pnpm typecheck`
  - `pnpm lint`
  Expected: PASS.

- [ ] **Step 6: Commit**
  `git commit -m "feat: add shared admin index presentation"`

### Task 2: Shared Admin summary-card primitive

**Files:**
- Create: `src/features/admin/shared/admin-summary-grid.tsx`
- Extend test: `tests/admin/admin-shared-index-ui.test.ts`

**Interfaces:**
- Produces `AdminSummaryTone = "blue" | "violet" | "amber" | "emerald" | "rose" | "slate"`.
- Produces `AdminSummaryItem = { label: string; value: number; helper: string; context?: string; tone: AdminSummaryTone; icon: LucideIcon }`.
- Produces `<AdminSummaryGrid items: AdminSummaryItem[] />`.

- [ ] **Step 1: Add failing visual-contract assertions**
  Require rounded 28px cards, soft icon tile, medium typography, bottom accent, optional context pill, responsive 2/4-column grid, and no heavy font weights.

- [ ] **Step 2: Run RED**
  Expected: missing summary module.

- [ ] **Step 3: Implement `AdminSummaryGrid`**
  Use explicit tone-to-class mapping so Tailwind sees complete class names; do not dynamically construct color utility names.

- [ ] **Step 4: Run GREEN + type/lint**
  Expected: PASS.

- [ ] **Step 5: Commit**
  `git commit -m "feat: add admin summary card system"`

### Task 3: Product readiness predicate and stable summary query

**Files:**
- Modify: `src/server/admin/products-index.ts`
- Modify: `src/server/admin/products-service.ts`
- Modify: `tests/admin/products-index.test.ts`
- Create: `tests/admin/product-summary.test.ts`

**Interfaces:**
- Produces `buildProductReadyWhere(currency?: CurrencyCode): Prisma.ProductWhereInput`.
- Produces `AdminProductSummary = { total: number; ready: number; comingSoon: number; needsAttention: number }`.
- Produces `getAdminProductSummary(): Promise<AdminProductSummary>`.

- [ ] **Step 1: Write failing readiness tests**
  Assert readiness is ACTIVE + PUBLISHED asset + active price; currency argument scopes the price when supplied.

- [ ] **Step 2: Write failing Product-summary source/semantic test**
  Assert four counts are database counts; `needsAttention` includes DRAFT and ACTIVE-not-ready, excludes ARCHIVED.

- [ ] **Step 3: Run RED**
  Run both Product test files; expected missing exports/query.

- [ ] **Step 4: Extract `buildProductReadyWhere` and reuse it inside `buildProductWhere`**
  Do not alter current Product filter semantics.

- [ ] **Step 5: Implement `getAdminProductSummary` with `Promise.all` Prisma counts**
  No currency monetary totals.

- [ ] **Step 6: Run GREEN + existing Product suite**
  Run:
  - `node --experimental-strip-types --test tests/admin/products-index.test.ts`
  - `node --experimental-strip-types --test tests/admin/product-summary.test.ts`
  - existing Product/Admin regression tests
  - `pnpm typecheck`
  - `pnpm lint`
  Expected: PASS.

- [ ] **Step 7: Commit**
  `git commit -m "feat: add admin product summary metrics"`

### Task 4: Integrate Product summary and shared result presentation

**Files:**
- Modify: `src/app/admin/(protected)/products/page.tsx`
- Modify: `src/features/admin/products/product-list.tsx`
- Modify: `src/server/admin/products-index.ts`
- Modify: `tests/admin/products-index.test.ts`
- Extend: `tests/admin/product-summary.test.ts`

**Interfaces:**
- Consumes `getAdminProductSummary`, `AdminSummaryGrid`, `AdminIndexResults`, `toAdminUrlSearchParams`.
- Product active filters now implement `ResourceIndexActiveFilter` and each descriptor provides exact query `params`.

- [ ] **Step 1: Add RED assertions**
  Page must fetch summary in parallel with products/categories; four approved Product cards render above unchanged `ProductIndexControls`; ProductList delegates meta/filter/pagination to shared results.

- [ ] **Step 2: Run RED**
  Expected: page/list do not use shared primitives.

- [ ] **Step 3: Replace local `toUrlSearchParams` with `toAdminUrlSearchParams`**
  No behavior change.

- [ ] **Step 4: Update Product active-filter descriptors**
  Map: query→`q`, status→`status`, category→`category`, featured→`featured`, readiness→`readiness`, asset→`asset`, currency→`currency`, created→`createdFrom,createdTo`, updated→`updatedFrom,updatedTo`.

- [ ] **Step 5: Render four Product summary items**
  Total Products (blue), Ready to sell (emerald), Coming Soon (violet), Needs attention (amber).

- [ ] **Step 6: Refactor ProductList around `AdminIndexResults`**
  Keep Product table content and Manage links intact; no browser-side Product catalogue filtering.

- [ ] **Step 7: Run focused GREEN and protected checks**
  Run Product tests, typecheck, lint, `git diff --check`; byte-check protected commercial authority files.

- [ ] **Step 8: Commit**
  `git commit -m "feat: add product operations summary"`

### Task 5: D1 batch verification

- [ ] Run all Admin/Product tests.
- [ ] Run `pnpm typecheck`.
- [ ] Run `pnpm lint`.
- [ ] Run `pnpm verify:source`.
- [ ] Run `pnpm build`.
- [ ] Run `git diff --check`.
- [ ] Confirm Prisma schema and lockfile unchanged.
- [ ] Confirm working tree clean.
- [ ] Push once.
- [ ] Record the exact D1 final commit; D2 executor must pin that SHA.
