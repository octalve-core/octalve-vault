"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AdminActionStatus,
  type AdminActionFeedback,
} from "@/features/admin/shared/admin-action-status";

export function RevokeGrantButton({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<AdminActionFeedback>({
    state: "idle",
    message: null,
  });

  async function revoke() {
    if (!confirm("Revoke this customer's future download access?")) return;
    if (busy) return;

    setBusy(true);
    setFeedback({
      state: "pending",
      message: "Revoking download access...",
    });

    try {
      const response = await fetch(`/api/admin/downloads/${grantId}/revoke`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Unable to revoke this grant.");
      }

      setFeedback({
        state: "success",
        message: "Download access revoked.",
      });
      router.refresh();
    } catch (caught) {
      setFeedback({
        state: "error",
        message:
          caught instanceof Error
            ? caught.message
            : "Unable to revoke this grant.",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid justify-items-end gap-2">
      <button
        type="button"
        disabled={busy}
        aria-busy={busy}
        onClick={revoke}
        className="inline-flex min-w-20 items-center justify-center rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Revoking..." : "Revoke"}
      </button>
      <AdminActionStatus feedback={feedback} />
    </div>
  );
}
