#!/bin/bash

# Installer script for NAPS2

PACKAGE="/usr/bin/naps2-8.2.0-linux-x64.deb"

# Check if the .deb file exists
if [ ! -f "$PACKAGE" ]; then
    echo "Error: $PACKAGE not found in the current directory."
    exit 1
fi

# Update package list
echo "Updating package list..."
sudo apt-get update

# Install gdebi if not installed (better for .deb packages)
if ! command -v gdebi >/dev/null 2>&1; then
    echo "Installing gdebi to handle .deb package..."
    sudo apt-get install -y gdebi-core
fi

# Install the .deb package
echo "Installing $PACKAGE..."
sudo gdebi -n "$PACKAGE"

# Confirm installation
if dpkg -l | grep -q naps2; then
    echo "NAPS2 installation completed successfully!"
else
    echo "Installation failed. Please check the output above for errors."
fi
