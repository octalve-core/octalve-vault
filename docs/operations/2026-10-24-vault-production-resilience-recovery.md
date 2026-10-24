# Octalve Vault Production Resilience Recovery — 2026-10-24

## Incident

The Octalve Vault Neon project reached its free-plan monthly compute allowance and was paused. Because the public storefront and shared locale shell queried PostgreSQL during server rendering, database unavailability caused public routes to fail.

A second contributing factor was the Cloudflare download Worker notification scheduler:

```toml
crons = ["*/5 * * * *"]
```

The scheduler called `/api/internal/notifications/process` every five minutes. That endpoint queries the notification outbox through Prisma even when no notification is pending. This cadence can keep a scale-to-zero PostgreSQL compute endpoint active unnecessarily.

## Recovery changes

The recovery branch:

- keeps the public Vault shell available when catalogue/settings reads fail;
- blocks Cart/Checkout from proceeding without authoritative live product data;
- preserves real product 404 semantics when the database is healthy;
- changes `/api/health` to application liveness without a DB query;
- adds `/api/ready` as the explicit PostgreSQL readiness probe;
- returns HTTP 503 for Admin infrastructure outages instead of misreporting them as invalid credentials;
- changes the notification recovery cron from every five minutes to hourly;
- updates Next.js and audited transitive dependencies required by the repository's security gate.

## Protected authority unchanged

This recovery does not change:

- payment initialization or provider verification;
- Paystack webhook settlement;
- `settleVerifiedPayment`;
- refund authority or revocation semantics;
- download ticket issuance/redemption authority;
- private R2 delivery authority;
- Prisma schema or migrations.

Checkout and value-granting paths remain fail-closed when the database is unavailable.

## Verification evidence

The authoritative `scripts/verify.sh` gate passed on the recovery content before temporary CI tooling was removed:

- source verification;
- 334/334 automated tests;
- Prisma schema validation;
- Prisma Client generation;
- TypeScript;
- ESLint;
- production dependency audit: no known vulnerabilities;
- full dependency audit: no known vulnerabilities;
- production build;
- frozen lockfile re-check;
- pnpm store integrity.

Production remains on the locked baseline until Review/Preview qualification is complete.
