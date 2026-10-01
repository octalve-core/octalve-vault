import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { registerMediaAsset } from "@/server/media/media-service";
import { enforceRateLimit } from "@/server/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    try {
      await enforceRateLimit({
        action: "admin.media.register.hour",
        identifier: auth.user.id,
        limit: 60,
        windowSeconds: 3600,
      });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "RATE_LIMITED") {
        Object.assign(error, { status: 429 });
      }
      throw error;
    }

    const body = (await request.json()) as Record<string, unknown>;
    if (typeof body.providerAssetId !== "string" || typeof body.originalFilename !== "string") {
      throw new Error("Provider asset ID and original filename are required.");
    }
    const asset = await registerMediaAsset(auth.user.id, {
      providerAssetId: body.providerAssetId,
      originalFilename: body.originalFilename,
    });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return adminError(error, "Unable to register image.");
  }
}
