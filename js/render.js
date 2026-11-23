// İğne Ustası: oyun ekranının çizimi ve ortak arayüz parçaları
'use strict';
let uiButtons = [];
const addButton = (x, y, w, h, action) => uiButtons.push({ x, y, w, h, action });
const now = () => performance.now() / 1000;

function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
function text(str, x, y, size, color = '#fff', weight = 800, align = 'center', shadow = true) {
  ctx.font = `${weight} ${Math.round(size)}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 6; }
  ctx.fillStyle = color; ctx.fillText(str, x, y); ctx.shadowBlur = 0;
}
function sprite(name, x, y, h, alpha = 1) { // ortalanmış, yüksekliğe göre ölçekli
  const im = IMG[name]; if (!im) return false;
  const w = h * im.width / im.height;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.drawImage(im, x - w / 2, y - h / 2, w, h); ctx.restore();
  return true;
}
function iconButton(name, x, y, s, action, fallback, dim) {
  ctx.save();
  if (dim) ctx.globalAlpha *= 0.45;
  if (!sprite(name, x + s / 2, y + s / 2, s)) {
    ctx.fillStyle = 'rgba(20,24,60,0.85)'; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2, 0, TAU); ctx.fill();
    text(fallback, x + s / 2, y + s / 2, s * 0.42, '#fff', 700, 'center', false);
  }
  ctx.restore();
  if (action) addButton(x - 6, y - 6, s + 12, s + 12, action);
}
function textButton(label, x, y, w, h, action, color = '#ffb84d', textColor = '#1a1030', enabled = true) {
  ctx.save(); if (!enabled) ctx.globalAlpha *= 0.4;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, color); g.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = g; roundRect(x, y, w, h, h * 0.35); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; roundRect(x + 1, y + 1, w - 2, h - 2, h * 0.35); ctx.stroke();
  text(label, x + w / 2, y + h / 2 + 1, Math.min(h * 0.42, 20), textColor, 900, 'center', false);
  ctx.restore();
  if (action && enabled) addButton(x, y, w, h, action);
}
function shade(hex, k) { // rengi koyulaştır/açıklaştır
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => clamp(Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k), 0, 255);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}
function panel(x, y, w, h) {
  ctx.fillStyle = 'rgba(16,10,36,0.94)'; roundRect(x, y, w, h, 22); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2; roundRect(x, y, w, h, 22); ctx.stroke();
}
function drawStars(x, y, size, count, of = 3) {
  for (let i = 0; i < of; i++) {
    const sx = x + (i - (of - 1) / 2) * size * 1.05;
    ctx.save();
    if (i >= count) { ctx.globalAlpha *= 0.35; ctx.filter = 'grayscale(1) brightness(0.6)'; }
    if (!sprite('star', sx, y, size)) text('★', sx, y, size, i < count ? '#ffd34d' : '#555', 900, 'center', false);
    ctx.restore();
  }
}
function coinPill(x, y, h, amount) { // sağa yaslı altın göstergesi
  ctx.font = `900 ${Math.round(h * 0.5)}px ${FONT}`;
  const tw = ctx.measureText(String(amount)).width, w = tw + h * 1.5;
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(x - w, y, w, h, h / 2); ctx.fill();
  if (!sprite('coin', x - w + h * 0.5, y + h / 2, h * 0.86)) text('●', x - w + h * 0.5, y + h / 2, h * 0.6, '#ffd34d');
  text(String(amount), x - h * 0.35, y + h / 2 + 1, h * 0.5, '#ffd34d', 900, 'right', false);
  return w;
}

// ---------- oyun ekranı ----------
function drawPinVec(x1, y1, x2, y2, color, glow) {
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, HEAD * 0.32); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.fillStyle = color;
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 14; }
  ctx.beginPath(); ctx.arc(x2, y2, HEAD, 0, TAU); ctx.fill();
  ctx.shadowBlur = 0;
}
function drawPin(tx, ty, dir, len, kind = 'pin', hit = false) {
  const hx = tx + Math.cos(dir) * len, hy = ty + Math.sin(dir) * len;
  const im = IMG[kind] || IMG.pin;
  if (!im) { drawPinVec(tx, ty, hx, hy, hit ? '#ff4d6d' : kind === 'pin_old' ? 'rgba(255,255,255,0.55)' : theme().pin, hit); return; }
  const h = len + HEAD, w = h * (im.width / im.height) * 0.85;
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(dir + Math.PI / 2); ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
  if (hit) glowAt(hx, hy, HEAD * 5, 'rgba(255,60,80,0.9)');
}
function glowAt(x, y, size, color) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, size / 2);
  g.addColorStop(0, color || 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, size / 2, 0, TAU); ctx.fill();
  ctx.restore();
}
function drawCover(im, dark = 0) {
  const s = Math.max(W / im.width, H / im.height), bw = im.width * s, bh = im.height * s;
  ctx.drawImage(im, (W - bw) / 2, (H - bh) / 2, bw, bh);
  if (dark) { ctx.fillStyle = `rgba(0,0,0,${dark})`; ctx.fillRect(0, 0, W, H); }
}
function drawPlayBackground(th) {
  const bg = IMG['bg' + (themeIndex() + 1)];
  if (bg) drawCover(bg, 0.18);
  else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
}
function drawZone(z, pr) {
  const PROT = R * 0.3, s0 = z.start + rot, s1 = s0 + z.width, bomb = z.type === 'bomb';
  const grow = 1 - (z.born || 0);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, pr - R * 0.04, s0, s1); ctx.arc(cx, cy, pr + PROT * 0.55 * grow, s1, s0, true); ctx.closePath();
  const g = ctx.createRadialGradient(cx, cy, pr - R * 0.05, cx, cy, pr + PROT * 0.6);
  if (bomb) { g.addColorStop(0, '#4a0d0d'); g.addColorStop(1, '#a3241c'); } else { g.addColorStop(0, '#3c4352'); g.addColorStop(1, '#aab4c6'); }
  ctx.fillStyle = g; ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8; ctx.fill(); ctx.restore();
  const im = IMG[z.type], arcLen = z.width * (pr + PROT * 0.3);
  if (im) {
    const aspect = im.height / im.width, k = Math.max(1, Math.round(arcLen / (PROT / aspect)));
    const segW = (arcLen / k) * 1.12, segH = Math.min(segW * aspect, PROT * 1.25) * grow;
    for (let i = 0; i < k; i++) {
      const a = s0 + z.width * (i + 0.5) / k;
      ctx.save(); ctx.translate(cx + Math.cos(a) * (pr - R * 0.03), cy + Math.sin(a) * (pr - R * 0.03)); ctx.rotate(a + Math.PI / 2);
      ctx.drawImage(im, -segW / 2, -segH, segW, segH); ctx.restore();
    }
  }
  if (bomb) {
    const blink = 0.35 + 0.35 * Math.sin(performance.now() / 140), mid = s0 + z.width / 2;
    glowAt(cx + Math.cos(mid) * (pr + PROT * 0.4), cy + Math.sin(mid) * (pr + PROT * 0.4), R * (0.6 + z.width), `rgba(255,80,40,${blink})`);
  }
}

function drawPlay() {
  const th = theme(), boss = lv.boss, tnow = now();
  drawPlayBackground(th);
  ctx.save();
  if (shake > 0 && settings.shake && !paused) ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  if (boss) {
    ctx.fillStyle = 'rgba(40,0,0,0.35)'; ctx.fillRect(-20, -20, W + 40, H + 40);
    const pulse = 0.5 + 0.5 * Math.sin(tnow * (boss.rage ? 9 : 4));
    glowAt(cx, cy, R * (4.4 + pulse * 0.8), BOSSES[boss.idx].aura + (boss.rage ? 'aa' : '77'));
  } else glowAt(cx, cy, R * 4.2, th.orb[0] + '55');
  if (slowT > 0) glowAt(cx, cy, R * 3.6, `rgba(120,200,255,${0.25 + 0.1 * Math.sin(tnow * 6)})`);

  for (const s of stuck) {
    if (boss && state === 'win') break;
    const wa = s.a + rot, len = L * (1 - (s.born || 0) * 0.25) + R * 0.1;
    drawPin(cx + Math.cos(wa) * R * 0.9, cy + Math.sin(wa) * R * 0.9, wa, len, s.pre ? 'pin_old' : 'pin', (s.hitT || 0) > 0);
  }
  let pr = R * (1 + orbPulse * 0.06);
  if (boss && state === 'win') pr *= Math.max(0, 1 - stateT * 1.6);
  if (boss && boss.rage) pr *= 1 + 0.02 * Math.sin(tnow * 30);
  const orbImg = boss ? IMG['boss' + (boss.idx + 1)] : IMG['orb' + (themeIndex() + 1)];
  if (orbImg && pr > 0) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    const oh = pr * 2 * (orbImg.height / orbImg.width); ctx.drawImage(orbImg, -pr, -oh / 2, pr * 2, oh); ctx.restore();
  } else if (pr > 0) {
    const og = ctx.createRadialGradient(cx - pr * 0.35, cy - pr * 0.4, pr * 0.1, cx, cy, pr);
    og.addColorStop(0, boss ? BOSSES[boss.idx].aura : th.orb[0]); og.addColorStop(1, boss ? '#1a0508' : th.orb[1]);
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.fill();
  }
  if (slowT > 0 && pr > 0) { ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#9fe0ff'; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, TAU); ctx.fill(); ctx.restore(); }
  if (pr > R * 0.35) for (const z of lv.zones) drawZone(z, pr);
  for (const tg of lv.targets) { // para / hediye hedefleri
    if (tg.taken) continue;
    const ga = tg.a + rot, gx = cx + Math.cos(ga) * (pr + R * 0.08), gy = cy + Math.sin(ga) * (pr + R * 0.08);
    const gs = R * (0.4 + 0.04 * Math.sin(tnow * 6 + tg.a));
    glowAt(gx, gy, gs * 2.6, tg.kind === 'coin' ? 'rgba(255,200,60,0.5)' : 'rgba(200,120,255,0.5)');
    ctx.save(); ctx.translate(gx, gy); ctx.rotate(ga + Math.PI / 2);
    if (!sprite(tg.kind === 'coin' ? 'coin' : 'chest', 0, 0, gs)) { ctx.fillStyle = '#ffd34d'; ctx.beginPath(); ctx.arc(0, 0, gs / 2.4, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  if (boss && boss.flash > 0 && pr > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = boss.flash * 0.5; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx, cy, pr * 0.98, 0, TAU); ctx.fill(); ctx.restore(); }
  if (!boss) { // küre ortasında bölüm adı
    ctx.font = `900 ${Math.round(R * (lv.kind === 'bonus' ? 0.32 : 0.46))}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const label = lv.kind === 'bonus' ? 'BONUS' : lv.id;
    ctx.lineWidth = R * 0.06; ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.strokeText(label, cx, cy + R * 0.04);
    ctx.fillStyle = 'rgba(25,12,35,0.88)'; ctx.fillText(label, cx, cy + R * 0.04);
  }
  for (const p of flying) drawPin(cx, p.y, Math.PI / 2, L + R * 0.1);
  for (const b of bounced) { ctx.save(); ctx.globalAlpha = Math.max(0, b.life); drawPin(b.x + Math.cos(b.r - Math.PI / 2) * L / 2, b.y + Math.sin(b.r - Math.PI / 2) * L / 2, b.r + Math.PI / 2, L); ctx.restore(); }
  drawFx();
  ctx.restore();

  drawPlayHud(th);
}

function drawFx() {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const f of fx) {
    const im = IMG[f.name]; if (!im) continue;
    const k = 1 - f.life / f.max, s = f.s0 + (f.s1 - f.s0) * (1 - Math.pow(1 - k, 3));
    ctx.globalAlpha = Math.min(1, (f.life / f.max) * 1.6);
    ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(f.rot); const ar = im.height / im.width; ctx.drawImage(im, -s / 2, -s * ar / 2, s, s * ar); ctx.restore();
  }
  ctx.restore();
  for (const p of particles) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  for (const p of popups) { ctx.globalAlpha = Math.min(1, p.life / p.max * 2); text(p.text, p.x, p.y, Math.min(W, H) * 0.05, p.color, 900); }
  ctx.globalAlpha = 1;
}

// İlerleme çubuğu: saplanan iğneler ve 1/2/3 yıldız eşikleri (boss'ta can barı gibi)
function drawProgressBar(x, y, w, h) {
  const th = lv.thresholds, max = th[2], k = clamp(stuckCount / max, 0, 1), boss = lv.boss;
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; roundRect(x - 3, y - 3, w + 6, h + 6, h); ctx.fill();
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  if (boss) { g.addColorStop(0, '#ff3b3b'); g.addColorStop(1, boss.rage ? '#ff9a3b' : '#ff5f7a'); }
  else { g.addColorStop(0, '#ffd34d'); g.addColorStop(1, '#ffef9a'); }
  if (k > 0) { ctx.fillStyle = g; roundRect(x, y, Math.max(h, w * k), h, h / 2); ctx.fill(); }
  if (boss && boss.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${boss.flash * 0.6})`; roundRect(x, y, Math.max(h, w * k), h, h / 2); ctx.fill(); }
  th.forEach((v, i) => { // yıldız işaretleri
    const sx = x + w * v / max, got = stuckCount >= v, ss = h * 2.1;
    ctx.save(); if (!got) { ctx.globalAlpha = 0.55; ctx.filter = 'grayscale(1)'; }
    if (!sprite('star', sx, y + h / 2, ss)) text('★', sx, y + h / 2, ss, got ? '#ffd34d' : '#888');
    ctx.restore();
    text(String(v), sx, y + h + ss * 0.55, h * 0.95, got ? '#ffd34d' : 'rgba(255,255,255,0.6)', 800);
  });
}

function drawPlayHud(th) {
  const m = Math.min(W, H), top = 14 + SAFE.top, left = 16 + SAFE.left, right = W - 16 - SAFE.right, boss = lv.boss;
  const active = state === 'play' || state === 'bossintro';
  // sol üst: bölüm
  text(lv.kind === 'bonus' ? `${lv.c}-BONUS` : lv.id, left, top + 12, m * 0.046, '#fff', 900, 'left');
  text(boss ? BOSSES[boss.idx].name : lv.kind === 'bonus' ? 'Yıldız yok · ödül var' : chapterName(lv.c), left, top + 12 + m * 0.045, m * 0.03, boss ? BOSSES[boss.idx].aura : 'rgba(255,255,255,0.65)', 700, 'left');
  // orta: ilerleme
  const bw = Math.min(W * 0.46, 260), bx = cx - bw / 2, by = top + 8;
  if (lv.kind !== 'bonus') drawProgressBar(bx, by, bw, 12);
  else text(`Kalan hedef: ${lv.targets.filter(x => !x.taken).length}`, cx, by + 8, m * 0.038, '#ffd34d', 900);
  // süre
  if (lv.timeLimit) {
    const low = timeLeft <= 5, ts = m * (low ? 0.07 + 0.01 * Math.sin(now() * 12) : 0.06);
    text(`⏱ ${Math.ceil(timeLeft)}`, cx, by + 52, ts, low ? '#ff6b6b' : '#fff', 900);
  }
  if (slowT > 0) text(`YAVAŞ ${Math.ceil(slowT)} sn`, cx, by + (lv.timeLimit ? 86 : 52), m * 0.034, '#8fd8ff', 900);
  // sağ üst: altın ve duraklat
  if (active && !paused && !overlay) iconButton('ui_pause', right - 44, top - 4, 44, () => setPaused(true), '❚❚');
  coinPill(right, top + 50, 26, P.gold);

  // alt: sıradaki iğne ve kalan sayı
  if (active && pinsLeft > 0) drawPin(cx, LAUNCH_Y, Math.PI / 2, L + R * 0.1);
  if (active) text(`× ${pinsLeft}`, cx + HEAD * 3.2, LAUNCH_Y + L * 0.5, m * 0.05, th.accent, 900, 'left');

  // jokerler
  if (active && lv.kind !== 'bonus' && !paused && !overlay) {
    const s = Math.min(m * 0.15, 64), y = H - SAFE.bottom - s - 14;
    const keys = ['slow', 'pins2'].concat(lv.timeLimit ? ['time15'] : []);
    keys.forEach((k, i) => {
      const x = i === 0 ? left : right - s - (i - 1) * (s + 12);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2 + 4, 0, TAU); ctx.fill();
      const have = P.skills[k] || 0;
      iconButton(SKILL_INFO[k].icon, x + s * 0.08, y + s * 0.08, s * 0.84, () => useSkill(k), SKILL_INFO[k].name[0], have <= 0);
      const bx2 = x + s - 6, by2 = y + 6;
      ctx.fillStyle = have > 0 ? '#ff4d6d' : '#3fbf5f'; ctx.beginPath(); ctx.arc(bx2, by2, 11, 0, TAU); ctx.fill();
      text(have > 0 ? String(have) : '+', bx2, by2 + 1, 13, '#fff', 900, 'center', false);
      if (k === 'slow' && slowT > 0) { ctx.strokeStyle = '#8fd8ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x + s / 2, y + s / 2, s / 2 + 4, -Math.PI / 2, -Math.PI / 2 + TAU * slowT / 8); ctx.stroke(); }
    });
  }

  // ilk oyunda öğretici el
  if (!P.tutorial && state === 'play' && !paused && !overlay) {
    const k = (performance.now() / 900) % 1, hx = cx - R * 1.5, hy = LAUNCH_Y + L * 0.2 + Math.sin(k * TAU) * 8;
    ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - k)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(hx, hy - R * 0.1, R * (0.15 + k * 0.5), 0, TAU); ctx.stroke();
    sprite('ui_hand', hx + R * 0.1, hy + R * 0.35, R * 0.9);
    text('Ekrana dokun, iğne fırlasın', cx, H * 0.62, m * 0.045, '#fff', 800);
  }
  // tanıtım kartı
  if (banner && state === 'play' && banner.t < 2.8 && !paused && !overlay) {
    const bt = banner.t, a = Math.min(1, bt * 5) * Math.min(1, (2.8 - bt) * 3), yOff = (1 - Math.min(1, bt * 5)) * 20;
    ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(10,6,20,0.65)'; roundRect(cx - Math.min(W * 0.42, 230), H * 0.6 + yOff, Math.min(W * 0.84, 460), m * 0.2, 18); ctx.fill();
    text(banner.title, cx, H * 0.6 + m * 0.065 + yOff, m * 0.052, '#ffd34d', 900);
    text(banner.text, cx, H * 0.6 + m * 0.14 + yOff, m * 0.034, 'rgba(255,255,255,0.9)', 600);
    ctx.globalAlpha = 1;
  }
  if (state === 'bossintro') {
    const a = Math.max(0, Math.min(1, stateT * 5) * Math.min(1, (lv.introDur - stateT) * 4));
    ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, H * 0.58, W, m * 0.3);
    ctx.shadowColor = BOSSES[boss.idx].aura; ctx.shadowBlur = 24;
    text('BOSS', cx + (Math.random() - 0.5) * 6 * a, H * 0.58 + m * 0.11, m * 0.15 * (1 + Math.max(0, 0.3 - stateT)), '#ff4d4d', 900, 'center', false);
    ctx.shadowBlur = 0; text(BOSSES[boss.idx].name, cx, H * 0.58 + m * 0.22, m * 0.05, '#fff', 800);
    ctx.globalAlpha = 1;
  }
  if (state === 'win' || state === 'fail') drawResult(th, m);
  if (paused && !overlay) drawPauseMenu(m);
}

// Sonuç penceresi: yıldızlar, saplanan iğne, altın, düğmeler
function drawResult(th, m) {
  if (state === 'fail') { ctx.fillStyle = `rgba(255,40,60,${flash * 0.35})`; ctx.fillRect(0, 0, W, H); }
  const delay = state === 'win' ? (lv.boss ? 1.2 : 0.6) : 0.3;
  if (stateT < delay) return;
  const a = Math.min(1, (stateT - delay) * 4);
  uiButtons = [];
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
  const pw = Math.min(W - 32, 400), ph = Math.min(H * 0.62, 390), px = cx - pw / 2, py = clamp(H * 0.5 - ph / 2 + 40, SAFE.top + 60, H - ph - 20);
  panel(px, py, pw, ph);
  let y = py + 44;
  const r = result;
  if (r.bonus) {
    text('BONUS TAMAM', cx, y, m * 0.07, '#c89bff', 900); y += 60;
    if (r.first) {
      text(`+${r.gold} altın`, cx, y, m * 0.05, '#ffd34d', 900); y += 40;
      const sk = Object.entries(r.skills);
      text(sk.length ? sk.map(([k, v]) => `${SKILL_INFO[k].name} ×${v}`).join(' · ') : 'Hediye kutusu vuramadın', cx, y, m * 0.036, '#7dff9a', 800); y += 50;
    } else { text('Bu bonus daha önce alındı', cx, y, m * 0.038, 'rgba(255,255,255,0.7)', 700); y += 60; }
  } else if (r.win) {
    text(lv.boss ? 'BOSS YENİLDİ!' : r.stars === 3 ? 'KUSURSUZ!' : 'GEÇTİN!', cx, y, m * 0.07, th.accent, 900); y += 64;
    const pop = (i) => clamp((stateT - delay - 0.15 - i * 0.15) * 5, 0, 1);
    for (let i = 0; i < 3; i++) {
      const sx = cx + (i - 1) * m * 0.15, got = i < r.stars, s = m * (i === 1 ? 0.15 : 0.12) * (got ? 0.6 + 0.4 * pop(i) : 0.9);
      ctx.save(); if (!got) { ctx.globalAlpha *= 0.35; ctx.filter = 'grayscale(1) brightness(0.6)'; } else ctx.globalAlpha *= pop(i);
      sprite('star', sx, y - (i === 1 ? 8 : 0), s); ctx.restore();
    }
    y += 62;
    text(`Saplanan iğne: ${stuckCount} / ${lv.thresholds[2]}`, cx, y, m * 0.038, '#fff', 800); y += 34;
    text(r.gold > 0 ? `+${r.gold} altın` : 'Altın yok: sadece yeni yıldız ödül verir', cx, y, m * (r.gold > 0 ? 0.04 : 0.032), r.gold > 0 ? '#ffd34d' : 'rgba(255,255,255,0.6)', r.gold > 0 ? 900 : 700); y += 30;
    if (r.coins) { text(`Toplanan para: +${r.coins}`, cx, y, m * 0.032, '#ffd34d', 700); y += 26; }
    if (r.stars < 3) text(`★★★ için ${lv.thresholds[r.stars]} iğne sapla`, cx, y + 4, m * 0.032, 'rgba(255,255,255,0.7)', 600);
    y += 30;
  } else {
    text(r.reason === 'time' ? 'SÜRE DOLDU' : 'YETERSİZ İĞNE', cx, y, m * 0.068, '#ff6b81', 900); y += 56;
    text(`Saplanan: ${r.got} · Geçmek için: ${r.need}`, cx, y, m * 0.04, '#fff', 800); y += 36;
    text(r.reason === 'time' ? 'Süreli bölümde +15 Saniye jokeri işe yarar' : '+2 İğne jokeri bir sonraki denemede yardım eder', cx, y, m * 0.03, 'rgba(255,255,255,0.7)', 600); y += 30;
    if (r.coins) { text(`Toplanan para korundu: +${r.coins}`, cx, y, m * 0.032, '#ffd34d', 700); }
    y += 40;
  }
  // düğmeler
  const bh = 50, gap = 10, bw3 = (pw - 40 - gap * 2) / 3, by = py + ph - bh - 22;
  const nxt = !r.bonus && r.win ? nextNodeAfter(lv.id) : null;
  const canNext = r.win && (r.bonus || (nxt && nodeUnlocked(nxt)));
  textButton('Harita', px + 20, by, bw3, bh, () => goMap(), '#7aa7ff', '#0d1430');
  textButton('Tekrar', px + 20 + bw3 + gap, by, bw3, bh, () => startLevel(curNode), '#ffb84d', '#1a1030', !(r.bonus));
  textButton(canNext ? 'Sonraki' : 'Market', px + 20 + (bw3 + gap) * 2, by, bw3, bh, () => {
    if (canNext) { if (r.bonus) goMap(); else if (nxt.kind === 'milestone') { goMap(); openMilestone(nxt.c); } else startLevel(nxt); }
    else openMarket();
  }, canNext ? '#58d68d' : '#c89bff', '#0b2015');
  ctx.globalAlpha = 1;
}

function drawPauseMenu(m) {
  uiButtons = [];
  ctx.fillStyle = 'rgba(6,4,16,0.88)'; ctx.fillRect(0, 0, W, H);
  const pw = Math.min(W - 32, 420), px = cx - pw / 2;
  let y = Math.max(SAFE.top + 50, H * 0.14);
  text('DURAKLATILDI', cx, y, m * 0.08, '#fff', 900); y += m * 0.1;
  const bb = m * 0.18;
  iconButton('ui_play', cx - bb * 1.5 - 16, y, bb, () => setPaused(false), '▶');
  iconButton('ui_restart', cx - bb / 2, y, bb, () => startLevel(curNode), '↻');
  iconButton('map', cx + bb / 2 + 16, y, bb, () => goMap(), 'H');
  text('Devam', cx - bb - 16, y + bb + 16, m * 0.034, 'rgba(255,255,255,0.8)', 700);
  text('Baştan', cx, y + bb + 16, m * 0.034, 'rgba(255,255,255,0.8)', 700);
  text('Harita', cx + bb + 16, y + bb + 16, m * 0.034, 'rgba(255,255,255,0.8)', 700);
  y += bb + 60;
  drawToggles(px, y, pw, m);
}
function drawToggles(px, y, pw, m) {
  const toggles = [['ui_music', 'Müzik', 'music'], ['sound', 'Ses', 'sound'], ['ui_vibe', 'Titreşim', 'vibe'], ['ui_shake', 'Sarsıntı', 'shake']];
  const ts = Math.min(m * 0.14, 64), tg = (pw - ts * 4) / 3;
  toggles.forEach(([icon, label, key], i) => {
    const x = px + i * (ts + tg);
    iconButton(icon, x, y, ts, () => { settings[key] = !settings[key]; saveSettings(); if (key === 'vibe' && settings.vibe) vibrate(30); }, label[0], !settings[key]);
    if (!settings[key]) { ctx.strokeStyle = '#ff6b81'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x + ts * 0.18, y + ts * 0.82); ctx.lineTo(x + ts * 0.82, y + ts * 0.18); ctx.stroke(); }
    text(label, x + ts / 2, y + ts + 14, m * 0.03, settings[key] ? '#fff' : 'rgba(255,255,255,0.45)', 700);
  });
  return ts + 40;
}
