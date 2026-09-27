import type { Locale } from "@/domain/constants";
import { publicEnv } from "@/config/env.public";

type LegalKind = "privacy" | "terms" | "refund" | "license";
type Section = { title: string; body: string[] };
type Copy = { eyebrow: string; title: string; intro: string; sections: Section[] };

const copy: Record<Locale, Record<LegalKind, Copy>> = {
  en: {
    privacy: { eyebrow: "Legal", title: "Privacy Policy", intro: "This policy explains how Octalve Vault handles information needed to sell, deliver and protect digital products.", sections: [
      { title: "Information we process", body: ["We process information you provide during checkout or secure Vault access, such as your email address, selected products, currency and payment reference.", "Payment card or bank credentials are handled by the selected payment provider and are not stored by Octalve Vault."] },
      { title: "How information is used", body: ["We use personal information to process orders, verify payments, provide secure downloads, send transactional messages, prevent fraud, support customers and meet legal or accounting obligations."] },
      { title: "Security and retention", body: ["Access sessions, download grants, security events and operational logs are protected with access controls and retained only as needed for security, support, financial records and legal obligations."] },
      { title: "Service providers", body: ["The platform may use payment, email, hosting, database, bot-protection and private object-storage providers solely to operate the service."] },
    ] },
    terms: { eyebrow: "Legal", title: "Terms of Sale and Use", intro: "These terms apply when you browse, purchase or access digital products through Octalve Vault.", sections: [
      { title: "Orders and payment", body: ["Prices and supported currencies are shown before checkout. An order becomes paid only after the selected payment provider is verified by Octalve Vault on the server."] },
      { title: "Digital delivery", body: ["Paid purchases create a personal download entitlement linked to the checkout email. Access may require email verification and secure short-lived download authorization."] },
      { title: "Acceptable use", body: ["You must not attempt to bypass authentication, share access credentials, abuse download infrastructure, interfere with the service or use purchased materials in a manner prohibited by the applicable product licence."] },
      { title: "Changes and availability", body: ["Octalve may improve products, payment options, security controls and platform functionality. Historic order records remain tied to the product, price, currency and asset version purchased where applicable."] },
    ] },
    refund: { eyebrow: "Customer policy", title: "7-Day Money-Back Policy", intro: "Octalve Vault provides a seven-day money-back guarantee for digital products purchased through the platform.", sections: [
      { title: "Request window", body: ["A refund request should be made within seven calendar days of the verified payment date and should identify the order used for the purchase."] },
      { title: "How refunds are processed", body: ["Approved refunds are initiated through the original payment provider. Provider processing times vary, and a refund may remain pending after Octalve has submitted it."] },
      { title: "Access after a full refund", body: ["When a full refund is confirmed by the payment provider, future download access to the refunded digital products is revoked."] },
    ] },
    license: { eyebrow: "Product licence", title: "Digital Product Licence", intro: "Unless a product states different licence terms, this licence applies to digital products delivered through Octalve Vault.", sections: [
      { title: "Permitted use", body: ["A purchaser may use the product for their own personal, professional or internal business work, and may adapt editable materials for that permitted use."] },
      { title: "Not permitted", body: ["You may not resell, redistribute, republish, sublicense or make the original or substantially similar product files available as a competing downloadable product unless the product expressly grants that right."] },
      { title: "Ownership", body: ["Purchasing a digital product grants the applicable usage licence; it does not transfer Octalve's underlying intellectual-property ownership except where a product expressly says otherwise."] },
    ] },
  },
  fr: {
    privacy: { eyebrow: "Juridique", title: "Politique de confidentialité", intro: "Cette politique explique comment Octalve Vault traite les informations nécessaires à la vente, à la livraison et à la protection des produits numériques.", sections: [
      { title: "Informations traitées", body: ["Nous traitons les informations fournies lors du paiement ou de l’accès sécurisé au Vault, notamment l’adresse e-mail, les produits choisis, la devise et la référence de paiement.", "Les données de carte ou de compte bancaire sont traitées par le prestataire de paiement sélectionné et ne sont pas stockées par Octalve Vault."] },
      { title: "Utilisation", body: ["Ces informations servent à traiter les commandes, vérifier les paiements, fournir les téléchargements sécurisés, envoyer les messages transactionnels, prévenir la fraude et assurer le support."] },
      { title: "Sécurité et conservation", body: ["Les sessions, droits de téléchargement, événements de sécurité et journaux opérationnels sont protégés par des contrôles d’accès et conservés uniquement selon les besoins légitimes du service."] },
      { title: "Prestataires", body: ["La plateforme peut utiliser des prestataires de paiement, e-mail, hébergement, base de données, protection anti-bot et stockage privé afin d’exploiter le service."] },
    ] },
    terms: { eyebrow: "Juridique", title: "Conditions de vente et d’utilisation", intro: "Ces conditions s’appliquent à la consultation, à l’achat et à l’accès aux produits numériques d’Octalve Vault.", sections: [
      { title: "Commandes et paiement", body: ["Les prix et devises disponibles sont affichés avant le paiement. Une commande n’est considérée comme payée qu’après vérification serveur du prestataire de paiement."] },
      { title: "Livraison numérique", body: ["Un achat payé crée un droit de téléchargement personnel lié à l’adresse e-mail utilisée lors du paiement. Une vérification par e-mail peut être requise."] },
      { title: "Utilisation acceptable", body: ["Il est interdit de contourner l’authentification, partager des accès, abuser de l’infrastructure de téléchargement ou utiliser les produits contrairement à leur licence."] },
      { title: "Évolutions", body: ["Octalve peut améliorer les produits, moyens de paiement et contrôles de sécurité. Les données historiques de commande restent liées aux conditions de l’achat effectué."] },
    ] },
    refund: { eyebrow: "Politique client", title: "Garantie satisfait ou remboursé de 7 jours", intro: "Octalve Vault offre une garantie de remboursement de sept jours pour les produits numériques achetés sur la plateforme.", sections: [
      { title: "Délai", body: ["La demande doit être faite dans les sept jours calendaires suivant la date du paiement vérifié et doit permettre d’identifier la commande concernée."] },
      { title: "Traitement", body: ["Les remboursements approuvés sont initiés via le prestataire de paiement d’origine. Les délais de traitement dépendent du prestataire."] },
      { title: "Accès après remboursement intégral", body: ["Lorsqu’un remboursement intégral est confirmé par le prestataire de paiement, l’accès futur aux téléchargements concernés est révoqué."] },
    ] },
    license: { eyebrow: "Licence produit", title: "Licence de produit numérique", intro: "Sauf indication contraire propre à un produit, cette licence s’applique aux produits numériques livrés via Octalve Vault.", sections: [
      { title: "Utilisation autorisée", body: ["L’acheteur peut utiliser le produit pour ses besoins personnels, professionnels ou internes et adapter les fichiers modifiables dans ce cadre."] },
      { title: "Utilisation interdite", body: ["La revente, redistribution, republication, sous-licence ou mise à disposition des fichiers comme produit téléchargeable concurrent est interdite sauf autorisation expresse."] },
      { title: "Propriété", body: ["L’achat accorde un droit d’utilisation et ne transfère pas les droits de propriété intellectuelle d’Octalve sauf mention expresse contraire."] },
    ] },
  },
  ar: {
    privacy: { eyebrow: "قانوني", title: "سياسة الخصوصية", intro: "توضح هذه السياسة كيفية تعامل Octalve Vault مع المعلومات اللازمة لبيع المنتجات الرقمية وتسليمها وحمايتها.", sections: [
      { title: "المعلومات التي نعالجها", body: ["نعالج المعلومات التي تقدمها أثناء الدفع أو الدخول الآمن إلى Vault مثل البريد الإلكتروني والمنتجات المختارة والعملة ومرجع الدفع.", "تتم معالجة بيانات البطاقة أو الحساب البنكي بواسطة مزود الدفع ولا يخزنها Octalve Vault."] },
      { title: "كيفية الاستخدام", body: ["تُستخدم المعلومات لمعالجة الطلبات والتحقق من المدفوعات وتوفير التنزيلات الآمنة وإرسال الرسائل التشغيلية ومنع الاحتيال وتقديم الدعم."] },
      { title: "الأمان والاحتفاظ", body: ["تتم حماية الجلسات وصلاحيات التنزيل وأحداث الأمان والسجلات التشغيلية بضوابط وصول وتُحتفظ بها حسب الحاجة المشروعة للخدمة."] },
      { title: "مزودو الخدمة", body: ["قد تستخدم المنصة مزودي دفع وبريد واستضافة وقواعد بيانات وحماية من الروبوتات وتخزين خاص لتشغيل الخدمة."] },
    ] },
    terms: { eyebrow: "قانوني", title: "شروط البيع والاستخدام", intro: "تنطبق هذه الشروط عند تصفح المنتجات الرقمية أو شرائها أو الوصول إليها عبر Octalve Vault.", sections: [
      { title: "الطلبات والدفع", body: ["تظهر الأسعار والعملات المدعومة قبل الدفع. لا يُعد الطلب مدفوعاً إلا بعد تحقق Octalve Vault من مزود الدفع على الخادم."] },
      { title: "التسليم الرقمي", body: ["ينشئ الشراء المدفوع صلاحية تنزيل شخصية مرتبطة ببريد الدفع وقد يتطلب الوصول تحققاً عبر البريد الإلكتروني."] },
      { title: "الاستخدام المقبول", body: ["يُمنع تجاوز المصادقة أو مشاركة بيانات الدخول أو إساءة استخدام البنية التحتية للتنزيل أو استخدام المنتجات بما يخالف ترخيصها."] },
      { title: "التغييرات والتوافر", body: ["قد تعمل Octalve على تحسين المنتجات وخيارات الدفع وضوابط الأمان مع الحفاظ على سجل الطلب التاريخي المرتبط بعملية الشراء."] },
    ] },
    refund: { eyebrow: "سياسة العملاء", title: "ضمان استرداد لمدة 7 أيام", intro: "يوفر Octalve Vault ضمان استرداد لمدة سبعة أيام للمنتجات الرقمية المشتراة عبر المنصة.", sections: [
      { title: "فترة الطلب", body: ["يجب تقديم طلب الاسترداد خلال سبعة أيام تقويمية من تاريخ الدفع المتحقق منه مع تحديد الطلب المعني."] },
      { title: "معالجة الاسترداد", body: ["يتم بدء عمليات الاسترداد المعتمدة عبر مزود الدفع الأصلي وتختلف مدة المعالجة حسب المزود."] },
      { title: "الوصول بعد الاسترداد الكامل", body: ["عند تأكيد مزود الدفع لاسترداد كامل، يتم إلغاء صلاحية التنزيل المستقبلية للمنتجات الرقمية المعنية."] },
    ] },
    license: { eyebrow: "ترخيص المنتج", title: "ترخيص المنتج الرقمي", intro: "ما لم يذكر المنتج شروط ترخيص مختلفة، ينطبق هذا الترخيص على المنتجات الرقمية التي يتم تسليمها عبر Octalve Vault.", sections: [
      { title: "الاستخدام المسموح", body: ["يجوز للمشتري استخدام المنتج لأعماله الشخصية أو المهنية أو الداخلية وتعديل المواد القابلة للتحرير ضمن هذا الاستخدام."] },
      { title: "الاستخدام غير المسموح", body: ["لا يجوز إعادة بيع الملفات أو توزيعها أو نشرها أو ترخيصها أو إتاحتها كمنتج رقمي منافس إلا إذا منح المنتج ذلك الحق صراحة."] },
      { title: "الملكية", body: ["يمنح الشراء حق الاستخدام المقرر ولا ينقل ملكية Octalve الفكرية إلا إذا نص المنتج صراحة على خلاف ذلك."] },
    ] },
  },
};

export function LegalPage({ locale, kind }: { locale: Locale; kind: LegalKind }) {
  const page = copy[locale][kind];

  return (
    <section className="px-4 py-14 sm:px-6 sm:py-20 lg:px-8 lg:py-20">
      <div className="mx-auto max-w-[860px]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_18px_55px_rgba(15,23,42,0.05)] sm:p-9 lg:p-11">
          <p className="text-xs font-medium uppercase tracking-[0.17em] text-[#0064E0]">
            {page.eyebrow}
          </p>
          <h1 className="mt-3 text-4xl font-medium leading-[1.04] tracking-[-0.05em] text-[#000A16] sm:text-5xl">
            {page.title}
          </h1>
          <p className="mt-5 max-w-3xl text-base font-normal leading-8 text-slate-600">
            {page.intro}
          </p>

          <div className="mt-10 space-y-8 border-t border-slate-200 pt-8">
            {page.sections.map((section) => (
              <article key={section.title}>
                <h2 className="text-xl font-medium tracking-[-0.025em] text-[#000A16]">
                  {section.title}
                </h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph) => (
                    <p key={paragraph} className="text-sm font-normal leading-7 text-slate-600 sm:text-[15px]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          {publicEnv.supportEmail ? (
            <p className="mt-10 border-t border-slate-200 pt-6 text-sm font-normal text-slate-500">
              Support:{" "}
              <a
                className="font-medium text-[#0064E0] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF]/50"
                href={`mailto:${publicEnv.supportEmail}`}
              >
                {publicEnv.supportEmail}
              </a>
            </p>
          ) : null}
          <p className="mt-5 text-xs font-normal text-slate-400">Last updated: 26 September 2026.</p>
        </div>
      </div>
    </section>
  );
}
