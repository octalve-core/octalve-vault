import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale } from "@/config/locales";
import type { PaymentProviderId } from "@/domain/constants";
import { PaymentResultClient } from "@/features/store/payment-result/payment-result-client";

export const metadata: Metadata = { title: "Payment verification", robots: { index: false, follow: false } };

export default async function PaymentSuccessPage({ params, searchParams }: { params: Promise<{ locale: string; provider: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ locale, provider: rawProvider }, query] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();
  const provider = rawProvider.toUpperCase() as PaymentProviderId;
  if (provider !== "PAYSTACK" && provider !== "FLUTTERWAVE") notFound();
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
  const reference = first(query.reference) || first(query.tx_ref) || first(query.trxref);
  if (!reference) notFound();
  return <section className="bg-slate-50 px-4 py-20 sm:px-6"><PaymentResultClient locale={locale} provider={provider} reference={reference} /></section>;
}
