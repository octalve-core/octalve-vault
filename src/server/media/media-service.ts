import { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { writeAdminAudit } from "../admin/audit";
import {
  fetchImageKitAsset,
  fetchImageSignatureFromImageKit,
  imageKitOriginalUrl,
  imageKitTransformedUrl,
} from "./imagekit-provider";
import { sanitizeMediaFilename, validateProviderImage } from "./media-validation";

export type MediaUsageDto = { productId: string; slug: string; title: string };

export type AdminMediaAssetDto = {
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
  usages: MediaUsageDto[];
  createdAt: string;
  retiredAt: string | null;
};

type SerializableMedia = {
  id: string;
  providerAssetId: string;
  providerFilePath: string;
  originalFilename: string;
  mimeType: string;
  width: number;
  height: number;
  sizeBytes: bigint;
  status: "READY" | "RETIRED";
  createdAt: Date;
  retiredAt: Date | null;
  productMedia?: Array<{
    product: {
      id: string;
      slug: string;
      translations: Array<{ title: string }>;
    };
  }>;
};

export function serializeMediaAsset(asset: SerializableMedia): AdminMediaAssetDto {
  const usages = (asset.productMedia ?? []).map((usage) => ({
    productId: usage.product.id,
    slug: usage.product.slug,
    title: usage.product.translations[0]?.title ?? usage.product.slug,
  }));
  return {
    id: asset.id,
    providerAssetId: asset.providerAssetId,
    providerFilePath: asset.providerFilePath,
    originalFilename: asset.originalFilename,
    mimeType: asset.mimeType,
    width: asset.width,
    height: asset.height,
    sizeBytes: asset.sizeBytes.toString(),
    status: asset.status,
    publicUrl: imageKitOriginalUrl(asset.providerFilePath),
    thumbnailUrl: imageKitTransformedUrl(asset.providerFilePath, "thumbnail"),
    usageCount: usages.length,
    usages,
    createdAt: asset.createdAt.toISOString(),
    retiredAt: asset.retiredAt?.toISOString() ?? null,
  };
}

export async function registerMediaAsset(
  actorAdminId: string,
  input: { providerAssetId: string; originalFilename: string },
): Promise<AdminMediaAssetDto> {
  const originalFilename = sanitizeMediaFilename(input.originalFilename);
  const provider = await fetchImageKitAsset(input.providerAssetId);
  const expectedMime = validateProviderImage(provider);
  const signatureMime = await fetchImageSignatureFromImageKit(provider.filePath);
  if (!signatureMime || signatureMime !== expectedMime) {
    throw Object.assign(new Error("Uploaded image signature does not match its verified type."), { status: 400 });
  }

  try {
    const asset = await prisma.mediaAsset.create({
      data: {
        provider: "IMAGEKIT",
        providerAssetId: provider.fileId,
        providerFilePath: provider.filePath,
        originalFilename,
        mimeType: provider.mime,
        width: provider.width,
        height: provider.height,
        sizeBytes: BigInt(provider.size),
        status: "READY",
        createdByAdminId: actorAdminId,
      },
    });
    await writeAdminAudit({
      actorAdminId,
      action: "MEDIA_REGISTERED",
      entityType: "MediaAsset",
      entityId: asset.id,
      metadata: {
        providerAssetId: provider.fileId,
        originalFilename,
        width: provider.width,
        height: provider.height,
        sizeBytes: provider.size,
      },
    });
    return serializeMediaAsset(asset);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw Object.assign(new Error("Image is already registered in the Media Library."), { status: 409 });
    }
    throw error;
  }
}

export async function retireMediaAsset(
  actorAdminId: string,
  mediaAssetId: string,
): Promise<AdminMediaAssetDto> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id: mediaAssetId },
    include: {
      productMedia: {
        select: {
          product: {
            select: {
              id: true,
              slug: true,
              translations: {
                where: { locale: "en" },
                select: { title: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
  if (!asset) throw Object.assign(new Error("Media asset not found."), { status: 404 });
  if (asset.productMedia.length > 0) {
    throw Object.assign(
      new Error(
        `This image is still used by ${asset.productMedia.length} product${
          asset.productMedia.length === 1 ? "" : "s"
        }. Remove or replace those usages first.`,
      ),
      { status: 409 },
    );
  }
  if (asset.status === "RETIRED") return serializeMediaAsset(asset);

  const updated = await prisma.mediaAsset.update({
    where: { id: mediaAssetId },
    data: { status: "RETIRED", retiredAt: new Date() },
    include: {
      productMedia: {
        select: {
          product: {
            select: {
              id: true,
              slug: true,
              translations: {
                where: { locale: "en" },
                select: { title: true },
                take: 1,
              },
            },
          },
        },
      },
    },
  });
  await writeAdminAudit({
    actorAdminId,
    action: "MEDIA_RETIRED",
    entityType: "MediaAsset",
    entityId: mediaAssetId,
  });
  return serializeMediaAsset(updated);
}
