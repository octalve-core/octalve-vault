"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RevokeGrantButton({ grantId }: { grantId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  async function revoke() { if (!confirm("Revoke this customer's future download access?")) return; setBusy(true); const response = await fetch(`/api/admin/downloads/${grantId}/revoke`, { method: "POST" }); setBusy(false); if (response.ok) router.refresh(); else alert("Unable to revoke this grant."); }
  return <button type="button" disabled={busy} onClick={revoke} className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-40">{busy ? "Revoking…" : "Revoke"}</button>;
}
