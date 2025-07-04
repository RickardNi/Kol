// Service Worker for Kol PWA
const CACHE_NAME = 'kol-build-${BUILD_NUMBER}';
const BUILD_NUMBER = '${BUILD_NUMBER}';
const urlsToCache = [
  '/',
  '/css/app.css',
  '/Kol.styles.css',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.png'
];

// Skip service worker in development
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
  console.log('Development mode - skipping service worker');
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', () => self.registration.unregister());
} else {
  // Production service worker code
  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          console.log('Opened cache');
          return cache.addAll(urlsToCache);
        })
    );
  });

  self.addEventListener('fetch', (event) => {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          return response || fetch(event.request);
        }
      )
    );
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
  });

  // Handle messages from the main thread
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_BUILD_NUMBER') {
      event.ports[0].postMessage({ buildNumber: BUILD_NUMBER });
    }
  });
}
