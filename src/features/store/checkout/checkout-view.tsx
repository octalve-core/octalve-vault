"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  LoaderCircle,
  LockKeyhole,
  Tag,
  Users,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import type { CurrencyCode, Locale, PaymentProviderId } from "@/domain/constants";
import { formatMoney } from "@/domain/money";
import { getMessages } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";
import type { PublicProduct } from "../catalogue/types";
import { useCart } from "../cart/use-cart";
import { useCurrency } from "../currency/use-currency";

const providerLabel: Record<PaymentProviderId, string> = {
  PAYSTACK: "Paystack",
  FLUTTERWAVE: "Flutterwave",
};

type ProviderMap = Partial<Record<CurrencyCode, PaymentProviderId[]>>;
type QuoteResult = {
  signature: string;
  currency: CurrencyCode;
  subtotalAmount: number;
  discountAmount: number;
  totalAmount: number;
  coupon: { code: string } | null;
  affiliate: { code: string } | null;
};

export function CheckoutView({
  products,
  locale,
  providersByCurrency,
}: {
  products: PublicProduct[];
  locale: Locale;
  providersByCurrency: ProviderMap;
}) {
  const messages = getMessages(locale);
  const cart = useCart();
  const { currency } = useCurrency();
  const [email, setEmail] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [provider, setProvider] = useState<PaymentProviderId | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);
  const idempotencySignatureRef = useRef<string | null>(null);

  const selected = useMemo(
    () =>
      cart.ids
        .map((id) => products.find((product) => product.id === id))
        .filter((product): product is PublicProduct => Boolean(product)),
    [cart.ids, products],
  );
  const providers = providersByCurrency[currency] ?? [];
  const effectiveProvider =
    provider && providers.includes(provider) ? provider : (providers[0] ?? null);
  const unavailablePrice = selected.some(
    (product) => product.prices[currency] === undefined,
  );
  const subtotal = selected.reduce(
    (sum, product) => sum + (product.prices[currency] ?? 0),
    0,
  );
  const quoteSignature = useMemo(
    () =>
      JSON.stringify({
        email: email.trim().toLowerCase(),
        currency,
        couponCode: couponCode.trim().toUpperCase(),
        affiliateCode: affiliateCode.trim().toUpperCase(),
        productIds: selected.map((product) => product.id).sort(),
      }),
    [affiliateCode, couponCode, currency, email, selected],
  );
  const activeQuote = quote?.signature === quoteSignature ? quote : null;
  const promotionNeedsQuote =
    Boolean(couponCode.trim() || affiliateCode.trim()) && !activeQuote;

  async function applyCodes() {
    if (!email.trim() || selected.length === 0 || unavailablePrice) return;
    setQuoting(true);
    setError(null);
    setQuoteMessage(null);
    try {
      const response = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email,
          currency,
          locale,
          couponCode,
          affiliateCode,
          items: selected.map((product) => ({ productId: product.id })),
        }),
      });
      const data = (await response.json()) as Omit<QuoteResult, "signature"> & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || messages["checkout.codesFailed"]);
      }
      setQuote({ ...data, signature: quoteSignature });
      setQuoteMessage(messages["checkout.codesApplied"]);
    } catch (caught) {
      setQuote(null);
      setError(
        caught instanceof Error ? caught.message : messages["checkout.codesFailed"],
      );
    } finally {
      setQuoting(false);
    }
  }

  async function submitPayment() {
    if (
      !email.trim() ||
      !effectiveProvider ||
      !accepted ||
      selected.length === 0 ||
      unavailablePrice ||
      promotionNeedsQuote
    ) {
      return;
    }

    setSubmitting(true);
    setError(null);

    const paymentSignature = `${quoteSignature}:${effectiveProvider}`;
    if (
      !idempotencyKeyRef.current ||
      idempotencySignatureRef.current !== paymentSignature
    ) {
      idempotencyKeyRef.current = `checkout:${crypto.randomUUID()}`;
      idempotencySignatureRef.current = paymentSignature;
    }
    const idempotencyKey = idempotencyKeyRef.current;

    try {
      const response = await fetch("/api/payments/initialize", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": idempotencyKey,
        },
        body: JSON.stringify({
          email,
          currency,
          locale,
          provider: effectiveProvider,
          couponCode,
          affiliateCode,
          items: selected.map((product) => ({ productId: product.id })),
        }),
      });
      const data = (await response.json()) as {
        authorizationUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.authorizationUrl) {
        throw new Error(data.error || "Unable to initialize payment.");
      }
      window.location.assign(data.authorizationUrl);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to initialize payment.",
      );
      setSubmitting(false);
    }
  }

  if (selected.length === 0) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white p-8">
        <p className="text-lg font-medium text-slate-950">
          {messages["checkout.empty"]}
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          {messages["checkout.emptyBody"]}
        </p>
        <Link
          href={localeHref(locale, "/products")}
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#E61525] px-5 text-sm text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" /> {messages["checkout.return"]}
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[28px] border border-slate-200 bg-white p-6 sm:p-8">
        <h2 className="text-xl font-semibold text-slate-950">
          {messages["checkout.customerDetails"]}
        </h2>

        <label className="mt-6 block text-sm font-medium text-slate-700">
          {messages["checkout.email"]}
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-900 outline-none transition focus:border-[#0A84FF] focus:ring-2 focus:ring-blue-100"
          />
        </label>
        <p className="mt-3 text-sm leading-7 text-slate-500">
          {messages["checkout.emailHelp"]}
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="text-base font-semibold text-slate-950">
            {messages["checkout.promotions"]}
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              <span className="inline-flex items-center gap-2">
                <Tag className="h-4 w-4 text-[#0064E0]" />
                {messages["checkout.coupon"]}
              </span>
              <input
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value)}
                autoCapitalize="characters"
                maxLength={40}
                placeholder={messages["checkout.couponPlaceholder"]}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm uppercase outline-none focus:border-[#0A84FF]"
              />
            </label>
            <label className="text-sm font-medium text-slate-700">
              <span className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0064E0]" />
                {messages["checkout.affiliate"]}
              </span>
              <input
                value={affiliateCode}
                onChange={(event) => setAffiliateCode(event.target.value)}
                autoCapitalize="characters"
                maxLength={40}
                placeholder={messages["checkout.affiliatePlaceholder"]}
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm uppercase outline-none focus:border-[#0A84FF]"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={applyCodes}
              disabled={quoting || !email.trim() || unavailablePrice}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-5 text-sm font-medium text-slate-950 transition hover:border-[#0A84FF] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {quoting ? messages["checkout.applyingCodes"] : messages["checkout.applyCodes"]}
            </button>
            {quoteMessage && activeQuote ? (
              <span className="text-sm text-emerald-700">{quoteMessage}</span>
            ) : null}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h3 className="text-base font-semibold text-slate-950">
            {messages["checkout.deliveryRule"]}
          </h3>
          <p className="mt-2 text-sm leading-7 text-slate-700">
            {messages["checkout.deliveryBody"]}
          </p>
        </div>

        <div className="mt-8">
          <h3 className="text-base font-semibold text-slate-950">
            {messages["checkout.payment"]}
          </h3>
          {providers.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {providers.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setProvider(item)}
                  className={`flex min-h-14 items-center gap-3 rounded-2xl border p-4 text-start transition ${effectiveProvider === item ? "border-[#0064E0] bg-blue-50" : "border-slate-200 hover:border-slate-300"}`}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white">
                    <CreditCard className="h-4 w-4" />
                  </span>
                  <span>
                    <strong className="block text-sm font-medium text-slate-950">
                      {providerLabel[item]}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {messages["checkout.payIn"]} {currency}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-800">
              {messages["checkout.noProvider"]}
            </p>
          )}
        </div>

        <label className="mt-7 flex items-start gap-3 text-sm leading-6 text-slate-600">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            {messages["checkout.acceptPrefix"]}{" "}
            <Link
              href={localeHref(locale, "/terms")}
              className="font-medium text-slate-950 underline"
            >
              {messages["checkout.terms"]}
            </Link>{" "}
            {messages["checkout.and"]}{" "}
            <Link
              href={localeHref(locale, "/refund-policy")}
              className="font-medium text-slate-950 underline"
            >
              {messages["checkout.refund"]}
            </Link>
            .
          </span>
        </label>

        {error ? (
          <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submitPayment}
          disabled={
            submitting ||
            !email.trim() ||
            !effectiveProvider ||
            !accepted ||
            unavailablePrice ||
            promotionNeedsQuote
          }
          className="mt-7 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-full bg-[#E61525] px-6 text-sm transition hover:bg-[#C81020] disabled:cursor-not-allowed disabled:opacity-45 text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
        >
          {submitting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <LockKeyhole className="h-4 w-4" />
          )}
          {submitting ? messages["checkout.submitting"] : messages["checkout.submit"]}
          <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <aside className="h-fit rounded-[28px] border border-slate-200 bg-slate-50 p-6 md:p-8 lg:sticky lg:top-24">
        <h3 className="text-lg font-semibold text-slate-950">
          {messages["checkout.summary"]}
        </h3>
        <div className="mt-6 space-y-4">
          {selected.map((product) => (
            <div
              key={product.id}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-3"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <Image
                  src={product.imagePath ?? "/brand/vault-logo.png"}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-950">{product.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{product.category}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-slate-950">
                  {product.prices[currency] === undefined
                    ? messages["checkout.unavailable"]
                    : formatMoney(product.prices[currency]!, currency, locale)}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3 border-t border-slate-200 pt-4 text-sm">
          <div className="flex items-center justify-between text-slate-600">
            <span>{messages["checkout.subtotal"]}</span>
            <span>{formatMoney(activeQuote?.subtotalAmount ?? subtotal, currency, locale)}</span>
          </div>
          {activeQuote?.discountAmount ? (
            <div className="flex items-center justify-between text-emerald-700">
              <span>{messages["checkout.discount"]}</span>
              <span>-{formatMoney(activeQuote.discountAmount, currency, locale)}</span>
            </div>
          ) : null}
          {activeQuote?.coupon ? (
            <p className="text-xs text-slate-500">
              {messages["checkout.couponApplied"]}: {activeQuote.coupon.code}
            </p>
          ) : null}
          {activeQuote?.affiliate ? (
            <p className="text-xs text-slate-500">
              {messages["checkout.affiliateApplied"]}: {activeQuote.affiliate.code}
            </p>
          ) : null}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-950">
            <span>{messages["checkout.total"]}</span>
            <span>{formatMoney(activeQuote?.totalAmount ?? subtotal, currency, locale)}</span>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-slate-500">
          {messages["checkout.serverPricing"]}
        </p>
      </aside>
    </div>
  );
}
