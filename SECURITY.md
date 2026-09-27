# Security model

Octalve Vault is a commerce and digital-delivery system. The primary security objectives are: do not grant value from unverified payments, do not expose permanent product storage URLs, do not store bearer secrets unnecessarily, do not trust client prices/roles/state, and make privileged actions auditable and revocable.

## Trust boundaries

### Browser
Untrusted. Product IDs, displayed prices, roles, payment status, locale/currency selections and download requests are all revalidated server-side.

### Next.js application (`vault.octalve.com`)
Trusted application layer. Owns catalogue rules, Admin/customer sessions, provider verification, settlement, entitlements, upload authorization and ticket issuance.

### PostgreSQL
Authoritative state for products, explicit currency prices, immutable order snapshots, payments, refunds, grants, sessions, challenges, tickets, audit/security events and notifications.

### Cloudflare R2
Private commercial asset store. Product ZIPs are not public and are not committed to Git.

### Cloudflare Worker (`downloads.octalve.com`)
Narrow delivery boundary. It receives an opaque short-lived ticket, redeems it privately with the Next.js application and streams the exact R2 object. It does not process payments or Admin authentication.

### Payment providers
External authoritative source for payment/refund state. Webhook payloads alone never grant value; provider transaction verification must match reference, currency, amount and customer identity expected by the order.

## Admin authentication

- Passwords are scrypt-hashed with an independent random salt.
- Admin login requires Turnstile plus rate limiting.
- A successful login creates a revocable database `AdminSession` and a short-lived signed JWT in a `HttpOnly`, `Secure` cookie.
- JWTs are not stored in localStorage.
- Every privileged API independently checks the live session and required permission.
- Roles map to explicit permissions; hiding a UI control is not authorization.
- Logout revokes the server-side session and clears the cookie.
- Sensitive Admin actions create audit records.

Recommended follow-up after launch: add a second factor/passkey requirement for `SUPER_ADMIN` accounts.

## Customer Vault authentication

- Customer access is email-based and does not require a password at launch.
- The access-request response is deliberately generic whether or not the email has purchases, preventing customer-email enumeration.
- Turnstile and database-backed rate limiting protect challenge creation.
- OTPs are generated with cryptographic randomness and stored only as HMAC-derived challenge values.
- Challenges expire, have an attempt cap, lock on repeated failure and are invalidated after successful use.
- A verified customer receives a revocable database session plus secure HttpOnly session cookie.
- A session may see only active paid grants for its normalized email.

## Payment security

- Checkout sends product IDs, selected currency and provider; the browser does not set final prices.
- The server loads current active product prices and requires a published asset before initializing payment.
- Order and PaymentAttempt state are recorded before contacting the external provider.
- OrderItem records snapshot product identity, asset, currency and amount at purchase time.
- Webhook signatures are verified against the raw request body **before** payload persistence or processing.
- Paystack transactions are independently verified with Paystack before settlement.
- Flutterwave transactions are independently verified with Flutterwave before settlement.
- Settlement is idempotent. Provider retries/callback retries must not create duplicate grants.
- Refunds use provider APIs; Octalve does not mark money refunded merely because an Admin clicked a button.
- Full delivery revocation occurs only after a provider-confirmed full refund.

## Product storage and downloads

- Commercial ZIPs are never stored in the repository or Vercel build output.
- R2 object keys are opaque and do not contain customer/product filenames.
- Admin uploads use short-lived object-scoped signed PUT authorization.
- An asset must be verified in R2 before becoming `READY`, and explicitly published before checkout can sell it.
- Customer APIs never return R2 object keys or R2 credentials.
- Download authorization creates a short-lived random bearer ticket and stores only its HMAC hash.
- The browser downloads through `downloads.octalve.com`, not a permanent R2 URL.
- The Worker redeems the ticket using an independent 32+ byte internal secret and an R2 binding.
- Download responses use `private, no-store`, attachment disposition, content-type hardening and resumable single-range support.
- Grant revocation and expiry are checked during redemption.

A downloaded file can still be re-shared by its legitimate purchaser; short-lived links protect server access, not DRM. Do not describe the system as preventing all piracy.

## Secrets

- Only `.env.example` belongs in Git.
- Independent secrets are used for Admin JWT, customer JWT, OTP HMAC, ticket HMAC, rate-limit hashing, request fingerprints, internal download auth and internal cron auth.
- Do not reuse payment secrets as application secrets.
- R2 S3 credentials are bucket-scoped and server-only.
- The Worker receives only its R2 binding and the two internal shared secrets it needs.
- Secret values, OTPs, full signed upload URLs and raw bearer tickets must not be logged.

The source verifier rejects real `.env*` files, ZIP files, private-key markers and common live-secret patterns.

## HTTP/browser hardening

`next.config.ts` centrally sets CSP, HSTS, `nosniff`, referrer policy, permissions policy, frame protection and COOP. Admin/customer private routes are not intended for search indexing. `robots.ts` blocks private operational routes.

The CSP intentionally permits Cloudflare Turnstile and R2 upload connections. If a new browser-side provider is later introduced, update CSP narrowly for that provider rather than weakening it to wildcards.

## Rate limiting and abuse

Database-backed rate limits are used so launch does not require another paid service. Sensitive actions include Admin login, customer access/OTP operations and other anonymous abuse boundaries. Stored identifiers are hashed rather than used as raw long-term tracking identifiers.

For substantially higher traffic, the rate-limit implementation can be replaced behind its service boundary with Redis/another distributed limiter without changing page logic.

## Incident response priorities

If a secret is suspected compromised:

1. Disable the affected feature/provider if possible.
2. Rotate the exact credential in the provider/Vercel/Cloudflare.
3. Revoke active application sessions if a session-signing secret was affected.
4. Review `SecurityEvent` and `AdminAuditLog` records for suspicious activity.
5. Verify payment-provider activity directly at the provider.
6. Do not restore service until the new credential is deployed everywhere that shares it.

If `INTERNAL_DOWNLOAD_SECRET` changes, update both Vercel and Worker `OCTALVE_INTERNAL_REDEEM_SECRET` together. The same synchronization requirement applies to `INTERNAL_CRON_SECRET` / `OCTALVE_INTERNAL_CRON_SECRET`.

## Production verification

Before launch run `scripts/verify.ps1` (Windows) or `scripts/verify.sh` (Unix). A production release is not approved on the basis of tests alone: the script also requires Prisma validation/generation, typecheck, ESLint, dependency audits, production build, frozen lockfile and pnpm store integrity.
