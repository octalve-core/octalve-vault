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

export type AdminProductMediaDto = {
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

export async function getAdminProductMedia(productId: string): Promise<AdminProductMediaDto[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      primaryMediaId: true,
      media: {
        orderBy: [{ position: "asc" }, { id: "asc" }],
        include: { mediaAsset: true },
      },
    },
  });
  if (!product) return [];
  return product.media.map((item) => ({
    id: item.id,
    mediaAssetId: item.mediaAssetId,
    altText: item.altText,
    position: item.position,
    isPrimary: item.id === product.primaryMediaId,
    originalFilename: item.mediaAsset.originalFilename,
    publicUrl: imageKitOriginalUrl(item.mediaAsset.providerFilePath),
    thumbnailUrl: imageKitTransformedUrl(item.mediaAsset.providerFilePath, "thumbnail"),
    width: item.mediaAsset.width,
    height: item.mediaAsset.height,
  }));
}

export async function attachProductMedia(
  actorAdminId: string,
  productId: string,
  mediaAssetId: string,
) {
  let createdId = "";
  try {
    await prisma.$transaction(async (tx) => {
      const [product, asset, existing, last] = await Promise.all([
        tx.product.findUnique({
          where: { id: productId },
          select: { id: true, primaryMediaId: true },
        }),
        tx.mediaAsset.findUnique({ where: { id: mediaAssetId } }),
        tx.productMedia.findUnique({
          where: { productId_mediaAssetId: { productId, mediaAssetId } },
        }),
        tx.productMedia.findFirst({
          where: { productId },
          orderBy: [{ position: "desc" }, { id: "desc" }],
          select: { position: true },
        }),
      ]);
      if (!product) throw Object.assign(new Error("Product not found."), { status: 404 });
      if (!asset || asset.status !== "READY") {
        throw Object.assign(new Error("Only READY media can be added to a product."), { status: 409 });
      }
      if (existing) {
        throw Object.assign(new Error("Image is already assigned to this product."), { status: 409 });
      }

      const created = await tx.productMedia.create({
        data: {
          productId,
          mediaAssetId,
          position: (last?.position ?? -1) + 1,
        },
      });
      createdId = created.id;
      if (!product.primaryMediaId) {
        await tx.product.update({
          where: { id: productId },
          data: { primaryMediaId: created.id },
        });
      }
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw Object.assign(new Error("Image is already assigned to this product."), { status: 409 });
    }
    throw error;
  }

  await writeAdminAudit({
    actorAdminId,
    action: "PRODUCT_MEDIA_ATTACHED",
    entityType: "ProductMedia",
    entityId: createdId,
    metadata: { productId, mediaAssetId },
  });
}

async function requireProductMedia(productId: string, productMediaId: string) {
  const item = await prisma.productMedia.findFirst({
    where: { id: productMediaId, productId },
    include: { mediaAsset: true },
  });
  if (!item) throw Object.assign(new Error("Product media not found."), { status: 404 });
  return item;
}

export async function setPrimaryProductMedia(
  actorAdminId: string,
  productId: string,
  productMediaId: string,
) {
  const item = await requireProductMedia(productId, productMediaId);
  if (item.mediaAsset.status !== "READY") {
    throw Object.assign(new Error("Retired media cannot be primary."), { status: 409 });
  }
  await prisma.product.update({
    where: { id: productId },
    data: { primaryMediaId: productMediaId },
  });
  await writeAdminAudit({
    actorAdminId,
    action: "PRODUCT_MEDIA_PRIMARY_SET",
    entityType: "ProductMedia",
    entityId: productMediaId,
    metadata: { productId },
  });
}

export async function updateProductMediaAlt(
  actorAdminId: string,
  productId: string,
  productMediaId: string,
  altText: string | null,
) {
  await requireProductMedia(productId, productMediaId);
  const clean = altText?.trim() || null;
  if (clean && clean.length > 300) {
    throw Object.assign(new Error("Alt text must be at most 300 characters."), { status: 400 });
  }
  await prisma.productMedia.update({
    where: { id: productMediaId },
    data: { altText: clean },
  });
  await writeAdminAudit({
    actorAdminId,
    action: "PRODUCT_MEDIA_ALT_UPDATED",
    entityType: "ProductMedia",
    entityId: productMediaId,
    metadata: { productId },
  });
}

export async function reorderProductMedia(
  actorAdminId: string,
  productId: string,
  orderedIds: string[],
) {
  if (orderedIds.length !== new Set(orderedIds).size) {
    throw Object.assign(new Error("Gallery order contains duplicate media identifiers."), { status: 400 });
  }
  const current = await prisma.productMedia.findMany({
    where: { productId },
    select: { id: true },
  });
  const currentIds = current.map((item) => item.id).sort();
  const requested = [...orderedIds].sort();
  if (
    currentIds.length !== requested.length ||
    currentIds.some((id, index) => id !== requested[index])
  ) {
    throw Object.assign(
      new Error("Gallery order must contain exactly this product's media."),
      { status: 409 },
    );
  }
  if (orderedIds.length > 0) {
    await prisma.$transaction(
      orderedIds.map((id, position) =>
        prisma.productMedia.update({ where: { id }, data: { position } }),
      ),
    );
  }
  await writeAdminAudit({
    actorAdminId,
    action: "PRODUCT_MEDIA_REORDERED",
    entityType: "Product",
    entityId: productId,
    metadata: { count: orderedIds.length },
  });
}

export async function detachProductMedia(
  actorAdminId: string,
  productId: string,
  productMediaId: string,
) {
  await requireProductMedia(productId, productMediaId);
  await prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({
      where: { id: productId },
      select: { primaryMediaId: true },
    });
    if (!product) throw Object.assign(new Error("Product not found."), { status: 404 });

    await tx.productMedia.delete({ where: { id: productMediaId } });

    if (product.primaryMediaId === productMediaId) {
      const next = await tx.productMedia.findFirst({
        where: { productId },
        orderBy: [{ position: "asc" }, { id: "asc" }],
        select: { id: true },
      });
      await tx.product.update({
        where: { id: productId },
        data: { primaryMediaId: next?.id ?? null },
      });
    }
  });
  await writeAdminAudit({
    actorAdminId,
    action: "PRODUCT_MEDIA_DETACHED",
    entityType: "ProductMedia",
    entityId: productMediaId,
    metadata: { productId },
  });
}
