/* POWRA Service Worker
 * Cache-first strategy for full offline use.
 * Bump CACHE_VERSION whenever you change index.html, manifest.json, or sw.js
 * to force connected devices to pick up the new version.
 */

const CACHE_VERSION = 'powra-v2';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png'
];

// Install: pre-cache the core app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first, fall back to network, then cache the network response
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          // Only cache successful, basic (same-origin) responses
          if (
            response &&
            response.status === 200 &&
            response.type === 'basic'
          ) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          // Offline + not in cache: for navigation requests, return the cached index
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
