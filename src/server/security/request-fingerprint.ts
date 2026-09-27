import { createHmac } from "node:crypto";
import { requiredEnv } from "../../config/env.server.ts";

function digest(value: string | null | undefined): string | null {
  if (!value) return null;
  return createHmac("sha256", requiredEnv("REQUEST_FINGERPRINT_SECRET"))
    .update(value.slice(0, 1024))
    .digest("base64url");
}

export function requestIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return request.headers.get("cf-connecting-ip") || forwarded || null;
}

export function requestFingerprint(request: Request) {
  return {
    ip: requestIp(request),
    ipHash: digest(requestIp(request)),
    userAgentHash: digest(request.headers.get("user-agent")),
  };
}
