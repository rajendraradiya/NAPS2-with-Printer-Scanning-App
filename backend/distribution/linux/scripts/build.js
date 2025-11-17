#!/usr/bin/env node
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../.env"),
});
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// === CONFIGURATION ===
const APP_NAME = process.env.APP_NAME;
const VERSION = "1.0";
const ARCH = "amd64";

// Path references
const ROOT = path.join(__dirname, ".."); // backend/distribution/linux/
const EXECUTABLE = path.join(ROOT, "mpn-core-linux");
const ICON_FILE = "icon.png";
const ICON_PATH = path.join(ROOT, ICON_FILE);
const NAPS2_SRC = path.join(ROOT, "naps2-8.2.0-linux-x64.deb");

// Build output dirs
const BUILD_DIR = path.join(ROOT, `${APP_NAME}_deb`);
const DEBIAN_DIR = path.join(BUILD_DIR, "DEBIAN");
const BIN_DIR = path.join(BUILD_DIR, "usr", "bin");
const DESKTOP_DIR = path.join(BUILD_DIR, "usr", "share", "applications");
const SYSTEMD_DIR = path.join(BUILD_DIR, "lib", "systemd", "system");
const ICON_INSTALL_DIR = path.join(
  BUILD_DIR,
  "usr",
  "share",
  "icons",
  "hicolor",
  "256x256",
  "apps"
);

// NAPS2 will be stored here inside package
const NAPS2_DIR = path.join(BUILD_DIR, "usr", "share", APP_NAME);

// Output .deb file
const OUTPUT_DIR = path.join(ROOT, "..", "..", "setup");
const OUTPUT_DEB = path.join(OUTPUT_DIR, `${APP_NAME}.deb`);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(filepath, content, mode) {
  fs.writeFileSync(filepath, content);
  if (mode) fs.chmodSync(filepath, mode);
}

console.log("🧱 Generating Debian package...");

// Create required dirs
ensureDir(DEBIAN_DIR);
ensureDir(BIN_DIR);
ensureDir(DESKTOP_DIR);
ensureDir(SYSTEMD_DIR);
ensureDir(ICON_INSTALL_DIR);
ensureDir(NAPS2_DIR);
ensureDir(OUTPUT_DIR);

// Copy binary
if (!fs.existsSync(EXECUTABLE)) {
  console.error(`❌ ERROR: Binary not found: ${EXECUTABLE}`);
  process.exit(1);
}
fs.copyFileSync(EXECUTABLE, path.join(BIN_DIR, APP_NAME));
fs.chmodSync(path.join(BIN_DIR, APP_NAME), 0o755);

// Copy icon
if (fs.existsSync(ICON_PATH)) {
  fs.copyFileSync(ICON_PATH, path.join(ICON_INSTALL_DIR, `${APP_NAME}.png`));
  console.log("🖼️ Icon copied");
} else {
  console.warn("⚠️ Icon missing: " + ICON_PATH);
}

// Copy NAPS2 installer into package
const NAPS2_DEST = path.join(NAPS2_DIR, "naps2-8.2.0-linux-x64.deb");
if (fs.existsSync(NAPS2_SRC)) {
  fs.copyFileSync(NAPS2_SRC, NAPS2_DEST);
  console.log("📦 Included NAPS2 installer");
} else {
  console.warn("⚠️ NAPS2 missing: " + NAPS2_SRC);
}

// CONTROL FILE
writeFile(
  path.join(DEBIAN_DIR, "control"),
  `
Package: ${APP_NAME}
Version: ${VERSION}
Section: utils
Priority: optional
Architecture: ${ARCH}
Maintainer: Your Name <you@example.com>
Description: ${APP_NAME} – Includes automatic NAPS2 installation
`.trimStart()
);

// DESKTOP ENTRY
writeFile(
  path.join(DESKTOP_DIR, `${APP_NAME}.desktop`),
  `
[Desktop Entry]
Version=1.0
Name=${APP_NAME}
Comment=Start ${APP_NAME} Service
Exec=systemctl start ${APP_NAME}.service
Icon=${APP_NAME}
Terminal=true
Type=Application
Categories=Utility;
`.trimStart()
);

// SYSTEMD SERVICE
writeFile(
  path.join(SYSTEMD_DIR, `${APP_NAME}.service`),
  `
[Unit]
Description=${APP_NAME} Background Service
After=network.target

[Service]
ExecStart=/usr/bin/${APP_NAME}
Restart=always
User=root

[Install]
WantedBy=multi-user.target
`.trimStart()
);

// POSTINST — SAFE APT INSTALL OF NAPS2
writeFile(
  path.join(DEBIAN_DIR, "postinst"),
  `
#!/bin/bash
set -e

echo "📦 Installing NAPS2 (safe apt install)..."

NAPS2_DEB="/usr/share/${APP_NAME}/naps2-8.2.0-linux-x64.deb"

if [ -f "$NAPS2_DEB" ]; then
    apt-get update -y
    apt-get install -y "$NAPS2_DEB"
    echo "✅ NAPS2 installed successfully."
else
    echo "❌ ERROR: NAPS2 installer not found at $NAPS2_DEB"
    exit 1
fi

echo "⚠️ Installing main application (${APP_NAME})..."
systemctl daemon-reload
systemctl enable ${APP_NAME}.service
systemctl start ${APP_NAME}.service

update-desktop-database || true
gtk-update-icon-cache /usr/share/icons/hicolor || true

USER_DESKTOP="/home/$SUDO_USER/Desktop"
if [ -d "$USER_DESKTOP" ]; then
    cp /usr/share/applications/${APP_NAME}.desktop "$USER_DESKTOP/"
    chmod +x "$USER_DESKTOP/${APP_NAME}.desktop"
fi

echo "✅ Installation complete."
exit 0
`.trimStart(),
  0o755
);

// PRERM
writeFile(
  path.join(DEBIAN_DIR, "prerm"),
  `
#!/bin/bash
set -e
systemctl stop ${APP_NAME}.service || true
systemctl disable ${APP_NAME}.service || true
systemctl daemon-reload || true
exit 0
`.trimStart(),
  0o755
);

// POSTRM
writeFile(
  path.join(DEBIAN_DIR, "postrm"),
  `
#!/bin/bash
set -e
rm -f /lib/systemd/system/${APP_NAME}.service || true
systemctl daemon-reload || true
exit 0
`.trimStart(),
  0o755
);

// BUILD
console.log("📦 Building .deb...");
try {
  execSync(`dpkg-deb --build "${BUILD_DIR}" "${OUTPUT_DEB}"`, {
    stdio: "inherit",
  });
  console.log(`✅ Build complete: ${OUTPUT_DEB}`);
} catch (err) {
  console.error("❌ Build failed:", err);
  process.exit(1);
}
