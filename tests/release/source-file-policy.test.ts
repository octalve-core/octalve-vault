import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { selectVerificationFiles } from "../../scripts/source-file-policy.mjs";

function git(root: string, args: string[]) {
  return execFileSync("git", ["-C", root, ...args], { encoding: "utf8" });
}

test("source verification excludes ignored local env files but includes tracked env files", () => {
  const root = mkdtempSync(path.join(tmpdir(), "octalve-source-policy-"));
  try {
    writeFileSync(path.join(root, ".gitignore"), ".env\n");
    writeFileSync(path.join(root, "tracked.txt"), "tracked\n");
    writeFileSync(path.join(root, "untracked.txt"), "untracked\n");
    writeFileSync(path.join(root, ".env"), "DATABASE_URL=REDACTED\n");

    git(root, ["init", "--quiet"]);
    git(root, ["add", ".gitignore", "tracked.txt"]);

    const allFiles = [
      path.join(root, ".gitignore"),
      path.join(root, "tracked.txt"),
      path.join(root, "untracked.txt"),
      path.join(root, ".env"),
    ];

    const ignored = selectVerificationFiles(root, allFiles).map((file) => path.relative(root, file).replaceAll(path.sep, "/"));
    assert.deepEqual(ignored.sort(), [".gitignore", "tracked.txt", "untracked.txt"].sort());

    git(root, ["add", "-f", ".env"]);
    const tracked = selectVerificationFiles(root, allFiles).map((file) => path.relative(root, file).replaceAll(path.sep, "/"));
    assert.equal(tracked.includes(".env"), true, "a force-added secret env file must remain visible to verification");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("source verification scans every physical file when Git metadata is unavailable", () => {
  const root = mkdtempSync(path.join(tmpdir(), "octalve-source-policy-nogit-"));
  try {
    const envFile = path.join(root, ".env");
    const sourceFile = path.join(root, "source.txt");
    writeFileSync(envFile, "DATABASE_URL=REDACTED\n");
    writeFileSync(sourceFile, "source\n");

    const selected = selectVerificationFiles(root, [envFile, sourceFile])
      .map((file) => path.relative(root, file).replaceAll(path.sep, "/"));
    assert.deepEqual(selected.sort(), [".env", "source.txt"].sort());
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});


test("source verification does not trust an ancestor Git repository as the project boundary", () => {
  const parent = mkdtempSync(path.join(tmpdir(), "octalve-source-policy-parent-"));
  const root = path.join(parent, "vault");
  try {
    mkdirSync(root);
    writeFileSync(path.join(parent, ".gitignore"), ".env\n");
    writeFileSync(path.join(root, "source.txt"), "source\n");
    writeFileSync(path.join(root, ".env"), "DATABASE_URL=REDACTED\n");

    git(parent, ["init", "--quiet"]);
    git(parent, ["add", ".gitignore"]);

    const allFiles = [path.join(root, "source.txt"), path.join(root, ".env")];
    const selected = selectVerificationFiles(root, allFiles)
      .map((file) => path.relative(root, file).replaceAll(path.sep, "/"));

    assert.deepEqual(selected.sort(), [".env", "source.txt"].sort());
  } finally {
    rmSync(parent, { recursive: true, force: true });
  }
});
