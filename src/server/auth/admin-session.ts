import type { AdminRole } from "../../domain/constants.ts";
import type { Permission } from "../../domain/permissions.ts";
import { ADMIN_SESSION_TTL_SECONDS } from "../../config/app.ts";
import { requiredEnv } from "../../config/env.server.ts";
import { normalizeEmail } from "../../domain/email.ts";
import { prisma } from "../../lib/prisma";
import { verifyPassword } from "./password.ts";
import { signSessionJwt, verifySessionJwt } from "./jwt.ts";
import { ADMIN_SESSION_COOKIE, secureSessionCookie } from "./cookies.ts";
import { adminSessionActive, assertAdminPermission } from "./admin-access-core.ts";
import { requestFingerprint, requestIp } from "../security/request-fingerprint.ts";
import { enforceRateLimit, hashRateLimitKey } from "../security/rate-limit.ts";
import { verifyTurnstileToken } from "../security/turnstile.ts";
import { generateOpaqueToken } from "../../domain/random.ts";
import { assertSameOriginMutation } from "../security/same-origin.ts";

function cookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (rawName === name) return rest.join("=") || null;
  }
  return null;
}

function emailHash(email: string): string {
  return hashRateLimitKey(email, requiredEnv("RATE_LIMIT_SECRET"));
}

export async function loginAdmin(input: { email: string; password: string; turnstileToken: string; request: Request; now?: Date }) {
  const now = input.now ?? new Date();
  const email = normalizeEmail(input.email);
  const fingerprint = requestFingerprint(input.request);
  const ip = requestIp(input.request) ?? "unknown";
  await enforceRateLimit({ action: "admin.login", identifier: `${ip}:${email}`, limit: 8, windowSeconds: 900, now });
  await verifyTurnstileToken({ token: input.turnstileToken, action: "admin_login", remoteIp: requestIp(input.request), idempotencyKey: generateOpaqueToken(18) });

  const user = await prisma.adminUser.findUnique({ where: { email } });
  const valid = Boolean(user?.active) && Boolean(user && await verifyPassword(input.password, user.passwordHash));
  if (!user || !valid) {
    await prisma.securityEvent.create({
      data: { type: "ADMIN_LOGIN_FAILED", severity: "MEDIUM", emailHash: emailHash(email), ipHash: fingerprint.ipHash, userAgentHash: fingerprint.userAgentHash },
    });
    throw new Error("Invalid admin credentials.");
  }

  const expiresAt = new Date(now.getTime() + ADMIN_SESSION_TTL_SECONDS * 1000);
  const session = await prisma.adminSession.create({ data: { userId: user.id, expiresAt, ipHash: fingerprint.ipHash, userAgentHash: fingerprint.userAgentHash } });
  const token = signSessionJwt(
    { sub: user.id, sid: session.id, kind: "admin", role: user.role },
    requiredEnv("ADMIN_SESSION_SECRET"),
    ADMIN_SESSION_TTL_SECONDS,
    Math.floor(now.getTime() / 1000),
  );
  await prisma.$transaction([
    prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: now } }),
    prisma.adminAuditLog.create({ data: { actorAdminId: user.id, action: "ADMIN_LOGIN", entityType: "AdminSession", entityId: session.id } }),
  ]);
  return { user, session, token, cookie: secureSessionCookie(ADMIN_SESSION_TTL_SECONDS) };
}

export async function authenticateAdminToken(token: string | null | undefined, now = new Date()) {
  if (!token) return null;
  try {
    const payload = verifySessionJwt(token, requiredEnv("ADMIN_SESSION_SECRET"), Math.floor(now.getTime() / 1000));
    if (payload.kind !== "admin") return null;
    const session = await prisma.adminSession.findUnique({ where: { id: payload.sid }, include: { user: true } });
    if (!session || payload.sub !== session.userId || !adminSessionActive(session, session.user, now)) return null;
    if (payload.role && payload.role !== session.user.role) return null;
    return { session, user: session.user };
  } catch {
    return null;
  }
}

export async function authenticateAdminRequest(request: Request, now = new Date()) {
  return authenticateAdminToken(cookieValue(request.headers.get("cookie"), ADMIN_SESSION_COOKIE), now);
}

export async function requireAdminPermission(request: Request, permission: Permission) {
  assertSameOriginMutation(request);
  const auth = await authenticateAdminRequest(request);
  if (!auth) throw Object.assign(new Error("Admin authentication required."), { status: 401 });
  assertAdminPermission(auth.user.role as AdminRole, permission);
  return auth;
}

export async function revokeAdminSession(request: Request) {
  const auth = await authenticateAdminRequest(request);
  if (!auth) return null;
  await prisma.$transaction([
    prisma.adminSession.update({ where: { id: auth.session.id }, data: { revokedAt: new Date() } }),
    prisma.adminAuditLog.create({ data: { actorAdminId: auth.user.id, action: "ADMIN_LOGOUT", entityType: "AdminSession", entityId: auth.session.id } }),
  ]);
  return auth;
}
