import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import test from "node:test";

const root = process.cwd();

const BATCH_G_BASELINE =
  "d4612ea3b907c6f641df24aeeb7f954cd71c4b63";

const BATCH_H_H7 =
  "3055cf918bc28ace0386bf17a5c0aa6cf43579bc";

const APPROVED_H1_TO_H7 = [
  "docs/superpowers/plans/2026-10-03-octalve-vault-batch-h-public-sale-presentation-discovery-plan.md",
  "docs/superpowers/specs/2026-10-03-octalve-vault-batch-h-public-sale-presentation-discovery-design.md",
  "src/features/store/cart/cart-view.tsx",
  "src/features/store/catalogue/catalogue-index.ts",
  "src/features/store/catalogue/catalogue-service.ts",
  "src/features/store/catalogue/public-price-sort.ts",
  "src/features/store/catalogue/public-product-price.ts",
  "src/features/store/catalogue/public-sale-discovery.ts",
  "src/features/store/catalogue/types.ts",
  "src/features/store/checkout/checkout-view.tsx",
  "src/features/store/products/product-card.tsx",
  "src/features/store/products/product-detail-actions.tsx",
  "src/features/store/products/product-detail-modal.tsx",
  "src/features/store/products/product-price-display.tsx",
  "src/features/store/products/product-view-model.ts",
  "src/features/store/products/shop-discovery-controls.tsx",
  "src/i18n/messages.ts",
  "tests/release/batch-g-release.test.ts",
  "tests/release/batch-h-protected-manifest.json",
  "tests/store/cart-checkout-sale-presentation.test.ts",
  "tests/store/coming-soon-presentation.test.ts",
  "tests/store/public-effective-price-sort.test.ts",
  "tests/store/public-sale-accessibility-regression.test.ts",
  "tests/store/public-sale-discovery.test.ts",
  "tests/store/public-sale-presentation.test.ts",
  "tests/store/public-sale-pricing.test.ts"
] as const;

const PROTECTED_PATHS = [
  "prisma",
  "src/domain/product-pricing.ts",
  "src/features/store/cart/cart-store.ts",
  "src/features/store/cart/use-cart.ts",
  "src/server/payments",
  "src/server/refunds",
  "src/server/storage",
  "src/server/vault",
  "src/server/media"
] as const;

function git(args: string[]): string {
  return execFileSync("git", args, {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

function names(args: string[]): string[] {
  const output = git(args);

  if (!output) return [];

  return output
    .split(/\r?\n/)
    .map((value) => value.trim().replaceAll("\\", "/"))
    .filter(Boolean)
    .sort();
}

test("Batch H production history stays rooted at the approved Batch G release", () => {
  const result = spawnSync(
    "git",
    [
      "merge-base",
      "--is-ancestor",
      BATCH_G_BASELINE,
      BATCH_H_H7,
    ],
    {
      cwd: root,
      encoding: "utf8",
    },
  );

  assert.equal(result.status, 0);
});

test("Batch H H1-H7 changes stay inside the approved whole-batch allowlist", () => {
  const actual = names([
    "diff",
    "--name-only",
    BATCH_G_BASELINE,
    BATCH_H_H7,
  ]);

  assert.deepEqual(
    actual,
    [...APPROVED_H1_TO_H7].sort(),
  );
});

test("Batch H leaves protected pricing settlement delivery and media authority unchanged", () => {
  const changed = names([
    "diff",
    "--name-only",
    BATCH_G_BASELINE,
    BATCH_H_H7,
    "--",
    ...PROTECTED_PATHS,
  ]);

  assert.deepEqual(changed, []);
});

test("Batch H introduces no Prisma schema or migration changes", () => {
  const changed = names([
    "diff",
    "--name-only",
    BATCH_G_BASELINE,
    BATCH_H_H7,
    "--",
    "prisma",
  ]);

  assert.deepEqual(changed, []);
});
