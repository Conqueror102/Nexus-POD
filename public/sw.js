const CACHE_NAME = 'nexus-pod-cache-v1';
const PRECACHE_URLS = [
  '/',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean up old caches
      const keys = await caches.keys();
      await Promise.all(
        keys.map(k => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
      await self.clients.claim();
    })()
  );
});

// Network-first for navigation requests, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Handle navigations (page refresh)
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, networkResponse.clone());
          return networkResponse;
        } catch (err) {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match('/');
          if (cached) return cached;
          // As a last resort, return an offline fallback response
          return new Response('<html><body><h1>Offline</h1><p>You appear to be offline.</p></body></html>', {
            headers: { 'Content-Type': 'text/html' },
          });
        }
      })()
    );
    return;
  }

  // For other same-origin requests (assets), try cache first
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((resp) => {
        // Cache fetched assets for future
        caches.open(CACHE_NAME).then((cache) => cache.put(request, resp.clone()));
        return resp;
      })).catch(() => cached || Promise.reject('no-match'))
    );
  }
});
