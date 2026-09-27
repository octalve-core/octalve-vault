"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProductCreateForm() {
  const router = useRouter(); const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  async function submit(formData: FormData) {
    setBusy(true); setError(null);
    const payload = { title: String(formData.get("title") || ""), slug: String(formData.get("slug") || ""), category: String(formData.get("category") || "") };
    try { const response = await fetch("/api/admin/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const data = await response.json() as { product?: { id: string }; error?: string }; if (!response.ok || !data.product) throw new Error(data.error || "Unable to create product."); setOpen(false); router.push(`/admin/products/${data.product.id}`); router.refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create product."); }
    finally { setBusy(false); }
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-slate-950 px-5 py-3 text-sm font-black text-white hover:bg-[#0064E0]">New product</button>;
  return <form action={submit} className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-lg sm:p-6"><div className="flex items-center justify-between"><p className="font-black text-slate-950">Create product</p><button type="button" onClick={() => setOpen(false)} className="text-xs font-bold text-slate-500">Cancel</button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-slate-700 sm:col-span-2">Title<input name="title" required maxLength={180} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#0064E0]" /></label><label className="text-sm font-bold text-slate-700">Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#0064E0]" /></label><label className="text-sm font-bold text-slate-700">Category<input name="category" required maxLength={80} className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 outline-none focus:border-[#0064E0]" /></label></div>{error ? <p className="mt-4 text-sm font-semibold text-red-600">{error}</p> : null}<button disabled={busy} className="mt-5 rounded-full bg-[#0064E0] px-5 py-3 text-sm font-black text-white disabled:opacity-50">{busy ? "Creating…" : "Create product"}</button></form>;
}
