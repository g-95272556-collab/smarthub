import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import http from "node:http";

const root = resolve(".");
const port = Number(process.env.PORT || 8080);

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
};

function sendFile(res, filePath) {
  const ext = extname(filePath).toLowerCase();
  const type = mimeTypes[ext] || "application/octet-stream";
  res.writeHead(200, { "Content-Type": type });
  createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || "/").split("?")[0];
  const requested = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(root, requested);

  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, "index.html");
  }

  if (!existsSync(filePath)) {
    filePath = join(root, "index.html");
  }

  sendFile(res, filePath);
});

server.listen(port, () => {
  console.log(`SmartSchoolHub local server running at http://localhost:${port}`);
});
