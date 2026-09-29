import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import type { PublicProduct } from "../../catalogue/types";
import { ProductCard } from "../../products/product-card";

export function FeaturedProductsSection({ locale, products }: { locale: Locale; products: PublicProduct[] }) {
  const messages = getMessages(locale);
  const featuredProducts = products.filter((product) => product.featured);
  if (featuredProducts.length === 0) return null;
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#E61525]">{translate(messages, "featured.eyebrow")}</p>
            <h2 className="mt-3 max-w-3xl text-3xl font-medium tracking-[-0.04em] text-slate-950 sm:text-4xl">{translate(messages, "featured.title")}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{translate(messages, "featured.body")}</p>
          </div>
          <Link href={localeHref(locale, "/products")} className="inline-flex items-center gap-2 text-sm font-medium text-slate-950 hover:text-[#0064E0]">{translate(messages, "featured.all")} <ArrowRight className="h-4 w-4" /></Link>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {featuredProducts.slice(0, 6).map((product) => <ProductCard key={product.id} product={product} locale={locale} />)}
        </div>
      </div>
    </section>
  );
}
