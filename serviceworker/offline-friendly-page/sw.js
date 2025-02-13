const CACHE_NAME = "offline-cache-v2";
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/online.js",
    "/offline.js",
    "/script.js",
    "/style.css"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("📂 Caching important files...");
            return cache.addAll(FILES_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log("🗑️ Deleting old cache:", cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    if (!navigator.onLine) {
        if (event.request.url.includes("online.js")) {
            console.log("⚠️ No internet! Serving offline.js instead.");
            event.respondWith(caches.match("/offline.js"));
            return;
        }
    }

    event.respondWith(
        fetch(event.request).catch(() => {
            return caches.match(event.request);
        })
    );
});