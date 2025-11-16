#!/usr/bin/env node

/**
 * Version management script for Obsidian plugin
 * Updates version in both manifest.json and package.json
 * Usage: npm run version <new-version>
 * Example: npm run version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// Get the new version from command line arguments
const newVersion = process.argv[2];

if (!newVersion) {
  console.error('❌ Error: No version specified');
  console.log('Usage: npm run version <new-version>');
  console.log('Example: npm run version 1.0.0');
  process.exit(1);
}

// Validate semantic versioning format
const semverRegex = /^(\d+)\.(\d+)\.(\d+)(-[a-zA-Z0-9.-]+)?$/;
if (!semverRegex.test(newVersion)) {
  console.error(`❌ Error: Invalid version format: ${newVersion}`);
  console.log('Version must follow semantic versioning (e.g., 1.0.0, 1.2.3, 2.0.0-beta.1)');
  process.exit(1);
}

// File paths
const manifestPath = path.join(__dirname, '..', 'manifest.json');
const packagePath = path.join(__dirname, '..', 'package.json');

// Read and update manifest.json
try {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const oldManifestVersion = manifest.version;
  manifest.version = newVersion;
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`✅ Updated manifest.json: ${oldManifestVersion} → ${newVersion}`);
} catch (error) {
  console.error(`❌ Error updating manifest.json: ${error.message}`);
  process.exit(1);
}

// Read and update package.json
try {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const oldPackageVersion = pkg.version;
  pkg.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✅ Updated package.json: ${oldPackageVersion} → ${newVersion}`);
} catch (error) {
  console.error(`❌ Error updating package.json: ${error.message}`);
  process.exit(1);
}

console.log('\n📦 Version update complete!');
console.log('\nNext steps:');
console.log('1. Review the changes: git diff');
console.log(`2. Commit the changes: git commit -am "Bump version to ${newVersion}"`);
console.log('3. Push to GitHub: git push');
console.log(`4. Create and push tag: git tag ${newVersion} && git push origin ${newVersion}`);
console.log('5. GitHub Actions will automatically create the release');