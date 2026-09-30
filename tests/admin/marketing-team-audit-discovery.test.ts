import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import {
  parseMarketingIndexParams,
} from "../../src/server/admin/marketing-index.ts";
import {
  parseTeamIndexParams,
} from "../../src/server/admin/team-index.ts";
import {
  buildAuditWhere,
  parseAuditIndexParams,
} from "../../src/server/admin/audit-index.ts";

const root = process.cwd();
const source = (relative: string) =>
  readFileSync(resolve(root, relative), "utf8");

test("Marketing view parsing keeps coupon and affiliate discovery distinct", () => {
  const coupon = parseMarketingIndexParams(
    new URLSearchParams({
      view: "coupons",
      discountType: "PERCENTAGE",
      currency: "NGN",
    }),
  );
  const affiliate = parseMarketingIndexParams(
    new URLSearchParams({
      view: "affiliates",
      discountType: "PERCENTAGE",
      currency: "NGN",
    }),
  );

  assert.equal(coupon.view, "coupons");
  assert.equal(coupon.discountType, "PERCENTAGE");
  assert.equal(coupon.currency, "NGN");
  assert.equal(affiliate.view, "affiliates");
  assert.equal(affiliate.discountType, undefined);
  assert.equal(affiliate.currency, undefined);
});

test("Customer group ordering remains narrow enough for Prisma groupBy by-email validation", () => {
  const customers = source(
    "src/server/admin/customers-index.ts",
  );

  assert.match(customers, /customerGroupOrderBy/);
  assert.doesNotMatch(
    customers,
    /customerGroupOrderBy[\s\S]*?Prisma\.OrderOrderByWithAggregationInput\[\]/,
  );
  assert.match(customers, /createdAt:\s*"desc" as const/);
  assert.match(customers, /email:\s*"asc" as const/);
});

test("Marketing business summary uses LIVE payment evidence instead of raw order count", () => {
  const service = source(
    "src/server/admin/marketing-service.ts",
  );
  const mutations = source(
    "src/server/admin/promotions-service.ts",
  );

  assert.match(service, /liveCouponRedemptions/);
  assert.match(service, /liveAttributedOrders/);
  assert.match(service, /environment:\s*"LIVE"/);
  assert.match(
    mutations,
    /export async function listMarketingPromotions/,
  );
  assert.match(
    mutations,
    /export async function createCoupon/,
  );
  assert.match(
    mutations,
    /export async function setAffiliateActive/,
  );
});

test("Team parsing supports role, status and login-state filters", () => {
  const input = parseTeamIndexParams(
    new URLSearchParams({
      q: "admin",
      role: "AUDITOR",
      active: "false",
      loginState: "never",
    }),
  );

  assert.equal(input.role, "AUDITOR");
  assert.equal(input.active, false);
  assert.equal(input.loginState, "never");
});

test("Audit search excludes metadata JSON and supports human/system origin", () => {
  const input = parseAuditIndexParams(
    new URLSearchParams({
      q: "PRODUCT",
      origin: "human",
    }),
  );
  const serialized = JSON.stringify(
    buildAuditWhere(input),
  );

  assert.match(serialized, /action/);
  assert.match(serialized, /entityType/);
  assert.match(serialized, /entityId/);
  assert.match(serialized, /actor/);
  assert.doesNotMatch(serialized, /metadata/);
  assert.match(serialized, /actorAdminId/);
});

test("Marketing, Team and Audit pages are thin, summary-backed and paginated", () => {
  for (const relative of [
    "src/app/admin/(protected)/marketing/page.tsx",
    "src/app/admin/(protected)/team/page.tsx",
    "src/app/admin/(protected)/audit/page.tsx",
  ]) {
    const page = source(relative);
    assert.match(page, /AdminIndexResults/);
    assert.match(page, /IndexControls/);
    assert.match(page, /Summary/);
    assert.doesNotMatch(page, /@\/lib\/prisma/);
    assert.ok(
      page.split(/\r?\n/).length <= 90,
      `${relative} should remain composition-focused`,
    );
  }

  const marketingPage = source(
    "src/app/admin/(protected)/marketing/page.tsx",
  );
  assert.match(marketingPage, /listAdminMarketing/);
  assert.doesNotMatch(marketingPage, /listMarketingPromotions/);
});
