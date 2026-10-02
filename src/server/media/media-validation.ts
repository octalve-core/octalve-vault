const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const MAX_MEDIA_DIMENSION = 12_000;
const MAX_MEDIA_PIXELS = 50_000_000;

const MIME_BY_EXTENSION: Readonly<Record<string, string>> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

export const MEDIA_LIMITS = {
  maxBytes: MAX_MEDIA_BYTES,
  maxDimension: MAX_MEDIA_DIMENSION,
  maxPixels: MAX_MEDIA_PIXELS,
} as const;

function extensionOf(value: string): string {
  const clean = value.toLowerCase();
  const dot = clean.lastIndexOf(".");
  return dot >= 0 ? clean.slice(dot) : "";
}

export function sanitizeMediaFilename(value: string): string {
  const basename = value.replaceAll("\\", "/").split("/").at(-1) ?? "";
  const clean = basename.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 180);
  if (!clean) throw new Error("A valid image filename is required.");
  return clean;
}

export function validateMediaUploadRequest(input: {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
}) {
  const originalFilename = sanitizeMediaFilename(input.originalFilename);
  const extension = extensionOf(originalFilename);
  const expectedMime = MIME_BY_EXTENSION[extension];
  if (!expectedMime) throw new Error("Only JPEG, PNG, WebP and AVIF images are allowed.");
  if (input.mimeType !== expectedMime) throw new Error("Image extension and MIME type do not match.");
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes <= 0 || input.sizeBytes > MAX_MEDIA_BYTES) {
    throw new Error("Image size must be between 1 byte and 10 MiB.");
  }
  return { originalFilename, extension, mimeType: expectedMime, sizeBytes: input.sizeBytes };
}

export function validateProviderImage(input: {
  fileType: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  filePath: string;
  isPrivateFile: boolean;
  isPublished: boolean;
}) {
  if (input.fileType !== "image") throw new Error("Provider asset is not an image.");
  if (input.isPrivateFile || !input.isPublished) throw new Error("Product merchandising images must be public and published.");
  if (!input.filePath.startsWith("/octalve-vault/products/")) {
    throw new Error("Provider asset is outside the approved Vault media folder.");
  }
  if (!Object.values(MIME_BY_EXTENSION).includes(input.mime)) {
    throw new Error("Provider image type is not allowed.");
  }
  if (!Number.isSafeInteger(input.size) || input.size <= 0 || input.size > MAX_MEDIA_BYTES) {
    throw new Error("Provider image exceeds the Vault size limit.");
  }
  if (
    !Number.isSafeInteger(input.width) ||
    !Number.isSafeInteger(input.height) ||
    input.width <= 0 ||
    input.height <= 0 ||
    input.width > MAX_MEDIA_DIMENSION ||
    input.height > MAX_MEDIA_DIMENSION ||
    input.width * input.height > MAX_MEDIA_PIXELS
  ) {
    throw new Error("Provider image dimensions exceed the Vault safety limit.");
  }
  return input.mime;
}
