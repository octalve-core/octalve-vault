import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import {
  getPublicProducts,
  listPublicProductCategories,
} from "@/features/store/catalogue/catalogue-service";
import { parsePublicCatalogueParams } from "@/features/store/catalogue/catalogue-index";
import { ProductGrid } from "@/features/store/products/product-grid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop" };

type SearchParams = Record<string, string | string[] | undefined>;

function toUrlSearchParams(values: SearchParams): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

export default async function ProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const input = parsePublicCatalogueParams(toUrlSearchParams(await searchParams));
  const [products, categories] = await Promise.all([
    getPublicProducts(locale, input),
    listPublicProductCategories(),
  ]);

  return (
    <ProductGrid
      products={products}
      categories={categories}
      input={input}
      locale={locale}
    />
  );
}
