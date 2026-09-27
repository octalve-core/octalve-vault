"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const currencies = ["NGN", "USD", "GBP", "EUR"] as const;
const locales = ["en", "fr", "ar"] as const;

type Translation = { locale: string; title: string; shortDescription: string; description: string | null };
type Price = { currency: string; amountMinor: number; isActive: boolean };
type Asset = { id: string; version: number; originalFilename: string; sizeBytes: string; status: string; publishedAt: string | null };
type ProductEditorProps = {
  product: {
    id: string;
    slug: string;
    category: string;
    status: string;
    featured: boolean;
    translations: Translation[];
    prices: Price[];
    assets: Asset[];
  };
  canEditProduct: boolean;
  canEditPrice: boolean;
  canPublish: boolean;
};

export function ProductEditor({ product, canEditProduct, canEditPrice, canPublish }: ProductEditorProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const byLocale = useMemo(() => new Map(product.translations.map((item) => [item.locale, item])), [product.translations]);
  const byCurrency = useMemo(() => new Map(product.prices.map((item) => [item.currency, item])), [product.prices]);

  async function request(url: string, method: string, body?: unknown) {
    setMessage(null);
    const response = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json() as { error?: string };
    if (!response.ok) throw new Error(data.error || "Request failed.");
    setMessage("Saved successfully.");
    router.refresh();
    return data;
  }

  async function updateCore(form: FormData) {
    if (!canEditProduct) return;
    try {
      await request(`/api/admin/products/${product.id}`, "PATCH", {
        slug: form.get("slug"),
        category: form.get("category"),
        status: form.get("status"),
        featured: form.get("featured") === "on",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save.");
    }
  }

  async function updateTranslation(form: FormData) {
    if (!canEditProduct) return;
    try {
      await request(`/api/admin/products/${product.id}/translations`, "PUT", {
        locale: form.get("locale"),
        title: form.get("title"),
        shortDescription: form.get("shortDescription"),
        description: form.get("description"),
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save translation.");
    }
  }

  async function updatePrice(form: FormData) {
    if (!canEditPrice) return;
    try {
      const amountMajor = Number(form.get("amountMajor"));
      if (!Number.isFinite(amountMajor) || amountMajor < 0) throw new Error("Enter a valid price.");
      await request(`/api/admin/products/${product.id}/prices`, "PUT", {
        currency: form.get("currency"),
        amountMinor: Math.round(amountMajor * 100),
        isActive: form.get("isActive") === "on",
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to save price.");
    }
  }

  async function upload(file: File | null) {
    if (!file || !canEditProduct) return;
    setUploading(true);
    setMessage(null);
    try {
      if (!file.name.toLowerCase().endsWith(".zip")) throw new Error("Product files must be ZIP archives.");
      const auth = await fetch(`/api/admin/products/${product.id}/assets/authorize`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ originalFilename: file.name, sizeBytes: file.size }),
      });
      const info = await auth.json() as { assetId?: string; uploadUrl?: string; uploadHeaders?: Record<string, string>; error?: string };
      if (!auth.ok || !info.assetId || !info.uploadUrl) throw new Error(info.error || "Unable to authorize upload.");
      const put = await fetch(info.uploadUrl, { method: "PUT", headers: info.uploadHeaders, body: file });
      if (!put.ok) throw new Error(`R2 upload failed (${put.status}).`);
      await request(`/api/admin/assets/${info.assetId}/verify`, "POST");
      setMessage("Upload verified. Publish it when you are ready to sell this version.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function publish(assetId: string) {
    if (!canPublish) return;
    try {
      await request(`/api/admin/assets/${assetId}/publish`, "POST");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to publish asset.");
    }
  }

  return (
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <div className="space-y-6">
        <form action={updateCore} className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">Core product</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-slate-700">Slug<input disabled={!canEditProduct} name="slug" defaultValue={product.slug} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-50" /></label>
            <label className="text-sm font-bold text-slate-700">Category<input disabled={!canEditProduct} name="category" defaultValue={product.category} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-50" /></label>
            <label className="text-sm font-bold text-slate-700">Status<select disabled={!canEditProduct} name="status" defaultValue={product.status} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 disabled:bg-slate-50"><option>DRAFT</option><option>COMING_SOON</option><option>ACTIVE</option><option>ARCHIVED</option></select></label>
            <label className="mt-8 flex items-center gap-2 text-sm font-bold text-slate-700"><input disabled={!canEditProduct} type="checkbox" name="featured" defaultChecked={product.featured} /> Featured product</label>
          </div>
          {canEditProduct ? <button className="mt-5 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-black text-white">Save product</button> : <p className="mt-5 text-sm font-semibold text-slate-400">Read-only access</p>}
        </form>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">Translations</h2>
          <div className="mt-5 space-y-6">{locales.map((locale) => {
            const item = byLocale.get(locale);
            return <form action={updateTranslation} key={locale} className="rounded-2xl bg-slate-50 p-4"><input type="hidden" name="locale" value={locale} /><p className="text-xs font-black uppercase tracking-[.13em] text-[#0064E0]">{locale}</p><div className="mt-3 grid gap-3"><input disabled={!canEditProduct} name="title" defaultValue={item?.title ?? ""} placeholder="Title" className="h-11 rounded-xl border border-slate-200 bg-white px-3 disabled:bg-slate-100" /><input disabled={!canEditProduct} name="shortDescription" defaultValue={item?.shortDescription ?? ""} placeholder="Short description" className="h-11 rounded-xl border border-slate-200 bg-white px-3 disabled:bg-slate-100" /><textarea disabled={!canEditProduct} name="description" defaultValue={item?.description ?? ""} placeholder="Full description" rows={4} className="rounded-xl border border-slate-200 bg-white p-3 disabled:bg-slate-100" /></div>{canEditProduct ? <button className="mt-3 text-sm font-black text-[#0064E0]">Save {locale.toUpperCase()}</button> : null}</form>;
          })}</div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">Prices</h2>
          <div className="mt-4 grid gap-3">{currencies.map((currency) => {
            const price = byCurrency.get(currency);
            return <form action={updatePrice} key={currency} className="grid grid-cols-[70px_1fr_auto] items-end gap-3 rounded-2xl bg-slate-50 p-3"><input type="hidden" name="currency" value={currency} /><p className="pb-3 text-sm font-black">{currency}</p><label className="text-xs font-bold text-slate-500">Major units<input disabled={!canEditPrice} name="amountMajor" type="number" min="0" step="0.01" defaultValue={price ? (price.amountMinor / 100).toFixed(2) : ""} className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-100" /></label><label className="flex items-center gap-2 pb-3 text-xs font-bold"><input disabled={!canEditPrice} type="checkbox" name="isActive" defaultChecked={price?.isActive ?? false} />Active</label>{canEditPrice ? <button className="col-span-3 justify-self-start text-sm font-black text-[#0064E0]">Save price</button> : null}</form>;
          })}</div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-black text-slate-950">Private product files</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">ZIP files upload directly from your browser to the private R2 bucket. Octalve only issues a short-lived upload authorization.</p>
          {canEditProduct ? <label className="mt-5 block cursor-pointer rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-bold text-slate-600"><input type="file" accept=".zip,application/zip" className="sr-only" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0] ?? null)} />{uploading ? "Uploading and verifying…" : "Choose ZIP file"}</label> : null}
          <div className="mt-5 space-y-3">{product.assets.map((asset) => <div key={asset.id} className="rounded-2xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-black text-slate-900">Version {asset.version}</p><p className="mt-1 truncate text-xs text-slate-400">{asset.originalFilename}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">{asset.status}</span></div><p className="mt-3 text-xs text-slate-500">{Math.max(1, Math.round(Number(asset.sizeBytes) / 1024 / 1024))} MB</p>{asset.status === "READY" && canPublish ? <button type="button" onClick={() => void publish(asset.id)} className="mt-3 text-sm font-black text-[#0064E0]">Publish version</button> : null}</div>)}</div>
        </div>
        {message ? <p className="rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-800">{message}</p> : null}
      </div>
    </div>
  );
}
