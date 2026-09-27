import { NextResponse } from "next/server";

export function adminError(error: unknown, fallback = "Admin operation failed.") {
  const message = error instanceof Error ? error.message : fallback;
  const status = error && typeof error === "object" && "status" in error
    ? Number((error as { status?: number }).status) || 400
    : /permission required/i.test(message) ? 403 : /authentication required/i.test(message) ? 401 : 400;
  return NextResponse.json({ error: status === 403 ? "You do not have permission to perform this action." : message }, { status });
}
