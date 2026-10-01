# Octalve Vault — Phase 2 / Batch F Product Media Design

**Status:** Implementation complete; production release verification pending
**Date:** 2026-10-01
**Required starting baseline:** `8c3bd1a04069b77f1c480d2c123fc7d649c9d724`
**Approved media provider:** ImageKit
**Scope:** Public merchandising media only

## 1. Purpose

Batch F introduces a first-class product-media system for Octalve Vault while preserving the secure Phase 1 commerce, payment, refund, entitlement and private-download architecture.

The approved Phase 2 outcome is:

- separate public merchandising image storage;
- first-class `ProductMedia`;
- a Vault Admin Media Library;
- image upload;
- copy public URL;
- select an existing image;
- primary image;
- product gallery;
- reordering;
- product-specific alt text;
- safe media retirement;
- Product create/edit integration;
- public image resolution using:
  1. active primary ProductMedia;
  2. legacy `Product.imagePath`;
  3. approved fallback.

The existing legacy image system is retained throughout Phase 2.

Commercial product ZIP storage remains private Cloudflare R2 and is not reused for public merchandising media.

## 2. Architecture decision

### 2.1 Approved provider

ImageKit is the public merchandising media provider.

ImageKit owns the image binary, CDN delivery, media processing and provider file metadata.

Neon/PostgreSQL remains authoritative for Octalve product/media relationships and business semantics.

### 2.2 Separation of concerns

```text
Cloudflare R2 (existing)
└── PRIVATE commercial product archives
    ├── ProductAsset
    ├── DownloadGrant
    ├── DownloadTicket
    └── downloads.octalve.com Worker

ImageKit (new)
└── PUBLIC merchandising images
    ├── original uploaded images
    ├── CDN delivery
    ├── transformed card/detail/thumbnail variants
    └── provider metadata

Neon / Prisma
├── Product
├── MediaAsset
└── ProductMedia
```

ImageKit does not decide which Product owns an image, which image is primary, gallery order, alt text, Product lifecycle, pricing, checkout availability, entitlements, refunds or downloads.

## 3. Compatibility contract

The current `Product.imagePath String?` field remains in the schema. It is not renamed, backfilled, dropped or repurposed in Batch F.

Existing seeded/public images continue working without creating ProductMedia rows.

Locked public resolution order:

```text
active primary ProductMedia
        ↓
legacy Product.imagePath
        ↓
/brand/vault-logo.png
```

A Product with no ProductMedia therefore behaves exactly as it did before Batch F.

## 4. Data model

### 4.1 MediaProvider

Add:

```prisma
enum MediaProvider {
  IMAGEKIT
}
```

### 4.2 MediaAssetStatus

Add:

```prisma
enum MediaAssetStatus {
  READY
  RETIRED
}
```

No persistent `UPLOADING` row is required for the first implementation. A `MediaAsset` is registered only after ImageKit reports a completed upload and Vault verifies the provider record server-side.

### 4.3 MediaAsset

Conceptual model:

```prisma
model MediaAsset {
  id               String           @id @default(cuid())
  provider         MediaProvider    @default(IMAGEKIT)
  providerAssetId  String           @unique
  providerFilePath String
  originalFilename String
  mimeType         String
  width            Int
  height           Int
  sizeBytes        BigInt
  status           MediaAssetStatus @default(READY)
  createdByAdminId String?
  retiredAt        DateTime?
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  createdByAdmin AdminUser?    @relation(...)
  productMedia   ProductMedia[]

  @@index([status, createdAt])
  @@index([provider, providerFilePath])
}
```

Do not persist the current ImageKit delivery URL as the identity. Persist `providerAssetId` and `providerFilePath`, then derive the current public URL from the configured ImageKit URL endpoint.

### 4.4 ProductMedia

Conceptual model:

```prisma
model ProductMedia {
  id           String   @id @default(cuid())
  productId    String
  mediaAssetId String
  altText      String?
  position     Int      @default(0)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  product    Product    @relation(...)
  mediaAsset MediaAsset @relation(...)

  primaryForProduct Product? @relation("ProductPrimaryMedia")

  @@unique([productId, mediaAssetId])
  @@index([productId, position])
  @@index([mediaAssetId])
}
```

Removing media from a Product deletes only the assignment row. The reusable `MediaAsset` remains available unless it is explicitly retired.

### 4.5 Product primary pointer

Add a nullable relation:

```prisma
primaryMediaId String?       @unique
primaryMedia   ProductMedia? @relation(
  "ProductPrimaryMedia",
  fields: [primaryMediaId],
  references: [id],
  onDelete: SetNull
)

media ProductMedia[]
```

This gives each Product at most one primary assignment. The service layer must also verify that the selected `primaryMediaId` belongs to the same Product.

## 5. Migration rules

Batch F requires one additive Prisma migration.

It may create the media enums/tables, add `Product.primaryMediaId`, and add required indexes/foreign keys.

It must not:

- drop or rename `Product.imagePath`;
- rewrite existing Product rows;
- touch `ProductAsset`;
- touch Order, OrderItem or PaymentAttempt;
- touch Refund;
- touch DownloadGrant, DownloadTicket or DownloadEvent;
- modify pricing authority;
- make R2 public.

Before deployment:

1. generate/review SQL;
2. reject unrelated destructive statements;
3. run Prisma validation/generation;
4. run migration structural tests;
5. use production-safe `migrate deploy` / existing `db:deploy` path only;
6. never run `prisma migrate dev` against production.

The additive schema may be deployed before the code because existing Phase 1 code ignores the new nullable column and new tables.

## 6. ImageKit configuration

Required server environment:

```text
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_URL_ENDPOINT=
```

The private key is server-only and must never be placed in browser JavaScript, `NEXT_PUBLIC_*`, API responses, Git, logs or audit metadata.

Prefer a restricted ImageKit API key with only the media-management access Vault actually needs.

## 7. SDK/integration decision

Use the current ImageKit Next.js SDK for browser upload/authentication:

```text
@imagekit/next
```

Reasons:

- current Next.js-specific upload integration;
- server-side upload authentication helper;
- client upload utility;
- typed API;
- avoids implementing upload signature generation manually.

Do not add a second ImageKit package unless implementation proves it is necessary.

For server-side provider verification, Vault may call the ImageKit DAM REST API directly over HTTPS using the server-only private key.

## 8. Upload lifecycle

### 8.1 Client validation

Allowed formats:

- JPEG;
- PNG;
- WebP;
- AVIF.

SVG is excluded from Batch F.

Hard maximum original upload: **10 MB**.

Client validation improves UX but is never authority.

### 8.2 Upload authorization

Admin requests:

```text
GET /api/admin/media/upload-auth
```

The route must:

1. require an active Admin session;
2. require existing catalogue/product write permission;
3. confirm ImageKit configuration exists;
4. generate one-time upload authentication;
5. return only `token`, `signature`, `expire`, and `publicKey`.

The private key never leaves the server.

### 8.3 Direct upload

The browser uploads directly to ImageKit.

Required upload behavior:

```text
folder: /octalve-vault/products
useUniqueFileName: true
isPrivateFile: false
tags: ["octalve-vault", "product-media"]
```

Notification lifecycle:

```text
Preparing image upload…
→ Uploading image…
→ Verifying image…
→ Image added to Media Library
```

### 8.4 Server verification / registration

After provider upload succeeds, the browser sends only the returned provider identifier to:

```text
POST /api/admin/media/register
```

Conceptually:

```json
{
  "providerAssetId": "..."
}
```

Do not trust dimensions, MIME, path, size or URL supplied by the browser.

The server fetches ImageKit file details using the server-only credential and verifies:

- provider asset exists;
- provider object is a file;
- `fileType` is image;
- MIME is allowed;
- size is within the hard limit;
- width and height are positive;
- file is public, not private;
- provider file path is valid;
- provider ID is not already registered.

Only then create `MediaAsset` using server-verified provider metadata.

If verification fails, no MediaAsset is created.

## 9. Provider adapter boundary

Create a server-side provider interface:

```ts
interface PublicMediaProvider {
  createUploadAuth(): UploadAuth;
  getAsset(providerAssetId: string): Promise<ProviderMediaAsset>;
  publicUrl(providerFilePath: string): string;
  transformedUrl(
    providerFilePath: string,
    preset: MediaTransformPreset,
  ): string;
}
```

Initial implementation:

```text
ImageKitPublicMediaProvider
```

Product/catalogue services consume this provider-neutral layer, not ImageKit directly.

## 10. URL generation and variants

Canonical original URL:

```text
IMAGEKIT_URL_ENDPOINT + providerFilePath
```

Do not store transformed URLs in the database.

Centralize transformation presets:

- thumbnail: ~300 px;
- card: ~800 px;
- detail: ~1400 px;
- automatic format/quality where appropriate.

No component should hand-build arbitrary ImageKit transformation strings.

## 11. Next.js image behavior

Keep existing public image components where practical.

Add a strict ImageKit remote pattern based on the configured URL endpoint; do not allow arbitrary external image hosts.

Avoid unnecessary double optimization when ImageKit already serves an optimized transformed asset.

A shared Product-image helper distinguishes:

- ImageKit media;
- legacy local/static `imagePath`;
- fallback image.

## 12. Vault Media Library authority

`/admin/media` is backed by Neon `MediaAsset`, not by an unconstrained listing of the whole ImageKit account.

This ensures Vault controls:

- which provider assets have passed registration;
- usage relationships;
- retirement state;
- Admin audit history;
- Product selection eligibility.

The ImageKit DAM remains an operational provider tool, not the Octalve product database.

## 13. `/admin/media` experience

Add:

```text
/admin/media
```

Header:

```text
Media Library
Manage public product merchandising images.
[ Upload image ]
```

Summary cards:

- Ready images
- In use
- Unused
- Retired

Server-backed discovery:

- filename/path query;
- status;
- usage: all / in-use / unused;
- sort;
- pagination.

Media item shows:

- optimized thumbnail;
- filename;
- dimensions;
- size;
- status;
- usage count;
- uploaded date.

Actions:

- Copy URL
- View usage
- Retire, only when safe

No permanent delete in Batch F.

## 14. Media retirement

Retirement is a soft Vault state.

A READY MediaAsset may become RETIRED only when it has zero ProductMedia assignments.

If still in use:

```text
This image is still used by N products. Remove or replace those usages first.
```

On valid retirement:

- set `status=RETIRED`;
- set `retiredAt`;
- record Admin audit event;
- hide it from normal selectors;
- retain the ImageKit file physically.

## 15. Product Media editor

Add a dedicated **Product media** section to the active integrated Product editor, visually separate from **Private product files**.

Controls:

- Upload new image
- Select from Media Library
- Set primary
- Edit alt text
- Move up
- Move down
- Remove from product
- Copy public URL

Rules:

- only READY MediaAsset may be assigned;
- same MediaAsset cannot be assigned twice to one Product;
- Product may have many gallery items;
- Product has one primary assignment at most;
- first image may automatically become primary;
- removing the primary promotes the lowest-position remaining media, otherwise primary becomes null and public rendering falls back to legacy image.

Every mutation uses server authority, writes audit, uses Batch E notification feedback and refreshes server-rendered state.

## 16. Reordering

Initial gallery reordering uses accessible **Move up / Move down** controls.

Drag-and-drop is optional future enhancement, not a Batch F requirement.

The reorder endpoint validates that every submitted ProductMedia ID belongs to the Product and rejects duplicates or malformed order lists. Position updates are transactional.

## 17. Alt text

Alt text belongs to `ProductMedia`, not `MediaAsset`, because the same image may have different context on different Products.

Public alt resolution:

```text
ProductMedia.altText trimmed
    ↓ if blank
localized Product title
```

Legacy images also use the localized Product title as effective alt text.

## 18. Product creation integration

The dedicated `/admin/products/new` workflow gains optional media selection.

Admin may:

- create without media;
- select an existing READY MediaAsset;
- upload/register a new MediaAsset and select it.

Product POST accepts optional:

```text
primaryMediaAssetId
```

Product creation and the initial ProductMedia assignment occur in one database transaction after validating that the MediaAsset exists and is READY.

New Product lifecycle remains `DRAFT`.

## 19. Public catalogue contract

Extend `PublicProduct` without breaking current callers.

Conceptually:

```ts
type PublicProductMedia = {
  id: string;
  imagePath: string;
  altText: string;
  position: number;
};

type PublicProduct = {
  // existing fields retained
  imagePath: string | null;
  imageAlt: string;
  gallery: PublicProductMedia[];
  ...
};
```

`imagePath` remains the resolved primary display path expected by current Product cards.

Server resolution:

```text
valid READY primary ProductMedia
  → ImageKit path/URL
else legacy Product.imagePath
  → legacy path
else
  → /brand/vault-logo.png
```

Gallery contains READY ProductMedia in `position ASC`.

Retired media never appears publicly.

## 20. Storefront changes

### Home
Featured product cards use resolved primary ProductMedia when present.

### Shop
Product cards use resolved primary media.

### Product modal/detail

- resolved primary image;
- optional gallery thumbnails;
- thumbnail selection changes detail image;
- alt text follows selected ProductMedia;
- no price/lifecycle/cart authority change.

### Coming Soon
COMING_SOON may use ProductMedia exactly like ACTIVE.

Image presence is not a purchase-readiness requirement.

DRAFT/ARCHIVED public semantics remain unchanged.

## 21. RBAC

Do not add a new Admin role.

Use existing catalogue authority, primarily `product.write`, for:

- upload auth;
- media registration;
- Media Library mutations;
- assignment;
- primary selection;
- alt text;
- reorder;
- detach;
- retirement.

All routes continue to use current Admin session validation and audit patterns.

## 22. Audit events

Conceptual actions:

```text
MEDIA_REGISTERED
MEDIA_RETIRED
PRODUCT_MEDIA_ATTACHED
PRODUCT_MEDIA_DETACHED
PRODUCT_MEDIA_PRIMARY_SET
PRODUCT_MEDIA_ALT_UPDATED
PRODUCT_MEDIA_REORDERED
```

Never write ImageKit private keys, signatures or upload tokens into audit metadata.

## 23. Batch E notification integration

Use the existing shared Admin notification provider.

Examples:

```text
Preparing image upload…
Uploading image…
Verifying image…
Image added to Media Library
```

```text
Setting primary image…
Primary image updated
```

```text
Reordering images…
Gallery order updated
```

Provider upload success alone is not enough for “Image added to Media Library”; that success appears only after Vault verifies and registers the provider asset.

## 24. Failure semantics

### Upload fails before provider success
No MediaAsset, error notification, retry allowed.

### Provider upload succeeds but Vault verification fails
No MediaAsset registration. Show a safe error indicating the file could not be verified for Vault use. The unregistered provider object is not selectable.

### Provider unavailable
Fail closed for new mutations. Existing media/legacy image rendering and all commerce/download functions remain independent.

### Missing ImageKit configuration
Admin media provider routes return a clear configuration error. Existing Phase 1 legacy-image storefront remains functional.

## 25. Security rules

Non-negotiable:

- never expose ImageKit private key;
- never trust browser-returned provider metadata;
- verify provider file server-side before registration;
- reject unsupported MIME/file type;
- reject oversized assets;
- no SVG in Batch F;
- no arbitrary external URL import feature;
- no SSRF-style remote import path;
- all Admin media mutations require authenticated RBAC;
- audit mutations;
- no provider credential in Git;
- private R2 commercial storage remains private.

## 26. API surface

Intended responsibility split:

```text
GET  /api/admin/media/upload-auth
POST /api/admin/media/register
GET  /api/admin/media
POST /api/admin/media/:id/retire

GET    /api/admin/products/:id/media
POST   /api/admin/products/:id/media
PATCH  /api/admin/products/:id/media/:productMediaId
DELETE /api/admin/products/:id/media/:productMediaId

POST /api/admin/products/:id/media/reorder
POST /api/admin/products/:id/media/:productMediaId/primary
```

Prefer specific authority actions over generic catch-all mutation endpoints.

Product-create POST may additionally accept `primaryMediaAssetId`.

## 27. TDD execution strategy

### F1 — Schema and provider contract

RED:
- no MediaAsset/ProductMedia;
- no provider adapter/config;
- no additive migration contract.

GREEN:
- schema/migration;
- provider-neutral adapter;
- ImageKit config validation.

Tests must prove legacy `imagePath` remains, private ProductAsset/download models are untouched, and provider private key cannot be client-exposed.

### F2 — Upload and registration authority

RED: no auth/register endpoints.

GREEN:
- one-time upload auth;
- server provider verification;
- MediaAsset registration;
- duplicate provider ID rejection;
- MIME/type/size/dimension validation;
- audit.

### F3 — Media Library

RED: no `/admin/media`.

GREEN:
- summary cards;
- query/status/usage/sort/pagination;
- upload;
- copy URL;
- usage;
- safe retirement;
- Batch E notifications.

### F4 — Product integration

RED: no assignment/primary/gallery/alt/reorder/create selection.

GREEN:
- attach/select;
- first media primary behavior;
- set primary;
- alt;
- reorder;
- remove;
- Product creation integration;
- audit;
- route freshness.

### F5 — Public resolution

RED: public catalogue still resolves only legacy image.

GREEN:
- ProductMedia primary;
- legacy fallback;
- Vault fallback;
- gallery;
- alt;
- Home/Shop/detail/modal integration;
- lifecycle/cart/checkout regression green.

### F6 — Release

- full tests;
- TypeScript;
- ESLint;
- source verification;
- Prisma validate/generate;
- production build;
- migration SQL safety;
- protected financial/refund/download hashes;
- pnpm store healthy;
- clean tree;
- fresh origin check;
- production-safe migration deploy;
- one controlled push;
- Git-triggered Vercel;
- verify deployed SHA/live health.

## 28. Protected Phase 1 authorities

Batch F must not change business behavior in:

- checkout effective price authority;
- payment initialization;
- webhook settlement;
- Refund provider semantics;
- DownloadGrant;
- DownloadTicket;
- Worker authorization;
- private commercial ProductAsset upload/publish semantics;
- TEST/LIVE KPI isolation;
- Customer Vault entitlement authority.

Capture and recheck hashes throughout the batch.

## 29. ImageKit account preparation

Before F6 can be fully operational, configure locally and in Vercel Production:

```text
IMAGEKIT_PRIVATE_KEY
IMAGEKIT_PUBLIC_KEY
IMAGEKIT_URL_ENDPOINT
```

Do **not** send the private key through ChatGPT.

Prefer a restricted key granting only required media-management capability.

The executor may verify presence of required environment variables but must never print their values.

## 30. Execution policy

Starting baseline:

```text
8c3bd1a04069b77f1c480d2c123fc7d649c9d724
```

Rules:

- fail closed on baseline mismatch;
- fresh remote check;
- exact mutation allowlists;
- protected hashes;
- RED before GREEN;
- local checkpoint commits;
- no remote push until F6 is fully green;
- additive production migration only after complete local code gate;
- one final push;
- no manual Vercel CLI deployment;
- no broad reset that destroys completed checkpoints;
- preserve rollback ability;
- never claim production success without deployment evidence.

## 31. Explicitly out of scope

Batch F does not implement:

- sale pricing;
- discount percentage UI;
- Phase 3 pricing model;
- reviews/ratings;
- video hosting;
- SVG product media;
- arbitrary remote URL imports;
- AI image generation/background removal;
- physical ImageKit deletion;
- ProductAsset ZIP changes;
- payment/refund/download changes;
- new Admin roles.

## 32. Acceptance criteria

Batch F is complete only when:

1. ImageKit is the configured public merchandising provider.
2. Private commercial R2 remains unchanged.
3. `MediaAsset` and `ProductMedia` exist through an additive migration.
4. Legacy `Product.imagePath` remains intact.
5. Media Library supports upload, discovery, copy URL and safe retirement.
6. Product edit supports select/upload, primary, gallery, reorder, alt and remove.
7. Product create supports optional primary media.
8. Public image resolution is ProductMedia → legacy → fallback.
9. Gallery and alt text render correctly.
10. Retired media is not selectable or publicly resolved.
11. Provider metadata is server-verified before DB registration.
12. ImageKit private credentials never reach browser/Git/logs.
13. Existing lifecycle, checkout, payments, refunds and downloads remain green.
14. Full repository verification/build passes.
15. Production migration is applied safely.
16. Exactly one final push is made after all gates.
17. Git-triggered production deployment is verified by commit SHA.

## 33. Provider facts verified before design lock

Verified against current ImageKit documentation on 2026-10-01:

- the current Next.js integration supports direct browser upload using one-time `token`, `signature`, `expire` and `publicKey`;
- the private key remains server-side;
- `@imagekit/next/server` provides upload-auth generation for Next.js App Router;
- provider upload returns a `fileId`;
- provider file details expose file path, MIME, dimensions and size;
- DAM APIs support server-side file metadata lookup;
- private-key API calls use server-side HTTP Basic authentication;
- ImageKit supports URL-based real-time image transformations;
- ImageKit DAM can manage media independently of Vault's own ProductMedia authority.

These capabilities are implementation tools only. Octalve Vault remains authoritative for ProductMedia business state.


## 34. Audited security implementation refinements

The exact-baseline source audit tightened the implementation while preserving this approved design:

- upload authorization uses POST + existing same-origin Admin mutation enforcement;
- dual per-Admin grant limits are 20/hour and 60/day;
- ImageKit `checks` add MIME/size provider defense-in-depth, while Vault remains authoritative;
- provider metadata must be public, published, inside `/octalve-vault/products/`, within size/dimension/pixel limits, and match an independent magic-byte check;
- ProductMedia mutation IDs are product-scoped to defend against BOLA;
- Media Library pagination reuses Vault's shared 10/25/50/100 contract (default 25);
- retirement and removal use shared destructive-action confirmation;
- ImageKit Path Policy is optional only and is not required for Batch F because it is currently an Enterprise-only provider feature.
