import type { CurrencyCode } from "@/domain/constants";
import { formatMoney } from "@/domain/money";

export function RecentOrders({
  orders,
}: {
  orders: Array<{
    id: string;
    reference: string;
    email: string;
    currency: string;
    totalAmount: number;
    status: string;
    createdAt: Date;
  }>;
}) {
  return (
    <section className="mt-6 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_12px_36px_rgba(15,23,42,0.04)]">
      <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-medium tracking-[-0.02em] text-slate-950">
            Recent LIVE orders
          </h2>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-emerald-700">
            Production
          </span>
        </div>
        <p className="mt-1.5 text-sm text-slate-500">
          Latest production purchases. TEST activity is excluded.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-slate-50/80 text-xs uppercase tracking-[0.1em] text-slate-400">
            <tr>
              <th className="px-5 py-3 sm:px-6">Reference</th>
              <th className="px-5 py-3">Customer</th>
              <th className="px-5 py-3">Amount</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 sm:px-6">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                <td className="px-5 py-4 font-mono text-xs sm:px-6">{order.reference}</td>
                <td className="px-5 py-4">{order.email}</td>
                <td className="px-5 py-4 font-medium">
                  {formatMoney(order.totalAmount, order.currency as CurrencyCode, "en")}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    {order.status}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500 sm:px-6">
                  {order.createdAt.toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
