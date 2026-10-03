import type { Prisma } from "@prisma/client";

import type { Locale } from "@/domain/constants";
import { prisma } from "@/lib/prisma";
import { resolvePublicProductMedia } from "@/server/media/public-media";
import {
  buildPublicProductOrderBy,
  buildPublicProductWhere,
  parsePublicCatalogueParams,
  publicCatalogueBoundaryWhere,
  type PublicCatalogueIndexInput,
} from "./catalogue-index";
import { buildPublicPriceMaps } from "./public-product-price";
import type { PublicProduct } from "./types";

const publicProductInclude = {
  translations: true,
  prices: { where: { isActive: true } },
  assets: { where: { status: "PUBLISHED" }, select: { id: true }, take: 1 },
  primaryMedia: {
    include: {
      mediaAsset: { select: { providerFilePath: true, status: true } },
    },
  },
  media: {
    orderBy: [{ position: "asc" as const }, { id: "asc" as const }],
    include: {
      mediaAsset: { select: { providerFilePath: true, status: true } },
    },
  },
} satisfies Prisma.ProductInclude;

type PublicProductRow = Prisma.ProductGetPayload<{
  include: typeof publicProductInclude;
}>;

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function translationFor(product: PublicProductRow, locale: Locale) {
  return (
    product.translations.find((item) => item.locale === locale) ??
    product.translations.find((item) => item.locale === "en")
  );
}

function toPublicProduct(product: PublicProductRow, locale: Locale): PublicProduct {
  const translation = translationFor(product, locale);
  if (!translation) throw new Error(`Product ${product.id} has no usable translation.`);

  const { prices, priceDetails } = buildPublicPriceMaps(product.prices);

  const media = resolvePublicProductMedia({
    title: translation.title,
    legacyImagePath: product.imagePath,
    primary: product.primaryMedia
      ? {
          id: product.primaryMedia.id,
          altText: product.primaryMedia.altText,
          position: product.primaryMedia.position,
          mediaAsset: product.primaryMedia.mediaAsset,
        }
      : null,
    gallery: product.media.map((item) => ({
      id: item.id,
      altText: item.altText,
      position: item.position,
      mediaAsset: item.mediaAsset,
    })),
  });

  return {
    id: product.id,
    slug: product.slug,
    category: product.category,
    imagePath: media.imagePath,
    cardImagePath: media.cardImagePath,
    imageAlt: media.imageAlt,
    gallery: media.gallery,
    featured: product.featured,
    status: product.status,
    purchasable: product.status === "ACTIVE" && product.assets.length > 0,
    title: translation.title,
    shortDescription: translation.shortDescription,
    description: translation.description,
    businessBenefits: stringList(translation.businessBenefits),
    productivityBenefits: stringList(translation.productivityBenefits),
    prices,
    priceDetails,
  };
}

async function queryProducts(
  locale: Locale,
  input: PublicCatalogueIndexInput,
): Promise<PublicProductRow[]> {
  const where = buildPublicProductWhere(input);
  const rows = await prisma.product.findMany({
    where,
    include: publicProductInclude,
    orderBy:
      input.sort === "title"
        ? [{ id: "asc" }]
        : buildPublicProductOrderBy(input),
  });
  if (input.sort === "title") {
    rows.sort((left, right) => {
      const leftTitle = translationFor(left, locale)?.title ?? "";
      const rightTitle = translationFor(right, locale)?.title ?? "";
      return leftTitle.localeCompare(rightTitle, locale) || left.id.localeCompare(right.id);
    });
  }
  return rows;
}

export async function getPublicProducts(
  locale: Locale,
  input: PublicCatalogueIndexInput = parsePublicCatalogueParams(new URLSearchParams()),
): Promise<PublicProduct[]> {
  const products = await queryProducts(locale, input);
  return products.map((product) => toPublicProduct(product, locale));
}

export async function listPublicProductCategories(): Promise<string[]> {
  const rows = await prisma.product.findMany({
    where: publicCatalogueBoundaryWhere(),
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  return rows.map((row) => row.category.trim()).filter(Boolean);
}

export async function getPublicProductBySlug(
  locale: Locale,
  slug: string,
): Promise<PublicProduct | null> {
  const product = await prisma.product.findFirst({
    where: { slug, ...publicCatalogueBoundaryWhere() },
    include: publicProductInclude,
  });
  if (!product) return null;
  return toPublicProduct(product, locale);
}
