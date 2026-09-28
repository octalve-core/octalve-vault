# Octalve Vault Release Verification

**Verification date:** 2026-09-27
**Repository:** standalone `octalve-vault`
**Integration branch:** `feature/octalve-vault-ui-integration`
**Target:** `vault.octalve.com` with private downloads through `downloads.octalve.com`

This record covers the Octalve Vault public-UI integration performed against the standalone secure Vault engine, including the approved Coupon + Affiliate checkout extension. It distinguishes checks executed against the current branch from checks that remain deployment/runtime gates. No unexecuted check is claimed as passed.

## Architecture preserved by this integration

The old `octalve-holding` Vault was used only as the canonical presentation source. The standalone Vault remains authoritative for commerce, security and operations.

Canonical presentation references used:

- `src/components/layout/header.tsx` — Octalve sticky header shell, color rail and mobile interaction language
- `src/components/layout/footer.tsx` — Octalve dark footer structure
- `src/features/models/vault/components/vault-hero.tsx` — Vault hero composition
- `src/features/models/vault/components/vault-product-card.tsx` — product card presentation
- `src/features/models/vault/components/vault-product-details-modal.tsx` — product details presentation
- `src/features/models/vault/components/vault-faq.tsx` — FAQ presentation
- `src/features/models/vault/shop/page.tsx` — Shop presentation
- `src/features/models/vault/cart/page.tsx` — Cart presentation
- `src/features/models/vault/checkout/page.tsx` — Checkout presentation only
- `src/assets/products/vp001image.png` through `vp011image.png` and the Octalve/Vault/MX brand assets

The integration did **not** restore Holding's static catalogue/pricing authority, old cart state, gateway-specific frontend initialization, old webhook/settlement code, old OTP/session implementation, old download routes, hardcoded product ZIP delivery or authorization rules.

Standalone authority remains with Prisma/PostgreSQL catalogue data, server-authoritative pricing, the React 19 stable cart store, provider-neutral Paystack/Flutterwave payment services, immutable order snapshots, verified callbacks/webhooks, Customer Vault OTP/session/Turnstile, private R2 delivery, refunds, notifications, Admin RBAC/audit/security, i18n/RTL, legal routes and security headers.

## Public storefront integration verified in source

The current branch implements and source-verifies:

- canonical Octalve header with required order: Vault, Shop, Cart, Checkout, Contact, Currency, Language, Cart count, My Vault
- no second `VaultStripNav`
- canonical Octalve footer adapted to Vault/Help/Legal/Octalve destinations
- original Vault hero visual language, product/category showcase and FAQ
- byte-identical canonical `vp001`–`vp011` public product imagery and brand assets
- database-backed `PublicProduct` → presentation view-model adapter
- localized Shop/product detail/card/modal presentation with no fabricated ratings
- Octalve Cart presentation over the existing stable React 19 cart store
- Octalve Checkout presentation over server-authoritative payment initialization
- localized Contact page using approved support channels only, with no invented form/backend
- Octalve-branded Customer Vault and payment-result presentation without changing OTP/session/download authorization behavior
- legal shell alignment with the legal copy hash locked against accidental wording changes
- English/French/Arabic routing with Arabic RTL preserved
- public route files kept composition-focused
- removal of retired unused heavy-SaaS home sections after the final public quality scan

## Coupon + Affiliate extension

The approved checkout extension is integrated into the existing server authority rather than a parallel client pricing path.

Verified source properties include:

- optional Coupon and Affiliate codes are identifiers/input only; the browser does not control discount or final amount
- checkout pricing is recalculated from database product prices on the server
- Coupon rules support explicit percentage-basis-points or fixed-minor-unit configuration; no default discount is invented
- optional coupon currency, minimum subtotal, active window, global/per-email limits and product restrictions are database configuration
- coupon usage follows `RESERVED` → `REDEEMED` / `RELEASED`
- reservation occurs in the authoritative checkout transaction and redemption occurs only after verified payment settlement
- Affiliate attribution is separate from customer discount and may store a nullable configured `commissionBps`; no payout percentage/timing/base is invented
- immutable Order snapshots preserve coupon/affiliate attribution needed for later reconciliation
- quote API is display assistance only; payment initialization recomputes the authoritative amount
- idempotency identity includes material checkout inputs; identical retries reuse a key and changed checkout inputs rotate it
- non-empty promotion inputs require a current server quote before the UI permits payment submission
- least-privilege Admin marketing permissions and audit paths are present
- Prisma migration `20260927133000_checkout_promotions` records the promotion schema changes and database checks

## Checks executed against the current integration branch

### Full source test suite

Command:

```text
node --experimental-strip-types --test
```

Result:

- 127 tests
- 127 passed
- 0 failed

The suite covers domain foundations, public storefront structure, canonical assets/tokens, product/cart/checkout behavior, Coupon/Affiliate logic and structure, payment state, Customer Vault, Admin/RBAC, operations, schema source assertions, security primitives, same-origin controls, commerce settings and private storage/download behavior.

### Backend/Admin boundary regression suite

A separate grouped run covered unchanged/high-risk boundaries after the public UI migration:

```text
tests/admin/*.test.ts
tests/payments/*.test.ts
tests/customer-vault/*.test.ts
tests/security/*.test.ts
tests/storage/*.test.ts
tests/operations/*.test.ts
tests/schema/*.test.ts
tests/settings/*.test.ts
```

Result:

- 61 tests
- 61 passed
- 0 failed

This is evidence that the public migration did not intentionally replace Admin, payment, customer-access, security or private-delivery authority.

### Public UI quality gate

`tests/store/public-ui-quality.test.ts` verifies that public feature code:
- normalizes Windows path separators before route-shape assertions, so Windows and POSIX verification use the same route contract;

- does not use `font-black` / `font-extrabold`
- does not import old Holding Vault commerce modules
- retains accessible navigation labels/focus states and at least 44px mobile targets
- keeps localized `page.tsx` routes thin and browser-state free
- does not introduce `dangerouslySetInnerHTML`, `eval` or `new Function` surfaces

The final quality test is green.

### Final whole-branch review

A separate whole-branch self-review was performed from the reconstructed September 27 baseline through the integration head. A fresh reviewer/subagent is not available in this execution environment, so this is explicitly an author self-review rather than an independent second reviewer.

The review found and fixed two Important issues before final source verification:

- checkout now releases a reserved coupon only when gateway initialization itself fails; a successful remote gateway initialization followed by a local persistence failure no longer falsely marks the order/payment failed or frees coupon capacity
- the product-details modal now moves focus into the dialog, traps Tab/Shift+Tab within the modal, keeps the backdrop out of the tab order, supports Escape, and restores the previously focused element when closed

Both fixes were introduced with failing regression tests first and are included in the 127/127 full-source result above.

### Source/security verifier

Command:

```text
node scripts/verify-source.mjs
```

Result: **PASS**.

The verifier confirms required source structure and rejects committed commercial ZIPs, tracked secret environment files and known live-secret patterns. In a Git working tree it verifies tracked plus untracked non-ignored source candidates, so a local Git-ignored `.env` can exist for development without weakening committed-source checks. Without Git metadata (for example, an unpacked release archive), it falls back to scanning every physical source file, so an accidentally packaged `.env` still fails verification.

### Diff integrity

Command:

```text
git diff --check
```

Result: **PASS** during the final Task 11 source gate.

## Checks that remain mandatory and are not claimed as passed in this sandbox

This execution environment is also below the repository's declared Node floor (`v22.16.0` here versus `>=22.18.0 <25`) and does not have the pinned `pnpm@12.7.0` available locally. Corepack cannot download it because registry DNS access fails with `EAI_AGAIN registry.npmjs.org`. The current integration therefore has **no new success claim** for these commands:

- `pnpm install --frozen-lockfile`
- `pnpm typecheck`
- `pnpm lint`
- `pnpm exec prisma validate`
- `pnpm exec prisma generate`
- Prisma migration validation/diff against Prisma `6.19.3`, including `20260927133000_checkout_promotions`
- `pnpm audit --prod`
- full `pnpm audit`
- `pnpm build`
- final frozen-lockfile install recheck
- `pnpm store status`

The September 27 pre-integration working tree had previously passed these gates on the user's machine, but that evidence predates this UI/promotion branch and therefore is **not** treated as proof for the current branch.

Do not deploy the current branch until the repository's normal verifier completes successfully with its pinned toolchain.

## Runtime smoke tests still required

A real `pnpm dev` / production-build runtime smoke test cannot be executed in this sandbox without the installed dependency tree and development services. Before merge/deployment, inspect at minimum:

- `/en`
- `/en/products`
- one `/en/products/[slug]`
- `/en/cart`
- `/en/checkout`
- `/en/contact`
- `/en/vault`
- one localized legal page
- `/ar` for RTL

Check desktop and mobile widths, including 320px mobile, for:

- no hydration errors
- no maximum-update-depth loops
- no missing canonical images
- no horizontal overflow
- readable contrast and visible focus states
- cart count consistency between header and Cart page
- promotion quote/payment totals remaining server authoritative


### pnpm 12 lockfile compatibility hardening

- `pnpm-lock.yaml` now uses pnpm 12's two-document format: the first document pins pnpm 12.7.0 and its platform executable integrity records; the second document is the previously verified application dependency graph.
- The application dependency document is byte-identical to the pre-fix lockfile (SHA-256 `031be7e46f9240bfb8a5e1f0149a7d96bd32fe37075d55153133e9125fee8264`).
- `pnpm-workspace.yaml` explicitly allows the pinned `@pnpm/exe` build script so pnpm 12 does not oscillate package-manager lock metadata between install and non-install commands.
- `scripts/verify-source.mjs` and the release regression suite fail closed if this structure, the `deepmerge-ts@8.0.2` override, or the `@pnpm/exe` allowance is removed.

## Mandatory first-deployment checks

Before first production deployment:

1. Use the pinned Node/pnpm versions from `.node-version` and `packageManager`.
2. Run the complete repository verification script and require every gate to pass.
3. Validate/generate Prisma Client and review both the initial migration and `20260927133000_checkout_promotions` against Prisma `6.19.3`.
4. Apply reviewed migrations to a fresh/dedicated standalone PostgreSQL environment before production rollout.
5. Add production secrets only in Vercel/Cloudflare; never commit `.env`, gateway, R2 or database credentials.
6. Create/configure the private R2 bucket and production CORS policy, deploy the download Worker and bind the bucket.
7. Configure `downloads.octalve.com` for the Worker and `vault.octalve.com` for Vercel.
8. Configure Turnstile for the production hostname.
9. Enable only currencies actually supported by the live Paystack/Flutterwave merchant accounts.
10. Configure live provider webhook endpoints/secrets and exercise signature verification/idempotency.
11. Bootstrap the first Super Admin using the documented process, then remove bootstrap variables.
12. Upload and publish real product assets through Admin; do not sell products without a published private R2 asset.
13. Add explicit `ProductPrice` records for each non-NGN currency that should be purchasable.
14. Configure initial Coupon/Affiliate records only through the authorized Admin marketing surface and verify limits/attribution with controlled orders before general release.

## Payment-environment release checkpoint

- Apply the reviewed payment-environment migration while provider credentials are still TEST; existing pre-live financial rows are retained and classified as `TEST`.
- Keep `PAYSTACK_ENVIRONMENT=TEST` paired with the existing `sk_test_...` key until the controlled test refund reaches provider-confirmed success and Vault revokes the grant.
- TEST history remains visible in detailed Admin views, but TEST orders/customers/grants are excluded from LIVE business KPI counts.
- Verify a refunded-only test customer no longer receives a fresh entitlement OTP and any previously issued download ticket fails after grant revocation.
- Only after those checks pass may the Paystack secret and `PAYSTACK_ENVIRONMENT=LIVE` be changed together and one controlled low-value real-money purchase be performed.
- Flutterwave, Stripe, PayPal and Crypto require their own provider-specific TEST integration evidence before LIVE runtime activation; they reuse the shared `PaymentEnvironment` and settlement/refund guards rather than introducing a second payment core.

## Mandatory live smoke tests

Provider/infrastructure behavior cannot be proven without the real deployment accounts. Before public launch, perform controlled smoke tests for:

- Admin login/logout/RBAC and marketing-permission boundaries
- audited Coupon/Affiliate creation/update/disable flows
- coupon expiry, currency/product/minimum-order/usage-limit behavior
- affiliate attribution snapshot on an order
- Turnstile validation and generic customer access response
- Admin product creation/editing and direct R2 upload/verify/publish
- NGN checkout through every enabled live gateway using a controlled low-value transaction where appropriate
- any other currency only after confirming the live merchant account supports it
- payment callback + webhook idempotency
- coupon redemption only after verified settlement
- delivery notification and Customer Vault purchase discovery
- full and ranged/resumed download through `downloads.octalve.com`
- grant revocation
- provider refund initiation/provider-confirmed refresh and full-refund delivery revocation
- Admin audit/security-event visibility

## Release rule

The current branch has strong source-level test and architecture evidence, but production readiness remains conditional on the pinned dependency/Prisma/type/lint/audit/build gates and real runtime/provider smoke tests above. Evidence is required before merge/deployment; no deferred gate should be treated as passed.
