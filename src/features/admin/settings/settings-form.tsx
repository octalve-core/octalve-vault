"use client";
import { adminNotice } from "@/features/admin/shared/admin-notification-provider";
import { useRouter } from "next/navigation";
import { useState } from "react";
const currencies = ["NGN", "USD", "GBP", "EUR"] as const; const locales = ["en", "fr", "ar"] as const;
type SettingsValue = { defaultCurrency?: string; defaultLocale?: string; enabledCurrencies?: string[]; enabledLocales?: string[] };
export function SettingsForm({ value, canWrite }: { value: SettingsValue; canWrite: boolean }) {
  const router = useRouter();
 const [message, setMessage] = useState<string | null>(null); async function save(form: FormData) {
    const noticeId = adminNotice.pending({
      title: "Saving store settings",
      message: "Updating the server-authoritative commerce preferences...",
    });
    const payload = {
      defaultCurrency: form.get("defaultCurrency"),
      defaultLocale: form.get("defaultLocale"),
      enabledCurrencies: currencies.filter(
        (item) => form.get(`currency-${item}`) === "on",
      ),
      enabledLocales: locales.filter(
        (item) => form.get(`locale-${item}`) === "on",
      ),
    };

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Unable to save settings.");
      }

      setMessage("Store settings saved.");
      adminNotice.success(noticeId, {
        title: "Store settings saved",
        message: "The latest confirmed settings are now displayed.",
      });
      router.refresh();
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Unable to save settings.";
      setMessage(message);
      adminNotice.error(noticeId, {
        title: "Settings not saved",
        message,
      });
    }
  }
  return <form action={save} className="max-w-3xl rounded-[28px] border border-slate-200 bg-white p-6"><div className="grid gap-6 sm:grid-cols-2"><div><h2 className="font-medium text-slate-950">Currencies</h2><label className="mt-4 block text-sm font-medium text-slate-600">Default<select name="defaultCurrency" disabled={!canWrite} defaultValue={value.defaultCurrency ?? "NGN"} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3">{currencies.map((item) => <option key={item}>{item}</option>)}</select></label><div className="mt-4 grid gap-2">{currencies.map((item) => <label key={item} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name={`currency-${item}`} disabled={!canWrite} defaultChecked={(value.enabledCurrencies ?? ["NGN"]).includes(item)} />{item}</label>)}</div></div><div><h2 className="font-medium text-slate-950">Languages</h2><label className="mt-4 block text-sm font-medium text-slate-600">Default<select name="defaultLocale" disabled={!canWrite} defaultValue={value.defaultLocale ?? "en"} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3"><option value="en">English</option><option value="fr">French</option><option value="ar">Arabic</option></select></label><div className="mt-4 grid gap-2">{locales.map((item) => <label key={item} className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name={`locale-${item}`} disabled={!canWrite} defaultChecked={(value.enabledLocales ?? ["en"]).includes(item)} />{item.toUpperCase()}</label>)}</div></div></div>{canWrite ? <button className="mt-6 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white">Save settings</button> : null}{message ? <p className="mt-4 text-sm font-medium text-slate-600">{message}</p> : null}</form>; }
