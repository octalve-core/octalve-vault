import { NextResponse } from "next/server";
import { isLocale } from "@/config/locales";
import { authenticateCustomerRequest } from "@/server/auth/customer-session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await authenticateCustomerRequest(request);
  if (!session) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const url = new URL(request.url);
  const locale = isLocale(url.searchParams.get("locale") || "") ? (url.searchParams.get("locale") as "en" | "fr" | "ar") : "en";
  const now = new Date();
  const grants = await prisma.downloadGrant.findMany({
    where: {
      email: session.email,
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      orderItem: { order: { status: { in: ["PAID", "FULFILLED", "PARTIALLY_FULFILLED"] } } },
    },
    include: {
      productAsset: { select: { version: true, downloadFilename: true } },
      orderItem: {
        include: {
          order: { select: { reference: true, paidAt: true, createdAt: true } },
          product: { include: { translations: { where: { locale: { in: [locale, "en"] } } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({
    grants: grants.map((grant) => {
      const translation = grant.orderItem.product.translations.find((entry) => entry.locale === locale) ?? grant.orderItem.product.translations.find((entry) => entry.locale === "en");
      return {
        id: grant.id,
        productTitle: translation?.title ?? grant.orderItem.productTitle,
        orderReference: grant.orderItem.order.reference,
        purchasedAt: grant.orderItem.order.paidAt ?? grant.orderItem.order.createdAt,
        version: grant.productAsset.version,
        downloadFilename: grant.productAsset.downloadFilename,
        expiresAt: grant.expiresAt,
        downloadCount: grant.downloadCount,
      };
    }),
  }, { headers: { "cache-control": "no-store" } });
}
