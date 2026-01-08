# ==========================================
# MPN-Software Full Installer Script
# ==========================================
$serviceName = "mpn-software"
$appPath = Join-Path $PSScriptRoot "mpn-core-win.exe"
$nssmBase = Join-Path $env:ProgramFiles "nssm"
$nssmPath = Join-Path $nssmBase "nssm.exe"
$naps2Installer = Join-Path $PSScriptRoot "naps2-8.2.1-win-x64.exe"
$naps2Exe = Join-Path $env:ProgramFiles "NAPS2\NAPS2.Console.exe"
# ==========================================
# NEW: Permanent install directory (ONLY ADDITION)
# ==========================================
$installDir = Join-Path $env:ProgramFiles "MPN Software"
$iconDest   = Join-Path $installDir "icon.ico"
$uninstallPs1 = Join-Path $installDir "uninstall.ps1"

# ==========================================
#  Source icon (MUST EXIST before popup)
# ==========================================

$scriptDir  = Split-Path -Parent $PSCommandPath
$iconSource = Join-Path $scriptDir "icon.ico"

if (-not (Test-Path $iconSource)) {
    Write-Error "icon.ico not found in script directory: $scriptDir"
    exit 1
}

# ==========================================
#  Confirmation Popup Function (WPF)
# ==========================================

Add-Type -AssemblyName PresentationFramework

function Show-YesNoPopup {
    param (
        [Parameter(Mandatory)]
        [string]$Message,

        [string]$Title = "Confirmation",

        [string]$IconPath
    )

    $xaml = @"
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        Title="$Title"
        Height="220"
        Width="480"
        WindowStartupLocation="CenterScreen"
        ResizeMode="NoResize"
        WindowStyle="SingleBorderWindow"
        Topmost="True">

    <Grid Margin="10">
        <Grid.RowDefinitions>
            <RowDefinition Height="*" />
            <RowDefinition Height="Auto" />
        </Grid.RowDefinitions>

        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="Auto"/>
            <ColumnDefinition Width="*"/>
        </Grid.ColumnDefinitions>

        <Image Name="IconImage"
               Width="64"
               Height="64"
               Margin="10"
               Grid.Row="0"
               Grid.Column="0"/>

        <TextBlock Grid.Row="0"
                   Grid.Column="1"
                   VerticalAlignment="Center"
                   TextWrapping="Wrap"
                   FontSize="14"
                   Text="$Message"/>

        <StackPanel Grid.Row="1"
                    Grid.ColumnSpan="2"
                    Orientation="Horizontal"
                    HorizontalAlignment="Right"
                    Margin="0,10,0,0">

            <Button Name="YesButton"
                    Content="Yes"
                    Width="90"
                    Margin="5"
                    IsDefault="True"/>

            <Button Name="NoButton"
                    Content="No"
                    Width="90"
                    Margin="5"
                    IsCancel="True"/>
        </StackPanel>
    </Grid>
</Window>
"@

    $reader = New-Object System.Xml.XmlNodeReader ([xml]$xaml)
    $window = [Windows.Markup.XamlReader]::Load($reader)

    # -------------------------------
    # Set icon correctly
    # -------------------------------
    if ($IconPath -and (Test-Path $IconPath)) {
        $iconUri   = New-Object System.Uri($IconPath, [System.UriKind]::Absolute)
        $iconFrame = [System.Windows.Media.Imaging.BitmapFrame]::Create($iconUri)

        $window.Icon = $iconFrame
        $window.FindName("IconImage").Source = $iconFrame
    }

    $script:result = $false

    $window.FindName("YesButton").Add_Click({
        $script:result = $true
        $window.Close()
    })

    $window.FindName("NoButton").Add_Click({
        $script:result = $false
        $window.Close()
    })

    $window.ShowDialog() | Out-Null
    return $script:result
}

# ==========================================
#  SHOW CONFIRMATION POPUP
# ==========================================

$confirm = Show-YesNoPopup `
    -Title "MPN Software" `
    -Message "MPN Software and NAPS2 services automatically start after installation and run in the background." `
    -IconPath $iconSource

if (-not $confirm) {
    exit 1
}

# ==========================================
#  INSTALL PHASE
# ==========================================

New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Copy-Item $iconSource $iconDest -Force

# Continue installation logic here



# ==========================================
# Ensure install directory exists (ONLY ADDITION)
# ==========================================
if (-not (Test-Path $installDir)) {
    New-Item -ItemType Directory -Path $installDir -Force | Out-Null
}

# ==========================================
# Copy icon to permanent location (ONLY ADDITION)
# ==========================================
if ($iconPath -and (Test-Path $iconPath)) {
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
            Write-Host "NAPS2 installed successfully."
        } else {
            Write-Host "NAPS2 installation failed."
        }
    } else {
        Write-Host "NAPS2 installer not found at $naps2Installer"
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
    Write-Host "NSSM installed successfully."
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
# $wshell = New-Object -ComObject WScript.Shell
# $wshell.Popup("MPN Software installed successfully.`nService is running and ready to use.", 5, "Installation Complete", 64)

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "Service: $serviceName" -ForegroundColor Green
Write-Host "Logs: $logDir" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Yellow
exit
