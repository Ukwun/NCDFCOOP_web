/**
 * Service Worker - Offline Support & Cache Management
 * 
 * Week 3 Implementation: Caching Layer
 * 
 * Caches:
 * - App shell (HTML, CSS, JS) - Cache first
 * - Images - Cache first with network fallback
 * - API responses - Network first with cache fallback
 * - Static assets - Cache only
 */

const CACHE_NAME = 'ncdfcoop-v1';
const RUNTIME_CACHE = 'ncdfcoop-runtime-v1';
const IMAGE_CACHE = 'ncdfcoop-images-v1';

/**
 * Install event - Cache app shell and essential resources
 */
self.addEventListener('install', (event: any) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache app shell
      return cache.addAll([
        '/',
        '/app',
      ]);
    })
  );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event: any) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== IMAGE_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

/**
 * Fetch event - Implement caching strategies
 */
self.addEventListener('fetch', (event: any) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external domains (tracked via analytics, etc)
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Strategy 1: Cache first for static assets
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        });
      })
    );
    return;
  }

  // Strategy 2: Cache first for images
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });

            return response;
          })
        );
      })
    );
    return;
  }

  // Strategy 3: Network first for API calls with cache fallback
  if (url.pathname.includes('/api/') || url.pathname.includes('firestore')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((response) => {
            return (
              response ||
              new Response(
                JSON.stringify({
                  error: 'offline',
                  message: 'You are offline. Some data may be outdated.',
                }),
                {
                  status: 503,
                  statusText: 'Service Unavailable',
                  headers: new Headers({
                    'Content-Type': 'application/json',
                  }),
                }
              )
            );
          });
        })
    );
    return;
  }

  // Strategy 4: Cache first, with network update in background
  event.respondWith(
    caches.match(request).then((response) => {
      // Return cache immediately
      if (response) {
        // Update cache in background
        fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, networkResponse);
            });
          }
        });

        return response;
      }

      // Cache miss, fetch from network
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

/**
 * Background sync for offline actions
 * (Optional: implement for user actions while offline)
 */
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Implement retry logic for failed requests
      Promise.resolve()
    );
  }
});

/**
 * Message handler for cache clearing, etc
 */
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(RUNTIME_CACHE);
    caches.delete(IMAGE_CACHE);
  }
});

console.log('✅ Service Worker installed - Week 3 Caching Ready');
