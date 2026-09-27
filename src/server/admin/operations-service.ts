import { prisma } from "../../lib/prisma";

export async function getDashboardData() {
  const [products, paidOrders, grants, customers, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count({ where: { status: { in: ["PAID", "FULFILLED", "PARTIALLY_FULFILLED"] } } }),
    prisma.downloadGrant.count({ where: { revokedAt: null } }),
    prisma.order.groupBy({ by: ["email"], where: { status: { in: ["PAID", "FULFILLED", "PARTIALLY_FULFILLED"] } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 8, select: { id: true, reference: true, email: true, currency: true, totalAmount: true, status: true, createdAt: true } }),
  ]);
  return { products, paidOrders, grants, customers: customers.length, recentOrders };
}

export async function listAdminOrders() {
  return prisma.order.findMany({ include: { items: true, payments: true }, orderBy: { createdAt: "desc" }, take: 200 });
}

export async function listAdminDownloads() {
  return prisma.downloadGrant.findMany({ include: { orderItem: { include: { order: true, product: true } }, productAsset: true }, orderBy: { createdAt: "desc" }, take: 200 });
}

export async function listAdminCustomers() {
  const rows = await prisma.order.findMany({ where: { status: { in: ["PAID", "FULFILLED", "PARTIALLY_FULFILLED"] } }, select: { email: true, totalAmount: true, currency: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  const map = new Map<string, { email: string; orders: number; lastOrderAt: Date; totals: Record<string, number> }>();
  for (const row of rows) {
    const current = map.get(row.email) ?? { email: row.email, orders: 0, lastOrderAt: row.createdAt, totals: {} };
    current.orders += 1;
    if (row.createdAt > current.lastOrderAt) current.lastOrderAt = row.createdAt;
    current.totals[row.currency] = (current.totals[row.currency] ?? 0) + row.totalAmount;
    map.set(row.email, current);
  }
  return [...map.values()].sort((a, b) => b.lastOrderAt.getTime() - a.lastOrderAt.getTime());
}

export async function listAdminPayments() {
  return prisma.paymentAttempt.findMany({
    include: { order: { select: { reference: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
}
