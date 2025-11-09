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
$iconPath = "$PSScriptRoot\icon.ico"

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
