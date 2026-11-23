// İğne Ustası hesap sunucusu (Cloudflare Worker + D1)
// Misafir hesabı, kullanıcı adı + şifre ile kayıt/giriş, ilerleme eşitleme, hesap silme.
// Şifreler PBKDF2-SHA256 ile tuzlanıp özetlenir; oturum anahtarlarının yalnızca SHA-256 özeti saklanır.

const ITERATIONS = 100_000;              // Workers'ın izin verdiği üst sınır
const SESSION_DAYS = 180;
const MAX_PROGRESS_BYTES = 64 * 1024;
const LOGIN_MAX_FAILS = 8, LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Oyundaki ekonomiyle aynı değerler (js/core.js, js/play.js)
const STAR_GOLD = [0, 3, 8, 12];
const SKILL_VALUE = 85;
const COIN_PER_LEVEL = 2;
const START_SKILLS = 2;                  // yeni oyuncuya 2 adet +2 İğne
const milestoneReward = (c) => ({ gold: 20 + c * 5, skills: 3 + (c % 3 === 0 ? 2 : 0) });
const BONUS_GOLD_MAX = 2 * 6 + 6, BONUS_GIFTS_MAX = 3;

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

// ---------- yardımcılar ----------
function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = String(env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim());
  return {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
}
const json = (req, env, status, body) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(req, env) } });
const fail = (req, env, status, message, extra = {}) => json(req, env, status, { error: message, ...extra });
async function readJson(req) { try { return await req.json(); } catch { return {}; } }

const USERNAME_RE = /^[A-Za-z0-9_çğıöşüÇĞİÖŞÜ]{3,16}$/;
function checkCredentials(username, password) {
  if (typeof username !== 'string' || !USERNAME_RE.test(username)) return 'Kullanıcı adı 3–16 karakter olmalı: harf, rakam ve alt çizgi';
  if (typeof password !== 'string' || password.length < 6 || password.length > 72) return 'Şifre 6–72 karakter olmalı';
  return null;
}

async function createSession(env, userId) {
  const token = randomToken(), t = now();
  await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), userId, t, t + SESSION_DAYS * 86400000).run();
  return token;
}
async function authUser(req, env) {
  const m = /^Bearer\s+(.+)$/.exec(req.headers.get('Authorization') || '');
  if (!m) return null;
  const row = await env.DB.prepare('SELECT u.id, u.username, u.is_guest, s.token_hash FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?')
    .bind(await sha256(m[1]), now()).first();
  return row || null;
}
const publicUser = (u) => ({ id: u.id, username: u.username || null, guest: !!u.is_guest });
async function getProgress(env, userId) {
  const row = await env.DB.prepare('SELECT data, version FROM progress WHERE user_id = ?').bind(userId).first();
  return row ? { progress: JSON.parse(row.data), version: row.version } : { progress: null, version: 0 };
}

// İlerleme kontrolü: biçim ve hile sınırı. Altın + jokerlerin değeri, oyunda kazanılabilecek en yüksek değeri aşamaz.
function validateProgress(p) {
  if (!p || typeof p !== 'object') return 'İlerleme verisi yok';
  const stars = p.stars || {}, bonus = p.bonus || {}, ms = p.ms || {}, skills = p.skills || {};
  let earned = START_SKILLS * SKILL_VALUE, levels = 0;
  for (const [id, s] of Object.entries(stars)) {
    if (!/^\d{1,3}-(10|[1-9])$/.test(id) || !Number.isInteger(s) || s < 1 || s > 3) return 'Geçersiz yıldız kaydı';
    earned += STAR_GOLD[s] + COIN_PER_LEVEL; levels++;
  }
  for (const [c, v] of Object.entries(ms)) {
    if (!v) continue;
    const ci = Number(c);
    if (!Number.isInteger(ci) || ci < 1 || ci > 999) return 'Geçersiz mihenk taşı kaydı';
    const r = milestoneReward(ci); earned += r.gold + r.skills * SKILL_VALUE;
  }
  for (const [id, v] of Object.entries(bonus)) {
    if (!v) continue;
    const m = /^(\d{1,3})-B$/.exec(id); if (!m) return 'Geçersiz bonus kaydı';
    earned += Number(m[1]) % 2 ? BONUS_GOLD_MAX : BONUS_GIFTS_MAX * SKILL_VALUE;
  }
  const nums = [p.gold, skills.slow || 0, skills.pins2 || 0, skills.time15 || 0];
  if (nums.some((n) => !Number.isInteger(n) || n < 0 || n > 1e7)) return 'Geçersiz altın ya da joker sayısı';
  const value = p.gold + SKILL_VALUE * (nums[1] + nums[2] + nums[3]);
  if (value > earned + 20) return 'İlerleme doğrulanamadı';
  return null;
}

// ---------- uç noktalar ----------
async function route(req, env) {
  const url = new URL(req.url), path = url.pathname, method = req.method;
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req, env) });

  if (path === '/api/health') return json(req, env, 200, { ok: true });

  // Misafir: kayıt olmadan oyna, ilerleme yine sunucuda tutulur
  if (path === '/api/guest' && method === 'POST') {
    const body = await readJson(req), id = crypto.randomUUID(), t = now();
    await env.DB.prepare('INSERT INTO users (id, is_guest, created_at, updated_at) VALUES (?, 1, ?, ?)').bind(id, t, t).run();
    let version = 0;
    if (body.progress && !validateProgress(body.progress)) {
      await env.DB.prepare('INSERT INTO progress (user_id, data, version, updated_at) VALUES (?, ?, 1, ?)').bind(id, JSON.stringify(body.progress), t).run();
      version = 1;
    }
    const token = await createSession(env, id);
    return json(req, env, 200, { token, user: { id, username: null, guest: true }, ...(await getProgress(env, id)), version });
  }

  // Kayıt: misafir oturumuyla gelinirse aynı hesap yükseltilir, ilerleme aynen kalır
  if (path === '/api/register' && method === 'POST') {
    const { username, password } = await readJson(req);
    const bad = checkCredentials(username, password); if (bad) return fail(req, env, 400, bad);
    const taken = await env.DB.prepare('SELECT 1 FROM users WHERE username = ?').bind(username).first();
    if (taken) return fail(req, env, 409, 'Bu kullanıcı adı alınmış');
    const { hash, salt } = await hashPassword(password), t = now();
    const me = await authUser(req, env);
    let id;
    if (me && me.is_guest) {
      id = me.id;
      await env.DB.prepare('UPDATE users SET username = ?, pass_hash = ?, pass_salt = ?, is_guest = 0, updated_at = ? WHERE id = ?').bind(username, hash, salt, t, id).run();
      await env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(id).run();
    } else {
      id = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO users (id, username, pass_hash, pass_salt, is_guest, created_at, updated_at) VALUES (?, ?, ?, ?, 0, ?, ?)').bind(id, username, hash, salt, t, t).run();
    }
    const token = await createSession(env, id);
    return json(req, env, 200, { token, user: { id, username, guest: false }, ...(await getProgress(env, id)) });
  }

  if (path === '/api/login' && method === 'POST') {
    const { username, password } = await readJson(req);
    if (typeof username !== 'string' || typeof password !== 'string') return fail(req, env, 400, 'Kullanıcı adı ve şifre gerekli');
    const key = `${req.headers.get('CF-Connecting-IP') || 'yerel'}|${username.toLowerCase()}`, t = now();
    const att = await env.DB.prepare('SELECT count, window_start FROM login_attempts WHERE key = ?').bind(key).first();
    if (att && t - att.window_start < LOGIN_WINDOW_MS && att.count >= LOGIN_MAX_FAILS) return fail(req, env, 429, 'Çok fazla hatalı deneme. 15 dakika sonra tekrar dene');
    const u = await env.DB.prepare('SELECT id, username, pass_hash, pass_salt, is_guest FROM users WHERE username = ? AND is_guest = 0').bind(username).first();
    const ok = u && await verifyPassword(password, u.pass_hash, u.pass_salt);
    if (!ok) {
      const fresh = !att || t - att.window_start >= LOGIN_WINDOW_MS;
      await env.DB.prepare('INSERT INTO login_attempts (key, count, window_start) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = CASE WHEN ? THEN 1 ELSE count + 1 END, window_start = CASE WHEN ? THEN ? ELSE window_start END')
        .bind(key, t, fresh ? 1 : 0, fresh ? 1 : 0, t).run();
      return fail(req, env, 401, 'Kullanıcı adı ya da şifre yanlış');
    }
    await env.DB.prepare('DELETE FROM login_attempts WHERE key = ?').bind(key).run();
    const token = await createSession(env, u.id);
    return json(req, env, 200, { token, user: publicUser(u), ...(await getProgress(env, u.id)) });
  }

  // Buradan sonrası oturum ister
  const me = await authUser(req, env);
  if (!me) return fail(req, env, 401, 'Oturum geçersiz, tekrar giriş yap');

  if (path === '/api/me' && method === 'GET') return json(req, env, 200, { user: publicUser(me), ...(await getProgress(env, me.id)) });

  if (path === '/api/progress' && method === 'PUT') {
    const raw = await req.text();
    if (raw.length > MAX_PROGRESS_BYTES) return fail(req, env, 413, 'İlerleme verisi çok büyük');
    let body; try { body = JSON.parse(raw); } catch { return fail(req, env, 400, 'Geçersiz veri'); }
    const bad = validateProgress(body.progress); if (bad) return fail(req, env, 422, bad);
    const cur = await getProgress(env, me.id);
    if (Number(body.baseVersion || 0) < cur.version) return fail(req, env, 409, 'Başka bir cihazda daha yeni ilerleme var', cur);
    const version = cur.version + 1, t = now();
    await env.DB.prepare('INSERT INTO progress (user_id, data, version, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, version = excluded.version, updated_at = excluded.updated_at')
      .bind(me.id, JSON.stringify(body.progress), version, t).run();
    return json(req, env, 200, { version });
  }

  if (path === '/api/logout' && method === 'POST') {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(me.token_hash).run();
    return json(req, env, 200, { ok: true });
  }

  // Hesap silme (mağaza kuralı): kayıtlı hesapta şifre istenir; tüm veriler silinir
  if (path === '/api/account' && method === 'DELETE') {
    if (!me.is_guest) {
      const { password } = await readJson(req);
      const u = await env.DB.prepare('SELECT pass_hash, pass_salt FROM users WHERE id = ?').bind(me.id).first();
      if (!u || typeof password !== 'string' || !(await verifyPassword(password, u.pass_hash, u.pass_salt))) return fail(req, env, 401, 'Şifre yanlış');
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

export default {
  async fetch(req, env) {
    try { return await route(req, env); }
    catch (e) { console.error(e); return fail(req, env, 500, 'Sunucu hatası'); }
  },
};
