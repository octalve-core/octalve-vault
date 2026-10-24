import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import {
  getPublicProducts,
  listPublicProductCategories,
} from "@/features/store/catalogue/catalogue-service";
import { parsePublicCatalogueParams } from "@/features/store/catalogue/catalogue-index";
import type { PublicProduct } from "@/features/store/catalogue/types";
import { ProductGrid } from "@/features/store/products/product-grid";
import { StoreServiceUnavailable } from "@/features/store/resilience/store-service-unavailable";

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
  let result: { products: PublicProduct[]; categories: string[] } | null = null;

  try {
    const [products, categories] = await Promise.all([
      getPublicProducts(locale, input),
      listPublicProductCategories(),
    ]);
    result = { products, categories };
  } catch {
    // Shop stays visible but non-commercial until authoritative catalogue data returns.
  }

  if (!result) return <StoreServiceUnavailable locale={locale} />;

  return (
    <ProductGrid
      products={result.products}
      categories={result.categories}
      input={input}
      locale={locale}
    />
  );
}
