# Setup Claude Code global config
$claudeDir = "$env:USERPROFILE\.claude"
$settingsFile = "$claudeDir\settings.json"

if (-not (Test-Path $claudeDir)) {
    New-Item -ItemType Directory -Path $claudeDir | Out-Null
}

$config = @{
    attribution = @{
        commit = ""
        pr = ""
    }
    includeCoAuthoredBy = $false
    theme = "dark"
    autoUpdatesChannel = "latest"
}

if (Test-Path $settingsFile) {
    $existing = Get-Content $settingsFile | ConvertFrom-Json
    $existing | Add-Member -Force -NotePropertyName "attribution" -NotePropertyValue $config.attribution
    $existing | Add-Member -Force -NotePropertyName "includeCoAuthoredBy" -NotePropertyValue $false
    $existing | ConvertTo-Json -Depth 10 | Set-Content $settingsFile -Encoding utf8
} else {
    $config | ConvertTo-Json -Depth 10 | Set-Content $settingsFile -Encoding utf8
}

Write-Host "Claude config updated: tiada attribution dalam commit/PR" -ForegroundColor Green
