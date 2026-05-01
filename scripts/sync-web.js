const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const wwwDir = path.join(rootDir, 'www');

if (!fs.existsSync(wwwDir)) {
  fs.mkdirSync(wwwDir);
}

const filesToCopy = [
  'index.html',
  'style.min.css',
  'manifest.webmanifest',
  'service-worker.js',
  'offline.html',
  'runtime-config.js',
  'app.min.js'
];

filesToCopy.forEach(file => {
  const src = path.join(rootDir, file);
  const dest = path.join(wwwDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file} to www/`);
  } else {
    console.warn(`Warning: ${file} not found in root!`);
  }
});

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) fs.mkdirSync(to);
  fs.readdirSync(from).forEach(element => {
    if (fs.lstatSync(path.join(from, element)).isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    } else {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    }
  });
}

const assetsSrc = path.join(rootDir, 'assets');
const assetsDest = path.join(wwwDir, 'assets');
if (fs.existsSync(assetsSrc)) {
  copyFolderSync(assetsSrc, assetsDest);
  console.log('Copied assets/ to www/assets/');
}
