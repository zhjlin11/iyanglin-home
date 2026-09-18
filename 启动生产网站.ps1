$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "Building Yanglin site..." -ForegroundColor Cyan
npm.cmd run build
if (Test-Path .next\standalone\.next\static) { Remove-Item .next\standalone\.next\static -Recurse -Force }
New-Item -ItemType Directory -Force .next\standalone\.next | Out-Null
Copy-Item .next\static .next\standalone\.next\static -Recurse -Force
if (Test-Path public) { Copy-Item public .next\standalone\public -Recurse -Force }
Write-Host "Starting fixed production server: http://localhost:3010" -ForegroundColor Green
Write-Host "Keep this window open while using the site." -ForegroundColor Yellow
$env:PORT = "3010"
if (Test-Path .env.local) {
  Get-Content .env.local | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)\s*=\s*(.*)\s*$') { [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process') }
  }
}
node .next\standalone\server.js
