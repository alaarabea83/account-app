const CACHE_NAME = "sahl-cache-v1";

const urlsToCache = [
  "/",
  "/index.html",
  "/css/style.css",
  "/js/data.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png"
];

// تثبيت Service Worker
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// تشغيل الكاش عند الطلب
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
