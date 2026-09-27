import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { healthPayload } from "@/server/health/health-core";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(healthPayload("ok"), { headers: { "cache-control": "no-store" } });
  } catch {
    return NextResponse.json(healthPayload("degraded"), { status: 503, headers: { "cache-control": "no-store" } });
  }
}
