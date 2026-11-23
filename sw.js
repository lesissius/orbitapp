// Çevrimdışı oynama: oyun dosyaları ilk açılışta önbelleğe alınır.
// Oyun güncellenince VERSION'u artırın; eski önbellek silinir.
const VERSION = 'igne-v1';
const ASSETS = [
  './', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  ...['pin', 'pin_old', 'bomb', 'shield', 'star', 'sound', 'fx_boom', 'fx_ring', 'fx_spark', 'fx_gold', 'fx_metal', 'fx_glow',
    'orb1', 'orb2', 'orb3', 'orb4', 'orb5', 'orb6', 'boss1', 'boss2', 'boss3',
    'ui_pause', 'ui_play', 'ui_restart', 'ui_music', 'ui_vibe', 'ui_shake', 'ui_hand', 'ui_trophy'].map(n => `assets/${n}.png`),
  ...[1, 2, 3, 4, 5, 6].map(i => `assets/bg${i}.webp`),
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Sayfa için önce ağ (güncel sürüm), olmazsa önbellek; görseller için önce önbellek.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); return r; })
      .catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
