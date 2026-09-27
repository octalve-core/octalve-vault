import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import type { PublicProduct } from "../catalogue/types";
import { ProductDetailActions } from "./product-detail-actions";

export function ProductDetail({ product, locale }: { product: PublicProduct; locale: Locale }) {
  const messages = getMessages(locale);
  const benefits = [...product.businessBenefits, ...product.productivityBenefits].slice(0, 8);

  return (
    <section className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-[1200px]">
        <Link
          href={localeHref(locale, "/products")}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#0064E0]"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          {translate(messages, "nav.shop")}
        </Link>

        <div className="mt-7 grid overflow-hidden rounded-[32px] border border-slate-200 bg-white lg:grid-cols-[minmax(0,1fr)_minmax(380px,.9fr)]">
          <div className="relative min-h-[360px] bg-slate-100 sm:min-h-[520px]">
            <Image
              src={product.imagePath ?? "/brand/vault-logo.png"}
              alt={product.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width:1024px) 100vw, 55vw"
            />
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#0064E0]">
              {product.category}
            </p>
            <h1 className="mt-3 text-4xl font-medium tracking-[-0.05em] text-slate-950 sm:text-5xl">
              {product.title}
            </h1>
            <p className="mt-5 text-base leading-8 text-slate-600">
              {product.description || product.shortDescription}
            </p>

            <ProductDetailActions product={product} locale={locale} />

            {benefits.length > 0 ? (
              <div className="mt-8 grid gap-3">
                {benefits.map((benefit) => (
                  <p key={benefit} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#0064E0]" aria-hidden="true" />
                    {benefit}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
