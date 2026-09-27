"use client";

import { ShieldCheck } from "lucide-react";

import type { Locale } from "@/domain/constants";
import { TurnstileWidget } from "@/features/security/turnstile-widget";
import { getMessages } from "@/i18n/messages";

export function AccessPanel({
  locale,
  email,
  setEmail,
  token,
  setToken,
  busy,
  error,
  onSubmit,
}: {
  locale: Locale;
  email: string;
  setEmail: (value: string) => void;
  token: string;
  setToken: (value: string) => void;
  busy: boolean;
  error: string | null;
  onSubmit: () => void;
}) {
  const messages = getMessages(locale);

  return (
    <section className="mx-auto max-w-xl rounded-[32px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(0,10,22,.07)] sm:p-9">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#F1F6FF] text-[#0064E0]">
        <ShieldCheck className="h-5 w-5" />
      </span>
      <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-[#0064E0]">
        My Vault
      </p>
      <h1 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-[#000A16]">
        {messages["vault.accessTitle"]}
      </h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">
        {messages["vault.accessBody"]}
      </p>

      <label className="mt-7 block text-sm font-medium text-slate-700">
        {messages["vault.email"]}
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-slate-950 outline-none transition focus:border-[#0064E0] focus:ring-2 focus:ring-blue-100"
          placeholder="you@example.com"
        />
      </label>

      <div className="mt-5">
        <TurnstileWidget action="vault_access" onToken={setToken} />
      </div>

      {error ? (
        <p role="alert" className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={busy || !email.trim() || !token}
        onClick={onSubmit}
        className="mt-6 min-h-12 w-full rounded-full bg-[#0064E0] px-5 text-sm font-medium text-white transition hover:bg-[#0A84FF] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? messages["vault.checking"] : messages["vault.continue"]}
      </button>
    </section>
  );
}
