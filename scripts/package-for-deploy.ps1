# Creates ERB-deploy.zip (excludes node_modules, .next, git)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$out = Join-Path $root "ERB-deploy.zip"

if (Test-Path $out) { Remove-Item $out -Force }

$staging = Join-Path $env:TEMP "erb-deploy-staging"
if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Path $staging | Out-Null
New-Item -ItemType Directory -Path (Join-Path $staging "scripts") | Out-Null

robocopy (Join-Path $root "erb") (Join-Path $staging "erb") /E /XD node_modules dist .git /XF *.log /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
robocopy (Join-Path $root "newerp") (Join-Path $staging "newerp") /E /XD node_modules .next .git /XF *.log /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
Copy-Item (Join-Path $root "scripts\deploy-ec2-windows.ps1") (Join-Path $staging "deploy-ec2-windows.ps1")
Copy-Item (Join-Path $root "scripts\deploy-ec2-linux.sh") (Join-Path $staging "scripts\deploy-ec2-linux.sh")
Copy-Item (Join-Path $root "scripts\nginx-erb.conf") (Join-Path $staging "scripts\nginx-erb.conf")
Copy-Item (Join-Path $root "scripts\ecosystem.config.cjs") (Join-Path $staging "scripts\ecosystem.config.cjs")
Copy-Item (Join-Path $root "scripts\DEPLOY.md") (Join-Path $staging "scripts\DEPLOY.md")

Compress-Archive -Path "$staging\*" -DestinationPath $out -Force
Remove-Item $staging -Recurse -Force

Write-Host "Created: $out"
Write-Host "Size: $([math]::Round((Get-Item $out).Length / 1MB, 2)) MB"
