/**
 * sw.js – Service Worker
 * Répteis da Caatinga – O Museu Vivo
 * Cache-first para assets estáticos, network-first para navegação.
 */

const CACHE     = 'repteis-v2';
const ARQUIVOS  = [
  '/',
  '/index.html',
  '/mapa.html',
  '/fase1.html',
  '/fase2.html',
  '/fase3.html',
  '/resultado.html',
  '/final.html',
  '/css/style.css',
  '/js/progresso.js',
  '/js/card.js',
  '/js/audio.js',
  '/js/snake.js',
  '/js/game-fase2.js',
  '/js/topdown.js',
  '/assets/juquinha.png',
  '/manifest.json',
];

/* ── Instalação: pré-cachear todos os arquivos ── */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(ARQUIVOS);
    })
  );
  self.skipWaiting();
});

/* ── Ativação: limpar caches antigos ── */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

/* ── Fetch: Cache-first para assets; network-first para navegação ── */
self.addEventListener('fetch', function (e) {
  const req = e.request;
  const url = new URL(req.url);

  /* Ignorar requests não-GET e de outras origens */
  if (req.method !== 'GET' || url.origin !== location.origin) return;

  /* Assets estáticos → cache-first */
  const isAsset = /\.(css|js|png|webp|jpg|jpeg|svg|ico|json|woff2?)$/.test(url.pathname);
  if (isAsset) {
    e.respondWith(
      caches.match(req).then(function (cached) {
        return cached || fetch(req).then(function (res) {
          const clone = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, clone); });
          return res;
        });
      })
    );
    return;
  }

  /* Navegação (HTML) → network-first com fallback ao cache */
  e.respondWith(
    fetch(req).then(function (res) {
      const clone = res.clone();
      caches.open(CACHE).then(function (c) { c.put(req, clone); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (cached) {
        return cached || caches.match('/index.html');
      });
    })
  );
});
