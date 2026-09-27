import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE } from "@/server/auth/cookies";
import { loginAdmin } from "@/server/auth/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email !== "string" || typeof body.password !== "string" || typeof body.turnstileToken !== "string") throw new Error("Email, password and human verification are required.");
    const result = await loginAdmin({ email: body.email, password: body.password, turnstileToken: body.turnstileToken, request });
    const response = NextResponse.json({ authenticated: true, user: { id: result.user.id, displayName: result.user.displayName, role: result.user.role } });
    response.cookies.set(ADMIN_SESSION_COOKIE, result.token, result.cookie);
    return response;
  } catch (error) {
    const resetAt = error && typeof error === "object" && "resetAt" in error ? (error as { resetAt?: Date }).resetAt : undefined;
    return NextResponse.json({ error: resetAt ? "Too many login attempts. Try again later." : "Invalid admin credentials." }, { status: resetAt ? 429 : 401 });
  }
}
