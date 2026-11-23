// İğne Ustası: hesap ve ilerleme eşitleme (Cloudflare Worker API)
'use strict';
const API_BASE = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? 'http://127.0.0.1:8787'
  : 'https://igne-ustasi-api.munaris.workers.dev';

// ACCOUNT: { id, username, guest, token, version, offline }  (cihazda saklanır; şifre asla saklanmaz)
let ACCOUNT = store.get('account', null);
const saveAccount = () => store.set('account', ACCOUNT);
let syncState = 'idle'; // 'idle' | 'saving' | 'offline' | 'error'

async function api(method, path, body, { token = ACCOUNT && ACCOUNT.token, timeout = 10000, keepalive = false } = {}) {
  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), timeout);
  try {
    const r = await fetch(API_BASE + path, {
      method, signal: ctl.signal, keepalive,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = {}; try { data = await r.json(); } catch {}
    return { status: r.status, data };
  } catch { return { status: 0, data: { error: 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.' } }; }
  finally { clearTimeout(timer); }
}

// Hesaba geçiş: o hesabın ilerlemesi yüklenir (yoksa cihazdaki eski kayıt ya da yeni başlangıç)
function adoptAccount(acc, serverProgress, version) {
  ACCOUNT = { id: acc.id, username: acc.username, guest: acc.guest, token: acc.token, version: version || 0, offline: !!acc.offline };
  saveAccount();
  if (serverProgress) P = normalizeProgress(serverProgress);
  else P = normalizeProgress(store.get('p2_' + ACCOUNT.id, null) || takeLegacyProgress() || null);
  store.set('p2_' + ACCOUNT.id, P);
  viewChapter = maxOpenChapter();
}

// ---------- girişler ----------
async function startGuest() {
  const seed = takeLegacyProgress(true); // cihazdaki eski oyun varsa misafir hesabına taşınır
  const r = await api('POST', '/api/guest', { progress: seed || undefined }, { token: null });
  if (r.status === 200) { adoptAccount({ ...r.data.user, token: r.data.token }, r.data.progress || seed, r.data.version); return { ok: true }; }
  if (r.status === 0) { // internet yoksa cihazda misafir aç, bağlantı gelince sunucuya taşınır
    adoptAccount({ id: 'local-' + Math.random().toString(36).slice(2, 10), username: null, guest: true, token: null, offline: true }, seed, 0);
    return { ok: true, offline: true };
  }
  return { ok: false, error: r.data.error || 'Misafir hesabı açılamadı' };
}
// Giriş/kayıt/çıkış sırasında arka plan kaydını durdurur, süren kaydın bitmesini bekler
async function exclusive(fn) {
  clearTimeout(pushTimer); authBusy = true;
  while (pushing) await new Promise((r) => setTimeout(r, 50));
  try { return await fn(); } finally { authBusy = false; }
}
const register = (u, p) => exclusive(() => registerImpl(u, p));
const login = (u, p) => exclusive(() => loginImpl(u, p));
const logout = () => exclusive(() => logoutImpl());
async function registerImpl(username, password) {
  if (ACCOUNT && ACCOUNT.guest) { await ensureServerGuest(); await pushProgress(true, false, true); }
  const token = ACCOUNT && ACCOUNT.guest && !ACCOUNT.offline ? ACCOUNT.token : null;
  // hesapsız açılan yeni hesapta cihazdaki eski oyun kaydı da gönderilir (sunucu sınırlı kabul eder)
  const seed = token ? undefined : (takeLegacyProgress(false) || undefined);
  const r = await api('POST', '/api/register', { username, password, acceptTerms: true, progress: seed }, { token });
  if (r.status !== 200) return { ok: false, error: r.data.error || 'Kayıt olunamadı' };
  if (seed) takeLegacyProgress(true);
  const keep = ACCOUNT && ACCOUNT.guest ? P : null; // misafirden yükseltmede ilerleme aynen kalır
  adoptAccount({ ...r.data.user, token: r.data.token }, r.data.progress || keep, r.data.version);
  if (!r.data.progress) await pushProgress(true, false, true);
  return { ok: true };
}
async function loginImpl(username, password) {
  const r = await api('POST', '/api/login', { username, password }, { token: null });
  if (r.status !== 200) return { ok: false, error: r.data.error || 'Giriş yapılamadı' };
  adoptAccount({ ...r.data.user, token: r.data.token }, r.data.progress, r.data.version);
  if (!r.data.progress) { P = normalizeProgress(null); store.set('p2_' + ACCOUNT.id, P); await pushProgress(true, false, true); }
  return { ok: true };
}
async function logoutImpl() {
  if (ACCOUNT && ACCOUNT.token) { await pushProgress(true, false, true); await api('POST', '/api/logout'); }
  ACCOUNT = null; saveAccount(); P = normalizeProgress(null);
}
const deleteAccount = (pw) => exclusive(() => deleteAccountImpl(pw));
async function deleteAccountImpl(password) {
  if (!ACCOUNT) return { ok: false, error: 'Hesap yok' };
  if (!ACCOUNT.offline) {
    const r = await api('DELETE', '/api/account', ACCOUNT.guest ? {} : { password });
    if (r.status !== 200) return { ok: false, error: r.data.error || 'Hesap silinemedi' };
  }
  try { localStorage.removeItem('igne_p2_' + ACCOUNT.id); } catch {}
  ACCOUNT = null; saveAccount(); P = normalizeProgress(null);
  return { ok: true };
}

// İnternetsiz açılmış misafiri sunucuya taşır
async function ensureServerGuest() {
  if (!ACCOUNT || !ACCOUNT.offline) return true;
  const r = await api('POST', '/api/guest', { progress: P }, { token: null });
  if (r.status !== 200) return false;
  const oldId = ACCOUNT.id;
  ACCOUNT = { id: r.data.user.id, username: null, guest: true, token: r.data.token, version: r.data.version || 0, offline: false };
  saveAccount(); store.set('p2_' + ACCOUNT.id, P);
  try { localStorage.removeItem('igne_p2_' + oldId); } catch {}
  return true;
}

// ---------- eşitleme ----------
let pushTimer = null, dirty = false, pushing = false;
function schedulePush() {
  dirty = true;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => pushProgress(), 1500);
}
let authBusy = false; // giriş/kayıt sürerken arka plan kaydı bekler (eski anahtarla gidip yeni hesabı kapatmasın)
async function pushProgress(force = false, keepalive = false, duringAuth = false) {
  if (!ACCOUNT || SIM || (!dirty && !force)) return;
  if (authBusy && !duringAuth) { schedulePush(); return; }
  if (pushing && !keepalive) { schedulePush(); return; }
  if (ACCOUNT.offline && !(await ensureServerGuest())) { syncState = 'offline'; retryLater(); return; }
  pushing = true; syncState = 'saving';
  const sentFor = ACCOUNT.id, sentToken = ACCOUNT.token;
  const r = await api('PUT', '/api/progress', { progress: P, baseVersion: ACCOUNT.version }, { keepalive, token: sentToken });
  pushing = false;
  // istek giderken hesap değiştiyse (giriş, kayıt, çıkış) bu yanıt artık geçersiz
  if (!ACCOUNT || ACCOUNT.id !== sentFor || ACCOUNT.token !== sentToken) return;
  if (r.status === 200) { ACCOUNT.version = r.data.version; saveAccount(); dirty = false; syncState = 'idle'; return; }
  if (r.status === 409) { // başka cihazda daha yeni ilerleme var: o yüklenir
    P = normalizeProgress(r.data.progress); ACCOUNT.version = r.data.version; saveAccount();
    store.set('p2_' + ACCOUNT.id, P); dirty = false; syncState = 'idle';
    if (typeof showToast === 'function') showToast('Başka cihazdaki daha yeni ilerleme yüklendi');
    return;
  }
  if (r.status === 401) { syncState = 'error'; ACCOUNT.token = null; saveAccount(); if (typeof sessionExpired === 'function') sessionExpired(); return; }
  if (r.status === 0 || r.status === 429 || r.status >= 500) { syncState = 'offline'; retryLater(); return; }
  if (r.status === 422) { // sunucu kaydı doğrulayamadı: sunucudaki son geçerli kayıt yüklenir
    console.warn('İlerleme reddedildi:', r.data.error);
    P = normalizeProgress(r.data.progress); ACCOUNT.version = r.data.version || ACCOUNT.version; saveAccount();
    store.set('p2_' + ACCOUNT.id, P); dirty = false; syncState = 'idle'; viewChapter = maxOpenChapter();
    if (typeof showToast === 'function') showToast('İlerleme doğrulanamadı, son geçerli kayıt yüklendi');
    return;
  }
  syncState = 'error'; console.warn('İlerleme kaydedilemedi:', r.data.error);
}
let retryTimer = null;
function retryLater() { clearTimeout(retryTimer); retryTimer = setTimeout(() => pushProgress(true), 20000); }
window.addEventListener('online', () => pushProgress(true));
document.addEventListener('visibilitychange', () => { if (document.hidden && dirty) pushProgress(true, true); });

// Açılışta sunucudaki ilerlemeyle karşılaştır (başka cihazda oynandıysa onu al)
async function refreshFromServer() {
  if (!ACCOUNT || ACCOUNT.offline || !ACCOUNT.token) { if (ACCOUNT && ACCOUNT.offline) pushProgress(true); return; }
  const r = await api('GET', '/api/me');
  if (r.status === 200) {
    ACCOUNT.username = r.data.user.username; ACCOUNT.guest = r.data.user.guest;
    if (r.data.version > ACCOUNT.version && r.data.progress) {
      P = normalizeProgress(r.data.progress); ACCOUNT.version = r.data.version;
      store.set('p2_' + ACCOUNT.id, P); viewChapter = maxOpenChapter();
    } else if (dirty || r.data.version < ACCOUNT.version || !r.data.progress) pushProgress(true);
    saveAccount();
  } else if (r.status === 401) { ACCOUNT.token = null; saveAccount(); if (typeof sessionExpired === 'function') sessionExpired(); }
}
