/* Planificador de Dieta · service worker
   Guarda la app en el teléfono para que abra sin internet.
   Estrategia: responde al instante con lo guardado y actualiza en segundo plano
   (los cambios nuevos aparecen la siguiente vez que abres la app). */
const VERSION = 'v7';
const CACHE = 'dieta-' + VERSION;
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./xlsx.full.min.js",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./fonts/plus-jakarta-sans-latin-400-normal.woff2",
  "./fonts/plus-jakarta-sans-latin-500-normal.woff2",
  "./fonts/plus-jakarta-sans-latin-600-normal.woff2",
  "./fonts/plus-jakarta-sans-latin-700-normal.woff2",
  "./fonts/plus-jakarta-sans-latin-800-normal.woff2"
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dieta-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const hit = await caches.match(req, { ignoreSearch: true });
    const refresh = fetch(req).then((res) => {
      if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(refresh); return hit; }
    const res = await refresh;
    if (res) return res;
    if (req.mode === 'navigate') { const home = await caches.match('./index.html'); if (home) return home; }
    return Response.error();
  })());
});
