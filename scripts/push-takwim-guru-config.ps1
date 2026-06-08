param(
  [string]$SiteBaseUrl = "https://xbasmarthub.netlify.app",
  [string]$ConfigPath = "D:\Pull Netlify\xbasmarthub.netlify.app\config\takwim-guru-notif-config.json"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $ConfigPath)) {
  throw "Fail config tidak ditemui: $ConfigPath"
}

$config = Get-Content -LiteralPath $ConfigPath -Raw | ConvertFrom-Json
$dbConfigUrl = $SiteBaseUrl.TrimEnd("/") + "/.netlify/functions/db-config"

Write-Host "Memuat naik konfigurasi takwim guru ke Blob..." -ForegroundColor Cyan
$keys = @($config.PSObject.Properties.Name)
foreach ($key in $keys) {
  $value = $config.$key
  $uploadBody = @{ key = $key; value = $value } | ConvertTo-Json -Depth 10 -Compress
  try {
    $uploadResp = Invoke-RestMethod -Uri $dbConfigUrl -Method Post -ContentType "application/json" -Body $uploadBody
  } catch {
    $message = $_.Exception.Message
    if ($_.Exception.Response) {
      $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
      $errorBody = $reader.ReadToEnd()
      $reader.Close()
      throw "Upload ke Blob gagal untuk key '$key'. Respons backend: $errorBody"
    }
    throw "Upload ke Blob gagal untuk key '$key'. Ralat: $message"
  }
  if (-not $uploadResp.success) {
    throw "Upload ke Blob gagal untuk key: $key"
  }
  Write-Host ("  OK -> " + $key) -ForegroundColor DarkGray
}

Write-Host "Menyelaras Blob ke D1..." -ForegroundColor Cyan
$syncResp = Invoke-RestMethod -Uri ($dbConfigUrl + "?sync=d1") -Method Post
if (-not $syncResp.success) {
  throw "Sync Blob ke D1 gagal."
}

Write-Host "Berjaya. Konfigurasi takwim guru dimuat naik ke Blob dan D1." -ForegroundColor Green
Write-Host ("Keys dikemas kini: " + ($keys -join ", ")) -ForegroundColor DarkGreen
