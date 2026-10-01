# Production deployment guide

This guide deploys Octalve Vault as an independent application:

- `vault.octalve.com` → Vercel / Next.js application.
- `downloads.octalve.com` → Cloudflare Worker.
- private R2 bucket → commercial product assets.
- managed PostgreSQL → authoritative application state.

Do not merge this repository back into `octalve-holding`. The Holding site can later link/redirect its old Vault pages to `https://vault.octalve.com`.

## 0. Release gate before infrastructure changes

On Windows PowerShell:

```powershell
corepack enable
pnpm install --frozen-lockfile
.\scripts\verify.ps1
```

Do not proceed if any gate fails.

## 1. GitHub repository

Create a new private repository for Octalve Vault and push this project only. Confirm Git does not contain `.env`, ZIP product assets, `.next`, `node_modules` or provider credentials.

Recommended default branch: `main` with pull-request/required-check protection after the first deployment.

## 2. PostgreSQL

Create a dedicated production PostgreSQL database for Vault; do not reuse the Octalve Holding database.

Set `DATABASE_URL` locally for migration work and in Vercel Production.

### Initial migration

This archive includes an initial SQL migration matching the committed Prisma schema by source-level review. Because the build environment that produced the archive could not install/run Prisma CLI packages, **before the first production deployment you must validate/regenerate the migration with the pinned Prisma 6.19.3 CLI on your machine**.

Recommended procedure:

1. Keep a copy of the included `prisma/migrations/20260926190000_initial/migration.sql` for review.
2. After `pnpm install --frozen-lockfile`, run Prisma validation/generation through `scripts/verify.ps1`.
3. If you want Prisma to regenerate the initial SQL from scratch, temporarily move the included timestamped migration directory outside `prisma/migrations`, run `scripts/create-initial-migration.ps1`, and compare the generated SQL with the included migration before replacing anything.
4. Review destructive statements. The first migration should create schema objects only.
5. Apply to the empty production database with:

```powershell
pnpm db:deploy
```

Never run `prisma migrate dev` against production.

Then seed the catalogue shell:

```powershell
pnpm db:seed
```

Seeded products are not intended to become purchasable until real product assets and explicit prices are reviewed/published through Admin.

## 3. Cloudflare R2

Create a **private** R2 Standard bucket named:

```text
octalve-vault-assets
```

Do not expose it with a public `r2.dev` URL.

Create S3-compatible credentials scoped to this bucket for the Vercel application. Give only the object operations required for Admin upload/verification. Set in Vercel:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME=octalve-vault-assets`

### R2 CORS

Apply `infrastructure/cloudflare/r2-cors.production.json` to the production bucket. It allows browser PUT uploads only from `https://vault.octalve.com`, only the `Content-Type` request header and exposes `ETag`.

Do not add `*` origins in production.

## 4. Cloudflare Turnstile

Create a production Turnstile widget allowed for `vault.octalve.com`.

Set in Vercel:

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

The site key is public. The secret is server-only.

## 5. Cloudflare Worker

Worker source is under `workers/vault-download`.

The committed `wrangler.toml` expects:

- R2 binding `VAULT_ASSETS` → bucket `octalve-vault-assets`.
- `ORIGIN_API_URL=https://vault.octalve.com`.
- scheduled notification trigger every five minutes.

Create two strong independent secrets in Vercel:

- `INTERNAL_DOWNLOAD_SECRET`
- `INTERNAL_CRON_SECRET`

Set the exact same values in the Worker as:

```text
OCTALVE_INTERNAL_REDEEM_SECRET
OCTALVE_INTERNAL_CRON_SECRET
```

Use Wrangler/Cloudflare dashboard secret storage; never place values in `wrangler.toml`.

Deploy the Worker and map the custom route/domain:

```text
https://downloads.octalve.com
```

The Worker needs no database, payment, Resend, JWT or R2 S3 secrets; it uses its R2 binding plus the two internal secrets.

## 6. Resend

Verify an Octalve sender/domain and create a production API key.

Set:

- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_SUPPORT_EMAIL`

The Worker cron calls the internal notification processor; payment settlement remains durable even when email is temporarily unavailable.

## 7. Payments

### Paystack

Confirm the production Octalve merchant account is permitted for every currency you intend to expose. Configure:

- `PAYMENT_PROVIDER_PAYSTACK_ENABLED=true`
- `PAYSTACK_ENABLED_CURRENCIES=NGN` (add USD only after Paystack confirms it for your account)
- `PAYSTACK_ENVIRONMENT=TEST` while completing the provider test/refund smoke test
- `PAYSTACK_SECRET_KEY=<matching server secret>`

Webhook URL:

```text
https://vault.octalve.com/api/webhooks/paystack
```

Do not enable USD merely because the code supports it; the merchant account itself must be enabled for international/USD payments.

### Flutterwave

Confirm the production account/country supports the currencies/payment methods you intend to expose. Configure:

- `PAYMENT_PROVIDER_FLUTTERWAVE_ENABLED=true`
- `FLUTTERWAVE_ENABLED_CURRENCIES=<only currencies approved for your account>`
- `FLUTTERWAVE_ENVIRONMENT=TEST` until a separate Flutterwave test integration is proven
- `FLUTTERWAVE_SECRET_KEY=<matching server secret>`
- `FLUTTERWAVE_WEBHOOK_SECRET=<environment-appropriate webhook secret>`

Webhook URL:

```text
https://vault.octalve.com/api/webhooks/flutterwave
```

The code supports NGN/USD/GBP/EUR as commerce currencies, but a product must have an explicit active price and the selected provider/account must actually support the currency. Never invent missing currency prices.
### Payment-environment rollout rule

Deploy the payment-environment migration **before** any provider is switched to `LIVE`. Existing pre-live `PaymentAttempt`, `WebhookEvent`, and `Refund` rows are intentionally retained and backfilled as `TEST`; the migration must not be run after real-money LIVE records have already been introduced without a separate reviewed migration plan.

A provider's secret and environment setting are one configuration unit. Change them together in the same controlled Vercel configuration window, then redeploy:

```text
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_ENVIRONMENT=LIVE
```

Never switch only the secret or only the environment. Vault fails closed when the stored attempt environment, validated configured environment, and normalized provider verification/refund environment do not agree. Detailed Admin history retains TEST records, but LIVE business KPIs exclude them.

Do not activate Flutterwave LIVE merely because the adapter exists. Prove Flutterwave TEST checkout, verification, webhook, refund and revocation separately before changing its secret/environment pair to LIVE. Future Stripe, PayPal and Crypto adapters follow the same staged rule.

## 8. Vercel project

Import the new Vault GitHub repository as its own Vercel project. Do not point the old Octalve Holding project at this repository.

Use Node 22.18+ / compatible Node 24. pnpm is pinned by `packageManager` to 12.7.0.

Add all required Production environment variables from `.env.example`.

Attach:

```text
vault.octalve.com
```

Set both:

```text
APP_URL=https://vault.octalve.com
NEXT_PUBLIC_APP_URL=https://vault.octalve.com
NEXT_PUBLIC_DOWNLOADS_URL=https://downloads.octalve.com
```

The production build must not run database migrations implicitly. Apply migrations deliberately before/with a controlled release using `pnpm db:deploy`.

## 9. First Admin

Locally, against the production database and only after the schema is deployed, temporarily set:

```text
ADMIN_BOOTSTRAP_EMAIL
ADMIN_BOOTSTRAP_NAME
ADMIN_BOOTSTRAP_PASSWORD
```

Run:

```powershell
pnpm admin:bootstrap
```

The bootstrap refuses to run when any Admin already exists. Remove those variables immediately afterward; do not add them permanently to Vercel.

Log in at:

```text
https://vault.octalve.com/admin/login
```

## 10. Product migration/publishing

Do **not** copy the old `vault-files` folder into this repository or deployment.

For each real product:

1. Inspect the commercial ZIP locally and ensure it contains the intended deliverables.
2. Create/review its product copy in Admin.
3. Add explicit active prices for the currencies you want to sell.
4. Upload the ZIP through Admin (direct browser → private R2).
5. Verify the uploaded asset.
6. Publish that asset/version.
7. Activate the product only after the product, prices and asset are correct.

This intentionally prevents the previous empty-placeholder ZIP problem.

## 11. DNS

Final topology:

```text
vault.octalve.com      -> Vercel
 downloads.octalve.com -> Cloudflare Worker
```

Keep the product R2 bucket private; there is no customer-facing R2 DNS record.

## 12. Live production smoke test before announcing Vault

Use a controlled real product and a deliberately small real transaction appropriate for your merchant account. Verify all of the following:

1. EN, FR and AR public pages render; AR direction is RTL.
2. Admin login requires valid credentials/Turnstile and logout invalidates the session.
3. Create/edit a product and price from Admin without a redeploy.
4. Direct Admin upload reaches private R2; no ZIP is committed to Git/Vercel.
5. Checkout uses the server price, not a manipulated browser price.
6. Enabled provider initializes and returns to the correct localized success page.
7. Webhook/callback results in exactly one paid order/grant even when replayed.
8. Customer email receives access information.
9. Vault email request returns generic text and OTP authentication succeeds.
10. Customer sees only their active paid grants.
11. Download URL uses `downloads.octalve.com`; browser does not receive a permanent R2 URL.
12. Download completes and a Range/resume request succeeds.
13. Revoke the test grant and confirm subsequent authorization fails.
14. Exercise the provider refund flow on an appropriate transaction and confirm the Octalve status follows provider-confirmed state.
15. `/api/health` is healthy and reveals no credentials/infrastructure secrets.

Only after this checklist passes should the old Octalve Holding Vault page be replaced by a notice/link or redirect to `https://vault.octalve.com`.

## 13. Rollback principle

Because Vault is independent, a failed Vault release does not require changing Octalve Holding. Roll back the Vercel Vault deployment to the previous good deployment, leave R2 private, preserve database/payment records, and diagnose before applying new migrations or replaying financial actions.

<!-- OCTALVE_BATCH_F_PRODUCT_MEDIA_IMAGEKIT_RELEASE:START -->
## Batch F - Product media / ImageKit release

The Batch F release is fail-closed.

Release order:

1. Prove the F6 RED and focused GREEN.
2. Run full tests, TypeScript, ESLint, source verification, Prisma validate/generate, production build, git diff checks, protected-authority checks, migration safety checks, package-delta checks, and pnpm store verification.
3. Commit the sixth checkpoint as "docs: record batch f product media rollout".
4. Confirm DATABASE_URL, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_PUBLIC_KEY, and IMAGEKIT_URL_ENDPOINT locally without printing values.
5. Confirm the ImageKit variable names exist in Vercel Production without printing values.
6. Use only the existing production-safe additive migration command: pnpm db:deploy.
7. Require Prisma migration status to report the schema is up to date.
8. Never seed production and never run prisma migrate dev against production.
9. Fetch origin/main and require it still points to the approved Batch F baseline before the one controlled push.
10. Execute exactly one final git push origin main.
11. Verify HEAD equals origin/main after the push.
12. Verify the Git-triggered Vercel Production deployment is Ready for the exact final commit SHA.

Do not use vercel deploy --prod for Batch F. Vercel deployment must remain Git-triggered.
<!-- OCTALVE_BATCH_F_PRODUCT_MEDIA_IMAGEKIT_RELEASE:END -->
