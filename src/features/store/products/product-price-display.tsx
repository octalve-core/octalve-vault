import { getMessages, translate } from "@/i18n/messages";

import type { ProductViewModel } from "./product-view-model";

export function ProductPriceDisplay({
  view,
  compact = false,
}: {
  view: ProductViewModel;
  compact?: boolean;
}) {
  const messages = getMessages(view.locale);

  if (!view.formattedEffectivePrice) {
    return (
      <p
        className={
          compact
            ? "text-base font-medium text-slate-500"
            : "text-3xl font-medium tracking-[-0.04em] text-slate-500"
        }
      >
        {translate(
          messages,
          "product.unavailableCurrency",
        )}
      </p>
    );
  }

  if (
    !view.isOnSale ||
    !view.formattedRegularPrice ||
    view.discountPercent === null
  ) {
    return (
      <p
        className={
          compact
            ? "text-base font-medium text-slate-950"
            : "text-3xl font-medium tracking-[-0.04em] text-slate-950"
        }
      >
        {view.formattedEffectivePrice}
      </p>
    );
  }

  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center gap-x-2 gap-y-1"
          : "flex flex-wrap items-center gap-x-3 gap-y-2"
      }
    >
      <s className="text-sm font-medium text-slate-400">
        <span className="sr-only">
          {translate(
            messages,
            "product.regularPrice",
          )}
          :{" "}
        </span>
        {view.formattedRegularPrice}
      </s>

      <span
        className={
          compact
            ? "text-base font-medium text-slate-950"
            : "text-3xl font-medium tracking-[-0.04em] text-slate-950"
        }
      >
        <span className="sr-only">
          {translate(
            messages,
            "product.salePrice",
          )}
          :{" "}
        </span>
        {view.formattedEffectivePrice}
      </span>

      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
        {view.discountPercent}%{" "}
        {translate(messages, "product.off")}
      </span>
    </div>
  );
}
