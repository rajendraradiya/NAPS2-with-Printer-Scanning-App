# ==========================================
# NAPS2 + Service Installer Script (Fully Silent + Force Stop + Uninstall Entry)
# ==========================================

$ErrorActionPreference = "Stop"

$serviceName = "mpn-core"
$appPath = Join-Path $PSScriptRoot "mpn-core-win.exe"
$nssmPath = Join-Path $env:ProgramFiles "nssm\nssm.exe"
$naps2Installer = Join-Path $PSScriptRoot "naps2-8.2.1-win-x64.exe"
$naps2Exe = Join-Path $env:ProgramFiles "NAPS2\NAPS2.Console.exe"
$iconPath = Join-Path $PSScriptRoot "..\..\images\icon.ico"

# Resolve icon path with fallback
try {
    $iconPath = (Resolve-Path $iconPath).Path
} catch {
    Write-Host "⚠️ Icon file not found, falling back to exe."
    $iconPath = $appPath
}

# ==========================================
# Ensure running as administrator
# ==========================================
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Restarting script as administrator..."
    Start-Process -FilePath "powershell.exe" -ArgumentList "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# ==========================================
# Install NAPS2 silently
# ==========================================
if (!(Test-Path $naps2Exe)) {
    if (Test-Path $naps2Installer) {
        Write-Host "Installing NAPS2 silently..."
        $args = "/VERYSILENT","/SUPPRESSMSGBOXES","/NORESTART","/SP-"
        $proc = Start-Process -FilePath $naps2Installer -ArgumentList $args -PassThru -WindowStyle Hidden
        $proc.WaitForExit()
        Start-Sleep -Seconds 2

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
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $tempZip
    Expand-Archive -Path $tempZip -DestinationPath "$env:ProgramFiles\nssm" -Force
    Copy-Item "$env:ProgramFiles\nssm\nssm-2.24\win64\nssm.exe" $nssmPath -Force
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
Write-Host "Creating $serviceName service..."
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
Write-Host "✅ Service running."

# ==========================================
# Register Control Panel uninstall entry
# ==========================================
$uninstallRegPath = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\mpn-core"
if (!(Test-Path $uninstallRegPath)) {
    New-Item -Path $uninstallRegPath -Force | Out-Null
}

$serviceFilesPath = $PSScriptRoot

# Build uninstall script
$uninstallScript = @"
Write-Host 'Stopping mpn-core service...'
& `"$nssmPath`" stop $serviceName -ErrorAction SilentlyContinue

Write-Host 'Removing mpn-core service...'
& `"$nssmPath`" remove $serviceName confirm -ErrorAction SilentlyContinue

Write-Host 'Deleting service files...'
Remove-Item -Recurse -Force `"$serviceFilesPath`" -ErrorAction SilentlyContinue

Write-Host 'Removing uninstall registry entry...'
Remove-Item -Recurse -Force `"$uninstallRegPath`" -ErrorAction SilentlyContinue

Write-Host '✅ MPN Core uninstalled successfully.'
"@

# Encode uninstall script
$encoded = [Convert]::ToBase64String([System.Text.Encoding]::Unicode.GetBytes($uninstallScript))
$uninstallCmd = "powershell.exe -ExecutionPolicy Bypass -EncodedCommand $encoded"

# Write registry uninstall entry
Set-ItemProperty -Path $uninstallRegPath -Name "DisplayName" -Value "MPN Core"
Set-ItemProperty -Path $uninstallRegPath -Name "DisplayVersion" -Value "1.0.0"
Set-ItemProperty -Path $uninstallRegPath -Name "Publisher" -Value "Your Company Name"
Set-ItemProperty -Path $uninstallRegPath -Name "InstallLocation" -Value $PSScriptRoot
Set-ItemProperty -Path $uninstallRegPath -Name "UninstallString" -Value $uninstallCmd
Set-ItemProperty -Path $uninstallRegPath -Name "QuietUninstallString" -Value $uninstallCmd
Set-ItemProperty -Path $uninstallRegPath -Name "DisplayIcon" -Value $iconPath
Set-ItemProperty -Path $uninstallRegPath -Name "NoModify" -Value 1 -Type DWord
Set-ItemProperty -Path $uninstallRegPath -Name "NoRepair" -Value 1 -Type DWord

Write-Host "✅ Uninstall entry created in Control Panel as 'MPN Core'."
exit
