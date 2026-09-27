import { NextResponse } from "next/server";
import { authenticateCustomerRequest } from "@/server/auth/customer-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function maskEmail(email: string): string {
  const [name, domain] = email.split("@");
  const shown = name.length <= 2 ? name[0] ?? "*" : `${name.slice(0, 2)}***`;
  return `${shown}@${domain}`;
}

export async function GET(request: Request) {
  const session = await authenticateCustomerRequest(request);
  return NextResponse.json(session ? { authenticated: true, email: maskEmail(session.email) } : { authenticated: false }, { headers: { "cache-control": "no-store" } });
}
