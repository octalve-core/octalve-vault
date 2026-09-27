import { createHmac, timingSafeEqual } from "node:crypto";

export type SessionKind = "admin" | "customer";
export type SessionJwtPayload = {
  sub: string;
  sid: string;
  kind: SessionKind;
  role?: string;
  iat: number;
  exp: number;
};

type SessionJwtInput = Omit<SessionJwtPayload, "iat" | "exp">;

function assertSecret(secret: string) {
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("Session signing secret must be at least 32 bytes.");
  }
}

function encodeJson(value: unknown): string {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function signature(input: string, secret: string): Buffer {
  return createHmac("sha256", secret).update(input).digest();
}

export function signSessionJwt(
  input: SessionJwtInput,
  secret: string,
  ttlSeconds: number,
  nowSeconds = Math.floor(Date.now() / 1000),
): string {
  assertSecret(secret);
  if (!Number.isSafeInteger(ttlSeconds) || ttlSeconds <= 0) {
    throw new Error("JWT TTL must be a positive integer.");
  }

  const header = encodeJson({ alg: "HS256", typ: "JWT" });
  const payload = encodeJson({ ...input, iat: nowSeconds, exp: nowSeconds + ttlSeconds });
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${signature(unsigned, secret).toString("base64url")}`;
}

export function verifySessionJwt(
  token: string,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): SessionJwtPayload {
  assertSecret(secret);
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid session token.");

  const [headerText, payloadText, signatureText] = parts;
  const unsigned = `${headerText}.${payloadText}`;
  const expected = signature(unsigned, secret);
  let actual: Buffer;
  try {
    actual = Buffer.from(signatureText, "base64url");
  } catch {
    throw new Error("Invalid session token.");
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw new Error("Invalid session token signature.");
  }

  let header: { alg?: string; typ?: string };
  let payload: SessionJwtPayload;
  try {
    header = JSON.parse(Buffer.from(headerText, "base64url").toString("utf8"));
    payload = JSON.parse(Buffer.from(payloadText, "base64url").toString("utf8"));
  } catch {
    throw new Error("Invalid session token encoding.");
  }

  if (header.alg !== "HS256" || header.typ !== "JWT") throw new Error("Unsupported session token.");
  if (!payload.sub || !payload.sid || !["admin", "customer"].includes(payload.kind)) {
    throw new Error("Invalid session token claims.");
  }
  if (!Number.isFinite(payload.iat) || !Number.isFinite(payload.exp) || payload.exp <= nowSeconds) {
    throw new Error("Session token has expired.");
  }
  if (payload.iat > nowSeconds + 60) throw new Error("Session token issued in the future.");
  return payload;
}
