"use client";

import { Download, LogOut, PackageCheck } from "lucide-react";

import type { Locale } from "@/domain/constants";
import { getMessages } from "@/i18n/messages";

import type { CustomerGrant } from "../types";

export function DownloadsPanel({
  locale,
  grants,
  email,
  busyGrantId,
  error,
  onDownload,
  onLogout,
}: {
  locale: Locale;
  grants: CustomerGrant[];
  email: string | null;
  busyGrantId: string | null;
  error: string | null;
  onDownload: (grantId: string) => void;
  onLogout: () => void;
}) {
  const messages = getMessages(locale);

  return (
    <section className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.15em] text-[#0064E0]">
            My Vault
          </p>
          <h1 className="mt-2 text-4xl font-medium tracking-[-0.05em] text-[#000A16]">
            {messages["vault.title"]}
          </h1>
          {email ? (
            <p className="mt-2 text-sm text-slate-500">
              {messages["vault.signedIn"]} {email}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#000A16]"
        >
          <LogOut className="h-4 w-4" /> {messages["vault.logout"]}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-5 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-8 grid gap-4">
        {grants.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#F1F6FF] text-[#0064E0]">
              <PackageCheck className="h-5 w-5" />
            </span>
            <p className="mt-4 font-medium text-[#000A16]">
              {messages["vault.emptyTitle"]}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {messages["vault.emptyBody"]}
            </p>
          </div>
        ) : (
          grants.map((grant) => (
            <article
              key={grant.id}
              className="flex flex-col gap-5 rounded-[26px] border border-slate-200 bg-white p-6 transition hover:border-blue-200 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h2 className="text-lg font-medium text-[#000A16]">
                  {grant.productTitle}
                </h2>
                <p className="mt-2 text-xs text-slate-500">
                  {messages["vault.version"]} {grant.version} · {messages["vault.order"]}{" "}
                  {grant.orderReference}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {messages["vault.authorized"]}: {grant.downloadCount}
                </p>
              </div>
              <button
                type="button"
                disabled={busyGrantId === grant.id}
                onClick={() => onDownload(grant.id)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#0064E0] px-5 text-sm font-medium text-white transition hover:bg-[#0A84FF] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                {busyGrantId === grant.id
                  ? messages["vault.authorizing"]
                  : messages["vault.download"]}
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
