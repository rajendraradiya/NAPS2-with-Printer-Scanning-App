#!/bin/bash
set -e

APP_NAME="naps2-service"
IDENTIFIER="com.naps2.service"
BUILD_DIR="./build"
DIST_DIR="./dist"

# Clean
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

echo "Building macOS binaries with pkg..."
pkg . --targets node18-macos-x64,node18-macos-arm64 --out-path "$BUILD_DIR"

echo "Preparing package contents..."
mkdir -p "$BUILD_DIR/root/usr/local/bin"

# Copy built binaries and plist
cp "$BUILD_DIR/$APP_NAME-macos-x64" "$BUILD_DIR/root/usr/local/bin/$APP_NAME"
cp "$BUILD_DIR/com.naps2.service.plist" "$BUILD_DIR/root/usr/local/bin/com.naps2.service.plist"

# ✅ Set permissions
chmod 755 "$BUILD_DIR/root/usr/local/bin/$APP_NAME"
chmod 644 "$BUILD_DIR/root/usr/local/bin/com.naps2.service.plist"

echo "Building macOS .pkg installer..."
pkgbuild \
  --root "$BUILD_DIR/root" \
  --install-location /usr/local/bin \
  --identifier "$IDENTIFIER" \
  --scripts "$BUILD_DIR/scripts" \
  "$DIST_DIR/$APP_NAME.pkg"

echo "✅ Done! Installer created at: $DIST_DIR/$APP_NAME.pkg"
