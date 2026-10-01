"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import type { PublicProductMedia } from "../catalogue/types";

type GalleryItem = PublicProductMedia;

export function ProductGallery({
  primaryPath,
  primaryAlt,
  gallery,
  compact = false,
}: {
  primaryPath: string;
  primaryAlt: string;
  gallery: readonly GalleryItem[];
  compact?: boolean;
}) {
  const items = useMemo(() => {
    const found = gallery.find((item) => item.imagePath === primaryPath);
    const primary: GalleryItem = found ?? {
      id: "resolved-primary",
      imagePath: primaryPath,
      thumbnailPath: primaryPath,
      altText: primaryAlt,
      position: -1,
    };
    return found ? [...gallery] : [primary, ...gallery];
  }, [gallery, primaryAlt, primaryPath]);

  const [selectedId, setSelectedId] = useState(items[0]?.id ?? "resolved-primary");
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  if (!selected) return null;
  const remote = selected.imagePath.startsWith("https://");

  return (
    <div className={compact ? "grid gap-2" : "grid gap-3"}>
      <div className={`relative overflow-hidden bg-slate-100 ${compact ? "min-h-[240px]" : "min-h-[360px] sm:min-h-[520px]"}`}>
        <Image
          src={selected.imagePath}
          alt={selected.altText}
          fill
          priority={!compact}
          unoptimized={remote}
          className="object-cover"
          sizes={compact ? "(max-width:1024px) 100vw, 320px" : "(max-width:1024px) 100vw, 55vw"}
        />
      </div>
      {items.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto p-1">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show image: ${item.altText}`}
              aria-pressed={selected.id === item.id}
              onClick={() => setSelectedId(item.id)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${selected.id === item.id ? "border-[#0064E0]" : "border-transparent"}`}
            >
              <Image
                src={item.thumbnailPath}
                alt=""
                fill
                unoptimized={item.thumbnailPath.startsWith("https://")}
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
