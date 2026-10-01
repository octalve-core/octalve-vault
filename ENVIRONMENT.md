# Environment configuration

Octalve Vault separates **secrets/infrastructure configuration** from normal business settings. Secrets live only in Vercel/Cloudflare/local environment configuration. Product prices, translations, product state and normal operational settings belong in the database/Admin.

Use `.env.example` as the complete variable inventory. Never commit `.env`, `.env.local`, `.pem`, credentials or copied provider responses containing secrets.

## Application URLs

### `APP_URL`
Server-side canonical application URL. Production: `https://vault.octalve.com`.

### `NEXT_PUBLIC_APP_URL`
Browser-visible canonical application URL. Production: `https://vault.octalve.com`.

### `NEXT_PUBLIC_DOWNLOADS_URL`
Browser-visible secure download gateway. Production: `https://downloads.octalve.com`.

### `NEXT_PUBLIC_SUPPORT_EMAIL`
Public support email displayed to customers. This is intentionally public.

## PostgreSQL

### `DATABASE_URL`
Prisma PostgreSQL connection string. Server-only. Use the provider's TLS-enabled production connection string. Do not expose it to the browser or Worker.

## Security secrets

Generate **independent** random values; do not reuse one secret for multiple purposes. Use at least 32 random bytes per secret.

### `ADMIN_SESSION_SECRET`
Signs Admin session JWTs.

### `CUSTOMER_SESSION_SECRET`
Signs customer Vault session JWTs.

### `DOWNLOAD_TICKET_SECRET`
HMAC protection for short-lived download tickets.

### `OTP_SECRET`
HMAC protection for customer OTP challenge verification. OTP plaintext is never stored.

### `RATE_LIMIT_SECRET`
Hashes rate-limit identifiers before persistence.

### `REQUEST_FINGERPRINT_SECRET`
Hashes IP/user-agent-derived security fingerprints.

### `INTERNAL_DOWNLOAD_SECRET`
Shared only between the Vercel app and Cloudflare Worker for the private ticket-redeem endpoint. On the Worker this same value is stored as `OCTALVE_INTERNAL_REDEEM_SECRET` using a Worker secret.

### `INTERNAL_CRON_SECRET`
Protects the notification outbox processor. On the Worker this same value is stored as `OCTALVE_INTERNAL_CRON_SECRET`.

Example secret generation in PowerShell:

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Generate a new value for every secret.

## Cloudflare Turnstile

### `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
Public Turnstile site key. Safe to expose to the browser.

### `TURNSTILE_SECRET_KEY`
Server-side Turnstile secret. Never expose to the browser.

Create production widgets for `vault.octalve.com`. Server-side Siteverify validation remains mandatory; client-side completion alone is not trusted.

## Cloudflare R2

### `R2_ACCOUNT_ID`
Cloudflare account identifier.

### `R2_ACCESS_KEY_ID`
Bucket-scoped R2 S3 API credential ID.

### `R2_SECRET_ACCESS_KEY`
Bucket-scoped R2 S3 API credential secret.

### `R2_BUCKET_NAME`
Production default: `octalve-vault-assets`.

Use credentials limited to this bucket and only the operations the application needs. Do not grant general Cloudflare account administration access.

The Worker accesses the same bucket through an R2 binding and therefore does not need these S3 credentials.

## Email

### `RESEND_API_KEY`
Server-only Resend API key.

### `EMAIL_FROM`
Verified sender, for example `Octalve Vault <vault@octalve.com>` after the domain is verified in Resend.

## Payments

Only enabled providers are displayed, and the selected provider must support the selected currency.

### `PAYMENT_PROVIDER_PAYSTACK_ENABLED`
`true` or `false`. Enable only after the production Paystack account, currency capability and live secret are configured.

### `PAYSTACK_ENABLED_CURRENCIES`
Comma-separated currencies actually enabled on your Paystack merchant account, for example `NGN` or `NGN,USD`. Values outside the adapter-supported list are rejected.

### `PAYSTACK_ENVIRONMENT`
Server-only payment environment. Allowed values are exactly `TEST` or `LIVE`. Never accept this value from browser input. `TEST` must be paired with an `sk_test_...` key; `LIVE` must be paired with an `sk_live_...` key.

### `PAYSTACK_SECRET_KEY`
Server-only Paystack secret. Its mode must agree with `PAYSTACK_ENVIRONMENT`.

Paystack webhook URL:

```text
https://vault.octalve.com/api/webhooks/paystack
```

### `PAYMENT_PROVIDER_FLUTTERWAVE_ENABLED`
`true` or `false`.

### `FLUTTERWAVE_ENABLED_CURRENCIES`
Comma-separated currencies actually enabled on your Flutterwave merchant account, for example `NGN,USD,GBP,EUR` as approved for your account. Unsupported values are rejected.

### `FLUTTERWAVE_ENVIRONMENT`
Server-only payment environment. Allowed values are exactly `TEST` or `LIVE`. Test credentials must use Flutterwave's test-key form; a TEST credential is rejected when configured as LIVE.

### `FLUTTERWAVE_SECRET_KEY`
Server-only Flutterwave API secret. Its credential mode must agree with `FLUTTERWAVE_ENVIRONMENT`.

### `FLUTTERWAVE_WEBHOOK_SECRET`
Server-only webhook secret/hash used to authenticate Flutterwave callbacks.

Flutterwave webhook URL:

```text
https://vault.octalve.com/api/webhooks/flutterwave
```

The current payment abstraction is deliberately provider-neutral. `PaymentEnvironment` is a shared `TEST|LIVE` boundary persisted with financial records. Stripe, PayPal or a regulated Crypto provider can later be implemented as new adapters without rewriting checkout or settlement, but each adapter must implement `configuredEnvironment()`, validate its credentials/endpoints/network, and normalize trustworthy provider environment evidence before runtime enablement.

## First Admin bootstrap

These variables are temporary and must not remain in Vercel production configuration after bootstrap:

- `ADMIN_BOOTSTRAP_EMAIL`
- `ADMIN_BOOTSTRAP_NAME`
- `ADMIN_BOOTSTRAP_PASSWORD`

Run:

```powershell
pnpm admin:bootstrap
```

The command refuses to run after any Admin exists. Remove the bootstrap variables immediately after the first Admin is created.

## Cloudflare Worker-only values

The Worker uses:

- `ORIGIN_API_URL=https://vault.octalve.com` (non-secret Worker variable in `wrangler.toml`).
- R2 binding `VAULT_ASSETS` to `octalve-vault-assets`.
- Worker secret `OCTALVE_INTERNAL_REDEEM_SECRET` = Vercel `INTERNAL_DOWNLOAD_SECRET`.
- Worker secret `OCTALVE_INTERNAL_CRON_SECRET` = Vercel `INTERNAL_CRON_SECRET`.

Do not place payment, database, JWT, OTP or R2 S3 credentials in the Worker.

## Future provider configuration

Do not add provider-specific conditionals to page components. Future payment/storage/email providers should implement the existing internal adapter/service boundaries and be enabled through configuration only after their credentials and supported currencies are known.

<!-- OCTALVE_BATCH_F_PRODUCT_MEDIA_IMAGEKIT_RELEASE:START -->
## Batch F - Product media / ImageKit

Batch F uses ImageKit only for public merchandising media. Cloudflare R2 remains private and authoritative only for commercial downloadable product archives.

Required server-side values for local release verification:

- DATABASE_URL
- IMAGEKIT_PRIVATE_KEY
- IMAGEKIT_PUBLIC_KEY
- IMAGEKIT_URL_ENDPOINT

The ImageKit private key is server-only. It must never use a NEXT_PUBLIC_ prefix and must never be emitted to browser JavaScript, API responses, logs, audit metadata, source control, or release reports.

The three ImageKit variables must also exist in Vercel Production before the Git-triggered production release. Presence may be verified, but values must never be printed.
<!-- OCTALVE_BATCH_F_PRODUCT_MEDIA_IMAGEKIT_RELEASE:END -->
