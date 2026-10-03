import type { Prisma } from "@prisma/client";

import { CURRENCIES, LOCALES, PRODUCT_STATUSES, type CurrencyCode, type Locale, type ProductStatus } from "../../domain/constants";
import { resolveEffectiveProductPrice } from "../../domain/product-pricing";
import { generateOpaqueToken } from "../../domain/random";
import { prisma } from "../../lib/prisma";
import { writeAdminAudit } from "./audit";
import {
  buildProductOrderBy,
  buildProductReadyWhere,
  buildProductWhere,
  productIndexActiveFilters,
  productIndexWindow,
  type ProductIndexInput,
  type ProductIndexResult,
} from "./products-index";
import { paginationMeta } from "./resource-index";

const adminProductInclude = {
  translations: true,
  prices: true,
  assets: { orderBy: { version: "desc" as const } },
} satisfies Prisma.ProductInclude;

export type AdminProductListItem = Prisma.ProductGetPayload<{
  include: typeof adminProductInclude;
}>;

function slug(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized) || normalized.length > 100) throw new Error("Invalid product slug.");
  return normalized;
}
function text(value: string, name: string, max = 180): string {
  const clean = value.trim();
  if (!clean || clean.length > max) throw new Error(`${name} is required and must be at most ${max} characters.`);
  return clean;
}
export function isProductStatus(value: string): value is ProductStatus { return (PRODUCT_STATUSES as readonly string[]).includes(value); }
export function isSupportedLocale(value: string): value is Locale { return (LOCALES as readonly string[]).includes(value); }
export function isSupportedCurrency(value: string): value is CurrencyCode { return (CURRENCIES as readonly string[]).includes(value); }

export async function listAdminProducts(
  input: ProductIndexInput,
): Promise<ProductIndexResult<AdminProductListItem>> {
  const where = buildProductWhere(input);
  const { skip, take } = productIndexWindow(input);
  const total = await prisma.product.count({ where });

  let items: AdminProductListItem[];
  if (input.sort === "title") {
    const titleRows = await prisma.productTranslation.findMany({
      where: { locale: "en", product: where },
      orderBy: [{ title: "asc" }, { productId: "asc" }],
      skip,
      take,
      select: { productId: true },
    });
    const ids = titleRows.map((row) => row.productId);
    const rows = ids.length
      ? await prisma.product.findMany({
          where: { id: { in: ids } },
          include: adminProductInclude,
        })
      : [];
    const byId = new Map(rows.map((row) => [row.id, row]));
    items = ids
      .map((id) => byId.get(id))
      .filter((row): row is AdminProductListItem => Boolean(row));
  } else {
    items = await prisma.product.findMany({
      where,
      include: adminProductInclude,
      orderBy: buildProductOrderBy(input),
      skip,
      take,
    });
  }

  return {
    items,
    meta: paginationMeta(input.page, input.pageSize, total),
    activeFilters: productIndexActiveFilters(input),
  };
}

export async function listAdminProductCategories(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category.trim()).filter(Boolean);
}

export type AdminProductSummary = {
  total: number;
  ready: number;
  comingSoon: number;
  needsAttention: number;
};

export async function getAdminProductSummary(): Promise<AdminProductSummary> {
  const readyWhere = buildProductReadyWhere();

  const [total, ready, comingSoon, needsAttention] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: readyWhere }),
    prisma.product.count({ where: { status: "COMING_SOON" } }),
    prisma.product.count({
      where: {
        OR: [
          { status: "DRAFT" },
          {
            AND: [
              { status: "ACTIVE" },
              { NOT: readyWhere },
            ],
          },
        ],
      },
    }),
  ]);

  return {
    total,
    ready,
    comingSoon,
    needsAttention,
  };
}

export async function getAdminProduct(id: string) {
  return prisma.product.findUnique({ where: { id }, include: { translations: true, prices: true, assets: { orderBy: { version: "desc" } } } });
}

export async function createAdminProduct(
  actorAdminId: string,
  input: { slug: string; title: string; category: string; primaryMediaAssetId?: string },
) {
  const id = `vp_${generateOpaqueToken(16).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)}`;
  const product = await prisma.$transaction(async (tx) => {
    const mediaAsset = input.primaryMediaAssetId
      ? await tx.mediaAsset.findUnique({
          where: { id: input.primaryMediaAssetId },
          select: { id: true, status: true },
        })
      : null;
    if (input.primaryMediaAssetId && (!mediaAsset || mediaAsset.status !== "READY")) {
      throw Object.assign(new Error("Selected product image is not available."), { code: "PRODUCT_MEDIA_INVALID" });
    }
    const created = await tx.product.create({
      data: {
        id,
        slug: slug(input.slug),
        category: text(input.category, "Category", 80),
        status: "DRAFT",
        translations: {
          create: {
            locale: "en",
            title: text(input.title, "Title"),
            shortDescription: text(input.title, "Short description"),
          },
        },
      },
      include: { translations: true, prices: true, assets: true },
    });
    if (mediaAsset) {
      const assignment = await tx.productMedia.create({
        data: { productId: id, mediaAssetId: mediaAsset.id, position: 0 },
      });
      await tx.product.update({ where: { id }, data: { primaryMediaId: assignment.id } });
    }
    return created;
  });
  await writeAdminAudit({
    actorAdminId,
    action: "PRODUCT_CREATED",
    entityType: "Product",
    entityId: product.id,
    metadata: { slug: product.slug, primaryMediaAssetId: input.primaryMediaAssetId ?? null },
  });
  return product;
}

export async function updateAdminProduct(actorAdminId: string, id: string, input: { slug?: string; category?: string; status?: string; featured?: boolean }) {
  const data: { slug?: string; category?: string; status?: ProductStatus; featured?: boolean } = {};
  if (input.slug !== undefined) data.slug = slug(input.slug);
  if (input.category !== undefined) data.category = text(input.category, "Category", 80);
  if (input.status !== undefined) { if (!isProductStatus(input.status)) throw new Error("Invalid product status."); data.status = input.status; }
  if (input.featured !== undefined) data.featured = input.featured;
  const product = await prisma.product.update({ where: { id }, data });
  await writeAdminAudit({ actorAdminId, action: "PRODUCT_UPDATED", entityType: "Product", entityId: id, metadata: data });
  return product;
}

export async function upsertProductTranslation(actorAdminId: string, id: string, input: { locale: string; title: string; shortDescription: string; description?: string | null }) {
  if (!isSupportedLocale(input.locale)) throw new Error("Unsupported locale.");
  const translation = await prisma.productTranslation.upsert({
    where: { productId_locale: { productId: id, locale: input.locale } },
    update: { title: text(input.title, "Title"), shortDescription: text(input.shortDescription, "Short description", 400), description: input.description?.trim() || null },
    create: { productId: id, locale: input.locale, title: text(input.title, "Title"), shortDescription: text(input.shortDescription, "Short description", 400), description: input.description?.trim() || null },
  });
  await writeAdminAudit({ actorAdminId, action: "PRODUCT_TRANSLATION_UPDATED", entityType: "Product", entityId: id, metadata: { locale: input.locale } });
  return translation;
}

export async function upsertProductPrice(actorAdminId: string, id: string, input: { currency: string; amountMinor: number; saleAmountMinor: number | null; isActive: boolean }) {
  if (!isSupportedCurrency(input.currency)) throw new Error("Unsupported currency.");
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor < 0) throw new Error("Price must be a non-negative integer in minor units.");
  resolveEffectiveProductPrice({ amountMinor: input.amountMinor, saleAmountMinor: input.saleAmountMinor });
  const price = await prisma.productPrice.upsert({
    where: { productId_currency: { productId: id, currency: input.currency } },
    update: { amountMinor: input.amountMinor, saleAmountMinor: input.saleAmountMinor, isActive: input.isActive },
    create: { productId: id, currency: input.currency, amountMinor: input.amountMinor, saleAmountMinor: input.saleAmountMinor, isActive: input.isActive },
  });
  await writeAdminAudit({ actorAdminId, action: "PRODUCT_PRICE_UPDATED", entityType: "Product", entityId: id, metadata: { currency: input.currency, amountMinor: input.amountMinor, saleAmountMinor: input.saleAmountMinor, isActive: input.isActive } });
  return price;
}

export async function publishProductAsset(actorAdminId: string, assetId: string) {
  const asset = await prisma.productAsset.findUnique({ where: { id: assetId } });
  if (!asset) throw new Error("Product asset not found.");
  if (asset.status !== "READY") throw new Error("Only verified READY assets can be published.");
  const now = new Date();
  const result = await prisma.$transaction(async (tx) => {
    await tx.productAsset.updateMany({ where: { productId: asset.productId, status: "PUBLISHED" }, data: { status: "RETIRED" } });
    return tx.productAsset.update({ where: { id: asset.id }, data: { status: "PUBLISHED", publishedAt: now } });
  });
  await writeAdminAudit({ actorAdminId, action: "PRODUCT_ASSET_PUBLISHED", entityType: "ProductAsset", entityId: asset.id, metadata: { productId: asset.productId, version: asset.version } });
  return result;
}
