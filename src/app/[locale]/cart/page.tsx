import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import { getPublicProducts } from "@/features/store/catalogue/catalogue-service";
import { CartView } from "@/features/store/cart/cart-view";
import { StoreServiceUnavailable } from "@/features/store/resilience/store-service-unavailable";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  let products: Awaited<ReturnType<typeof getPublicProducts>> | null = null;
  try {
    products = await getPublicProducts(locale);
  } catch {
    // Cart stays fail-closed until authoritative catalogue data is available.
  }

  if (!products) return <StoreServiceUnavailable locale={locale} />;
  return <CartView products={products} locale={locale} />;
}
