// Service worker: o app abre offline; o modelo de pose fica em cache depois do 1º uso.
const V = 'rj-v9';
const SHELL = ['/', '/index.html', '/style.css', '/app.js', '/jump-counter.js', '/celebration.js', '/config.js', '/boot.js', '/privacidade.html', '/manifest.webmanifest',
  '/icons/logo.png', '/icons/icon-192.png', '/icons/apple-touch-icon.png',
  '/vendor/fonts/big-shoulders-display-latin-900-normal.woff2', '/vendor/fonts/big-shoulders-display-latin-700-normal.woff2',
  '/vendor/fonts/dm-sans-latin-400-normal.woff2', '/vendor/fonts/dm-sans-latin-700-normal.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  const heavy = u.pathname.startsWith('/vendor/mediapipe') || u.pathname.startsWith('/model/');
  if (heavy) { // cache primeiro (arquivos grandes e que não mudam)
    e.respondWith(caches.open(V).then(async c => {
      const hit = await c.match(e.request); if (hit) return hit;
      const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r;
    }));
  } else { // rede primeiro, cache como reserva
    e.respondWith(fetch(e.request).then(r => { const k = r.clone(); caches.open(V).then(c => c.put(e.request, k)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html'))));
  }
});
