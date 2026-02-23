// Development service worker – immediately unregisters itself so it
// does not interfere with hot-reload or debugger behaviour.
// The production build uses service-worker.published.js instead.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim().then(() => self.registration.unregister()));
