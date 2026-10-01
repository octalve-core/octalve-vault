-- Batch F: additive public merchandising media schema.
-- Existing Product.imagePath and private commercial/payment/refund/download tables remain unchanged.

CREATE TYPE "MediaProvider" AS ENUM ('IMAGEKIT');
CREATE TYPE "MediaAssetStatus" AS ENUM ('READY', 'RETIRED');

CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "provider" "MediaProvider" NOT NULL DEFAULT 'IMAGEKIT',
    "providerAssetId" TEXT NOT NULL,
    "providerFilePath" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "status" "MediaAssetStatus" NOT NULL DEFAULT 'READY',
    "createdByAdminId" TEXT,
    "retiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductMedia" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProductMedia_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product" ADD COLUMN "primaryMediaId" TEXT;

CREATE UNIQUE INDEX "MediaAsset_providerAssetId_key" ON "MediaAsset"("providerAssetId");
CREATE INDEX "MediaAsset_status_createdAt_idx" ON "MediaAsset"("status", "createdAt");
CREATE INDEX "MediaAsset_provider_providerFilePath_idx" ON "MediaAsset"("provider", "providerFilePath");

CREATE UNIQUE INDEX "ProductMedia_productId_mediaAssetId_key" ON "ProductMedia"("productId", "mediaAssetId");
CREATE INDEX "ProductMedia_productId_position_idx" ON "ProductMedia"("productId", "position");
CREATE INDEX "ProductMedia_mediaAssetId_idx" ON "ProductMedia"("mediaAssetId");

CREATE UNIQUE INDEX "Product_primaryMediaId_key" ON "Product"("primaryMediaId");

ALTER TABLE "MediaAsset"
  ADD CONSTRAINT "MediaAsset_createdByAdminId_fkey"
  FOREIGN KEY ("createdByAdminId") REFERENCES "AdminUser"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductMedia"
  ADD CONSTRAINT "ProductMedia_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductMedia"
  ADD CONSTRAINT "ProductMedia_mediaAssetId_fkey"
  FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_primaryMediaId_fkey"
  FOREIGN KEY ("primaryMediaId") REFERENCES "ProductMedia"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
