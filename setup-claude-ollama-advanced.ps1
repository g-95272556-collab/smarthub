# setup-claude-ollama-advanced.ps1
# Auto setup Claude Code + Ollama untuk Windows PowerShell
# Fungsi:
# - Detect CPU/RAM/GPU/VRAM
# - Pilih model Ollama paling sesuai
# - Pull model
# - Set environment variables untuk Claude Code terminal
# - Buat report hardware + setup

$ErrorActionPreference = "Continue"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host " ADVANCED SETUP: CLAUDE CODE + OLLAMA" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

# -----------------------------
# 1. Detect hardware
# -----------------------------
Write-Host "`n[1] Detect hardware..." -ForegroundColor Yellow

$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$ramBytes = (Get-CimInstance Win32_ComputerSystem).TotalPhysicalMemory
$ramGB = [math]::Round($ramBytes / 1GB, 1)
$gpus = Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM

$gpuMain = $gpus | Where-Object {
    $_.Name -match "NVIDIA|AMD|Radeon|GeForce|RTX|GTX"
} | Select-Object -First 1

if (-not $gpuMain) {
    $gpuMain = $gpus | Select-Object -First 1
}

$gpuName = $gpuMain.Name
$vramGB = 0

if ($gpuMain.AdapterRAM -and $gpuMain.AdapterRAM -gt 0) {
    $vramGB = [math]::Round($gpuMain.AdapterRAM / 1GB, 1)
}

Write-Host "CPU     : $($cpu.Name)"
Write-Host "Threads : $($cpu.NumberOfLogicalProcessors)"
Write-Host "RAM     : $ramGB GB"
Write-Host "GPU     : $gpuName"
Write-Host "VRAM    : $vramGB GB (anggaran Windows; mungkin tidak tepat untuk sesetengah GPU)"

# -----------------------------
# 2. Pilih model optimum
# -----------------------------
Write-Host "`n[2] Pilih model optimum..." -ForegroundColor Yellow

$modelPrimary = "qwen2.5-coder:7b"
$modelBackup  = "qwen2.5-coder:3b"
$modelGeneral = "qwen3:4b"
$note = ""

if ($ramGB -lt 8) {
    $modelPrimary = "qwen2.5-coder:1.5b"
    $modelBackup  = "qwen2.5-coder:0.5b"
    $modelGeneral = "qwen3:1.7b"
    $note = "RAM bawah 8GB: guna model kecil sahaja."
}
elseif ($ramGB -lt 16) {
    $modelPrimary = "qwen2.5-coder:3b"
    $modelBackup  = "qwen2.5-coder:1.5b"
    $modelGeneral = "qwen3:4b"
    $note = "RAM 8-16GB: model 3B paling stabil."
}
elseif ($ramGB -lt 32) {
    $modelPrimary = "qwen2.5-coder:7b"
    $modelBackup  = "qwen2.5-coder:3b"
    $modelGeneral = "qwen3:4b"
    $note = "RAM 16-32GB: 7B boleh jalan, 3B sebagai backup."
}
else {
    if ($vramGB -ge 8) {
        $modelPrimary = "qwen2.5-coder:14b"
        $modelBackup  = "qwen2.5-coder:7b"
        $modelGeneral = "qwen3:8b"
        $note = "RAM 32GB+ dan VRAM 8GB+: 14B boleh dicuba."
    }
    else {
        $modelPrimary = "qwen2.5-coder:7b"
        $modelBackup  = "qwen2.5-coder:3b"
        $modelGeneral = "qwen3:4b"
        $note = "RAM 32GB tetapi VRAM kecil: 7B paling optimum; elak 14B sebagai model utama."
    }
}

Write-Host "Primary coding model : $modelPrimary" -ForegroundColor Green
Write-Host "Backup coding model  : $modelBackup" -ForegroundColor Green
Write-Host "General chat model   : $modelGeneral" -ForegroundColor Green
Write-Host "Nota                 : $note"

# -----------------------------
# 3. Semak Ollama
# -----------------------------
Write-Host "`n[3] Semak Ollama..." -ForegroundColor Yellow

if (!(Get-Command ollama -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Ollama tidak dijumpai dalam PATH." -ForegroundColor Red
    Write-Host "Install Ollama dahulu, kemudian run semula script ini." -ForegroundColor Red
    exit 1
}

Write-Host "Ollama dijumpai." -ForegroundColor Green

# -----------------------------
# 4. Semak Git Bash
# -----------------------------
Write-Host "`n[4] Semak Git Bash..." -ForegroundColor Yellow

$possibleGitBashPaths = @(
    "C:\Program Files\Git\bin\bash.exe",
    "C:\Program Files\Git\git-bash.exe",
    "C:\Program Files (x86)\Git\bin\bash.exe",
    "C:\Program Files (x86)\Git\git-bash.exe"
)

$gitBash = $possibleGitBashPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $gitBash) {
    Write-Host "WARNING: Git Bash tidak dijumpai." -ForegroundColor Red
    Write-Host "Install Git for Windows jika Claude Code minta CLAUDE_CODE_GIT_BASH_PATH." -ForegroundColor Yellow
    $gitBash = "C:\Program Files\Git\bin\bash.exe"
}
else {
    Write-Host "Git Bash dijumpai: $gitBash" -ForegroundColor Green
}

# -----------------------------
# 5. Semak Ollama server
# -----------------------------
Write-Host "`n[5] Semak Ollama server..." -ForegroundColor Yellow

$ollamaRunning = $false

try {
    Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -TimeoutSec 3 | Out-Null
    $ollamaRunning = $true
}
catch {
    $ollamaRunning = $false
}

if ($ollamaRunning) {
    Write-Host "Ollama server sedang running di http://localhost:11434" -ForegroundColor Green
}
else {
    Write-Host "Ollama server belum dikesan." -ForegroundColor Yellow
    Write-Host "Cuba start Ollama dalam background..." -ForegroundColor Yellow

    try {
        Start-Process -FilePath "ollama" -ArgumentList "serve" -WindowStyle Minimized
        Start-Sleep -Seconds 5

        try {
            Invoke-WebRequest -Uri "http://localhost:11434" -UseBasicParsing -TimeoutSec 3 | Out-Null
            $ollamaRunning = $true
            Write-Host "Ollama server berjaya dimulakan." -ForegroundColor Green
        }
        catch {
            Write-Host "WARNING: Ollama server masih belum respond. Anda boleh run manual: ollama serve" -ForegroundColor Yellow
        }
    }
    catch {
        Write-Host "WARNING: Gagal start Ollama secara automatik. Run manual: ollama serve" -ForegroundColor Yellow
    }
}

# -----------------------------
# 6. Pull model
# -----------------------------
Write-Host "`n[6] Pull model Ollama..." -ForegroundColor Yellow

Write-Host "Pull primary model: $modelPrimary"
ollama pull $modelPrimary

Write-Host "`nPull backup model: $modelBackup"
ollama pull $modelBackup

Write-Host "`nPull general model: $modelGeneral"
ollama pull $modelGeneral

# -----------------------------
# 7. Set environment variables
# -----------------------------
Write-Host "`n[7] Set environment variables..." -ForegroundColor Yellow

setx ANTHROPIC_AUTH_TOKEN "ollama" | Out-Null
setx ANTHROPIC_BASE_URL "http://localhost:11434" | Out-Null
setx ANTHROPIC_API_KEY "" | Out-Null
setx CLAUDE_CODE_GIT_BASH_PATH "$gitBash" | Out-Null
setx CLAUDE_CODE_SELECTED_MODEL "$modelPrimary" | Out-Null

$env:ANTHROPIC_AUTH_TOKEN = "ollama"
$env:ANTHROPIC_BASE_URL = "http://localhost:11434"
$env:ANTHROPIC_API_KEY = ""
$env:CLAUDE_CODE_GIT_BASH_PATH = $gitBash
$env:CLAUDE_CODE_SELECTED_MODEL = $modelPrimary

Write-Host "Environment variables telah diset." -ForegroundColor Green

# -----------------------------
# 8. Semak Claude CLI
# -----------------------------
Write-Host "`n[8] Semak Claude CLI..." -ForegroundColor Yellow

if (!(Get-Command claude -ErrorAction SilentlyContinue)) {
    Write-Host "WARNING: Claude CLI tidak dijumpai dalam PATH." -ForegroundColor Red
    Write-Host "Jika belum install Claude Code, install dahulu." -ForegroundColor Yellow
}
else {
    Write-Host "Claude CLI dijumpai." -ForegroundColor Green
}

# -----------------------------
# 9. Buat report
# -----------------------------
Write-Host "`n[9] Jana report..." -ForegroundColor Yellow

$report = @"
CLAUDE CODE + OLLAMA SETUP REPORT
Generated: $(Get-Date)

HARDWARE
CPU     : $($cpu.Name)
Threads : $($cpu.NumberOfLogicalProcessors)
RAM     : $ramGB GB
GPU     : $gpuName
VRAM    : $vramGB GB (anggaran Windows)

RECOMMENDED MODELS
Primary coding model : $modelPrimary
Backup coding model  : $modelBackup
General chat model   : $modelGeneral

NOTE
$note

ENVIRONMENT VARIABLES
ANTHROPIC_AUTH_TOKEN=ollama
ANTHROPIC_BASE_URL=http://localhost:11434
ANTHROPIC_API_KEY=
CLAUDE_CODE_GIT_BASH_PATH=$gitBash
CLAUDE_CODE_SELECTED_MODEL=$modelPrimary

COMMANDS
ollama list
ollama run $modelPrimary
claude --model $modelPrimary

If Claude CLI does not accept --model, run:
claude

Then select model manually if prompted.
"@

$reportPath = Join-Path $PSScriptRoot "claude-ollama-hardware-report.txt"
$report | Out-File -FilePath $reportPath -Encoding UTF8

Write-Host "Report disimpan: $reportPath" -ForegroundColor Green

# -----------------------------
# 10. Final
# -----------------------------
Write-Host "`n====================================================" -ForegroundColor Cyan
Write-Host " SETUP SELESAI" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

Write-Host "`nModel utama untuk PC ini:" -ForegroundColor Green
Write-Host "  $modelPrimary" -ForegroundColor Green

Write-Host "`nArahan test:" -ForegroundColor Yellow
Write-Host "  ollama list"
Write-Host "  ollama run $modelPrimary"
Write-Host "  claude --model $modelPrimary"

Write-Host "`nNota: Tutup PowerShell dan buka semula supaya environment permanent aktif." -ForegroundColor Yellow
