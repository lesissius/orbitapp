// İğne Ustası: oynanış (bölüm başlatma, atış, çarpışma, jokerler, süre, sonuç, test botu)
'use strict';
let screen = 'title';          // 'title' | 'map' | 'play'
let paused = false;
let overlay = null;            // harita/oyun üstü pencere: { type: 'market'|'settings'|'milestone'|'info', ... }
let curNode = null, lv = null;
let rot = 0, t = 0, stuck = [], flying = [], bounced = [], particles = [], fx = [], popups = [];
let pinsLeft = 0, stuckCount = 0, state = 'play', stateT = 0, shake = 0, dirMul = 1, orbPulse = 0, flash = 0;
let banner = null, timeLeft = 0, slowT = 0, coinsRun = 0, giftsRun = {}, result = null, bossIntroSeen = '';
let usedSkills = 0;

function layout() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = window.innerWidth; H = window.innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const cs = getComputedStyle(document.getElementById('safe'));
  SAFE = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0, left: parseFloat(cs.paddingLeft) || 0, right: parseFloat(cs.paddingRight) || 0 };
  const s = Math.min(W, H * 0.62);
  cx = W / 2; cy = H * 0.37 + SAFE.top * 0.5;
  R = s * (W < 500 ? 0.17 : 0.16); L = R * 1.25; HEAD = Math.max(5, R * 0.13);
  LAUNCH_Y = Math.min(H * 0.79, H - SAFE.bottom - L - 40);
}
GAP = 2 * Math.asin(0.13 / 2.25) + 0.012; // açısal boşluk ekrandan bağımsız: seviyeler her cihazda aynı

function startLevel(node) {
  curNode = node; lv = makeLevel(node);
  // küredeki altın para yalnızca bölüm ilk kez geçilene kadar çıkar (tekrar oynayarak altın kasılmasın)
  if (lv.kind !== 'bonus' && P.coins[node.id]) lv.targets = lv.targets.filter(x => x.kind !== 'coin');
  screen = 'play'; paused = false; overlay = null;
  rot = 0; t = 0; dirMul = 1;
  stuck = lv.pre.map(a => ({ a, pre: true }));
  flying = []; bounced = []; particles = []; fx = []; popups = [];
  pinsLeft = lv.pinsTotal; stuckCount = 0; coinsRun = 0; giftsRun = {}; usedSkills = 0;
  state = 'play'; stateT = 0; shake = 0; orbPulse = 0; flash = 0; result = null;
  timeLeft = lv.timeLimit; slowT = 0;
  P.lastId = node.id; saveProgress();
  // yeni kural ilk kez çıkınca kısa tanıtım
  const intro = [
    [lv.kind !== 'bonus', 'stars', `${lv.thresholds[0]} İĞNE: GEÇ`, `${lv.thresholds[1]} iğne ★★ · ${lv.thresholds[2]} iğne ★★★`],
    [lv.timeLimit > 0, 'timed', 'SÜRELİ BÖLÜM', `${lv.timeLimit} saniyede iğneleri sapla`],
    [lv.zones.some(z => z.type === 'bomb'), 'bomb', 'BOMBA', 'Patlayan iğne yanındaki iğneni de düşürür'],
    [lv.zones.some(z => z.type === 'shield'), 'shield', 'ZIRH', 'Metalden seken iğne kaybolur, küre ters döner'],
    [lv.targets.some(x => x.kind === 'coin') && lv.kind !== 'bonus', 'coin', 'ALTIN PARA', 'Paraya iğne sapla: +2 altın'],
    [lv.zones.some(z => z.vel), 'drift', 'GEZEN ZIRH', 'Metal plakalar kendi başına kayıyor'],
    [lv.kind === 'bonus' && lv.btype === 'gold', 'bonus_gold', 'BONUS: ALTIN YAĞMURU', 'Paraları vur, altınları topla'],
    [lv.kind === 'bonus' && lv.btype === 'skill', 'bonus_skill', 'BONUS: HEDİYE KUTULARI', 'Kutuları vur, joker kazan'],
  ].find(([on, key]) => on && !P.seen[key]);
  banner = null;
  if (intro) { P.seen[intro[1]] = true; saveProgress(); banner = { title: intro[2], text: intro[3], t: 0 }; }
  if (lv.boss) {
    state = 'bossintro';
    lv.introDur = bossIntroSeen === lv.id ? 0.7 : 1.8;
    bossIntroSeen = lv.id;
    bossSting();
  }
  musicUpdate();
}

function bossSting() {
  [110, 98, 82].forEach((f, i) => tone(f, 0.45, 'sawtooth', 0.12, f * 0.9, i * 0.22));
  noise(0.5, 0.25, 300); vibrate([40, 60, 40, 60, 120]);
  shake = 10;
}

// Boss 1 yıldız eşiğini geçince öfkelenir: hızlanır ve boş bir yere bomba çıkarır
function bossRage() {
  const b = lv.boss; b.rage = true;
  shake = 16; flash = 0.5; orbPulse = 1;
  noise(0.4, 0.3, 500); tone(70, 0.6, 'sawtooth', 0.15, 45); vibrate([30, 40, 80]);
  addFx('fx_ring', cx, cy, R, R * 4.5, 0.6);
  const w = 0.4; let placed = false;
  for (let k = 0; k < 120 && !placed; k++) {
    const start = Math.random() * TAU;
    const box = { start: start - GAP, width: w + GAP * 2 };
    const okP = stuck.every(s => !inArc(s.a, box));
    const okZ = lv.zones.every(o => angDiff(start + w / 2, o.start + o.width / 2) > (w + o.width) / 2 + 0.2);
    const okB = !inArc(norm(Math.PI / 2 - rot), { start: start - 0.6, width: w + 1.2 });
    if (okP && okZ && okB) { lv.zones.push({ type: 'bomb', width: w, start, born: 1 }); placed = true; }
  }
  banner = { title: 'ÖFKELENDİ!', text: placed ? 'Boss hızlandı ve bomba çıkardı' : 'Boss hızlandı', t: 0 };
}

function angularVelocity() {
  const base = lv.speed * lv.dir * dirMul * (slowT > 0 ? 0.45 : 1);
  switch (lv.pattern) {
    // ileri tam süre, geri yarım süre: küre net ilerler, her açı aşağı gelir
    case 'reverse': { const c = t % (lv.period * 1.5); return base * (c < lv.period ? 1 : -1); }
    case 'wave': return base * (0.35 + 0.9 * (0.5 + 0.5 * Math.sin(t * TAU / (lv.period * 1.6))));
    case 'pulse': { const p = (t % lv.period) / lv.period; return clamp(base * (p < 0.7 ? 0.45 : 2.4), -4.6, 4.6); }
    case 'boss': {
      const b = lv.boss, x = t / b.seg, i = Math.floor(x), f = x - i, s = f * f * (3 - 2 * f);
      return base * (b.seq[i % 64] * (1 - s) + b.seq[(i + 1) % 64] * s) * (b.rage ? 1.35 : 1);
    }
    default: return base;
  }
}

function throwPin() {
  audio();
  if (screen !== 'play' || paused || overlay || state !== 'play' || pinsLeft <= 0) return;
  pinsLeft--;
  flying.push({ y: LAUNCH_Y, v: Math.max(H * 3.2, 1800) }); // y = iğnenin ucu
  sfx.throw();
  if (!P.tutorial) { P.tutorial = true; saveProgress(); }
}

// ---------- jokerler ----------
function canUseSkill(key) {
  if (screen !== 'play' || state !== 'play' && state !== 'bossintro') return false;
  if (lv.kind === 'bonus') return false;
  if (key === 'time15') return lv.timeLimit > 0;
  return true;
}
function useSkill(key) {
  if (!canUseSkill(key)) return;
  if ((P.skills[key] || 0) <= 0) { openMarket(); return; }
  P.skills[key]--; usedSkills++; saveProgress();
  sfx.skill();
  if (key === 'slow') { slowT = Math.max(slowT, 0) + 8; addPopup('YAVAŞ!', cx, cy - R * 1.6, '#8fd8ff'); }
  if (key === 'pins2') { pinsLeft += 2; lv.pinsTotal += 2; addPopup('+2 İĞNE', cx, LAUNCH_Y - 30, '#7dff9a'); }
  if (key === 'time15') { timeLeft += 15; addPopup('+15 SN', cx, cy - R * 1.6, '#ffd34d'); }
  addFx('fx_ring', cx, cy, R, R * 3.5, 0.5);
}

// ---------- efektler ----------
function burst(x, y, color, count, speed, life = 0.7, size = 3) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * TAU, s = speed * (0.3 + Math.random());
    particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life, max: life, color, size: size * (0.5 + Math.random()) });
  }
}
function addFx(name, x, y, size0, size1, life, r0 = 0, vr = 0) { fx.push({ name, x, y, s0: size0, s1: size1, life, max: life, rot: r0, vr }); }
function addPopup(text, x, y, color = '#fff') { popups.push({ text, x, y, color, life: 1.1, max: 1.1 }); }
function loseFlyingPin(x, y) { bounced.push({ x, y: y + L / 2, vx: (Math.random() - 0.5) * 400, vy: 600, r: Math.PI, vr: (Math.random() < 0.5 ? -1 : 1) * 14, life: 0.9 }); }

function checkEnd() {
  if (state !== 'play') return;
  if (lv.kind !== 'bonus' && stuckCount >= lv.thresholds[2]) { finishLevel(false); return; }      // 3 yıldız: hemen biter
  if (lv.kind === 'bonus' && lv.targets.every(x => x.taken)) { finishLevel(false); return; }
  if (pinsLeft <= 0 && flying.length === 0) finishLevel(false);
}

// Bölüm sonu: yıldızlar ve ödüller hesaplanır
function finishLevel(timeUp) {
  flying = [];
  const prev = starsOf(lv.id);
  if (lv.kind === 'bonus') {
    const first = !P.bonus[lv.id];
    let gold = 0; const skills = {};
    if (first) { // bonus ödülü bonus bitince bir kez verilir (yarıda bırakılınca hiçbir şey yazılmaz)
      const coinsHit = lv.targets.filter(x => x.kind === 'coin' && x.taken).length;
      gold = coinsHit * COIN_GOLD + (lv.btype === 'gold' ? 6 : 0);
      if (lv.btype === 'gold') P.coins[lv.id] = coinsHit;
      Object.assign(skills, giftsRun);
      P.bonus[lv.id] = true;
    }
    P.gold += gold;
    for (const k in skills) P.skills[k] = (P.skills[k] || 0) + skills[k];
    saveProgress();
    result = { win: true, bonus: true, stars: 0, gold, skills, first };
    state = 'win'; stateT = 0; sfx.win(); orbPulse = 1;
    addFx('fx_gold', cx, cy, R * 1.5, R * 5.5, 1.1, 0, 0.8);
    return;
  }
  const th = lv.thresholds;
  const stars = th.filter(v => stuckCount >= v).length;
  if (stars === 0) {
    result = { win: false, reason: timeUp ? 'time' : 'pins', stars: 0, got: stuckCount, need: th[0] };
    state = 'fail'; stateT = 0; flash = 0.6; sfx.fail();
    return;
  }
  // ekonomi: 1★ 3, 2★ 8, 3★ 12 altın; bir joker (90 altın) için 10–11 bölüm biriktirmek gerekir.
  // Aynı bölümü tekrar oynamak yalnızca yıldız artarsa farkı verir (altın kasılmasın).
  const STAR_GOLD = [0, 3, 8, 12];
  let gold = stars > prev ? STAR_GOLD[stars] - STAR_GOLD[prev] : 0;
  const leftover = 0;
  if (stars > prev) P.stars[lv.id] = stars;
  P.gold += gold;
  saveProgress();
  result = { win: true, stars, prev, gold, leftover, coins: coinsRun, newBest: stars > prev, timeUp };
  state = 'win'; stateT = 0; sfx.win(); orbPulse = 1;
  addFx('fx_gold', cx, cy, R * 1.5, R * 5.5, 1.1, 0, 0.8);
  addFx('fx_ring', cx, cy, R, R * 6, 0.8);
  burst(cx, cy, theme().accent, 50, 600, 1.1, 4);
  burst(cx, cy, '#ffffff', 24, 420, 0.9, 3);
  if (lv.boss) {
    sfx.boom();
    for (let k = 0; k < 6 && !SIM; k++) {
      const a = Math.random() * TAU, d = R * (0.2 + Math.random() * 0.9);
      setTimeout(() => { addFx('fx_boom', cx + Math.cos(a) * d, cy + Math.sin(a) * d, R * 0.4, R * 2.2, 0.6, Math.random() * TAU, 0.8); noise(0.3, 0.25, 700); shake = 14; }, k * 110);
    }
    burst(cx, cy, BOSSES[lv.boss.idx].aura, 60, 700, 1.2, 5);
    for (const s of stuck) {
      const wa = s.a + rot;
      bounced.push({ x: cx + Math.cos(wa) * (R + L / 2), y: cy + Math.sin(wa) * (R + L / 2), vx: Math.cos(wa) * 500, vy: Math.sin(wa) * 500 - 300, r: wa - Math.PI / 2, vr: (Math.random() - 0.5) * 20, life: 1.4 });
    }
  }
}

// ---------- güncelleme ----------
function update(dt) {
  stateT += dt;
  if (screen !== 'play') { rot = norm(rot + 0.6 * dt); updateFx(dt); return; }
  if (state === 'play' || state === 'win') {
    t += dt;
    const w = state === 'win' ? angularVelocity() * (1 + stateT * 6) : angularVelocity();
    rot = norm(rot + w * dt);
    for (const z of lv.zones) { // gezen zırh: iğneye ya da başka bölgeye değince geri döner
      if (!z.vel || state !== 'play') continue;
      const ns = norm(z.start + z.vel * dt);
      const box = { start: ns - GAP * 0.6, width: z.width + GAP * 1.2 };
      const blocked = stuck.some(s => inArc(s.a, box)) || lv.targets.some(x => !x.taken && inArc(x.a, box)) ||
        lv.zones.some(o => o !== z && angDiff(ns + z.width / 2, o.start + o.width / 2) < (z.width + o.width) / 2 + 0.08);
      if (blocked) z.vel = -z.vel; else z.start = ns;
    }
  }
  if (state === 'bossintro') { rot = norm(rot + 0.8 * dt); if (stateT > lv.introDur) { state = 'play'; stateT = 0; } }
  if (state === 'play') {
    if (slowT > 0) slowT = Math.max(0, slowT - dt);
    if (lv.timeLimit) {
      const before = Math.ceil(timeLeft);
      timeLeft -= dt;
      if (timeLeft <= 5 && Math.ceil(timeLeft) < before && timeLeft > 0) sfx.tick();
      if (timeLeft <= 0) { timeLeft = 0; finishLevel(true); }
    }
  }
  if (lv.boss && lv.boss.flash) lv.boss.flash = Math.max(0, lv.boss.flash - dt * 4);
  for (const z of lv.zones) if (z.born) z.born = Math.max(0, z.born - dt * 3);
  if (banner) banner.t += dt;

  const PROT = R * 0.3;
  for (let i = flying.length - 1; i >= 0; i--) {
    const p = flying[i];
    p.y -= p.v * dt;
    if (state !== 'play') continue;
    const a = norm(Math.PI / 2 - rot);
    const zone = lv.zones.find(z => inArc(a, z));
    const surface = cy + R + (zone ? PROT : 0);
    if (p.y > surface) continue;
    flying.splice(i, 1);
    const tipX = cx, tipY = surface;
    if (zone && zone.type === 'bomb') { // iğne patlar, en yakın iğnen düşer
      sfx.boom(); shake = 14; flash = 0.5;
      addFx('fx_boom', tipX, tipY, R * 0.5, R * 2.6, 0.65, Math.random() * TAU, 0.6);
      addFx('fx_ring', tipX, tipY, R * 0.3, R * 3.2, 0.5);
      burst(tipX, tipY, '#ff5a3d', 30, 480, 0.8, 4);
      let near = null, best = 0.9;
      for (const s of stuck) if (!s.pre && angDiff(s.a, a) < best) { best = angDiff(s.a, a); near = s; }
      if (near) {
        stuck.splice(stuck.indexOf(near), 1); stuckCount--;
        const wa = near.a + rot;
        bounced.push({ x: cx + Math.cos(wa) * (R + L / 2), y: cy + Math.sin(wa) * (R + L / 2), vx: Math.cos(wa) * 420, vy: Math.sin(wa) * 420 - 200, r: wa - Math.PI / 2, vr: 16, life: 1.1 });
        addPopup('−1 İĞNE', tipX, tipY + 40, '#ff6b6b');
      } else addPopup('BOOM', tipX, tipY + 40, '#ff6b6b');
      loseFlyingPin(tipX, tipY);
      checkEnd(); continue;
    }
    if (zone && zone.type === 'shield') { // seker ve kaybolur, küre ters döner
      sfx.shield(); dirMul *= -1;
      loseFlyingPin(tipX, tipY);
      addFx('fx_metal', tipX, tipY + R * 0.2, R * 0.5, R * 1.5, 0.4, Math.PI);
      addFx('fx_spark', tipX, tipY, R * 0.3, R * 1.1, 0.25);
      addPopup('SEKTİ', tipX, tipY + 40, '#c9d3e6');
      checkEnd(); continue;
    }
    const clash = stuck.find(s => angDiff(s.a, a) < GAP);
    if (clash) { // çarptı: bu iğne kırılır, bölüm sürer
      sfx.clash(); shake = 8;
      clash.hitT = 0.5;
      loseFlyingPin(tipX, cy + R + L * 0.5);
      addFx('fx_spark', tipX, cy + R + L, R * 0.3, R * 1.4, 0.3, Math.random());
      burst(tipX, cy + R + L, '#ff4d6d', 12, 200);
      addPopup('ÇARPTI', tipX, cy + R + L + 30, '#ff8da1');
      checkEnd(); continue;
    }
    stuck.push({ a, born: 1 }); stuckCount++;
    orbPulse = 0.5;
    sfx.stick(stuckCount);
    addFx('fx_spark', tipX, tipY, R * 0.25, R * 0.9, 0.22, Math.random());
    burst(tipX, tipY, theme().pin, 6, 140, 0.3, 2);
    if (lv.kind !== 'bonus' && lv.thresholds.includes(stuckCount)) { // yıldız eşiği
      const k = lv.thresholds.indexOf(stuckCount) + 1;
      addPopup('★'.repeat(k), cx, cy - R * 1.7, '#ffd34d'); sfx.coin();
    }
    for (const tg of lv.targets) {
      if (tg.taken || angDiff(a, tg.a) > GAP * 1.3) continue;
      tg.taken = true;
      addFx('fx_gold', tipX, tipY, R * 0.5, R * 2.4, 0.6, 0, 1);
      burst(tipX, tipY, '#ffd34d', 20, 320, 0.7, 3);
      if (tg.kind === 'coin') {
        coinsRun += tg.value; sfx.coin(); addPopup(`+${tg.value} ALTIN`, tipX, tipY + 50, '#ffd34d');
        if (lv.kind !== 'bonus' && !P.coins[lv.id]) { P.coins[lv.id] = 1; P.gold += tg.value; saveProgress(); } // bölüm parası hesap başına bir kez
      }
      else { const keys = Object.keys(SKILL_INFO), k = keys[Math.floor(Math.random() * keys.length)]; giftsRun[k] = (giftsRun[k] || 0) + 1; sfx.skill(); addPopup(SKILL_INFO[k].name.toUpperCase(), tipX, tipY + 50, '#7dff9a'); }
    }
    if (lv.boss) {
      lv.boss.flash = 1;
      if (!lv.boss.rage && stuckCount >= lv.thresholds[0] && stuckCount < lv.thresholds[2]) bossRage();
    }
    checkEnd();
  }
  for (let i = bounced.length - 1; i >= 0; i--) {
    const b = bounced[i];
    b.vy += 2200 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt; b.life -= dt;
    if (b.life <= 0) bounced.splice(i, 1);
  }
  for (const s of stuck) { if (s.born) s.born = Math.max(0, s.born - dt * 6); if (s.hitT) s.hitT = Math.max(0, s.hitT - dt); }
  updateFx(dt);
}
function updateFx(dt) {
  for (let i = fx.length - 1; i >= 0; i--) { const f = fx[i]; f.life -= dt; f.rot += f.vr * dt; if (f.life <= 0) fx.splice(i, 1); }
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; p.vy *= 0.96; p.vy += 300 * dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = popups.length - 1; i >= 0; i--) { const p = popups[i]; p.life -= dt; p.y -= 40 * dt; if (p.life <= 0) popups.splice(i, 1); }
  shake = Math.max(0, shake - dt * 60);
  orbPulse = Math.max(0, orbPulse - dt * 3);
  flash = Math.max(0, flash - dt * 2.5);
}

// ---------- test botu ----------
// Gerçek oyun mantığını görüntüsüz çalıştırır, hatasız atışla bölümü oynar.
// Sonuç: kaç yıldız alınabiliyor, ne kadar sürdü, son gereken iğnede güvenli açı oranı (insan için zorluk).
function simLevel(id, maxTime = 120) {
  const node = findNode(id);
  const bk = JSON.stringify(P), bkScreen = screen, bkNode = curNode, bkIntro = bossIntroSeen;
  SIM = true;
  startLevel(node);
  if (state === 'bossintro') { state = 'play'; stateT = 0; }
  const dt = 1 / 120, travel = (LAUNCH_Y - (cy + R)) / Math.max(H * 3.2, 1800);
  const safeAt = (a) => !lv.zones.some(z => inArc(a, { start: z.start - GAP * 0.6, width: z.width + GAP * 1.2 })) && stuck.every(s => angDiff(s.a, a) > GAP * 1.3);
  let time = 0, minFree = 1;
  while (time < maxTime && state === 'play') {
    if (flying.length === 0 && pinsLeft > 0) {
      const t0 = t; let rr = rot;
      for (let k = 0; k < Math.ceil(travel / dt); k++) { rr += angularVelocity() * dt; t += dt; }
      t = t0;
      if (safeAt(norm(Math.PI / 2 - rr))) {
        let ok = 0; for (let i = 0; i < 180; i++) if (safeAt(i / 180 * TAU)) ok++;
        minFree = Math.min(minFree, ok / 180);
        throwPin();
      }
    }
    update(dt); time += dt;
  }
  const out = { id, kind: lv.kind, stars: result ? result.stars : 0, win: !!(result && result.win), time: +time.toFixed(1),
    timeLeft: lv.timeLimit ? +timeLeft.toFixed(1) : null, stuck: stuckCount, zones: lv.zones.length, pre: lv.pre.length, minFree: +minFree.toFixed(2) };
  SIM = false;
  P = JSON.parse(bk); screen = bkScreen; curNode = bkNode; bossIntroSeen = bkIntro;
  if (screen === 'play' && curNode) startLevel(curNode); else { lv = null; }
  return out;
}
