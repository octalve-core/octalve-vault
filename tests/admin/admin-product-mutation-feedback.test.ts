import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const editor = readFileSync("src/features/admin/products/product-editor.tsx", "utf8");
const create = readFileSync("src/features/admin/products/product-create-page-form.tsx", "utf8");

test("active Product editor emits prominent server-authoritative mutation feedback", () => {
  assert.match(editor, /adminNotice\.pending/);
  assert.match(editor, /adminNotice\.success/);
  assert.match(editor, /adminNotice\.error/);
  assert.match(editor, /Activating product/);
  assert.match(editor, /Product activated/);
  assert.match(editor, /Saving translation/);
  assert.match(editor, /Translation saved/);
  assert.match(editor, /Saving price/);
  assert.match(editor, /Price saved/);
  assert.match(editor, /Uploading product file/);
  assert.match(editor, /Verifying uploaded file/);
  assert.match(editor, /Upload verified/);
  assert.match(editor, /Publishing asset/);
  assert.match(editor, /Asset published/);
  assert.match(editor, /router\.refresh\(\)/);
});

test("dedicated Product creation page reports create progress before navigation", () => {
  assert.match(create, /adminNotice\.pending/);
  assert.match(create, /Creating product/);
  assert.match(create, /Product created/);
  assert.match(create, /adminNotice\.error/);
  assert.match(create, /\/api\/admin\/products/);
  assert.match(create, /router\.(?:push|replace)/);
});

test("active Product mutation surfaces do not use browser alert or confirm", () => {
  assert.doesNotMatch(editor, /\bwindow\.alert\s*\(|\balert\s*\(|\bwindow\.confirm\s*\(|\bconfirm\s*\(/);
  assert.doesNotMatch(create, /\bwindow\.alert\s*\(|\balert\s*\(|\bwindow\.confirm\s*\(|\bconfirm\s*\(/);
});
