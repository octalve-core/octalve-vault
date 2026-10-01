import { optionalEnv, requiredEnv } from "../../config/env.server.ts";

export function normalizeImageKitEndpoint(raw: string): string {
  const parsed = new URL(raw.trim());
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("IMAGEKIT_URL_ENDPOINT must be a clean HTTPS URL.");
  }
  const pathname = parsed.pathname.replace(/\/+$/, "");
  return `${parsed.origin}${pathname}`;
}

export function getImageKitPublicEndpoint(): string | undefined {
  const value = optionalEnv("IMAGEKIT_URL_ENDPOINT");
  return value ? normalizeImageKitEndpoint(value) : undefined;
}

export function getImageKitConfig() {
  return {
    privateKey: requiredEnv("IMAGEKIT_PRIVATE_KEY"),
    publicKey: requiredEnv("IMAGEKIT_PUBLIC_KEY"),
    urlEndpoint: normalizeImageKitEndpoint(requiredEnv("IMAGEKIT_URL_ENDPOINT")),
  };
}
