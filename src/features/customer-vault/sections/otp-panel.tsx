"use client";

import { KeyRound } from "lucide-react";

import type { Locale } from "@/domain/constants";
import { getMessages } from "@/i18n/messages";

export function OtpPanel({
  locale,
  otp,
  setOtp,
  message,
  busy,
  error,
  onVerify,
  onRestart,
}: {
  locale: Locale;
  otp: string;
  setOtp: (value: string) => void;
  message: string;
  busy: boolean;
  error: string | null;
  onVerify: () => void;
  onRestart: () => void;
}) {
  const messages = getMessages(locale);

  return (
    <section className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(0,10,22,.07)] sm:p-9">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F1F6FF] text-[#0064E0]">
        <KeyRound className="h-5 w-5" />
      </span>
      <p className="mt-6 text-xs font-medium uppercase tracking-[0.15em] text-[#0064E0]">
        {messages["vault.otpEyebrow"]}
      </p>
      <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#000A16]">
        {messages["vault.otpTitle"]}
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">{message}</p>

      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={otp}
        onChange={(event) =>
          setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
        }
        className="mt-7 h-16 w-full rounded-2xl border border-slate-200 bg-[#F8FAFC] text-center text-3xl font-medium tracking-[.28em] text-[#000A16] outline-none transition focus:border-[#0064E0] focus:ring-2 focus:ring-blue-100"
        aria-label={messages["vault.otpAria"]}
      />

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || otp.length !== 6}
        onClick={onVerify}
        className="mt-6 min-h-12 w-full rounded-full bg-[#0064E0] px-5 text-sm font-medium text-white transition hover:bg-[#0A84FF] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? messages["vault.verifying"] : messages["vault.verify"]}
      </button>
      <button
        type="button"
        onClick={onRestart}
        className="mt-4 min-h-11 w-full text-sm font-medium text-slate-500 transition hover:text-[#000A16]"
      >
        {messages["vault.restart"]}
      </button>
    </section>
  );
}
