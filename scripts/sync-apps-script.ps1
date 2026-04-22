$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$source = Join-Path $repoRoot 'SmartSchoolHub_AppsScript_Clean.gs'
$targetDir = Join-Path $repoRoot 'apps-script'
$target = Join-Path $targetDir 'Code.gs'

if (-not (Test-Path $source)) {
  throw "Source Apps Script file not found: $source"
}

if (-not (Test-Path $targetDir)) {
  New-Item -ItemType Directory -Path $targetDir | Out-Null
}

Copy-Item -LiteralPath $source -Destination $target -Force
Write-Host "Synced Apps Script source to $target"
