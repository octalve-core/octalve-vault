import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import { getPublicProducts } from "@/features/store/catalogue/catalogue-service";
import { VaultFaq } from "@/features/store/home/sections/faq";
import { FeaturedProductsSection } from "@/features/store/home/sections/featured-products";
import { VaultHero } from "@/features/store/home/sections/hero";
import { ProductCategoriesSection } from "@/features/store/home/sections/product-categories";
import { StoreServiceUnavailable } from "@/features/store/resilience/store-service-unavailable";

export const dynamic = "force-dynamic";

export default async function VaultHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  let products: Awaited<ReturnType<typeof getPublicProducts>> | null = null;
  try {
    products = await getPublicProducts(locale);
  } catch {
    // Public shell remains available while authoritative catalogue data is unavailable.
  }

  if (!products) {
    return (
      <>
        <VaultHero locale={locale} />
        <StoreServiceUnavailable locale={locale} />
        <VaultFaq locale={locale} />
      </>
    );
  }

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
