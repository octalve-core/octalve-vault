import type { PaymentProviderId } from "../../domain/constants";
import { prisma } from "../../lib/prisma";
import { getPaymentProvider } from "../payments/registry";

const ACTIVE_LIVE_PAYMENT_STATUSES = [
  "SUCCEEDED",
  "PARTIALLY_REFUNDED",
] as const;

const REFUNDABLE_ORDER_STATUSES = [
  "PAID",
  "FULFILLED",
  "PARTIALLY_FULFILLED",
  "PARTIALLY_REFUNDED",
] as const;

const REFUNDABLE_PAYMENT_STATUSES = [
  "SUCCEEDED",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
] as const;

export async function getDashboardData() {
  const [
    products,
    paidOrders,
    grants,
    customers,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count(),

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

    prisma.downloadGrant.count({
      where: {
        revokedAt: null,
        orderItem: {
          order: {
            payments: {
              some: {
                environment: "LIVE",
                status: {
                  in: [...ACTIVE_LIVE_PAYMENT_STATUSES],
                },
              },
            },
          },
        },
      },
    }),

    prisma.order.groupBy({
      by: ["email"],
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

    prisma.order.findMany({
      where: {
        payments: {
          some: {
            environment: "LIVE",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        reference: true,
        email: true,
        currency: true,
        totalAmount: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    products,
    paidOrders,
    grants,
    customers: customers.length,
    recentOrders,
  };
}

export async function listAdminRefundableOrders() {
  const orders = await prisma.order.findMany({
    where: {
      status: {
        in: [...REFUNDABLE_ORDER_STATUSES],
      },
      payments: {
        some: {
          status: {
            in: [...REFUNDABLE_PAYMENT_STATUSES],
          },
        },
      },
    },
    select: {
      id: true,
      reference: true,
      email: true,
      totalAmount: true,
      currency: true,
      payments: {
        where: {
          status: {
            in: [...REFUNDABLE_PAYMENT_STATUSES],
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          provider: true,
          environment: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 200,
  });

  return orders
    .filter((order) =>
      order.payments.some((attempt) => {
        try {
          const adapter = getPaymentProvider(
            attempt.provider as PaymentProviderId,
          );

          return (
            attempt.environment ===
            adapter.configuredEnvironment()
          );
        } catch {
          return false;
        }
      }),
    )
    .map((order) => ({
      id: order.id,
      reference: order.reference,
      email: order.email,
      totalAmount: order.totalAmount,
      currency: order.currency,
    }));
}
