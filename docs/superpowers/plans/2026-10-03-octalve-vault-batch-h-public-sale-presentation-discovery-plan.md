# Batch H Public Sale Presentation & Discovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose Batch G sale pricing consistently across Octalve Vault public product surfaces, add selected-currency On Sale discovery and effective-price sorting, and preserve every existing checkout/payment/fulfillment authority boundary.

**Architecture:** Reuse Batch G `resolveEffectiveProductPrice` as the only sale-validity authority. Preserve `PublicProduct.prices[currency]` as a numeric compatibility map whose value becomes the validated effective amount, add `priceDetails` for regular/sale/discount metadata, then apply currency-sensitive sale filtering and effective-price sorting in the server catalogue layer after public rows are mapped. Public UI consumes the resulting view model; checkout/payment server code remains untouched.

**Tech Stack:** Next.js 16.3.6, React 19.2.3, TypeScript, Prisma 6.19.3, Node 22+, Tailwind CSS, Node test runner, ESLint.

**Spec:** `docs/superpowers/specs/2026-10-03-octalve-vault-batch-h-public-sale-presentation-discovery-design.md`

## Global Constraints

- Production baseline at Batch H start must be `d4612ea3b907c6f641df24aeeb7f954cd71c4b63`.
- Use a dedicated worktree/branch: `batch-h-public-sale-discovery`.
- No push or production deployment until the complete H8 pre-push gate passes and the owner explicitly approves push.
- `ProductPrice.amountMinor` remains regular price; `saleAmountMinor` remains nullable and per currency.
- `resolveEffectiveProductPrice` remains the only sale-validity/discount authority.
- `prices[currency]` remains numeric but becomes the validated effective amount.
- `priceDetails[currency]` carries regular/sale/effective/discount metadata.
- DRAFT/ARCHIVED remain hidden; COMING_SOON may show sale but remains non-purchasable; ACTIVE readiness rules remain unchanged.
- Sale filtering and price sorting follow the selected currency exactly.
- Missing/invalid currency prices are never converted, fabricated, or borrowed from another currency.
- Coupons remain downstream of sale pricing and may further reduce sale price.
- No public date-range filters.
- No schema/migration changes in Batch H.
- No changes under `src/server/payments/**`, settlement, refunds, entitlement/grants, download tickets/services, R2/private storage, payment environment logic, or Batch G migration files.
- Preserve existing ImageKit/ProductMedia presentation authority and ProductAsset purchase-readiness semantics.
- Preserve EN/FR/AR, Arabic RTL, keyboard/focus behavior, and existing public target-size/accessibility rules.
- Prefer direct local Node binaries for verification; do not require registry/network package installation.

## Review Focus

1. **Invalid sale row despite no DB CHECK:** an active price with `saleAmountMinor >= amountMinor`, non-positive sale, or unsafe integer must be omitted for that currency, never badged/sorted as a sale. Pinned in H2 tests.
2. **Currency-sensitive URL without a valid currency:** `availability=on-sale` with missing/invalid currency must fail closed; price sorting with missing/invalid currency must remain deterministic and must not invent a price. Pinned in H4/H5 tests.
3. **Sale exists only in another currency:** selected-currency On Sale must not match it; price sort must use selected-currency effective price only. Pinned in H4/H5 tests.
4. **Currency changes during live Shop discovery:** search/category/availability/sort state must survive while the server is re-requested for the new selected currency; browser-side filtering must not return. Pinned in H4/H5 UI tests.
5. **No-price products in both price-sort directions:** valid selected-currency prices always come first; no-price products sort last in both directions; ties are deterministic by product id. Pinned in H5 tests.

---

## File Structure

### New files expected
- `src/features/store/catalogue/public-product-price.ts` — pure public effective-price mapping and fail-closed row normalization.
- `src/features/store/catalogue/public-sale-discovery.ts` — pure selected-currency sale filter/effective-price sort helpers.
- `src/features/store/products/product-price-display.tsx` — shared accessible sale/regular price presentation.
- `tests/store/public-sale-pricing.test.ts` — H2 public pricing contract.
- `tests/store/public-sale-presentation.test.ts` — H3 view-model/UI contract.
- `tests/store/public-sale-discovery.test.ts` — H4/H5 filter/sort contract.
- `tests/store/cart-checkout-sale-presentation.test.ts` — H6 public cart/checkout consistency.
- `tests/store/batch-h-i18n-accessibility.test.ts` — H7 localization/accessibility guard.
- `tests/release/batch-h-release.test.ts` — H8 protected-boundary/allowlist guard.
- `tests/release/batch-h-protected-manifest.json` — baseline Git blob manifest for protected authority paths.

### Existing files expected to change
- `src/features/store/catalogue/types.ts`
- `src/features/store/catalogue/catalogue-index.ts`
- `src/features/store/catalogue/catalogue-service.ts`
- `src/features/store/products/product-view-model.ts`
- `src/features/store/products/product-card.tsx`
- `src/features/store/products/product-detail-modal.tsx`
- `src/features/store/products/product-detail.tsx`
- `src/features/store/products/shop-discovery-controls.tsx`
- `src/features/store/products/product-grid.tsx`
- `src/app/[locale]/products/page.tsx`
- `src/features/store/cart/cart-view.tsx` only if required by the current source shape
- `src/features/store/checkout/checkout-view.tsx`
- `src/i18n/messages.ts`

### Files expected to be consumed but not changed
- `src/domain/product-pricing.ts`
- `src/features/store/currency/use-currency.ts`
- `src/features/store/preferences/commerce-preferences.tsx`
- existing media/ImageKit public-resolution modules
- existing cart store/use-cart modules
- all server payment/settlement/refund/download authority files
- `prisma/schema.prisma`
- `prisma/migrations/20261002124000_product_sale_pricing/migration.sql`

---

### Task H1: Establish Batch H Baseline and Protected Authority Manifest

**Files:**
- Create worktree: `C:\Users\Bi Creativity\octalve-vault-worktrees\batch-h-public-sale-discovery`
- Create: `tests/release/batch-h-protected-manifest.json`
- Add/confirm: `docs/superpowers/specs/2026-10-03-octalve-vault-batch-h-public-sale-presentation-discovery-design.md`
- Add/confirm: `docs/superpowers/plans/2026-10-03-octalve-vault-batch-h-public-sale-presentation-discovery.md`

**Interfaces:**
- Consumes: production baseline SHA `d4612ea3b907c6f641df24aeeb7f954cd71c4b63`.
- Produces: clean isolated branch/worktree and a machine-readable baseline manifest H8 can verify.

- [ ] **Step 1: Verify main and origin baseline before creating the worktree**

Run from main checkout:

```powershell
git status --short
git branch --show-current
git fetch origin main
git rev-parse HEAD
git rev-parse origin/main
```

Expected:
- branch `main`;
- empty status;
- `HEAD == origin/main == d4612ea3b907c6f641df24aeeb7f954cd71c4b63`.

- [ ] **Step 2: Create the isolated Batch H worktree**

Use the `superpowers:using-git-worktrees` skill at execution time.

Required names:
- branch: `batch-h-public-sale-discovery`
- path: `C:\Users\Bi Creativity\octalve-vault-worktrees\batch-h-public-sale-discovery`
- base: exact Batch G production SHA.

Set worktree-only `core.autocrlf=false` if required to preserve byte-stable protected hashes; do not change main checkout Git config.

- [ ] **Step 3: Copy the approved spec and this plan into the repo docs paths**

Verify the files contain the exact approved baseline SHA and Batch H scope.

- [ ] **Step 4: Build the protected manifest**

Generate Git blob SHAs from the Batch G baseline for:
- `prisma/schema.prisma`;
- `prisma/migrations/20261002124000_product_sale_pricing/migration.sql`;
- `src/domain/product-pricing.ts`;
- every tracked file under `src/server/payments/`;
- settlement/refund authority under `src/server/vault/` and `src/server/refunds/`;
- private storage authority under `src/server/storage/`;
- existing cart store/use-cart modules;
- media/ImageKit authority files that Batch H only consumes;
- Admin sale mutation files from Batch G.

Write each record as `{ "path": "...", "blob": "<git-blob-sha>" }`.

- [ ] **Step 5: Verify baseline tests before feature mutation**

Run:

```powershell
node.exe --experimental-strip-types --test
node.exe node_modules\typescript\bin\tsc --noEmit
node.exe node_modules\eslint\bin\eslint.js . --ext .js,.jsx,.ts,.tsx
node.exe scripts\verify-source.mjs
```

Expected: all PASS.

If the new worktree's generated Prisma Client is stale, run:

```powershell
node.exe node_modules\prisma\build\index.js generate
```

then rerun typecheck. This must not change tracked files.

- [ ] **Step 6: Commit only docs + protected manifest**

```bash
git add docs/superpowers/specs/2026-10-03-octalve-vault-batch-h-public-sale-presentation-discovery-design.md docs/superpowers/plans/2026-10-03-octalve-vault-batch-h-public-sale-presentation-discovery.md tests/release/batch-h-protected-manifest.json
git commit -m "test: lock batch h public sale baseline"
```

Expected: one local commit; no push.

---

### Task H2: Expose Validated Public Effective-Price Contract

**Files:**
- Create: `src/features/store/catalogue/public-product-price.ts`
- Modify: `src/features/store/catalogue/types.ts`
- Modify: `src/features/store/catalogue/catalogue-service.ts`
- Create: `tests/store/public-sale-pricing.test.ts`

**Interfaces:**
- Consumes: `resolveEffectiveProductPrice(input: { amountMinor: number; saleAmountMinor?: number | null }): EffectiveProductPrice`.
- Produces:
  - `PublicProductPrice`;
  - `resolvePublicProductPrice(...)`;
  - `buildPublicPriceMaps(...)`;
  - `PublicProduct.prices[currency]` as effective amount;
  - `PublicProduct.priceDetails[currency]` as structured sale metadata.

- [ ] **Step 1: Write failing H2 tests**

Test names and assertions:

```ts
test("public regular price stays effective when no sale exists", ...)
```
Assert NGN 50_000/null yields:
- `regularAmountMinor=50_000`;
- `saleAmountMinor=null`;
- `effectiveAmountMinor=50_000`;
- `discountPercent=null`;
- `isOnSale=false`.

```ts
test("public sale price reuses Batch G effective-price authority", ...)
```
Assert NGN 50_000/40_000 yields:
- regular 50_000;
- sale/effective 40_000;
- discount 20;
- `isOnSale=true`;
- `prices.NGN === 40_000`;
- `priceDetails.NGN.effectiveAmountMinor === 40_000`.

```ts
test("invalid sale rows fail closed instead of becoming public price authority", ...)
```
For sale equal to regular, sale above regular, zero sale, negative sale, and unsafe integer:
- resolver/map returns no selected-currency public price;
- no `prices.NGN`;
- no `priceDetails.NGN`.

```ts
test("unsupported currency rows are ignored", ...)
```
Assert an unsupported currency never appears in either map.

- [ ] **Step 2: Run H2 tests and verify RED**

```powershell
node.exe --experimental-strip-types --test tests/store/public-sale-pricing.test.ts
```

Expected: FAIL because public price helper/type does not exist and catalogue mapping still exposes `amountMinor`.

- [ ] **Step 3: Add `PublicProductPrice` and `priceDetails`**

In `src/features/store/catalogue/types.ts` add exactly:

```ts
export type PublicProductPrice = {
  regularAmountMinor: number;
  saleAmountMinor: number | null;
  effectiveAmountMinor: number;
  discountPercent: number | null;
  isOnSale: boolean;
};
```

Extend `PublicProduct` with:

```ts
prices: Partial<Record<CurrencyCode, number>>;
priceDetails: Partial<Record<CurrencyCode, PublicProductPrice>>;
```

Do not change lifecycle/media fields.

- [ ] **Step 4: Implement the pure fail-closed mapping helper**

In `public-product-price.ts` expose:

```ts
export function resolvePublicProductPrice(input: {
  amountMinor: number;
  saleAmountMinor: number | null;
}): PublicProductPrice | null;

export function buildPublicPriceMaps(
  rows: readonly {
    currency: string;
    amountMinor: number;
    saleAmountMinor: number | null;
  }[],
): {
  prices: Partial<Record<CurrencyCode, number>>;
  priceDetails: Partial<Record<CurrencyCode, PublicProductPrice>>;
};
```

Requirements:
- call Batch G `resolveEffectiveProductPrice`;
- never reproduce its validation/percentage formula;
- catch invalid row resolution and omit only that currency;
- accept only supported `CurrencyCode` values;
- write `prices[currency] = effectiveAmountMinor`.

- [ ] **Step 5: Wire catalogue mapping to `buildPublicPriceMaps`**

In `catalogue-service.ts`:
- keep active-price DB inclusion;
- ensure `saleAmountMinor` is available from the Prisma price rows;
- replace direct `amountMinor` map construction with `buildPublicPriceMaps(product.prices)`;
- return both `prices` and `priceDetails`;
- preserve `purchasable` lifecycle semantics exactly.

- [ ] **Step 6: Run H2 GREEN + core lifecycle regression**

```powershell
node.exe --experimental-strip-types --test tests/store/public-sale-pricing.test.ts tests/pricing/effective-product-price.test.ts tests/store/product-lifecycle.test.ts
```

Expected: all PASS.

- [ ] **Step 7: Typecheck**

```powershell
node.exe node_modules\typescript\bin\tsc --noEmit
```

Expected: PASS.

- [ ] **Step 8: Commit H2**

```bash
git add src/features/store/catalogue/public-product-price.ts src/features/store/catalogue/types.ts src/features/store/catalogue/catalogue-service.ts tests/store/public-sale-pricing.test.ts
git commit -m "feat: expose public effective sale pricing"
```

---

### Task H3: Add Sale-Aware Product View Model and Shared Price Presentation

**Files:**
- Modify: `src/features/store/products/product-view-model.ts`
- Create: `src/features/store/products/product-price-display.tsx`
- Modify: `src/features/store/products/product-card.tsx`
- Modify: `src/features/store/products/product-detail-modal.tsx`
- Modify: `src/features/store/products/product-detail.tsx`
- Modify: `src/i18n/messages.ts`
- Create: `tests/store/public-sale-presentation.test.ts`

**Interfaces:**
- Consumes: `PublicProduct.priceDetails[currency]`.
- Produces:
  - extended `ProductViewModel`;
  - `ProductPriceDisplay({ view, compact? })`.

- [ ] **Step 1: Write failing view-model tests**

Create fixture products with explicit lifecycle and `priceDetails`.

Assert a valid NGN sale 50_000 → 40_000 yields:
- `amountMinor === 40_000`;
- `formattedPrice === formattedEffectivePrice`;
- regular/sale/effective fields;
- `formattedRegularPrice` and `formattedEffectivePrice`;
- `discountPercent === 20`;
- `isOnSale === true`.

Assert regular-only price:
- `isOnSale=false`;
- no formatted strike-through source needed.

Assert COMING_SOON sale:
- `isOnSale=true`;
- pricing is present;
- `purchaseAvailable=false`.

Assert missing selected-currency price:
- all selected-currency amount fields null;
- no invented fallback;
- `purchaseAvailable=false`.

- [ ] **Step 2: Write failing presentation source/behavior tests**

Assert:
- `ProductCard`, `ProductDetailModal`, and `ProductDetail` use `ProductPriceDisplay`;
- the shared price component exposes regular and effective semantic labels;
- sale rendering has a strike-through regular amount;
- sale rendering includes readable discount text;
- no-sale rendering does not produce a sale badge;
- Coming Soon action logic remains unchanged.

- [ ] **Step 3: Run H3 RED**

```powershell
node.exe --experimental-strip-types --test tests/store/public-sale-presentation.test.ts
```

Expected: FAIL on missing view-model fields/component.

- [ ] **Step 4: Extend `ProductViewModel`**

Add exact fields:

```ts
regularAmountMinor: number | null;
saleAmountMinor: number | null;
effectiveAmountMinor: number | null;
formattedRegularPrice: string | null;
formattedEffectivePrice: string | null;
discountPercent: number | null;
isOnSale: boolean;
```

Preserve:
- `amountMinor` as effective alias;
- `formattedPrice` as effective formatted alias;
- `purchaseAvailable = product.purchasable && selected-currency effective price exists`.

- [ ] **Step 5: Implement `ProductPriceDisplay`**

Signature:

```ts
export function ProductPriceDisplay({
  view,
  compact = false,
}: {
  view: ProductViewModel;
  compact?: boolean;
})
```

Requirements:
- no DB imports;
- no pricing arithmetic;
- regular-only renders one price;
- sale renders semantic regular price + `<s>` visual treatment, prominent effective price, and `${discountPercent}%` plus localized sale-off text;
- accessible text must communicate regular vs sale, not rely on strike-through/color alone.

- [ ] **Step 6: Add sale presentation message keys**

Add the exact concepts to EN/FR/AR in existing message dictionaries:
- regular price;
- sale price;
- sale discount/off badge.

Do not add a second translation framework.

- [ ] **Step 7: Replace duplicated price markup on card/modal/detail**

Use `ProductPriceDisplay`.
Do not change:
- ImageKit/media resolution;
- modal focus trap;
- Add to Cart lifecycle decisions;
- SEO route composition.

- [ ] **Step 8: Run H3 GREEN + UI regressions**

```powershell
node.exe --experimental-strip-types --test tests/store/public-sale-presentation.test.ts tests/store/product-octalve-ui.test.ts tests/store/product-media-ui.test.ts tests/store/product-lifecycle.test.ts
```

Expected: all PASS.

- [ ] **Step 9: Typecheck and lint touched public product files**

```powershell
node.exe node_modules\typescript\bin\tsc --noEmit
node.exe node_modules\eslint\bin\eslint.js src/features/store/products src/features/store/catalogue --ext .ts,.tsx
```

Expected: PASS.

- [ ] **Step 10: Commit H3**

```bash
git add src/features/store/products/product-view-model.ts src/features/store/products/product-price-display.tsx src/features/store/products/product-card.tsx src/features/store/products/product-detail-modal.tsx src/features/store/products/product-detail.tsx src/i18n/messages.ts tests/store/public-sale-presentation.test.ts
git commit -m "feat: present public product sale pricing"
```

---

### Task H4: Add Selected-Currency On Sale Discovery

**Files:**
- Modify: `src/features/store/catalogue/catalogue-index.ts`
- Create: `src/features/store/catalogue/public-sale-discovery.ts`
- Modify: `src/features/store/catalogue/catalogue-service.ts`
- Modify: `src/app/[locale]/products/page.tsx`
- Modify: `src/features/store/products/shop-discovery-controls.tsx`
- Modify: `src/features/store/products/product-grid.tsx` only if prop wiring is required
- Modify: `src/i18n/messages.ts`
- Create: `tests/store/public-sale-discovery.test.ts`
- Modify/regress: `tests/store/shop-discovery.test.ts`
- Modify/regress: `tests/store/shop-live-discovery.test.ts`

**Interfaces:**
- Consumes: `PublicProduct.priceDetails`, current `useCurrency()`, current query-backed Shop navigation.
- Produces:
  - availability union with `"on-sale"`;
  - `currency: CurrencyCode | null` on `PublicCatalogueIndexInput`;
  - `filterPublicProductsOnSale(products, currency)`.

- [ ] **Step 1: Write failing parser/filter tests**

Assert:
- existing availability values remain valid;
- `"on-sale"` parses;
- `currency=NGN|USD|GBP|EUR` parses;
- unsupported currency becomes `null`;
- no public `from`/`to` date fields appear.

Behavior fixtures:
- NGN sale / USD regular → matches NGN On Sale only;
- COMING_SOON NGN sale → matches NGN On Sale while `purchasable=false`;
- invalid/omitted public price detail → does not match;
- On Sale with `currency=null` returns no products.

- [ ] **Step 2: Write failing live-control tests**

Assert:
- On Sale appears in availability controls;
- selecting On Sale serializes `availability=on-sale&currency=<current>`;
- current q/category/sort values survive;
- changing `useCurrency()` while On Sale is active replaces/navigates the URL with the new currency;
- ProductGrid does not filter products in browser memory.

- [ ] **Step 3: Run H4 RED**

```powershell
node.exe --experimental-strip-types --test tests/store/public-sale-discovery.test.ts tests/store/shop-discovery.test.ts tests/store/shop-live-discovery.test.ts
```

Expected: FAIL because on-sale/currency semantics are absent.

- [ ] **Step 4: Extend catalogue input types/parser**

Preserve existing:
- sort `"featured" | "newest" | "oldest" | "title"`;
- availability `"available" | "coming" | null` (use exact current names from source).

Append:
- availability `"on-sale"`;
- `currency: CurrencyCode | null`.

Invalid currency normalizes to `null`.

`buildPublicProductWhere(input)` must not pretend that `saleAmountMinor != null` proves On Sale. For `on-sale`, retain the normal public lifecycle boundary and defer sale validity to the post-map filter.

- [ ] **Step 5: Implement pure selected-currency sale filter**

Signature:

```ts
export function filterPublicProductsOnSale(
  products: readonly PublicProduct[],
  currency: CurrencyCode | null,
): PublicProduct[];
```

Requirements:
- `currency=null` → `[]`;
- keep only products with `priceDetails[currency]?.isOnSale === true`;
- preserve incoming stable order.

- [ ] **Step 6: Apply filter in server catalogue service**

Sequence:
1. DB lifecycle/search/category candidate query;
2. map rows to `PublicProduct` using H2 price authority;
3. if `availability==="on-sale"`, apply `filterPublicProductsOnSale`;
4. return mapped/filter results.

Do not filter inside ProductGrid.

- [ ] **Step 7: Add Shop On Sale UI + selected-currency URL synchronization**

In `shop-discovery-controls.tsx`:
- reuse existing uncontrolled search/ref/debounce behavior;
- use `useCurrency()` only to serialize the selected currency and react to currency changes;
- preserve q/category/availability/sort;
- when On Sale is active, changing selected currency updates URL/server result;
- cancel pending search debounce before navigation exactly as existing category controls do.

- [ ] **Step 8: Add EN/FR/AR On Sale label**

Use existing messages system.

- [ ] **Step 9: Run H4 GREEN + lifecycle regression**

```powershell
node.exe --experimental-strip-types --test tests/store/public-sale-discovery.test.ts tests/store/shop-discovery.test.ts tests/store/shop-live-discovery.test.ts tests/store/product-lifecycle.test.ts tests/store/coming-soon-ui.test.ts
```

If the exact Coming Soon test filename differs, use the existing suite that proves “Coming Soon cards/details cannot add to cart.”

Expected: all PASS.

- [ ] **Step 10: Commit H4**

```bash
git add src/features/store/catalogue/catalogue-index.ts src/features/store/catalogue/public-sale-discovery.ts src/features/store/catalogue/catalogue-service.ts src/app/[locale]/products/page.tsx src/features/store/products/shop-discovery-controls.tsx src/features/store/products/product-grid.tsx src/i18n/messages.ts tests/store/public-sale-discovery.test.ts tests/store/shop-discovery.test.ts tests/store/shop-live-discovery.test.ts
git commit -m "feat: add selected-currency on-sale discovery"
```

---

### Task H5: Add Effective-Price Sorting

**Files:**
- Modify: `src/features/store/catalogue/catalogue-index.ts`
- Modify: `src/features/store/catalogue/public-sale-discovery.ts`
- Modify: `src/features/store/catalogue/catalogue-service.ts`
- Modify: `src/features/store/products/shop-discovery-controls.tsx`
- Modify: `src/i18n/messages.ts`
- Modify: `tests/store/public-sale-discovery.test.ts`
- Modify/regress: `tests/store/shop-live-discovery.test.ts`

**Interfaces:**
- Consumes: H4 `currency`, `PublicProduct.priceDetails`.
- Produces:
  - sort union values `"price-asc"` and `"price-desc"`;
  - `sortPublicProductsByEffectivePrice(...)`.

- [ ] **Step 1: Add failing price-sort tests**

For products:
- A NGN regular 50_000;
- B NGN regular 50_000 / sale 40_000;
- C NGN 30_000;
- D no NGN price;
- E NGN 40_000 tie.

Assert:
- `price-asc`: C(30k), B/E(40k deterministically by id), A(50k), D(no-price last);
- `price-desc`: A(50k), B/E(40k by id), C(30k), D(no-price last);
- another-currency sale does not alter NGN ordering;
- missing/invalid currency yields deterministic id ordering without invented amounts.

- [ ] **Step 2: Add failing parser/control tests**

Assert:
- parser accepts `price-asc`, `price-desc`;
- sort controls expose localized low/high labels;
- selecting either serializes selected currency;
- changing currency while price sort active updates URL;
- q/category/availability remain preserved.

- [ ] **Step 3: Run H5 RED**

```powershell
node.exe --experimental-strip-types --test tests/store/public-sale-discovery.test.ts tests/store/shop-live-discovery.test.ts
```

Expected: FAIL on absent sort values/helper/options.

- [ ] **Step 4: Extend sort union/parser**

Append exactly:
- `"price-asc"`;
- `"price-desc"`.

Preserve existing sort values and default `"featured"`.

`buildPublicProductOrderBy` must not invent a Prisma order for computed effective price. For price sorts, use a deterministic candidate DB order (e.g. id) and defer final ordering to server post-map logic.

- [ ] **Step 5: Implement effective-price sort helper**

Signature:

```ts
export function sortPublicProductsByEffectivePrice(
  products: readonly PublicProduct[],
  currency: CurrencyCode | null,
  direction: "asc" | "desc",
): PublicProduct[];
```

Requirements:
- copy before sorting; never mutate caller array;
- selected-currency `priceDetails[currency]?.effectiveAmountMinor` is the numeric key;
- priced products before unpriced in both directions;
- tie-break by `product.id.localeCompare`;
- `currency=null` produces deterministic id order and no fabricated price.

- [ ] **Step 6: Apply price sort after public row mapping/filtering**

Order of catalogue operations for price-sensitive requests:
1. DB lifecycle/search/category filtering;
2. map and validate public prices;
3. On Sale filter if requested;
4. effective-price sort if requested.

Existing title/featured/newest/oldest behavior remains unchanged.

- [ ] **Step 7: Add localized sort labels and live URL currency behavior**

Add EN/FR/AR:
- Price: Low to High;
- Price: High to Low.

When current sort is price-sensitive, selected currency must be present in URL and updated on currency changes.

- [ ] **Step 8: Run H5 GREEN + existing discovery regressions**

```powershell
node.exe --experimental-strip-types --test tests/store/public-sale-discovery.test.ts tests/store/shop-discovery.test.ts tests/store/shop-live-discovery.test.ts tests/store/product-octalve-ui.test.ts
```

Expected: all PASS.

- [ ] **Step 9: Commit H5**

```bash
git add src/features/store/catalogue/catalogue-index.ts src/features/store/catalogue/public-sale-discovery.ts src/features/store/catalogue/catalogue-service.ts src/features/store/products/shop-discovery-controls.tsx src/i18n/messages.ts tests/store/public-sale-discovery.test.ts tests/store/shop-live-discovery.test.ts
git commit -m "feat: sort shop by effective product price"
```

---

### Task H6: Keep Cart and Checkout Presentation Sale-Consistent

**Files:**
- Modify if current source requires: `src/features/store/cart/cart-view.tsx`
- Modify: `src/features/store/checkout/checkout-view.tsx`
- Reuse: `src/features/store/products/product-view-model.ts`
- Reuse: `src/features/store/products/product-price-display.tsx`
- Create: `tests/store/cart-checkout-sale-presentation.test.ts`

**Interfaces:**
- Consumes: `PublicProduct.prices[currency]` as effective amount and `priceDetails`.
- Produces: sale-consistent visible line items/subtotals while server quote/payment remains authoritative.

- [ ] **Step 1: Write failing cart/checkout presentation tests**

Assert:
- a sale fixture 50_000 → 40_000 renders/uses 40_000 as visible base amount;
- cart/checkout line item can show regular 50_000 crossed out and effective 40_000;
- visible subtotal before quote sums effective `prices[currency]`;
- active server quote subtotal/discount/total still overrides presentation fallback exactly as existing source does;
- coupon display remains separate from product sale badge;
- unavailable selected currency still blocks checkout;
- no import from `src/server/payments/**` is added to public components.

- [ ] **Step 2: Run H6 RED**

```powershell
node.exe --experimental-strip-types --test tests/store/cart-checkout-sale-presentation.test.ts
```

Expected: at least line-item sale presentation assertions FAIL; effective map assertions may already pass after H2 and should be recorded as regression evidence.

- [ ] **Step 3: Reuse shared price presentation in cart/checkout**

Do the smallest UI change:
- derive `ProductViewModel` for each selected product;
- use compact `ProductPriceDisplay` for line items;
- keep subtotal calculation based on `product.prices[currency]`;
- keep `activeQuote?.subtotalAmount ?? subtotal` and existing quote discount/total authority;
- do not touch server quote/payment code.

- [ ] **Step 4: Run H6 GREEN + cart/checkout regressions**

```powershell
node.exe --experimental-strip-types --test tests/store/cart-checkout-sale-presentation.test.ts tests/store/cart-octalve-ui.test.ts tests/checkout/sale-pricing-checkout.test.ts tests/checkout/sale-pricing-order-snapshot.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Verify protected server payments are untouched**

```powershell
git diff d4612ea3b907c6f641df24aeeb7f954cd71c4b63 -- src/server/payments
```

Expected: empty.

- [ ] **Step 6: Commit H6**

```bash
git add src/features/store/cart/cart-view.tsx src/features/store/checkout/checkout-view.tsx tests/store/cart-checkout-sale-presentation.test.ts
git commit -m "feat: show sale pricing through cart and checkout"
```

If `cart-view.tsx` required no mutation, omit it from `git add`.

---

### Task H7: Close i18n, Accessibility, Lifecycle, and Public Store Regressions

**Files:**
- Modify only if gaps remain: `src/i18n/messages.ts`
- Modify only if gaps remain: `src/features/store/products/product-price-display.tsx`
- Create: `tests/store/batch-h-i18n-accessibility.test.ts`
- Regress existing public-store tests.

**Interfaces:**
- Consumes: all H2–H6 public interfaces.
- Produces: complete EN/FR/AR accessibility/regression closure before release guard.

- [ ] **Step 1: Write H7 accessibility/i18n guard**

Assertions:
- all new keys exist in EN, FR, AR;
- no new sale/discovery UI hardcodes English labels outside message dictionaries;
- sale state exposes readable “regular” and “sale” semantics;
- `<s>`/strike-through is not the only sale cue;
- Arabic public shell remains RTL;
- ProductDetailModal focus management source remains present;
- public action target/focus regression suite remains intact.

- [ ] **Step 2: Run H7 RED or confirm already GREEN**

```powershell
node.exe --experimental-strip-types --test tests/store/batch-h-i18n-accessibility.test.ts
```

If GREEN immediately, record that H3–H5 already satisfied the acceptance criteria; do not manufacture a code change.

If RED, make only the minimal i18n/accessibility correction.

- [ ] **Step 3: Run the focused public regression matrix**

Run at minimum:

```powershell
node.exe --experimental-strip-types --test `
  tests/store/public-sale-pricing.test.ts `
  tests/store/public-sale-presentation.test.ts `
  tests/store/public-sale-discovery.test.ts `
  tests/store/cart-checkout-sale-presentation.test.ts `
  tests/store/product-lifecycle.test.ts `
  tests/store/product-octalve-ui.test.ts `
  tests/store/product-media-ui.test.ts `
  tests/store/shop-discovery.test.ts `
  tests/store/shop-live-discovery.test.ts `
  tests/store/cart-octalve-ui.test.ts `
  tests/checkout/sale-pricing-checkout.test.ts `
  tests/checkout/sale-pricing-order-snapshot.test.ts
```

Add the existing Coming Soon/home/RTL/accessibility suites by their exact current filenames discovered in H1.

Expected: all PASS.

- [ ] **Step 4: Run typecheck + lint**

```powershell
node.exe node_modules\typescript\bin\tsc --noEmit
node.exe node_modules\eslint\bin\eslint.js . --ext .js,.jsx,.ts,.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit H7**

If test-only:

```bash
git add tests/store/batch-h-i18n-accessibility.test.ts
git commit -m "test: close batch h public sale regressions"
```

If minimal i18n/accessibility code changed, include only those exact files.

---

### Task H8: Batch H Protected Release Guard and Complete Pre-Push Verification

**Files:**
- Create: `tests/release/batch-h-release.test.ts`
- Consume: `tests/release/batch-h-protected-manifest.json`

**Interfaces:**
- Consumes: production baseline SHA and final Batch H branch.
- Produces: fresh pre-push release evidence and exact release-candidate SHA.

- [ ] **Step 1: Write failing release-guard test**

Test cases:

```ts
test("Batch H keeps protected Batch G authority blobs unchanged", ...)
test("Batch H does not modify server payment or fulfillment authority", ...)
test("Batch H production changes stay inside approved public-sale allowlist", ...)
test("Batch H keeps schema and Batch G migration byte-stable", ...)
test("Batch H preserves the Batch G effective-price authority", ...)
```

The final allowlist must be built from actual H1–H7 committed paths, not guessed. It may contain only approved docs/tests and public catalogue/product/cart/checkout/i18n files.

- [ ] **Step 2: Run H8 RED**

```powershell
node.exe --experimental-strip-types --test tests/release/batch-h-release.test.ts
```

Expected: initial FAIL until final allowlist/protected-manifest logic is wired.

- [ ] **Step 3: Complete release guard without changing production behavior**

Implement only test/guard logic.

- [ ] **Step 4: Run H8 GREEN**

```powershell
node.exe --experimental-strip-types --test tests/release/batch-h-release.test.ts
```

Expected: all release-guard cases PASS.

- [ ] **Step 5: Run full test suite**

```powershell
node.exe --experimental-strip-types --test
```

Expected: 0 failures.

- [ ] **Step 6: Regenerate Prisma Client and validate schema**

```powershell
node.exe node_modules\prisma\build\index.js validate
node.exe node_modules\prisma\build\index.js generate
```

Use a temporary non-secret valid `DATABASE_URL` only if Prisma validate requires one; restore the process environment afterward. Do not write secrets.

Expected:
- schema valid;
- client generation PASS;
- no tracked file changes.

- [ ] **Step 7: Run full static/source verification**

```powershell
node.exe node_modules\typescript\bin\tsc --noEmit
node.exe node_modules\eslint\bin\eslint.js . --ext .js,.jsx,.ts,.tsx
node.exe scripts\verify-source.mjs
```

Expected: all PASS.

- [ ] **Step 8: Run production build locally**

Run local Prisma generate first, then existing production build path without changing Vercel configuration.

Preferred if pnpm is already healthy:

```powershell
pnpm build
```

If package-manager registry resolution is unreliable but dependencies are installed, run the equivalent local binaries:

```powershell
node.exe node_modules\prisma\build\index.js generate
node.exe node_modules\next\dist\bin\next build
```

Expected: production build PASS.

- [ ] **Step 9: Reconfirm protected hashes and exact mutation allowlist**

Verify:
- every H1 protected path still has the same Git blob SHA as baseline;
- `src/server/payments/**` diff is empty;
- settlement/refund/download/storage protected diffs are empty;
- `prisma/schema.prisma` unchanged;
- Batch G migration unchanged;
- every changed production file is explicitly in Batch H's final public allowlist.

- [ ] **Step 10: Verify worktree/main/remote safety**

Batch H worktree:
- branch `batch-h-public-sale-discovery`;
- clean;
- HEAD = final release candidate.

Main checkout:
- branch `main`;
- clean;
- HEAD still `d4612ea3b907c6f641df24aeeb7f954cd71c4b63`.

Fresh remote:

```powershell
git fetch origin main
git rev-parse origin/main
```

Expected:
- `origin/main == d4612ea3b907c6f641df24aeeb7f954cd71c4b63`.

If remote changed, STOP and review rather than rebasing/resetting automatically.

- [ ] **Step 11: Record final commit**

```bash
git add tests/release/batch-h-release.test.ts
git commit -m "test: verify batch h public sale boundaries"
```

Rerun H8 GREEN if the commit changes the allowlist calculation.

- [ ] **Step 12: Produce the pre-push release report**

Report must include:
- release-candidate SHA;
- commit list from Batch G baseline;
- focused test counts;
- full suite pass/fail count;
- typecheck/lint/source verification;
- Prisma validate/generate;
- production build;
- protected manifest count;
- changed-file allowlist;
- clean worktree/main;
- fresh origin/main baseline;
- explicit line: `NO PUSH / NO DEPLOY`;
- explicit line: `EXPLICIT USER APPROVAL REQUIRED BEFORE PUSH`.

Stop here. Do not push.

---

## Final Implementation Acceptance Checklist

Before H8 can request production approval, verify all are true:

- [ ] Valid selected-currency sales expose regular/sale/effective/discount metadata.
- [ ] `PublicProduct.prices[currency]` is the validated effective amount.
- [ ] Invalid sale rows fail closed per currency.
- [ ] Product card, modal, SEO detail, and featured cards share sale presentation.
- [ ] Coming Soon may display sale but remains non-purchasable.
- [ ] On Sale follows selected currency and is server-resolved.
- [ ] Another-currency sale does not match.
- [ ] Price asc/desc uses effective selected-currency amount.
- [ ] No-price products sort last in both directions.
- [ ] Currency-sensitive URL state updates when selected currency changes.
- [ ] No browser-side catalogue filtering/sorting is reintroduced.
- [ ] Cart/checkout visible base price/subtotal uses effective price.
- [ ] Server quote/coupon/payment authority remains untouched.
- [ ] EN/FR/AR and Arabic RTL remain green.
- [ ] Modal/accessibility regressions remain green.
- [ ] Schema and Batch G migration remain unchanged.
- [ ] Payment/settlement/refund/download/storage authority remains unchanged.
- [ ] Full tests/typecheck/lint/source/build all pass.
- [ ] Worktree and main are clean.
- [ ] Fresh `origin/main` still equals Batch G production baseline.
- [ ] No push/deploy occurred.
