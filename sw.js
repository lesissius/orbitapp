// Çevrimdışı oynama: oyun dosyaları ilk açılışta önbelleğe alınır.
// Oyun güncellenince VERSION'u ve index.html içindeki ?v= sayısını artırın; eski önbellek silinir.
const VERSION = 'igne-v11';
const SPRITES = ['pin', 'pin_old', 'bomb', 'shield', 'star', 'sound', 'fx_boom', 'fx_ring', 'fx_spark', 'fx_gold', 'fx_metal', 'fx_glow',
  'orb1', 'orb2', 'orb3', 'orb4', 'orb5', 'orb6', 'boss1', 'boss2', 'boss3',
  'ui_pause', 'ui_play', 'ui_restart', 'ui_music', 'ui_vibe', 'ui_shake', 'ui_settings', 'ui_hand', 'ui_trophy', 'ui_home', 'logo',
  'bal_blue', 'bal_gold', 'bal_lock', 'bal_boss', 'bal_bonus', 'bal_timed', 'milestone', 'chest', 'coin',
  'sk_slow', 'sk_pins2', 'sk_time15', 'pack_s', 'pack_m', 'pack_l', 'shop', 'map', 'lock'];
const ASSETS = [
  './', 'index.html', 'privacy.html', 'privacy-en.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png',
  'js/core.js', 'js/i18n.js', 'js/net.js', 'js/play.js', 'js/render.js', 'js/screens.js', 'js/auth.js', 'js/main.js',
  ...SPRITES.map(n => `assets/${n}.png`),
  ...[1, 2, 3, 4, 5, 6].map(i => `assets/bg${i}.webp`),
  ...[1, 2, 3].map(i => `assets/map${i}.webp`),
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Sayfa ve kod için önce ağ (güncel sürüm), olmazsa önbellek; görseller için önce önbellek.
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const fresh = req.mode === 'navigate' || url.pathname.endsWith('.js') || url.pathname.endsWith('.html') || url.pathname.endsWith('/');
  if (fresh) {
    e.respondWith(fetch(req, { cache: 'no-cache' }).then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); } return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return r;
  })));
});
