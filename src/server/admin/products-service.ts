import { CURRENCIES, LOCALES, PRODUCT_STATUSES, type CurrencyCode, type Locale, type ProductStatus } from "../../domain/constants";
import { generateOpaqueToken } from "../../domain/random";
import { prisma } from "../../lib/prisma";
import { writeAdminAudit } from "./audit";

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

export async function listAdminProducts() {
  return prisma.product.findMany({
    include: { translations: true, prices: true, assets: { orderBy: { version: "desc" } } },
    orderBy: [{ updatedAt: "desc" }],
  });
}

export async function getAdminProduct(id: string) {
  return prisma.product.findUnique({ where: { id }, include: { translations: true, prices: true, assets: { orderBy: { version: "desc" } } } });
}

export async function createAdminProduct(actorAdminId: string, input: { slug: string; title: string; category: string }) {
  const id = `vp_${generateOpaqueToken(10).toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)}`;
  const product = await prisma.product.create({
    data: {
      id,
      slug: slug(input.slug),
      category: text(input.category, "Category", 80),
      status: "DRAFT",
      translations: { create: { locale: "en", title: text(input.title, "Title"), shortDescription: text(input.title, "Short description") } },
    },
    include: { translations: true, prices: true, assets: true },
  });
  await writeAdminAudit({ actorAdminId, action: "PRODUCT_CREATED", entityType: "Product", entityId: product.id, metadata: { slug: product.slug } });
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

export async function upsertProductPrice(actorAdminId: string, id: string, input: { currency: string; amountMinor: number; isActive: boolean }) {
  if (!isSupportedCurrency(input.currency)) throw new Error("Unsupported currency.");
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor < 0) throw new Error("Price must be a non-negative integer in minor units.");
  const price = await prisma.productPrice.upsert({
    where: { productId_currency: { productId: id, currency: input.currency } },
    update: { amountMinor: input.amountMinor, isActive: input.isActive },
    create: { productId: id, currency: input.currency, amountMinor: input.amountMinor, isActive: input.isActive },
  });
  await writeAdminAudit({ actorAdminId, action: "PRODUCT_PRICE_UPDATED", entityType: "Product", entityId: id, metadata: { currency: input.currency, amountMinor: input.amountMinor, isActive: input.isActive } });
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
