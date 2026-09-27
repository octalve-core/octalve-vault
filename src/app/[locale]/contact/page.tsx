import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { isLocale } from "@/config/locales";
import { publicEnv } from "@/config/env.public";
import { ContactView } from "@/features/store/contact/contact-view";

export const metadata: Metadata = { title: "Contact Vault Support" };

const FALLBACK_SUPPORT_EMAIL = "support@octalve.com";
const SIMPLE_EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const configuredSupportEmail = publicEnv.supportEmail.trim();
  const supportEmail = SIMPLE_EMAIL.test(configuredSupportEmail)
    ? configuredSupportEmail
    : FALLBACK_SUPPORT_EMAIL;

  return <ContactView locale={locale} supportEmail={supportEmail} />;
}
