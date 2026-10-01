"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { MediaUploadControl, type MediaLibraryItem } from "./media-upload-control";

export function MediaPicker({
  selectedMediaAssetId,
  onSelect,
}: {
  selectedMediaAssetId: string | null;
  onSelect: (mediaAssetId: string | null) => void;
}) {
  const [items, setItems] = useState<MediaLibraryItem[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: "READY",
        usage: "all",
        page: "1",
        pageSize: "25",
      });
      if (q.trim()) params.set("q", q.trim());
      const response = await fetch(`/api/admin/media?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as { items?: MediaLibraryItem[] };
      if (response.ok && data.items) setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Media Library" className="h-11 min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm" />
        <button type="button" onClick={() => void load(query)} className="h-11 rounded-full border border-slate-200 bg-white px-4 text-sm font-medium">Search</button>
        <MediaUploadControl
          compact
          onRegistered={(asset) => {
            setItems((current) => [asset, ...current.filter((item) => item.id !== asset.id)]);
            onSelect(asset.id);
          }}
        />
      </div>
      {selectedMediaAssetId ? (
        <button type="button" onClick={() => onSelect(null)} className="mt-3 text-xs font-medium text-slate-500">
          Clear selected image
        </button>
      ) : null}
      <div className="mt-4 grid max-h-72 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3">
        {items.map((item) => {
          const selected = item.id === selectedMediaAssetId;
          return (
            <button
              type="button"
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`overflow-hidden rounded-xl border text-left ${selected ? "border-[#0064E0] ring-2 ring-blue-100" : "border-slate-200"}`}
            >
              <div className="relative aspect-square bg-white">
                <Image src={item.thumbnailUrl} alt="" fill unoptimized className="object-cover" sizes="160px" />
              </div>
              <p className="truncate p-2 text-xs text-slate-600">{item.originalFilename}</p>
            </button>
          );
        })}
      </div>
      {loading ? <p className="mt-3 text-xs text-slate-400">Loading media…</p> : null}
    </div>
  );
}
