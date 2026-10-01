import { NextResponse } from "next/server";

import { adminError } from "@/server/admin/http";
import { requireAdminPermission } from "@/server/auth/admin-session";
import { createImageKitUploadAuth } from "@/server/media/imagekit-provider";
import { MEDIA_LIMITS, validateMediaUploadRequest } from "@/server/media/media-validation";
import { enforceRateLimit } from "@/server/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function limitUploadAuth(adminId: string) {
  try {
    await enforceRateLimit({
      action: "admin.media.upload-auth.hour",
      identifier: adminId,
      limit: 20,
      windowSeconds: 3600,
    });
    await enforceRateLimit({
      action: "admin.media.upload-auth.day",
      identifier: adminId,
      limit: 60,
      windowSeconds: 86400,
    });
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "RATE_LIMITED") {
      Object.assign(error, { status: 429 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdminPermission(request, "product.write");
    await limitUploadAuth(auth.user.id);
    const body = (await request.json()) as Record<string, unknown>;
    if (
      typeof body.originalFilename !== "string" ||
      typeof body.mimeType !== "string" ||
      typeof body.sizeBytes !== "number"
    ) {
      throw new Error("Filename, MIME type and file size are required.");
    }
    const validated = validateMediaUploadRequest({
      originalFilename: body.originalFilename,
      mimeType: body.mimeType,
      sizeBytes: body.sizeBytes,
    });
    return NextResponse.json(
      {
        ...createImageKitUploadAuth(validated.extension),
        maxBytes: MEDIA_LIMITS.maxBytes,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return adminError(error, "Unable to prepare image upload.");
  }
}
