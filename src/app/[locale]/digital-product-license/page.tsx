import { notFound } from "next/navigation";
import { isLocale } from "@/config/locales";
import { LegalPage } from "@/features/legal/legal-page";
export default async function LicensePage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); return <LegalPage locale={locale} kind="license" />; }
