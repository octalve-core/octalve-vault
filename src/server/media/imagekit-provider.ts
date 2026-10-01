import { getUploadAuthParams } from "@imagekit/next/server";

import { generateOpaqueToken } from "../../domain/random";
import { getImageKitConfig } from "./imagekit-config";
import { detectImageSignature, type AllowedImageMime } from "./image-signature";

export type ImageKitProviderAsset = {
  fileId: string;
  name: string;
  filePath: string;
  fileType: string;
  mime: string;
  width: number;
  height: number;
  size: number;
  isPrivateFile: boolean;
  isPublished: boolean;
};

export function createImageKitUploadAuth(extension: string) {
  const config = getImageKitConfig();
  const expire = Math.floor(Date.now() / 1000) + 10 * 60;
  const token = generateOpaqueToken(24);
  const auth = getUploadAuthParams({
    privateKey: config.privateKey,
    publicKey: config.publicKey,
    expire,
    token,
  });
  return {
    ...auth,
    publicKey: config.publicKey,
    fileName: `${generateOpaqueToken(24)}${extension}`,
    folder: "/octalve-vault/products",
  };
}

function basicAuth(privateKey: string): string {
  return `Basic ${Buffer.from(`${privateKey}:`).toString("base64")}`;
}

export async function fetchImageKitAsset(providerAssetId: string): Promise<ImageKitProviderAsset> {
  if (!/^[a-zA-Z0-9_-]{6,200}$/.test(providerAssetId)) {
    throw Object.assign(new Error("Invalid provider asset identifier."), { status: 400 });
  }
  const config = getImageKitConfig();
  const response = await fetch(
    `https://api.imagekit.io/v1/files/${encodeURIComponent(providerAssetId)}/details`,
    {
      headers: { authorization: basicAuth(config.privateKey) },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    },
  );
  if (!response.ok) {
    throw Object.assign(new Error("Unable to verify the uploaded image with the media provider."), { status: 502 });
  }
  const raw = (await response.json()) as Partial<ImageKitProviderAsset>;
  if (
    raw.fileId !== providerAssetId ||
    typeof raw.name !== "string" ||
    typeof raw.filePath !== "string" ||
    typeof raw.fileType !== "string" ||
    typeof raw.mime !== "string" ||
    typeof raw.width !== "number" ||
    typeof raw.height !== "number" ||
    typeof raw.size !== "number" ||
    typeof raw.isPrivateFile !== "boolean" ||
    typeof raw.isPublished !== "boolean"
  ) {
    throw Object.assign(new Error("Media provider returned incomplete image metadata."), { status: 502 });
  }
  return raw as ImageKitProviderAsset;
}

function encodeProviderPath(filePath: string): string {
  if (!filePath.startsWith("/octalve-vault/products/")) {
    throw Object.assign(new Error("Invalid media provider path."), { status: 400 });
  }
  return filePath
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

export function imageKitOriginalUrl(filePath: string): string {
  const { urlEndpoint } = getImageKitConfig();
  return `${urlEndpoint}${encodeProviderPath(filePath)}`;
}

export function imageKitTransformedUrl(
  filePath: string,
  preset: "thumbnail" | "card" | "detail",
): string {
  const { urlEndpoint } = getImageKitConfig();
  const width = preset === "thumbnail" ? 300 : preset === "card" ? 800 : 1400;
  return `${urlEndpoint}/tr:w-${width},f-auto,q-80${encodeProviderPath(filePath)}`;
}

async function readPrefix(response: Response, maxBytes: number): Promise<Uint8Array> {
  if (!response.body) throw new Error("Uploaded image body is unavailable.");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const next = await reader.read();
      if (next.done) break;
      if (next.value.byteLength) {
        const remaining = maxBytes - total;
        const chunk = next.value.slice(0, remaining);
        chunks.push(chunk);
        total += chunk.byteLength;
      }
    }
  } finally {
    await reader.cancel().catch(() => undefined);
  }
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    joined.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return joined;
}

export async function fetchImageSignatureFromImageKit(filePath: string): Promise<AllowedImageMime | null> {
  const response = await fetch(imageKitOriginalUrl(filePath), {
    headers: { range: "bytes=0-63" },
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!(response.ok || response.status === 206)) {
    throw Object.assign(new Error("Unable to inspect the uploaded image."), { status: 502 });
  }
  const bytes = await readPrefix(response, 64);
  if (!bytes.byteLength) throw Object.assign(new Error("Uploaded image is empty."), { status: 400 });
  return detectImageSignature(bytes);
}
