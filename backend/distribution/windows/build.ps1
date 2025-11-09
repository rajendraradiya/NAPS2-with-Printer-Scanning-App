# ==========================================
# NAPS2 + Service Installer Script (Fully Silent + Force Stop + Uninstall Entry)
# ==========================================

$serviceName = "mpn-core"
$appPath = "$PSScriptRoot\mpn-core-win.exe"
$nssmPath = "$env:ProgramFiles\nssm\nssm.exe"
$naps2Installer = "$PSScriptRoot\naps2-8.2.1-win-x64.exe"
$naps2Exe = "$env:ProgramFiles\NAPS2\NAPS2.Console.exe"
$iconPath = Join-Path $PSScriptRoot "..\..\images\icon.ico"
try {
    $iconPath = (Resolve-Path $iconPath).Path
} catch {
    Write-Host "⚠️ Icon file not found at expected location: $iconPath"
    $iconPath = "$PSScriptRoot\mpn-core-win.exe"  # fallback
}

# Ensure running as admin
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Restarting script as administrator..."
    Start-Process powershell "-ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

# ==========================================
# Install NAPS2 silently (no popup, force stop if it runs)
# ==========================================
if (!(Test-Path $naps2Exe)) {
    if (Test-Path $naps2Installer) {
        Write-Host "Installing NAPS2 8.2.1 silently (no UI)..."

        try {
            # Inno Setup silent parameters
            $args = "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART", "/SP-"

            # Start installer and wait until process finishes properly
            $proc = Start-Process -FilePath $naps2Installer -ArgumentList $args -PassThru -WindowStyle Hidden
            Write-Host "Installing... please wait..."
            $proc.WaitForExit()
            Start-Sleep -Seconds 3

            # After install, ensure NAPS2 did not auto-run
            Write-Host "Checking for NAPS2 processes after installation..."
            Stop-Process -Name "NAPS2" -Force -ErrorAction SilentlyContinue

            # Double-check any stray NAPS2* processes
            $runningNaps2 = Get-Process | Where-Object { $_.ProcessName -like "NAPS2*" } -ErrorAction SilentlyContinue
            if ($runningNaps2) {
                Write-Host "⚠️ Additional NAPS2 processes detected. Stopping..."
                $runningNaps2 | Stop-Process -Force
            }

            if (Test-Path $naps2Exe) {
                Write-Host "✅ NAPS2 installed silently and all processes terminated."
            } else {
                Write-Host "❌ NAPS2 installation failed or CLI not found."
            }
        }
        catch {
            Write-Host "❌ NAPS2 silent install encountered an error. Forcing process stop..."
            Stop-Process -Name "NAPS2" -Force -ErrorAction SilentlyContinue
        }
    } else {
        Write-Host "❌ NAPS2 installer not found at $naps2Installer"
        exit 1
    }
} else {
    Write-Host "NAPS2 already installed."
}

# ==========================================
# Install NSSM (if not present)
# ==========================================
if (!(Test-Path $nssmPath)) {
    Write-Host "Installing NSSM..."
    $temp = "$env:TEMP\nssm.zip"
    Invoke-WebRequest -Uri "https://nssm.cc/release/nssm-2.24.zip" -OutFile $temp
    Expand-Archive -Path $temp -DestinationPath "$env:ProgramFiles\nssm" -Force
    Copy-Item "$env:ProgramFiles\nssm\nssm-2.24\win64\nssm.exe" "$env:ProgramFiles\nssm\nssm.exe" -Force
}

# ==========================================
# Remove existing service if any
# ==========================================
if (Get-Service -Name $serviceName -ErrorAction SilentlyContinue) {
    Write-Host "Removing existing service..."
    & $nssmPath stop $serviceName
    & $nssmPath remove $serviceName confirm
}

# ==========================================
# Install and configure the service
# ==========================================
Write-Host "Creating $serviceName service..."
& $nssmPath install $serviceName $appPath
& $nssmPath set $serviceName AppDirectory "$PSScriptRoot"
& $nssmPath set $serviceName Start SERVICE_AUTO_START

# Set up logs
$logDir = "$PSScriptRoot\logs"
New-Item -ItemType Directory -Force -Path $logDir | Out-Null
& $nssmPath set $serviceName AppStdout "$logDir\out.log"
& $nssmPath set $serviceName AppStderr "$logDir\error.log"

# ==========================================
# Start the service
# ==========================================
Write-Host "Starting service..."
& $nssmPath start $serviceName

Write-Host "✅ NAPS2 installed silently, no GUI, all processes stopped, and service running."
Start-Sleep -Seconds 2

# ==========================================
# Create Control Panel Uninstall Entry
# ==========================================
Write-Host "Registering uninstall entry in Control Panel..."

# Registry uninstall path
$uninstallRegPath = "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\mpn-core"
if (!(Test-Path $uninstallRegPath)) {
    New-Item -Path $uninstallRegPath -Force | Out-Null
}

# Paths
$nssmPath = "$env:ProgramFiles\nssm\nssm.exe"
$serviceFilesPath = "$PSScriptRoot\mpn-core"
# Correct icon path
$iconPath = Resolve-Path (Join-Path $PSScriptRoot "..\..\images\icon.ico")

# Use it if it exists, fallback to exe
if (Test-Path $iconPath) {
    Set-ItemProperty -Path $uninstallRegPath -Name "DisplayIcon" -Value $iconPath
} else {
    Set-ItemProperty -Path $uninstallRegPath -Name "DisplayIcon" -Value "$PSScriptRoot\mpn-core-win.exe"
}

# ==========================================
# Build uninstall script
# ==========================================
$uninstallScript = @"
Write-Host 'Stopping mpn-core service...'
& `"$nssmPath`" stop mpn-core -ErrorAction SilentlyContinue

Write-Host 'Removing mpn-core service...'
& `"$nssmPath`" remove mpn-core confirm -ErrorAction SilentlyContinue

Write-Host 'Deleting service files...'
Remove-Item -Recurse -Force `"$serviceFilesPath`" -ErrorAction SilentlyContinue

Write-Host 'Removing uninstall registry entry...'
Remove-Item -Recurse -Force `"$uninstallRegPath`" -ErrorAction SilentlyContinue

Write-Host '✅ MPN Core uninstalled successfully.'
"@

# ==========================================
# Encode uninstall script for safe execution
# ==========================================
$bytes = [System.Text.Encoding]::Unicode.GetBytes($uninstallScript)
$encoded = [Convert]::ToBase64String($bytes)

# Create the PowerShell command to run
$uninstallCmd = "powershell.exe -ExecutionPolicy Bypass -EncodedCommand $encoded"

# ==========================================
# Register uninstall entry
# ==========================================
Set-ItemProperty -Path $uninstallRegPath -Name "DisplayName" -Value "MPN Core"
Set-ItemProperty -Path $uninstallRegPath -Name "DisplayVersion" -Value "1.0.0"
Set-ItemProperty -Path $uninstallRegPath -Name "Publisher" -Value "Your Company Name"
Set-ItemProperty -Path $uninstallRegPath -Name "InstallLocation" -Value "$PSScriptRoot"
Set-ItemProperty -Path $uninstallRegPath -Name "UninstallString" -Value $uninstallCmd
Set-ItemProperty -Path $uninstallRegPath -Name "QuietUninstallString" -Value $uninstallCmd

# Icon setup
if (Test-Path $iconPath) {
    Set-ItemProperty -Path $uninstallRegPath -Name "DisplayIcon" -Value $iconPath
} else {
    Set-ItemProperty -Path $uninstallRegPath -Name "DisplayIcon" -Value "$PSScriptRoot\mpn-core-win.exe"
}

# Disable Modify/Repair buttons
Set-ItemProperty -Path $uninstallRegPath -Name "NoModify" -Value 1 -Type DWord
Set-ItemProperty -Path $uninstallRegPath -Name "NoRepair" -Value 1 -Type DWord

Write-Host "✅ Uninstall entry created in Control Panel as 'MPN Core'."
exit
