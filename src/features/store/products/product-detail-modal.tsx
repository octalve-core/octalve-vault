"use client";

import { useEffect, useRef } from "react";
import { Check, Plus, X } from "lucide-react";

import type { Locale } from "@/domain/constants";
import { getMessages, translate } from "@/i18n/messages";
import type { ProductViewModel } from "./product-view-model";
import { ProductGallery } from "./product-gallery";

export function ProductDetailModal({
  product,
  locale,
  open,
  added,
  onAdd,
  onClose,
}: {
  product: ProductViewModel;
  locale: Locale;
  open: boolean;
  added: boolean;
  onAdd: () => void;
  onClose: () => void;
}) {
  const messages = getMessages(locale);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleDialogKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key === "Tab") {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        );
        if (focusable.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        } else if (!dialogRef.current?.contains(document.activeElement)) {
          event.preventDefault();
          first?.focus();
        }
      }
    }

    document.addEventListener("keydown", handleDialogKeydown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleDialogKeydown);
      previousFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const modalTitleId = `product-details-${product.id}`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-[2px]"
        onClick={onClose}
        tabIndex={-1}
        aria-label={translate(messages, "product.closeDetails")}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-2xl"
      >
        <div className="grid max-h-[85vh] overflow-y-auto lg:grid-cols-[320px_minmax(0,1fr)]">
          <ProductGallery
            primaryPath={product.imagePath}
            primaryAlt={product.imageAlt}
            gallery={product.gallery}
            compact
          />

          <div className="p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#0064E0]">
                  {product.category}
                </p>
                <h3
                  id={modalTitleId}
                  className="mt-2 text-2xl font-medium tracking-[-0.02em] text-slate-950"
                >
                  {product.title}
                </h3>
                {product.status === "COMING_SOON" ? (
                  <p className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-800">
                    {translate(messages, "product.coming")}
                  </p>
                ) : null}
                <p className="mt-3 text-base font-medium text-slate-950">
                  {product.formattedPrice ?? translate(messages, "product.unavailableCurrency")}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF]"
                aria-label={translate(messages, "product.closeDetails")}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="mt-6 text-sm leading-7 text-slate-600">{product.description}</p>

            {product.businessBenefits.length > 0 ? (
              <div className="mt-8">
                <h4 className="text-sm font-medium uppercase tracking-[0.12em] text-slate-500">
                  {translate(messages, "product.businessBenefits")}
                </h4>
                <ul className="mt-4 space-y-3">
                  {product.businessBenefits.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0A84FF]" />
                      <span className="text-sm leading-7 text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {product.productivityBenefits.length > 0 ? (
              <div className="mt-8">
                <h4 className="text-sm font-medium uppercase tracking-[0.12em] text-slate-500">
                  {translate(messages, "product.productivityImpact")}
                </h4>
                <ul className="mt-4 space-y-3">
                  {product.productivityBenefits.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#29BE3E]" />
                      <span className="text-sm leading-7 text-slate-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <button
              type="button"
              disabled={!product.purchaseAvailable || added}
              onClick={() => { if (product.purchaseAvailable) onAdd(); }}
              className={`mt-8 inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0A84FF] ${
                !product.purchaseAvailable
                  ? "cursor-not-allowed bg-slate-100 text-slate-400"
                  : added
                    ? "cursor-default bg-emerald-50 text-emerald-700"
                    : "bg-[#0064E0] text-white hover:bg-[#0057C2]"
              }`}
            >
              {added ? <Check className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              {product.status === "COMING_SOON"
                ? translate(messages, "product.coming")
                : !product.purchaseAvailable
                  ? translate(messages, "product.unavailableCurrency")
                  : added
                    ? translate(messages, "product.added")
                    : translate(messages, "product.add")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
