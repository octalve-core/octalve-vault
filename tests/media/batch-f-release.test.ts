import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

test("Batch F records ImageKit ProductMedia architecture and OWASP controls", () => {
  const spec = "docs/superpowers/specs/2026-10-01-octalve-vault-phase-2-product-media-imagekit-design.md";
  const plan = "docs/superpowers/plans/2026-10-01-octalve-vault-batch-f-product-media-imagekit.md";
  assert.equal(existsSync(spec), true);
  assert.equal(existsSync(plan), true);
  const text = readFileSync(spec, "utf8") + readFileSync(plan, "utf8");
  assert.match(text, /ImageKit/);
  assert.match(text, /ProductMedia/);
  assert.match(text, /Product\.imagePath/);
  assert.match(text, /private.*R2|R2.*private/is);
  assert.match(text, /OWASP/);
  assert.match(text, /20\/hour/);
  assert.match(text, /60\/day/);
});

test("ImageKit secrets are documented with empty example values", () => {
  const env = readFileSync(".env.example", "utf8");
  assert.match(env, /^IMAGEKIT_PRIVATE_KEY=$/m);
  assert.match(env, /^IMAGEKIT_PUBLIC_KEY=$/m);
  assert.match(env, /^IMAGEKIT_URL_ENDPOINT=$/m);
  assert.doesNotMatch(env, /NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY/);
});
