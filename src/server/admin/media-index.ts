import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import { imageKitOriginalUrl, imageKitTransformedUrl } from "../media/imagekit-provider";
import {
  normalizeSearchText,
  paginationMeta,
  parsePage,
  parsePageSize,
  parseSort,
  type AdminPageSize,
} from "./resource-index";

const MEDIA_SORTS = ["newest", "oldest", "name"] as const;
type MediaSort = (typeof MEDIA_SORTS)[number];

export type MediaIndexInput = {
  q: string;
  status: "all" | "READY" | "RETIRED";
  usage: "all" | "in-use" | "unused";
  sort: MediaSort;
  page: number;
  pageSize: AdminPageSize;
};

export function parseMediaIndexParams(params: URLSearchParams): MediaIndexInput {
  const status = params.get("status");
  const usage = params.get("usage");
  return {
    q: normalizeSearchText(params.get("q")),
    status: status === "READY" || status === "RETIRED" ? status : "all",
    usage: usage === "in-use" || usage === "unused" ? usage : "all",
    sort: parseSort(params.get("sort"), MEDIA_SORTS, "newest"),
    page: parsePage(params.get("page")),
    pageSize: parsePageSize(params.get("pageSize")),
  };
}

function whereFor(input: MediaIndexInput): Prisma.MediaAssetWhereInput {
  return {
    ...(input.status === "all" ? {} : { status: input.status }),
    ...(input.q
      ? {
          OR: [
            { originalFilename: { contains: input.q, mode: "insensitive" } },
            { providerFilePath: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(input.usage === "in-use"
      ? { productMedia: { some: {} } }
      : input.usage === "unused"
        ? { productMedia: { none: {} } }
        : {}),
  };
}

export async function listAdminMedia(input: MediaIndexInput) {
  const where = whereFor(input);
  const orderBy: Prisma.MediaAssetOrderByWithRelationInput[] =
    input.sort === "oldest"
      ? [{ createdAt: "asc" }, { id: "asc" }]
      : input.sort === "name"
        ? [{ originalFilename: "asc" }, { id: "asc" }]
        : [{ createdAt: "desc" }, { id: "desc" }];

  const [total, rows] = await Promise.all([
    prisma.mediaAsset.count({ where }),
    prisma.mediaAsset.findMany({
      where,
      orderBy,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
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
    }),
  ]);

  return {
    items: rows.map((asset) => {
      const usages = asset.productMedia.map((usage) => ({
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
    }),
    meta: paginationMeta(input.page, input.pageSize, total),
  };
}

export async function getAdminMediaSummary() {
  const [ready, retired, inUse, unused] = await Promise.all([
    prisma.mediaAsset.count({ where: { status: "READY" } }),
    prisma.mediaAsset.count({ where: { status: "RETIRED" } }),
    prisma.mediaAsset.count({ where: { status: "READY", productMedia: { some: {} } } }),
    prisma.mediaAsset.count({ where: { status: "READY", productMedia: { none: {} } } }),
  ]);
  return { ready, inUse, unused, retired };
}
