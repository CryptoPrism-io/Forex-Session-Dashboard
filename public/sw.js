// Service Worker for Global FX Trading Sessions PWA

const CACHE_NAME = 'fx-sessions-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/Forex-Session-Dashboard/',
  '/Forex-Session-Dashboard/index.html',
  '/sw.js',
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch(() => {
        // Gracefully handle if some URLs fail
        console.log('Some resources failed to cache');
      });
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
const staticPattern = /\/assets\/.*\.(js|css)$/;

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  const fetchAndCache = async (request) => {
    const response = await fetch(request);
    if (response && response.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  };

  const shouldServeFromCacheFirst =
    staticPattern.test(url.pathname) || url.pathname.includes('sessionWorker');

  if (shouldServeFromCacheFirst) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetchAndCache(event.request).catch(() => cachedResponse);
      })
    );
    return;
  }

  event.respondWith(
    fetchAndCache(event.request).catch(() =>
      caches.match(event.request).then((cachedResponse) => cachedResponse || new Response('Offline', { status: 503 }))
    )
  );
});
