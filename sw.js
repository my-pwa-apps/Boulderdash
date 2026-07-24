// Service Worker for Boulder Dash PWA
// Provides offline support, caching, and performance optimization.

const DEBUG = false;
const CACHE_VERSION = 'boulderdash-v1.4.3';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const MAX_DYNAMIC_CACHE_SIZE = 50;

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css?v=1.4.3',
  './manifest.json',
  './public/icon.svg',
  './public/icon-192.svg',
  './public/icon-512.svg',
  './public/press-start-2p-latin.woff2',
  './public/screenshot-narrow.png',
  './public/screenshot-wide.png',
  './src/assets.js?v=1.4.3',
  './src/classic-levels.js?v=1.4.3',
  './src/constants.js?v=1.4.3',
  './src/firebase-config.js?v=1.4.3',
  './src/game.js?v=1.4.3',
  './src/level-generator.js?v=1.4.3',
  './src/physics.js?v=1.4.3',
  './src/sound.js?v=1.4.3',
  './src/touch-controls.js?v=1.4.3',
  './src/utils.js?v=1.4.3'
];

const STATIC_ASSET_URLS = new Set(
  STATIC_ASSETS.map((asset) => new URL(asset, self.registration.scope).href)
);

function log(...args) {
  if (DEBUG) console.log(...args);
}

self.addEventListener('install', (event) => {
  log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((name) => name.startsWith('boulderdash-') && name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  if (url.hostname.includes('firebase') && !url.hostname.includes('firebasejs')) {
    return;
  }

  if (STATIC_ASSET_URLS.has(request.url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);
    await cacheSuccessfulResponse(request, networkResponse);
    return networkResponse;
  } catch (error) {
    return unavailableResponse();
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    await cacheSuccessfulResponse(request, networkResponse);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || unavailableResponse();
  }
}

async function cacheSuccessfulResponse(request, response) {
  if (!response || response.status !== 200) return;

  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.put(request, response.clone());
  await limitCacheSize(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
}

async function limitCacheSize(cacheName, maxSize) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();

  if (keys.length <= maxSize) return;

  const deleteCount = keys.length - maxSize;
  await Promise.all(keys.slice(0, deleteCount).map((key) => cache.delete(key)));
}

function unavailableResponse() {
  return new Response('Offline - Content not available', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({ 'Content-Type': 'text/plain' })
  });
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data?.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      ))
    );
  }
});
