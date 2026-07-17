# ERB — Windows EC2 deploy: Node + PM2 (no Nginx — use ports 3000/5000 or install IIS/nginx separately)
# Usage: powershell -ExecutionPolicy Bypass -File C:\ERB\deploy-ec2-windows.ps1
$ErrorActionPreference = "Stop"
$AppRoot = "C:\ERB"

Write-Host "=== ERB Deploy (Windows + PM2) ===" -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Installing Node.js LTS..."
  $nodeMsi = "$env:TEMP\node-lts.msi"
  Invoke-WebRequest -Uri "https://nodejs.org/dist/v22.16.0/node-v22.16.0-x64.msi" -OutFile $nodeMsi
  Start-Process msiexec.exe -Wait -ArgumentList "/i `"$nodeMsi`" /qn"
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}
Write-Host "Node: $(node -v) | npm: $(npm -v)"

foreach ($p in @(5000, 3000)) {
  $name = "ERB-Port-$p"
  if (-not (Get-NetFirewallRule -DisplayName $name -ErrorAction SilentlyContinue)) {
    New-NetFirewallRule -DisplayName $name -Direction Inbound -Action Allow -Protocol TCP -LocalPort $p | Out-Null
  }
}

npm install -g pm2
Write-Host "PM2: $(pm2 -v)"

Set-Location $AppRoot

# Backend
Write-Host ">>> Backend (PM2: erb-api)"
Set-Location "$AppRoot\erb"
if (-not (Test-Path ".env")) {
  Copy-Item ".env.example" ".env"
  Write-Host "WARNING: Edit C:\ERB\erb\.env" -ForegroundColor Yellow
}
npm ci 2>$null; if ($LASTEXITCODE -ne 0) { npm install }
npm run build

# Frontend
Write-Host ">>> Frontend (PM2: erb-web)"
Set-Location "$AppRoot\newerp"
@"
NEXT_PUBLIC_API_URL=/api/v1
NEXT_PUBLIC_APP_NAME=ERB Payroll System
NEXT_PUBLIC_DEFAULT_LOCALE=ar
"@ | Set-Content ".env.local" -Encoding UTF8
npm ci 2>$null; if ($LASTEXITCODE -ne 0) { npm install }
npm run build

# PM2 — both apps + persist across reboot
Write-Host ">>> PM2 start"
Set-Location $AppRoot
pm2 delete erb-api 2>$null
pm2 delete erb-web 2>$null
pm2 start "$AppRoot\scripts\ecosystem.config.cjs"
pm2 save
pm2 startup
pm2 save

$ip = try {
  Invoke-RestMethod -Uri "http://169.254.169.254/latest/meta-data/public-ipv4" -TimeoutSec 3
} catch {
  (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.*" } | Select-Object -First 1).IPAddress
}

Write-Host ""
Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host "PM2:  pm2 status"
Write-Host "App:  http://${ip}:3000/ar/login"
Write-Host "API:  http://${ip}:5000/health"
pm2 status
