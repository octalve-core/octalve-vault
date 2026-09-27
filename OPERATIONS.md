# Operations guide

## Product lifecycle

### Create product
Use Admin → Products. Define the base product record, translated copy and explicit per-currency price(s). Do not invent FX conversions: if USD/GBP/EUR prices are not deliberately set, those currencies should not be sold for that product.

### Upload asset
From the product editor, choose the product ZIP. The Admin requests short-lived direct R2 upload authorization; the browser uploads directly to the private bucket. Large files therefore do not travel through a Vercel Function.

### Verify and publish
Upload completion does not automatically make the product sellable. Verify the asset, then publish it from Admin. Checkout accepts only a product with an active explicit price and a `PUBLISHED` asset.

Do not overwrite old asset versions. Publish a new version so existing order snapshots remain auditable.

## Customer purchase flow

1. Customer selects products/currency.
2. Checkout sends product IDs, email, locale, currency and selected enabled provider.
3. The server recalculates all prices and snapshots the published asset.
4. The external provider collects payment.
5. Callback/webhook is independently verified with the provider.
6. Idempotent settlement marks the order paid and creates download grants.
7. A notification job is enqueued; payment success does not depend on email availability.
8. Customer verifies the checkout email through Turnstile + OTP and sees all eligible grants in one Vault session.
9. Clicking Download creates a short-lived download ticket for `downloads.octalve.com`.

## Notification processing

The Cloudflare Worker cron calls the protected notification processor every five minutes. Notification jobs are idempotent by dedupe key and retry with backoff after temporary failures.

If email delivery is down, orders remain paid and grants remain valid. Restore Resend/configuration, then allow the scheduled processor to retry. Inspect notification failures from database/operational tooling; never manually change an order to failed because an email failed.

## Refunds

Refund actions are provider-backed.

- Confirm the correct order/payment before initiating.
- The requested amount cannot exceed the remaining refundable amount.
- A local reservation prevents concurrent refund requests exceeding the payment balance.
- Provider status is refreshed before treating a refund as terminal.
- A partial successful refund preserves download entitlement unless business policy requires a manual grant revocation.
- A provider-confirmed **full** refund revokes delivery entitlement according to the implemented policy.

For disputes/chargebacks, verify provider status directly and preserve the financial/audit record; do not delete orders/payment attempts.

## Customer support

Support/Admin can inspect Orders, Customers and Download grants. Use grant revocation for fraud/refund/support situations instead of deleting purchase records.

A failed download should normally be retried by generating a new short-lived ticket. Do not send the R2 object URL to customers.

## Admin/team operations

- `SUPER_ADMIN`: full platform/team/security authority.
- `ADMIN`: operational management according to the permission map.
- `CATALOG_MANAGER`: catalogue/product operations without team/security authority.
- `SUPPORT`: customer/order/download support without pricing/team authority.
- `AUDITOR`: read-only operational/audit access.

Disable an Admin instead of deleting the historical actor. Revoke sessions when offboarding a team member.

## Security events and audit logs

Use Admin → Audit and Admin → Security when investigating unusual behavior. Security events are operational/security signals; audit logs record privileged Admin changes.

Do not store secrets, OTPs or raw download tickets in support notes.

## Product file integrity

For every published asset verify:

- expected filename/format;
- non-zero meaningful content;
- expected size;
- successful extraction/opening on a clean machine;
- version and product match;
- no secrets/private business source files included accidentally.

The old Octalve source contained placeholder/empty ZIPs; this standalone system intentionally does not ship them. Only upload finished commercial assets through Admin.

## Database backups and recovery

Use a managed PostgreSQL provider with automated production backups/PITR appropriate for your business. Before schema migrations or major payment changes:

1. Confirm a recent backup exists.
2. Run the release verifier.
3. Review migration SQL.
4. Apply `prisma migrate deploy`—never `migrate dev` against production.
5. Confirm `/api/health` and key application flows after deployment.

Financial/audit tables should not be casually hard-deleted.

## Provider outage response

If one payment provider is unavailable, disable its `PAYMENT_PROVIDER_*_ENABLED` environment setting and redeploy while keeping another valid provider active. Do not display a provider that is not configured for the selected currency/account.

If R2/Worker delivery is impaired, do not make the bucket public. Disable product sales or download operations operationally until private delivery is restored.

If Turnstile is impaired, do not bypass server authentication permanently. Treat any temporary emergency change as a reviewed incident change and restore the bot-control boundary promptly.

## Monitoring/smoke checks

After each production deploy verify:

- `GET /api/health` reports healthy database connectivity without secret/infrastructure leakage;
- public EN/FR/AR pages render;
- Arabic layout direction is RTL;
- an enabled product shows only explicitly configured currency prices;
- Admin login rejects invalid credentials and valid login/logout revokes correctly;
- Turnstile protected access works;
- provider initialization uses the server price;
- provider webhook verification is accepted only for valid signatures;
- a real low-value production purchase (when appropriate) creates exactly one entitlement;
- the customer can OTP-authenticate and download through `downloads.octalve.com`;
- the browser does not receive a permanent R2 object URL;
- a resumable/Range download works;
- notification processing succeeds;
- a controlled refund test is performed according to provider/business policy before relying on refunds operationally.
