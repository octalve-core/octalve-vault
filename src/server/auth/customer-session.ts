import { CUSTOMER_SESSION_TTL_SECONDS } from "../../config/app.ts";
import { requiredEnv } from "../../config/env.server.ts";
import { prisma } from "../../lib/prisma";
import { signSessionJwt, verifySessionJwt } from "./jwt.ts";
import { CUSTOMER_SESSION_COOKIE, secureSessionCookie } from "./cookies.ts";
import { requestFingerprint } from "../security/request-fingerprint.ts";

export function cookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return rest.join("=") || null;
  }
  return null;
}

export async function createCustomerSession(input: { email: string; request: Request; now?: Date }) {
  const now = input.now ?? new Date();
  const expiresAt = new Date(now.getTime() + CUSTOMER_SESSION_TTL_SECONDS * 1000);
  const fingerprint = requestFingerprint(input.request);
  const session = await prisma.customerSession.create({
    data: { email: input.email, expiresAt, ipHash: fingerprint.ipHash, userAgentHash: fingerprint.userAgentHash },
  });
  const token = signSessionJwt(
    { sub: session.id, sid: session.id, kind: "customer" },
    requiredEnv("CUSTOMER_SESSION_SECRET"),
    CUSTOMER_SESSION_TTL_SECONDS,
    Math.floor(now.getTime() / 1000),
  );
  return { session, token, cookie: secureSessionCookie(CUSTOMER_SESSION_TTL_SECONDS) };
}

export async function authenticateCustomerRequest(request: Request, now = new Date()) {
  const token = cookieValue(request.headers.get("cookie"), CUSTOMER_SESSION_COOKIE);
  if (!token) return null;
  try {
    const payload = verifySessionJwt(token, requiredEnv("CUSTOMER_SESSION_SECRET"), Math.floor(now.getTime() / 1000));
    if (payload.kind !== "customer") return null;
    const session = await prisma.customerSession.findUnique({ where: { id: payload.sid } });
    if (!session || payload.sub !== session.id || session.revokedAt || session.expiresAt.getTime() <= now.getTime()) return null;
    await prisma.customerSession.update({ where: { id: session.id }, data: { lastSeenAt: now } });
    return session;
  } catch {
    return null;
  }
}

export async function revokeCustomerSession(request: Request) {
  const session = await authenticateCustomerRequest(request);
  if (session) await prisma.customerSession.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  return session;
}
