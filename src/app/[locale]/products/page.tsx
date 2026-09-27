import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import { getPublicProducts } from "@/features/store/catalogue/catalogue-service";
import { ProductGrid } from "@/features/store/products/product-grid";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Shop" };

export default async function ProductsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const products = await getPublicProducts(locale);
  return <ProductGrid products={products} locale={locale} />;
}
