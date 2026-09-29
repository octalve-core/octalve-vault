import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function topLevelRules(css: string) {
  const rules: Array<{ selector: string; body: string }> = [];
  let depth = 0;
  let segmentStart = 0;
  let current: { selector: string; open: number } | null = null;
  let quote: string | null = null;
  let inComment = false;

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i];
    const next = css[i + 1];

    if (inComment) {
      if (ch === "*" && next === "/") {
        inComment = false;
        i += 1;
      }
      continue;
    }

    if (quote) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }

    if (ch === "/" && next === "*") {
      inComment = true;
      i += 1;
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }

    if (depth === 0 && ch === ";") {
      segmentStart = i + 1;
      continue;
    }

    if (ch === "{") {
      if (depth === 0) {
        current = {
          selector: css.slice(segmentStart, i).trim(),
          open: i,
        };
      }
      depth += 1;
      continue;
    }

    if (ch === "}") {
      depth -= 1;
      if (depth === 0 && current) {
        rules.push({
          selector: current.selector,
          body: css.slice(current.open + 1, i),
        });
        current = null;
        segmentStart = i + 1;
      }
    }
  }

  assert.equal(depth, 0, "globals.css braces must be balanced");
  return rules;
}

test("global anchor color reset stays inside Tailwind layers", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  const offenders = topLevelRules(css).filter((rule) => {
    const selectsPlainAnchor = rule.selector
      .split(",")
      .map((part) => part.trim())
      .includes("a");

    const setsInheritedColor =
      /(?:^|;)\s*color\s*:\s*inherit\s*(?:!important\s*)?;?/i.test(
        rule.body,
      );

    return selectsPlainAnchor && setsInheritedColor;
  });

  assert.equal(
    offenders.length,
    0,
    "plain a { color: inherit } must not be unlayered because it overrides normal Tailwind v4 color utilities",
  );
});
