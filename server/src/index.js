// Orbitap hesap sunucusu (Cloudflare Worker + D1)
// Misafir hesabı, kullanıcı adı + şifre ile kayıt/giriş, ilerleme eşitleme, hesap silme, günlük temizlik.
// Güvenlik: PBKDF2 şifre özeti, oturum anahtarının yalnızca özeti, IP'nin yalnızca tuzlanmış özeti,
// istek sınırları, kullanıcı adı filtresi, ilerleme için yapı + sıra + değer + hız kontrolleri.

const ITERATIONS = 100_000;              // Workers'ın izin verdiği üst sınır
const SESSION_DAYS = 180;
const GUEST_INACTIVE_DAYS = 120;         // bu kadar gün girmeyen misafir silinir
const MAX_BODY = 64 * 1024, MAX_AUTH_BODY = 4 * 1024;
const MIN = 60_000, HOUR = 60 * MIN;
const LIMITS = {
  guest: { max: 15, win: HOUR },          // IP başına saatte misafir hesabı
  register: { max: 6, win: HOUR },        // IP başına saatte kayıt
  loginUserIp: { max: 8, win: 15 * MIN }, // IP + kullanıcı adı başına hatalı giriş
  loginUser: { max: 20, win: HOUR },      // kullanıcı adı başına hatalı giriş (IP değiştirerek deneme)
  loginIp: { max: 40, win: 15 * MIN },    // IP başına hatalı giriş (çok hesaba deneme)
  save: { max: 120, win: 10 * MIN },      // hesap başına kayıt sayısı
};

// ---------- oyun ekonomisi (js/core.js, js/play.js ile aynı) ----------
const STAR_GOLD = [0, 3, 8, 12];
const SKILL_VALUE = 85, COIN_GOLD = 2, BONUS_COINS = 6, BONUS_DONE_GOLD = 6, BONUS_GIFTS = 3;
const milestoneReward = (c) => ({ gold: 20 + c * 5, skills: 3 + (c % 3 === 0 ? 2 : 0) });
const milestoneReq = (c) => Math.min(22, 14 + c);
const bonusIsGold = (c) => c % 2 === 1;
const MAX_CHAPTER = 500;
const SEEN_KEYS = ['stars', 'timed', 'bomb', 'shield', 'coin', 'drift', 'bonus_gold', 'bonus_skill'];
const DEFAULT_PROGRESS = () => ({ stars: {}, bonus: {}, ms: {}, coins: {}, gold: 0, skills: { slow: 0, pins2: 2, time15: 0 }, seen: {}, tutorial: false, lastId: '1-1' });

// ---------- kullanıcı adı ve şifre kuralları ----------
const USERNAME_RE = /^[A-Za-z0-9_çğıöşüÇĞİÖŞÜ]{3,16}$/;
const TR_FOLD = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'i̇': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
// Benzersizlik için: küçük harf + Türkçe harfler sadeleşir ("Admın" = "admin")
const usernameKey = (u) => u.replace(/İ/g, 'i').replace(/I/g, 'i').toLowerCase().replace(/[çğıöşü]/g, (c) => TR_FOLD[c] || c);
// Filtre için daha gevşek: rakam benzeri harfler ve alt çizgi de sadeleşir ("4dm1n" = "admin")
const loose = (u) => usernameKey(u).replace(/_/g, '').replace(/0/g, 'o').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/7/g, 't');
const RESERVED_PARTS = ['admin', 'moderator', 'yonetici', 'destek', 'support', 'igneustasi', 'orbitap', 'resmi', 'official', 'gelistirici', 'developer', 'yetkili', 'sistem', 'system', 'anthropic', 'claude'];
const RESERVED_EXACT = ['mod', 'gm', 'root', 'staff', 'owner', 'kurucu', 'null', 'undefined', 'misafir', 'guest', 'igne', 'oyun'];
const BAD_PARTS = ['orospu', 'siktir', 'sikerim', 'sikik', 'yarrak', 'yarak', 'amcik', 'amina', 'anani', 'kahpe', 'pezevenk', 'ibne', 'gavat', 'fuck', 'shit', 'bitch', 'nigg', 'cunt', 'porn', 'hitler', 'nazi', 'whore', 'rape'];
const BAD_EXACT = ['amk', 'aq', 'sik', 'oc', 'pic', 'got', 'mk', 'dick', 'sex', 'kke', 'pkk', 'isid', 'isis'];
const COMMON_PASSWORDS = new Set(['123456', '1234567', '12345678', '123456789', '1234567890', '111111', '000000', '123123', '654321', '112233', '121212',
  'qwerty', 'qwerty123', '123qwe', 'qweasd', 'asdasd', 'asdfgh', 'password', 'password1', 'abc123', '1q2w3e', '1q2w3e4r', 'iloveyou', 'aaaaaa',
  'sifre', 'sifre123', 'şifre', 'parola', 'parola123', 'galatasaray', 'fenerbahce', 'besiktas', 'trabzonspor', 'istanbul', 'ankara', 'turkiye']);

function checkUsername(u) {
  if (typeof u !== 'string' || !USERNAME_RE.test(u)) return 'Kullanıcı adı 3–16 karakter olmalı: harf, rakam ve alt çizgi';
  const l = loose(u);
  if (RESERVED_EXACT.includes(l) || RESERVED_PARTS.some((w) => l.includes(w))) return 'Bu kullanıcı adı kullanılamaz';
  if (BAD_EXACT.includes(l) || BAD_PARTS.some((w) => l.includes(w))) return 'Bu kullanıcı adı uygun değil';
  return null;
}
function checkPassword(p, u) {
  if (typeof p !== 'string' || p.length < 6 || p.length > 72) return 'Şifre 6–72 karakter olmalı';
  const low = p.toLowerCase();
  if (COMMON_PASSWORDS.has(low) || /^(.)\1+$/.test(p) || /^\d{1,7}$/.test(p)) return 'Bu şifre çok kolay tahmin edilir, başka bir şifre seç';
  if (u && low.includes(usernameKey(u))) return 'Şifre kullanıcı adını içermesin';
  return null;
}

// ---------- kripto ----------
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const randomToken = () => b64(crypto.getRandomValues(new Uint8Array(32))).replace(/[+/=]/g, (c) => ({ '+': '-', '/': '_', '=': '' }[c]));
const sha256 = async (s) => b64(await crypto.subtle.digest('SHA-256', enc.encode(s)));
const now = () => Date.now();
async function pbkdf2(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return b64(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations }, key, 256));
}
async function hashPassword(password) {
  const salt = b64(crypto.getRandomValues(new Uint8Array(16)));
  return { hash: `${ITERATIONS}:${await pbkdf2(password, salt, ITERATIONS)}`, salt };
}
async function verifyPassword(password, stored, salt) {
  const [iterStr, expected] = String(stored || '').split(':');
  const iterations = Number(iterStr);
  if (!expected || !Number.isInteger(iterations)) return false;
  const got = await pbkdf2(password, salt, iterations);
  if (got.length !== expected.length) return false;
  let diff = 0; for (let i = 0; i < got.length; i++) diff |= got.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}
// Olmayan kullanıcı adında da aynı süre harcanır (süreden kullanıcı adı anlaşılmasın)
const DUMMY = { hash: `${ITERATIONS}:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=`, salt: 'sahte-tuz' };

// ---------- yardımcılar ----------
function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || 'null',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
const SEC_HEADERS = { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer', 'X-Frame-Options': 'DENY' };
const json = (req, env, status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...SEC_HEADERS, ...cors(req, env) } });
// Hata kodları: oyun mesajı oyuncunun dilinde gösterir (error alanı Türkçe yedek)
const MSG_CODES = {
  'Kullanıcı adı 3–16 karakter olmalı: harf, rakam ve alt çizgi': 'username_format', 'Bu kullanıcı adı kullanılamaz': 'username_reserved',
  'Bu kullanıcı adı uygun değil': 'username_bad', 'Şifre 6–72 karakter olmalı': 'password_length',
  'Bu şifre çok kolay tahmin edilir, başka bir şifre seç': 'password_common', 'Şifre kullanıcı adını içermesin': 'password_username',
  'Kullanım şartlarını ve gizlilik politikasını kabul etmelisin': 'terms', 'Bu kullanıcı adı alınmış': 'username_taken',
  'Kullanıcı adı ya da şifre yanlış': 'bad_login', 'Şifre yanlış': 'bad_password', 'Oturum geçersiz, tekrar giriş yap': 'session', 'Sunucu hatası': 'server',
};
const codeFor = (m) => MSG_CODES[m] || (/^Çok (fazla|sık)/.test(m) ? 'rate' : undefined);
const fail = (req, env, status, message, extra = {}) => json(req, env, status, { error: message, code: codeFor(message), ...extra });
async function readJson(req, max) {
  const raw = await req.text();
  if (raw.length > max) return { __tooBig: true };
  try { const v = JSON.parse(raw || '{}'); return v && typeof v === 'object' ? v : {}; } catch { return {}; }
}
const ipHash = async (req, env) => (await sha256((req.headers.get('CF-Connecting-IP') || 'yerel') + '|' + (env.IP_SALT || 'yerel-tuz'))).slice(0, 22);

async function limited(env, key, rule) { // sınır aşıldı mı (sayacı artırmadan)
  const row = await env.DB.prepare('SELECT count, window_start FROM rate_limits WHERE key = ?').bind(key).first();
  return !!row && now() - row.window_start < rule.win && row.count >= rule.max;
}
async function bump(env, key, rule) {
  const t = now();
  await env.DB.prepare(`INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET
      count = CASE WHEN ? - window_start >= ? THEN 1 ELSE count + 1 END,
      window_start = CASE WHEN ? - window_start >= ? THEN ? ELSE window_start END`).bind(key, t, t, rule.win, t, rule.win, t).run();
}

async function createSession(env, userId) {
  const token = randomToken(), t = now();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), userId, t, t + SESSION_DAYS * 86400000).run();
  return token;
}
async function authUser(req, env) {
  const m = /^Bearer\s+([A-Za-z0-9_-]{20,80})$/.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  return await env.DB.prepare('SELECT u.id, u.username, u.is_guest, u.created_at, s.token_hash FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
    .bind(await sha256(m[1]), now()).first() || null;
}
const publicUser = (u) => ({ id: u.id, username: u.username || null, guest: !!u.is_guest });
async function getProgress(env, userId) {
  const row = await env.DB.prepare('SELECT data, version, updated_at FROM progress WHERE user_id = ?').bind(userId).first();
  return row ? { progress: JSON.parse(row.data), version: row.version, updatedAt: row.updated_at } : { progress: null, version: 0, updatedAt: 0 };
}

// ---------- ilerleme kontrolü ----------
// 1) Biçim: yalnızca bilinen alanlar ve türler saklanır (keyfi veri gömülemez)
function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'İlerleme verisi yok' };
  const p = DEFAULT_PROGRESS();
  const levelId = /^(\d{1,3})-(10|[1-9])$/, bonusId = /^(\d{1,3})-B$/;
  const okChapter = (c) => c >= 1 && c <= MAX_CHAPTER;
  for (const [id, s] of Object.entries(raw.stars || {})) {
    const m = levelId.exec(id); if (!m || !okChapter(+m[1]) || !Number.isInteger(s) || s < 1 || s > 3) return { error: 'Geçersiz yıldız kaydı' };
    p.stars[id] = s;
  }
  for (const [id, v] of Object.entries(raw.bonus || {})) {
    const m = bonusId.exec(id); if (!m || !okChapter(+m[1])) return { error: 'Geçersiz bonus kaydı' };
    if (v) p.bonus[id] = true;
  }
  for (const [c, v] of Object.entries(raw.ms || {})) {
    if (!/^\d{1,3}$/.test(c) || !okChapter(+c)) return { error: 'Geçersiz mihenk taşı kaydı' };
    if (v) p.ms[c] = true;
  }
  for (const [id, v] of Object.entries(raw.coins || {})) {
    const lm = levelId.exec(id), bm = bonusId.exec(id);
    if (!(lm && okChapter(+lm[1]) && v === 1) && !(bm && okChapter(+bm[1]) && Number.isInteger(v) && v >= 0 && v <= BONUS_COINS)) return { error: 'Geçersiz para kaydı' };
    p.coins[id] = v;
  }
  const sk = raw.skills || {};
  p.gold = raw.gold; p.skills = { slow: sk.slow || 0, pins2: sk.pins2 || 0, time15: sk.time15 || 0 };
  if ([p.gold, p.skills.slow, p.skills.pins2, p.skills.time15].some((n) => !Number.isInteger(n) || n < 0 || n > 1e7)) return { error: 'Geçersiz altın ya da joker sayısı' };
  for (const k of SEEN_KEYS) if (raw.seen && raw.seen[k]) p.seen[k] = true;
  p.tutorial = !!raw.tutorial;
  if (typeof raw.lastId === 'string' && (levelId.test(raw.lastId) || bonusId.test(raw.lastId) || /^M\d{1,3}$/.test(raw.lastId))) p.lastId = raw.lastId;
  return { p };
}
// 2) Sıra: kilitli bölüm, kısım, bonus ya da mihenk taşı kaydedilemez
const chapterStars = (p, c) => { let s = 0; for (let i = 1; i <= 10; i++) s += p.stars[`${c}-${i}`] || 0; return s; };
const chapterOpen = (p, c) => c === 1 || !!p.ms[c - 1];
function checkOrder(p) {
  for (const id of Object.keys(p.stars)) {
    const [c, i] = id.split('-').map(Number);
    if (!chapterOpen(p, c) || (i > 1 && !p.stars[`${c}-${i - 1}`])) return 'Kilitli bölüm kaydedilemez';
  }
  for (const c of Object.keys(p.ms).map(Number)) if (!p.stars[`${c}-10`] || chapterStars(p, c) < milestoneReq(c) || !chapterOpen(p, c)) return 'Mihenk taşı koşulu sağlanmamış';
  for (const id of Object.keys(p.bonus)) { const c = parseInt(id, 10); if (!p.stars[`${c}-5`]) return 'Kilitli bonus kaydedilemez'; }
  for (const [id, v] of Object.entries(p.coins)) {
    const c = parseInt(id, 10);
    if (id.endsWith('-B')) { if (!p.bonus[id] || !bonusIsGold(c)) return 'Geçersiz bonus parası'; }
    else { const i = Number(id.split('-')[1]); if (!chapterOpen(p, c) || (i > 1 && !p.stars[`${c}-${i - 1}`])) return 'Kilitli bölümün parası kaydedilemez'; }
  }
  return null;
}
// 3) Değer: altın + jokerler, oyunda kazanılabilecek en yüksek değeri aşamaz
function earned(p) {
  let gold = 0, skills = 2; // yeni oyuncuya 2 adet +2 İğne
  for (const s of Object.values(p.stars)) gold += STAR_GOLD[s];
  for (const [id, v] of Object.entries(p.coins)) gold += id.endsWith('-B') ? v * COIN_GOLD : COIN_GOLD;
  for (const id of Object.keys(p.bonus)) { if (bonusIsGold(parseInt(id, 10))) gold += BONUS_DONE_GOLD; else skills += BONUS_GIFTS; }
  for (const c of Object.keys(p.ms).map(Number)) { const r = milestoneReward(c); gold += r.gold; skills += r.skills; }
  return { gold, skills, value: gold + skills * SKILL_VALUE };
}
const skillCount = (p) => p.skills.slow + p.skills.pins2 + p.skills.time15;
const valueOf = (p) => p.gold + skillCount(p) * SKILL_VALUE;
const clearedCount = (p) => Object.keys(p.stars).length + Object.keys(p.bonus).length + Object.keys(p.ms).length;

// Yeni ilerlemeyi bir öncekine göre kontrol eder. seed: ilk hesapta cihazdan gelen eski kayıt.
function validateProgress(raw, prev, { guest, elapsedMs, seed }) {
  const s = sanitize(raw); if (s.error) return { error: s.error };
  const p = s.p, before = prev || DEFAULT_PROGRESS();
  const order = checkOrder(p); if (order) return { error: order };
  const e1 = earned(p), e0 = earned(before);
  if (valueOf(p) > e1.value + 2) return { error: 'İlerleme doğrulanamadı' };
  if (valueOf(p) - valueOf(before) > e1.value - e0.value + 2) return { error: 'İlerleme doğrulanamadı' };
  // misafir satın alma yapamaz: jokerleri ancak oyunun verdiği kadar artabilir
  if (guest && skillCount(p) - skillCount(before) > e1.skills - e0.skills) return { error: 'Misafir hesapla satın alma yapılamaz' };
  if (seed) { if (clearedCount(p) > 45) return { error: 'İlerleme doğrulanamadı' }; return { p }; }
  // hız: bir bölüm en az birkaç saniye sürer; kısa sürede çok bölüm geçilmiş görünemez
  const fresh = clearedCount(p) - clearedCount(before);
  if (fresh > 3 + Math.floor(Math.max(0, elapsedMs) / 4000)) return { error: 'İlerleme çok hızlı, doğrulanamadı' };
  return { p };
}

// ---------- uç noktalar ----------
async function route(req, env) {
  const url = new URL(req.url), path = url.pathname, method = req.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...SEC_HEADERS, ...cors(req, env) } });
  if (path === '/api/health') return json(req, env, 200, { ok: true });

  if (path === '/api/guest' && method === 'POST') {
    const ip = 'g|' + await ipHash(req, env);
    if (await limited(env, ip, LIMITS.guest)) return fail(req, env, 429, 'Çok fazla misafir hesabı açıldı. Biraz sonra tekrar dene');
    await bump(env, ip, LIMITS.guest);
    const body = await readJson(req, MAX_BODY); if (body.__tooBig) return fail(req, env, 413, 'Veri çok büyük');
    const id = crypto.randomUUID(), t = now();
    await env.DB.prepare('INSERT INTO users (id, is_guest, created_at, updated_at) VALUES (?, 1, ?, ?)').bind(id, t, t).run();
    let version = 0;
    if (body.progress) { // cihazdaki eski kayıt (sınırlı) misafir hesabına taşınır
      const v = validateProgress(body.progress, null, { guest: true, seed: true });
      if (v.p) { await env.DB.prepare('INSERT INTO progress (user_id, data, version, updated_at) VALUES (?, ?, 1, ?)').bind(id, JSON.stringify(v.p), t).run(); version = 1; }
    }
    const token = await createSession(env, id);
    const pr = await getProgress(env, id);
    return json(req, env, 200, { token, user: { id, username: null, guest: true }, progress: pr.progress, version });
  }

  if (path === '/api/register' && method === 'POST') {
    const ip = 'r|' + await ipHash(req, env);
    if (await limited(env, ip, LIMITS.register)) return fail(req, env, 429, 'Çok fazla kayıt denemesi. Biraz sonra tekrar dene');
    const body = await readJson(req, MAX_BODY); if (body.__tooBig) return fail(req, env, 413, 'Veri çok büyük');
    const { username, password } = body;
    const bad = checkUsername(username) || checkPassword(password, username); if (bad) return fail(req, env, 400, bad);
    if (!body.acceptTerms) return fail(req, env, 400, 'Kullanım şartlarını ve gizlilik politikasını kabul etmelisin');
    const key = usernameKey(username);
    if (await env.DB.prepare('SELECT 1 FROM users WHERE username_key = ?').bind(key).first()) return fail(req, env, 409, 'Bu kullanıcı adı alınmış');
    await bump(env, ip, LIMITS.register);
    const { hash, salt } = await hashPassword(password), t = now();
    const me = await authUser(req, env);
    let id;
    try {
      if (me && me.is_guest) { // misafir yükseltilir: ilerleme aynen kalır
        id = me.id;
        await env.DB.prepare('UPDATE users SET username = ?, username_key = ?, pass_hash = ?, pass_salt = ?, is_guest = 0, updated_at = ? WHERE id = ?').bind(username, key, hash, salt, t, id).run();
        await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
      } else {
        id = crypto.randomUUID();
        await env.DB.prepare('INSERT INTO users (id, username, username_key, pass_hash, pass_salt, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?)').bind(id, username, key, hash, salt, t, t).run();
        if (body.progress) {
          const v = validateProgress(body.progress, null, { guest: false, seed: true });
          if (v.p) await env.DB.prepare('INSERT INTO progress (user_id, data, version, updated_at) VALUES (?, ?, 1, ?)').bind(id, JSON.stringify(v.p), t).run();
        }
      }
    } catch (e) {
      if (String(e).includes('UNIQUE')) return fail(req, env, 409, 'Bu kullanıcı adı alınmış');
      throw e;
    }
    const token = await createSession(env, id);
    const pr = await getProgress(env, id);
    return json(req, env, 200, { token, user: { id, username, guest: false }, progress: pr.progress, version: pr.version });
  }

  if (path === '/api/login' && method === 'POST') {
    const body = await readJson(req, MAX_AUTH_BODY); if (body.__tooBig) return fail(req, env, 413, 'Veri çok büyük');
    const { username, password } = body;
    if (typeof username !== 'string' || typeof password !== 'string' || username.length > 32 || password.length > 72) return fail(req, env, 400, 'Kullanıcı adı ve şifre gerekli');
    const ip = await ipHash(req, env), key = usernameKey(username);
    const kUI = `lu|${ip}|${key}`, kU = `l|${key}`, kI = `li|${ip}`;
    if (await limited(env, kUI, LIMITS.loginUserIp) || await limited(env, kU, LIMITS.loginUser) || await limited(env, kI, LIMITS.loginIp))
      return fail(req, env, 429, 'Çok fazla hatalı deneme. Biraz sonra tekrar dene');
    const u = await env.DB.prepare('SELECT id, username, pass_hash, pass_salt, is_guest FROM users WHERE username_key = ? AND is_guest = 0').bind(key).first();
    const ok = u ? await verifyPassword(password, u.pass_hash, u.pass_salt) : (await verifyPassword(password, DUMMY.hash, DUMMY.salt), false);
    if (!ok) {
      await Promise.all([bump(env, kUI, LIMITS.loginUserIp), bump(env, kU, LIMITS.loginUser), bump(env, kI, LIMITS.loginIp)]);
      return fail(req, env, 401, 'Kullanıcı adı ya da şifre yanlış');
    }
    await env.DB.prepare('DELETE FROM rate_limits WHERE key = ?').bind(kUI).run();
    await env.DB.prepare('UPDATE users SET updated_at = ? WHERE id = ?').bind(now(), u.id).run();
    const token = await createSession(env, u.id);
    const pr = await getProgress(env, u.id);
    return json(req, env, 200, { token, user: publicUser(u), progress: pr.progress, version: pr.version });
  }

  // Buradan sonrası oturum ister
  const me = await authUser(req, env);
  if (!me) return fail(req, env, 401, 'Oturum geçersiz, tekrar giriş yap');

  if (path === '/api/me' && method === 'GET') {
    const pr = await getProgress(env, me.id);
    return json(req, env, 200, { user: publicUser(me), progress: pr.progress, version: pr.version });
  }

  if (path === '/api/progress' && method === 'PUT') {
    const kS = `s|${me.id}`;
    if (await limited(env, kS, LIMITS.save)) return fail(req, env, 429, 'Çok sık kayıt. Biraz sonra tekrar denenecek');
    await bump(env, kS, LIMITS.save);
    const body = await readJson(req, MAX_BODY); if (body.__tooBig) return fail(req, env, 413, 'İlerleme verisi çok büyük');
    const cur = await getProgress(env, me.id);
    if (Number(body.baseVersion || 0) < cur.version) return fail(req, env, 409, 'Başka bir cihazda daha yeni ilerleme var', { progress: cur.progress, version: cur.version });
    const elapsedMs = now() - (cur.updatedAt || me.created_at);
    const v = validateProgress(body.progress, cur.progress, { guest: !!me.is_guest, elapsedMs });
    if (v.error) return fail(req, env, 422, v.error, { progress: cur.progress, version: cur.version });
    const version = cur.version + 1, t = now();
    await env.DB.batch([
      env.DB.prepare('INSERT INTO progress (user_id, data, version, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, version = excluded.version, updated_at = excluded.updated_at')
        .bind(me.id, JSON.stringify(v.p), version, t),
      env.DB.prepare('UPDATE users SET updated_at = ? WHERE id = ?').bind(t, me.id),
    ]);
    return json(req, env, 200, { version });
  }

  if (path === '/api/logout' && method === 'POST') {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(me.token_hash).run();
    return json(req, env, 200, { ok: true });
  }

  // Hesap silme (mağaza kuralı): kayıtlı hesapta şifre istenir; tüm veriler silinir
  if (path === '/api/account' && method === 'DELETE') {
    if (!me.is_guest) {
      const { password } = await readJson(req, MAX_AUTH_BODY);
      const kD = `d|${me.id}`;
      if (await limited(env, kD, LIMITS.loginUserIp)) return fail(req, env, 429, 'Çok fazla hatalı deneme. Biraz sonra tekrar dene');
      const u = await env.DB.prepare('SELECT pass_hash, pass_salt FROM users WHERE id = ?').bind(me.id).first();
      if (!u || typeof password !== 'string' || !(await verifyPassword(password, u.pass_hash, u.pass_salt))) { await bump(env, kD, LIMITS.loginUserIp); return fail(req, env, 401, 'Şifre yanlış'); }
    }
    await env.DB.batch([
      env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(me.id),
      env.DB.prepare('DELETE FROM progress WHERE user_id = ?').bind(me.id),
      env.DB.prepare('DELETE FROM users WHERE id = ?').bind(me.id),
    ]);
    return json(req, env, 200, { ok: true });
  }

  return fail(req, env, 404, 'Bulunamadı');
}

// Günlük temizlik: süresi dolan oturumlar, eski sayaçlar, uzun süre girmeyen misafirler
async function cleanup(env) {
  const t = now(), cutoff = t - GUEST_INACTIVE_DAYS * 86400000;
  await env.DB.batch([
    env.DB.prepare('DELETE FROM sessions WHERE expires_at < ?').bind(t),
    env.DB.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(t - 2 * 86400000),
    env.DB.prepare('DELETE FROM progress WHERE user_id IN (SELECT id FROM users WHERE is_guest = 1 AND updated_at < ?)').bind(cutoff),
    env.DB.prepare('DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE is_guest = 1 AND updated_at < ?)').bind(cutoff),
    env.DB.prepare('DELETE FROM users WHERE is_guest = 1 AND updated_at < ?').bind(cutoff),
  ]);
}

export default {
  async fetch(req, env) {
    try { return await route(req, env); }
    catch (e) { console.error(e); return fail(req, env, 500, 'Sunucu hatası'); }
  },
  async scheduled(event, env, ctx) { ctx.waitUntil(cleanup(env)); },
};
