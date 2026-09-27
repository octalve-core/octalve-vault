"use client";

import { CloudUpload, FileArchive, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Asset = { id: string; version: number; status: string; originalFilename: string; downloadFilename: string; sizeBytes: string; publishedAt: string | null };
export function ProductAssetsPanel({ productId, assets }: { productId: string; assets: Asset[] }) {
  const router = useRouter(); const [file, setFile] = useState<File | null>(null); const [busy, setBusy] = useState(false); const [message, setMessage] = useState<string | null>(null);
  async function upload() {
    if (!file) return; setBusy(true); setMessage(null);
    try {
      const authRes = await fetch(`/api/admin/products/${productId}/assets/authorize`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ originalFilename: file.name, sizeBytes: file.size }) });
      const auth = (await authRes.json()) as { assetId?: string; uploadUrl?: string; uploadHeaders?: Record<string,string>; error?: string };
      if (!authRes.ok || !auth.assetId || !auth.uploadUrl) throw new Error(auth.error || "Unable to authorize upload.");
      const uploadRes = await fetch(auth.uploadUrl, { method: "PUT", headers: auth.uploadHeaders ?? { "content-type": "application/zip" }, body: file });
      if (!uploadRes.ok) throw new Error("R2 upload failed. Check bucket CORS and credentials.");
      const verifyRes = await fetch(`/api/admin/assets/${auth.assetId}/verify`, { method: "POST" }); const verified = (await verifyRes.json()) as { error?: string };
      if (!verifyRes.ok) throw new Error(verified.error || "Uploaded object verification failed.");
      setFile(null); setMessage("Upload verified and ready to publish."); router.refresh();
    } catch (caught) { setMessage(caught instanceof Error ? caught.message : "Upload failed."); }
    finally { setBusy(false); }
  }
  async function publish(id: string) { setBusy(true); setMessage(null); const response = await fetch(`/api/admin/assets/${id}/publish`, { method: "POST" }); const data = (await response.json()) as { error?: string }; setMessage(response.ok ? "Asset published." : data.error || "Unable to publish."); setBusy(false); if (response.ok) router.refresh(); }
  return <section className="rounded-[26px] border border-slate-200 bg-white p-6"><h2 className="text-lg font-black text-slate-950">Product files & versions</h2><p className="mt-2 text-sm leading-6 text-slate-500">ZIP bytes upload directly from this browser to your private R2 bucket. Git and Vercel never store the commercial file.</p><div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><input type="file" accept=".zip,application/zip" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-slate-600" /><button type="button" disabled={!file || busy} onClick={upload} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0064E0] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-40">{busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CloudUpload className="h-4 w-4" />}Upload new version</button>{message ? <p className="mt-3 text-sm text-slate-500">{message}</p> : null}</div><div className="mt-5 grid gap-3">{assets.length ? assets.map((asset) => <article key={asset.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-white"><FileArchive className="h-4 w-4" /></span><div><p className="text-sm font-bold text-slate-950">Version {asset.version} · {asset.originalFilename}</p><p className="mt-1 text-xs text-slate-400">{(Number(asset.sizeBytes)/1024/1024).toFixed(2)} MB · {asset.status}</p></div></div>{asset.status === "READY" ? <button type="button" disabled={busy} onClick={() => publish(asset.id)} className="rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white">Publish version</button> : <span className={`text-xs font-bold ${asset.status === "PUBLISHED" ? "text-emerald-700" : "text-slate-400"}`}>{asset.status}</span>}</article>) : <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">No product file yet. This product cannot be purchased until a verified asset is published.</p>}</div></section>;
}
