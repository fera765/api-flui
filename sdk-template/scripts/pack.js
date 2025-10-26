/**
 * Pack script
 * Creates a ZIP file ready for TOR import
 */

const AdmZip = require('adm-zip');
const fs = require('fs');
const path = require('path');

const manifest = require('../manifest.json');
const { name, version } = manifest;

const buildDir = path.join(__dirname, '../build');
const zipFilename = `${name}-${version}.zip`;
const zipPath = path.join(buildDir, zipFilename);

// Create build directory
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

// Create ZIP
const zip = new AdmZip();

// Add manifest.json
zip.addLocalFile(path.join(__dirname, '../manifest.json'));

// Add dist/ folder
zip.addLocalFolder(path.join(__dirname, '../dist'), 'dist');

// Add README if exists
const readmePath = path.join(__dirname, '../README-tool.md');
if (fs.existsSync(readmePath)) {
  zip.addLocalFile(readmePath);
}

// Write ZIP
zip.writeZip(zipPath);

console.log(`✅ Tool packed successfully!`);
console.log(`📦 File: ${zipPath}`);
console.log(`📏 Size: ${(fs.statSync(zipPath).size / 1024).toFixed(2)} KB`);
console.log();
console.log(`Next steps:`);
console.log(`  1. Upload via: curl -F "file=@${zipPath}" http://localhost:3000/api/tools/import`);
console.log(`  2. Or use the TOR API directly`);
