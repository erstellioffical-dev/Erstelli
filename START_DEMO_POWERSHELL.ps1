Set-Location $PSScriptRoot
if (!(Test-Path '.env')) { Copy-Item '.env.example' '.env'; Start-Process notepad.exe '.env'; Write-Host 'API-Key in .env eintragen und danach erneut starten.'; Read-Host; exit }
Start-Process 'http://localhost:8787'
node --env-file=.env server.js
