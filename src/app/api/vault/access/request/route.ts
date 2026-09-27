import { NextResponse } from "next/server";
import { isLocale } from "@/config/locales";
import { requestCustomerVaultAccess } from "@/server/vault/customer-access-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.email !== "string" || typeof body.turnstileToken !== "string") throw new Error("Email and human verification are required.");
    const locale = typeof body.locale === "string" && isLocale(body.locale) ? body.locale : "en";
    const result = await requestCustomerVaultAccess({ email: body.email, locale, turnstileToken: body.turnstileToken, request });
    return NextResponse.json(result, { status: 202 });
  } catch (error) {
    const resetAt = error && typeof error === "object" && "resetAt" in error ? (error as { resetAt?: Date }).resetAt : undefined;
    return NextResponse.json({ error: resetAt ? "Too many requests. Please try again later." : error instanceof Error ? error.message : "Unable to process access request." }, { status: resetAt ? 429 : 400 });
  }
}
