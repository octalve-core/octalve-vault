#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
run(){ echo; echo "==> $1"; shift; "$@"; echo "PASS: $1"; }
run "Frozen pnpm install" pnpm install --frozen-lockfile
run "Forbidden-file/source verification" pnpm verify:source
run "Automated tests" pnpm test
run "Prisma schema validation" pnpm exec prisma validate
run "Prisma Client generation" pnpm exec prisma generate
if ! find prisma/migrations -mindepth 1 -maxdepth 1 -type d -name '[0-9]*_*' | grep -q .; then
  echo "No initial Prisma migration exists. Run ./scripts/create-initial-migration.sh, review it, then rerun verification." >&2
  exit 1
fi
run "TypeScript" pnpm typecheck
run "ESLint" pnpm lint
run "Production dependency audit" pnpm audit --prod
run "Full dependency audit" pnpm audit
run "Production build" pnpm build
run "Frozen lockfile re-check" pnpm install --frozen-lockfile
run "pnpm store integrity" pnpm store status
echo; echo "ALL OCTALVE VAULT VERIFICATION GATES PASSED"
