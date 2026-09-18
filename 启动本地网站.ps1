$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "Yanglin site: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Keep this window open while using the site." -ForegroundColor Yellow
npm.cmd run dev -- -p 3000
