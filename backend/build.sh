#!/bin/bash
set -e

# === CONFIGURATION ===
SERVICE_NAME="naps2-service"
BINARY_NAME="naps2-service-macos"
SERVICE_PATH="/usr/local/$SERVICE_NAME"
PLIST_PATH="$HOME/Library/LaunchAgents/com.$SERVICE_NAME.plist"
AUTOMATOR_APP_PATH="$HOME/Desktop/NAPS2 Service.app"

echo "=== Installing $SERVICE_NAME ==="

# 1️⃣ Copy binary
echo "→ Copying binary..."
if [ ! -f "./build/$BINARY_NAME" ]; then
  echo "❌ Error: ./build/$BINARY_NAME not found. Please build it first."
  exit 1
fi

sudo mkdir -p "$SERVICE_PATH"
sudo cp "./build/$BINARY_NAME" "$SERVICE_PATH/$SERVICE_NAME"
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

# 3️⃣ Load LaunchAgent
echo "→ Loading LaunchAgent..."
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
launchctl start "com.$SERVICE_NAME"

# 4️⃣ Create Automator app shortcut
echo "→ Creating Automator shortcut on Desktop..."
AUTOMATOR_SCRIPT=$(mktemp)
cat <<EOF > "$AUTOMATOR_SCRIPT"
on run {input, parameters}
    do shell script "$SERVICE_PATH/$SERVICE_NAME &"
    return input
end run
EOF

osascript -e "
tell application \"Automator\"
    set newDoc to make new document with properties {document type:application}
    tell newDoc
        make new action at end with properties {name:\"Run AppleScript\", contents:read POSIX file \"$AUTOMATOR_SCRIPT\"}
    end tell
    save newDoc in POSIX file \"$AUTOMATOR_APP_PATH\"
    close newDoc saving no
end tell
"

rm "$AUTOMATOR_SCRIPT"

echo "✅ Installation complete!"
echo "-----------------------------------------"
echo "Binary installed to: $SERVICE_PATH/$SERVICE_NAME"
echo "LaunchAgent plist:   $PLIST_PATH"
echo "Desktop shortcut:    $AUTOMATOR_APP_PATH"
echo "-----------------------------------------"
echo "ℹ️ The service will auto-start on login."
echo "   You can also double-click the desktop shortcut to start it manually."
