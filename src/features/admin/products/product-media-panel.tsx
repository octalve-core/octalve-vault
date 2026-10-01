"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { MediaPicker } from "@/features/admin/media/media-picker";
import { ConfirmActionDialog } from "@/features/admin/shared/confirm-action-dialog";
import { adminNotice } from "@/features/admin/shared/admin-notification-provider";

export type ProductMediaItem = {
  id: string;
  mediaAssetId: string;
  altText: string | null;
  position: number;
  isPrimary: boolean;
  originalFilename: string;
  publicUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
};

export function ProductMediaPanel({
  productId,
  initialMedia,
  canEdit,
}: {
  productId: string;
  initialMedia: ProductMediaItem[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [removeId, setRemoveId] = useState<string | null>(null);

  async function action(
    pendingTitle: string,
    successTitle: string,
    work: () => Promise<Response>,
  ) {
    if (busy) return;
    const noticeId = adminNotice.pending({ title: pendingTitle });
    setBusy(true);
    try {
      const response = await work();
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Product media action failed.");
      adminNotice.success(noticeId, { title: successTitle });
      router.refresh();
    } catch (caught) {
      adminNotice.error(noticeId, {
        title: "Product media action failed",
        message: caught instanceof Error ? caught.message : "Unable to update product media.",
      });
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= initialMedia.length) return;
    const orderedIds = initialMedia.map((item) => item.id);
    [orderedIds[index], orderedIds[target]] = [orderedIds[target], orderedIds[index]];
    void action("Reordering images", "Gallery order updated", () =>
      fetch(`/api/admin/products/${productId}/media/reorder`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderedIds }),
      }),
    );
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-medium text-slate-950">Product media</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Public merchandising images are stored in ImageKit. Private downloadable ZIP files remain separate.
      </p>

      {canEdit ? (
        <div className="mt-5">
          <MediaPicker
            selectedMediaAssetId={null}
            onSelect={(mediaAssetId) => {
              if (!mediaAssetId) return;
              void action("Adding image to product", "Image added", () =>
                fetch(`/api/admin/products/${productId}/media`, {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ mediaAssetId }),
                }),
              );
            }}
          />
        </div>
      ) : null}

      <div className="mt-5 space-y-4">
        {initialMedia.map((item, index) => (
          <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex gap-4">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                <Image src={item.thumbnailUrl} alt="" fill unoptimized className="object-cover" sizes="96px" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-medium text-slate-950">{item.originalFilename}</p>
                  {item.isPrimary ? (
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-medium text-blue-700">Primary</span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-slate-400">{item.width}×{item.height}</p>
                {canEdit ? (
                  <form
                    className="mt-3 flex gap-2"
                    action={(formData) =>
                      void action("Saving alt text", "Alt text updated", () =>
                        fetch(`/api/admin/products/${productId}/media/${item.id}`, {
                          method: "PATCH",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({ altText: String(formData.get("altText") || "") }),
                        }),
                      )
                    }
                  >
                    <input name="altText" maxLength={300} defaultValue={item.altText ?? ""} placeholder="Alt text (defaults to product title)" className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-xs" />
                    <button disabled={busy} className="rounded-full border border-slate-200 px-3 text-xs font-medium">Save</button>
                  </form>
                ) : null}
              </div>
            </div>
            {canEdit ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {!item.isPrimary ? (
                  <button disabled={busy} type="button" onClick={() => void action("Setting primary image", "Primary image updated", () => fetch(`/api/admin/products/${productId}/media/${item.id}/primary`, { method: "POST" }))} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium">Set primary</button>
                ) : null}
                <button disabled={busy || index === 0} type="button" onClick={() => move(index, -1)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium disabled:opacity-40">Move up</button>
                <button disabled={busy || index === initialMedia.length - 1} type="button" onClick={() => move(index, 1)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium disabled:opacity-40">Move down</button>
                <button disabled={busy} type="button" onClick={() => void navigator.clipboard.writeText(item.publicUrl)} className="rounded-full border border-slate-200 px-3 py-2 text-xs font-medium">Copy URL</button>
                <button disabled={busy} type="button" onClick={() => setRemoveId(item.id)} className="rounded-full border border-red-200 px-3 py-2 text-xs font-medium text-red-700">Remove</button>
              </div>
            ) : null}
          </article>
        ))}
        {initialMedia.length === 0 ? (
          <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            No first-class product media yet. The legacy image fallback remains active.
          </p>
        ) : null}
      </div>

      <ConfirmActionDialog
        open={removeId !== null}
        title="Remove image from this product?"
        description="The Media Library asset will remain available for reuse. If this is the primary image, Octalve will promote the next gallery image or fall back to the legacy product image."
        confirmLabel="Remove image"
        pendingLabel="Removing…"
        pending={busy}
        onCancel={() => setRemoveId(null)}
        onConfirm={() => {
          const id = removeId;
          if (!id) return;
          void action("Removing image", "Image removed", () =>
            fetch(`/api/admin/products/${productId}/media/${id}`, { method: "DELETE" }),
          ).finally(() => setRemoveId(null));
        }}
      />
    </section>
  );
}
