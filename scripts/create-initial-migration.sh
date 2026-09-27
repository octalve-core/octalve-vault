#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if find prisma/migrations -mindepth 1 -maxdepth 1 -type d -name '[0-9]*_*' | grep -q .; then
  echo "A Prisma migration already exists. Refusing to generate another initial migration." >&2
  exit 1
fi
stamp="$(date -u +%Y%m%d%H%M%S)"
dir="prisma/migrations/${stamp}_init"
mkdir -p "$dir"
pnpm exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > "$dir/migration.sql" || { rm -rf "$dir"; exit 1; }
test "$(wc -c < "$dir/migration.sql")" -ge 100 || { rm -rf "$dir"; echo "Generated migration is unexpectedly empty." >&2; exit 1; }
echo "Initial migration generated: $dir/migration.sql"
echo "Review it, then run ./scripts/verify.sh before committing/deploying."
