/* eslint-disable no-undef */
// Use importScripts to load Workbox from CDN to avoid bundling issues with Vite in static folder
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log(`Workbox is loaded`);
  
  workbox.setConfig({ debug: false });
  
  const { clientsClaim } = workbox.core;
  const { cleanupOutdatedCaches, precacheAndRoute } = workbox.precaching;
  const { registerRoute } = workbox.routing;
  const { StaleWhileRevalidate, NetworkFirst, CacheFirst } = workbox.strategies;
  const { ExpirationPlugin } = workbox.expiration;

  self.skipWaiting();
  clientsClaim();

  // Cleanup old caches
  cleanupOutdatedCaches();

  // Cache static assets (styles, scripts, images)
  registerRoute(
    ({ request }) => request.destination === 'style' || request.destination === 'script' || request.destination === 'worker',
    new StaleWhileRevalidate({
      cacheName: 'assets',
      plugins: [
        new ExpirationPlugin({ maxEntries: 50 }),
      ],
    })
  );

  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'images',
      plugins: [
        new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 }), // 30 Days
      ],
    })
  );

  // Cache navigation routes - Network First for freshness, fall back to cache
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    new NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
    })
  );

  // Background Sync logic placeholder
  // Real background sync requires the Workbox BackgroundSync plugin
  // For now, we rely on the app's online event listener to trigger sync
  
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

} else {
  console.log(`Workbox didn't load`);
  
  // Fallback simple Service Worker if Workbox fails
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', () => self.clients.claim());
}