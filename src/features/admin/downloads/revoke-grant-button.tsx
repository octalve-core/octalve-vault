"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AdminActionStatus,
  type AdminActionFeedback,
} from "@/features/admin/shared/admin-action-status";
import { ConfirmActionDialog } from "@/features/admin/shared/confirm-action-dialog";

export function RevokeGrantButton({ grantId }: { grantId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<AdminActionFeedback>({
    state: "idle",
    message: null,
  });

  async function revoke() {
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
        onClick={() => setConfirmOpen(true)}
        className="inline-flex min-w-20 items-center justify-center rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? "Revoking..." : "Revoke"}
      </button>
      <AdminActionStatus feedback={feedback} />
      <ConfirmActionDialog
        open={confirmOpen}
        title="Revoke download access?"
        description="This prevents this customer from authorizing future downloads for the grant."
        confirmLabel="Revoke access"
        pendingLabel="Revoking..."
        pending={busy}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          if (busy) return;
          await revoke();
          setConfirmOpen(false);
        }}
      />
    </div>
  );
}
