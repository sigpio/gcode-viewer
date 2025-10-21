/// <reference lib="WebWorker" />

const CACHE_NAME = 'gcode-file-viewer-v1';
const ORIGIN = self.location.origin;
const BASE_URL = import.meta.env.BASE_URL;

const resolveAssetUrl = (path: string): string =>
  new URL(path, `${ORIGIN}${BASE_URL}`).toString();

const STATIC_ASSETS: string[] = [
  new URL(BASE_URL, ORIGIN).toString(),
  resolveAssetUrl('index.html'),
  resolveAssetUrl('manifest.json')
];

const sw = self as unknown as ServiceWorkerGlobalScope;

const isRequestCacheable = (request: Request): boolean =>
  request.method === 'GET' &&
  request.url.startsWith(ORIGIN) &&
  !request.url.includes('chrome-extension');

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
