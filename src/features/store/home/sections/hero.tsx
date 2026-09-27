import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

import type { Locale } from "@/domain/constants";
import { localeHref } from "@/i18n/routing";

type HeroCopy = {
  eyebrow: string;
  lead: string;
  accent: string;
  body: string;
  shop: string;
  faq: string;
  trust: readonly [string, string, string];
};

const HERO_COPY: Record<Locale, HeroCopy> = {
  en: {
    eyebrow: "Digital Products / Templates / Resources",
    lead: "Lock in with innovation and",
    accent: "growth assets.",
    body:
      "Octalve Vault gives founders, businesses, and teams practical digital resources they can purchase securely and access through their private Vault after verified payment.",
    shop: "Shop Now",
    faq: "Browse FAQs",
    trust: ["Secure checkout", "Private delivery", "Built for execution"],
  },
  fr: {
    eyebrow: "Produits numériques / Modèles / Ressources",
    lead: "Avancez avec des ressources",
    accent: "d’innovation et de croissance.",
    body:
      "Octalve Vault propose aux fondateurs, entreprises et équipes des ressources numériques pratiques, achetées en toute sécurité et accessibles dans leur Vault privé après vérification du paiement.",
    shop: "Voir la boutique",
    faq: "Voir les FAQ",
    trust: ["Paiement sécurisé", "Livraison privée", "Conçu pour l’exécution"],
  },
  ar: {
    eyebrow: "منتجات رقمية / قوالب / موارد",
    lead: "تقدّم بموارد للابتكار",
    accent: "والنمو.",
    body:
      "يوفّر Octalve Vault للمؤسسين والشركات والفرق موارد رقمية عملية يمكن شراؤها بأمان والوصول إليها عبر خزنتهم الخاصة بعد التحقق من الدفع.",
    shop: "تسوّق الآن",
    faq: "تصفح الأسئلة الشائعة",
    trust: ["دفع آمن", "تسليم خاص", "مصمم للتنفيذ"],
  },
};

function LogoOrb({
  src,
  alt,
  size = "large",
  className = "",
  logoWrapperClassName = "",
}: {
  src: string;
  alt: string;
  size?: "large" | "small";
  className?: string;
  logoWrapperClassName?: string;
}) {
  const orbSize =
    size === "large"
      ? "h-[270px] w-[270px] sm:h-[340px] sm:w-[340px] lg:h-[400px] lg:w-[400px]"
      : "h-[170px] w-[170px] sm:h-[210px] sm:w-[210px] lg:h-[250px] lg:w-[250px]";

  const innerCore =
    size === "large"
      ? "h-[180px] w-[180px] sm:h-[230px] sm:w-[230px] lg:h-[272px] lg:w-[272px]"
      : "h-[112px] w-[112px] sm:h-[138px] sm:w-[138px] lg:h-[166px] lg:w-[166px]";

  const logoBox =
    size === "large"
      ? "h-[92px] w-[92px] sm:h-[112px] sm:w-[112px] lg:h-[132px] lg:w-[132px]"
      : "h-[68px] w-[68px] sm:h-[82px] sm:w-[82px] lg:h-[98px] lg:w-[98px]";

  return (
    <div
      className={`absolute rounded-full ${orbSize} ${className}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(0,100,224,0.95) 0%, rgba(197,214,165,0.72) 52%, rgba(0,100,224,0.9) 100%)",
        boxShadow: "0 0 30px rgba(0,100,224,0.08)",
      }}
    >
      <div
        className="h-full w-full rounded-full p-[1.5px]"
        style={{
          background:
            "linear-gradient(135deg, rgba(0,100,224,0.88) 0%, rgba(197,214,165,0.56) 52%, rgba(0,100,224,0.88) 100%)",
        }}
      >
        <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#020304]">
          <div
            className={`absolute rounded-full ${innerCore} border border-white/12 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.06),rgba(255,255,255,0.02)_40%,rgba(0,0,0,0.32)_100%)] shadow-[0_24px_70px_rgba(0,0,0,0.45)]`}
          />
          <div
            className={`relative z-10 flex items-center justify-center rounded-full ${logoBox} ${logoWrapperClassName}`}
          >
            <div className="relative h-full w-full">
              <Image
                src={src}
                alt={alt}
                fill
                className="object-contain"
                sizes={size === "large" ? "146px" : "225px"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function VaultHero({ locale }: { locale: Locale }) {
  const copy = HERO_COPY[locale];

  return (
    <section className="relative overflow-hidden bg-[#040506] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <div className="absolute inset-0" aria-hidden="true">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 20% 24%, rgba(0,100,224,0.06) 0%, transparent 24%), radial-gradient(circle at 74% 20%, rgba(0,100,224,0.05) 0%, transparent 18%), linear-gradient(180deg, #050607 0%, #020304 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255,255,255,0.4) 0.7px, transparent 0.7px)",
            backgroundSize: "24px 24px",
            maskImage:
              "linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0.06))",
            WebkitMaskImage:
              "linear-gradient(to bottom, rgba(255,255,255,0.55), rgba(255,255,255,0.06))",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1280px]">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:gap-10">
          <div className="w-full text-center lg:text-left rtl:lg:text-right">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#6DA9FF]">
              {copy.eyebrow}
            </p>

            <h1 className="mt-4 text-5xl font-medium leading-[0.94] tracking-[-0.065em] text-white sm:text-6xl md:text-7xl lg:text-[5.55rem] xl:text-[6.15rem]">
              {copy.lead}{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, #E61525 0%, #FF5B66 24%, #9FC2FF 62%, #0064E0 100%)",
                }}
              >
                {copy.accent}
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-white/72 sm:text-lg lg:mx-0 rtl:lg:ml-0 rtl:lg:mr-0">
              {copy.body}
            </p>

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center lg:justify-start rtl:lg:justify-end">
              <Link
                href={localeHref(locale, "/products")}
                className="inline-flex min-h-[54px] items-center justify-center gap-2 bg-[#E61525] px-7 text-sm font-medium text-white shadow-[0_14px_34px_rgba(230,21,37,0.22)] transition hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {copy.shop}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </Link>

              <a
                href="#vault-faq"
                className="inline-flex min-h-[54px] items-center justify-center gap-2 border border-white/12 bg-[#0064E0] px-7 text-sm font-medium text-white shadow-[0_14px_34px_rgba(0,100,224,0.20)] transition hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {copy.faq}
                <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
              </a>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-white/58 lg:justify-start rtl:lg:justify-end">
              {copy.trust.map((item, index) => (
                <div key={item} className="contents">
                  {index > 0 ? <span className="h-1 w-1 rounded-full bg-white/30" aria-hidden="true" /> : null}
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[560px]">
            <div className="relative h-[390px] sm:h-[400px] lg:h-[500px]">
              <LogoOrb
                src="/brand/vault-logo.png"
                alt="Octalve Vault"
                size="large"
                className="left-1/2 top-[2%] z-10 -translate-x-[58%] sm:left-[2%] sm:translate-x-0 lg:left-[0%] rtl:sm:left-auto rtl:sm:right-[2%] rtl:lg:right-[0%]"
                logoWrapperClassName="h-[92px] w-[92px] sm:h-[116px] sm:w-[116px] lg:h-[146px] lg:w-[146px]"
              />

              <LogoOrb
                src="/brand/mx-logo.png"
                alt="MX partner"
                size="small"
                className="bottom-[1%] left-1/2 z-20 -translate-x-[2%] sm:left-auto sm:right-[1%] sm:translate-x-0 lg:right-[0%] rtl:sm:left-[1%] rtl:sm:right-auto rtl:lg:left-[0%]"
                logoWrapperClassName="h-[40px] w-[132px] sm:h-[50px] sm:w-[90px] lg:h-[64px] lg:w-[225px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
