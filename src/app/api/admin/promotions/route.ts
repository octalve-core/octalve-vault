import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import {
  createAffiliate,
  createCoupon,
  listMarketingPromotions,
  setAffiliateActive,
  setCouponActive,
} from "@/server/admin/promotions-service";
import { requireAdminPermission } from "@/server/auth/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireAdminPermission(request, "marketing.read");
    return NextResponse.json(await listMarketingPromotions());
  } catch (error) {
    return adminError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminPermission(request, "marketing.write");
    const body = (await request.json()) as Record<string, unknown>;

    if (body.kind === "coupon") {
      if (
        typeof body.code !== "string" ||
        typeof body.name !== "string" ||
        (body.discountType !== "PERCENTAGE" && body.discountType !== "FIXED_AMOUNT")
      ) {
        throw new Error("Coupon code, name and discount type are required.");
      }
      const coupon = await createCoupon(auth.user.id, {
        code: body.code,
        name: body.name,
        discountType: body.discountType,
        percentageBps: optionalInteger(body.percentageBps),
        fixedAmountMinor: optionalInteger(body.fixedAmountMinor),
        currency: optionalString(body.currency),
        minimumSubtotal: optionalInteger(body.minimumSubtotal),
        maxRedemptions: optionalInteger(body.maxRedemptions),
        perEmailLimit: optionalInteger(body.perEmailLimit),
        startsAt: optionalString(body.startsAt),
        endsAt: optionalString(body.endsAt),
        productIds: optionalStringArray(body.productIds),
      });
      return NextResponse.json({ coupon }, { status: 201 });
    }

    if (body.kind === "affiliate") {
      if (typeof body.code !== "string" || typeof body.displayName !== "string") {
        throw new Error("Affiliate code and display name are required.");
      }
      const affiliate = await createAffiliate(auth.user.id, {
        code: body.code,
        displayName: body.displayName,
        email: optionalString(body.email),
        commissionBps: optionalInteger(body.commissionBps),
      });
      return NextResponse.json({ affiliate }, { status: 201 });
    }

    throw new Error("Unsupported marketing record type.");
  } catch (error) {
    return adminError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminPermission(request, "marketing.write");
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.id !== "string" || typeof body.active !== "boolean") {
      throw new Error("Record id and active state are required.");
    }

    if (body.kind === "coupon") {
      return NextResponse.json({
        coupon: await setCouponActive(auth.user.id, body.id, body.active),
      });
    }
    if (body.kind === "affiliate") {
      return NextResponse.json({
        affiliate: await setAffiliateActive(auth.user.id, body.id, body.active),
      });
    }
    throw new Error("Unsupported marketing record type.");
  } catch (error) {
    return adminError(error);
  }
}

function optionalString(value: unknown): string | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") throw new Error("Invalid string value.");
  return value;
}

function optionalInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    throw new Error("Invalid integer value.");
  }
  return value;
}

function optionalStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) {
    throw new Error("Invalid product list.");
  }
  return value as string[];
}
