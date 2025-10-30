<pre>

# 1. Install dependencies
npm install

# 2. build generate linux and .exe
npm run build

# 3. Build the .pkg
./build.sh

# 4. Install the package (manually)

# Stop service
launchctl stop com.naps2-service
launchctl unload ~/Library/LaunchAgents/com.naps2-service.plist
</pre>


<pre>

powershell.exe -ExecutionPolicy Bypass -File   build-win.ps1
</pre>