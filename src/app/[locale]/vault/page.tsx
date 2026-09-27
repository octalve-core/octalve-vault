import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/config/locales";
import { CustomerVault } from "@/features/customer-vault/customer-vault";

export const metadata: Metadata = { title: "My Vault", robots: { index: false, follow: false } };

export default async function CustomerVaultPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <section className="min-h-[72vh] bg-slate-50 px-4 py-16 sm:px-6"><CustomerVault locale={locale} /></section>;
}
