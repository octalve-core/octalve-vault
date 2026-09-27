export type ByteRange = { offset: number; length: number };

export function parseByteRange(header: string | null, size: number): ByteRange | null {
  if (!header || !Number.isSafeInteger(size) || size <= 0) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, startText, endText] = match;
  if (!startText && !endText) return null;

  if (!startText) {
    const suffix = Number(endText);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    const length = Math.min(suffix, size);
    return { offset: size - length, length };
  }

  const start = Number(startText);
  if (!Number.isSafeInteger(start) || start < 0 || start >= size) return null;

  if (!endText) return { offset: start, length: size - start };
  const requestedEnd = Number(endText);
  if (!Number.isSafeInteger(requestedEnd) || requestedEnd < start) return null;
  const end = Math.min(requestedEnd, size - 1);
  return { offset: start, length: end - start + 1 };
}

export function contentRangeHeader(range: ByteRange, totalSize: number): string {
  if (range.offset < 0 || range.length <= 0 || range.offset + range.length > totalSize) {
    throw new Error("Invalid byte range.");
  }
  return `bytes ${range.offset}-${range.offset + range.length - 1}/${totalSize}`;
}
