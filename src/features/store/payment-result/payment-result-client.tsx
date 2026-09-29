"use client";

import Link from "next/link";
import { CheckCircle2, Clock3, LoaderCircle, TriangleAlert } from "lucide-react";
import { useEffect, useState } from "react";

import type { Locale, PaymentProviderId } from "@/domain/constants";
import { getMessages } from "@/i18n/messages";
import { localeHref } from "@/i18n/routing";

import { clearCart } from "../cart/cart-store";
import {
  nextPaymentResultState,
  type PaymentResultState,
  type PaymentVerificationPayload,
} from "./state";

const MAX_ATTEMPTS = 5;
const RETRY_MS = 2200;

export function PaymentResultClient({
  locale,
  provider,
  reference,
}: {
  locale: Locale;
  provider: PaymentProviderId;
  reference: string;
}) {
  const messages = getMessages(locale);
  const [state, setState] = useState<PaymentResultState>({
    kind: "verifying",
    attempt: 1,
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function verify(attempt: number) {
      try {
        const response = await fetch(
          `/api/payments/verify?provider=${encodeURIComponent(provider)}&reference=${encodeURIComponent(reference)}`,
          { cache: "no-store" },
        );
        const payload = (await response.json()) as PaymentVerificationPayload;
        const next = nextPaymentResultState(
          { kind: "verifying", attempt },
          payload,
          MAX_ATTEMPTS,
        );
        if (cancelled) return;
        setState(next);
        if (next.kind === "success") {
          clearCart();
          return;
        }
        if (next.kind === "pending") {
          timer = setTimeout(() => {
            if (!cancelled) void verify(next.attempt);
          }, RETRY_MS);
        }
      } catch {
        if (!cancelled) setState({ kind: "failed", reference });
      }
    }

    void verify(1);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [provider, reference]);

  const base =
    "mx-auto max-w-xl rounded-[32px] border bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,10,22,.07)] sm:p-10";

  if (state.kind === "success") {
    return (
      <div className={`${base} border-emerald-200`}>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-medium tracking-[-0.04em] text-[#000A16]">
          {messages["payment.successTitle"]}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {messages["payment.successBody"]}
        </p>
        <Link
          href={localeHref(locale, "/vault")}
          className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#0064E0] px-6 text-sm transition hover:bg-[#0057C2] text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
        >
          {messages["payment.openVault"]}
        </Link>
      </div>
    );
  }

  if (state.kind === "failed") {
    return (
      <div className={`${base} border-red-200`}>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-red-600">
          <TriangleAlert className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-medium tracking-[-0.04em] text-[#000A16]">
          {messages["payment.failedTitle"]}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {messages["payment.failedBody"]}
        </p>
        <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
          {state.reference || reference}
        </p>
      </div>
    );
  }

  if (state.kind === "pending-final") {
    return (
      <div className={`${base} border-amber-200`}>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600">
          <Clock3 className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-3xl font-medium tracking-[-0.04em] text-[#000A16]">
          {messages["payment.pendingTitle"]}
        </h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          {messages["payment.pendingBody"]}
        </p>
        <Link
          href={localeHref(locale, "/vault")}
          className="mt-7 inline-flex min-h-12 items-center rounded-full bg-[#0064E0] px-6 text-sm transition hover:bg-[#0057C2] text-white font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0A84FF] focus-visible:ring-offset-2"
        >
          {messages["payment.goVault"]}
        </Link>
      </div>
    );
  }

  return (
    <div className={`${base} border-slate-200`}>
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#F1F6FF] text-[#0064E0]">
        <LoaderCircle className="h-7 w-7 animate-spin" />
      </span>
      <h1 className="mt-5 text-3xl font-medium tracking-[-0.04em] text-[#000A16]">
        {messages["payment.verifyingTitle"]}
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {messages["payment.verifyingBody"]}
      </p>
    </div>
  );
}
