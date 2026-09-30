import { prisma } from "../../lib/prisma";
import {
  customerGroupHaving,
  customerGroupOrderBy,
  customerIndexActiveFilters,
  customerIndexWindow,
  qualifyingCustomerOrderWhere,
  type CustomerIndexInput,
} from "./customers-index";
import {
  paginationMeta,
  type ResourceIndexResult,
} from "./resource-index";

export type AdminCustomerRow = {
  email: string;
  orders: number;
  lastOrderAt: Date;
  totals: Record<string, number>;
};

export type AdminCustomerSummary = {
  liveCustomers: number;
  repeatBuyers: number;
  singleOrderBuyers: number;
  paidLiveOrders: number;
};

export async function listAdminCustomers(
  input: CustomerIndexInput,
): Promise<ResourceIndexResult<AdminCustomerRow>> {
  const where = qualifyingCustomerOrderWhere(input);
  const having = customerGroupHaving(input);
  const { skip, take } = customerIndexWindow(input);

  const [allGroups, pageGroups] = await Promise.all([
    prisma.order.groupBy({
      by: ["email"],
      where,
      having,
      _count: {
        email: true,
      },
      _max: {
        createdAt: true,
      },
    }),
    prisma.order.groupBy({
      by: ["email"],
      where,
      having,
      _count: {
        email: true,
      },
      _max: {
        createdAt: true,
      },
      orderBy: customerGroupOrderBy(input),
      skip,
      take,
    }),
  ]);

  const emails = pageGroups.map((group) => group.email);

  const totals =
    emails.length > 0
      ? await prisma.order.groupBy({
          by: ["email", "currency"],
          where: {
            AND: [
              qualifyingCustomerOrderWhere({
                query: "",
                currency: input.currency,
              }),
              {
                email: {
                  in: emails,
                },
              },
            ],
          },
          _sum: {
            totalAmount: true,
          },
        })
      : [];

  const totalsByEmail = new Map<
    string,
    Record<string, number>
  >();

  for (const total of totals) {
    const current =
      totalsByEmail.get(total.email) ?? {};
    current[total.currency] =
      total._sum.totalAmount ?? 0;
    totalsByEmail.set(total.email, current);
  }

  const items: AdminCustomerRow[] = pageGroups.map(
    (group) => ({
      email: group.email,
      orders: group._count.email,
      lastOrderAt:
        group._max.createdAt ?? new Date(0),
      totals: totalsByEmail.get(group.email) ?? {},
    }),
  );

  return {
    items,
    meta: paginationMeta(
      input.page,
      input.pageSize,
      allGroups.length,
    ),
    activeFilters: customerIndexActiveFilters(input),
  };
}

export async function getAdminCustomerSummary(): Promise<AdminCustomerSummary> {
  const where = qualifyingCustomerOrderWhere();

  const [groups, paidLiveOrders] = await Promise.all([
    prisma.order.groupBy({
      by: ["email"],
      where,
      _count: {
        email: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  let repeatBuyers = 0;
  let singleOrderBuyers = 0;

  for (const group of groups) {
    if (group._count.email >= 2) repeatBuyers += 1;
    else if (group._count.email === 1) {
      singleOrderBuyers += 1;
    }
  }

  return {
    liveCustomers: groups.length,
    repeatBuyers,
    singleOrderBuyers,
    paidLiveOrders,
  };
}
