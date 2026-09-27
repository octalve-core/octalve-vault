const SAFE_ID = /^[a-z0-9][a-z0-9_-]{15,127}$/i;
const SAFE_EXTENSION = /^\.[a-z0-9]{1,10}$/i;

export type OpaqueObjectKeyInput = {
  now?: Date;
  extension: string;
  randomId: string;
};

export function createOpaqueObjectKey(input: OpaqueObjectKeyInput): string {
  const now = input.now ?? new Date();
  if (Number.isNaN(now.getTime())) throw new Error("Invalid object-key date.");
  if (!SAFE_ID.test(input.randomId)) throw new Error("Invalid opaque object identifier.");
  if (!SAFE_EXTENSION.test(input.extension)) throw new Error("Invalid object extension.");

  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `assets/${year}/${month}/${input.randomId}${input.extension.toLowerCase()}`;
}
