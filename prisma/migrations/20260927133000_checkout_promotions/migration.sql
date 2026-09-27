-- Add server-authoritative coupon discounts and affiliate attribution.
CREATE TYPE "CouponDiscountType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
CREATE TYPE "CouponRedemptionStatus" AS ENUM ('RESERVED', 'REDEEMED', 'RELEASED');

ALTER TABLE "Order"
  ADD COLUMN "couponId" TEXT,
  ADD COLUMN "couponCode" TEXT,
  ADD COLUMN "affiliateId" TEXT,
  ADD COLUMN "affiliateCode" TEXT,
  ADD COLUMN "affiliateCommissionBps" INTEGER;

CREATE TABLE "Coupon" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "discountType" "CouponDiscountType" NOT NULL,
  "percentageBps" INTEGER,
  "fixedAmountMinor" INTEGER,
  "currency" TEXT,
  "minimumSubtotal" INTEGER,
  "maxRedemptions" INTEGER,
  "perEmailLimit" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "startsAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CouponProduct" (
  "couponId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  CONSTRAINT "CouponProduct_pkey" PRIMARY KEY ("couponId", "productId")
);

CREATE TABLE "CouponRedemption" (
  "id" TEXT NOT NULL,
  "couponId" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" "CouponRedemptionStatus" NOT NULL DEFAULT 'RESERVED',
  "discountAmount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "reservationExpiresAt" TIMESTAMP(3) NOT NULL,
  "redeemedAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CouponRedemption_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Affiliate" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "email" TEXT,
  "commissionBps" INTEGER,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdByAdminId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX "Coupon_active_startsAt_endsAt_idx" ON "Coupon"("active", "startsAt", "endsAt");
CREATE INDEX "CouponProduct_productId_idx" ON "CouponProduct"("productId");
CREATE UNIQUE INDEX "CouponRedemption_orderId_key" ON "CouponRedemption"("orderId");
CREATE INDEX "CouponRedemption_couponId_status_reservationExpiresAt_idx" ON "CouponRedemption"("couponId", "status", "reservationExpiresAt");
CREATE INDEX "CouponRedemption_couponId_email_status_idx" ON "CouponRedemption"("couponId", "email", "status");
CREATE UNIQUE INDEX "Affiliate_code_key" ON "Affiliate"("code");
CREATE INDEX "Affiliate_active_idx" ON "Affiliate"("active");
CREATE INDEX "Order_couponId_idx" ON "Order"("couponId");
CREATE INDEX "Order_affiliateId_idx" ON "Order"("affiliateId");

ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponProduct" ADD CONSTRAINT "CouponProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Defense-in-depth constraints for promotion configuration and immutable snapshots.
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_code_format_check"
  CHECK ("code" ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$');
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_discount_configuration_check"
  CHECK (
    ("discountType" = 'PERCENTAGE' AND "percentageBps" BETWEEN 1 AND 9999 AND "fixedAmountMinor" IS NULL)
    OR
    ("discountType" = 'FIXED_AMOUNT' AND "fixedAmountMinor" > 0 AND "percentageBps" IS NULL AND "currency" IS NOT NULL)
  );
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_currency_check"
  CHECK ("currency" IS NULL OR "currency" IN ('NGN', 'USD', 'GBP', 'EUR'));
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_minimum_subtotal_check"
  CHECK ("minimumSubtotal" IS NULL OR ("minimumSubtotal" >= 0 AND "currency" IS NOT NULL));
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_max_redemptions_check"
  CHECK ("maxRedemptions" IS NULL OR "maxRedemptions" > 0);
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_per_email_limit_check"
  CHECK ("perEmailLimit" IS NULL OR "perEmailLimit" > 0);
ALTER TABLE "Coupon" ADD CONSTRAINT "Coupon_window_check"
  CHECK ("startsAt" IS NULL OR "endsAt" IS NULL OR "endsAt" > "startsAt");

ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_discount_check"
  CHECK ("discountAmount" > 0);
ALTER TABLE "CouponRedemption" ADD CONSTRAINT "CouponRedemption_currency_check"
  CHECK ("currency" IN ('NGN', 'USD', 'GBP', 'EUR'));

ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_code_format_check"
  CHECK ("code" ~ '^[A-Z0-9][A-Z0-9_-]{1,39}$');
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_commission_check"
  CHECK ("commissionBps" IS NULL OR "commissionBps" BETWEEN 0 AND 10000);
ALTER TABLE "Order" ADD CONSTRAINT "Order_affiliate_commission_check"
  CHECK ("affiliateCommissionBps" IS NULL OR "affiliateCommissionBps" BETWEEN 0 AND 10000);
