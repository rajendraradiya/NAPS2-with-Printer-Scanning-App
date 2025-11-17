#!/usr/bin/env node
require("dotenv").config({
  path: require("path").resolve(__dirname, "../../../../.env"),
});
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// === CONFIGURATION ===
const APP_NAME = process.env.APP_NAME;
const VERSION = "1.0";
const ARCH = "amd64";
const ICON_FILE = "icon.png";

// Paths
const ROOT = path.join(__dirname, "..");
const EXECUTABLE = path.join(ROOT, "mpn-core-linux");
const ICON_PATH = path.join(ROOT, ICON_FILE);
const BUILD_DIR = path.join(ROOT, `${APP_NAME}_deb`);
const DEBIAN_DIR = path.join(BUILD_DIR, "DEBIAN");
const BIN_DIR = path.join(BUILD_DIR, "usr", "bin");
const DESKTOP_DIR = path.join(BUILD_DIR, "usr", "share", "applications");
const SYSTEMD_DIR = path.join(BUILD_DIR, "lib", "systemd", "system");
const INSTALLER_PATH = path.join(ROOT, "installer.sh");
const NAPS2_EXECUTABLE = path.join(ROOT, "naps2-8.2.0-linux-x64.deb");
const ICON_INSTALL_DIR = path.join(
  BUILD_DIR,
  "usr",
  "share",
  "icons",
  "hicolor",
  "256x256",
  "apps"
);

const OUTPUT_DIR = path.join(ROOT, "..");
const OUTPUT_DEB = path.join(OUTPUT_DIR, `${APP_NAME}.deb`);

// ---------- NEW CLEANUP SECTION ----------
console.log("🧹 Cleaning old build if exists...");

if (fs.existsSync(BUILD_DIR)) {
  console.log(`🗑 Removing old directory: ${BUILD_DIR}`);
  fs.rmSync(BUILD_DIR, { recursive: true, force: true });
}

if (fs.existsSync(OUTPUT_DEB)) {
  console.log(`🗑 Removing old package: ${OUTPUT_DEB}`);
  fs.rmSync(OUTPUT_DEB);
}
// -----------------------------------------

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file, content, mode) {
  fs.writeFileSync(file, content);
  if (mode) fs.chmodSync(file, mode);
}

console.log("🧱 Creating Debian package structure...");

ensureDir(DEBIAN_DIR);
ensureDir(BIN_DIR);
ensureDir(DESKTOP_DIR);
ensureDir(SYSTEMD_DIR);
ensureDir(ICON_INSTALL_DIR);
ensureDir(OUTPUT_DIR);

// Ensure bin dir exists
ensureDir(BIN_DIR);

// Copy main executable
fs.copyFileSync(EXECUTABLE, path.join(BIN_DIR, APP_NAME));
fs.chmodSync(path.join(BIN_DIR, APP_NAME), 0o755);

// Copy NAPS2 deb inside the package
if (!fs.existsSync(NAPS2_EXECUTABLE)) {
  console.error(`❌ NAPS2_EXECUTABLE not found at: ${NAPS2_EXECUTABLE}`);
  process.exit(1);
}
const PACKAGE_NAPS2_PATH = path.join(BIN_DIR, "naps2-8.2.0-linux-x64.deb");
fs.copyFileSync(NAPS2_EXECUTABLE, PACKAGE_NAPS2_PATH);
fs.chmodSync(PACKAGE_NAPS2_PATH, 0o644);

// verify executable exists
if (!fs.existsSync(EXECUTABLE)) {
  console.error(`❌ Executable not found at: ${EXECUTABLE}`);
  process.exit(1);
}

// copy executable
fs.copyFileSync(EXECUTABLE, path.join(BIN_DIR, APP_NAME));
fs.chmodSync(path.join(BIN_DIR, APP_NAME), 0o755);

// Copy icon
if (fs.existsSync(ICON_PATH)) {
  fs.copyFileSync(ICON_PATH, path.join(ICON_INSTALL_DIR, `${APP_NAME}.png`));
  console.log(`🖼️  Icon added: ${ICON_FILE}`);
} else {
  console.warn(`⚠️ Icon not found at ${ICON_PATH}`);
}

// control file
writeFile(
  path.join(DEBIAN_DIR, "control"),
  `
Package: ${APP_NAME}
Version: ${VERSION}
Section: utils
Priority: optional
Architecture: ${ARCH}
Maintainer: Your Name <you@example.com>
Description: ${APP_NAME} – Linux service with desktop shortcut
`.trimStart()
);

// desktop
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

// service
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

// postinst
writeFile(
  path.join(DEBIAN_DIR, "postinst"),
  `
#!/bin/bash
set -e

echo ""
echo "⚠️  You are about to install ${APP_NAME}."
echo "This process will:"
echo "  • Create desktop shortcut"
echo "  • Install and start service"
echo ""

read -p "Do you want to continue? (y/n): " CONFIRM

if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo "❌ Installation cancelled."
    exit 1
fi

systemctl daemon-reload
systemctl enable ${APP_NAME}.service
systemctl start ${APP_NAME}.service

if command -v update-desktop-database &>/dev/null; then
    update-desktop-database
fi
if command -v gtk-update-icon-cache &>/dev/null; then
    gtk-update-icon-cache /usr/share/icons/hicolor || true
fi

USER_DESKTOP="/home/$SUDO_USER/Desktop"
if [ -d "$USER_DESKTOP" ]; then
    cp /usr/share/applications/${APP_NAME}.desktop "$USER_DESKTOP/"
    chmod +x "$USER_DESKTOP/${APP_NAME}.desktop"
fi

echo "✅ ${APP_NAME} installed."

echo "To complete setup, run:"
echo "sudo /usr/share/mpn-core/installer.sh"
echo ""

exit 0
`.trimStart(),
  0o755
);

// prerm
writeFile(
  path.join(DEBIAN_DIR, "prerm"),
  `
#!/bin/bash
set -e

echo "🛑 Stopping ${APP_NAME}..."

if systemctl is-active --quiet ${APP_NAME}.service; then
    systemctl stop ${APP_NAME}.service
fi
if systemctl is-enabled --quiet ${APP_NAME}.service; then
    systemctl disable ${APP_NAME}.service
fi

systemctl daemon-reload || true
exit 0
`.trimStart(),
  0o755
);

// postrm
writeFile(
  path.join(DEBIAN_DIR, "postrm"),
  `
#!/bin/bash
set -e

echo "🧹 Cleaning files..."

if [ -f "/lib/systemd/system/${APP_NAME}.service" ]; then
    rm -f /lib/systemd/system/${APP_NAME}.service
fi

systemctl daemon-reload || true
exit 0
`.trimStart(),
  0o755
);

console.log("📦 Building .deb package...");

try {
  execSync(`dpkg-deb --build "${BUILD_DIR}" "${OUTPUT_DEB}"`, {
    stdio: "inherit",
    cwd: ROOT,
  });
  console.log(`✅ Done! Built ${OUTPUT_DEB}`);
} catch (err) {
  console.error("❌ Failed to build .deb:", err);
  process.exit(1);
}
