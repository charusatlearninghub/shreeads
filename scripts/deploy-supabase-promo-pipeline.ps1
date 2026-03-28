# Run from repo root AFTER:
#   npx supabase login
#   npx supabase link --project-ref djdptyebbwidcnhrtrkc
#     (use -p YOUR_DB_PASSWORD if prompted; password is under Project Settings → Database)
#
# Or set SUPABASE_ACCESS_TOKEN (Dashboard → Account → Access Tokens) and link once.
#
# This script applies migrations + deploys redeem-promo-code only.

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

Write-Host 'Applying migrations + deploying redeem-promo-code...' -ForegroundColor Cyan
npm run supabase:deploy:promo-pipeline
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Next: Supabase SQL Editor → run supabase/scripts/promo-revenue-verify-and-backfill.sql' -ForegroundColor Green
