import { createHash, createHmac } from "node:crypto";

const MAX_EXPIRES_SECONDS = 60 * 60 * 24 * 7;
const SERVICE = "s3";
const REGION = "auto";
const ALGORITHM = "AWS4-HMAC-SHA256";
const TERMINATOR = "aws4_request";
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";

type BasePresignInput = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  objectKey: string;
  expiresInSeconds: number;
  now?: Date;
};

export type PresignR2PutInput = BasePresignInput & {
  contentType: string;
};

export type PresignR2HeadInput = BasePresignInput;

export type PresignedR2Request = {
  url: string;
  headers: Readonly<Record<string, string>>;
  expiresAt: Date;
};

function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value, "utf8").digest();
}

function awsEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function canonicalPath(objectKey: string): string {
  const normalized = objectKey.replace(/^\/+/, "");
  if (!normalized || normalized.includes("..")) throw new Error("Invalid R2 object key.");
  return `/${normalized.split("/").map(awsEncode).join("/")}`;
}

function assertDnsLabel(value: string, name: string): void {
  if (
    value.length > 63 ||
    !/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(value)
  ) {
    throw new Error(`Invalid ${name}.`);
  }
}

function amzDateParts(now: Date): { dateStamp: string; amzDate: string } {
  if (Number.isNaN(now.getTime())) throw new Error("Invalid signing date.");
  const iso = now.toISOString();
  return {
    dateStamp: iso.slice(0, 10).replaceAll("-", ""),
    amzDate: iso.replace(/[:-]|\.\d{3}/g, ""),
  };
}

function presignR2Request(input: BasePresignInput & { method: "PUT" | "HEAD"; contentType?: string }): PresignedR2Request {
  assertDnsLabel(input.bucket, "R2 bucket name");
  if (!/^[a-f0-9]{32}$/i.test(input.accountId)) throw new Error("Invalid Cloudflare account ID.");
  if (!input.accessKeyId.trim()) throw new Error("Missing R2 access key ID.");
  if (Buffer.byteLength(input.secretAccessKey) < 20) throw new Error("Invalid R2 secret access key.");
  if (!Number.isInteger(input.expiresInSeconds) || input.expiresInSeconds < 1 || input.expiresInSeconds > MAX_EXPIRES_SECONDS) {
    throw new Error("R2 presigned URL expiry must be between 1 and 604800 seconds.");
  }

  const now = input.now ?? new Date();
  const { dateStamp, amzDate } = amzDateParts(now);
  const host = `${input.bucket}.${input.accountId}.r2.cloudflarestorage.com`;
  const path = canonicalPath(input.objectKey);
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/${TERMINATOR}`;
  const contentType = input.contentType?.trim();
  if (contentType !== undefined && (!contentType || /[\r\n]/.test(contentType))) {
    throw new Error("Invalid content type.");
  }

  const signedHeaders = contentType ? "content-type;host" : "host";
  const canonicalHeaders = contentType
    ? `content-type:${contentType}\nhost:${host}\n`
    : `host:${host}\n`;

  const queryEntries: Array<[string, string]> = [
    ["X-Amz-Algorithm", ALGORITHM],
    ["X-Amz-Content-Sha256", UNSIGNED_PAYLOAD],
    ["X-Amz-Credential", `${input.accessKeyId}/${credentialScope}`],
    ["X-Amz-Date", amzDate],
    ["X-Amz-Expires", String(input.expiresInSeconds)],
    ["X-Amz-SignedHeaders", signedHeaders],
  ];

  const canonicalQuery = queryEntries
    .map(([key, value]) => [awsEncode(key), awsEncode(value)] as const)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  const canonicalRequest = [
    input.method,
    path,
    canonicalQuery,
    canonicalHeaders,
    signedHeaders,
    UNSIGNED_PAYLOAD,
  ].join("\n");

  const stringToSign = [ALGORITHM, amzDate, credentialScope, sha256Hex(canonicalRequest)].join("\n");
  const kDate = hmac(`AWS4${input.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, REGION);
  const kService = hmac(kRegion, SERVICE);
  const kSigning = hmac(kService, TERMINATOR);
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");
  const url = `https://${host}${path}?${canonicalQuery}&X-Amz-Signature=${signature}`;

  return {
    url,
    headers: contentType ? { "content-type": contentType } : {},
    expiresAt: new Date(now.getTime() + input.expiresInSeconds * 1000),
  };
}

export function presignR2PutObject(input: PresignR2PutInput): PresignedR2Request {
  return presignR2Request({ ...input, method: "PUT" });
}

export function presignR2HeadObject(input: PresignR2HeadInput): PresignedR2Request {
  return presignR2Request({ ...input, method: "HEAD" });
}
