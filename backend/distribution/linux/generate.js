const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// ─────────────────────────────────────────────
// PATH CONFIGURATION (IMPORTANT PART)
// ─────────────────────────────────────────────
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const SETUP_DIR = path.join(PROJECT_ROOT, 'setup');
const INSTALLER_NAME = path.join(SETUP_DIR, 'mpn-software-linux.run');

// .deb files must be in the same directory as this script
const DEB_FILES = [
  'mpn-software.deb',
  'naps2-8.2.0-linux-x64.deb'
];

// Absolute paths for validation
const DEB_PATHS = DEB_FILES.map(f => path.join(__dirname, f));

const SCRIPT_HEADER = `#!/bin/bash
set -e

echo "Starting installation of mpn-software and NAPS2..."

# Wait until dpkg lock is free
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    echo "dpkg is busy, waiting 2 seconds..."
    sleep 2
done

# Create temporary directory
TMPDIR=$(mktemp -d)

# Extract embedded archive
ARCHIVE_LINE=$(awk '/^__ARCHIVE_BELOW__/ {print NR + 1; exit 0; }' "$0")
tail -n +$ARCHIVE_LINE "$0" | tar -xz -C "$TMPDIR"

# Install .deb files
sudo dpkg -i "$TMPDIR"/*.deb || true
sudo apt-get -f install -y

echo "Installation complete!"

# Cleanup
rm -rf "$TMPDIR"
exit 0

__ARCHIVE_BELOW__
`;

// 1. Validate .deb files exist
const missingFiles = DEB_PATHS.filter(f => !fs.existsSync(f));
if (missingFiles.length) {
  console.error('Error: Missing .deb files:\n' + missingFiles.join('\n'));
  process.exit(1);
}

// 2. Remove existing installer
if (fs.existsSync(INSTALLER_NAME)) {
  fs.unlinkSync(INSTALLER_NAME);
  console.log('Removed existing mpn-software-linux.run');
}

// 3. Write installer header
fs.writeFileSync(INSTALLER_NAME, SCRIPT_HEADER);
console.log('Created mpn-software-linux.run header');

// 4. Create tar.gz archive (NO absolute paths)
const TAR_NAME = 'packages.tar.gz';
const tarCommand = `tar czf "${TAR_NAME}" -C "${__dirname}" ${DEB_FILES.join(' ')}`;

try {
  execSync(tarCommand, { stdio: 'inherit' });
  console.log('Created packages.tar.gz');
} catch (err) {
  console.error('Failed to create tar archive');
  process.exit(1);
}

// 5. Append archive to installer
try {
  execSync(`cat "${TAR_NAME}" >> "${INSTALLER_NAME}"`, { stdio: 'inherit' });
  console.log('Embedded archive into mpn-software-linux.run');
} catch (err) {
  console.error('Failed to append archive');
  process.exit(1);
}

// 6. Make installer executable
fs.chmodSync(INSTALLER_NAME, 0o755);
console.log('Marked mpn-software-linux.run as executable');

// 7. Cleanup
fs.unlinkSync(TAR_NAME);
console.log('Removed temporary archive');

console.log('\n✅ mpn-software-linux.run created successfully!');
