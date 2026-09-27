import { generateOpaqueToken } from "../../domain/random.ts";
import { prisma } from "../../lib/prisma";
import { createOpaqueObjectKey } from "./object-key.ts";
import { getR2Config } from "./r2-config.ts";
import { presignR2HeadObject, presignR2PutObject } from "./r2-presign.ts";

export const MAX_SINGLE_R2_UPLOAD_BYTES = 5 * 1024 * 1024 * 1024;
export const R2_UPLOAD_URL_TTL_SECONDS = 10 * 60;
const ZIP_CONTENT_TYPE = "application/zip";

function normalizeZipFilename(filename: string): string {
  const clean = filename.replace(/[\r\n\\/]/g, "-").replace(/[\x00-\x1F\x7F]/g, "").trim();
  if (!clean.toLowerCase().endsWith(".zip")) throw new Error("Vault product assets must be ZIP files.");
  if (clean.length < 5 || clean.length > 180) throw new Error("Invalid ZIP filename.");
  return clean;
}

export async function createAssetUploadAuthorization(input: {
  productId: string;
  originalFilename: string;
  sizeBytes: number;
  createdByAdminId: string;
  now?: Date;
}) {
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > MAX_SINGLE_R2_UPLOAD_BYTES) {
    throw new Error("ZIP file size must be between 1 byte and 5 GiB for direct upload.");
  }
  const filename = normalizeZipFilename(input.originalFilename);
  const product = await prisma.product.findUnique({ where: { id: input.productId }, select: { id: true } });
  if (!product) throw new Error("Product not found.");

  const latestAsset = await prisma.productAsset.findFirst({
    where: { productId: input.productId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  const version = (latestAsset?.version ?? 0) + 1;
  const now = input.now ?? new Date();
  const objectKey = createOpaqueObjectKey({
    now,
    extension: ".zip",
    randomId: generateOpaqueToken(24),
  });

  const asset = await prisma.productAsset.create({
    data: {
      productId: input.productId,
      version,
      objectKey,
      originalFilename: filename,
      downloadFilename: filename,
      contentType: ZIP_CONTENT_TYPE,
      sizeBytes: BigInt(input.sizeBytes),
      status: "UPLOADING",
      createdByAdminId: input.createdByAdminId,
    },
  });

  const r2 = getR2Config();
  const signed = presignR2PutObject({
    ...r2,
    objectKey,
    contentType: ZIP_CONTENT_TYPE,
    expiresInSeconds: R2_UPLOAD_URL_TTL_SECONDS,
    now,
  });

  return {
    assetId: asset.id,
    version,
    uploadUrl: signed.url,
    uploadHeaders: signed.headers,
    expiresAt: signed.expiresAt,
    maxBytes: MAX_SINGLE_R2_UPLOAD_BYTES,
  };
}

export async function verifyUploadedAsset(input: {
  assetId: string;
  fetchImpl?: typeof fetch;
  now?: Date;
}) {
  const asset = await prisma.productAsset.findUnique({ where: { id: input.assetId } });
  if (!asset) throw new Error("Product asset not found.");
  if (asset.status !== "UPLOADING") throw new Error("Only uploading assets can be verified.");

  const r2 = getR2Config();
  const signed = presignR2HeadObject({
    ...r2,
    objectKey: asset.objectKey,
    expiresInSeconds: 60,
    now: input.now,
  });
  const response = await (input.fetchImpl ?? fetch)(signed.url, { method: "HEAD", cache: "no-store" });
  if (!response.ok) {
    await prisma.productAsset.update({ where: { id: asset.id }, data: { status: "FAILED" } });
    throw new Error("Uploaded object could not be verified in R2.");
  }

  const sizeHeader = response.headers.get("content-length");
  const size = sizeHeader ? BigInt(sizeHeader) : null;
  const etag = response.headers.get("etag");
  const contentType = response.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  const valid = size === asset.sizeBytes && (!contentType || contentType === ZIP_CONTENT_TYPE);
  if (!valid) {
    await prisma.productAsset.update({ where: { id: asset.id }, data: { status: "FAILED" } });
    throw new Error("Uploaded R2 object metadata does not match the expected ZIP asset.");
  }

  return prisma.productAsset.update({
    where: { id: asset.id },
    data: { status: "READY", etag: etag?.slice(0, 255) ?? null },
  });
}
