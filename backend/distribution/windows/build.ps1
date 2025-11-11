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
# Elevate once — ensure running as Administrator
# ==========================================
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    try {
        Write-Host "Requesting administrator privileges..." -ForegroundColor Yellow

        $psi = New-Object System.Diagnostics.ProcessStartInfo
        $psi.FileName = "powershell.exe"
        $psi.Arguments = "-ExecutionPolicy Bypass -NoExit -File `"$PSCommandPath`""
        $psi.Verb = "runas"
        $psi.UseShellExecute = $true
        $psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Normal

        [System.Diagnostics.Process]::Start($psi) | Out-Null
        exit
    }
    catch {
        $wshell = New-Object -ComObject WScript.Shell
        $wshell.Popup("❌ Administrator privileges are required to continue.`nInstallation cancelled.", 5, "Installation Aborted", 48)
        exit 1
    }
}

# ==========================================
# Resolve icon path (fallback to app)
# ==========================================
try {
    $iconPath = (Resolve-Path $iconPath).Path
} catch {
    Write-Host "⚠️ Icon file not found, falling back to executable."
    $iconPath = $appPath
}

# ==========================================
# Install NAPS2 silently
# ==========================================
if (!(Test-Path $naps2Exe)) {
    if (Test-Path $naps2Installer) {
        Write-Host "Installing NAPS2 8.2.1 silently..."
        $args = "/VERYSILENT","/SUPPRESSMSGBOXES","/NORESTART","/SP-"
        $proc = Start-Process -FilePath $naps2Installer -ArgumentList $args -PassThru -Wait
        Start-Sleep -Seconds 2
        Get-Process | Where-Object { $_.ProcessName -like "NAPS2*" } | Stop-Process -Force -ErrorAction SilentlyContinue

        if (Test-Path $naps2Exe) {
            Write-Host "✅ NAPS2 installed successfully at $($naps2Exe)"
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
    Write-Host "✅ NSSM installed at $nssmPath"
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
Write-Host "Creating Windows service '$serviceName'..."
& $nssmPath install $serviceName $appPath
& $nssmPath set $serviceName AppDirectory $PSScriptRoot
& $nssmPath set $serviceName Start SERVICE_AUTO_START

# Create logs folder
$logDir = Join-Path $PSScriptRoot "logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
& $nssmPath set $serviceName AppStdout (Join-Path $logDir "out.log")
& $nssmPath set $serviceName AppStderr (Join-Path $logDir "error.log")

# Start the service
Write-Host "Starting service..."
& $nssmPath start $serviceName
Start-Sleep -Seconds 2
Write-Host "✅ Service '$serviceName' is running."

# ==========================================
# Create Control Panel Uninstall Entry
# ==========================================
$uninstallRegPath = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$serviceName"
if (!(Test-Path $uninstallRegPath)) {
    New-Item -Path $uninstallRegPath -Force | Out-Null
}

$uninstallScript = @"
Write-Host 'Stopping $serviceName service...'
& `"$nssmPath`" stop $serviceName -ErrorAction SilentlyContinue
Write-Host 'Removing $serviceName service...'
& `"$nssmPath`" remove $serviceName confirm -ErrorAction SilentlyContinue
Write-Host 'Deleting service files...'
Remove-Item -Recurse -Force `"$PSScriptRoot`" -ErrorAction SilentlyContinue
Write-Host 'Removing uninstall registry entry...'
Remove-Item -Recurse -Force `"$uninstallRegPath`" -ErrorAction SilentlyContinue
Write-Host '✅ Uninstallation completed.'
"@

$encoded = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($uninstallScript))
$uninstallCmd = "powershell.exe -ExecutionPolicy Bypass -NoExit -EncodedCommand $encoded"

Set-ItemProperty -Path $uninstallRegPath -Name "DisplayName" -Value "MPN Core"
Set-ItemProperty -Path $uninstallRegPath -Name "DisplayVersion" -Value "1.0.0"
Set-ItemProperty -Path $uninstallRegPath -Name "Publisher" -Value "Your Company"
Set-ItemProperty -Path $uninstallRegPath -Name "InstallLocation" -Value $PSScriptRoot
Set-ItemProperty -Path $uninstallRegPath -Name "UninstallString" -Value $uninstallCmd
Set-ItemProperty -Path $uninstallRegPath -Name "QuietUninstallString" -Value $uninstallCmd
Set-ItemProperty -Path $uninstallRegPath -Name "DisplayIcon" -Value $iconPath
Set-ItemProperty -Path $uninstallRegPath -Name "NoModify" -Value 1 -Type DWord
Set-ItemProperty -Path $uninstallRegPath -Name "NoRepair" -Value 1 -Type DWord
Write-Host "✅ Added uninstall entry in Control Panel."

# ==========================================
# Final Message
# ==========================================
$wshell = New-Object -ComObject WScript.Shell
$wshell.Popup("MPN Core installed successfully.`nService is running and ready to use.", 5, "Installation Complete", 64)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "Service: $serviceName" -ForegroundColor Green
Write-Host "Logs: $logDir" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
exit
