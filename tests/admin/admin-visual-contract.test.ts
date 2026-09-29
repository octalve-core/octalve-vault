import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ADMIN_ROOT = "src/features/admin";
const ADMIN_SHELL = "src/features/admin/layout/admin-shell.tsx";

function walk(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const file = path.join(root, name);
    return statSync(file).isDirectory()
      ? walk(file)
      : file.endsWith(".tsx")
        ? [file]
        : [];
  });
}

test("Admin presentation uses medium typography instead of heavy Tailwind weights", () => {
  const violations: string[] = [];
  const heavy = /\bfont-(?:black|extrabold|bold|semibold)\b/g;

  for (const file of walk(ADMIN_ROOT)) {
    const source = readFileSync(file, "utf8");
    const matches = source.match(heavy) ?? [];

    if (matches.length > 0) {
      violations.push(`${file}: ${matches.join(", ")}`);
    }
  }

  assert.deepEqual(
    violations,
    [],
    `Heavy Admin typography remains:\n${violations.join("\n")}`,
  );
});

test("dark Admin sidebar uses solid white text except the active inverse navigation item", () => {
  const source = readFileSync(ADMIN_SHELL, "utf8");

  assert.match(
    source,
    /active \? "bg-white text-slate-950" : "text-white hover:bg-white\/\[\.06\] hover:text-white"/,
  );

  assert.match(
    source,
    /tracking-\[\.14em\] text-white">Administration/,
  );

  assert.match(
    source,
    /truncate text-xs text-white">\{user\.email\}/,
  );

  assert.match(
    source,
    /tracking-\[\.12em\] text-white">\{user\.role\.replaceAll/,
  );

  assert.match(
    source,
    /text-sm font-medium text-white hover:bg-white\/\[\.05\] hover:text-white/,
  );

  assert.doesNotMatch(source, /text-white\/(?:35|50|55)/);
  assert.doesNotMatch(source, /text-\[#79AEFF\]/);
});
