/// <reference lib="WebWorker" />

const CACHE_NAME = 'gcode-file-viewer-v1';
const STATIC_ASSETS: string[] = ['/', '/index.html', '/manifest.json'];

const sw = self as unknown as ServiceWorkerGlobalScope;

const isRequestCacheable = (request: Request): boolean =>
  request.method === 'GET' && !request.url.includes('chrome-extension');

const precache = async () => {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(STATIC_ASSETS);
};

sw.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(precache());
  void sw.skipWaiting();
});

sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
      void sw.clients.claim();
    })()
  );
});

sw.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  if (!isRequestCacheable(request)) {
    return;
  }
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
      } catch (error) {
        console.error('Network error while fetching resource', error);
        throw error;
      }
    })()
  );
});
