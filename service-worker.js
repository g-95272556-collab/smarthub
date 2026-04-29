const CACHE_NAME = "ssh-pwa-v3-authfix";
const APP_SHELL = [
  "./",
  "./index.html",
  "./app.js",
  "./manifest.webmanifest",
  "./offline.html",
  "./assets/sk-kiandongo-logo.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-192.png",
  "./assets/icon-maskable-512.png"
];

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(APP_SHELL);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.map(function(key) {
          if (key !== CACHE_NAME) return caches.delete(key);
          return null;
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", function(event) {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFontAsset = /fonts\.(googleapis|gstatic)\.com$/i.test(url.hostname);
  const isFreshAsset = isSameOrigin && (
    request.mode === "navigate" ||
    /\/(?:index\.html|app\.js|runtime-config\.js|service-worker\.js)$/.test(url.pathname)
  );

  if (isFreshAsset) {
    event.respondWith(
      fetch(request).then(function(response) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request.mode === "navigate" ? "./index.html" : request, copy);
        });
        return response;
      }).catch(function() {
        return caches.match(request).then(function(match) {
          return match || caches.match("./index.html") || caches.match("./offline.html");
        });
      })
    );
    return;
  }

  if (!isSameOrigin && !isGoogleFontAsset) return;

  event.respondWith(
    caches.match(request).then(function(cached) {
      if (cached) return cached;
      return fetch(request).then(function(response) {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(request, copy);
        });
        return response;
      });
    }).catch(function() {
      if (request.destination === "document") return caches.match("./offline.html");
      if (request.destination === "image") {
        return caches.match("./assets/icon-192.png");
      }
      return Response.error();
    })
  );
});
