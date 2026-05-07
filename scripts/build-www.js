const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'www');

const files = [
  'index.html',
  'app.js',
  'app.min.js',
  'style.css',
  'style.min.css',
  'dskp_embedded.js',
  'manifest.webmanifest',
  'service-worker.js',
  'offline.html',
  'runtime-config.js'
];

const dirs = [
  'assets'
];

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const source = path.join(rootDir, file);
  if (!fs.existsSync(source)) continue;
  fs.copyFileSync(source, path.join(outDir, file));
}

for (const dir of dirs) {
  const source = path.join(rootDir, dir);
  if (!fs.existsSync(source)) continue;
  fs.cpSync(source, path.join(outDir, dir), { recursive: true });
}

console.log('Prepared Capacitor web assets in www');
