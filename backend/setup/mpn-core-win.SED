[Version]
Class=IEXPRESS
SEDVersion=3
[Options]
PackagePurpose=InstallApp
ShowInstallProgramWindow=0
HideExtractAnimation=1
UseLongFileName=0
InsideCompressed=0
CAB_FixedSize=0
CAB_ResvCodeSigning=0
RebootMode=I
InstallPrompt=%InstallPrompt%
DisplayLicense=%DisplayLicense%
FinishMessage=%FinishMessage%
TargetName=%TargetName%
FriendlyName=%FriendlyName%
AppLaunched=%AppLaunched%
PostInstallCmd=%PostInstallCmd%
AdminQuietInstCmd=%AdminQuietInstCmd%
UserQuietInstCmd=%UserQuietInstCmd%
SourceFiles=SourceFiles
[Strings]
InstallPrompt=MPN Core and NAPS2 services automatically start after installation and run in the background.
DisplayLicense=
FinishMessage=Installation completed successfully.
TargetName=D:\NAPS2-with-Printer-Scanning-App\backend\setup\mpn-core-win.EXE
FriendlyName=MPN Core
AppLaunched=powershell.exe -ExecutionPolicy Bypass -File build.ps1
PostInstallCmd=<None>
AdminQuietInstCmd=
UserQuietInstCmd=
FILE0="build.ps1"
FILE1="icon.ico"
FILE2="mpn-core-win.exe"
FILE3="naps2-8.2.1-win-x64.exe"
[SourceFiles]
SourceFiles0=D:\NAPS2-with-Printer-Scanning-App\backend\distribution\windows\
[SourceFiles0]
%FILE0%=
%FILE1%=
%FILE2%=
%FILE3%=
