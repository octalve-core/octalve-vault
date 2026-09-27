# Prisma migrations

`20260926190000_initial/migration.sql` is the initial PostgreSQL migration included with the standalone Vault source.

The archive-generation environment could not install/run the pinned Prisma CLI, so this SQL has been source-reviewed against `prisma/schema.prisma` but **must be validated with Prisma 6.19.3 before the first production database deployment**.

From a clean checkout:

```powershell
pnpm install --frozen-lockfile
pnpm exec prisma validate
pnpm exec prisma generate
```

To independently regenerate the initial SQL for comparison:

1. Move `prisma/migrations/20260926190000_initial` temporarily outside `prisma/migrations`.
2. Run:

```powershell
.\scripts\create-initial-migration.ps1
```

3. Compare the generated SQL with the included migration.
4. Keep one reviewed initial migration only.
5. Run the complete release gate:

```powershell
.\scripts\verify.ps1
```

For production use only `prisma migrate deploy`; never use `prisma migrate dev` against the production database.
