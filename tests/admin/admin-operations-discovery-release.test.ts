import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const root = process.cwd();
const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

const pages = [
  "products",
  "orders",
  "payments",
  "customers",
  "downloads",
  "marketing",
  "team",
  "audit",
] as const;

test("all major Admin resource pages expose summary plus server-backed discovery", () => {
  for (const pageName of pages) {
    const page = source(
      `src/app/admin/(protected)/${pageName}/page.tsx`,
    );

    assert.match(
      page,
      /Summary/,
      `${pageName} should render resource summary context`,
    );
    assert.match(
      page,
      /IndexControls|ProductIndexControls/,
      `${pageName} should render discovery controls`,
    );
    if (pageName === "products") {
      const productList = source(
        "src/features/admin/products/product-list.tsx",
      );
      assert.match(
        productList,
        /AdminIndexResults/,
        "products should delegate shared result/pagination presentation",
      );
    } else {
      assert.match(
        page,
        /AdminIndexResults/,
        `${pageName} should use shared result/pagination presentation`,
      );
    }
    assert.doesNotMatch(
      page,
      /@\/lib\/prisma/,
      `${pageName} page should not query Prisma directly`,
    );
    assert.doesNotMatch(
      page,
      /\.filter\(/,
      `${pageName} page should not filter a full dataset locally`,
    );
    assert.ok(
      page.split(/\r?\n/).length <= 90,
      `${pageName} page should remain composition-focused`,
    );
  }
});

test("Orders Payments and Downloads expose explicit environment discovery", () => {
  const controls = source(
    "src/features/admin/shared/admin-resource-controls.tsx",
  );

  for (const marker of [
    "OrderIndexControls",
    "PaymentIndexControls",
    "DownloadIndexControls",
    'name="environment"',
  ]) {
    assert.match(controls, new RegExp(marker));
  }

  const orders = source(
    "src/features/admin/orders/orders-table.tsx",
  );
  const payments = source(
    "src/features/admin/payments/payments-table.tsx",
  );
  const downloads = source(
    "src/features/admin/downloads/downloads-table.tsx",
  );

  assert.match(orders, /environment/);
  assert.match(payments, /environment/);
  assert.match(downloads, /environment/);
});

test("business summary services keep production KPIs LIVE-backed", () => {
  for (const relative of [
    "src/server/admin/orders-service.ts",
    "src/server/admin/payments-service.ts",
    "src/server/admin/downloads-service.ts",
    "src/server/admin/marketing-service.ts",
  ]) {
    assert.match(
      source(relative),
      /LIVE/,
      `${relative} should contain explicit LIVE qualification`,
    );
  }

  const customerService = source(
    "src/server/admin/customers-service.ts",
  );
  const customerIndex = source(
    "src/server/admin/customers-index.ts",
  );

  assert.match(
    customerService,
    /qualifyingCustomerOrderWhere/,
    "Customer service should delegate LIVE qualification to the typed customer index contract",
  );
  assert.match(
    customerIndex,
    /environment:\s*"LIVE"/,
    "Customer qualifying-order helper must require LIVE payment evidence",
  );
  assert.match(
    customerIndex,
    /status:\s*"SUCCEEDED"/,
    "Customer qualifying-order helper must require successful LIVE payment evidence",
  );
  assert.match(
    customerIndex,
    /"PAID",\s*"FULFILLED",\s*"PARTIALLY_FULFILLED"/,
    "Customer qualifying-order helper must keep the approved paid-order lifecycle boundary",
  );

  const marketing = source(
    "src/server/admin/marketing-service.ts",
  );
  assert.match(marketing, /liveCouponRedemptions/);
  assert.match(marketing, /liveAttributedOrders/);
});

test("legacy fixed-size Admin list functions are no longer resource-page authority", () => {
  const operations = source(
    "src/server/admin/operations-service.ts",
  );
  const promotions = source(
    "src/server/admin/promotions-service.ts",
  );

  for (const legacy of [
    "listAdminOrders",
    "listAdminPayments",
    "listAdminCustomers",
    "listAdminDownloads",
  ]) {
    assert.doesNotMatch(
      operations,
      new RegExp(`export async function ${legacy}`),
    );
  }

  assert.match(
    promotions,
    /export async function listMarketingPromotions/,
  );

  const marketingPage = source(
    "src/app/admin/(protected)/marketing/page.tsx",
  );
  assert.match(marketingPage, /listAdminMarketing/);
  assert.doesNotMatch(marketingPage, /listMarketingPromotions/);

  const promotionsRoute = source(
    "src/app/api/admin/promotions/route.ts",
  );
  assert.match(promotionsRoute, /listMarketingPromotions/);

  assert.match(
    operations,
    /export async function listAdminRefundableOrders/,
  );
  assert.match(
    operations,
    /export async function getDashboardData/,
  );
});

test("Product discovery contract remains present after Admin-wide rollout", () => {
  const controls = source(
    "src/features/admin/products/product-index-controls.tsx",
  );

  for (const name of [
    'name="q"',
    'name="status"',
    'name="category"',
    'name="featured"',
    'name="readiness"',
    'name="asset"',
    'name="currency"',
    'name="createdFrom"',
    'name="createdTo"',
    'name="updatedFrom"',
    'name="updatedTo"',
    'name="sort"',
    'name="pageSize"',
  ]) {
    assert.match(controls, new RegExp(name));
  }
});

test("refund revoke marketing team and audit authority surfaces remain present", () => {
  const paymentsPage = source(
    "src/app/admin/(protected)/payments/page.tsx",
  );
  const downloads = source(
    "src/features/admin/downloads/downloads-table.tsx",
  );
  const marketing = source(
    "src/features/admin/marketing/marketing-manager.tsx",
  );
  const team = source(
    "src/features/admin/team/team-manager.tsx",
  );
  const auditWriter = source(
    "src/server/admin/audit.ts",
  );

  assert.match(paymentsPage, /RefundPanel/);
  assert.match(downloads, /\/api\/admin\/downloads\/\$\{id\}\/revoke/);
  assert.match(marketing, /\/api\/admin\/promotions/);
  assert.match(team, /\/api\/admin\/team/);
  assert.match(auditWriter, /writeAdminAudit/);
});
