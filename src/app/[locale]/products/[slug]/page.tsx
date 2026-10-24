import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/config/locales";
import { getPublicProductBySlug } from "@/features/store/catalogue/catalogue-service";
import { ProductDetail } from "@/features/store/products/product-detail";
import { StoreServiceUnavailable } from "@/features/store/resilience/store-service-unavailable";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  try {
    const product = await getPublicProductBySlug(locale, slug);
    if (!product) return {};
    return {
      title: product.title,
      description: product.shortDescription,
      alternates: {
        canonical: `/${locale}/products/${slug}`,
        languages: { en: `/en/products/${slug}`, fr: `/fr/products/${slug}`, ar: `/ar/products/${slug}` },
      },
      openGraph: { title: product.title, description: product.shortDescription, type: "website" },
    };
  } catch {
    return {};
  }
}

export default async function ProductPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();

  try {
    const product = await getPublicProductBySlug(locale, slug);
    if (!product) notFound();
    return <ProductDetail product={product} locale={locale} />;
  } catch {
    return <StoreServiceUnavailable locale={locale} />;
  }
}
