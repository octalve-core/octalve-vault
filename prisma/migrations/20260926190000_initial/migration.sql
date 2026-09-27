-- Octalve Vault initial PostgreSQL schema
-- Generated from prisma/schema.prisma for Prisma migrate deploy.

CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMING_SOON', 'ARCHIVED');
CREATE TYPE "AssetStatus" AS ENUM ('UPLOADING', 'READY', 'PUBLISHED', 'RETIRED', 'FAILED');
CREATE TYPE "StorageProvider" AS ENUM ('CLOUDFLARE_R2');
CREATE TYPE "PaymentProvider" AS ENUM ('PAYSTACK', 'FLUTTERWAVE', 'STRIPE', 'PAYPAL', 'CRYPTO');
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'INITIALIZED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'INITIALIZED', 'PAID', 'FAILED', 'CANCELLED', 'FULFILLED', 'PARTIALLY_FULFILLED', 'PARTIALLY_REFUNDED', 'REFUNDED');
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'READY', 'EMAILED', 'DOWNLOADED', 'REVOKED');
CREATE TYPE "RefundStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT', 'AUDITOR');
CREATE TYPE "DownloadOutcome" AS ENUM ('AUTHORIZED', 'STARTED', 'COMPLETED', 'DENIED', 'EXPIRED', 'REVOKED', 'ERROR');
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');
CREATE TYPE "NotificationType" AS ENUM ('PAYMENT_SUCCESS', 'VAULT_ACCESS_CODE', 'DOWNLOAD_READY', 'REFUND_CONFIRMATION', 'ADMIN_SECURITY_ALERT');
CREATE TYPE "SecuritySeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "imagePath" TEXT,
  "featured" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  "defaultLocale" TEXT NOT NULL DEFAULT 'en',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductTranslation" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "locale" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description" TEXT,
  "businessBenefits" JSONB,
  "productivityBenefits" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductTranslation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductPrice" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductAsset" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "version" INTEGER NOT NULL,
  "storageProvider" "StorageProvider" NOT NULL DEFAULT 'CLOUDFLARE_R2',
  "objectKey" TEXT NOT NULL,
  "originalFilename" TEXT NOT NULL,
  "downloadFilename" TEXT NOT NULL,
  "contentType" TEXT NOT NULL DEFAULT 'application/zip',
  "sizeBytes" BIGINT NOT NULL,
  "sha256" TEXT,
  "etag" TEXT,
  "status" "AssetStatus" NOT NULL DEFAULT 'UPLOADING',
  "createdByAdminId" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'en',
  "currency" TEXT NOT NULL,
  "subtotalAmount" INTEGER NOT NULL,
  "discountAmount" INTEGER NOT NULL DEFAULT 0,
  "taxAmount" INTEGER NOT NULL DEFAULT 0,
  "totalAmount" INTEGER NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "provider" "PaymentProvider",
  "paidAt" TIMESTAMP(3),
  "fulfilledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "productAssetId" TEXT,
  "productSlug" TEXT NOT NULL,
  "productTitle" TEXT NOT NULL,
  "unitAmount" INTEGER NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "totalAmount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "deliveryStatus" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentAttempt" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "provider" "PaymentProvider" NOT NULL,
  "providerReference" TEXT NOT NULL,
  "providerTxId" TEXT,
  "idempotencyKey" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "authorizationUrl" TEXT,
  "accessCode" TEXT,
  "rawInitialize" JSONB,
  "rawVerify" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT,
  "provider" "PaymentProvider" NOT NULL,
  "providerEventId" TEXT,
  "eventType" TEXT,
  "signatureValid" BOOLEAN NOT NULL DEFAULT TRUE,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Refund" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "paymentAttemptId" TEXT,
  "provider" "PaymentProvider",
  "providerReference" TEXT,
  "amount" INTEGER NOT NULL,
  "currency" TEXT NOT NULL,
  "status" "RefundStatus" NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "rawResponse" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Refund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DownloadGrant" (
  "id" TEXT NOT NULL,
  "orderItemId" TEXT NOT NULL,
  "productAssetId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "downloadCount" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3),
  "firstUsedAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DownloadGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DownloadTicket" (
  "id" TEXT NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "grantId" TEXT NOT NULL,
  "productAssetId" TEXT NOT NULL,
  "customerSessionId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DownloadTicket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DownloadEvent" (
  "id" TEXT NOT NULL,
  "grantId" TEXT NOT NULL,
  "ticketId" TEXT,
  "outcome" "DownloadOutcome" NOT NULL,
  "bytesServed" BIGINT,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DownloadEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerAccessChallenge" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "otpHash" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 6,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "lastSentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "usedAt" TIMESTAMP(3),
  "lockedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerAccessChallenge_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerSession" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CustomerSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "AdminRole" NOT NULL DEFAULT 'AUDITOR',
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSession" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminAuditLog" (
  "id" TEXT NOT NULL,
  "actorAdminId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SecurityEvent" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "severity" "SecuritySeverity" NOT NULL DEFAULT 'INFO',
  "actorAdminId" TEXT,
  "emailHash" TEXT,
  "ipHash" TEXT,
  "userAgentHash" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SecurityEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationJob" (
  "id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "recipientEmail" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "nextAttemptAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimitBucket" (
  "id" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "RateLimitBucket_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StoreSetting" (
  "key" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StoreSetting_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "Product_status_idx" ON "Product"("status");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE UNIQUE INDEX "ProductTranslation_productId_locale_key" ON "ProductTranslation"("productId", "locale");
CREATE INDEX "ProductTranslation_locale_idx" ON "ProductTranslation"("locale");
CREATE UNIQUE INDEX "ProductPrice_productId_currency_key" ON "ProductPrice"("productId", "currency");
CREATE INDEX "ProductPrice_currency_isActive_idx" ON "ProductPrice"("currency", "isActive");
CREATE UNIQUE INDEX "ProductAsset_productId_version_key" ON "ProductAsset"("productId", "version");
CREATE INDEX "ProductAsset_productId_status_idx" ON "ProductAsset"("productId", "status");
CREATE UNIQUE INDEX "ProductAsset_objectKey_key" ON "ProductAsset"("objectKey");
CREATE INDEX "Order_email_idx" ON "Order"("email");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");
CREATE INDEX "OrderItem_productAssetId_idx" ON "OrderItem"("productAssetId");
CREATE INDEX "PaymentAttempt_orderId_idx" ON "PaymentAttempt"("orderId");
CREATE INDEX "PaymentAttempt_provider_status_idx" ON "PaymentAttempt"("provider", "status");
CREATE UNIQUE INDEX "PaymentAttempt_providerReference_key" ON "PaymentAttempt"("providerReference");
CREATE UNIQUE INDEX "PaymentAttempt_idempotencyKey_key" ON "PaymentAttempt"("idempotencyKey");
CREATE UNIQUE INDEX "WebhookEvent_provider_providerEventId_key" ON "WebhookEvent"("provider", "providerEventId");
CREATE INDEX "WebhookEvent_provider_idx" ON "WebhookEvent"("provider");
CREATE INDEX "WebhookEvent_processedAt_idx" ON "WebhookEvent"("processedAt");
CREATE INDEX "Refund_orderId_idx" ON "Refund"("orderId");
CREATE INDEX "Refund_status_idx" ON "Refund"("status");
CREATE UNIQUE INDEX "Refund_providerReference_key" ON "Refund"("providerReference");
CREATE INDEX "DownloadGrant_email_idx" ON "DownloadGrant"("email");
CREATE INDEX "DownloadGrant_productAssetId_idx" ON "DownloadGrant"("productAssetId");
CREATE INDEX "DownloadGrant_expiresAt_idx" ON "DownloadGrant"("expiresAt");
CREATE UNIQUE INDEX "DownloadGrant_orderItemId_key" ON "DownloadGrant"("orderItemId");
CREATE INDEX "DownloadTicket_grantId_idx" ON "DownloadTicket"("grantId");
CREATE INDEX "DownloadTicket_expiresAt_idx" ON "DownloadTicket"("expiresAt");
CREATE UNIQUE INDEX "DownloadTicket_tokenHash_key" ON "DownloadTicket"("tokenHash");
CREATE INDEX "DownloadEvent_grantId_createdAt_idx" ON "DownloadEvent"("grantId", "createdAt");
CREATE INDEX "DownloadEvent_outcome_idx" ON "DownloadEvent"("outcome");
CREATE INDEX "CustomerAccessChallenge_email_createdAt_idx" ON "CustomerAccessChallenge"("email", "createdAt");
CREATE INDEX "CustomerAccessChallenge_expiresAt_idx" ON "CustomerAccessChallenge"("expiresAt");
CREATE INDEX "CustomerSession_email_idx" ON "CustomerSession"("email");
CREATE INDEX "CustomerSession_expiresAt_idx" ON "CustomerSession"("expiresAt");
CREATE INDEX "AdminUser_role_active_idx" ON "AdminUser"("role", "active");
CREATE UNIQUE INDEX "AdminUser_email_key" ON "AdminUser"("email");
CREATE INDEX "AdminSession_userId_idx" ON "AdminSession"("userId");
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
CREATE INDEX "AdminAuditLog_actorAdminId_createdAt_idx" ON "AdminAuditLog"("actorAdminId", "createdAt");
CREATE INDEX "AdminAuditLog_entityType_entityId_idx" ON "AdminAuditLog"("entityType", "entityId");
CREATE INDEX "SecurityEvent_type_createdAt_idx" ON "SecurityEvent"("type", "createdAt");
CREATE INDEX "SecurityEvent_severity_idx" ON "SecurityEvent"("severity");
CREATE INDEX "NotificationJob_status_nextAttemptAt_idx" ON "NotificationJob"("status", "nextAttemptAt");
CREATE UNIQUE INDEX "NotificationJob_dedupeKey_key" ON "NotificationJob"("dedupeKey");
CREATE UNIQUE INDEX "RateLimitBucket_keyHash_action_windowStart_key" ON "RateLimitBucket"("keyHash", "action", "windowStart");
CREATE INDEX "RateLimitBucket_expiresAt_idx" ON "RateLimitBucket"("expiresAt");

ALTER TABLE "ProductTranslation" ADD CONSTRAINT "ProductTranslation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPrice" ADD CONSTRAINT "ProductPrice_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductAsset" ADD CONSTRAINT "ProductAsset_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productAssetId_fkey" FOREIGN KEY ("productAssetId") REFERENCES "ProductAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentAttempt" ADD CONSTRAINT "PaymentAttempt_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Refund" ADD CONSTRAINT "Refund_paymentAttemptId_fkey" FOREIGN KEY ("paymentAttemptId") REFERENCES "PaymentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DownloadGrant" ADD CONSTRAINT "DownloadGrant_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DownloadGrant" ADD CONSTRAINT "DownloadGrant_productAssetId_fkey" FOREIGN KEY ("productAssetId") REFERENCES "ProductAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DownloadTicket" ADD CONSTRAINT "DownloadTicket_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "DownloadGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DownloadTicket" ADD CONSTRAINT "DownloadTicket_productAssetId_fkey" FOREIGN KEY ("productAssetId") REFERENCES "ProductAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DownloadTicket" ADD CONSTRAINT "DownloadTicket_customerSessionId_fkey" FOREIGN KEY ("customerSessionId") REFERENCES "CustomerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DownloadEvent" ADD CONSTRAINT "DownloadEvent_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "DownloadGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DownloadEvent" ADD CONSTRAINT "DownloadEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "DownloadTicket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminSession" ADD CONSTRAINT "AdminSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AdminUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_actorAdminId_fkey" FOREIGN KEY ("actorAdminId") REFERENCES "AdminUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
