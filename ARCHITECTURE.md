# Standalone Octalve Vault Design

## Purpose

Build Octalve Vault as an independent production-oriented digital-commerce and secure-delivery application deployed at `vault.octalve.com`, with secure downloads served through `downloads.octalve.com`. The current Octalve Holding repository is reference material only and must not be modified or merged into this project.

## Non-negotiable requirements

- Next.js App Router, TypeScript, Tailwind CSS, Prisma/PostgreSQL, pnpm.
- Preserve Octalve section-per-page/component organization: route `page.tsx` files compose focused sections rather than contain large page implementations.
- No commercial product ZIP files in Git or the Vercel deployment.
- Product assets are uploaded from a polished Admin UI into a private Cloudflare R2 bucket.
- Customer downloads are authorized by Octalve and streamed by a Cloudflare Worker at `downloads.octalve.com`; permanent R2 URLs/keys are never sent to customers.
- Admin authentication uses password + Cloudflare Turnstile, revocable server-side sessions, short-lived signed JWT cookies, RBAC permissions, proper logout, and audit logs.
- Customer Vault access uses email + Turnstile + cryptographically secure OTP + revocable customer session.
- Paystack and Flutterwave are active provider adapters. Payment business logic is provider-independent so Stripe, PayPal, crypto or other providers can be added without rewriting checkout.
- Multi-currency architecture supports NGN, USD, GBP and EUR initially. Prices are explicit per currency; orders snapshot immutable currency/amount data.
- Multilingual public/customer UI supports English, French and Arabic initially, including RTL for Arabic. Locale and currency are independent preferences.
- Secrets live only in environment variables. Business configuration is centralized and can be database-managed where appropriate.
- No fake payment, fake storage or demo authentication implementation in production code. Missing external credentials produce clear configuration errors rather than silent fallbacks.
- Public product/store pages are indexable. Admin, checkout verification, and customer private Vault pages are `noindex`.
- Production security headers, CSRF-aware mutation patterns, rate limiting, input validation, idempotency, least privilege and structured audit/security events are first-class.
- Source archive `.env` values must never be copied into this repository. Ship `.env.example` only.
- Existing product images/branding may be copied; the old commercial ZIP files may not be copied.

## Architecture

### Web application

`vault.octalve.com` is a standalone Next.js application with public store, checkout/payment callbacks, customer Vault, and Admin.

### Database

Standalone PostgreSQL database. Prisma models cover:

- Product, ProductTranslation, ProductPrice, ProductAsset
- Order, OrderItem, PaymentAttempt, WebhookEvent, Refund
- DownloadGrant, DownloadTicket, DownloadEvent
- CustomerAccessChallenge, CustomerSession
- AdminUser, AdminSession, AdminAuditLog, SecurityEvent
- StoreSetting

Financial amounts are integer minor units. Historic OrderItems snapshot product title, price, currency, quantity and asset/version.

### Storage

Cloudflare R2 Standard private bucket. Admin uploads use a short-lived upload authorization generated server-side. Files are addressed internally by opaque object keys. ProductAsset holds metadata and lifecycle state.

### Delivery Worker

Cloudflare Worker at `downloads.octalve.com` receives an opaque short-lived DownloadTicket, calls a private Octalve redemption endpoint using an internal shared secret, validates entitlement, then reads the object from its R2 binding and streams it. Range requests are supported for resumable large downloads.

### Payments

Provider registry exposes a common interface. Paystack and Flutterwave adapters initialize/verify payments and verify webhooks. A single settlement service updates orders and grants idempotently.

### Identity

Admin: password hash + Turnstile + AdminSession + JWT HttpOnly Secure cookie + permissions.

Customer: email + Turnstile + OTP challenge + CustomerSession HttpOnly Secure cookie. One verified session exposes all eligible grants for the email.

### Internationalization

Lightweight typed locale dictionaries initially avoid an additional runtime dependency; routing uses `[locale]`, with `en`, `fr`, `ar`. Currency formatting uses `Intl.NumberFormat`. Architecture keeps the translation layer behind helpers so next-intl or another provider can replace it later without changing domain services.

## Page/component organization

Every major route composes sections. Example:

```text
src/app/[locale]/page.tsx
src/features/store/home/sections/
  vault-hero.tsx
  featured-products.tsx
  trust-strip.tsx
  how-it-works.tsx
  secure-delivery.tsx
  vault-cta.tsx
```

Admin follows the same pattern under `src/features/admin/*`.

## Provider/configuration boundaries

- `src/config/*` owns validated environment and public runtime config.
- `src/server/payments/*` owns payment provider registry/adapters.
- `src/server/storage/*` owns R2/object storage abstraction.
- `src/server/auth/*` owns JWT/session/password logic.
- `src/server/security/*` owns Turnstile/rate limiting/request metadata.
- `src/server/vault/*` owns settlement, grant and download-ticket services.
- UI never calls Paystack, Flutterwave, R2 or Resend directly.

## Initial roles and permissions

- SUPER_ADMIN: all permissions.
- ADMIN: commercial operations excluding sensitive team/security administration.
- CATALOG_MANAGER: products, translations, prices, assets, publishing.
- SUPPORT: orders, customers, grants/resends; no pricing/team changes.
- AUDITOR: read-only commercial/audit access.

Permissions are checked server-side even if UI controls are hidden.

## Product lifecycle

Product status: DRAFT, ACTIVE, COMING_SOON, ARCHIVED.

Asset status: UPLOADING, READY, PUBLISHED, RETIRED, FAILED.

A product cannot be purchased unless it is ACTIVE and has a PUBLISHED asset and active price for the selected currency.

## Checkout/payment invariants

- Browser submits product IDs/quantities and chosen currency, never trusted prices.
- Server loads active ProductPrice rows and calculates subtotal.
- Order + PaymentAttempt are persisted before contacting an external provider.
- Provider verification must match reference, expected amount, currency and buyer email when returned.
- Webhook signature is verified before payload persistence/processing.
- Settlement is idempotent and cannot create duplicate DownloadGrants.
- Notification failure cannot roll back a successful payment settlement.

## Download invariants

- Grants are database entitlements, not URLs.
- Tickets are random, hashed at rest, bound to grant+asset, short-lived and revocable through the grant/session state.
- Worker receives no database credentials.
- Browser receives only `downloads.octalve.com/d/<ticket>` and a human-readable `Content-Disposition` filename.
- Range requests are supported.

## Security/data handling

- Normalize email addresses.
- Use Node `crypto.randomInt` for OTP, random bytes for tokens.
- Hash OTP/tickets with HMAC secrets where appropriate.
- Password hashing uses `crypto.scrypt` with per-password random salt and constant-time verification.
- JWT uses HS256 implemented through Web/Node crypto primitives; JWT contains only session/user identifiers and role, while revocation is enforced through AdminSession/CustomerSession records.
- Rate limiting is initially database-backed to avoid another paid service.
- No raw secrets/tokens/OTP in logs.
- Security events are separate from admin business audit logs.

## Deployment

- Vercel: Next.js app at `vault.octalve.com`.
- Cloudflare: R2 private bucket, Turnstile, Worker at `downloads.octalve.com`.
- PostgreSQL: standalone production database.
- Resend: transactional emails.
- Paystack/Flutterwave: production credentials configured only via environment.

## Deliverable

A clean ZIP of the standalone project, excluding `.git`, `node_modules`, `.next`, `.env*` secrets and commercial product archives, with README, deployment guide, security guide, operations guide, Prisma migrations/schema, Worker code, tests and one-shot verification scripts.
