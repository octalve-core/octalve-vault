"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmActionDialog } from "@/features/admin/shared/confirm-action-dialog";
import { adminNotice } from "@/features/admin/shared/admin-notification-provider";
import { MediaUploadControl, type MediaLibraryItem } from "./media-upload-control";

type Summary = { ready: number; inUse: number; unused: number; retired: number };
type Meta = { page: number; pageSize: 10 | 25 | 50 | 100; total: number; totalPages: number };

function pageHref(
  page: number,
  input: { query: string; status: string; usage: string; sort: string; pageSize: number },
) {
  const params = new URLSearchParams();
  if (input.query) params.set("q", input.query);
  if (input.status !== "all") params.set("status", input.status);
  if (input.usage !== "all") params.set("usage", input.usage);
  if (input.sort !== "newest") params.set("sort", input.sort);
  params.set("page", String(page));
  params.set("pageSize", String(input.pageSize));
  return `/admin/media?${params.toString()}`;
}

export function MediaLibrary({
  items,
  summary,
  meta,
  query,
  status,
  usage,
  sort,
}: {
  items: MediaLibraryItem[];
  summary: Summary;
  meta: Meta;
  query: string;
  status: string;
  usage: string;
  sort: string;
}) {
  const router = useRouter();
  const [retiring, setRetiring] = useState<MediaLibraryItem | null>(null);
  const [busy, setBusy] = useState(false);

  async function retire() {
    if (!retiring || busy) return;
    const item = retiring;
    const noticeId = adminNotice.pending({
      title: "Retiring media",
      message: "Checking that no product still uses this image...",
    });
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/media/${item.id}/retire`, { method: "POST" });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Unable to retire image.");
      adminNotice.success(noticeId, {
        title: "Media retired",
        message: "The image is no longer available for new product assignments.",
      });
      setRetiring(null);
      router.refresh();
    } catch (caught) {
      adminNotice.error(noticeId, {
        title: "Media not retired",
        message: caught instanceof Error ? caught.message : "Unable to retire image.",
      });
    } finally {
      setBusy(false);
    }
  }

  const cards = [
    ["Ready images", summary.ready],
    ["In use", summary.inUse],
    ["Unused", summary.unused],
    ["Retired", summary.retired],
  ] as const;
  const hrefInput = { query, status, usage, sort, pageSize: meta.pageSize };

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <div key={label} className="rounded-[22px] border border-slate-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[.12em] text-slate-400">{label}</p>
            <p className="mt-2 text-2xl font-medium text-slate-950">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-5">
        <MediaUploadControl onRegistered={() => router.refresh()} />
      </div>

      <form method="get" className="grid gap-3 rounded-[24px] border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto_auto_auto_auto]">
        <input name="q" defaultValue={query} placeholder="Search filename or path" className="h-11 rounded-xl border border-slate-200 px-3 text-sm" />
        <select name="status" defaultValue={status} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
          <option value="all">All statuses</option><option value="READY">Ready</option><option value="RETIRED">Retired</option>
        </select>
        <select name="usage" defaultValue={usage} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
          <option value="all">All usage</option><option value="in-use">In use</option><option value="unused">Unused</option>
        </select>
        <select name="sort" defaultValue={sort} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
          <option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option>
        </select>
        <select name="pageSize" defaultValue={String(meta.pageSize)} className="h-11 rounded-xl border border-slate-200 px-3 text-sm">
          <option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option>
        </select>
        <button className="h-11 rounded-full bg-slate-950 px-5 text-sm font-medium text-white md:col-start-5">Apply filters</button>
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div className="relative aspect-[4/3] bg-slate-100">
              <Image src={item.thumbnailUrl} alt="" fill unoptimized className="object-cover" sizes="(max-width:768px) 100vw, 33vw" />
            </div>
            <div className="p-4">
              <p className="truncate text-sm font-medium text-slate-950">{item.originalFilename}</p>
              <p className="mt-1 text-xs text-slate-500">{item.width}×{item.height} · {Math.max(1, Math.round(Number(item.sizeBytes) / 1024))} KB</p>
              <p className="mt-1 text-xs text-slate-500">{item.usageCount} product usage{item.usageCount === 1 ? "" : "s"} · {item.status}</p>
              {item.usages.length ? (
                <details className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600">
                  <summary className="cursor-pointer font-medium">View usage</summary>
                  <div className="mt-2 grid gap-1">
                    {item.usages.map((entry) => (
                      <Link key={entry.productId} href={`/admin/products/${entry.productId}`} className="truncate text-[#0064E0] hover:underline">
                        {entry.title}
                      </Link>
                    ))}
                  </div>
                </details>
              ) : (
                <p className="mt-3 text-xs text-slate-400">View usage: none</p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => void navigator.clipboard.writeText(item.publicUrl)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium">Copy URL</button>
                {item.status === "READY" ? (
                  <button
                    type="button"
                    disabled={item.usageCount > 0}
                    onClick={() => setRetiring(item)}
                    className="rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Retire
                  </button>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        {meta.page > 1 ? (
          <Link href={pageHref(meta.page - 1, hrefInput)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium">Previous</Link>
        ) : <span />}
        <p className="text-xs text-slate-500">Page {meta.page} of {Math.max(1, meta.totalPages)} · {meta.total} images</p>
        {meta.page < meta.totalPages ? (
          <Link href={pageHref(meta.page + 1, hrefInput)} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium">Next</Link>
        ) : <span />}
      </div>

      <ConfirmActionDialog
        open={retiring !== null}
        title="Retire this image?"
        description="Retired media stays recoverable in ImageKit but cannot be selected for new product assignments. Media still used by a product cannot be retired."
        confirmLabel="Retire image"
        pendingLabel="Retiring…"
        pending={busy}
        onCancel={() => setRetiring(null)}
        onConfirm={() => void retire()}
      />
    </div>
  );
}
