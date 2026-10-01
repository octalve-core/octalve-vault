import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { parsePageSize } from "../../src/server/admin/resource-index.ts";

test("media discovery uses the shared Admin page-size contract", () => {
  const path = "src/server/admin/media-index.ts";
  assert.equal(existsSync(path), true);
  const source = readFileSync(path, "utf8");
  assert.match(source, /parsePageSize/);
  assert.match(source, /parsePage/);
  assert.match(source, /normalizeSearchText/);
  assert.equal(parsePageSize("50"), 50);
  assert.equal(parsePageSize("24"), 25);
});
