"use client";

import { upload } from "@imagekit/next";
import { useRef, useState } from "react";

import { adminNotice } from "@/features/admin/shared/admin-notification-provider";

export type MediaUsage = { productId: string; slug: string; title: string };
export type MediaLibraryItem = {
  id: string;
  providerAssetId: string;
  providerFilePath: string;
  originalFilename: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: string;
  status: "READY" | "RETIRED";
  publicUrl: string;
  thumbnailUrl: string;
  usageCount: number;
  usages: MediaUsage[];
  createdAt: string;
  retiredAt: string | null;
};

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);
const maxBytes = 10 * 1024 * 1024;
const checks =
  '"file.mime" IN ["image/jpeg","image/png","image/webp","image/avif"] AND "file.size" <= 10485760';

export function MediaUploadControl({
  onRegistered,
  compact = false,
}: {
  onRegistered?: (asset: MediaLibraryItem) => void;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | null) {
    if (!file || busy) return;
    const noticeId = adminNotice.pending({
      title: "Preparing image upload",
      message: "Validating the image and requesting one-time upload access...",
    });
    setBusy(true);

    try {
      if (!allowed.has(file.type)) throw new Error("Only JPEG, PNG, WebP and AVIF images are allowed.");
      if (file.size <= 0 || file.size > maxBytes) {
        throw new Error("Image size must be between 1 byte and 10 MiB.");
      }

      const authResponse = await fetch("/api/admin/media/upload-auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          originalFilename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      const auth = (await authResponse.json()) as {
        token?: string;
        expire?: number;
        signature?: string;
        publicKey?: string;
        fileName?: string;
        folder?: string;
        error?: string;
      };
      if (
        !authResponse.ok ||
        !auth.token ||
        !auth.expire ||
        !auth.signature ||
        !auth.publicKey ||
        !auth.fileName ||
        !auth.folder
      ) {
        throw new Error(auth.error || "Unable to prepare image upload.");
      }

      adminNotice.pending(
        {
          title: "Uploading image",
          message: "Sending the public merchandising image directly to ImageKit...",
        },
        noticeId,
      );

      const result = await upload({
        file,
        fileName: auth.fileName,
        token: auth.token,
        expire: auth.expire,
        signature: auth.signature,
        publicKey: auth.publicKey,
        folder: auth.folder,
        useUniqueFileName: false,
        overwriteFile: false,
        isPrivateFile: false,
        tags: ["octalve-vault", "product-media"],
        checks,
      });
      if (!result.fileId) throw new Error("ImageKit did not return a file identifier.");

      adminNotice.pending(
        {
          title: "Verifying image",
          message: "Octalve is verifying provider metadata and independent image bytes...",
        },
        noticeId,
      );

      const registerResponse = await fetch("/api/admin/media/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          providerAssetId: result.fileId,
          originalFilename: file.name,
        }),
      });
      const registered = (await registerResponse.json()) as {
        asset?: MediaLibraryItem;
        error?: string;
      };
      if (!registerResponse.ok || !registered.asset) {
        throw new Error(
          registered.error || "Image uploaded but could not be verified for Vault use.",
        );
      }

      adminNotice.success(noticeId, {
        title: "Image added to Media Library",
        message: "The server-verified image is ready for product use.",
      });
      onRegistered?.(registered.asset);
      if (inputRef.current) inputRef.current.value = "";
    } catch (caught) {
      adminNotice.error(noticeId, {
        title: "Image upload failed",
        message: caught instanceof Error ? caught.message : "Image upload failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <label
      className={
        compact
          ? "inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full bg-[#0064E0] px-4 text-sm font-medium text-white"
          : "flex min-h-28 cursor-pointer items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center text-sm font-medium text-slate-600"
      }
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept=".jpg,.jpeg,.png,.webp,.avif,image/jpeg,image/png,image/webp,image/avif"
        disabled={busy}
        onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
      />
      {busy ? "Uploading and verifying…" : "Upload image"}
    </label>
  );
}
