import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  buildOrderWhere,
  parseOrderIndexParams,
} from "../../src/server/admin/orders-index.ts";
import {
  buildPaymentWhere,
  parsePaymentIndexParams,
} from "../../src/server/admin/payments-index.ts";

const root = process.cwd();
const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

test("Orders parse validated filters and translate search to database relations", () => {
  const input = parseOrderIndexParams(
    new URLSearchParams({
      q: "alpha",
      status: "PAID",
      environment: "LIVE",
      provider: "PAYSTACK",
      currency: "NGN",
      page: "2",
      pageSize: "25",
    }),
  );

  assert.equal(input.status, "PAID");
  assert.equal(input.environment, "LIVE");
  assert.equal(input.provider, "PAYSTACK");
  assert.equal(input.currency, "NGN");
  assert.equal(input.page, 2);

  const serialized = JSON.stringify(buildOrderWhere(input));
  assert.match(serialized, /productTitle/);
  assert.match(serialized, /productSlug/);
  assert.match(serialized, /environment/);
  assert.match(serialized, /provider/);

  assert.throws(
    () =>
      parseOrderIndexParams(
        new URLSearchParams({
          environment: "STAGING",
        }),
      ),
    /Invalid payment environment filter/,
  );
});

test("Payments search provider and order identity and keeps TEST/LIVE explicit", () => {
  const input = parsePaymentIndexParams(
    new URLSearchParams({
      q: "ref",
      environment: "TEST",
      status: "PROCESSING",
    }),
  );

  const serialized = JSON.stringify(
    buildPaymentWhere(input),
  );
  assert.match(serialized, /providerReference/);
  assert.match(serialized, /providerTxId/);
  assert.match(serialized, /reference/);
  assert.match(serialized, /email/);
  assert.match(serialized, /TEST/);
});

test("Order and Payment services paginate in Prisma and summary cards are LIVE-backed", () => {
  const orders = source(
    "src/server/admin/orders-service.ts",
  );
  const payments = source(
    "src/server/admin/payments-service.ts",
  );
  const operations = source(
    "src/server/admin/operations-service.ts",
  );

  assert.match(orders, /skip,\s*take/);
  assert.match(payments, /skip,\s*take/);
  assert.match(orders, /environment:\s*"LIVE"/);
  assert.match(payments, /environment:\s*"LIVE"/);
  assert.doesNotMatch(
    operations,
    /export async function listAdminOrders/,
  );
  assert.doesNotMatch(
    operations,
    /export async function listAdminPayments/,
  );
  assert.match(
    operations,
    /export async function listAdminRefundableOrders/,
  );
});

test("Orders and Payments routes compose summary, filters and shared pagination", () => {
  for (const relative of [
    "src/app/admin/(protected)/orders/page.tsx",
    "src/app/admin/(protected)/payments/page.tsx",
  ]) {
    const page = source(relative);
    assert.match(page, /AdminIndexResults/);
    assert.match(page, /IndexControls/);
    assert.match(page, /Summary/);
    assert.ok(
      page.split(/\r?\n/).length <= 90,
      `${relative} should remain composition-focused`,
    );
  }

  const paymentsPage = source(
    "src/app/admin/(protected)/payments/page.tsx",
  );
  assert.match(paymentsPage, /RefundPanel/);
  assert.match(
    paymentsPage,
    /listAdminRefundableOrders/,
  );
});
