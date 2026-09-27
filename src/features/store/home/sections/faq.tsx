"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

import type { Locale } from "@/domain/constants";

type FaqItem = {
  question: string;
  answer: string;
};

type FaqCopy = {
  eyebrow: string;
  title: string;
  body: string;
  items: readonly FaqItem[];
};

const FAQ_COPY: Record<Locale, FaqCopy> = {
  en: {
    eyebrow: "Help Center",
    title: "Frequently Asked Questions",
    body: "Practical answers about buying, payment verification, secure access, refunds, and support on Octalve Vault.",
    items: [
      {
        question: "What kind of products can I buy on Octalve Vault?",
        answer:
          "Vault publishes practical digital resources such as templates, guides, launch assets, business tools, and other downloadable products. The live catalogue is the source of what is currently available.",
      },
      {
        question: "Who are Vault products designed for?",
        answer:
          "They are designed for founders, businesses, teams, creators, consultants, students, and operators who want practical resources they can put to work without starting from scratch.",
      },
      {
        question: "How do I receive a product after payment?",
        answer:
          "Access is granted only after the payment provider confirms the transaction. Eligible purchases then appear in My Vault, where downloads are authorized through short-lived secure links.",
      },
      {
        question: "Why might a product be unavailable in my selected currency?",
        answer:
          "A product can only be purchased in a currency when an active price exists and a configured payment provider supports that currency. Vault does not invent or convert a missing price in the browser.",
      },
      {
        question: "How are refunds handled?",
        answer:
          "Refund eligibility follows the published Refund Policy and the payment provider workflow. A provider-confirmed full refund revokes the related digital delivery access.",
      },
      {
        question: "Where can I get help before or after purchase?",
        answer:
          "Use the Contact page for support, or My Vault for verified purchase and download access. Keep your payment reference when contacting support about a transaction.",
      },
    ],
  },
  fr: {
    eyebrow: "Centre d’aide",
    title: "Questions fréquentes",
    body: "Des réponses pratiques sur l’achat, la vérification du paiement, l’accès sécurisé, les remboursements et l’assistance Octalve Vault.",
    items: [
      {
        question: "Quels produits puis-je acheter sur Octalve Vault ?",
        answer: "Vault publie des ressources numériques pratiques telles que des modèles, guides, ressources de lancement, outils professionnels et autres produits téléchargeables. Le catalogue en ligne indique ce qui est actuellement disponible.",
      },
      {
        question: "À qui s’adressent les produits Vault ?",
        answer: "Ils sont conçus pour les fondateurs, entreprises, équipes, créateurs, consultants, étudiants et opérateurs qui veulent des ressources pratiques prêtes à être utilisées.",
      },
      {
        question: "Comment recevoir mon produit après le paiement ?",
        answer: "L’accès n’est accordé qu’après confirmation de la transaction par le prestataire de paiement. Les achats éligibles apparaissent ensuite dans Mon Vault, avec des liens de téléchargement sécurisés et de courte durée.",
      },
      {
        question: "Pourquoi un produit peut-il être indisponible dans ma devise ?",
        answer: "Un produit n’est achetable dans une devise que si un prix actif existe et qu’un prestataire configuré prend cette devise en charge. Vault n’invente pas de prix manquant dans le navigateur.",
      },
      {
        question: "Comment fonctionnent les remboursements ?",
        answer: "L’éligibilité suit la Politique de remboursement publiée et le processus du prestataire de paiement. Un remboursement intégral confirmé par le prestataire révoque l’accès numérique associé.",
      },
      {
        question: "Où obtenir de l’aide avant ou après un achat ?",
        answer: "Utilisez la page Contact pour l’assistance, ou Mon Vault pour accéder à vos achats et téléchargements vérifiés. Conservez votre référence de paiement pour toute question liée à une transaction.",
      },
    ],
  },
  ar: {
    eyebrow: "مركز المساعدة",
    title: "الأسئلة الشائعة",
    body: "إجابات عملية حول الشراء والتحقق من الدفع والوصول الآمن والاسترداد والدعم في Octalve Vault.",
    items: [
      {
        question: "ما أنواع المنتجات التي يمكنني شراؤها من Octalve Vault؟",
        answer: "تنشر الخزنة موارد رقمية عملية مثل القوالب والأدلة ومواد الإطلاق وأدوات الأعمال وغيرها من المنتجات القابلة للتنزيل. الكتالوج المباشر هو المرجع لما هو متاح حالياً.",
      },
      {
        question: "لمن صُممت منتجات Vault؟",
        answer: "صُممت للمؤسسين والشركات والفرق والمبدعين والاستشاريين والطلاب والمشغلين الذين يريدون موارد عملية يمكن استخدامها دون البدء من الصفر.",
      },
      {
        question: "كيف أحصل على المنتج بعد الدفع؟",
        answer: "لا يُمنح الوصول إلا بعد تأكيد مزود الدفع للمعاملة. بعدها تظهر المشتريات المؤهلة في خزنتي، ويتم تنزيلها عبر روابط آمنة قصيرة الصلاحية.",
      },
      {
        question: "لماذا قد لا يتوفر منتج بعملتي المختارة؟",
        answer: "لا يمكن شراء المنتج بعملة معينة إلا عند وجود سعر نشط ودعم مزود دفع مفعّل لتلك العملة. لا تنشئ الخزنة سعراً مفقوداً داخل المتصفح.",
      },
      {
        question: "كيف تتم عمليات الاسترداد؟",
        answer: "تخضع الأهلية لسياسة الاسترداد المنشورة وإجراءات مزود الدفع. الاسترداد الكامل الذي يؤكده المزود يؤدي إلى إلغاء صلاحية الوصول الرقمي المرتبط بالطلب.",
      },
      {
        question: "أين أحصل على المساعدة قبل أو بعد الشراء؟",
        answer: "استخدم صفحة التواصل للدعم، أو خزنتي للوصول إلى المشتريات والتنزيلات الموثقة. احتفظ بمرجع الدفع عند التواصل بخصوص معاملة.",
      },
    ],
  },
};

export function VaultFaq({ locale }: { locale: Locale }) {
  const copy = FAQ_COPY[locale];
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section
      id="vault-faq"
      className="bg-[#040506] px-4 py-16 text-white sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-[1080px]">
        <div className="text-center">
          <p className="text-sm font-medium uppercase tracking-[0.16em] text-[#6DA9FF]">
            {copy.eyebrow}
          </p>
          <h2 className="mt-4 text-4xl font-medium tracking-[-0.05em] sm:text-5xl md:text-6xl">
            {copy.title}
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-white/68 sm:text-lg">
            {copy.body}
          </p>
        </div>

        <div className="mt-12 rounded-[28px] border border-white/6 bg-white/[0.015] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-6 lg:mt-14 lg:p-8">
          <div className="divide-y divide-white/8">
            {copy.items.map((item, index) => {
              const isOpen = openIndex === index;
              const panelId = `vault-faq-${index + 1}`;

              return (
                <div key={item.question} className="py-1">
                  <button
                    type="button"
                    onClick={() => setOpenIndex((current) => (current === index ? -1 : index))}
                    className="flex min-h-14 w-full items-start justify-between gap-6 py-6 text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#6DA9FF] sm:py-7"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                  >
                    <span className="pr-2 text-xl font-medium leading-[1.35] tracking-[-0.03em] sm:text-2xl rtl:pl-2 rtl:pr-0">
                      {index + 1}. {item.question}
                    </span>
                    <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] text-white">
                      {isOpen ? <Minus className="h-5 w-5" aria-hidden="true" /> : <Plus className="h-5 w-5" aria-hidden="true" />}
                    </span>
                  </button>

                  <div
                    id={panelId}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="max-w-[92ch] pb-6 text-base leading-8 text-white/74 sm:pb-7 sm:text-[1.05rem]">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
