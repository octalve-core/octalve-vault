import type { LucideIcon } from "lucide-react";

export type AdminSummaryTone =
  | "blue"
  | "violet"
  | "amber"
  | "emerald"
  | "rose"
  | "slate";

export type AdminSummaryItem = {
  label: string;
  value: number;
  helper: string;
  context?: string;
  tone: AdminSummaryTone;
  icon: LucideIcon;
};

const TONE_CLASSES: Record<
  AdminSummaryTone,
  {
    icon: string;
    context: string;
    accent: string;
  }
> = {
  blue: {
    icon: "border-blue-100 bg-blue-50 text-blue-600",
    context: "bg-blue-50 text-blue-700",
    accent: "border-b-blue-500",
  },
  violet: {
    icon: "border-violet-100 bg-violet-50 text-violet-600",
    context: "bg-violet-50 text-violet-700",
    accent: "border-b-violet-500",
  },
  amber: {
    icon: "border-amber-100 bg-amber-50 text-amber-600",
    context: "bg-amber-50 text-amber-700",
    accent: "border-b-amber-500",
  },
  emerald: {
    icon: "border-emerald-100 bg-emerald-50 text-emerald-600",
    context: "bg-emerald-50 text-emerald-700",
    accent: "border-b-emerald-500",
  },
  rose: {
    icon: "border-rose-100 bg-rose-50 text-rose-600",
    context: "bg-rose-50 text-rose-700",
    accent: "border-b-rose-500",
  },
  slate: {
    icon: "border-slate-200 bg-slate-50 text-slate-600",
    context: "bg-slate-100 text-slate-700",
    accent: "border-b-slate-400",
  },
};

export function AdminSummaryGrid({ items }: { items: AdminSummaryItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => {
        const tone = TONE_CLASSES[item.tone];
        const Icon = item.icon;

        return (
          <article
            key={item.label}
            className={`rounded-[28px] border border-slate-200 border-b-[3px] ${tone.accent} bg-white p-6 shadow-[0_12px_36px_rgba(15,23,42,0.04)]`}
          >
            <div className="flex items-center gap-5">
              <span
                className={`grid h-14 w-14 shrink-0 place-items-center rounded-[20px] border ${tone.icon}`}
                aria-hidden="true"
              >
                <Icon className="h-6 w-6" strokeWidth={1.9} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-3xl font-medium leading-none tracking-[-0.04em] text-slate-950">
                    {item.value}
                  </p>

                  {item.context ? (
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${tone.context}`}
                    >
                      {item.context}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-base font-medium text-slate-700">
                  {item.label}
                </p>
                <p className="mt-1 text-sm leading-5 text-slate-400">
                  {item.helper}
                </p>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
