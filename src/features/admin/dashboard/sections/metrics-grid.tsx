import { Boxes, CheckCircle2, Download, Users } from "lucide-react";

type DashboardMetrics = {
  products: number;
  paidOrders: number;
  grants: number;
  customers: number;
};

export function MetricsGrid({ data }: { data: DashboardMetrics }) {
  const cards = [
    {
      label: "Products",
      value: data.products,
      helper: "All lifecycle states",
      context: "ALL",
      Icon: Boxes,
      iconClass: "border-blue-100 bg-blue-50 text-blue-600",
      contextClass: "bg-blue-50 text-blue-700",
      accentClass: "border-b-blue-500",
    },
    {
      label: "Paid LIVE orders",
      value: data.paidOrders,
      helper: "Verified production purchases",
      context: "LIVE",
      Icon: CheckCircle2,
      iconClass: "border-violet-100 bg-violet-50 text-violet-600",
      contextClass: "bg-violet-50 text-violet-700",
      accentClass: "border-b-violet-500",
    },
    {
      label: "Active grants",
      value: data.grants,
      helper: "Access unlocked from LIVE purchases",
      context: "LIVE",
      Icon: Download,
      iconClass: "border-amber-100 bg-amber-50 text-amber-600",
      contextClass: "bg-amber-50 text-amber-700",
      accentClass: "border-b-amber-500",
    },
    {
      label: "Customers",
      value: data.customers,
      helper: "Unique LIVE buyers",
      context: "LIVE",
      Icon: Users,
      iconClass: "border-emerald-100 bg-emerald-50 text-emerald-600",
      contextClass: "bg-emerald-50 text-emerald-700",
      accentClass: "border-b-emerald-500",
    },
  ] as const;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ label, value, helper, context, Icon, iconClass, contextClass, accentClass }) => (
        <article
          key={label}
          className={`rounded-[28px] border border-slate-200 border-b-[3px] ${accentClass} bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.04)]`}
        >
          <div className="flex items-center gap-5">
            <span
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border ${iconClass}`}
              aria-hidden="true"
            >
              <Icon className="h-6 w-6" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-3xl font-medium leading-none tracking-[-0.04em] text-slate-950">
                  {value}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${contextClass}`}
                >
                  {context}
                </span>
              </div>
              <p className="mt-2 text-base font-medium text-slate-700">{label}</p>
              <p className="mt-1 text-sm leading-5 text-slate-400">{helper}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
