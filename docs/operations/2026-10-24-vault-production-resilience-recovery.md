# Octalve Vault Production Resilience Recovery — 2026-10-24

## Incident

The Octalve Vault Neon project reached its free-plan monthly compute allowance and was paused. Because the public storefront and shared locale shell queried PostgreSQL during server rendering, database unavailability caused public routes to fail.

A second contributing factor was the Cloudflare download Worker notification scheduler:

```toml
crons = ["*/5 * * * *"]
```

The scheduler called `/api/internal/notifications/process` every five minutes. That endpoint queries the notification outbox through Prisma even when no notification is pending. This cadence can keep a scale-to-zero PostgreSQL compute endpoint active unnecessarily.

A third coupling was found in Vercel: the project build command was `pnpm db:deploy && pnpm build`. That made an application deployment depend on a live production database and caused recovery deployments to fail while Neon was paused.

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

The Vercel project build command was changed to `pnpm build`. Production database migrations remain controlled by the existing manually triggered `.github/workflows/migrate-production.yml` workflow, which validates the Prisma schema, runs `prisma migrate deploy`, and verifies migration status against the production database.

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

The authoritative `scripts/verify.sh` gate passed on the recovery content:

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

A separate DB-outage runtime smoke was then executed with PostgreSQL deliberately unreachable. It passed all required assertions:

- application starts successfully;
- `/api/health` returns HTTP 200 with `status: ok`;
- `/api/ready` returns HTTP 503 with `status: degraded`;
- root, Home, Shop, Cart and Checkout return HTTP 200 with the safe temporary-unavailable state;
- Admin login still renders;
- no checkout or value-granting path is allowed to proceed without authoritative database data.

Vercel Preview also built successfully after the build-command decoupling.

## Remaining operational requirement

The repository's Worker schedule is now hourly, but that schedule does not become active until the Cloudflare Worker configuration is deployed. The live Worker must be updated/verified before Neon resumes so the old five-minute scheduler cannot continue waking PostgreSQL.

Production remains on the locked baseline until the recovery PR is merged and the resulting Production deployment is verified.
