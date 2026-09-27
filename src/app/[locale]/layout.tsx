import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/domain/constants";
import { isLocale, isRtlLocale } from "@/config/locales";
import { SiteHeader } from "@/features/store/layout/site-header";
import { SiteFooter } from "@/features/store/layout/site-footer";
import { CommercePreferencesProvider } from "@/features/store/preferences/commerce-preferences";
import { getCommerceSettings } from "@/server/settings/commerce-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const settings = await getCommerceSettings();
  if (!settings.enabledLocales.includes(locale)) return {};
  return {
    alternates: {
      canonical: `/${locale}`,
      languages: Object.fromEntries(settings.enabledLocales.map((item) => [item, `/${item}`])),
    },
  };
}

export default async function LocaleLayout({ children, params }: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale: rawLocale } = await params;
  if (!isLocale(rawLocale)) notFound();
  const settings = await getCommerceSettings();
  if (!settings.enabledLocales.includes(rawLocale)) notFound();
  const locale: Locale = rawLocale;
  return (
    <CommercePreferencesProvider value={settings}>
      <div lang={locale} dir={isRtlLocale(locale) ? "rtl" : "ltr"} className="min-h-screen bg-[#F8FAFC] text-[#000A16]">
        <SiteHeader locale={locale} />
        <main>{children}</main>
        <SiteFooter locale={locale} />
      </div>
    </CommercePreferencesProvider>
  );
}
