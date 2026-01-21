# =====================================================
# MPN Software – Full Installer Script
# =====================================================

$ErrorActionPreference = "Stop"

# -----------------------------
# Core Configuration
# -----------------------------
$serviceName = "mpn-software"

$scriptRoot = Split-Path -Parent $PSCommandPath
$installDir = Join-Path $env:ProgramFiles "MPN Software"

$appExe     = Join-Path $installDir "mpn-core-win.exe"

$nssmBase   = Join-Path $env:ProgramFiles "nssm"
$nssmPath   = Join-Path $nssmBase "nssm.exe"

$naps2Installer = Join-Path $scriptRoot "naps2-8.2.1-win-x64.exe"
$naps2Exe       = Join-Path $env:ProgramFiles "NAPS2\NAPS2.Console.exe"

$logDir   = Join-Path $installDir "logs"
$outLog   = Join-Path $logDir "out.log"
$errorLog = Join-Path $logDir "error.log"

$iconSource = Join-Path $scriptRoot "icon.ico"
$iconDest   = Join-Path $installDir "icon.ico"

$uninstallRegPath = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\$serviceName"
$uninstallPs1     = Join-Path $installDir "uninstall.ps1"

# -----------------------------
# Validate Icon
# -----------------------------
if (-not (Test-Path $iconSource)) {
    Write-Error "icon.ico not found at $iconSource"
    exit 1
}

# -----------------------------
# Elevation Check
# -----------------------------
$principal = New-Object Security.Principal.WindowsPrincipal(
    [Security.Principal.WindowsIdentity]::GetCurrent()
)

if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell.exe -Verb RunAs `
        -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""

    Start-Sleep -Seconds 30
    
    exit
}

# -----------------------------
# Confirmation Dialog
# -----------------------------
Add-Type -AssemblyName PresentationFramework

$confirm = [System.Windows.MessageBox]::Show(
    "To scan documents to this device, we need to install 3rd party software. In the future, the NAPS2 software will load automatically to help facilitate scanning. Select 'Yes' to continue or 'No' if you don't need the ability to scan documents on this device.",
    "MPN Software",
    [System.Windows.MessageBoxButton]::YesNo,
    [System.Windows.MessageBoxImage]::Information
)

if ($confirm -ne "Yes") {
    exit
}

# -----------------------------
# Prepare Install Directories
# -----------------------------
New-Item -ItemType Directory -Path $installDir -Force | Out-Null
New-Item -ItemType Directory -Path $logDir -Force | Out-Null

Copy-Item $iconSource $iconDest -Force
Copy-Item (Join-Path $scriptRoot "mpn-core-win.exe") $appExe -Force

# -----------------------------
# Install NAPS2 (if missing)
# -----------------------------
if (-not (Test-Path $naps2Exe)) {
    if (-not (Test-Path $naps2Installer)) {
        Write-Error "NAPS2 installer not found."
        exit 1
    }

    Start-Process $naps2Installer `
        -ArgumentList "/VERYSILENT /SUPPRESSMSGBOXES /NORESTART /SP-" `
        -Wait

    Get-Process NAPS2* -ErrorAction SilentlyContinue | Stop-Process -Force
}

# -----------------------------
# Install NSSM (if missing)
# -----------------------------
if (-not (Test-Path $nssmPath)) {

    $zip = Join-Path $env:TEMP "nssm.zip"
    Invoke-WebRequest "https://nssm.cc/release/nssm-2.24.zip" -OutFile $zip
    Expand-Archive $zip $env:TEMP -Force

    New-Item -ItemType Directory -Path $nssmBase -Force | Out-Null
    Copy-Item "$env:TEMP\nssm-2.24\win64\nssm.exe" $nssmPath -Force

    Remove-Item $zip -Force
}

# =====================================================
# SERVICE INSTALL + START (RETRY ONCE)
# =====================================================

function Install-And-StartService {

    if (Get-Service $serviceName -ErrorAction SilentlyContinue) {
        & $nssmPath stop $serviceName | Out-Null
        & $nssmPath remove $serviceName confirm | Out-Null
        Start-Sleep 2
    }

    & $nssmPath install $serviceName $appExe
    & $nssmPath set $serviceName AppDirectory $installDir
    & $nssmPath set $serviceName Start SERVICE_AUTO_START
    & $nssmPath set $serviceName AppExit Default Restart
    & $nssmPath set $serviceName AppStdout $outLog
    & $nssmPath set $serviceName AppStderr $errorLog

    & $nssmPath start $serviceName
}

# -----------------------------
# First Attempt
# -----------------------------
Install-And-StartService
Start-Sleep 10

$svc = Get-Service $serviceName -ErrorAction SilentlyContinue

if (-not $svc -or $svc.Status -ne "Running") {

    # -----------------------------
    # Second Attempt
    # -----------------------------
    Install-And-StartService
    Start-Sleep 10

    $svc = Get-Service $serviceName -ErrorAction SilentlyContinue

    if (-not $svc -or $svc.Status -ne "Running") {
        Write-Error "Service failed to start after second attempt."
        exit 1
    }
}

# -----------------------------
# Create Uninstall Script
# -----------------------------
@"
& `"$nssmPath`" stop $serviceName -ErrorAction SilentlyContinue
& `"$nssmPath`" remove $serviceName confirm -ErrorAction SilentlyContinue
Remove-Item `"$installDir`" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item `"$uninstallRegPath`" -Recurse -Force -ErrorAction SilentlyContinue
"@ | Set-Content $uninstallPs1 -Encoding UTF8

# -----------------------------
# Register Control Panel Uninstall
# -----------------------------
New-Item $uninstallRegPath -Force | Out-Null

Set-ItemProperty $uninstallRegPath DisplayName "MPN Software"
Set-ItemProperty $uninstallRegPath DisplayVersion "1.0.0"
Set-ItemProperty $uninstallRegPath Publisher "MPN Software System, Inc."
Set-ItemProperty $uninstallRegPath InstallLocation $installDir
Set-ItemProperty $uninstallRegPath DisplayIcon $iconDest
Set-ItemProperty $uninstallRegPath UninstallString "powershell.exe -ExecutionPolicy Bypass -File `"$uninstallPs1`""
Set-ItemProperty $uninstallRegPath QuietUninstallString "powershell.exe -ExecutionPolicy Bypass -File `"$uninstallPs1`""
Set-ItemProperty $uninstallRegPath NoModify 1 -Type DWord
Set-ItemProperty $uninstallRegPath NoRepair 1 -Type DWord

# -----------------------------
# Final Output
# -----------------------------
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "MPN Software installed successfully" -ForegroundColor Green
Write-Host "Service running: $serviceName" -ForegroundColor Green
Write-Host "Logs: $logDir" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
