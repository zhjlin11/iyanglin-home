$ErrorActionPreference = "Stop"

$SiteRoot = $PSScriptRoot
$LogDir = Join-Path $SiteRoot "logs"
$LogFile = Join-Path $LogDir "service-watchdog.log"
$Port = "3010"

New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
Set-Location $SiteRoot

function Write-ServiceLog {
  param([string]$Message)
  $line = "{0} {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $LogFile -Value $line -Encoding UTF8
}

function Load-EnvFile {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return }

  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)\s*=\s*(.*)\s*$') {
      [Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), 'Process')
    }
  }
}

function Sync-NextStatic {
  $source = Join-Path $SiteRoot ".next\static"
  $target = Join-Path $SiteRoot ".next\standalone\.next\static"
  if (-not (Test-Path $source)) {
    Write-ServiceLog "static source missing: $source"
    return
  }

  New-Item -ItemType Directory -Force -Path $target | Out-Null
  robocopy $source $target /MIR /NFL /NDL /NJH /NJS /NC /NS /NP | Out-Null
  if ($LASTEXITCODE -le 7) {
    $global:LASTEXITCODE = 0
    Write-ServiceLog "static assets synced"
  } else {
    Write-ServiceLog "static assets sync failed with code $LASTEXITCODE"
  }
}

$env:PORT = $Port
Load-EnvFile (Join-Path $SiteRoot ".env")
Load-EnvFile (Join-Path $SiteRoot ".env.local")
Sync-NextStatic

Write-ServiceLog "watchdog started on port $Port"

while ($true) {
  try {
    Write-ServiceLog "starting next server"
    & node ".next\standalone\server.js" 2>&1 | ForEach-Object {
      Add-Content -Path $LogFile -Value $_ -Encoding UTF8
    }
    Write-ServiceLog "next server exited; restarting in 5 seconds"
  } catch {
    Write-ServiceLog ("next server failed: " + $_.Exception.Message)
  }

  Start-Sleep -Seconds 5
}
