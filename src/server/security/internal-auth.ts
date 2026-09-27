import { timingSafeEqual } from "node:crypto";

export function verifyInternalBearer(header: string | null, expectedSecret: string): boolean {
  if (Buffer.byteLength(expectedSecret) < 32 || !header?.startsWith("Bearer ")) return false;
  const supplied = header.slice(7);
  const a = Buffer.from(supplied, "utf8");
  const b = Buffer.from(expectedSecret, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
