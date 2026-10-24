import Link from "next/link";
import { CircleAlert } from "lucide-react";

import type { Locale } from "@/domain/constants";
import { localeHref } from "@/i18n/routing";

const COPY: Record<Locale, { eyebrow: string; title: string; body: string; support: string }> = {
  en: {
    eyebrow: "Vault status",
    title: "The store is temporarily unavailable.",
    body: "Our catalogue service is recovering. Browsing, checkout and account actions that require live data are paused so no incomplete transaction can be created.",
    support: "Contact Vault Support",
  },
  fr: {
    eyebrow: "État du Vault",
    title: "La boutique est temporairement indisponible.",
    body: "Notre service de catalogue est en cours de rétablissement. La navigation, le paiement et les actions de compte nécessitant des données en direct sont suspendus afin qu’aucune transaction incomplète ne soit créée.",
    support: "Contacter le support Vault",
  },
  ar: {
    eyebrow: "حالة Vault",
    title: "المتجر غير متاح مؤقتًا.",
    body: "نعمل على استعادة خدمة الكتالوج. تم إيقاف التصفح والدفع وإجراءات الحساب التي تحتاج إلى بيانات مباشرة مؤقتًا حتى لا يتم إنشاء أي معاملة غير مكتملة.",
    support: "تواصل مع دعم Vault",
  },
};

export function StoreServiceUnavailable({ locale }: { locale: Locale }) {
  const copy = COPY[locale];

  return (
    <section className="px-4 py-16 sm:px-6 md:py-20">
      <div className="mx-auto max-w-[900px] rounded-[32px] border border-amber-200 bg-amber-50 p-7 sm:p-10">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-800">
            <CircleAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-amber-800">{copy.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-slate-950 sm:text-4xl">{copy.title}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">{copy.body}</p>
            <Link
              href={localeHref(locale, "/contact")}
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#0064E0] px-5 text-sm font-medium text-white transition hover:bg-[#0057C2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/40 focus-visible:ring-offset-2"
            >
              {copy.support}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
