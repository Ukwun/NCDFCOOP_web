const CACHE_VERSION = 'coopx-install-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('ncdfcoop-') || (key.startsWith('coopx-') && key !== CACHE_VERSION))
          .map((key) => caches.delete(key)),
      ),
    ).then(() => self.clients.claim()),
  );
});

// Requests intentionally remain network-led. Authenticated commerce and
// payment responses must never be served from a stale offline cache.
self.addEventListener('fetch', () => undefined);
