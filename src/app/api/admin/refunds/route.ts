import { after, NextResponse } from "next/server";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { adminError } from "@/server/admin/http";
import { writeAdminAudit } from "@/server/admin/audit";
import { initiateRefund, listRefunds } from "@/server/refunds/refund-service";
import { processPendingNotifications } from "@/server/notifications/outbox-service";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { await requireAdminPermission(request, "refund.read"); return NextResponse.json({ refunds: await listRefunds() }); }
  catch (error) { return adminError(error); }
}
export async function POST(request: Request) {
  try {
    const auth = await requireAdminPermission(request, "refund.create");
    const body = await request.json() as { orderId?: string; amountMinor?: number; reason?: string };
    if (!body.orderId || !Number.isSafeInteger(body.amountMinor) || !body.amountMinor || !body.reason) throw new Error("orderId, positive amountMinor and reason are required.");
    const refund = await initiateRefund({ orderId: body.orderId, amountMinor: body.amountMinor, reason: body.reason });
    await writeAdminAudit({ actorAdminId: auth.user.id, action: "REFUND_INITIATED", entityType: "Refund", entityId: refund.id, metadata: { orderId: body.orderId, amountMinor: body.amountMinor } });
    after(() => processPendingNotifications(5));
    return NextResponse.json({ refund }, { status: 201 });
  } catch (error) { return adminError(error, "Unable to initiate refund."); }
}
