<pre>

# 1. Install dependencies
npm install

# 2. build generate linux and .exe
npm run build

# 3. Build the .pkg
./build.sh

# 4. Install the package (manually)
npm run pkg
sudo installer -pkg naps2-installer.pkg -target /
cat /tmp/naps2-postinstall.log 

# Stop service mac
launchctl stop com.naps2-service
launchctl unload ~/Library/LaunchAgents/com.naps2-service.plist

pkill -f naps2-service


# Stop service Linux
sudo systemctl stop mpn-core-linux.service


#Stop service windows

$nssmPath = "$env:ProgramFiles\nssm\nssm.exe"
& $nssmPath stop mpn-core
& $nssmPath remove mpn-core confirm


<pre>
# iexpress run command need
powershell.exe -ExecutionPolicy Bypass -File   build-win.ps1
</pre>
</pre>










#!/bin/bash
set -e

# === CONFIGURATION ===
SERVICE_NAME="naps2-service"
BINARY_NAME="naps2-service-macos"
SERVICE_PATH="/usr/local/$SERVICE_NAME"
PLIST_PATH="$HOME/Library/LaunchAgents/com.$SERVICE_NAME.plist"
AUTOMATOR_APP_PATH="$HOME/Desktop/NAPS2 Service.app"
BINARY_PATH="$SERVICE_PATH/$BINARY_NAME"

echo "=== Installing $SERVICE_NAME ==="

# 1️⃣ Copy binary
echo "→ Copying binary..."
if [ ! -f "$BINARY_PATH" ]; then
  echo "❌ Error: $BINARY_PATH not found. Please  it first."
  exit 1
fi

sudo mkdir -p "$SERVICE_PATH"
sudo cp "$BINARY_PATH" "$SERVICE_PATH/$SERVICE_NAME"
sudo chown "$USER_NAME":staff "$SERVICE_PATH/$SERVICE_NAME"
sudo chmod +x "$SERVICE_PATH/$SERVICE_NAME"




# 2️⃣ Create LaunchAgent plist
echo "→ Creating LaunchAgent plist..."
cat <<EOF > "$PLIST_PATH"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.$SERVICE_NAME</string>

    <key>ProgramArguments</key>
    <array>
      <string>$SERVICE_PATH/$SERVICE_NAME</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>WorkingDirectory</key>
    <string>$SERVICE_PATH</string>

    <key>StandardOutPath</key>
    <string>$HOME/Library/Logs/$SERVICE_NAME.log</string>

    <key>StandardErrorPath</key>
    <string>$HOME/Library/Logs/$SERVICE_NAME-error.log</string>
  </dict>
</plist>
EOF

# 3️⃣ Load LaunchAgent in user context
echo "→ Loading LaunchAgent as the real user..."
USER_NAME="${SUDO_USER:-$USER}"
USER_ID=$(id -u "$USER_NAME")
TARGET_PLIST="$HOME/Library/LaunchAgents/com.$SERVICE_NAME.plist"



# Copy plist if different
if ! cmp -s "$PLIST_PATH" "$TARGET_PLIST"; then
    sudo -u "$USER_NAME" cp "$PLIST_PATH" "$TARGET_PLIST"
fi


# Unload old LaunchAgent (if running) and load new one
sudo -u "$USER_NAME" launchctl bootout gui/$USER_ID "$TARGET_PLIST" 2>/dev/null || true
sudo -u "$USER_NAME" launchctl bootstrap gui/$USER_ID "$TARGET_PLIST" || \
    echo "⚠️ LaunchAgent load failed"

    

# 4️⃣ Create Automator app shortcut
echo "→ Creating Automator shortcut on Desktop..."
AUTOMATOR_SCRIPT=$(mktemp)
cat <<EOF > "$AUTOMATOR_SCRIPT"
on run {input, parameters}
    do shell script "nohup " & quoted form of "$SERVICE_PATH/$SERVICE_NAME" & " > /dev/null 2>&1 &"
    return input
end run
EOF

echo "→ New Creating Automator"

# Create AppleScript that runs your service
# Paths
AUTOMATOR_APP_PATH="$HOME/Desktop/NAPS2 Service.app"
AUTOMATOR_SCRIPT="$HOME/Desktop/NAPS2 Service.scpt"

# Write AppleScript to file
cat <<EOF > "$AUTOMATOR_SCRIPT"
do shell script "nohup '$SERVICE_PATH/$SERVICE_NAME' > /dev/null 2>&1 &"
EOF

# Compile AppleScript to a .app
osacompile -o "$AUTOMATOR_APP_PATH" "$AUTOMATOR_SCRIPT"

# Optional: remove the intermediate script
rm "$AUTOMATOR_SCRIPT"



echo "✅ Installation complete!"
echo "-----------------------------------------"
echo "Binary installed to: $SERVICE_PATH/$SERVICE_NAME"
echo "LaunchAgent plist:   $PLIST_PATH"
echo "Desktop shortcut:    $AUTOMATOR_APP_PATH"
echo "-----------------------------------------"
echo "ℹ️ The service will auto-start on login."
echo "   You can also double-click the desktop shortcut to start it manually."
