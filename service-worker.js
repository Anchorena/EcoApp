const CACHE_NAME = 'ecoapp-v3-web-full-4';
const CORE_ASSETS = [
  './',
  './index.html',
  './styles.css',
  './config.js',
  './device-profiles.js',
  './app.js',
  './pwa-register.js',
  './logo.png',
  './firma.png',
  './segmentacion_referencia.jpg',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).catch(() => null));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(key => key === CACHE_NAME ? null : caches.delete(key))))
  );
  self.clients.claim();
});

function isCriticalRequest(request) {
  if (request.mode === 'navigate') return true;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return false;
  return /\/(?:index\.html|styles\.css|app\.js|config\.js|device-profiles\.js|pwa-register\.js)$/.test(url.pathname);
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  if (isCriticalRequest(event.request)) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => null);
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)).catch(() => null);
      return response;
    }).catch(() => cached))
  );
});
