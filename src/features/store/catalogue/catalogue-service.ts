import type { CurrencyCode, Locale } from "@/domain/constants";
import { prisma } from "@/lib/prisma";
import type { PublicProduct } from "./types";

function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toPublicProduct(
  product: Awaited<ReturnType<typeof queryProducts>>[number],
  locale: Locale,
): PublicProduct {
  const translation =
    product.translations.find((item) => item.locale === locale) ??
    product.translations.find((item) => item.locale === "en");
  if (!translation) throw new Error(`Product ${product.id} has no usable translation.`);

  const prices: Partial<Record<CurrencyCode, number>> = {};
  for (const price of product.prices) {
    if (price.currency === "NGN" || price.currency === "USD" || price.currency === "GBP" || price.currency === "EUR") {
      prices[price.currency] = price.amountMinor;
    }
  }

  return {
    id: product.id,
    slug: product.slug,
    category: product.category,
    imagePath: product.imagePath,
    featured: product.featured,
    title: translation.title,
    shortDescription: translation.shortDescription,
    description: translation.description,
    businessBenefits: stringList(translation.businessBenefits),
    productivityBenefits: stringList(translation.productivityBenefits),
    prices,
  };
}

async function queryProducts() {
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      assets: { some: { status: "PUBLISHED" } },
    },
    include: {
      translations: true,
      prices: { where: { isActive: true } },
    },
    orderBy: [{ featured: "desc" }, { createdAt: "asc" }],
  });
}

export async function getPublicProducts(locale: Locale): Promise<PublicProduct[]> {
  const products = await queryProducts();
  return products.map((product) => toPublicProduct(product, locale));
}

export async function getPublicProductBySlug(locale: Locale, slug: string): Promise<PublicProduct | null> {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "ACTIVE",
      assets: { some: { status: "PUBLISHED" } },
    },
    include: { translations: true, prices: { where: { isActive: true } } },
  });
  if (!product) return null;
  return toPublicProduct(product as Awaited<ReturnType<typeof queryProducts>>[number], locale);
}
