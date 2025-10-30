# ==========================================
# NAPS2 Service Installer Script
# ==========================================

$serviceName = "mpn-core"
$appPath = "$PSScriptRoot\mpn-core-win.exe"
$nssmPath = "$env:ProgramFiles\nssm\nssm.exe"

# Ensure running as admin
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Restarting script as administrator..."
    Start-Process powershell "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# Install NSSM if not present
if (!(Test-Path $nssmPath)) {
    Write-Host "Installing NSSM..."
    $temp = "$env:TEMP\nssm.zip"
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $temp
    Expand-Archive -Path $temp -DestinationPath "$env:ProgramFiles\nssm" -Force
    Copy-Item "$env:ProgramFiles\nssm\nssm-2.24\win64\nssm.exe" "$env:ProgramFiles\nssm\nssm.exe" -Force
}

# Remove existing service if any
if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
    Write-Host "Removing existing service..."
    & $nssmPath stop $serviceName
    & $nssmPath remove $serviceName confirm
}

# Install the service
Write-Host "Creating $serviceName service..."
& $nssmPath install $serviceName $appPath
& $nssmPath set $serviceName AppDirectory "$PSScriptRoot"
& $nssmPath set $serviceName Start SERVICE_AUTO_START

# Set up logs
$logDir = "$PSScriptRoot\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
& $nssmPath set $serviceName AppStdout "$logDir\out.log"
& $nssmPath set $serviceName AppStderr "$logDir\error.log"

# Start the service
Write-Host "Starting service..."
& $nssmPath start $serviceName

Write-Host "✅ NAPS2 Service installed and running!"
Start-Sleep -Seconds 2
exit
