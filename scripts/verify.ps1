$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Run([string]$Label, [scriptblock]$Command) {
  Write-Host "`n==> $Label"
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Label failed with exit code $LASTEXITCODE" }
  Write-Host "PASS: $Label"
}

Run "Frozen pnpm install" { pnpm install --frozen-lockfile }
Run "Forbidden-file/source verification" { pnpm verify:source }
Run "Automated tests" { pnpm test }
Run "Prisma schema validation" { pnpm exec prisma validate }
Run "Prisma Client generation" { pnpm exec prisma generate }

$Migration = Get-ChildItem .\prisma\migrations -Directory -ErrorAction SilentlyContinue | Where-Object { $_.Name -match '^\d{14}_' } | Select-Object -First 1
if (-not $Migration) { throw "No initial Prisma migration exists. Run .\scripts\create-initial-migration.ps1, review it, then rerun verification." }

Run "TypeScript" { pnpm typecheck }
Run "ESLint" { pnpm lint }
Run "Production dependency audit" { pnpm audit --prod }
Run "Full dependency audit" { pnpm audit }
Run "Production build" { pnpm build }
Run "Frozen lockfile re-check" { pnpm install --frozen-lockfile }

Write-Host "`n==> pnpm store integrity"
$Temp = Join-Path $env:TEMP "octalve-vault-store-status.txt"
cmd /c "pnpm store status > `"$Temp`" 2>&1"
$StoreCode = $LASTEXITCODE
$StoreText = if (Test-Path $Temp) { Get-Content $Temp -Raw } else { "" }
Write-Host $StoreText
Remove-Item $Temp -ErrorAction SilentlyContinue
if ($StoreCode -ne 0) { throw "pnpm store status failed with exit code $StoreCode" }
Write-Host "PASS: pnpm store integrity"

Write-Host "`nALL OCTALVE VAULT VERIFICATION GATES PASSED"
