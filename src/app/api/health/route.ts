import { NextResponse } from "next/server";
import { healthPayload } from "@/server/health/health-core";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(healthPayload("ok"), {
    headers: { "cache-control": "no-store" },
  });
}
