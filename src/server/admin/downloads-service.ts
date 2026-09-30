import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import {
  buildDownloadOrderBy,
  buildDownloadWhere,
  downloadIndexActiveFilters,
  downloadIndexWindow,
  type DownloadIndexInput,
} from "./downloads-index";
import {
  paginationMeta,
  type ResourceIndexResult,
} from "./resource-index";

const downloadInclude = {
  orderItem: {
    include: {
      order: {
        include: {
          payments: {
            orderBy: {
              createdAt: "desc" as const,
            },
            select: {
              provider: true,
              environment: true,
              status: true,
            },
          },
        },
      },
      product: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  },
  productAsset: {
    select: {
      downloadFilename: true,
    },
  },
} satisfies Prisma.DownloadGrantInclude;

export type AdminDownloadListItem =
  Prisma.DownloadGrantGetPayload<{
    include: typeof downloadInclude;
  }>;

export type AdminDownloadSummary = {
  activeLive: number;
  used: number;
  unused: number;
  revokedExpired: number;
};

const ACTIVE_LIVE_PAYMENT = {
  orderItem: {
    order: {
      payments: {
        some: {
          environment: "LIVE" as const,
          status: {
            in: [
              "SUCCEEDED" as const,
              "PARTIALLY_REFUNDED" as const,
            ],
          },
        },
      },
    },
  },
};

const ANY_LIVE_COMMERCIAL_PAYMENT = {
  orderItem: {
    order: {
      payments: {
        some: {
          environment: "LIVE" as const,
          status: {
            in: [
              "SUCCEEDED" as const,
              "PARTIALLY_REFUNDED" as const,
              "REFUNDED" as const,
            ],
          },
        },
      },
    },
  },
};

function activeGrantWhere(
  now: Date,
): Prisma.DownloadGrantWhereInput {
  return {
    revokedAt: null,
    OR: [
      { expiresAt: null },
      { expiresAt: { gt: now } },
    ],
  };
}

export async function listAdminDownloads(
  input: DownloadIndexInput,
  now = new Date(),
): Promise<ResourceIndexResult<AdminDownloadListItem>> {
  const where = buildDownloadWhere(input, now);
  const { skip, take } = downloadIndexWindow(input);

  const [total, items] = await Promise.all([
    prisma.downloadGrant.count({ where }),
    prisma.downloadGrant.findMany({
      where,
      include: downloadInclude,
      orderBy: buildDownloadOrderBy(input),
      skip,
      take,
    }),
  ]);

  return {
    items,
    meta: paginationMeta(
      input.page,
      input.pageSize,
      total,
    ),
    activeFilters: downloadIndexActiveFilters(input),
  };
}

export async function getAdminDownloadSummary(
  now = new Date(),
): Promise<AdminDownloadSummary> {
  const active = activeGrantWhere(now);

  const [activeLive, used, unused, revokedExpired] =
    await Promise.all([
      prisma.downloadGrant.count({
        where: {
          AND: [active, ACTIVE_LIVE_PAYMENT],
        },
      }),
      prisma.downloadGrant.count({
        where: {
          AND: [
            active,
            ACTIVE_LIVE_PAYMENT,
            { downloadCount: { gt: 0 } },
          ],
        },
      }),
      prisma.downloadGrant.count({
        where: {
          AND: [
            active,
            ACTIVE_LIVE_PAYMENT,
            { downloadCount: 0 },
          ],
        },
      }),
      prisma.downloadGrant.count({
        where: {
          AND: [
            ANY_LIVE_COMMERCIAL_PAYMENT,
            {
              OR: [
                { revokedAt: { not: null } },
                {
                  revokedAt: null,
                  expiresAt: {
                    lte: now,
                  },
                },
              ],
            },
          ],
        },
      }),
    ]);

  return {
    activeLive,
    used,
    unused,
    revokedExpired,
  };
}
