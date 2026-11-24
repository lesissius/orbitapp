// Orbitapp: çekirdek (kayıt, ayarlar, ses, görseller, bölüm kataloğu, ilerleme, seviye üretimi)
'use strict';
const TAU = Math.PI * 2;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let W = 0, H = 0, DPR = 1;
let cx, cy, R, L, EMB, HEAD, LAUNCH_Y, GAP;
let SAFE = { top: 0, bottom: 0, left: 0, right: 0 };
const FONT = 'system-ui,-apple-system,Segoe UI,sans-serif';
let SIM = false; // test botu çalışırken ses, titreşim ve kayıt kapalı

// ---------- kayıt ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('igne_' + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { if (SIM) return; try { localStorage.setItem('igne_' + k, JSON.stringify(v)); } catch {} }
};

// ---------- ayarlar ----------
const settings = Object.assign({ sound: true, music: true, vibe: true, shake: true }, store.get('settings', {}));
let muted = !settings.sound;
const saveSettings = () => { muted = !settings.sound; store.set('settings', settings); musicUpdate(); };

// ---------- bölüm kataloğu ----------
// Her kısım: 10 bölüm, 5. bölümden sonra bir bonus bölüm, sonunda boss (x-10) ve mihenk taşı.
const LEVELS_PER_CHAPTER = 10;
const PINS_NORMAL = 12, STARS_NORMAL = [5, 8, 10];
const PINS_BOSS = 14, STARS_BOSS = [6, 9, 12];
const PINS_BONUS = 15;
const isTimed = (c, i) => i === 4 || i === 8;
const timeLimit = (d) => Math.round(clamp(34 - d * 1.6, 20, 32)); // zorluğa göre süre (saniye)
const milestoneReq = (c) => Math.min(22, 14 + c);           // kısım içindeki 30 yıldızdan gereken
const milestoneReward = (c) => {                             // mihenk taşı ödülü
  const r = { gold: 20 + c * 5, slow: 1, pins2: 1, time15: 1 };
  if (c % 3 === 0) { r.pins2 += 1; r.slow += 1; }
  return r;
};
const bonusType = (c) => (c % 2 ? 'gold' : 'skill');

function chapterNodes(c) {
  const out = [];
  for (let i = 1; i <= LEVELS_PER_CHAPTER; i++) {
    out.push({ kind: i === 10 ? 'boss' : isTimed(c, i) ? 'timed' : 'level', c, i, id: `${c}-${i}` });
    if (i === 5) out.push({ kind: 'bonus', c, id: `${c}-B`, btype: bonusType(c) });
  }
  out.push({ kind: 'milestone', c, id: `M${c}` });
  return out;
}

// ---------- ilerleme ----------
// coins: toplanan altın paralar (bölümde 1 kez, bonusta en fazla 6) — sunucu altını bunlardan doğrular
const DEFAULT_PROGRESS = { stars: {}, bonus: {}, ms: {}, coins: {}, gold: 0, skills: { slow: 0, pins2: 2, time15: 0 }, seen: {}, tutorial: false, lastId: '1-1' };
// Altın + jokerlerin değeri, oyunda kazanılabilecek en yüksek değeri aşamaz (sunucu da aynı kontrolü yapar).
const STAR_GOLD = [0, 3, 8, 12], SKILL_VALUE = 85, COIN_GOLD = 2;
function earnedValue(p) {
  let v = 2 * SKILL_VALUE;
  for (const s of Object.values(p.stars)) v += STAR_GOLD[s] || 0;
  for (const [id, n] of Object.entries(p.coins)) v += id.endsWith('-B') ? n * COIN_GOLD : COIN_GOLD;
  for (const [c, ok] of Object.entries(p.ms)) if (ok) { const r = milestoneReward(Number(c)); v += r.gold + (r.slow + r.pins2 + r.time15) * SKILL_VALUE; }
  for (const [id, ok] of Object.entries(p.bonus)) if (ok) v += parseInt(id, 10) % 2 ? 6 : 3 * SKILL_VALUE;
  return v;
}
function normalizeProgress(raw) {
  const p = Object.assign(JSON.parse(JSON.stringify(DEFAULT_PROGRESS)), raw || {});
  p.skills = Object.assign({ slow: 0, pins2: 0, time15: 0 }, p.skills);
  for (const k of ['stars', 'bonus', 'ms', 'seen', 'coins']) if (!p[k] || typeof p[k] !== 'object') p[k] = {};
  p.gold = Math.max(0, Math.floor(p.gold || 0));
  // eski sürümlerin cömert ekonomisinden kalan fazlalık kırpılır (önce altın, sonra jokerler)
  let over = p.gold + SKILL_VALUE * (p.skills.slow + p.skills.pins2 + p.skills.time15) - earnedValue(p);
  if (over > 0) { const g = Math.min(p.gold, over); p.gold -= g; over -= g; }
  for (const k of ['slow', 'time15', 'pins2']) while (over > 0 && p.skills[k] > 0) { p.skills[k]--; over -= SKILL_VALUE; }
  return p;
}
// Cihazda hesapsız dönemden kalan ilerleme (ilk açılan hesaba bir kez taşınır)
function takeLegacyProgress(remove = true) {
  let p = store.get('p2', null);
  if (!p) {
    const oldBest = store.get('best', 1), oldStars = store.get('stars', {});
    if (oldBest > 1) {
      p = { stars: {}, tutorial: true };
      for (let n = 1; n < oldBest; n++) { const c = Math.floor((n - 1) / 10) + 1, i = (n - 1) % 10 + 1; p.stars[`${c}-${i}`] = Math.max(1, Math.min(3, oldStars[n] || 1)); }
    }
  }
  if (remove) try { for (const k of ['p2', 'best', 'level', 'stars', 'lives', 'seen']) localStorage.removeItem('igne_' + k); } catch {}
  return p ? normalizeProgress(p) : null;
}
let P = normalizeProgress(null);
const saveProgress = () => {
  if (SIM || typeof ACCOUNT === 'undefined' || !ACCOUNT) return;
  store.set('p2_' + ACCOUNT.id, P);
  schedulePush();
};

const starsOf = (id) => P.stars[id] || 0;
const chapterStars = (c) => { let s = 0; for (let i = 1; i <= 10; i++) s += starsOf(`${c}-${i}`); return s; };
const totalStars = () => Object.values(P.stars).reduce((s, v) => s + v, 0);
const chapterOpen = (c) => c === 1 || !!P.ms[c - 1];
function nodeUnlocked(node) {
  if (!chapterOpen(node.c)) return false;
  if (node.kind === 'milestone') return starsOf(`${node.c}-10`) > 0;
  if (node.kind === 'bonus') return starsOf(`${node.c}-5`) > 0;
  if (node.i === 1) return true;
  return starsOf(`${node.c}-${node.i - 1}`) > 0;
}
const maxOpenChapter = () => { let c = 1; while (P.ms[c] && c < MAX_CHAPTER) c++; return c; };
function nextPlayable() { // haritada ilk oynanmamış açık bölüm
  const c = maxOpenChapter();
  for (const nd of chapterNodes(c)) if (nd.kind !== 'bonus' && nd.kind !== 'milestone' && nodeUnlocked(nd) && !starsOf(nd.id)) return nd;
  return chapterNodes(c).find(nd => nd.kind === 'milestone');
}
function findNode(id) {
  const c = parseInt(id.replace(/^M/, ''), 10);
  return chapterNodes(c).find(nd => nd.id === id);
}
function nextNodeAfter(id) {
  const nd = findNode(id); if (!nd) return null;
  const list = chapterNodes(nd.c), k = list.findIndex(x => x.id === id);
  for (let j = k + 1; j < list.length; j++) if (list[j].kind !== 'bonus') return list[j];
  return null;
}

// ---------- ses ----------
let actx = null;
function audio() {
  if (muted || SIM) return null;
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function tone(freq, dur, type = 'sine', vol = 0.15, slideTo = null, delay = 0) {
  const a = audio(); if (!a) return;
  const t0 = a.currentTime + delay;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(dur, vol = 0.3, freq = 800) {
  const a = audio(); if (!a) return;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = a.createBufferSource(); s.buffer = buf;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const g = a.createGain(); g.gain.value = vol;
  s.connect(f).connect(g).connect(a.destination); s.start();
}
const vibrate = (p) => { if (settings.vibe && !SIM && navigator.vibrate) { try { navigator.vibrate(p); } catch {} } };
const sfx = {
  throw() { tone(900, 0.06, 'triangle', 0.05, 1500); },
  stick(i) { tone(320 + i * 22, 0.09, 'square', 0.06, 180); vibrate(8); },
  shield() { tone(1400, 0.25, 'triangle', 0.1, 700); tone(2100, 0.2, 'sine', 0.05, 1200); vibrate([10, 30, 10]); },
  clash() { tone(260, 0.25, 'sawtooth', 0.1, 90); vibrate(60); },
  fail() { tone(220, 0.4, 'sawtooth', 0.12, 70); vibrate(120); },
  boom() { noise(0.6, 0.5, 600); tone(90, 0.5, 'sine', 0.3, 30); vibrate([60, 40, 140]); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, null, i * 0.08)); vibrate([15, 40, 15]); },
  coin() { [1318, 1760].forEach((f, i) => tone(f, 0.1, 'triangle', 0.08, null, i * 0.05)); },
  skill() { tone(660, 0.12, 'sine', 0.1, 990); tone(990, 0.2, 'triangle', 0.06, 1480, 0.08); vibrate(20); },
  click() { tone(700, 0.04, 'triangle', 0.05); },
  tick() { tone(1200, 0.03, 'square', 0.03); },
};

// ---------- müzik: temaya göre değişen akor ve arpej (WebAudio ile üretilir) ----------
const PROGS = [
  [[220, 277, 330], [196, 247, 294], [175, 220, 262], [196, 247, 330]],
  [[262, 330, 392], [220, 262, 330], [175, 220, 262], [196, 247, 294]],
  [[233, 294, 349], [208, 262, 311], [196, 233, 294], [175, 220, 262]],
  [[247, 311, 370], [220, 277, 330], [185, 233, 277], [208, 262, 311]],
  [[196, 247, 294], [165, 196, 247], [131, 165, 196], [147, 185, 220]],
  [[220, 262, 330], [175, 220, 262], [196, 247, 294], [165, 208, 247]],
];
const BOSS_PROG = [[110, 131, 165], [104, 131, 156], [98, 117, 147], [104, 123, 156]];
let musicGain = null, musicTimer = null, musicBar = 0, musicNext = 0;
function musicUpdate() {
  const want = settings.music && settings.sound && screen !== 'title' && !paused && !document.hidden && !SIM;
  if (want && !musicTimer) {
    const a = audio(); if (!a) return;
    if (!musicGain) { musicGain = a.createGain(); musicGain.gain.value = 0; musicGain.connect(a.destination); }
    musicGain.gain.setTargetAtTime(0.5, a.currentTime, 0.5);
    musicNext = a.currentTime + 0.1;
    musicTimer = setInterval(musicTick, 200);
    musicTick();
  } else if (!want && musicTimer) {
    clearInterval(musicTimer); musicTimer = null;
    if (musicGain && actx) musicGain.gain.setTargetAtTime(0, actx.currentTime, 0.15);
  }
}
function musicNote(f, t0, dur, type, vol, attack) {
  const o = actx.createOscillator(), g = actx.createGain(), fl = actx.createBiquadFilter();
  o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 1400;
  g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(fl).connect(g).connect(musicGain); o.start(t0); o.stop(t0 + dur + 0.05);
}
function musicTick() {
  if (!actx || !musicGain) return;
  const boss = screen === 'play' && lv && lv.boss;
  const bar = boss ? 1.6 : 2.4;
  while (musicNext < actx.currentTime + 0.6) {
    const prog = boss ? BOSS_PROG : PROGS[themeIndex() % PROGS.length];
    const chord = prog[musicBar % prog.length];
    for (const f of chord) musicNote(f, musicNext, bar * 1.05, 'triangle', 0.025, bar * 0.35);
    musicNote(chord[0] / 2, musicNext, bar, 'sine', 0.05, 0.05);
    const steps = boss ? 8 : 6;
    for (let i = 0; i < steps; i++) {
      const f = chord[(i * 2 + musicBar) % 3] * (i % 2 ? 2 : 4) / (boss ? 2 : 1);
      musicNote(f, musicNext + i * bar / steps, 0.35, boss ? 'square' : 'sine', boss ? 0.008 : 0.014, 0.01);
    }
    musicNext += bar; musicBar++;
  }
}

// ---------- temalar ----------
// 20 kısım, her birinin kendi küresi, arka planı ve canlıları var.
// inner: küre içinde dönen parçacık, back: arka plan parçacığı, cast: arka planda hareket eden canlılar [sprite, adet, davranış, boy]
const MAX_CHAPTER = 20;
const T = (c0, c1, accent, inner, innerC, back, backC, cast = [], extra = {}) => ({ bg: [c0, c1], orb: [accent, c1], pin: '#fff', accent, glow: accent, inner, innerC, back, backC, cast, ...extra });
const THEMES = [
  T('#3a1d40', '#140a1c', '#ffb347', 'spark', '#fff3b0', 'mote', '#ffd27a', [['bee', 3, 'fly', 0.3], ['butterfly_o', 2, 'flutter', 0.3]]),
  T('#0f3a44', '#06131c', '#38f0d8', 'bubble', '#e8fffb', 'bubble', '#bff9ef', [['fish', 4, 'swim', 0.3], ['seagull', 2, 'fly', 0.36]]),
  T('#4a1640', '#1c0718', '#ff86d9', 'puff', '#ffe3f6', 'petal', '#ffc2ea', [['cloud', 3, 'drift', 0.8], ['balloon', 2, 'rise', 0.36]]),
  T('#1f3a10', '#0b1205', '#8dff5a', 'firefly', '#f4ff8a', 'firefly', '#f4ff8a', [['butterfly_b', 3, 'flutter', 0.3], ['leaf', 6, 'fall', 0.18]]),
  T('#141c4a', '#05081c', '#8a96ff', 'star', '#ffffff', 'star', '#dfe4ff', [['planet', 2, 'drift', 0.4], ['comet', 2, 'streak', 0.6]]),
  T('#3a1014', '#100506', '#ff4d6d', 'glint', '#ffe0e6', 'ember', '#ff9a6b', [['phoenix', 2, 'fly', 0.45], ['shard', 4, 'float', 0.22]]),
  T('#4a1a3a', '#1c0a18', '#ff7ac8', 'spark', '#ffffff', 'confetti', '#ffffff', [['balloon', 2, 'rise', 0.36], ['cloud', 2, 'drift', 0.7]]),
  T('#1a3550', '#081422', '#9fe6ff', 'glint', '#ffffff', 'snow', '#ffffff', []),
  T('#2a2a55', '#10102a', '#ffd86b', 'spark', '#ffffff', 'confetti', '#ffffff', [['butterfly_o', 2, 'flutter', 0.3], ['balloon', 1, 'rise', 0.36], ['cloud', 2, 'drift', 0.7]]),
  T('#4a3010', '#1a1005', '#ffc14d', 'spark', '#fff1c0', 'mote', '#ffe0a0', [['seagull', 2, 'fly', 0.32]]),
  T('#3a1508', '#120502', '#ff7a2a', 'glint', '#ffd0a0', 'ember', '#ffae5a', [['phoenix', 2, 'fly', 0.42]]),
  T('#2a1440', '#0e0618', '#7dffd8', 'firefly', '#b8fff0', 'firefly', '#ffd08a', [['butterfly_b', 2, 'flutter', 0.28]]),
  T('#3a2810', '#140d05', '#ffb35c', 'glint', '#fff0c8', 'mote', '#ffd9a0', [['balloon', 2, 'rise', 0.34]]),
  T('#0f3440', '#051218', '#ffd34d', 'bubble', '#fff6d0', 'bubble', '#d8fff6', [['seagull', 2, 'fly', 0.34], ['fish', 2, 'swim', 0.28]]),
  T('#3a2038', '#140a14', '#ffa8d8', 'puff', '#fff0f8', 'petal', '#ffc8e4', [['butterfly_o', 2, 'flutter', 0.28], ['butterfly_b', 1, 'flutter', 0.28]]),
  T('#262a44', '#0c0d18', '#ffe14d', 'glint', '#fff8b0', 'rain', '#c8d8ff', [['cloud', 3, 'drift', 0.8]], { storm: true }),
  T('#081a3a', '#020814', '#ff6fd8', 'bubble', '#9ff7ff', 'bubble', '#9ff7ff', [['fish', 3, 'swim', 0.26]]),
  T('#16283a', '#060c14', '#4df0ff', 'glint', '#c8ffff', 'mote', '#7ff4ff', []),
  T('#141a40', '#050618', '#c88cff', 'star', '#ffffff', 'snow', '#ffffff', [['comet', 1, 'streak', 0.6]]),
  T('#4a3008', '#1a1002', '#ffd23d', 'spark', '#fffbe0', 'mote', '#fff0a0', [['phoenix', 1, 'fly', 0.5]]),
];
const chapterName = (c) => t('ch' + ((c - 1) % MAX_CHAPTER + 1));
let viewChapter = 1; // haritada bakılan kısım
const themeIndex = () => ((screen === 'play' && lv ? lv.c : viewChapter) - 1) % THEMES.length;
const theme = () => THEMES[themeIndex()];

// ---------- görseller (GPT çizimleri; yüklenemezse çizimle yedeklenir) ----------
const IMG = {};
const SPRITES = ['arrow', 'arrow_old', 'bomb', 'shield', 'star', 'sound', 'fx_boom', 'fx_ring', 'fx_spark', 'fx_gold', 'fx_metal', 'fx_glow',
  'boss1', 'boss2', 'boss3',
  'ui_pause', 'ui_play', 'ui_restart', 'ui_music', 'ui_vibe', 'ui_shake', 'ui_settings', 'ui_hand', 'ui_trophy', 'ui_home', 'logo',
  'bal_blue', 'bal_gold', 'bal_lock', 'bal_boss', 'bal_bonus', 'bal_timed', 'milestone', 'chest', 'coin',
  'sk_slow', 'sk_pins2', 'sk_time15', 'pack_s', 'pack_m', 'pack_l', 'shop', 'map', 'lock'];
// Görsel sürümü: bir görsel değişince artırılır (sw.js içindeki ASSET_V ile aynı), önbellek eski görseli vermez
const ASSET_V = 14;
const loadImg = (key, src) => { if (IMG[key] || IMG[key] === null) return; IMG[key] = null; const im = new Image(); im.onload = () => { IMG[key] = im; }; im.src = `${src}?v=${ASSET_V}`; };
for (const n of SPRITES) loadImg(n, `assets/${n}.png`);
for (let i = 1; i <= 3; i++) loadImg('map' + i, `assets/map${i}.webp`);
// kısım görselleri (küre + arka plan) gerektiğinde yüklenir: oynanan kısım ve bir sonraki
function needChapterArt(c) {
  for (const k of [c, c + 1]) { if (k < 1 || k > MAX_CHAPTER) continue; loadImg('orb' + k, `assets/orb${k}.png`); loadImg('bg' + k, `assets/bg${k}.webp`); }
}
needChapterArt(1);

// ---------- yardımcılar ----------
function mulberry32(a) {
  return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const norm = (a) => ((a % TAU) + TAU) % TAU;
const angDiff = (a, b) => { const d = Math.abs(norm(a) - norm(b)); return Math.min(d, TAU - d); };
const inArc = (a, z) => norm(a - z.start) <= z.width;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- seviye üretimi ----------
const BOSSES = [
  { get name() { return t('boss1'); }, aura: '#ff6a1a' },
  { get name() { return t('boss2'); }, aura: '#ff2a3a' },
  { get name() { return t('boss3'); }, aura: '#9b5cff' },
];
const SKILL_INFO = {
  slow: { get name() { return t('sk_slow'); }, get desc() { return t('sk_slow_d'); }, icon: 'sk_slow', price: 85 },
  pins2: { get name() { return t('sk_pins2'); }, get desc() { return t('sk_pins2_d'); }, icon: 'sk_pins2', price: 85 },
  time15: { get name() { return t('sk_time15'); }, get desc() { return t('sk_time15_d'); }, icon: 'sk_time15', price: 85 },
};

// node → oynanabilir seviye tanımı (her cihazda aynı üretilir)
// Zorluk 1–10 ölçeğinde ve kısım içinde artar: kısmın ilk bölümü rahat, boss en zoru.
// Sonraki kısım yine aşağıdan başlar; tepe noktası kısımdan kısma yavaşça yükselir ama 8.5'te durur
// (oyun çocuklar ve vakit geçirmek isteyenler için: hiçbir zaman çok zor olmaz).
function difficulty(c, i) {
  const start = Math.min(1 + (c - 1) * 0.75, 4), peak = Math.min(5.5 + (c - 1) * 0.5, 8.5);
  return start + (peak - start) * (clamp(i, 1, 10) - 1) / 9;
}
// Zorluğu üretecin eski "seviye numarası" ölçeğine çevirir (d=1 → 1, d=8.5 → ≈50)
const diffToN = (d) => 1 + (d - 1) * 6.5;

function makeLevel(node) {
  if (node.kind === 'bonus') return makeBonus(node);
  const c = node.c, i = node.i, seed = (c - 1) * 10 + i;
  const rnd = mulberry32(seed * 9973 + 17);
  const d = difficulty(c, i), n = diffToN(d);
  const lv = { n, d, c, i, id: node.id, kind: node.kind };
  const boss = node.kind === 'boss';
  lv.pinsTotal = boss ? PINS_BOSS : PINS_NORMAL;
  lv.thresholds = boss ? STARS_BOSS : STARS_NORMAL;
  lv.timeLimit = node.kind === 'timed' ? timeLimit(d) : 0;
  lv.speed = Math.min(1.0 + n * 0.03, 2.7);
  lv.dir = rnd() < 0.5 ? 1 : -1;
  const pats = n < 4 ? ['steady'] : n < 9 ? ['steady', 'reverse', 'wave'] : ['steady', 'reverse', 'wave', 'pulse', 'reverse', 'wave'];
  lv.pattern = pats[Math.floor(rnd() * pats.length)];
  lv.period = 1.6 + rnd() * 2.2;

  // bölgeler
  lv.zones = [];
  const bombs = n >= 5 ? Math.min(1 + Math.floor((n - 5) / 15), 3) : 0;
  const shields = n >= 8 ? Math.min(1 + Math.floor((n - 8) / 20), 2) : 0;
  const want = [];
  for (let k = 0; k < bombs; k++) want.push({ type: 'bomb', width: 0.36 + rnd() * 0.12 });
  for (let k = 0; k < shields; k++) want.push({ type: 'shield', width: 0.4 + rnd() * 0.14 });
  for (const z of want) {
    for (let tr = 0; tr < 60; tr++) {
      const start = rnd() * TAU, mid = start + z.width / 2;
      if (lv.zones.every(o => angDiff(mid, o.start + o.width / 2) > (z.width + o.width) / 2 + 0.35)) { lv.zones.push({ ...z, start }); break; }
    }
  }
  // kapasite: 3 yıldız için gereken iğne + hazır iğneler küreye rahat sığmalı
  // iğne başına ayrılan açı = GAP × density; GAP daralınca density aynı oranda artar (zorluk değişmez)
  const density = Math.max(2.35, 3.4 - n * 0.02) * (0.1276 / GAP);
  let pre = n < 2 ? 0 : Math.min(Math.floor((n + 1) / 4), 5);
  const need = () => lv.thresholds[2] + pre + 1;
  const cap = () => Math.floor((TAU - lv.zones.reduce((s, z) => s + z.width + GAP, 0)) / (GAP * density));
  while (need() > cap()) { if (pre > 0) pre--; else if (lv.zones.length) lv.zones.pop(); else break; }

  lv.pre = [];
  for (let k = 0; k < pre; k++) {
    for (let tr = 0; tr < 80; tr++) {
      const a = rnd() * TAU;
      const okZ = lv.zones.every(z => !inArc(a, { start: z.start - GAP, width: z.width + GAP * 2 }));
      const okP = lv.pre.every(b => angDiff(a, b) > GAP * 2.2);
      if (okZ && okP) { lv.pre.push(a); break; }
    }
  }
  for (const z of lv.zones) if (z.type === 'shield' && n >= 22) z.vel = (0.25 + rnd() * 0.35) * (rnd() < 0.5 ? -1 : 1);

  // altın para hedefi (6+): vurursan +2 altın
  lv.targets = [];
  if (n >= 6 && rnd() < 0.7 && !boss) {
    for (let tr = 0; tr < 80; tr++) {
      const a = rnd() * TAU;
      const okZ = lv.zones.every(z => !inArc(a, { start: z.start - GAP * 1.5, width: z.width + GAP * 3 }));
      const okP = lv.pre.every(b => angDiff(a, b) > GAP * 2);
      if (okZ && okP) { lv.targets.push({ a, kind: 'coin', value: 2, taken: false }); break; }
    }
  }
  if (boss) {
    const idx = (c - 1) % BOSSES.length;
    lv.boss = { idx, rage: false, seg: 0.8 + rnd() * 0.5, flash: 0,
      seq: Array.from({ length: 64 }, () => (rnd() < 0.28 ? -(0.3 + rnd() * 0.5) : 0.5 + rnd() * 1.3)) };
    lv.pattern = 'boss';
  }
  return lv;
}

// Bonus bölüm: yıldızı yok, bölge yok; küredeki paraları ya da hediyeleri vur
function makeBonus(node) {
  const c = node.c, rnd = mulberry32(c * 7919 + 3);
  const lv = { n: diffToN(difficulty(c, 5)), c, i: 0, id: node.id, kind: 'bonus', btype: node.btype };
  lv.pinsTotal = PINS_BONUS; lv.thresholds = [0, 0, 0]; lv.timeLimit = 0;
  lv.speed = 1.2 + Math.min(c, 10) * 0.05; lv.dir = rnd() < 0.5 ? 1 : -1; lv.pattern = 'wave'; lv.period = 2.4;
  lv.zones = []; lv.pre = [];
  const count = node.btype === 'gold' ? 6 : 3, off = rnd() * TAU;
  lv.targets = Array.from({ length: count }, (_, k) => ({
    a: norm(off + k * TAU / count), kind: node.btype === 'gold' ? 'coin' : 'gift', value: node.btype === 'gold' ? 2 : 0, taken: false,
  }));
  return lv;
}
