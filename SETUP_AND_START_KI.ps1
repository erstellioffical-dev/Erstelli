$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

function Pause-End([string]$msg) {
  Write-Host ""
  Write-Host $msg -ForegroundColor Yellow
  Read-Host "Enter drücken zum Schließen"
  exit 1
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Pause-End "Node.js wurde nicht gefunden. Bitte Node.js installieren und danach START_KI.bat erneut starten."
}

$envPath = Join-Path $PSScriptRoot ".env"
$needKey = $true
if (Test-Path $envPath) {
  $existing = Get-Content $envPath -Raw
  if ($existing -match '(?m)^OPENAI_API_KEY=(.+)$') {
    $v = $Matches[1].Trim()
    if ($v -and $v -notmatch 'HIER|YOUR|DEIN|sk-\.\.\.') { $needKey = $false }
  }
}

if ($needKey) {
  Write-Host "" 
  Write-Host "Erstelli KI-Setup" -ForegroundColor Cyan
  Write-Host "Der API-Key wird nur lokal in diesem Ordner gespeichert." -ForegroundColor Gray
  $secure = Read-Host "OpenAI API-Key eingeben" -AsSecureString
  $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
  try { $key = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
  finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
  if ([string]::IsNullOrWhiteSpace($key)) { Pause-End "Kein API-Key eingegeben." }

  @(
    "OPENAI_API_KEY=$key",
    "ERSTELLI_MODEL=gpt-5.6-luna",
    "PLAN_MODEL=gpt-5.6-terra",
    "PORT=8787",
    "RESEND_API_KEY=",
    "FROM_EMAIL="
  ) | Set-Content -Path $envPath -Encoding UTF8
  Write-Host "API-Key lokal gespeichert." -ForegroundColor Green
}

Write-Host "Erstelli wird gestartet ..." -ForegroundColor Cyan
Write-Host "ENV-Datei gefunden: $([bool](Test-Path $envPath))" -ForegroundColor Gray
Write-Host "API-Key Eintrag erkannt: $(-not $needKey)" -ForegroundColor Gray
$server = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $PSScriptRoot -PassThru
Start-Sleep -Seconds 2
Start-Process "http://localhost:8787"
Write-Host ""
Write-Host "KI-Server läuft unter http://localhost:8787" -ForegroundColor Green
Write-Host "Dieses Fenster offen lassen. Zum Beenden Strg+C oder Fenster schließen." -ForegroundColor Gray
try { Wait-Process -Id $server.Id }
catch {}
