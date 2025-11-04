#!/bin/bash
set -e

# === CONFIGURATION ===
SERVICE_NAME="mpn-core"
BINARY_NAME="mpn-core-macos"
SERVICE_PATH="/usr/local/$SERVICE_NAME"

# Detect the real user (not root)
USER_NAME="${SUDO_USER:-$USER}"
USER_ID=$(id -u "$USER_NAME")
USER_HOME=$(eval echo "~$USER_NAME")

PLIST_PATH="$USER_HOME/Library/LaunchAgents/com.$SERVICE_NAME.plist"
AUTOMATOR_APP_PATH="$USER_HOME/Desktop/MPN Core.app"
BINARY_PATH="$SERVICE_PATH/$BINARY_NAME"

echo "=== Installing $SERVICE_NAME ==="
echo "User: $USER_NAME ($USER_ID)"
echo "Home: $USER_HOME"
echo "-----------------------------------------"

# 1️⃣ Copy binary
echo "→ Copying binary..."
if [ ! -f "$BINARY_PATH" ]; then
  echo "❌ Error: $BINARY_PATH not found."
  exit 1
fi

sudo mkdir -p "$SERVICE_PATH"
sudo cp "$BINARY_PATH" "$SERVICE_PATH/$SERVICE_NAME"
sudo chown "$USER_NAME":staff "$SERVICE_PATH/$SERVICE_NAME"
sudo chmod +x "$SERVICE_PATH/$SERVICE_NAME"

# 2️⃣ Create LaunchAgent plist
echo "→ Creating LaunchAgent plist at $PLIST_PATH ..."
mkdir -p "$USER_HOME/Library/LaunchAgents"
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
    <string>$USER_HOME/Library/Logs/$SERVICE_NAME.log</string>

    <key>StandardErrorPath</key>
    <string>$USER_HOME/Library/Logs/$SERVICE_NAME-error.log</string>
  </dict>
</plist>
EOF

# 3️⃣ Load LaunchAgent in user context
echo "→ Loading LaunchAgent for $USER_NAME ..."
sudo -u "$USER_NAME" launchctl bootout gui/$USER_ID "com.$SERVICE_NAME" 2>/dev/null || true
sudo -u "$USER_NAME" launchctl bootstrap gui/$USER_ID "$PLIST_PATH" || echo "⚠️ LaunchAgent load failed"
sudo -u "$USER_NAME" launchctl kickstart -k gui/$USER_ID/com.$SERVICE_NAME || echo "⚠️ LaunchAgent start failed"

# 4️⃣ Create Automator shortcut
echo "→ Creating Automator app on Desktop ..."
AUTOMATOR_SCRIPT="$USER_HOME/Desktop/MPN_Core.scpt"

cat <<EOF > "$AUTOMATOR_SCRIPT"
do shell script "nohup '$SERVICE_PATH/$SERVICE_NAME' > /dev/null 2>&1 &"
EOF

osacompile -o "$AUTOMATOR_APP_PATH" "$AUTOMATOR_SCRIPT"
rm "$AUTOMATOR_SCRIPT"

echo "✅ Installation complete!"
echo "-----------------------------------------"
echo "Binary installed to: $SERVICE_PATH/$SERVICE_NAME"
echo "LaunchAgent plist:   $PLIST_PATH"
echo "Desktop shortcut:    $AUTOMATOR_APP_PATH"
echo "-----------------------------------------"
echo "ℹ️ The service will auto-start on login."
echo "   You can also double-click the desktop shortcut to start it manually."
