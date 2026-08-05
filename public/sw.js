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
  const req = event.request;
  if (req.method !== 'GET') return;

  // Media đi THẲNG, không qua SW. Nhạc/sfx tải bằng range request (206);
  // service worker trả lời range không đúng cách — đặc biệt trên iOS/WebKit —
  // là <audio> câm lặng lẽ. Cache fallback bên dưới cũng chỉ biết trả bản 200
  // đầy đủ, sai với client đang xin một khúc giữa file.
  if (req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/\.(mp3|wav|ogg|m4a)$/i.test(url.pathname)) return;

  // Network first with cache fallback
  event.respondWith(
    fetch(req).catch(() =>
      caches.match(req).then((cached) => cached || Response.error())
    )
  );
});
