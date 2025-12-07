const CACHE_NAME = 'cdnai-v4';
const OFFLINE_URL = './index.html';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './throne-svgrepo-com.png',
  './chess pieces/w-prince.png',
  './chess pieces/w-guardian.png',
  './chess pieces/w-knight.png',
  './chess pieces/w-archer.png',
  './chess pieces/w-pawn.png',
  './chess pieces/b-prince.png',
  './chess pieces/b-guardian.png',
  './chess pieces/b-knight.png',
  './chess pieces/b-archer.png',
  './chess pieces/b-pawn.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(ASSETS.map(u => cache.add(u)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k !== CACHE_NAME ? caches.delete(k) : null))).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'CLEAR_CACHE') {
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))));
    if (self.registration && self.registration.unregister) {
      self.registration.unregister();
    }
  }
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');
  if (isHTML) {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL).then(r => r || caches.match('./')))
    );
    return;
  }
  if (url.origin === location.origin) {
    event.respondWith(
      caches.match(req).then(res => res || fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy));
        return r;
      }).catch(() => caches.match(req)))
    );
  }
});
