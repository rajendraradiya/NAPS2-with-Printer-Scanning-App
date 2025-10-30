#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// === CONFIGURATION ===
const APP_NAME = "mpn-core-linux";
const VERSION = "1.0";
const ARCH = "amd64";

// Paths
const ROOT = path.join(__dirname, ".."); // backend/distribution/linux
const EXECUTABLE = path.join(ROOT, APP_NAME); // executable
const BUILD_DIR = path.join(ROOT, `${APP_NAME}_deb`);
const DEBIAN_DIR = path.join(BUILD_DIR, "DEBIAN");
const BIN_DIR = path.join(BUILD_DIR, "usr", "bin");
const DESKTOP_DIR = path.join(BUILD_DIR, "usr", "share", "applications");
const SYSTEMD_DIR = path.join(BUILD_DIR, "lib", "systemd", "system");

// Output .deb location
const OUTPUT_DIR = path.join(ROOT, "..", "..", "setup");
const OUTPUT_DEB = path.join(OUTPUT_DIR, `${APP_NAME}.deb`);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file, content, mode) {
  fs.writeFileSync(file, content);
  if (mode) fs.chmodSync(file, mode);
}

console.log("🧱 Creating Debian package structure...");

// Ensure directories
ensureDir(DEBIAN_DIR);
ensureDir(BIN_DIR);
ensureDir(DESKTOP_DIR);
ensureDir(SYSTEMD_DIR);
ensureDir(OUTPUT_DIR);

// Verify executable exists
if (!fs.existsSync(EXECUTABLE)) {
  console.error(`❌ Executable not found at: ${EXECUTABLE}`);
  process.exit(1);
}

// Copy executable
fs.copyFileSync(EXECUTABLE, path.join(BIN_DIR, APP_NAME));
fs.chmodSync(path.join(BIN_DIR, APP_NAME), 0o755);

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

// desktop shortcut
writeFile(
  path.join(DESKTOP_DIR, `${APP_NAME}.desktop`),
  `
[Desktop Entry]
Version=1.0
Name=${APP_NAME}
Comment=Launch ${APP_NAME}
Exec=/usr/bin/${APP_NAME}
Icon=utilities-terminal
Terminal=false
Type=Application
Categories=Utility;
`.trimStart()
);

// systemd service
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
systemctl daemon-reload
systemctl enable ${APP_NAME}.service
systemctl start ${APP_NAME}.service
if command -v update-desktop-database &>/dev/null; then
    update-desktop-database
fi
exit 0
`.trimStart(),
  0o755
);

console.log("📦 Building .deb package...");

try {
  // Build the package
  execSync(`dpkg-deb --build "${BUILD_DIR}" "${OUTPUT_DEB}"`, {
    stdio: "inherit",
    cwd: ROOT,
  });
  console.log(`✅ Done! Built ${OUTPUT_DEB}`);
} catch (err) {
  console.error("❌ Failed to build .deb:", err.message);
  process.exit(1);
}
