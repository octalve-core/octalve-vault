import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import { getPublicProducts } from "@/features/store/catalogue/catalogue-service";
import { CartView } from "@/features/store/cart/cart-view";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Cart", robots: { index: false, follow: false } };

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const products = await getPublicProducts(locale);
  return <CartView products={products} locale={locale} />;
}
