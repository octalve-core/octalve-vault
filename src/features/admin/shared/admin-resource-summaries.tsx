import {
  BadgeCheck,
  CircleDot,
  Download,
  History,
  PackageCheck,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  TicketPercent,
  UserCheck,
  UserX,
  Users,
  CreditCard,
} from "lucide-react";

import type { AdminAuditSummary } from "@/server/admin/audit-query-service";
import type { AdminCustomerSummary } from "@/server/admin/customers-service";
import type { AdminDownloadSummary } from "@/server/admin/downloads-service";
import type { AdminMarketingSummary } from "@/server/admin/marketing-service";
import type { AdminOrderSummary } from "@/server/admin/orders-service";
import type { AdminPaymentSummary } from "@/server/admin/payments-service";
import type { AdminTeamSummary } from "@/server/admin/team-service";
import { AdminSummaryGrid } from "./admin-summary-grid";

export function OrderSummary({
  summary,
}: {
  summary: AdminOrderSummary;
}) {
  return (
    <AdminSummaryGrid
      items={[
        { label: "LIVE orders", value: summary.liveOrders, helper: "Orders with LIVE payment activity", context: "LIVE", tone: "blue", icon: ReceiptText },
        { label: "Paid / fulfilled", value: summary.paidFulfilled, helper: "Verified LIVE purchases", context: "LIVE", tone: "emerald", icon: PackageCheck },
        { label: "Pending / in progress", value: summary.pendingInProgress, helper: "LIVE checkout activity not completed", context: "LIVE", tone: "amber", icon: CircleDot },
        { label: "Refunded", value: summary.refunded, helper: "Partial or full LIVE refunds", context: "LIVE", tone: "rose", icon: RefreshCcw },
      ]}
    />
  );
}

export function PaymentSummary({
  summary,
}: {
  summary: AdminPaymentSummary;
}) {
  return (
    <AdminSummaryGrid
      items={[
        { label: "LIVE attempts", value: summary.liveAttempts, helper: "All production provider attempts", context: "LIVE", tone: "blue", icon: CreditCard },
        { label: "Successful", value: summary.successful, helper: "Verified production payments", context: "LIVE", tone: "emerald", icon: BadgeCheck },
        { label: "Pending / processing", value: summary.pendingProcessing, helper: "LIVE attempts awaiting final state", context: "LIVE", tone: "amber", icon: CircleDot },
        { label: "Refunded", value: summary.refunded, helper: "LIVE refunded payment attempts", context: "LIVE", tone: "rose", icon: RefreshCcw },
      ]}
    />
  );
}

export function CustomerSummary({
  summary,
}: {
  summary: AdminCustomerSummary;
}) {
  return (
    <AdminSummaryGrid
      items={[
        { label: "LIVE customers", value: summary.liveCustomers, helper: "Distinct verified production buyers", context: "LIVE", tone: "blue", icon: Users },
        { label: "Repeat buyers", value: summary.repeatBuyers, helper: "Customers with 2+ paid LIVE orders", context: "LIVE", tone: "emerald", icon: UserCheck },
        { label: "Single-order buyers", value: summary.singleOrderBuyers, helper: "Customers with exactly one paid order", context: "LIVE", tone: "violet", icon: UserX },
        { label: "Paid LIVE orders", value: summary.paidLiveOrders, helper: "Qualifying customer orders", context: "LIVE", tone: "amber", icon: ReceiptText },
      ]}
    />
  );
}

export function DownloadSummary({
  summary,
}: {
  summary: AdminDownloadSummary;
}) {
  return (
    <AdminSummaryGrid
      items={[
        { label: "Active LIVE grants", value: summary.activeLive, helper: "Usable production entitlements", context: "LIVE", tone: "blue", icon: Download },
        { label: "Used", value: summary.used, helper: "Active grants already downloaded", context: "LIVE", tone: "emerald", icon: PackageCheck },
        { label: "Unused", value: summary.unused, helper: "Active grants not yet downloaded", context: "LIVE", tone: "violet", icon: CircleDot },
        { label: "Revoked / expired", value: summary.revokedExpired, helper: "Production grants no longer usable", context: "LIVE", tone: "rose", icon: ShieldCheck },
      ]}
    />
  );
}

export function MarketingSummary({
  summary,
}: {
  summary: AdminMarketingSummary;
}) {
  return (
    <AdminSummaryGrid
      items={[
        { label: "Active coupons", value: summary.activeCoupons, helper: "Currently usable coupon rules", context: "NOW", tone: "blue", icon: TicketPercent },
        { label: "LIVE coupon redemptions", value: summary.liveCouponRedemptions, helper: "Redeemed on qualifying production orders", context: "LIVE", tone: "emerald", icon: BadgeCheck },
        { label: "Active affiliates", value: summary.activeAffiliates, helper: "Enabled attribution partners", context: "ALL", tone: "violet", icon: Users },
        { label: "LIVE attributed orders", value: summary.liveAttributedOrders, helper: "Production orders linked to affiliates", context: "LIVE", tone: "amber", icon: ReceiptText },
      ]}
    />
  );
}

export function TeamSummary({
  summary,
}: {
  summary: AdminTeamSummary;
}) {
  return (
    <AdminSummaryGrid
      items={[
        { label: "Team members", value: summary.members, helper: "All Admin accounts", context: "ALL", tone: "blue", icon: Users },
        { label: "Active", value: summary.active, helper: "Accounts allowed to sign in", context: "ACCESS", tone: "emerald", icon: UserCheck },
        { label: "Disabled", value: summary.disabled, helper: "Revoked Admin accounts", context: "ACCESS", tone: "rose", icon: UserX },
        { label: "Never signed in", value: summary.neverSignedIn, helper: "Accounts without a recorded login", context: "LOGIN", tone: "amber", icon: History },
      ]}
    />
  );
}

export function AuditSummary({
  summary,
}: {
  summary: AdminAuditSummary;
}) {
  return (
    <AdminSummaryGrid
      items={[
        { label: "Events", value: summary.events, helper: "All immutable audit records", context: "ALL", tone: "blue", icon: History },
        { label: "Human actions", value: summary.humanActions, helper: "Events linked to an Admin actor", context: "ACTOR", tone: "emerald", icon: UserCheck },
        { label: "System actions", value: summary.systemActions, helper: "Events without an Admin actor", context: "SYSTEM", tone: "violet", icon: ShieldCheck },
        { label: "Active actors", value: summary.activeActors, helper: "Distinct Admins represented in logs", context: "ACTOR", tone: "amber", icon: Users },
      ]}
    />
  );
}
