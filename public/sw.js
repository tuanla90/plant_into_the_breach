// Service Worker for Plant Heroes: Blightfall PWA
//
// MỌI đường dẫn ở đây phải TƯƠNG ĐỐI (./...), không được bắt đầu bằng "/".
// Site deploy dưới đường dẫn con (https://<user>.github.io/<repo>/), nên "/index.html"
// trỏ về gốc domain — 404 — và cache.addAll() reject làm service worker không bao giờ
// cài được. Đường dẫn tương đối được phân giải theo vị trí file sw.js nên đúng ở cả
// localhost lẫn GitHub Pages.
const CACHE_NAME = 'blightfall-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './favicon.svg',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Network first with cache fallback
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then((cached) => cached || Response.error())
    )
  );
});
