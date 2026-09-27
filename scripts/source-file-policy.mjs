import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export function selectVerificationFiles(root, fallbackFiles) {
  try {
    const inside = execFileSync("git", ["-C", root, "rev-parse", "--is-inside-work-tree"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (inside !== "true") return fallbackFiles;

    const prefix = execFileSync("git", ["-C", root, "rev-parse", "--show-prefix"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    if (prefix !== "") return fallbackFiles;

    const listed = execFileSync(
      "git",
      ["-C", root, "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] },
    );
    const unique = new Set(listed.split("\0").filter(Boolean));
    return [...unique]
      .map((relativePath) => path.join(root, relativePath))
      .filter((file) => fs.existsSync(file) && fs.statSync(file).isFile());
  } catch {
    return fallbackFiles;
  }
}
