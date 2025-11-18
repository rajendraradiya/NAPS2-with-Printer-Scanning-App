<pre>

# 1. Install dependencies
npm install

# 2. build generate linux and .exe
npm run windows
npm run linux
npm run mac


______| MAC |_____________________________________________________________________________________
# 4. Install the package (manually)
npm run mac
sudo installer -pkg ./setup/mpn-core-installer.pkg -target /
cat /tmp/mpn-postinstall.log 

# 5. Uninstall whole program
bash /usr/local/mpn-core/uninstall.sh

# Stop service mac

launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.mpn-core.plist

# Remove

launchctl stop com.naps2-service
launchctl unload ~/Library/LaunchAgents/com.naps2-service.plist

# Remove completely

rm -f ~/Library/LaunchAgents/com.mpn-core.plist
sudo rm -rf /usr/local/mpn-core
rm -f ~/Library/Logs/mpn-core.log
rm -f ~/Library/Logs/mpn-core-error.log
rm -rf ~/Desktop/"MPN Core.app"




_______|   Linux  |___________________________________________________________________________________________________________



sudo dpkg --purge mpn-core
sudo dpkg --purge naps2
dpkg -l | grep -E 'mpn-core|naps2'
sudo rm -rf /opt/dual-installer
sudo apt-get remove  mpn-core naps2

______| windows |______________________________________________________________________________________--________
#Stop service windows

$nssmPath = "$env:ProgramFiles\nssm\nssm.exe"
& $nssmPath stop mpn-core
& $nssmPath remove mpn-core confirm

or

 & "$env:ProgramFiles\nssm\nssm.exe" stop mpn-core; & "$env:ProgramFiles\nssm\nssm.exe" remove mpn-core confirm

<pre>
# iexpress run command need
powershell.exe -ExecutionPolicy Bypass -File build.ps1

powershell.exe -ExecutionPolicy Bypass -NoExit -File "build.ps1"


Message
MPN Core and NAPS2 services automatically start after installation and run in the background.

Installation completed successfully.
</pre>
</pre>
