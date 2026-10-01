import type { NextConfig } from "next";

function imageKitEndpoint() {
  const raw = process.env.IMAGEKIT_URL_ENDPOINT?.trim();
  if (!raw) return null;
  const parsed = new URL(raw);
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error("IMAGEKIT_URL_ENDPOINT must be a clean HTTPS URL.");
  }
  return {
    origin: parsed.origin,
    hostname: parsed.hostname,
    pathname: `${parsed.pathname.replace(/\/+$/, "") || ""}/**`,
  };
}

const imageKit = imageKitEndpoint();
const scriptSrc = process.env.NODE_ENV === "production"
  ? "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com"
  : "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com";

const csp = [
  "default-src 'self'",
  scriptSrc,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${imageKit ? ` ${imageKit.origin}` : ""}`,
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com https://*.r2.cloudflarestorage.com https://upload.imagekit.io",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  ...(imageKit
    ? {
        images: {
          remotePatterns: [
            {
              protocol: "https" as const,
              hostname: imageKit.hostname,
              port: "",
              pathname: imageKit.pathname,
            },
          ],
        },
      }
    : {}),
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; },
};

export default nextConfig;
