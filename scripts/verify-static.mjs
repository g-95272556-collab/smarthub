import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(".");

const requiredFiles = [
  "index.html",
  "app.js",
  "takwim.js",
  "aktiviti.js",
  "style.css",
  "runtime-config.js",
  "service-worker.js",
  "manifest.webmanifest",
  "offline.html",
  "dskp_embedded.js",
  "splash-perasmian.js",
  "assets/logo.png",
  "assets/cop-sekolah.png",
  "assets/sk-kiandongo-logo.png",
  "assets/icon-192.png",
  "assets/icon-512.png",
  "assets/icon-maskable-192.png",
  "assets/icon-maskable-512.png",
  "netlify.toml",
  "_redirects",
];

const missing = requiredFiles.filter((file) => !existsSync(join(root, file)));

if (missing.length) {
  console.error("Fail wajib tiada:");
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const indexHtml = readFileSync(join(root, "index.html"), "utf8");
const serviceWorker = readFileSync(join(root, "service-worker.js"), "utf8");
const runtimeConfig = readFileSync(join(root, "runtime-config.js"), "utf8");

const checks = [
  ["index.html", "runtime-config.js", indexHtml.includes('src="runtime-config.js"') || indexHtml.includes('src="runtime-config.js"></script>') || indexHtml.includes('<script src="runtime-config.js"></script>')],
  ["index.html", "style.css", indexHtml.includes('href="style.css"')],
  ["index.html", "app.js", indexHtml.includes("app.js")],
  ["service-worker.js", "CACHE_NAME", serviceWorker.includes("CACHE_NAME")],
  ["service-worker.js", "app.js", serviceWorker.includes('./app.js')],
  ["runtime-config.js", "netlifySiteUrl", runtimeConfig.includes("netlifySiteUrl")],
  ["runtime-config.js", "workerUrl", runtimeConfig.includes("workerUrl")],
];

const failedChecks = checks.filter(([, , passed]) => !passed);

if (failedChecks.length) {
  console.error("Semakan kandungan gagal:");
  for (const [file, needle] of failedChecks) console.error(`- ${file} tidak mengandungi ${needle}`);
  process.exit(1);
}

console.log("OK: struktur projek dan rujukan deploy asas sah.");
