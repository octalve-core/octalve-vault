import fs from "node:fs";
import path from "node:path";
import { selectVerificationFiles } from "./source-file-policy.mjs";

const root = process.cwd();
const failures = [];
const warnings = [];
const requiredFiles = [
  "package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", ".env.example",
  "prisma/schema.prisma", "prisma/seed.mjs", "README.md", "ARCHITECTURE.md", "DEPLOYMENT.md",
  "SECURITY.md", "OPERATIONS.md", "ENVIRONMENT.md", "RELEASE_VERIFICATION.md",
  "workers/vault-download/src/index.ts", "workers/vault-download/wrangler.toml",
  "infrastructure/cloudflare/r2-cors.production.json",
];
for (const file of requiredFiles) if (!fs.existsSync(path.join(root, file))) failures.push(`Missing required file: ${file}`);

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", ".next", "out", "build", "coverage"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full)); else out.push(full);
  }
  return out;
}
const allFiles = walk(root);
const files = selectVerificationFiles(root, allFiles);
const rel = (file) => path.relative(root, file).replaceAll(path.sep, "/");

for (const file of files) {
  const r = rel(file);
  if ((path.basename(file).startsWith(".env") && r !== ".env.example") || /\.(?:pem|key|p12|pfx)$/i.test(r)) failures.push(`Forbidden secret-bearing file: ${r}`);
  if (r.toLowerCase().endsWith(".zip")) failures.push(`ZIP files must not be committed: ${r}`);
  if (r.startsWith("vault-files/")) failures.push(`Legacy commercial asset directory is forbidden: ${r}`);
}

const textExt = new Set([".ts", ".tsx", ".js", ".mjs", ".cjs", ".json", ".md", ".yaml", ".yml", ".toml", ".txt", ".css"]);
const secretPatterns = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, "private key"],
  [/\bsk_live_[A-Za-z0-9_-]{12,}\b/, "live Paystack-like secret"],
  [/\bFLWSECK-[A-Za-z0-9_-]{12,}\b/, "live Flutterwave secret"],
  [/\bpostgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@[^\s]+/i, "database credential URL"],
];
for (const file of files) {
  if (!textExt.has(path.extname(file).toLowerCase()) && path.basename(file) !== ".env.example") continue;
  const content = fs.readFileSync(file, "utf8");
  for (const [pattern, label] of secretPatterns) if (pattern.test(content)) failures.push(`Possible ${label} committed in ${rel(file)}`);
}

const envExample = fs.existsSync(".env.example") ? fs.readFileSync(".env.example", "utf8") : "";
const envNames = new Set([...envExample.matchAll(/^([A-Z][A-Z0-9_]*)=/gm)].map((m) => m[1]));
const envRefs = new Set();
for (const file of files.filter((f) => rel(f).startsWith("src/") || rel(f) === "next.config.ts" || rel(f).startsWith("workers/"))) {
  if (!textExt.has(path.extname(file).toLowerCase())) continue;
  const content = fs.readFileSync(file, "utf8");
  for (const m of content.matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g)) envRefs.add(m[1]);
  for (const m of content.matchAll(/(?:requiredEnv|optionalEnv|booleanEnv)\(["']([A-Z][A-Z0-9_]*)["']/g)) envRefs.add(m[1]);
}
for (const required of ["DATABASE_URL", "OCTALVE_INTERNAL_REDEEM_SECRET", "OCTALVE_INTERNAL_CRON_SECRET"]) envRefs.add(required);
envRefs.delete("NODE_ENV");
for (const name of [...envRefs].sort()) {
  const mapped = name === "OCTALVE_INTERNAL_REDEEM_SECRET" ? "INTERNAL_DOWNLOAD_SECRET" : name === "OCTALVE_INTERNAL_CRON_SECRET" ? "INTERNAL_CRON_SECRET" : name;
  if (!envNames.has(mapped)) failures.push(`.env.example does not document ${mapped}`);
}

const lock = fs.readFileSync("pnpm-lock.yaml", "utf8");
const yamlDocCount = (lock.match(/^---$/gm) ?? []).length;
if (yamlDocCount !== 2) failures.push(`pnpm-lock.yaml must contain exactly two YAML documents for pnpm 12 package-manager pinning; found ${yamlDocCount}.`);
if (!lock.includes("packageManagerDependencies:\n      pnpm:\n        specifier: 12.7.0\n        version: 12.7.0")) failures.push("pnpm-lock.yaml is missing the pnpm 12.7.0 packageManagerDependencies environment document.");
if (!lock.includes("'@pnpm/exe.win32-x64@12.7.0':")) failures.push("pnpm-lock.yaml is missing the pnpm 12.7.0 Windows executable integrity entry.");
if (!lock.includes("deepmerge-ts@: 8.0.2")) failures.push("pnpm-lock.yaml is missing deepmerge-ts 8.0.2 override.");
if (lock.includes("deepmerge-ts@7.")) failures.push("pnpm-lock.yaml still contains vulnerable deepmerge-ts 7.x.");
const workspace = fs.readFileSync("pnpm-workspace.yaml", "utf8");
if (!workspace.includes('"deepmerge-ts@": 8.0.2')) failures.push("pnpm-workspace.yaml is missing deepmerge-ts 8.0.2 override.");
if (!workspace.includes('"@pnpm/exe": true')) failures.push("pnpm-workspace.yaml must explicitly allow the pinned @pnpm/exe build to prevent pnpm 12 packageManagerDependencies churn.");

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
if (pkg.packageManager !== "pnpm@12.7.0") failures.push("packageManager must remain pnpm@12.7.0.");
for (const [name, specifier] of Object.entries({ ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) })) {
  const needle = `specifier: ${specifier}`;
  if (!lock.includes(needle)) failures.push(`Lockfile importer does not contain ${name} specifier ${specifier}.`);
}

function importerNames(sectionName, nextSectionName) {
  const start = lock.indexOf(`    ${sectionName}:\n`);
  if (start < 0) return [];
  const bodyStart = start + `    ${sectionName}:\n`.length;
  const endMarker = nextSectionName ? `    ${nextSectionName}:\n` : `\npackages:`;
  const end = lock.indexOf(endMarker, bodyStart);
  const body = lock.slice(bodyStart, end < 0 ? undefined : end);
  return [...body.matchAll(/^      ([^:]+):$/gm)].map((match) => match[1].replace(/^['"]|['"]$/g, ""));
}
const lockDeps = importerNames("dependencies", "devDependencies").sort();
const lockDevDeps = importerNames("devDependencies", null).sort();
const manifestDeps = Object.keys(pkg.dependencies ?? {}).sort();
const manifestDevDeps = Object.keys(pkg.devDependencies ?? {}).sort();
if (JSON.stringify(lockDeps) !== JSON.stringify(manifestDeps)) failures.push(`Lockfile runtime importer differs from package.json: lock=${lockDeps.join(",")} manifest=${manifestDeps.join(",")}`);
if (JSON.stringify(lockDevDeps) !== JSON.stringify(manifestDevDeps)) failures.push(`Lockfile dev importer differs from package.json: lock=${lockDevDeps.join(",")} manifest=${manifestDevDeps.join(",")}`);

const migrationDirs = fs.existsSync("prisma/migrations")
  ? fs.readdirSync("prisma/migrations", { withFileTypes: true }).filter((e) => e.isDirectory() && /^\d{14}_/.test(e.name))
  : [];
if (migrationDirs.length === 0) {
  failures.push("No timestamped initial Prisma migration is committed.");
} else {
  const migrationSql = migrationDirs
    .map((entry) => path.join(root, "prisma", "migrations", entry.name, "migration.sql"))
    .filter((file) => fs.existsSync(file))
    .map((file) => fs.readFileSync(file, "utf8"))
    .join("\n");
  const schema = fs.readFileSync("prisma/schema.prisma", "utf8");
  const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((match) => match[1]);
  const enums = [...schema.matchAll(/^enum\s+(\w+)\s*\{/gm)].map((match) => match[1]);
  for (const model of models) {
    if (!migrationSql.includes(`CREATE TABLE "${model}"`)) failures.push(`Initial migration is missing model table ${model}.`);
  }
  for (const enumName of enums) {
    if (!migrationSql.includes(`CREATE TYPE "${enumName}"`)) failures.push(`Initial migration is missing enum ${enumName}.`);
  }
}

if (failures.length) {
  console.error("SOURCE VERIFICATION FAILED");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("SOURCE VERIFICATION PASSED");
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
console.log(`Checked ${files.length} source-candidate files; no committed ZIPs, tracked secret env files, or known live-secret patterns found.`);
