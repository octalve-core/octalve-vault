import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOTS = [
  "src/features/store",
  "src/features/customer-vault",
  "src/features/legal",
] as const;

const interactiveTag = /<(?:button|a|Link)\b[\s\S]*?>/gi;
const staticClass = /className\s*=\s*"([^"]*)"/i;

const strongBlue =
  /^(?:bg-\[#(?:0A84FF|0064E0)\]|bg-blue-(?:500|600|700|800|900|950))$/i;
const strongRed =
  /^(?:bg-\[#E61525\]|bg-red-(?:500|600|700|800|900|950))$/i;

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

test("static filled public CTA contrast contract is explicit and accessible", () => {
  const violations: string[] = [];
  let targets = 0;

  for (const file of ROOTS.flatMap((root) => walk(root))) {
    const source = readFileSync(file, "utf8");

    for (const tag of source.match(interactiveTag) ?? []) {
      const classMatch = tag.match(staticClass);
      if (!classMatch) continue;

      const classes = classMatch[1].trim().split(/\s+/);
      const blue = classes.some((token) => strongBlue.test(token));
      const red = classes.some((token) => strongRed.test(token));

      if (!blue && !red) continue;
      targets += 1;

      if (blue && red) {
        violations.push(`${file}: ambiguous red+blue default fill`);
        continue;
      }

      const canonicalBackground = blue
        ? classes.includes("bg-[#0064E0]")
        : classes.includes("bg-[#E61525]");

      const hasWhite = classes.includes("text-white");
      const hasMedium = classes.includes("font-medium");
      const hasHeavy = classes.some((token) =>
        ["font-black", "font-extrabold", "font-bold", "font-semibold"].includes(
          token,
        ),
      );
      const hasFocus = classes.some((token) =>
        token.startsWith("focus-visible:"),
      );
      const hoverBackground = classes.find((token) =>
        token.startsWith("hover:bg-"),
      );
      const hoverIsCanonical =
        !hoverBackground ||
        hoverBackground ===
          (blue ? "hover:bg-[#0057C2]" : "hover:bg-[#C81020]");

      if (
        !canonicalBackground ||
        !hasWhite ||
        !hasMedium ||
        hasHeavy ||
        !hasFocus ||
        !hoverIsCanonical
      ) {
        violations.push(
          `${file}: ${blue ? "blue" : "red"} CTA = ${classes.join(" ")}`,
        );
      }
    }
  }

  assert.ok(targets > 0, "Expected at least one recognized static filled CTA.");

  assert.deepEqual(
    violations,
    [],
    `Public filled CTA contract violations:\n${violations.join("\n")}`,
  );
});

test("dynamic cart CTA preserves disabled state and hardens enabled blue plus focus", () => {
  const source = readFileSync(
    "src/features/store/cart/cart-view.tsx",
    "utf8",
  );

  assert.match(
    source,
    /"pointer-events-none bg-slate-200 text-slate-400"/,
  );

  assert.doesNotMatch(
    source,
    /"bg-\[#0A84FF\] text-white hover:bg-\[#0064E0\]"/,
  );

  assert.match(
    source,
    /"bg-\[#0064E0\] text-white hover:bg-\[#0057C2\]"/,
  );

  assert.match(
    source,
    /focus-visible:ring-\[#0A84FF\]/,
  );
});

test("dynamic product modal CTA preserves unavailable and added states while hardening enabled blue", () => {
  const source = readFileSync(
    "src/features/store/products/product-detail-modal.tsx",
    "utf8",
  );

  assert.match(
    source,
    /"cursor-not-allowed bg-slate-100 text-slate-400"/,
  );

  assert.match(
    source,
    /"cursor-default bg-emerald-50 text-emerald-700"/,
  );

  assert.doesNotMatch(
    source,
    /"bg-\[#0A84FF\] text-white hover:bg-\[#0064E0\]"/,
  );

  assert.match(
    source,
    /"bg-\[#0064E0\] text-white hover:bg-\[#0057C2\]"/,
  );
});
