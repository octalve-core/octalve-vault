# Octalve Vault — Batch F ProductMedia + ImageKit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure, ImageKit-backed public merchandising Media Library and first-class ProductMedia system without changing Octalve Vault's private R2 downloads, server-authoritative commerce, payments, refunds, or entitlements.

**Architecture:** Neon remains authoritative for `MediaAsset`, `ProductMedia`, primary-image selection, gallery order, alt text, usage and retirement. ImageKit stores/delivers public merchandising images; the existing private R2 `ProductAsset`/DownloadGrant/DownloadTicket/Worker chain remains untouched. Public product image resolution is `READY primary ProductMedia → legacy Product.imagePath → /brand/vault-logo.png`.

**Tech Stack:** Next.js 16.3.6 App Router, React 19.2.3, TypeScript 5.9.3, Tailwind CSS 4.3.3, Prisma 6.19.3/PostgreSQL (Neon), pnpm 12.7.0, `@imagekit/next` 2.1.6, ImageKit DAM/Upload API, existing Admin RBAC/audit/rate-limit/same-origin systems.

**Spec:** `docs/superpowers/specs/2026-10-01-octalve-vault-phase-2-product-media-imagekit-design.md`

## Global Constraints

- Required starting Git SHA: `8c3bd1a04069b77f1c480d2c123fc7d649c9d724`.
- Preserve `Product.imagePath` and all existing legacy product imagery.
- Preserve private Cloudflare R2 `ProductAsset` storage and secure Worker delivery.
- Do not modify checkout price authority, payment settlement, refunds, Customer Vault entitlements, DownloadGrant/DownloadTicket authority, TEST/LIVE KPI isolation, or commercial ZIP publication semantics.
- Use `product.write` for Media Library and ProductMedia mutations; `product.read` may view Product media through existing protected Product surfaces.
- ImageKit private key is server-only. Never place it in `NEXT_PUBLIC_*`, client bundles, JSON responses, audit metadata, logs or Git.
- Pin `@imagekit/next` exactly to `2.1.6`; do not upgrade unrelated packages.
- Allow merchandising uploads only for JPEG, PNG, WebP and AVIF; SVG is out of scope.
- Maximum provider file size: 10 MiB.
- Maximum dimension: 12,000 px per side; maximum total pixels: 50,000,000.
- Upload auth is a same-origin `POST`, not a GET.
- Upload auth is rate-limited per authenticated Admin: 20 grants/hour and 60 grants/day.
- The browser's MIME type, path, dimensions, size and ImageKit response metadata are not authority. Registration re-fetches provider details server-side.
- Registration additionally fetches the public object header bytes and validates an independent image magic signature before creating `MediaAsset`.
- ImageKit upload filenames are generated opaque names under `/octalve-vault/products`; user-controlled filenames are retained only as sanitized display metadata.
- No arbitrary remote-URL import, server-side URL fetch supplied by the user, SVG, video, provider deletion, or AI media features in Batch F.
- All API ID operations verify resource membership/relationship on the server to prevent BOLA.
- Every mutation uses existing Admin audit and Batch E action notifications.
- All behavior-changing tasks use RED → verify RED → GREEN → full relevant regression before checkpoint commit.
- Production migration is additive and must be inspected for destructive statements before `prisma migrate deploy`.
- One remote push only after all local release gates and the production-safe additive migration gate pass.
- No manual `vercel deploy --prod`.

## OWASP Security Contract

This plan explicitly implements the OWASP File Upload and API Security recommendations relevant to Vault:

- allowlist extensions and MIME types;
- do not trust the browser `Content-Type`;
- verify independent file signatures;
- generate storage filenames rather than trusting user filenames;
- cap file size and decompressed image dimensions/pixel count;
- only authorized Admins can obtain upload credentials or register assets;
- same-origin mutation checks protect upload auth/registration routes;
- rate-limit upload authorization to reduce resource/cost exhaustion;
- deny by default through existing RBAC;
- validate object-level relationships for ProductMedia IDs;
- accept only explicitly mapped request properties—no mass assignment;
- keep provider secret credentials server-side;
- separate public merchandising storage from private commercial assets;
- audit state-changing operations.

## Review Focus

1. **Compromised/forged upload metadata:** provider MIME or browser MIME says JPEG but bytes are executable/non-image → registration must fail before any `MediaAsset` row is created.
2. **Object-ID substitution/BOLA:** a valid ProductMedia ID from Product A is submitted under Product B → every update/delete/primary/reorder operation must reject it.
3. **Cost/resource abuse:** repeated upload-auth calls or oversized/high-pixel images → per-admin rate limit and size/dimension/pixel limits must fail closed.
4. **Legacy compatibility:** products with no ProductMedia must still render their existing `Product.imagePath`; products with neither must use the Vault fallback.
5. **Provider/config failure:** missing/invalid ImageKit configuration must disable new upload/provider mutations cleanly without breaking legacy catalogue, checkout, payments or downloads.

---

### Task F1: Lock baseline, dependency, schema and additive migration

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.env.example`
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20261001070000_product_media_imagekit/migration.sql`
- Create: `tests/media/product-media-schema.test.ts`
- Create: `tests/media/imagekit-config.test.ts`
- Create: `src/server/media/imagekit-config.ts`

**Interfaces:**
- Produces: `MediaProvider.IMAGEKIT`, `MediaAssetStatus.READY|RETIRED`, `MediaAsset`, `ProductMedia`, nullable `Product.primaryMediaId`, and `getImageKitConfig(): { privateKey; publicKey; urlEndpoint }`.
- Keeps `Product.imagePath` unchanged.
- Adds exact runtime dependency `@imagekit/next: 2.1.6`.

- [ ] **Step 1: Verify exact starting state**
  - Fresh `git fetch origin main`.
  - Require clean `main`.
  - Require `HEAD == origin/main == 8c3bd1a04069b77f1c480d2c123fc7d649c9d724`.
  - Run full existing `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm verify:source`, `pnpm store status`.
  - Capture hashes for Phase 1 protected payment/refund/download/private-storage authority files.

- [ ] **Step 2: Write F1 RED tests**
  - Assert schema does not yet contain `MediaAsset`/`ProductMedia`.
  - Assert the future migration must retain `imagePath`.
  - Assert ImageKit env vars are documented but private key is never `NEXT_PUBLIC_*`.
  - Assert package does not yet include `@imagekit/next`.

- [ ] **Step 3: Verify RED**
  - Run only F1 tests; require expected missing-schema/dependency failures.

- [ ] **Step 4: Pin dependency**
  - Run `pnpm add --save-exact @imagekit/next@2.1.6` using the known-good pnpm store.
  - Reject any unrelated package-manifest change.

- [ ] **Step 5: Add additive Prisma schema**
  - Add `MediaProvider`, `MediaAssetStatus`, `MediaAsset`, `ProductMedia`, `Product.media`, `Product.primaryMediaId`, `Product.primaryMedia`, `AdminUser.mediaCreated`.
  - Use distinct relation names for Product gallery relation, Product primary relation and MediaAsset creator relation.

- [ ] **Step 6: Add hand-reviewed additive migration SQL**
  - Create only new enum/table/index/FK structures and nullable `Product.primaryMediaId`.
  - Migration test rejects `DROP TABLE`, `DROP COLUMN`, `DROP TYPE`, `TRUNCATE`, deletion of `imagePath`, or changes to existing financial/download tables.
  - `ProductMedia.productId → Product.id ON DELETE CASCADE`.
  - `ProductMedia.mediaAssetId → MediaAsset.id ON DELETE RESTRICT`.
  - `Product.primaryMediaId → ProductMedia.id ON DELETE SET NULL`.
  - `MediaAsset.createdByAdminId → AdminUser.id ON DELETE SET NULL`.

- [ ] **Step 7: Add ImageKit configuration helper**
  - `getImageKitConfig()` uses existing `requiredEnv`.
  - Normalize `IMAGEKIT_URL_ENDPOINT` to HTTPS, no query/hash, no credentials, and no trailing slash.
  - Document `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_URL_ENDPOINT` in `.env.example`.

- [ ] **Step 8: GREEN**
  - F1 tests, `prisma validate`, `prisma generate`, typecheck, lint, source verification.
  - Assert protected Phase 1 hashes unchanged.
  - Local checkpoint commit: `feat: add product media schema`.

---

### Task F2: ImageKit provider adapter and OWASP upload verification

**Files:**
- Create: `src/server/media/image-signature.ts`
- Create: `src/server/media/imagekit-provider.ts`
- Create: `src/server/media/media-validation.ts`
- Create: `src/server/media/media-service.ts`
- Create: `src/app/api/admin/media/upload-auth/route.ts`
- Create: `src/app/api/admin/media/register/route.ts`
- Create: `tests/media/image-signature.test.ts`
- Create: `tests/media/imagekit-provider.test.ts`
- Create: `tests/media/media-upload-security.test.ts`

**Interfaces:**
- `createMediaUploadAuth(actorAdminId, request): Promise<{ token; signature; expire; publicKey; fileName; folder; maxBytes }>`
- `fetchImageKitAsset(providerAssetId): Promise<VerifiedProviderAsset>`
- `detectImageSignature(bytes): "image/jpeg" | "image/png" | "image/webp" | "image/avif" | null`
- `registerMediaAsset(actorAdminId, input): Promise<MediaAssetDto>`

- [ ] **Step 1: Write security RED tests**
  - forged MIME;
  - double/unsafe extension;
  - >10 MiB;
  - zero-byte;
  - width/height >12,000;
  - pixels >50M;
  - unsupported SVG/GIF;
  - provider path outside `/octalve-vault/products/`;
  - provider `fileType !== "image"`;
  - duplicate provider asset ID;
  - invalid magic bytes;
  - auth endpoint without `product.write`;
  - upload-auth replay/resource-abuse threshold.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement magic-byte detector**
  - JPEG: `FF D8 FF`.
  - PNG: canonical 8-byte signature.
  - WebP: `RIFF....WEBP`.
  - AVIF: ISO-BMFF `ftyp` with `avif`/`avis` compatible brand in the inspected header.
  - Detector never trusts extension or browser MIME.

- [ ] **Step 4: Implement provider adapter**
  - `getUploadAuthParams` from `@imagekit/next/server`.
  - Provider metadata GET uses server-only Basic auth to ImageKit DAM.
  - Public asset verification fetches only the uploaded provider URL derived from verified `providerFilePath`; no arbitrary URL input is accepted.
  - Fetch with `cache: "no-store"` and bounded read; inspect header bytes.
  - Provider private key never appears in thrown client-facing errors or logs.

- [ ] **Step 5: Implement POST upload-auth**
  - `requireAdminPermission(request, "product.write")`.
  - Existing same-origin mutation protection therefore applies.
  - Body contains only `originalFilename`, `mimeType`, `sizeBytes`.
  - Validate extension/MIME/size before issuing provider credentials.
  - Enforce both `admin.media.upload-auth.hour` (20/hour) and `admin.media.upload-auth.day` (60/day) before issuing credentials.
  - Generate opaque provider filename and `/octalve-vault/products` folder.
  - `cache-control: no-store`.

- [ ] **Step 6: Implement POST register**
  - Accept only `providerAssetId` and sanitized `originalFilename`.
  - Re-fetch ImageKit details server-side.
  - Verify provider ID/path/type/MIME/size/dimensions/pixel count and magic bytes.
  - Reject private/non-image/wrong-folder provider files.
  - Create `MediaAsset` only after all checks pass.
  - Audit `MEDIA_REGISTERED`.
  - Duplicate provider ID returns safe conflict behavior.

- [ ] **Step 7: GREEN**
  - Security tests + existing auth/same-origin/rate-limit suites.
  - Typecheck/lint/source verification.
  - Protected hashes unchanged.
  - Local checkpoint: `feat: secure imagekit media uploads`.

---

### Task F3: Server-backed Media Library and safe retirement

**Files:**
- Create: `src/server/admin/media-index.ts`
- Extend: `src/server/media/media-service.ts`
- Create: `src/app/api/admin/media/route.ts`
- Create: `src/app/api/admin/media/[id]/retire/route.ts`
- Create: `src/app/admin/(protected)/media/page.tsx`
- Create: `src/features/admin/media/media-library.tsx`
- Create: `src/features/admin/media/media-upload-control.tsx`
- Modify: `src/features/admin/layout/admin-shell.tsx`
- Create: `tests/admin/media-library.test.ts`
- Create: `tests/media/media-index.test.ts`

**Interfaces:**
- `parseMediaIndexParams(searchParams)`
- `listAdminMedia(input)` → bounded paginated serializable DTO.
- `getAdminMediaSummary()` → ready/in-use/unused/retired counts.
- `retireMediaAsset(actorAdminId, mediaAssetId)`.

- [ ] **Step 1: RED**
  - query/status/usage/sort/page parsing;
  - DB-backed pagination;
  - `/admin/media` permission gate;
  - Product nav adds Media under `product.write`;
  - retirement blocked if usage > 0;
  - retired asset excluded from default selectors.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement server query/index**
  - bounded page size;
  - filename/path search translated to Prisma;
  - usage via ProductMedia relation;
  - no client-side full-library filtering.

- [ ] **Step 4: Implement protected Media page**
  - Header + four summary cards.
  - Upload button/control.
  - Search/status/usage/sort/pagination.
  - Thumbnail, filename, dimensions, size, status, usage.
  - Copy URL and view usage.
  - Retire button uses Batch E notice state.

- [ ] **Step 5: Implement safe retirement**
  - Require `product.write`.
  - Transaction or guarded query confirms no ProductMedia assignments.
  - Set `RETIRED`, `retiredAt`.
  - Audit `MEDIA_RETIRED`.
  - Do not call ImageKit delete API.

- [ ] **Step 6: GREEN**
  - Media tests + Admin structural/RBAC tests.
  - Typecheck/lint/source.
  - Local checkpoint: `feat: add admin media library`.

---

### Task F4: ProductMedia assignment, primary, alt text, reorder and Product creation

**Files:**
- Extend: `src/server/media/media-service.ts`
- Modify: `src/server/admin/products-service.ts`
- Modify: `src/app/api/admin/products/route.ts`
- Create: `src/app/api/admin/products/[id]/media/route.ts`
- Create: `src/app/api/admin/products/[id]/media/reorder/route.ts`
- Create: `src/app/api/admin/products/[id]/media/[productMediaId]/route.ts`
- Create: `src/app/api/admin/products/[id]/media/[productMediaId]/primary/route.ts`
- Create: `src/features/admin/products/product-media-panel.tsx`
- Create: `src/features/admin/media/media-picker.tsx`
- Modify: `src/features/admin/products/product-editor.tsx`
- Modify: `src/app/admin/(protected)/products/[id]/page.tsx`
- Modify: `src/features/admin/products/product-create-page-form.tsx`
- Create: `tests/admin/product-media.test.ts`
- Create: `tests/media/product-media-service.test.ts`

**Interfaces:**
- `listProductMedia(productId)`
- `attachProductMedia(actorAdminId, productId, mediaAssetId)`
- `setPrimaryProductMedia(actorAdminId, productId, productMediaId)`
- `updateProductMediaAlt(actorAdminId, productId, productMediaId, altText)`
- `reorderProductMedia(actorAdminId, productId, orderedIds)`
- `detachProductMedia(actorAdminId, productId, productMediaId)`
- `createAdminProduct(..., primaryMediaAssetId?: string)`

- [ ] **Step 1: RED**
  - cannot attach RETIRED asset;
  - duplicate assignment rejected;
  - first assignment becomes primary;
  - Product A cannot mutate Product B media;
  - primary must belong to same Product;
  - alt max 300 chars;
  - reorder requires exact set/no duplicates;
  - remove primary promotes lowest-position remaining item;
  - remove last clears primary;
  - Product creation with READY media creates Product + assignment + primary atomically;
  - Product creation with invalid/retired media fails completely.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Implement service transaction rules**
  - All object membership validation on server.
  - Full-order reorder transaction.
  - Explicit audit actions:
    - `PRODUCT_MEDIA_ATTACHED`
    - `PRODUCT_MEDIA_DETACHED`
    - `PRODUCT_MEDIA_PRIMARY_SET`
    - `PRODUCT_MEDIA_ALT_UPDATED`
    - `PRODUCT_MEDIA_REORDERED`

- [ ] **Step 4: Implement specific Admin routes**
  - Use explicit mapped properties only.
  - Require `product.write`.
  - No generic mass-assignment PATCH.

- [ ] **Step 5: Integrate active Product editor**
  - Keep ProductMedia visually separate from "Private product files".
  - Upload/select existing.
  - Set primary.
  - Save alt.
  - Move up/down.
  - Remove.
  - Copy public URL.
  - Batch E notices + `router.refresh()`.

- [ ] **Step 6: Integrate Product create**
  - Optional Media picker.
  - Submit only `primaryMediaAssetId`.
  - Existing title/slug/category behavior unchanged.

- [ ] **Step 7: GREEN**
  - ProductMedia + existing Product creation + action-feedback regression.
  - Typecheck/lint/source.
  - Local checkpoint: `feat: integrate product media workflows`.

---

### Task F5: Public resolver, CSP/Next image policy and gallery UI

**Files:**
- Create: `src/server/media/public-media.ts`
- Modify: `src/features/store/catalogue/catalogue-service.ts`
- Modify: `src/features/store/catalogue/types.ts`
- Modify: `src/features/store/products/product-view-model.ts`
- Modify: `src/features/store/products/product-card.tsx`
- Modify: `src/features/store/products/product-detail-modal.tsx`
- Modify: `src/features/store/products/product-detail.tsx`
- Create: `src/features/store/products/product-gallery.tsx`
- Modify: `next.config.ts`
- Create: `tests/store/product-media-resolution.test.ts`
- Create: `tests/store/product-media-ui.test.ts`
- Extend: existing security-header tests

**Interfaces:**
- `publicMediaUrl(providerFilePath, preset?)`
- `PublicProduct.imagePath`
- `PublicProduct.imageAlt`
- `PublicProduct.gallery[]`

- [ ] **Step 1: RED**
  - primary READY ProductMedia wins;
  - legacy `imagePath` wins when no primary;
  - Vault logo fallback when neither;
  - RETIRED media never resolves publicly;
  - gallery READY-only and ordered;
  - blank ProductMedia alt falls back to localized Product title;
  - COMING_SOON gets media without changing purchase semantics;
  - card/modal/detail retain lifecycle and cart behavior;
  - CSP allows exact ImageKit image origin + `https://upload.imagekit.io` connection but does not add broad `https:` or wildcard image hosts.

- [ ] **Step 2: Verify RED**

- [ ] **Step 3: Add public media resolver**
  - Build URLs only from configured ImageKit endpoint + DB-verified provider path.
  - No arbitrary URL input.
  - Centralize transformation presets if used.

- [ ] **Step 4: Extend catalogue include**
  - Include primary/gallery MediaAsset rows without modifying published ProductAsset readiness logic.
  - Keep `purchasable = ACTIVE + published private ProductAsset`; images never make a Product purchasable.

- [ ] **Step 5: Update presentation**
  - ProductCard uses resolved primary + effective alt.
  - ProductDetail uses accessible gallery component.
  - ProductDetailModal uses same gallery state.
  - Legacy/local product images keep working.

- [ ] **Step 6: Update Next/CSP safely**
  - Parse configured ImageKit endpoint at build time.
  - `images.remotePatterns` restricted to that HTTPS hostname/path.
  - `img-src` adds only configured ImageKit origin.
  - `connect-src` adds only ImageKit upload endpoint required by browser upload.
  - Existing R2/Turnstile CSP entries remain.
  - Keep `object-src 'none'`, HSTS, nosniff, frame-ancestors and same security headers.

- [ ] **Step 7: GREEN**
  - Storefront ProductMedia + lifecycle + cart + checkout structural tests.
  - Security header regression.
  - Typecheck/lint/source/build.
  - Local checkpoint: `feat: resolve product media publicly`.

---

### Task F6: Documentation, migration deployment and final release gate

**Files:**
- Add approved spec: `docs/superpowers/specs/2026-10-01-octalve-vault-phase-2-product-media-imagekit-design.md`
- Add this plan: `docs/superpowers/plans/2026-10-01-octalve-vault-batch-f-product-media-imagekit.md`
- Modify where needed: `ENVIRONMENT.md`, `DEPLOYMENT.md`, `SECURITY.md`, `OPERATIONS.md`, `RELEASE_VERIFICATION.md`
- Create: `tests/media/batch-f-release.test.ts`

**Interfaces:**
- Documents ImageKit configuration without secrets.
- Records exact migration/deployment/rollback contract.

- [ ] **Step 1: RED release-contract test**
  - Require spec/plan/status documentation.
  - Require ImageKit env docs.
  - Require no private key literal.
  - Require private R2 separation statement.
  - Require ProductMedia → legacy → fallback contract.

- [ ] **Step 2: GREEN documentation**

- [ ] **Step 3: Complete local release gate**
  - Full `pnpm test`.
  - `pnpm typecheck`.
  - `pnpm lint`.
  - `pnpm verify:source`.
  - `pnpm exec prisma validate`.
  - `pnpm exec prisma generate`.
  - `pnpm build`.
  - `git diff --check`.
  - `pnpm store status`.
  - Verify protected Phase 1 hashes.
  - Verify exact Batch F changed-file boundary.
  - Verify `package.json` adds only `@imagekit/next@2.1.6` and lockfile changes correspond to it.
  - Verify migration SQL has no destructive legacy/financial/download statements.

- [ ] **Step 4: Infrastructure/env gate**
  - Require `DATABASE_URL` for production migration deploy but never print it.
  - Verify ImageKit server env variables exist locally for provider smoke validation but never print values.
  - Do not require these variables for legacy storefront build.
  - User must separately configure the same three ImageKit variables in Vercel Production before live upload use.

- [ ] **Step 5: Apply additive migration**
  - Run `pnpm db:deploy`.
  - Run `pnpm exec prisma migrate status`.
  - Require database reports schema up to date.
  - Do not seed or mutate Product media records automatically.

- [ ] **Step 6: Fresh remote check**
  - Fresh fetch.
  - Require `origin/main` still equals Batch F starting SHA before the sole push.

- [ ] **Step 7: One controlled push**
  - Push `main` once.
  - Fetch and require `HEAD == origin/main`.
  - No manual Vercel CLI deployment.

- [ ] **Step 8: Post-deploy evidence**
  - Verify Vercel Git-triggered deployment is Ready for the final SHA before claiming production complete.
  - Smoke:
    - legacy product images still render;
    - Admin login/RBAC works;
    - Media Library page loads;
    - upload auth denies unauthorized actor;
    - upload one controlled image;
    - registration succeeds;
    - attach/set primary and public Product image changes without affecting checkout;
    - retire remains blocked while used;
    - detach/replace works;
    - private ZIP download path still uses `downloads.octalve.com`.

- [ ] **Step 9: Final record**
  - Phase 2 is complete only after migration + final SHA + production evidence are all recorded.

## Rollback Contract

- Code rollback: revert/deploy previous good Vercel Git SHA; do not use manual Vercel CLI.
- Database: because migration is additive, leave the new nullable column/tables in place during code rollback; Phase 1 code ignores them.
- Never roll back by dropping ProductMedia/MediaAsset in production while media rows may exist.
- ImageKit: do not bulk-delete provider files. Retired/unreferenced assets remain recoverable until a later explicit cleanup policy.
- Private R2/download/payment/refund state is never touched by rollback.

## Expected Batch F Checkpoints

1. `feat: add product media schema`
2. `feat: secure imagekit media uploads`
3. `feat: add admin media library`
4. `feat: integrate product media workflows`
5. `feat: resolve product media publicly`
6. `docs: record batch f product media rollout`

No checkpoint is pushed remotely. The only remote push is after F6 passes.


## Audited Implementation Refinements

The source-level audit against the exact Phase 1 baseline added these security/compatibility refinements without changing the approved architecture:

- Media Library pagination uses the existing shared Admin contract: 10/25/50/100, default 25.
- ImageKit upload options add provider-side `checks` for MIME and 10 MiB size plus `overwriteFile: false`; these are defense-in-depth because the browser is not authority.
- Vault registration additionally requires ImageKit `isPublished === true` and `isPrivateFile === false`.
- Upload authorization uses two cost-abuse windows: 20/hour and 60/day per authenticated Admin.
- ProductMedia operations verify URL Product ownership before update/delete/primary/reorder to prevent BOLA.
- Reordering requires the exact current ProductMedia ID set and safely handles an empty gallery.
- Media retirement uses the existing shared confirmation dialog and remains soft; no provider file deletion occurs.
- The storefront uses separate 800px card, 1400px detail and 300px thumbnail ImageKit transformations while retaining legacy local-image compatibility.
- Remote ImageKit images are passed to `next/image` with `unoptimized` to avoid a second Vercel image-optimization layer.
- Existing `tests/operations/operational-structure.test.ts` remains the security-header regression authority.
- ImageKit Path Policies are optional defense-in-depth only because current ImageKit documentation marks them Enterprise-only; Batch F does not rely on them.
