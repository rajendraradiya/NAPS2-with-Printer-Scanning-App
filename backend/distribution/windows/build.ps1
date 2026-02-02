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
$nssmZipPath = Join-Path $installDir "nssm-2.24.zip"


# ==========================================
#  Source icon (MUST EXIST before popup)
# ==========================================

$scriptDir  = Split-Path -Parent $PSCommandPath
$iconSource = Join-Path $scriptDir "icon.ico"
$nssmZipSource = Join-Path $scriptDir "nssm-2.24.zip"
$nssmZipDest = Join-Path $installDir "nssm-2.24.zip"


if (-not (Test-Path $iconSource)) {
    Write-Error "icon.ico not found in script directory: $scriptDir"
    exit 1
}

# ==========================================
# STEP 1.  Confirmation Popup Function 
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
# STEP 2.  Run As Administrator
# ==========================================

$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())

# Check for admin
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {

    Write-Host "Restarting script as Administrator..."
    Start-Process powershell.exe -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
    Start-Sleep -Seconds 30
    [Environment]::Exit(0)
}

# ==========================================
#  SHOW CONFIRMATION POPUP
# ==========================================


$confirm = Show-YesNoPopup `
    -Title "MPN Software" `
    -Message "To scan documents to this device, we need to install 3rd party software. In the future, the NAPS2 software will load automatically to help facilitate scanning. Select 'Yes' to continue or 'No' if you don't need the ability to scan documents on this device." `
    -IconPath $iconSource

if (-not $confirm) {
    Write-Host "User declined installation."
    [Environment]::Exit(0)
}

# ==========================================
#  INSTALL PHASE
# ==========================================

New-Item -ItemType Directory -Path $installDir -Force | Out-Null
Copy-Item $iconSource $iconDest -Force
Copy-Item $nssmZipSource $nssmZipDest -Force
# Admin code continues here
Write-Host "Running as Administrator"




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


# ==================================================
# Install NSSM from local ZIP
# ==================================================
function Install-Nssm {
    param (
        [string]$SourceZip,
        [string]$NssmBase,
        [string]$NssmPath
    )

    Write-Host "Installing NSSM..."

    if (!(Test-Path $SourceZip)) {
        throw "NSSM zip not found at $SourceZip"
    }

    if (!(Test-Path $NssmBase)) {
        New-Item -ItemType Directory -Path $NssmBase -Force -ErrorAction Stop | Out-Null
    }

    $extractPath = Join-Path $env:TEMP "nssm_extract"

    if (Test-Path $extractPath) {
        Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
    }

    Expand-Archive `
        -Path $SourceZip `
        -DestinationPath $extractPath `
        -Force `
        -ErrorAction Stop

    Copy-Item `
        "$extractPath\nssm-2.24\win64\nssm.exe" `
        $NssmPath `
        -Force `
        -ErrorAction Stop

    Remove-Item $extractPath -Recurse -Force -ErrorAction SilentlyContinue
}


# ==================================================
# Ensure NSSM Installed (retry + guard)
# ==================================================
function Ensure-NssmInstalled {
    param (
        [int]$MaxAttempts = 2
    )

    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {

        if (Test-Path $nssmPath) {
            Write-Host "NSSM available at $nssmPath"
            return
        }

        if ($attempt -eq 1) {
            Write-Host "NSSM not found. Installing..."
        }
        else {
            Write-Warning "Retrying NSSM installation ($attempt/$MaxAttempts)..."
        }

        try {
            Install-Nssm `
                -SourceZip $nssmZipDest `
                -NssmBase $nssmBase `
                -NssmPath $nssmPath
        }
        catch {
            Write-Warning "Install attempt $attempt failed: $_"
        }
    }

    if (!(Test-Path $nssmPath)) {
        Write-Error "NSSM installation failed after $MaxAttempts attempts. Exiting."
        exit 1
    }
}


Ensure-NssmInstalled


# ==================================================
# SERVICE
# ==================================================


function Install-And-StartService {
    Write-Host "Checking service '$serviceName'..."

    $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

    if ($service) {
        Write-Host "Service exists. Restarting..."
        & $nssmPath restart $serviceName | Out-Null
        Start-Sleep -Seconds 3
        Write-Host "Service '$serviceName' restarted."
        return
    }

    Write-Host "Service not found. Installing..."

    $logDir = Join-Path $PSScriptRoot "logs"
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir | Out-Null
    }

    & $nssmPath install $serviceName $appPath
    & $nssmPath set $serviceName AppDirectory $PSScriptRoot
    & $nssmPath set $serviceName Start SERVICE_AUTO_START
    & $nssmPath set $serviceName AppExit Default Restart
    & $nssmPath set $serviceName AppStdout (Join-Path $logDir "out.log")
    & $nssmPath set $serviceName AppStderr (Join-Path $logDir "error.log")

    & $nssmPath start $serviceName
    Start-Sleep -Seconds 3
    Write-Host "Service '$serviceName' installed and running."
}

# -----------------------------
# First Attempt
# -----------------------------
Install-And-StartService
Start-Sleep 2

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

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Installation completed successfully!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Start-Sleep 1
exit