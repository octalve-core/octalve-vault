import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import { getPublicProducts } from "@/features/store/catalogue/catalogue-service";
import { VaultFaq } from "@/features/store/home/sections/faq";
import { FeaturedProductsSection } from "@/features/store/home/sections/featured-products";
import { VaultHero } from "@/features/store/home/sections/hero";
import { ProductCategoriesSection } from "@/features/store/home/sections/product-categories";

export const dynamic = "force-dynamic";

export default async function VaultHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const products = await getPublicProducts(locale);
  const featuredProducts = products.filter((product) => product.featured).slice(0, 6);

  return (
    <>
      <VaultHero locale={locale} />
      <ProductCategoriesSection locale={locale} products={products} />
      <FeaturedProductsSection locale={locale} products={featuredProducts} />
      <VaultFaq locale={locale} />
    </>
  );
}
