-- Introduce a provider-neutral TEST/LIVE payment environment authority.
CREATE TYPE "PaymentEnvironment" AS ENUM ('TEST', 'LIVE');

-- Add environment as nullable first so existing pre-live rows can be classified safely.
ALTER TABLE "PaymentAttempt" ADD COLUMN "environment" "PaymentEnvironment";
ALTER TABLE "WebhookEvent" ADD COLUMN "environment" "PaymentEnvironment";
ALTER TABLE "Refund" ADD COLUMN "environment" "PaymentEnvironment";

-- All payment activity before this migration belongs to the controlled pre-live rollout.
UPDATE "PaymentAttempt" SET "environment" = 'TEST' WHERE "environment" IS NULL;
UPDATE "WebhookEvent" SET "environment" = 'TEST' WHERE "environment" IS NULL;
UPDATE "Refund" SET "environment" = 'TEST' WHERE "environment" IS NULL;

ALTER TABLE "PaymentAttempt" ALTER COLUMN "environment" SET NOT NULL;
ALTER TABLE "WebhookEvent" ALTER COLUMN "environment" SET NOT NULL;
ALTER TABLE "Refund" ALTER COLUMN "environment" SET NOT NULL;

-- Environment must participate in operational and idempotency namespaces.
DROP INDEX IF EXISTS "PaymentAttempt_provider_status_idx";
CREATE INDEX "PaymentAttempt_provider_environment_status_idx"
  ON "PaymentAttempt"("provider", "environment", "status");

DROP INDEX IF EXISTS "WebhookEvent_provider_providerEventId_key";
CREATE UNIQUE INDEX "WebhookEvent_provider_environment_providerEventId_key"
  ON "WebhookEvent"("provider", "environment", "providerEventId");

DROP INDEX IF EXISTS "Refund_providerReference_key";
CREATE UNIQUE INDEX "Refund_provider_environment_providerReference_key"
  ON "Refund"("provider", "environment", "providerReference");
