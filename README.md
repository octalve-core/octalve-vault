# Octalve Vault

Standalone production-oriented digital-commerce and secure-delivery application for **vault.octalve.com**.

Octalve Vault is intentionally independent of the Octalve Holding website. The Holding site only needs a future notice/link to `https://vault.octalve.com`; this repository owns the Vault storefront, checkout, customer access, Admin, payment settlement, product asset management and secure download delivery.

## What is included

- Next.js 16 / React 19 standalone storefront and customer Vault.
- English, French and Arabic UI architecture, including RTL handling for Arabic.
- NGN, USD, GBP and EUR commerce primitives; product prices are explicit per currency (no guessed FX values).
- Paystack and Flutterwave provider adapters behind a provider-neutral payment service.
- PostgreSQL/Prisma commerce, payment, entitlement, session, audit, notification and refund schema.
- Workspace-inspired Admin with RBAC, products/translations/prices/assets, orders, payments, customers, downloads, team, audit/security events and settings.
- Cloudflare Turnstile on anonymous sensitive entry points.
- Private Cloudflare R2 product storage with direct Admin upload authorization.
- `downloads.octalve.com` Cloudflare Worker delivery; customers never receive a permanent R2 object URL.
- Short-lived download tickets, resumable byte-range delivery and entitlement validation.
- Retryable transactional email outbox using the Resend HTTP API.
- Provider-backed refund initiation/status refresh.
- Security headers, robots/sitemap boundaries, legal pages and health endpoint.
- Tests, verification scripts and deployment/operator documentation.

## Repository rules

Commercial product ZIPs do **not** belong in Git. Real `.env` files, private keys, provider secrets and database credentials do **not** belong in Git. Product ZIPs are uploaded from Admin directly to the private R2 bucket after the application is deployed.

The repository intentionally ships only `.env.example`.

## Page/component structure

The application preserves the Octalve convention of keeping route `page.tsx` files small and compositional. Page sections, forms and domain behavior live in feature modules instead of giant route files.

Example:

```text
src/app/[locale]/page.tsx
  -> HeroSection
  -> FeaturedProductsSection
  -> CategoriesSection
  -> WhyVaultSection
```

The same pattern is used for Admin pages.

## Local prerequisites

- Node.js 22.18+ (Node 24 is supported by the declared engine range).
- pnpm 12.7.0.
- PostgreSQL compatible with Prisma 6.19.3.

Install and verify:

```powershell
corepack enable
pnpm install --frozen-lockfile
.\scripts\verify.ps1
```

On Unix/macOS:

```bash
corepack enable
pnpm install --frozen-lockfile
./scripts/verify.sh
```

See [ENVIRONMENT.md](./ENVIRONMENT.md) before starting the app.

## First production setup

1. Create a managed PostgreSQL database.
2. Configure the variables in `.env.example` through Vercel/Cloudflare; never commit their real values.
3. Review the initial migration under `prisma/migrations/20260926190000_initial/migration.sql` and validate it with the pinned Prisma CLI before applying it.
4. Run `pnpm db:deploy` against the production database.
5. Run `pnpm db:seed` to create the catalogue shell. The seeded products remain `COMING_SOON` until real assets and prices are published.
6. Set the one-time `ADMIN_BOOTSTRAP_*` values locally, run `pnpm admin:bootstrap`, then remove those variables immediately.
7. Create the private Cloudflare R2 bucket and apply the included production CORS policy.
8. Deploy the Cloudflare Worker and bind the R2 bucket.
9. Configure Turnstile for `vault.octalve.com`.
10. Configure live payment-provider credentials and webhooks.
11. Deploy the Next.js application to Vercel and attach `vault.octalve.com`.
12. Attach `downloads.octalve.com` to the Worker.
13. Run the end-to-end production checklist in `DEPLOYMENT.md` before enabling products.

## Verification

The authoritative release gate is:

```powershell
.\scripts\verify.ps1
```

or:

```bash
./scripts/verify.sh
```

It performs a frozen install, source/secret scan, tests, Prisma validation/generation, typecheck, ESLint, production/full audits, production build, a second frozen-lock check and pnpm store integrity.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — standalone system boundaries, invariants and provider abstractions.
- [DEPLOYMENT.md](./DEPLOYMENT.md) — GitHub, PostgreSQL, Cloudflare, Vercel, DNS, payments and launch sequence.
- [ENVIRONMENT.md](./ENVIRONMENT.md) — every environment variable and where it belongs.
- [SECURITY.md](./SECURITY.md) — threat boundaries, secret handling, auth, webhook and download controls.
- [OPERATIONS.md](./OPERATIONS.md) — product publishing, refunds, customer support, notifications, incident actions and backup expectations.
- [RELEASE_VERIFICATION.md](./RELEASE_VERIFICATION.md) — what was verified during construction and the mandatory pre-deploy gates.

## Important verification note

This source archive is designed to be verified with the pinned pnpm/Prisma toolchain before deployment. External provider behavior (live Paystack/Flutterwave accounts, Resend delivery, Turnstile, R2, Worker routing, DNS and PostgreSQL connectivity) cannot be proven without your real provider accounts and credentials; `DEPLOYMENT.md` contains the required live smoke tests.
