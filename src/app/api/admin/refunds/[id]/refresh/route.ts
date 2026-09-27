import { after, NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { writeAdminAudit } from "@/server/admin/audit";
import { refreshRefund } from "@/server/refunds/refund-service";
import { processPendingNotifications } from "@/server/notifications/outbox-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdminPermission(request, "refund.create");
    const { id } = await context.params;
    const refund = await refreshRefund(id);
    await writeAdminAudit({ actorAdminId: auth.user.id, action: "REFUND_STATUS_REFRESHED", entityType: "Refund", entityId: id });
    after(() => processPendingNotifications(5));
    return NextResponse.json({ refund });
  } catch (error) { return adminError(error, "Unable to refresh refund."); }
}
