# ==========================================
# MPN-Core Full Installer Script
# ==========================================
$serviceName = "mpn-core"
$appPath = Join-Path $PSScriptRoot "mpn-core-win.exe"
$nssmBase = Join-Path $env:ProgramFiles "nssm"
$nssmPath = Join-Path $nssmBase "nssm.exe"
$naps2Installer = Join-Path $PSScriptRoot "naps2-8.2.1-win-x64.exe"
$naps2Exe = Join-Path $env:ProgramFiles "NAPS2\NAPS2.Console.exe"
$iconPath = Join-Path $PSScriptRoot "icon.ico"

# ==========================================
# NEW: Permanent install directory (ONLY ADDITION)
# ==========================================
$installDir = Join-Path $env:ProgramFiles "MPN Software"
$iconDest   = Join-Path $installDir "icon.ico"
$uninstallPs1 = Join-Path $installDir "uninstall.ps1"

# ==========================================
# Ensure install directory exists (ONLY ADDITION)
# ==========================================
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# ==========================================
# Copy icon to permanent location (ONLY ADDITION)
# ==========================================
if (Test-Path $iconPath) {
    Copy-Item $iconPath $iconDest -Force
}

# ==========================================
# Resolve icon path (UPDATED – minimal)
# ==========================================
if (Test-Path $iconDest) {
    $iconPath = $iconDest
} else {
    $iconPath = $appPath
}

# ==========================================
# Install NAPS2 silently
# ==========================================
if (!(Test-Path $naps2Exe)) {
    if (Test-Path $naps2Installer) {
        Write-Host "Installing NAPS2..."
        $args = "/VERYSILENT","/SUPPRESSMSGBOXES","/NORESTART","/SP-"
        $proc = Start-Process -FilePath $naps2Installer -ArgumentList $args -PassThru -WindowStyle Hidden
        $proc.WaitForExit()
        Start-Sleep -Seconds 3

        # Kill any NAPS2 processes
        Get-Process | Where-Object { $_.ProcessName -like "NAPS2*" } | Stop-Process -Force -ErrorAction SilentlyContinue

        if (Test-Path $naps2Exe) {
            Write-Host "✅ NAPS2 installed successfully."
        } else {
            Write-Host "❌ NAPS2 installation failed."
        }
    } else {
        Write-Host "❌ NAPS2 installer not found at $naps2Installer"
        exit 1
    }
} else {
    Write-Host "NAPS2 already installed."
}

# ==========================================
# Install NSSM if missing
# ==========================================
if (!(Test-Path $nssmPath)) {
    Write-Host "Installing NSSM..."
    $tempZip = Join-Path $env:TEMP "nssm.zip"
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $tempZip -UseBasicParsing
    Expand-Archive -Path $tempZip -DestinationPath $nssmBase -Force
    Copy-Item "$nssmBase\nssm-2.24\win64\nssm.exe" $nssmPath -Force
    Remove-Item $tempZip -Force -ErrorAction SilentlyContinue
    Write-Host "✅ NSSM installed successfully."
    # Write-Host "✅ NSSM installed at $nssmPath"
} else {
    Write-Host "NSSM already installed."
}

# ==========================================
# Remove existing service if any
# ==========================================
if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
    Write-Host "Removing existing service..."
    & $nssmPath stop $serviceName -ErrorAction SilentlyContinue
    & $nssmPath remove $serviceName confirm
}

# ==========================================
# Install and configure service
# ==========================================
# Write-Host "Creating Windows service '$serviceName'..."
& $nssmPath install $serviceName $appPath
& $nssmPath set $serviceName AppDirectory $PSScriptRoot
& $nssmPath set $serviceName Start SERVICE_AUTO_START

# Create logs folder
$logDir = Join-Path $PSScriptRoot "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
& $nssmPath set $serviceName AppStdout (Join-Path $logDir "out.log")
& $nssmPath set $serviceName AppStderr (Join-Path $logDir "error.log")

# Start the service
# Write-Host "Starting service..."
& $nssmPath start $serviceName
Start-Sleep -Seconds 2
# Write-Host "✅ Service '$serviceName' is running."

# ==========================================
# Create Control Panel Uninstall Entry
# ==========================================
$uninstallRegPath = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$serviceName"
if (!(Test-Path $uninstallRegPath)) {
    New-Item -Path $uninstallRegPath -Force | Out-Null
}

# ==========================================
# NEW: Create uninstall.ps1 (ONLY ADDITION)
# ==========================================
$uninstallScript = @"
Write-Host 'Stopping service...'
& `"$nssmPath`" stop $serviceName -ErrorAction SilentlyContinue
& `"$nssmPath`" remove $serviceName confirm -ErrorAction SilentlyContinue

Write-Host 'Removing install directory...'
Remove-Item -Path `"$installDir`" -Recurse -Force -ErrorAction SilentlyContinue

Write-Host 'Removing uninstall registry entry...'
Remove-Item -Path `"$uninstallRegPath`" -Recurse -Force -ErrorAction SilentlyContinue
"@

Set-Content -Path $uninstallPs1 -Value $uninstallScript -Encoding UTF8

# ==========================================
# UPDATED uninstall command (ONLY CHANGE)
# ==========================================
$uninstallCmd = "powershell.exe -ExecutionPolicy Bypass -File `"$uninstallPs1`""

Set-ItemProperty $uninstallRegPath DisplayName "MPN Software"
Set-ItemProperty $uninstallRegPath DisplayVersion "1.0.0"
Set-ItemProperty $uninstallRegPath Publisher "MPN Software System,Inc."
Set-ItemProperty $uninstallRegPath InstallLocation $installDir
Set-ItemProperty $uninstallRegPath UninstallString $uninstallCmd
Set-ItemProperty $uninstallRegPath QuietUninstallString $uninstallCmd
Set-ItemProperty $uninstallRegPath DisplayIcon $iconPath
Set-ItemProperty $uninstallRegPath NoModify 1 -Type DWord
Set-ItemProperty $uninstallRegPath NoRepair 1 -Type DWord

# ==========================================
# Final Message
# ==========================================
$wshell = New-Object -ComObject WScript.Shell
$wshell.Popup("MPN Software installed successfully.`nService is running and ready to use.", 5, "Installation Complete", 64)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "Service: $serviceName" -ForegroundColor Green
Write-Host "Logs: $logDir" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
exit
