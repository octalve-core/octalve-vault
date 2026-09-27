import test from "node:test";
import assert from "node:assert/strict";
import { createOpaqueObjectKey } from "../../src/server/storage/object-key.ts";
import { presignR2HeadObject, presignR2PutObject } from "../../src/server/storage/r2-presign.ts";
import { createDownloadTicketToken, inspectDownloadTicket } from "../../src/server/vault/download-ticket-core.ts";
import { hashBearerToken } from "../../src/server/auth/token-hash.ts";
import { parseByteRange, contentRangeHeader } from "../../workers/vault-download/src/range.ts";

test("R2 object keys are opaque and do not leak product names or filenames", () => {
  const key = createOpaqueObjectKey({
    now: new Date("2026-09-26T18:00:00.000Z"),
    extension: ".zip",
    randomId: "01k6by30wmz7j5f8v2h4n6q8rt",
  });

  assert.equal(key, "assets/2026/09/01k6by30wmz7j5f8v2h4n6q8rt.zip");
  assert.equal(key.includes("proposal"), false);
  assert.equal(key.includes("business-plan"), false);
});

test("R2 PUT authorization is short lived, content-type bound, and scoped to one object", () => {
  const signed = presignR2PutObject({
    accountId: "0123456789abcdef0123456789abcdef",
    accessKeyId: "TESTACCESSKEY",
    secretAccessKey: "test-secret-key-for-deterministic-signing",
    bucket: "octalve-vault-assets",
    objectKey: "assets/2026/09/test-object.zip",
    contentType: "application/zip",
    expiresInSeconds: 600,
    now: new Date("2026-09-26T18:00:00.000Z"),
  });

  const url = new URL(signed.url);
  assert.equal(url.hostname, "octalve-vault-assets.0123456789abcdef0123456789abcdef.r2.cloudflarestorage.com");
  assert.equal(url.pathname, "/assets/2026/09/test-object.zip");
  assert.equal(url.searchParams.get("X-Amz-Algorithm"), "AWS4-HMAC-SHA256");
  assert.equal(url.searchParams.get("X-Amz-Expires"), "600");
  assert.equal(url.searchParams.get("X-Amz-SignedHeaders"), "content-type;host");
  assert.match(url.searchParams.get("X-Amz-Signature") ?? "", /^[a-f0-9]{64}$/);
  assert.deepEqual(signed.headers, { "content-type": "application/zip" });
});

test("R2 HEAD authorization signs only the host and the exact object", () => {
  const signed = presignR2HeadObject({
    accountId: "0123456789abcdef0123456789abcdef",
    accessKeyId: "TESTACCESSKEY",
    secretAccessKey: "test-secret-key-for-deterministic-signing",
    bucket: "octalve-vault-assets",
    objectKey: "assets/2026/09/test-object.zip",
    expiresInSeconds: 60,
    now: new Date("2026-09-26T18:00:00.000Z"),
  });
  const url = new URL(signed.url);
  assert.equal(url.searchParams.get("X-Amz-SignedHeaders"), "host");
  assert.equal(url.searchParams.get("X-Amz-Expires"), "60");
  assert.match(url.searchParams.get("X-Amz-Signature") ?? "", /^[a-f0-9]{64}$/);
});

test("download tickets expose a random token but persist only its HMAC hash", () => {
  const secret = "x".repeat(64);
  const created = createDownloadTicketToken({ secret, bytes: 32 });

  assert.match(created.token, /^[A-Za-z0-9_-]{40,}$/);
  assert.equal(created.tokenHash, hashBearerToken(created.token, secret));
  assert.notEqual(created.token, created.tokenHash);
});

test("download ticket inspection rejects expired and tampered bearer tokens", () => {
  const secret = "y".repeat(64);
  const now = new Date("2026-09-26T18:00:00.000Z");
  const created = createDownloadTicketToken({ secret, bytes: 32 });

  assert.equal(
    inspectDownloadTicket({
      rawToken: created.token,
      storedTokenHash: created.tokenHash,
      secret,
      expiresAt: new Date("2026-09-26T18:03:00.000Z"),
      now,
    }),
    "VALID",
  );

  assert.equal(
    inspectDownloadTicket({
      rawToken: created.token + "tampered",
      storedTokenHash: created.tokenHash,
      secret,
      expiresAt: new Date("2026-09-26T18:03:00.000Z"),
      now,
    }),
    "INVALID",
  );

  assert.equal(
    inspectDownloadTicket({
      rawToken: created.token,
      storedTokenHash: created.tokenHash,
      secret,
      expiresAt: new Date("2026-09-26T17:59:59.000Z"),
      now,
    }),
    "EXPIRED",
  );
});

test("range parsing accepts bounded and suffix ranges and rejects multi-range requests", () => {
  assert.deepEqual(parseByteRange("bytes=100-199", 1000), { offset: 100, length: 100 });
  assert.deepEqual(parseByteRange("bytes=900-", 1000), { offset: 900, length: 100 });
  assert.deepEqual(parseByteRange("bytes=-200", 1000), { offset: 800, length: 200 });
  assert.equal(parseByteRange("bytes=0-1,4-5", 1000), null);
  assert.equal(parseByteRange("bytes=1000-", 1000), null);
});

test("content range headers describe the exact returned segment", () => {
  assert.equal(contentRangeHeader({ offset: 100, length: 100 }, 1000), "bytes 100-199/1000");
});

import { handleDownloadRequest, processNotificationSchedule } from "../../workers/vault-download/src/index.ts";

test("download Worker redeems ticket privately and streams only the requested byte range", async () => {
  const stored = new TextEncoder().encode("0123456789");
  let requestedKey = "";
  let requestedRange: unknown = undefined;
  const env = {
    VAULT_ASSETS: {
      async get(key: string, options?: { range?: { offset: number; length: number } }) {
        requestedKey = key;
        requestedRange = options?.range;
        const range = options?.range ?? { offset: 0, length: stored.byteLength };
        const bytes = stored.slice(range.offset, range.offset + range.length);
        return {
          body: new Blob([bytes]).stream(),
          size: stored.byteLength,
          httpEtag: '"etag-1"',
        };
      },
      async head() {
        return null;
      },
    },
    ORIGIN_API_URL: "https://vault.octalve.com",
    OCTALVE_INTERNAL_REDEEM_SECRET: "internal-secret-value",
    OCTALVE_INTERNAL_CRON_SECRET: "cron-secret-value",
  };

  const fetchImpl: typeof fetch = async (input, init) => {
    assert.equal(String(input), "https://vault.octalve.com/api/internal/downloads/redeem");
    assert.equal(new Headers(init?.headers).get("authorization"), "Bearer internal-secret-value");
    return Response.json({
      objectKey: "assets/2026/09/opaque.zip",
      downloadFilename: "Octalve-Templates.zip",
      contentType: "application/zip",
      sizeBytes: "10",
    });
  };

  const response = await handleDownloadRequest(
    new Request("https://downloads.octalve.com/d/opaque_token_abcdefghijklmnopqrstuvwxyz012345", {
      headers: { Range: "bytes=2-5" },
    }),
    env,
    fetchImpl,
  );

  assert.equal(response.status, 206);
  assert.equal(response.headers.get("content-range"), "bytes 2-5/10");
  assert.equal(response.headers.get("content-length"), "4");
  assert.equal(response.headers.get("content-disposition"), 'attachment; filename="Octalve-Templates.zip"');
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  assert.equal(await response.text(), "2345");
  assert.equal(requestedKey, "assets/2026/09/opaque.zip");
  assert.deepEqual(requestedRange, { offset: 2, length: 4 });
});


test("download Worker scheduled job calls only the protected notification processor", async () => {
  const calls: Array<{ url: string; method: string; authorization: string | null }> = [];
  const env = {
    VAULT_ASSETS: { async get() { return null; }, async head() { return null; } },
    ORIGIN_API_URL: "https://vault.octalve.com/",
    OCTALVE_INTERNAL_REDEEM_SECRET: "download-secret",
    OCTALVE_INTERNAL_CRON_SECRET: "cron-secret",
  };
  const fetchImpl: typeof fetch = async (input, init) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      authorization: new Headers(init?.headers).get("authorization"),
    });
    return new Response(null, { status: 204 });
  };

  await processNotificationSchedule(env, fetchImpl);

  assert.deepEqual(calls, [{
    url: "https://vault.octalve.com/api/internal/notifications/process",
    method: "POST",
    authorization: "Bearer cron-secret",
  }]);
});
