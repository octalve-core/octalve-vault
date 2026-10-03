# Octalve Vault — Batch H Public Sale Presentation & Discovery Design

**Date:** 2026-10-03
**Status:** Design approved in conversation; written spec pending owner review
**Production baseline:** `d4612ea3b907c6f641df24aeeb7f954cd71c4b63`
**Predecessor:** Batch G — Sale Pricing Authority
**Next phase after completion:** Batch I — Admin Operations Completion

## 1. Purpose

Batch H makes Batch G sale pricing visible and discoverable to customers without weakening server authority.

Batch G already established the authoritative regular/sale price model, per-currency sale amounts, the effective-price resolver, coupon-after-sale ordering, immutable order snapshots, and protected settlement/download boundaries. Batch H does not redesign those authorities. It exposes them consistently across the public storefront and extends the existing URL/query-backed Shop discovery flow.

Success means:

- customers clearly see when a selected-currency product price is discounted;
- the regular price is crossed out, the sale/effective price is prominent, and the discount percentage is derived from authoritative amounts;
- Coming Soon products may show sale pricing without becoming purchasable;
- Shop can filter **On Sale** and sort by **effective price low-to-high / high-to-low**;
- sale discovery and price sorting follow the customer's selected currency;
- cart and checkout presentation use the same effective amount that checkout will price from the server;
- coupons remain eligible to discount sale prices further;
- no payment, settlement, order-snapshot, entitlement, download-grant, refund, private-asset, or environment authority is weakened.

## 2. Source-of-truth decisions carried forward

1. `ProductPrice.amountMinor` is the regular price.
2. `ProductPrice.saleAmountMinor` is nullable and per currency.
3. A valid sale must satisfy the Batch G effective-price resolver.
4. Discount percentage is derived; no independent manual percentage is stored.
5. Price order remains `regular → sale → eligible coupon → existing adjustments → final payable`.
6. Eligible coupons may further reduce a sale price.
7. DRAFT and ARCHIVED stay hidden publicly.
8. COMING_SOON is public but non-purchasable and may display pricing, including sale pricing.
9. ACTIVE remains purchasable only when existing lifecycle/readiness requirements pass.
10. Featured Coming Soon behavior remains unchanged.
11. Public Shop discovery remains URL/query-backed and server-driven.
12. Public Shop does not gain Admin-style date-range filters.
13. TEST/LIVE financial isolation remains untouched.

## 3. Scope

### In scope
- public pricing contract extension;
- reuse of Batch G `resolveEffectiveProductPrice`;
- selected-currency sale presentation;
- regular-price strike-through;
- prominent effective sale price;
- derived discount badge;
- sale presentation on product cards, detail modal, SEO detail, homepage featured cards, cart and checkout presentation;
- Shop **On Sale** filtering;
- Shop **Price: Low to High** and **Price: High to Low** sorting;
- selected-currency synchronization for currency-sensitive Shop discovery;
- EN/FR/AR strings and accessibility;
- focused regression tests and a Batch H release guard.

### Out of scope
- ProductPrice schema or migrations;
- manual discount percentage storage;
- coupon rule redesign;
- payment initialization/verification;
- provider adapters;
- settlement/refunds;
- Orders or OrderItems;
- entitlement/download authority;
- R2/private ZIP behavior;
- ImageKit/media authority;
- Admin-wide operations/filter rollout;
- Admin overview cards;
- public date-range filtering;
- currency conversion;
- relational Category model.

## 4. Architecture

Batch H has four public layers:

1. **Pricing authority** — existing Batch G `resolveEffectiveProductPrice`.
2. **Catalogue mapping** — maps active DB `ProductPrice` rows into safe public effective-price data.
3. **Discovery** — parses URL query state and applies lifecycle/search/category/availability/sort semantics on the server.
4. **Presentation** — product view model and shared public components render selected-currency pricing consistently.

The browser may choose currency and request discovery state, but it never decides whether a sale is valid, what the effective amount is, or what checkout will charge.

## 5. Public pricing contract

Current public code already consumes:

```ts
prices: Partial<Record<CurrencyCode, number>>
```

Batch H preserves this numeric map to avoid a broad compatibility break. Its meaning becomes:

```ts
prices[currency] === effectiveAmountMinor
```

Add a structured map:

```ts
export type PublicProductPrice = {
  regularAmountMinor: number;
  saleAmountMinor: number | null;
  effectiveAmountMinor: number;
  discountPercent: number | null;
  isOnSale: boolean;
};

export type PublicProduct = {
  // existing fields
  prices: Partial<Record<CurrencyCode, number>>;
  priceDetails: Partial<Record<CurrencyCode, PublicProductPrice>>;
};
```

`prices` remains the compatibility/effective-amount source for current cart/checkout presentation. `priceDetails` is the richer sale metadata source.

### Invalid-price behavior

Batch G intentionally kept sale validation server-authoritative instead of adding a database CHECK constraint. Batch H must therefore never infer a sale merely from `saleAmountMinor !== null`.

Every active price row passes through `resolveEffectiveProductPrice`.

If a currency row cannot be resolved safely:
- omit that currency from `prices`;
- omit it from `priceDetails`;
- it cannot create an On Sale badge;
- it cannot contribute a numeric price-sort value;
- it cannot make the product purchasable in that currency.

Other valid currencies for the same product may still be exposed.

## 6. Product view model

Extend `ProductViewModel` while keeping compatibility fields:

```ts
type ProductViewModel = {
  // existing identity/lifecycle fields
  currency: CurrencyCode;

  amountMinor: number | null;          // effective amount alias
  formattedPrice: string | null;       // effective formatted alias

  regularAmountMinor: number | null;
  saleAmountMinor: number | null;
  effectiveAmountMinor: number | null;

  formattedRegularPrice: string | null;
  formattedEffectivePrice: string | null;

  discountPercent: number | null;
  isOnSale: boolean;

  purchaseAvailable: boolean;
};
```

Rules:
- `amountMinor` aliases `effectiveAmountMinor`;
- `formattedPrice` aliases `formattedEffectivePrice`;
- `purchaseAvailable` stays `product.purchasable && valid selected-currency price exists`;
- COMING_SOON may have `isOnSale=true` while remaining non-purchasable;
- no component calculates discount percentage itself;
- no missing-currency price is invented or converted.

## 7. Public sale presentation

When `isOnSale=false`:
- render the existing single effective price;
- no strike-through;
- no discount badge.

When `isOnSale=true`:
- render regular price with a secondary strike-through treatment;
- render effective sale price prominently;
- render a derived badge such as `20% OFF`.

The badge comes from `discountPercent`, never UI arithmetic.

The same hierarchy must be used on:
- ProductCard;
- ProductDetailModal;
- SEO ProductDetail;
- homepage Featured Products through the shared card boundary.

A small shared presentation component may be introduced if it reduces duplication.

### Coming Soon
- Coming Soon state stays visible;
- valid sale pricing may display;
- Add to Cart remains disabled/impossible;
- checkout remains impossible.

### Cart and checkout
`PublicProduct.prices[currency]` becomes the validated effective amount, so existing cart/checkout visible subtotals naturally follow the sale price.

Cart/checkout line items may also use `priceDetails` to show regular strike-through + effective price, but they must not add a second pricing calculation path.

Server quote/payment initialization remains authoritative. Coupon discount remains downstream and separately displayed.

## 8. Shop discovery

Preserve existing URL/query-backed:
- search;
- category;
- availability;
- sort;
- lifecycle boundaries.

Add:

```ts
currency: CurrencyCode | null
```

for currency-sensitive discovery.

### On Sale

Extend availability with:

```text
on-sale
```

Meaning: the product has a valid, active selected-currency price whose resolved `isOnSale` is true.

Examples:
- NGN sale, no USD sale → matches NGN On Sale, not USD On Sale.
- COMING_SOON with valid NGN sale → may match NGN On Sale, but remains non-purchasable.
- invalid sale row → never matches On Sale.

### Effective-price sorting

Add:

```text
price-asc
price-desc
```

Comparison key: validated selected-currency `effectiveAmountMinor`.

Rules:
- `price-asc`: lower effective price first;
- `price-desc`: higher effective price first;
- products without a valid selected-currency price sort after priced products in both directions;
- ties use a deterministic secondary key;
- regular products sort by regular amount;
- sale products sort by sale/effective amount.

### Server strategy

Do not add raw SQL solely for Batch H.

Existing DB queries keep lifecycle/search/category filtering. Currency-sensitive classification and effective-price ordering may be finalized in the server catalogue service using `resolveEffectiveProductPrice`.

Browser-side sorting/filtering is prohibited.

If public pagination is added later, global effective-price ordering must be reconsidered before pagination.

## 9. Selected-currency synchronization

The existing currency store remains global currency preference authority.

Batch H synchronizes Shop URL only where result membership/order depends on currency:

1. Selecting On Sale, `price-asc`, or `price-desc` writes current selected currency to the Shop URL.
2. Example: `/en/products?availability=on-sale&currency=NGN&sort=price-asc`.
3. Search/category/availability/sort state is preserved.
4. Changing global currency while a currency-sensitive Shop mode is active updates the URL and requests new server results.
5. Currency change never re-filters the current result set in the browser.
6. Non-price-sensitive default browsing may omit `currency`.

## 10. Lifecycle invariants

### DRAFT
Hidden everywhere public; non-purchasable.

### COMING_SOON
Visible in Shop/detail; may display valid regular/sale pricing; may match selected-currency On Sale; non-purchasable; appears in homepage featured only when `featured=true`.

### ACTIVE
Public under existing boundary; purchasable only when readiness and selected-currency price requirements pass. Sale presentation never bypasses asset readiness.

### ARCHIVED
Hidden publicly; non-purchasable.

## 11. Coupon and checkout invariants

Batch H must not modify:

```text
regular
→ sale/effective product price
→ eligible coupon
→ existing adjustments
→ final payable
```

A product sale badge communicates only the regular-to-sale reduction.

Example:
- regular ₦50,000;
- sale ₦40,000;
- badge `20% OFF`;
- eligible 10% coupon may later produce ₦36,000 at server-authoritative checkout.

The UI must not label the combined coupon effect as the product sale percentage.

## 12. i18n and accessibility

Add EN/FR/AR strings for:
- On Sale;
- Price: Low to High;
- Price: High to Low;
- discount badge wording as needed;
- accessibility labels if needed.

Requirements:
- strike-through is not the only indication of a sale;
- screen readers encounter both regular and sale amounts meaningfully;
- discount badge is readable text;
- ProductDetailModal keyboard/focus behavior stays unchanged;
- existing public target-size/focus expectations remain;
- Arabic RTL remains correct.

## 13. Expected implementation boundaries

Fresh source inspection must confirm the exact final allowlist. Expected files include a subset of:

### Pricing/catalogue
- `src/domain/product-pricing.ts` — normally consume/preserve;
- `src/features/store/catalogue/types.ts`;
- `src/features/store/catalogue/catalogue-index.ts`;
- `src/features/store/catalogue/catalogue-service.ts`.

### Product presentation
- `src/features/store/products/product-view-model.ts`;
- `src/features/store/products/product-card.tsx`;
- `src/features/store/products/product-detail-modal.tsx`;
- `src/features/store/products/product-detail.tsx`;
- optional shared price-display component.

### Shop discovery
- `src/features/store/products/shop-discovery-controls.tsx`;
- `src/features/store/products/product-grid.tsx`;
- `src/app/[locale]/products/page.tsx`.

### Cart/checkout presentation
Only if needed for consistent sale line-item presentation:
- `src/features/store/cart/cart-view.tsx`;
- `src/features/store/checkout/checkout-view.tsx`;
- responsive cart-summary components already consuming `ProductViewModel`.

### Messages/tests
- `src/i18n/messages.ts`;
- focused Batch H pricing/discovery tests;
- existing Shop/product/cart/checkout/lifecycle regressions;
- Batch H release-guard test.

## 14. Protected boundaries

Batch H release guards must ensure no unintended changes to:
- `src/server/payments/**`;
- payment provider adapters;
- settlement;
- refunds;
- order persistence/snapshots;
- entitlement/grant issuance;
- download ticket/service authority;
- R2/private storage;
- ProductAsset purchase-readiness semantics;
- ProductMedia/ImageKit authority except normal consumption;
- payment TEST/LIVE environment logic;
- Batch G production migration files.

If implementation reveals one of these must change, stop and reconsider the design before mutation.

## 15. TDD strategy

Every task follows RED → GREEN → regression.

Tests must prove at minimum:

### Public pricing mapping
- regular-only price resolves to effective regular price;
- valid sale exposes regular + sale + effective + derived percent;
- `prices[currency]` equals effective amount;
- invalid sale does not become public sale authority;
- missing selected-currency price is never invented.

### View model
- regular product keeps current display;
- sale product exposes strike-through metadata and effective formatted price;
- Coming Soon may be on sale but remains non-purchasable;
- ACTIVE still requires readiness + valid selected-currency price.

### Product UI
- card/modal/SEO detail display regular crossed out + effective sale + badge;
- no-sale product does not show fake sale UI;
- existing modal accessibility remains green.

### Discovery
- parser accepts `on-sale`;
- parser accepts `price-asc` / `price-desc`;
- parser accepts only supported currencies;
- On Sale follows selected currency;
- another-currency sale does not match;
- invalid sale does not match;
- price sort uses effective sale amount;
- no-price products sort last;
- existing search/category/Available Now/Coming Soon/Newest/Oldest/Title remain green;
- no public date-range fields are introduced.

### Currency synchronization
- On Sale/price sort navigation includes current currency;
- selected-currency changes update currency-sensitive URL/server results;
- search/category state remains;
- no browser-side product filtering returns.

### Cart/checkout
- visible base subtotal uses effective sale amount;
- server quote remains authoritative;
- coupon display stays downstream and separate;
- unavailable currency still blocks submission.

### Release guard
- Batch G effective-price authority still exists;
- protected payment/settlement/refund/download files remain unchanged;
- Batch H changes stay inside final allowlist.

## 16. Suggested task structure

1. H1 — baseline + protected authority manifest;
2. H2 — public effective-price contract;
3. H3 — sale-aware product view model and shared presentation;
4. H4 — On Sale discovery + selected-currency query semantics;
5. H5 — effective-price sorting;
6. H6 — cart/checkout public sale consistency;
7. H7 — i18n/accessibility/regression closure;
8. H8 — complete pre-push release gate.

Exact grouping may be refined in the implementation plan after fresh source inspection.

No push or production deployment occurs during H1–H8 pre-push work.

## 17. Verification and release gate

Before requesting push approval, require fresh evidence for:
- all focused Batch H tests;
- full test suite;
- Prisma generate if needed;
- TypeScript;
- ESLint;
- source verification;
- production build;
- protected-authority checks;
- exact Batch H mutation allowlist;
- clean Batch H worktree;
- clean main checkout;
- fresh `origin/main` still equal to the Batch G production baseline unless an explicitly reviewed external change occurred.

Only then request explicit production push approval.

Production deployment remains Git-triggered through the existing Vercel project.

## 18. Acceptance criteria

Batch H is complete only when:

1. Valid selected-currency sale renders regular strike-through, prominent effective price, and derived badge.
2. Another-currency sale does not mark the selected currency On Sale.
3. Coming Soon may show sale presentation but cannot enter cart/checkout.
4. Shop On Sale is URL/query-backed and server-resolved.
5. Price low/high sorts by selected-currency effective amount.
6. Missing/invalid selected-currency prices are never fabricated and sort after valid prices.
7. Cart/checkout visible base pricing follows effective sale amount.
8. Coupons remain server-authoritative and stack after sale.
9. Lifecycle, media, payment, environment, order, settlement, refund, entitlement, and download authority remain intact.
10. EN/FR/AR, RTL, and accessibility regressions remain green.
11. Full release gate passes before push approval.
12. Exact Git-triggered production deployment is verified after approved release.

## 19. Rationale

This design keeps Batch H narrow:

- Batch G remains the only effective-price validity authority.
- Public consumers receive validated pricing rather than reproducing pricing rules.
- The numeric `prices` map becomes an effective-price compatibility bridge, avoiding unnecessary cart/checkout rewrites.
- `priceDetails` carries richer sale metadata.
- Currency-sensitive discovery becomes deterministic/shareable without making URL state global currency authority.
- Effective-price sorting stays server-side without premature raw SQL.
- Invalid sale data fails closed instead of creating false discounts.
- Financial and fulfillment authority stays outside the public presentation layer.
