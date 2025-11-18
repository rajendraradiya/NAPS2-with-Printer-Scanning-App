const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const INSTALLER_NAME = 'install.run';

const DEB_FILES = [
  path.join(__dirname, 'mpn-core.deb'),
  path.join(__dirname, 'naps2-8.2.0-linux-x64.deb')
];


const SCRIPT_HEADER = `#!/bin/bash
set -e

echo "Starting installation of mpn-core and NAPS2..."

# Wait until dpkg lock is free
while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    echo "dpkg is busy, waiting 2 seconds..."
    sleep 2
done

# Create temporary folder
TMPDIR=$(mktemp -d)

# Extract embedded archive
ARCHIVE_LINE=$(awk '/^__ARCHIVE_BELOW__/ {print NR + 1; exit 0; }' "$0")
tail -n +$ARCHIVE_LINE "$0" | tar -xz -C "$TMPDIR"

# Install .deb files
sudo dpkg -i "$TMPDIR"/mpn-core.deb "$TMPDIR"/naps2-8.2.0-linux-x64.deb || true
sudo apt-get -f install -y

echo "Installation complete!"

# Cleanup
rm -rf "$TMPDIR"
exit 0

__ARCHIVE_BELOW__
`;

// 1. Check .deb files exist in current directory
const missingFiles = DEB_FILES.filter(f => !fs.existsSync(f));
if (missingFiles.length) {
  console.error(`Error: Missing .deb files in current folder: ${missingFiles.join(', ')}`);
  process.exit(1);
}

// 2. Remove existing install.run if exists
if (fs.existsSync(INSTALLER_NAME)) {
  fs.unlinkSync(INSTALLER_NAME);
  console.log('Removed existing install.run');
}

// 3. Write the install.run header
fs.writeFileSync(INSTALLER_NAME, SCRIPT_HEADER);
console.log('Created new install.run header');

// 4. Create tar.gz archive of the .deb files
const TAR_NAME = 'packages.tar.gz';
execSync(`tar czf ${TAR_NAME} ${DEB_FILES.join(' ')}`);
console.log('Created packages.tar.gz archive');

// 5. Append archive to install.run
execSync(`cat ${TAR_NAME} >> ${INSTALLER_NAME}`);
console.log('Appended archive to install.run');

// 6. Make install.run executable
fs.chmodSync(INSTALLER_NAME, 0o755);
console.log('install.run is now executable');

// 7. Remove temporary tar.gz
fs.unlinkSync(TAR_NAME);
console.log('Removed temporary packages.tar.gz');

console.log('install.run has been successfully created in the root directory!');
