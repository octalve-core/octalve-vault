import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CURRENCIES, type CurrencyCode } from "@/domain/constants";
import { isLocale } from "@/config/locales";
import { CheckoutView } from "@/features/store/checkout/checkout-view";
import { getPublicProducts } from "@/features/store/catalogue/catalogue-service";
import { getMessages } from "@/i18n/messages";
import { availablePaymentProviders } from "@/server/payments/registry";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const products = await getPublicProducts(locale);
  const messages = getMessages(locale);
  const providersByCurrency = Object.fromEntries(
    CURRENCIES.map((currency) => [
      currency,
      availablePaymentProviders(currency as CurrencyCode),
    ]),
  );

  return (
    <section className="px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-[1100px]">
        <p className="text-sm font-medium uppercase tracking-[0.16em] text-blue-600">
          {messages["checkout.eyebrow"]}
        </p>
        <h1 className="mt-4 text-4xl font-medium leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl">
          {messages["checkout.pageTitle"]}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
          {messages["checkout.pageBody"]}
        </p>
        <div className="mt-10">
          <CheckoutView
            products={products}
            locale={locale}
            providersByCurrency={providersByCurrency}
          />
        </div>
      </div>
    </section>
  );
}
