import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();

const canonicalAssets: Record<string, string> = {
  "public/products/vp001.png": "b9724eddcd719f27d87871ded46c6210fe09f93a710abfcc7441b390412137a2",
  "public/products/vp002.png": "c5babc8d5bb6697075d33e6148b8c29fc86333a28b48695aa7553dc9f5e9d09f",
  "public/products/vp003.png": "b9724eddcd719f27d87871ded46c6210fe09f93a710abfcc7441b390412137a2",
  "public/products/vp004.png": "c5babc8d5bb6697075d33e6148b8c29fc86333a28b48695aa7553dc9f5e9d09f",
  "public/products/vp005.png": "4ff288780b5181e7ee076deb77a0129d7c1f6ff07eb4860433e6e8db606af94a",
  "public/products/vp006.png": "ed923ec25abc437ea9909dd014258f9dec5641ee0df9721c98e50c02eaf8dc12",
  "public/products/vp007.png": "b9724eddcd719f27d87871ded46c6210fe09f93a710abfcc7441b390412137a2",
  "public/products/vp008.png": "c5babc8d5bb6697075d33e6148b8c29fc86333a28b48695aa7553dc9f5e9d09f",
  "public/products/vp009.png": "b9724eddcd719f27d87871ded46c6210fe09f93a710abfcc7441b390412137a2",
  "public/products/vp010.png": "4ff288780b5181e7ee076deb77a0129d7c1f6ff07eb4860433e6e8db606af94a",
  "public/products/vp011.png": "ed923ec25abc437ea9909dd014258f9dec5641ee0df9721c98e50c02eaf8dc12",
  "public/brand/vault-logo.png": "08e08bc6403992bf3c9fbe1d43c3da3c7ac4c9451adeb9f5962fd48ccf3fbb13",
  "public/brand/mx-logo.png": "d6b4d62be872de8949ba1503c24dc7f552da812b20ba855a5714cca0d91fd4ac",
  "public/brand/octalve-logo.png": "d6b4d62be872de8949ba1503c24dc7f552da812b20ba855a5714cca0d91fd4ac",
};

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
}

test("canonical Octalve Vault public assets exist unchanged", () => {
  for (const [assetPath, expectedHash] of Object.entries(canonicalAssets)) {
    assert.equal(existsSync(resolve(root, assetPath)), true, `${assetPath} must exist`);
    assert.equal(sha256(assetPath), expectedHash, `${assetPath} must remain byte-identical to the canonical Octalve asset`);
  }
});

test("Vault design token module locks the canonical Octalve public contract", () => {
  const tokenPath = resolve(root, "src/features/store/design/vault-tokens.ts");
  assert.equal(existsSync(tokenPath), true, "vault-tokens.ts must exist");

  const source = readFileSync(tokenPath, "utf8");
  for (const color of ["#E61525", "#0064E0", "#29BE3E", "#FC7E24", "#000A16", "#0A84FF"]) {
    assert.match(source, new RegExp(color, "i"), `${color} must be part of the canonical token contract`);
  }
  assert.match(source, /VAULT_COLORS/);
  assert.match(source, /VAULT_TYPOGRAPHY/);
  assert.match(source, /font-medium/, "public navigation/headings must default to medium weight");
});
