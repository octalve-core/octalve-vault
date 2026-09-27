import { contentRangeHeader, parseByteRange, type ByteRange } from "./range.ts";

type R2ObjectBodyLike = {
  body: ReadableStream;
  size: number;
  httpEtag: string;
};

type R2HeadLike = {
  size: number;
  httpEtag: string;
} | null;

export type DownloadWorkerEnv = {
  VAULT_ASSETS: {
    get(key: string, options?: { range?: ByteRange }): Promise<R2ObjectBodyLike | null>;
    head(key: string): Promise<R2HeadLike>;
  };
  ORIGIN_API_URL: string;
  OCTALVE_INTERNAL_REDEEM_SECRET: string;
  OCTALVE_INTERNAL_CRON_SECRET: string;
};

type RedeemResponse = {
  objectKey: string;
  downloadFilename: string;
  contentType: string;
  sizeBytes: string;
};

function jsonError(status: number, message = "Download unavailable."): Response {
  return Response.json(
    { error: message },
    {
      status,
      headers: {
        "cache-control": "private, no-store",
        "referrer-policy": "no-referrer",
        "x-content-type-options": "nosniff",
      },
    },
  );
}

function sanitizeFilename(filename: string): string {
  const clean = filename.replace(/[\r\n\\/]/g, "-").replace(/[\x00-\x1F\x7F]/g, "").trim();
  return clean.slice(0, 180) || "octalve-vault-download.zip";
}

function contentDisposition(filename: string): string {
  const safe = sanitizeFilename(filename);
  if (/^[\x20-\x7E]+$/.test(safe) && !safe.includes('"')) return `attachment; filename="${safe}"`;
  const ascii = safe.replace(/[^A-Za-z0-9._ -]/g, "_").replace(/"/g, "'") || "octalve-vault-download.zip";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}

function validToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{32,512}$/.test(token);
}

async function redeemTicket(
  token: string,
  env: DownloadWorkerEnv,
  fetchImpl: typeof fetch,
): Promise<RedeemResponse | null> {
  const origin = env.ORIGIN_API_URL.replace(/\/$/, "");
  const response = await fetchImpl(`${origin}/api/internal/downloads/redeem`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.OCTALVE_INTERNAL_REDEEM_SECRET}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as Partial<RedeemResponse>;
  if (
    typeof payload.objectKey !== "string" ||
    typeof payload.downloadFilename !== "string" ||
    typeof payload.contentType !== "string" ||
    typeof payload.sizeBytes !== "string" ||
    !/^\d+$/.test(payload.sizeBytes)
  ) {
    return null;
  }
  return payload as RedeemResponse;
}

export async function handleDownloadRequest(
  request: Request,
  env: DownloadWorkerEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
  }

  const url = new URL(request.url);
  const match = /^\/d\/([A-Za-z0-9_-]+)$/.exec(url.pathname);
  const token = match?.[1];
  if (!token || !validToken(token)) return jsonError(404);

  let redeemed: RedeemResponse | null = null;
  try {
    redeemed = await redeemTicket(token, env, fetchImpl);
  } catch {
    return jsonError(503);
  }
  if (!redeemed) return jsonError(404);

  const expectedSize = Number(redeemed.sizeBytes);
  if (!Number.isSafeInteger(expectedSize) || expectedSize < 0) return jsonError(502);

  const commonHeaders = new Headers({
    "accept-ranges": "bytes",
    "cache-control": "private, no-store",
    "content-disposition": contentDisposition(redeemed.downloadFilename),
    "content-type": redeemed.contentType || "application/octet-stream",
    "referrer-policy": "no-referrer",
    "x-content-type-options": "nosniff",
  });

  if (request.method === "HEAD") {
    const object = await env.VAULT_ASSETS.head(redeemed.objectKey);
    if (!object || object.size !== expectedSize) return jsonError(404);
    commonHeaders.set("content-length", String(object.size));
    commonHeaders.set("etag", object.httpEtag);
    return new Response(null, { status: 200, headers: commonHeaders });
  }

  const rangeHeader = request.headers.get("range");
  const range = rangeHeader ? parseByteRange(rangeHeader, expectedSize) : null;
  if (rangeHeader && !range) {
    commonHeaders.set("content-range", `bytes */${expectedSize}`);
    return new Response(null, { status: 416, headers: commonHeaders });
  }

  const object = await env.VAULT_ASSETS.get(redeemed.objectKey, range ? { range } : undefined);
  if (!object || object.size !== expectedSize) return jsonError(404);

  commonHeaders.set("etag", object.httpEtag);
  if (range) {
    commonHeaders.set("content-length", String(range.length));
    commonHeaders.set("content-range", contentRangeHeader(range, expectedSize));
    return new Response(object.body, { status: 206, headers: commonHeaders });
  }

  commonHeaders.set("content-length", String(expectedSize));
  return new Response(object.body, { status: 200, headers: commonHeaders });
}


export async function processNotificationSchedule(
  env: DownloadWorkerEnv,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const origin = env.ORIGIN_API_URL.replace(/\/$/, "");
  const response = await fetchImpl(`${origin}/api/internal/notifications/process`, {
    method: "POST",
    headers: { authorization: `Bearer ${env.OCTALVE_INTERNAL_CRON_SECRET}` },
  });
  if (!response.ok) throw new Error(`Notification processing failed with ${response.status}.`);
}

const vaultDownloadWorker = {
  fetch(request: Request, env: DownloadWorkerEnv): Promise<Response> {
    return handleDownloadRequest(request, env);
  },
  async scheduled(_controller: unknown, env: DownloadWorkerEnv, ctx: { waitUntil(promise: Promise<unknown>): void }): Promise<void> {
    ctx.waitUntil(processNotificationSchedule(env));
  },
};

export default vaultDownloadWorker;
