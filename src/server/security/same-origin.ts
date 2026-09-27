const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function assertSameOriginMutation(request: Request): void {
  if (SAFE_METHODS.has(request.method.toUpperCase())) return;
  const origin = request.headers.get("origin");
  if (!origin) throw Object.assign(new Error("Request origin is required."), { status: 403 });

  let requestOrigin: string;
  try {
    requestOrigin = new URL(request.url).origin;
  } catch {
    throw Object.assign(new Error("Request origin is invalid."), { status: 403 });
  }

  if (origin !== requestOrigin) {
    throw Object.assign(new Error("Request origin is not allowed."), { status: 403 });
  }
}
