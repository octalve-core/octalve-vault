import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Admin dashboard headings use medium typography", () => {
  const page = readFileSync(
    "src/app/admin/(protected)/page.tsx",
    "utf8",
  );

  assert.match(
    page,
    /text-xs font-medium uppercase tracking-\[\.14em\] text-\[#0064E0\]">Overview/,
  );

  assert.match(
    page,
    /text-3xl font-medium tracking-\[-0\.045em\] text-slate-950">Vault operations/,
  );

  assert.doesNotMatch(
    page,
    /\bfont-(?:black|extrabold|bold|semibold)\b/,
  );
});
