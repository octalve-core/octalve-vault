import Link from "next/link";
import type { ReactNode } from "react";
import { Mail, MessageCircle, Phone, ShieldCheck, ShoppingBag } from "lucide-react";

import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";

const NIGERIA_PHONE_DISPLAY = "+234 807 345 9090";
const NIGERIA_PHONE_HREF = "tel:+2348073459090";
const NIGERIA_WHATSAPP_HREF =
  "https://wa.me/2348073459090?text=Hello%20Octalve%2C%20I%20need%20help%20with%20Octalve%20Vault.";

type ContactViewProps = {
  locale: Locale;
  supportEmail: string;
};

function SupportCard({
  eyebrow,
  title,
  body,
  action,
  href,
  icon,
  external = false,
}: {
  eyebrow: string;
  title: string;
  body: string;
  action: string;
  href: string;
  icon: ReactNode;
  external?: boolean;
}) {
  const className =
    "mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0064E0] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#0054BD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2";

  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:p-7">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F1F6FF] text-[#0064E0]">
        {icon}
      </div>
      <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-[#0064E0]">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-medium tracking-[-0.035em] text-[#000A16]">
        {title}
      </h2>
      <p className="mt-3 text-sm font-normal leading-7 text-slate-600">{body}</p>
      {external ? (
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          {action}
        </a>
      ) : (
        <a href={href} className={className}>
          {action}
        </a>
      )}
    </article>
  );
}

export function ContactView({ locale, supportEmail }: ContactViewProps) {
  const messages = getMessages(locale);
  const shopHref = localeHref(locale, "/products");
  const vaultHref = localeHref(locale, "/vault");

  return (
    <div className="bg-[#F8FAFC] text-[#000A16]">
      <section className="border-b border-slate-200 bg-white px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1180px]">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#0064E0]">
            {translate(messages, "contact.eyebrow")}
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-medium leading-[1.02] tracking-[-0.055em] text-[#000A16] sm:text-5xl lg:text-6xl">
            {translate(messages, "contact.title")}
          </h1>
          <p className="mt-5 max-w-2xl text-base font-normal leading-8 text-slate-600 sm:text-lg">
            {translate(messages, "contact.body")}
          </p>
        </div>
      </section>

      <section className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-5 md:grid-cols-3">
          <SupportCard
            eyebrow={translate(messages, "contact.emailEyebrow")}
            title={translate(messages, "contact.emailTitle")}
            body={supportEmail}
            action={translate(messages, "contact.emailAction")}
            href={`mailto:${supportEmail}`}
            icon={<Mail aria-hidden="true" size={22} strokeWidth={1.8} />}
          />
          <SupportCard
            eyebrow={translate(messages, "contact.phoneEyebrow")}
            title={translate(messages, "contact.phoneTitle")}
            body={NIGERIA_PHONE_DISPLAY}
            action={translate(messages, "contact.callAction")}
            href={NIGERIA_PHONE_HREF}
            icon={<Phone aria-hidden="true" size={22} strokeWidth={1.8} />}
          />
          <SupportCard
            eyebrow={translate(messages, "contact.whatsappEyebrow")}
            title={translate(messages, "contact.whatsappTitle")}
            body={translate(messages, "contact.whatsappBody")}
            action={translate(messages, "contact.whatsappAction")}
            href={NIGERIA_WHATSAPP_HREF}
            external
            icon={<MessageCircle aria-hidden="true" size={22} strokeWidth={1.8} />}
          />
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-[1180px] rounded-[32px] bg-[#020B1C] p-7 text-white sm:p-9 lg:flex lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium uppercase tracking-[0.17em] text-[#6DA9FF]">
              {translate(messages, "contact.nextEyebrow")}
            </p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.045em] sm:text-4xl">
              {translate(messages, "contact.nextTitle")}
            </h2>
            <p className="mt-3 text-sm font-normal leading-7 text-slate-300">
              {translate(messages, "contact.nextBody")}
            </p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
            <Link
              href={shopHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0A84FF] px-5 py-3 text-sm font-medium text-white transition hover:bg-[#006FE0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <ShoppingBag aria-hidden="true" size={18} strokeWidth={1.8} />
              {translate(messages, "contact.shopAction")}
            </Link>
            <Link
              href={vaultHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <ShieldCheck aria-hidden="true" size={18} strokeWidth={1.8} />
              {translate(messages, "contact.vaultAction")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
