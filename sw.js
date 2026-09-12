// ─── Cache version: auto-updated on every deploy ────────────────────────────
// Timestamp baked in at write/deploy time — changes on every deploy to bust
// old caches automatically. Update this string when you redeploy.
const CACHE_NAME = 'adsparkling-20260911-001';

// Assets that use stale-while-revalidate (cache-first with background refresh)
const STATIC_ASSETS = [
  './',
  './index.html',
  './galeria.html',
  './portal.html',
  './manifest.json',
  './assets/css/admin.css',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/i18n.js',
  './assets/js/portal.js',
  './assets/images/icon-192.svg',
  './assets/images/icon-512.svg',
  './assets/images/logo-color.svg',
  './assets/images/logo-white.svg'
];

// Routes that always try the network first (critical admin routes)
const NETWORK_FIRST_PATTERNS = [
  /\/admin\.html(\?.*)?$/,
  /\/assets\/js\/admin\.js(\?.*)?$/
];

// ─── Install: pre-cache static assets ───────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: purge ALL old caches ─────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: routing strategy ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  // Network-first for admin.html and admin.js
  const isNetworkFirst = NETWORK_FIRST_PATTERNS.some((p) => p.test(url));

  if (isNetworkFirst) {
    event.respondWith(networkFirst(event.request));
  } else {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});

// ─── Strategy: Network-first ─────────────────────────────────────────────────
// Try network; fall back to cache only if network fails.
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (_) {
    const cached = await caches.match(request);
    return (
      cached ||
      new Response('Offline – please reconnect.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain' }
      })
    );
  }
}

// ─── Strategy: Stale-while-revalidate ────────────────────────────────────────
// Serve from cache immediately; refresh cache in the background.
async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200) {
        caches.open(CACHE_NAME).then((cache) =>
          cache.put(request, networkResponse.clone())
        );
      }
      return networkResponse;
    })
    .catch(() => null);

  if (cached) return cached; // serve stale immediately, update in background

  // Nothing cached yet — wait for network
  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  // Last resort: offline fallback for navigation
  if (request.mode === 'navigate') {
    return caches.match('./index.html');
  }
}
