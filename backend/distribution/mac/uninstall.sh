#!/bin/bash
SERVICE_NAME="mpn-core"
USER_NAME="${SUDO_USER:-$USER}"
USER_HOME=$(eval echo "~$USER_NAME")

echo "→ Stopping and removing $SERVICE_NAME ..."

# Stop and unload service
launchctl stop com.$SERVICE_NAME 2>/dev/null || true
launchctl unload "$USER_HOME/Library/LaunchAgents/com.$SERVICE_NAME.plist" 2>/dev/null || true

# Remove service files
rm -f "$USER_HOME/Library/LaunchAgents/com.$SERVICE_NAME.plist"
sudo rm -rf "/usr/local/$SERVICE_NAME"

# Remove logs
rm -f "$USER_HOME/Library/Logs/$SERVICE_NAME.log"
rm -f "$USER_HOME/Library/Logs/$SERVICE_NAME-error.log"

# Remove desktop app
rm -rf "$USER_HOME/Desktop/MPN Core.app"

echo "✅ $SERVICE_NAME fully stopped and removed!"
exit 0
