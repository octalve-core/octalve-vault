import type { Prisma } from "@prisma/client";

import type { CurrencyCode, Locale } from "@/domain/constants";
import { prisma } from "@/lib/prisma";
import {
  buildPublicProductOrderBy,
  buildPublicProductWhere,
  parsePublicCatalogueParams,
  publicCatalogueBoundaryWhere,
  type PublicCatalogueIndexInput,
} from "./catalogue-index";
import type { PublicProduct } from "./types";

const publicProductInclude = {
  translations: true,
  prices: { where: { isActive: true } },
  assets: { where: { status: "PUBLISHED" }, select: { id: true }, take: 1 },
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

  const prices: Partial<Record<CurrencyCode, number>> = {};
  for (const price of product.prices) {
    if (
      price.currency === "NGN" ||
      price.currency === "USD" ||
      price.currency === "GBP" ||
      price.currency === "EUR"
    ) {
      prices[price.currency] = price.amountMinor;
    }
  }

  return {
    id: product.id,
    slug: product.slug,
    category: product.category,
    imagePath: product.imagePath,
    featured: product.featured,
    status: product.status,
    purchasable: product.status === "ACTIVE" && product.assets.length > 0,
    title: translation.title,
    shortDescription: translation.shortDescription,
    description: translation.description,
    businessBenefits: stringList(translation.businessBenefits),
    productivityBenefits: stringList(translation.productivityBenefits),
    prices,
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
    where: {
      slug,
      ...publicCatalogueBoundaryWhere(),
    },
    include: publicProductInclude,
  });
  if (!product) return null;
  return toPublicProduct(product, locale);
}
