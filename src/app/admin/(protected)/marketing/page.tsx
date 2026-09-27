import { AdminPageHeader } from "@/features/admin/shared/admin-page-header";
import { MarketingManager } from "@/features/admin/marketing/marketing-manager";
import { hasPermission } from "@/domain/permissions";
import { listMarketingPromotions } from "@/server/admin/promotions-service";
import { requireAdminPage } from "@/server/auth/admin-page";

export default async function AdminMarketingPage() {
  const { user } = await requireAdminPage("marketing.read");
  const { coupons, affiliates } = await listMarketingPromotions();

  return (
    <>
      <AdminPageHeader
        eyebrow="Commerce"
        title="Coupons & affiliates"
        description="Manage server-authoritative promotion rules and affiliate attribution. Changes are audited and never alter browser-side price authority."
      />
      <div className="mt-7">
        <MarketingManager
          canWrite={hasPermission(user.role, "marketing.write")}
          coupons={coupons.map((coupon) => ({
            id: coupon.id,
            code: coupon.code,
            name: coupon.name,
            discountType: coupon.discountType,
            percentageBps: coupon.percentageBps,
            fixedAmountMinor: coupon.fixedAmountMinor,
            currency: coupon.currency,
            minimumSubtotal: coupon.minimumSubtotal,
            maxRedemptions: coupon.maxRedemptions,
            perEmailLimit: coupon.perEmailLimit,
            active: coupon.active,
            startsAt: coupon.startsAt?.toISOString() ?? null,
            endsAt: coupon.endsAt?.toISOString() ?? null,
            productIds: coupon.products.map((item) => item.productId),
            redemptionCount: coupon._count.redemptions,
            orderCount: coupon._count.orders,
          }))}
          affiliates={affiliates.map((affiliate) => ({
            id: affiliate.id,
            code: affiliate.code,
            displayName: affiliate.displayName,
            email: affiliate.email,
            commissionBps: affiliate.commissionBps,
            active: affiliate.active,
            orderCount: affiliate._count.orders,
          }))}
        />
      </div>
    </>
  );
}
