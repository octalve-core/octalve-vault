$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
$MigrationRoot = Join-Path $Root "prisma\migrations"
$Existing = Get-ChildItem $MigrationRoot -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^\d{14}_' }
if ($Existing) { throw "A Prisma migration already exists. Refusing to generate another initial migration." }

$Stamp = Get-Date -Format "yyyyMMddHHmmss"
$Dir = Join-Path $MigrationRoot ("${Stamp}_init")
New-Item -ItemType Directory -Path $Dir | Out-Null
$Sql = Join-Path $Dir "migration.sql"

& pnpm exec prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script | Set-Content -Encoding UTF8 $Sql
if ($LASTEXITCODE -ne 0) { Remove-Item -Recurse -Force $Dir; throw "Prisma migrate diff failed." }
if (-not (Test-Path $Sql) -or (Get-Item $Sql).Length -lt 100) { Remove-Item -Recurse -Force $Dir; throw "Generated migration is unexpectedly empty." }
Write-Host "Initial migration generated: $Sql"
Write-Host "Review it, then run .\scripts\verify.ps1 before committing/deploying."
