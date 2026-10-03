import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const BASELINE = "8db1f56712af972765800f7abe48b0b640836e5c";
const protectedManifest = [
  ["be30ff7dd2f8fc4bdd8597ee5535db10f8abd638", "src/features/store/cart/cart-store.ts"],
  ["0971eb6e56a92cd1045d4e338429cc6790513204", "src/features/store/cart/use-cart.ts"],
  ["0d68236794476dfbf704674182333c0ca2200fa5", "src/server/media/imagekit-config.ts"],
  ["99ffd44aa92501b32f77d078989ef5b0160abe0c", "src/server/media/imagekit-provider.ts"],
  ["8ff0a31b85e1a756e4a4335463528c84bc1a399b", "src/server/media/image-signature.ts"],
  ["ee6bea435296364375af400b5de4eff7d878fa06", "src/server/media/media-service.ts"],
  ["3071c8931a96b82fcad80000043a3b6dcfad8787", "src/server/media/media-validation.ts"],
  ["049a4e3494b1419ff275580e3b4041ee74c3f24e", "src/server/media/public-media.ts"],
  ["d7ad6064905fc36499e60a3c766554ce2fc1fcb5", "src/server/payments/checkout-service.ts"],
  ["da236e9a4983a5942ee65a7345f44a226a43f819", "src/server/payments/environment.ts"],
  ["1dcfe5da38c29ce91b85e8e1454e27f296d7408a", "src/server/payments/json.ts"],
  ["8f5a333c63543fc9532b8bd02f5cb539d40c9b0d", "src/server/payments/providers/flutterwave/adapter.ts"],
  ["53525267a280353a903403fa43863f562975cfef", "src/server/payments/providers/flutterwave/environment.ts"],
  ["e237bd94ff8d7128fe6755ecb59332de7a6b9f88", "src/server/payments/providers/flutterwave/signature.ts"],
  ["d0d4bb42732125d234bfcf7376e6d7f57ddc5ee5", "src/server/payments/providers/paystack/adapter.ts"],
  ["d1b28371949a3596e2233452b0c601d732b757eb", "src/server/payments/providers/paystack/environment.ts"],
  ["f5303ffda2c3dac06e157dbc917a816fff8b398b", "src/server/payments/providers/paystack/signature.ts"],
  ["bf86fcd6573e25740621a4123692924483827fd5", "src/server/payments/reference.ts"],
  ["e8626fa8567a7fc6ccd62fdc63c7d30ece8c0821", "src/server/payments/refund-status.ts"],
  ["da1432d934aec793ce83efa5d75fab1123681954", "src/server/payments/registry.ts"],
  ["fe4cc95fa8640c1259890827ad35b0bb57c9165b", "src/server/payments/registry-core.ts"],
  ["a2ea28480566bd16e9f13f35a4c5ed14a092f1a1", "src/server/payments/types.ts"],
  ["e1e750d5bcc0d777f81db205a685d21485a474ed", "src/server/payments/verification.ts"],
  ["b3ded2813ec75a0f23ce18fc4c719a3ec1776441", "src/server/payments/webhook-service.ts"],
  ["1dd4dc94a1919caf3eae9f657ac0da59c8e5c606", "src/server/refunds/refund-core.ts"],
  ["faaa5265bfc1918b03722e7f1569c90e8996211e", "src/server/refunds/refund-service.ts"],
  ["428114e5f6bab5cff6bf394e70243ed1056aa0c9", "src/server/storage/asset-upload-service.ts"],
  ["7fffe5112e1714512e04f145db2a9678ca335e1a", "src/server/storage/object-key.ts"],
  ["a8c86c7c7f19055c3b5b84bdca9db895e4a94b89", "src/server/storage/r2-config.ts"],
  ["80c9db459aacbe6959d7d060b004f4e2c9fcbaba", "src/server/storage/r2-presign.ts"],
  ["e82f1d8c9776adeb0fef31f3d74705e6a05e96fe", "src/server/vault/customer-access-core.ts"],
  ["9a2cfa16cecec752e02a53d6bf69e7032d964d06", "src/server/vault/customer-access-service.ts"],
  ["7376d1f2a573d9c7cdca9577594add71b172ef7c", "src/server/vault/download-ticket-core.ts"],
  ["fbf924d2986f88bdf83419ed7d04151fcbb8eb86", "src/server/vault/download-ticket-service.ts"],
  ["196ecf942014f11c19b1042c09c94ce51b91dbd2", "src/server/vault/settlement-core.ts"],
  ["5f46cf954c5e5b7e527b5bba67efa5afeaa48a91", "src/server/vault/settlement-service.ts"]
] as const;

function git(...args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    windowsHide: true,
  });
  assert.equal(
    result.status,
    0,
    `git ${args.join(" ")} failed: ${result.stderr || result.stdout}`,
  );
  return result.stdout.trim();
}

test("Batch G keeps every G1 protected authority Git blob unchanged", () => {
  assert.equal(protectedManifest.length, 36);
  for (const [expected, path] of protectedManifest) {
    assert.equal(git("rev-parse", `HEAD:${path}`), expected, path);
  }
});

test("checkout-pricing is the only changed file under server payments", () => {
  const changed = git(
    "diff",
    "--name-only",
    `${BASELINE}..HEAD`,
    "--",
    "src/server/payments",
  )
    .split(/\r?\n/)
    .filter(Boolean)
    .sort();

  assert.deepEqual(changed, ["src/server/payments/checkout-pricing.ts"]);
});

test("Batch G production changes stay inside the approved sale-pricing allowlist", () => {
  const changed = git("diff", "--name-only", `${BASELINE}..d4612ea3b907c6f641df24aeeb7f954cd71c4b63`)
    .split(/\r?\n/)
    .filter(Boolean);

  const exactAllowed = new Set([
    "prisma/schema.prisma",
    "src/domain/product-pricing.ts",
    "src/server/admin/products-service.ts",
    "src/app/api/admin/products/[id]/prices/route.ts",
    "src/features/admin/products/product-editor.tsx",
    "src/server/payments/checkout-pricing.ts",
    "tests/pricing/product-sale-schema.test.ts",
    "tests/pricing/effective-product-price.test.ts",
    "tests/admin/product-sale-price.test.ts",
    "tests/checkout/sale-pricing-checkout.test.ts",
    "tests/checkout/sale-pricing-order-snapshot.test.ts",
    "tests/release/batch-g-release.test.ts",
  ]);

  const unexpected = changed.filter((path) => {
    if (exactAllowed.has(path)) return false;
    return !/^prisma\/migrations\/[^/]*sale[^/]*pricing[^/]*\/migration\.sql$/i.test(path);
  });

  assert.deepEqual(unexpected, []);
  const saleMigrations = changed.filter((path) =>
    /^prisma\/migrations\/[^/]*sale[^/]*pricing[^/]*\/migration\.sql$/i.test(path),
  );
  assert.equal(saleMigrations.length, 1);
});

test("settlement and download value-grant authority remains protected", () => {
  const designCritical = [
    "src/server/vault/settlement-service.ts",
    "src/server/vault/download-ticket-service.ts",
    "src/server/refunds/refund-service.ts",
  ];

  for (const path of designCritical) {
    const entry = protectedManifest.find(([, protectedPath]) => protectedPath === path);
    assert.ok(entry, `${path} must be protected by the G1 manifest`);
    assert.equal(git("rev-parse", `HEAD:${path}`), entry[0]);
  }

  const settlement = readFileSync(
    new URL("../../src/server/vault/settlement-service.ts", import.meta.url),
    "utf8",
  );
  assert.match(settlement, /settleVerifiedPayment/);
  assert.match(settlement, /downloadGrant\.upsert/);
});
