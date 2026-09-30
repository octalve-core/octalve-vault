import type { Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import {
  buildPaymentOrderBy,
  buildPaymentWhere,
  paymentIndexActiveFilters,
  paymentIndexWindow,
  type PaymentIndexInput,
} from "./payments-index";
import { paginationMeta, type ResourceIndexResult } from "./resource-index";

const paymentInclude = {
  order: {
    select: {
      reference: true,
      email: true,
    },
  },
} satisfies Prisma.PaymentAttemptInclude;

export type AdminPaymentListItem = Prisma.PaymentAttemptGetPayload<{
  include: typeof paymentInclude;
}>;

export type AdminPaymentSummary = {
  liveAttempts: number;
  successful: number;
  pendingProcessing: number;
  refunded: number;
};

export async function listAdminPayments(
  input: PaymentIndexInput,
): Promise<ResourceIndexResult<AdminPaymentListItem>> {
  const where = buildPaymentWhere(input);
  const { skip, take } = paymentIndexWindow(input);

  const [total, items] = await Promise.all([
    prisma.paymentAttempt.count({ where }),
    prisma.paymentAttempt.findMany({
      where,
      include: paymentInclude,
      orderBy: buildPaymentOrderBy(input),
      skip,
      take,
    }),
  ]);

  return {
    items,
    meta: paginationMeta(input.page, input.pageSize, total),
    activeFilters: paymentIndexActiveFilters(input),
  };
}

export async function getAdminPaymentSummary(): Promise<AdminPaymentSummary> {
  const [liveAttempts, successful, pendingProcessing, refunded] =
    await Promise.all([
      prisma.paymentAttempt.count({
        where: {
          environment: "LIVE",
        },
      }),
      prisma.paymentAttempt.count({
        where: {
          environment: "LIVE",
          status: "SUCCEEDED",
        },
      }),
      prisma.paymentAttempt.count({
        where: {
          environment: "LIVE",
          status: {
            in: ["PENDING", "INITIALIZED", "PROCESSING"],
          },
        },
      }),
      prisma.paymentAttempt.count({
        where: {
          environment: "LIVE",
          status: {
            in: ["PARTIALLY_REFUNDED", "REFUNDED"],
          },
        },
      }),
    ]);

  return {
    liveAttempts,
    successful,
    pendingProcessing,
    refunded,
  };
}
