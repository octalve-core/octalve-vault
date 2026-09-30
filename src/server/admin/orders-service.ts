import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import {
  buildOrderOrderBy,
  buildOrderWhere,
  orderIndexActiveFilters,
  orderIndexWindow,
  type OrderIndexInput,
} from "./orders-index";
import { paginationMeta, type ResourceIndexResult } from "./resource-index";

const orderInclude = {
  items: {
    select: {
      productTitle: true,
      quantity: true,
    },
  },
  payments: {
    orderBy: { createdAt: "desc" as const },
    select: {
      provider: true,
      environment: true,
      status: true,
      providerReference: true,
    },
  },
} satisfies Prisma.OrderInclude;

export type AdminOrderListItem = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

export type AdminOrderSummary = {
  liveOrders: number;
  paidFulfilled: number;
  pendingInProgress: number;
  refunded: number;
};

export async function listAdminOrders(
  input: OrderIndexInput,
): Promise<ResourceIndexResult<AdminOrderListItem>> {
  const where = buildOrderWhere(input);
  const { skip, take } = orderIndexWindow(input);
  const [total, items] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: buildOrderOrderBy(input),
      skip,
      take,
    }),
  ]);

  return {
    items,
    meta: paginationMeta(input.page, input.pageSize, total),
    activeFilters: orderIndexActiveFilters(input),
  };
}

export async function getAdminOrderSummary(): Promise<AdminOrderSummary> {
  const [liveOrders, paidFulfilled, pendingInProgress, refunded] =
    await Promise.all([
      prisma.order.count({
        where: {
          payments: {
            some: {
              environment: "LIVE",
            },
          },
        },
      }),
      prisma.order.count({
        where: {
          status: {
            in: ["PAID", "FULFILLED", "PARTIALLY_FULFILLED"],
          },
          payments: {
            some: {
              environment: "LIVE",
              status: "SUCCEEDED",
            },
          },
        },
      }),
      prisma.order.count({
        where: {
          status: {
            in: ["PENDING", "INITIALIZED"],
          },
          payments: {
            some: {
              environment: "LIVE",
            },
          },
        },
      }),
      prisma.order.count({
        where: {
          status: {
            in: ["PARTIALLY_REFUNDED", "REFUNDED"],
          },
          payments: {
            some: {
              environment: "LIVE",
              status: {
                in: ["PARTIALLY_REFUNDED", "REFUNDED"],
              },
            },
          },
        },
      }),
    ]);

  return {
    liveOrders,
    paidFulfilled,
    pendingInProgress,
    refunded,
  };
}
