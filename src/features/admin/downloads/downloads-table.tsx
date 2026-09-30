"use client";
import { adminNotice } from "@/features/admin/shared/admin-notification-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AdminActionStatus,
  type AdminActionFeedback,
} from "@/features/admin/shared/admin-action-status";
import { ConfirmActionDialog } from "@/features/admin/shared/confirm-action-dialog";

type Grant = {
  id: string;
  email: string;
  downloadCount: number;
  revokedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  state: "REVOKED" | "EXPIRED" | "ACTIVE";
  orderItem: {
    productTitle: string;
    order: {
      reference: string;
      status: string;
      payments: Array<{
        provider: string;
        environment: string;
        status: string;
      }>;
    };
  };
};

export function DownloadsTable({ grants }: { grants: Grant[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmGrantId, setConfirmGrantId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<AdminActionFeedback>({
    state: "idle",
    message: null,
  });

  async function revoke(id: string) {
    if (busy !== null) return;

    const noticeId = adminNotice.pending({
      title: "Revoking download access",
      message: "Applying the server-authoritative grant revocation...",
    });
    setBusy(id);
    setFeedback({
      state: "pending",
      message: "Revoking download access...",
    });

    try {
      const response = await fetch(`/api/admin/downloads/${id}/revoke`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to revoke grant.");
      }

      setFeedback({
        state: "success",
        message: "Download access revoked.",
      });
      adminNotice.success(noticeId, {
        title: "Download access revoked",
        message: "Future downloads for this grant are now blocked.",
      });
      router.refresh();
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Unable to revoke grant.";
      setFeedback({
        state: "error",
        message,
      });
      adminNotice.error(noticeId, {
        title: "Access was not revoked",
        message,
      });
    } finally {
      setBusy(null);
    }
  }

  if (!grants.length) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
        No download grants yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[.1em] text-slate-400">
            <tr>
              <th className="px-5 py-4">Product</th>
              <th className="px-5 py-4">Customer</th>
              <th className="px-5 py-4">Downloads</th>
              <th className="px-5 py-4">State</th>
              <th className="px-5 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grants.map((grant) => {
              const state = grant.state;
              const payment = grant.orderItem.order.payments[0];

              return (
                <tr key={grant.id}>
                  <td className="px-5 py-5">
                    <p className="font-medium text-slate-950">
                      {grant.orderItem.productTitle}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {grant.orderItem.order.reference}
                    </p>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {payment
                        ? `${payment.provider} · ${payment.environment} · ${payment.status}`
                        : "No payment evidence"}
                    </p>
                  </td>
                  <td className="px-5 py-5 text-slate-600">{grant.email}</td>
                  <td className="px-5 py-5 text-slate-600">
                    {grant.downloadCount}
                  </td>
                  <td className="px-5 py-5">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        state === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-700"
                          : state === "EXPIRED"
                            ? "bg-amber-50 text-amber-700"
                            : "bg-red-50 text-red-700"
                      }`}
                    >
                      {state}
                    </span>
                  </td>
                  <td className="px-5 py-5 text-right">
                    {state === "ACTIVE" ? (
                      <button
                        type="button"
                        disabled={busy !== null}
                        aria-busy={busy === grant.id}
                        onClick={() => setConfirmGrantId(grant.id)}
                        className="inline-flex min-w-20 items-center justify-center rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busy === grant.id ? "Revoking..." : "Revoke"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminActionStatus feedback={feedback} className="mx-5 mb-5" />
      <ConfirmActionDialog
        open={confirmGrantId !== null}
        title="Revoke download access?"
        description="This prevents future downloads for this customer. Files already downloaded cannot be recalled."
        confirmLabel="Revoke access"
        pendingLabel="Revoking..."
        pending={busy !== null}
        onCancel={() => setConfirmGrantId(null)}
        onConfirm={async () => {
          const id = confirmGrantId;
          if (!id || busy !== null) return;
          await revoke(id);
          setConfirmGrantId(null);
        }}
      />
    </div>
  );
}
