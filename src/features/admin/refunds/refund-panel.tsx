"use client";
import { adminNotice } from "@/features/admin/shared/admin-notification-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AdminActionStatus,
  type AdminActionFeedback,
} from "@/features/admin/shared/admin-action-status";
import { ConfirmActionDialog } from "@/features/admin/shared/confirm-action-dialog";

type Order = {
  id: string;
  reference: string;
  email: string;
  totalAmount: number;
  currency: string;
};

type Refund = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  createdAt: string;
  order: {
    reference: string;
    email: string;
  };
};

export function RefundPanel({
  orders,
  refunds,
  canCreate,
}: {
  orders: Order[];
  refunds: Refund[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRefundForm, setPendingRefundForm] = useState<FormData | null>(null);
  const [feedback, setFeedback] = useState<AdminActionFeedback>({
    state: "idle",
    message: null,
  });

  async function sync(id: string) {
    if (syncingId !== null) return;
    const noticeId = adminNotice.pending({
      title: "Checking refund status",
      message: "Refreshing the latest provider-confirmed refund state...",
    });

    setSyncingId(id);
    setFeedback({
      state: "pending",
      message: "Syncing refund status...",
    });

    try {
      const response = await fetch(`/api/admin/refunds/${id}/refresh`, {
        method: "POST",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Unable to sync refund.");
      }

      setFeedback({
        state: "success",
        message: "Refund status refreshed.",
      });
      adminNotice.success(noticeId, {
        title: "Refund status refreshed",
        message: "The latest provider-confirmed state is now displayed.",
      });
      router.refresh();
    } catch (caught) {
      const noticeMessage =
        caught instanceof Error ? caught.message : "Unable to sync refund.";
      adminNotice.error(noticeId, {
        title: "Refund status check failed",
        message: noticeMessage,
      });
      setFeedback({
        state: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Unable to sync refund.",
      });
    } finally {
      setSyncingId(null);
    }
  }

  function requestRefund(form: FormData) {
    if (submitting) return;

    const amountMajor = Number(form.get("amountMajor"));

    if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
      setFeedback({
        state: "error",
        message: "Enter a positive refund amount.",
      });
      return;
    }

    setPendingRefundForm(form);
  }

  async function submit(form: FormData) {
    if (submitting) return;

    const amountMajor = Number(form.get("amountMajor"));

    if (!Number.isFinite(amountMajor) || amountMajor <= 0) {
      setFeedback({
        state: "error",
        message: "Enter a positive refund amount.",
      });
      return;
    }

    const noticeId = adminNotice.pending({
      title: "Initiating refund",
      message: "Submitting the validated request to the payment provider...",
    });
    setSubmitting(true);
    setFeedback({
      state: "pending",
      message: "Submitting refund request...",
    });

    try {
      const response = await fetch("/api/admin/refunds", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId: form.get("orderId"),
          amountMinor: Math.round(amountMajor * 100),
          reason: form.get("reason"),
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Refund failed.");
      }

      setFeedback({
        state: "success",
        message: "Refund initiated.",
      });
      adminNotice.success(noticeId, {
        title: "Refund initiated",
        message:
          "The provider accepted the request. Use Sync for the latest confirmed status.",
      });
      router.refresh();
    } catch (caught) {
      const noticeMessage =
        caught instanceof Error ? caught.message : "Refund failed.";
      adminNotice.error(noticeId, {
        title: "Refund was not initiated",
        message: noticeMessage,
      });
      setFeedback({
        state: "error",
        message:
          caught instanceof Error ? caught.message : "Refund failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-7 space-y-4">
      <AdminActionStatus feedback={feedback} />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-medium text-slate-950">Refund history</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {refunds.length ? (
              refunds.map((refund) => (
                <div key={refund.id} className="p-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">
                        {refund.order.reference} · {refund.currency}{" "}
                        {(refund.amount / 100).toFixed(2)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {refund.order.email} · {" "}
                        {refund.reason || "No reason supplied"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {refund.status}
                      </span>

                      {!["SUCCEEDED", "FAILED", "CANCELLED"].includes(
                        refund.status,
                      ) ? (
                        <button
                          type="button"
                          disabled={syncingId !== null}
                          aria-busy={syncingId === refund.id}
                          onClick={() => void sync(refund.id)}
                          className="inline-flex min-w-20 items-center justify-center rounded-full border border-blue-200 px-3 py-1.5 text-xs font-medium text-[#0064E0] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {syncingId === refund.id ? "Syncing..." : "Sync"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-sm text-slate-500">
                No refunds have been initiated.
              </p>
            )}
          </div>
        </div>

        {canCreate ? (
          <form
            action={requestRefund}
            className="h-fit rounded-[28px] border border-slate-200 bg-white p-6"
          >
            <h2 className="font-medium text-slate-950">Initiate refund</h2>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              This calls the payment provider. It does not merely change the
              local database.
            </p>

            <select
              name="orderId"
              required
              className="mt-5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm"
            >
              <option value="">Select paid order</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.reference} · {order.currency}{" "}
                  {(order.totalAmount / 100).toFixed(2)}
                </option>
              ))}
            </select>

            <input
              name="amountMajor"
              type="number"
              min="0.01"
              step="0.01"
              required
              placeholder="Refund amount"
              className="mt-3 h-11 w-full rounded-xl border border-slate-200 px-3"
            />

            <textarea
              name="reason"
              required
              maxLength={500}
              rows={4}
              placeholder="Reason for refund"
              className="mt-3 w-full rounded-xl border border-slate-200 p-3"
            />

            <button
              disabled={submitting}
              aria-busy={submitting}
              className="mt-4 inline-flex min-w-48 items-center justify-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Initiate provider refund"}
            </button>
          </form>
        ) : null}
      </div>

      <ConfirmActionDialog
        open={pendingRefundForm !== null}
        title="Initiate provider refund?"
        description="This sends a refund request to the configured payment provider. Confirm the amount and reason before continuing."
        confirmLabel="Initiate refund"
        pendingLabel="Submitting..."
        pending={submitting}
        onCancel={() => setPendingRefundForm(null)}
        onConfirm={async () => {
          const form = pendingRefundForm;
          if (!form || submitting) return;
          await submit(form);
          setPendingRefundForm(null);
        }}
      />
    </div>
  );
}
