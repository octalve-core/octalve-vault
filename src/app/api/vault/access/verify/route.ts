import { NextResponse } from "next/server";
import { CUSTOMER_SESSION_COOKIE } from "@/server/auth/cookies";
import { verifyCustomerVaultOtp } from "@/server/vault/customer-access-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.challengeId !== "string" || typeof body.otp !== "string") throw new Error("Challenge and verification code are required.");
    const result = await verifyCustomerVaultOtp({ challengeId: body.challengeId, otp: body.otp, request });
    const response = NextResponse.json({ verified: true });
    response.cookies.set(CUSTOMER_SESSION_COOKIE, result.token, result.cookie);
    return response;
  } catch (error) {
    const resetAt = error && typeof error === "object" && "resetAt" in error ? (error as { resetAt?: Date }).resetAt : undefined;
    return NextResponse.json({ error: resetAt ? "Too many attempts. Please try again later." : "Invalid or expired verification code." }, { status: resetAt ? 429 : 400 });
  }
}
