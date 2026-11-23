// İğne Ustası: giriş ekranı, harita, mihenk taşı, market, ayarlar, giriş (dokunma) ve döngü
'use strict';
let mapScroll = 0, toast = null, resetArmed = false;

function showToast(msg) { toast = { text: msg, start: performance.now() }; }
function goMap() {
  screen = 'map'; paused = false; overlay = null; state = 'play';
  if (curNode) viewChapter = curNode.c;
  lv = null; scrollToCurrent(); musicUpdate();
}
function setPaused(p) {
  if (screen !== 'play' || p === paused) return;
  if (p && state !== 'play' && state !== 'bossintro') return;
  paused = p; musicUpdate();
}
function openMarket() {
  if (screen === 'play' && (state === 'play' || state === 'bossintro')) paused = true;
  overlay = { type: 'market' }; musicUpdate();
}
function closeOverlay() {
  const wasMarket = overlay && overlay.type === 'market';
  overlay = null;
  if (screen === 'play' && wasMarket && (state === 'play' || state === 'bossintro')) paused = false;
  musicUpdate();
}
function openMilestone(c) { overlay = { type: 'milestone', c }; }

// ---------- giriş ekranı ----------
function drawTitle() {
  const m = Math.min(W, H);
  const bg = IMG.bg1; if (bg) drawCover(bg, 0.1); else { ctx.fillStyle = '#1b1640'; ctx.fillRect(0, 0, W, H); }
  glowAt(cx, cy, R * 4.2, '#ffb84d55');
  const orb = IMG.orb1;
  for (let k = 0; k < 4; k++) { const wa = rot + k * TAU / 4 + 0.3; drawPin(cx + Math.cos(wa) * R * 0.9, cy + Math.sin(wa) * R * 0.9, wa, L + R * 0.1); }
  if (orb) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.drawImage(orb, -R, -R, R * 2, R * 2); ctx.restore(); }
  text('İĞNE USTASI', cx, H * 0.64, m * 0.1, '#fff', 900);
  ctx.globalAlpha = 0.6 + 0.35 * Math.sin(performance.now() / 300);
  text('Başlamak için dokun', cx, H * 0.72, m * 0.045, '#fff', 700);
  ctx.globalAlpha = 1;
  text('İğneleri dönen küreye sapla.', cx, H * 0.79, m * 0.034, 'rgba(255,255,255,0.65)', 500);
  text('Ne kadar çok iğne, o kadar çok yıldız.', cx, H * 0.79 + m * 0.05, m * 0.034, 'rgba(255,255,255,0.65)', 500);
  if (totalStars() > 0) {
    const ty = Math.min(H * 0.9, H - SAFE.bottom - m * 0.06);
    sprite('ui_trophy', cx - m * 0.17, ty, m * 0.08);
    text(`★ ${totalStars()}   ·   Kısım ${maxOpenChapter()}`, cx + m * 0.03, ty, m * 0.04, '#ffd34d', 900);
  }
  addButton(0, 0, W, H, () => { audio(); screen = 'map'; viewChapter = maxOpenChapter(); scrollToCurrent(); musicUpdate(); });
}

// ---------- harita ----------
const mapSpacing = () => clamp(H * 0.12, 78, 118);
const mapBaseY = () => H - SAFE.bottom - 90;
const mapHeaderH = () => SAFE.top + 104;
function mapNodePos(k) {
  return { x: cx + Math.sin(k * 0.95 + 0.4) * Math.min(W * 0.3, 150), y: mapBaseY() - k * mapSpacing() + mapScroll };
}
const mapMaxScroll = () => Math.max(0, 11 * mapSpacing() - (mapBaseY() - mapHeaderH() - 70));
function scrollToCurrent() {
  const nodes = chapterNodes(viewChapter);
  let k = nodes.findIndex(nd => nd.kind !== 'bonus' && nodeUnlocked(nd) && (nd.kind === 'milestone' ? !P.ms[viewChapter] : !starsOf(nd.id)));
  if (k < 0) k = nodes.length - 1;
  mapScroll = clamp(k * mapSpacing() - (mapBaseY() - H * 0.55), 0, mapMaxScroll());
}

function drawMap() {
  const m = Math.min(W, H), c = viewChapter, open = chapterOpen(c), tnow = now();
  const bg = IMG['map' + ((c - 1) % 3 + 1)];
  if (bg) drawCover(bg, 0.05); else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5aa8ff'); g.addColorStop(1, '#bfe6ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  const nodes = chapterNodes(c), pos = nodes.map((_, k) => mapNodePos(k));
  ctx.save(); ctx.beginPath(); ctx.rect(0, mapHeaderH(), W, H); ctx.clip(); // yol ve balonlar başlığın altına girmesin

  // kıvrılan yol
  const path = () => { ctx.beginPath(); ctx.moveTo(pos[0].x, pos[0].y + 40); ctx.lineTo(pos[0].x, pos[0].y);
    for (let k = 1; k < pos.length; k++) { const p0 = pos[k - 1], p1 = pos[k]; ctx.bezierCurveTo(p0.x, (p0.y + p1.y) / 2, p1.x, (p0.y + p1.y) / 2, p1.x, p1.y); } };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(40,30,20,0.35)'; ctx.lineWidth = 22; path(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,240,210,0.95)'; ctx.lineWidth = 14; path(); ctx.stroke();
  ctx.setLineDash([2, 16]); ctx.strokeStyle = 'rgba(200,150,90,0.9)'; ctx.lineWidth = 5; path(); ctx.stroke(); ctx.setLineDash([]);

  const cur = nodes.find(nd => nd.kind !== 'bonus' && nodeUnlocked(nd) && (nd.kind === 'milestone' ? !P.ms[c] : !starsOf(nd.id)));
  const bh = clamp(mapSpacing() * 0.86, 64, 98);
  nodes.forEach((nd, k) => {
    const p = pos[k]; if (p.y < -120 || p.y > H + 120) return;
    const unlocked = nodeUnlocked(nd), isCur = cur && nd.id === cur.id, bob = Math.sin(tnow * 2 + k) * 3;
    if (nd.kind === 'milestone') {
      const req = milestoneReq(c), have = chapterStars(c), claimed = !!P.ms[c], ready = !claimed && have >= req && unlocked;
      if (ready) glowAt(p.x, p.y, bh * 2.4, `rgba(255,220,100,${0.5 + 0.3 * Math.sin(tnow * 4)})`);
      sprite('milestone', p.x, p.y - 6, bh * 1.15, unlocked || claimed ? 1 : 0.6);
      if (ready || (!claimed && unlocked)) sprite('chest', p.x + bh * 0.48, p.y + bh * 0.2, bh * 0.45);
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; roundRect(p.x - 62, p.y + bh * 0.5, 124, 26, 13); ctx.fill();
      text(claimed ? '✓ Geçildi' : `★ ${have} / ${req}`, p.x, p.y + bh * 0.5 + 14, 15, claimed ? '#7dff9a' : have >= req ? '#ffd34d' : '#fff', 900, 'center', false);
      if (p.y > mapHeaderH()) addButton(p.x - bh * 0.6, p.y - bh * 0.6, bh * 1.2, bh * 1.3, () => openMilestone(c));
      return;
    }
    const st = starsOf(nd.id), done = nd.kind === 'bonus' ? !!P.bonus[nd.id] : st > 0;
    let spr = !open || !unlocked ? 'bal_lock' : nd.kind === 'boss' ? 'bal_boss' : nd.kind === 'bonus' ? 'bal_bonus' : nd.kind === 'timed' ? 'bal_timed' : done ? 'bal_gold' : 'bal_blue';
    const size = (nd.kind === 'bonus' ? bh * 0.8 : bh) * (isCur ? 1.08 + 0.04 * Math.sin(tnow * 5) : 1);
    if (isCur) glowAt(p.x, p.y - size * 0.15, size * 1.9, 'rgba(255,255,255,0.55)');
    if (!sprite(spr, p.x, p.y + bob - size * 0.1, size)) { ctx.fillStyle = unlocked ? '#4aa3ff' : '#888'; ctx.beginPath(); ctx.arc(p.x, p.y + bob - size * 0.2, size * 0.35, 0, TAU); ctx.fill(); }
    const label = nd.kind === 'bonus' ? 'BONUS' : nd.id;
    if (spr !== 'bal_lock' && nd.kind !== 'timed' && nd.kind !== 'bonus' && nd.kind !== 'boss') {
      ctx.font = `900 ${Math.round(size * 0.22)}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.strokeText(label, p.x, p.y + bob - size * 0.22);
      ctx.fillStyle = '#fff'; ctx.fillText(label, p.x, p.y + bob - size * 0.22);
    } else {
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; roundRect(p.x - 30, p.y + bob - size * 0.05, 60, 20, 10); ctx.fill();
      text(label, p.x, p.y + bob - size * 0.05 + 10, 13, '#fff', 900, 'center', false);
    }
    if (nd.kind !== 'bonus' && unlocked) drawStars(p.x, p.y + size * 0.42, size * 0.2, st);
    if (nd.kind === 'bonus' && done) text('✓ Alındı', p.x, p.y + size * 0.42, 13, '#7dff9a', 900);
    if (isCur) { // zıplayan ok
      const ay = p.y - size * 0.75 + Math.sin(tnow * 6) * 6;
      ctx.fillStyle = '#ffd34d'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(p.x - 12, ay - 12); ctx.lineTo(p.x + 12, ay - 12); ctx.lineTo(p.x, ay + 4); ctx.closePath(); ctx.fill(); ctx.stroke();
    }
    if (p.y > mapHeaderH()) addButton(p.x - size * 0.45, p.y - size * 0.6, size * 0.9, size * 1.15, () => {
      if (!open) { showToast(`Önce Kısım ${c - 1} mihenk taşını geç`); return; }
      if (!unlocked) { showToast(nd.kind === 'bonus' ? `Bonus için ${c}-5'i geç` : 'Önce önceki bölümü geç'); return; }
      if (nd.kind === 'bonus' && P.bonus[nd.id]) { showToast('Bu bonus alındı'); return; }
      startLevel(nd);
    });
  });
  ctx.restore();
  if (!open) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0, 0, W, H);
    sprite('lock', cx, H * 0.45, m * 0.22);
    text(`Kısım ${c} kilitli`, cx, H * 0.45 + m * 0.18, m * 0.06, '#fff', 900);
    text(`Kısım ${c - 1} mihenk taşında ★ ${milestoneReq(c - 1)} gerekli`, cx, H * 0.45 + m * 0.25, m * 0.036, 'rgba(255,255,255,0.8)', 700);
  }

  // üst bar
  const top = SAFE.top + 10, left = 14 + SAFE.left, right = W - 14 - SAFE.right;
  const hg = ctx.createLinearGradient(0, 0, 0, mapHeaderH() + 20);
  hg.addColorStop(0, 'rgba(10,8,30,0.92)'); hg.addColorStop(0.8, 'rgba(10,8,30,0.7)'); hg.addColorStop(1, 'rgba(10,8,30,0)');
  ctx.fillStyle = hg; ctx.fillRect(0, 0, W, mapHeaderH() + 20);
  iconButton('ui_settings', left, top, 40, () => { overlay = { type: 'settings' }; resetArmed = false; }, '⚙');
  coinPill(right - 58, top + 5, 32, P.gold);
  iconButton('shop', right - 44, top - 2, 44, () => openMarket(), '$');
  const ny = top + 64;
  iconButton(null, left, ny - 18, 36, c > 1 ? () => { viewChapter--; scrollToCurrent(); } : null, '‹', c <= 1);
  iconButton(null, right - 36, ny - 18, 36, c <= maxOpenChapter() ? () => { viewChapter++; scrollToCurrent(); } : null, '›', c > maxOpenChapter());
  text(`KISIM ${c}`, cx, ny - 8, m * 0.05, '#fff', 900);
  text(`${chapterName(c)}  ·  ★ ${chapterStars(c)} / 30`, cx, ny + 16, m * 0.032, '#ffd34d', 800);

  // alt: jokerler
  const sy = H - SAFE.bottom - 44;
  ctx.fillStyle = 'rgba(10,8,30,0.6)'; roundRect(cx - 140, sy - 6, 280, 44, 22); ctx.fill();
  ['slow', 'pins2', 'time15'].forEach((k, i) => {
    const x = cx - 90 + i * 90;
    sprite(SKILL_INFO[k].icon, x - 12, sy + 16, 34);
    text(`×${P.skills[k] || 0}`, x + 18, sy + 17, 16, '#fff', 900);
  });
  addButton(cx - 140, sy - 6, 280, 44, () => openMarket());
}

// ---------- pencereler ----------
function drawOverlay() {
  if (!overlay) return;
  const m = Math.min(W, H);
  uiButtons = [];
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
  addButton(0, 0, W, H, () => closeOverlay());
  if (overlay.type === 'market') drawMarket(m);
  if (overlay.type === 'settings') drawSettings(m);
  if (overlay.type === 'milestone') drawMilestone(m);
}
function closeX(px, py, pw) { iconButton(null, px + pw - 46, py + 10, 36, () => closeOverlay(), '✕'); }

function drawMarket(m) {
  const pw = Math.min(W - 24, 420), ph = Math.min(H - SAFE.top - SAFE.bottom - 40, 560), px = cx - pw / 2, py = Math.max(SAFE.top + 20, (H - ph) / 2);
  panel(px, py, pw, ph); addButton(px, py, pw, ph, () => {});
  closeX(px, py, pw);
  sprite('shop', px + 40, py + 34, 46);
  text('MARKET', px + 74, py + 34, m * 0.06, '#fff', 900, 'left');
  coinPill(px + pw - 56, py + 20, 30, P.gold);
  let y = py + 74;
  const rowH = clamp((ph - 300) / 3, 64, 82);
  for (const k of ['slow', 'pins2', 'time15']) {
    const info = SKILL_INFO[k];
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; roundRect(px + 12, y, pw - 24, rowH - 8, 14); ctx.fill();
    sprite(info.icon, px + 46, y + (rowH - 8) / 2, rowH * 0.62);
    text(`${info.name}  (${P.skills[k] || 0})`, px + 82, y + rowH * 0.3, 16, '#fff', 900, 'left', false);
    text(info.desc, px + 82, y + rowH * 0.58, 12, 'rgba(255,255,255,0.65)', 600, 'left', false);
    const p1 = info.price, p3 = Math.round(info.price * 2.5);
    const bw = 76, bh2 = Math.min(30, (rowH - 16) / 2), bx = px + pw - 22 - bw, byy = y + (rowH - 8) / 2 - bh2 - 2;
    textButton(`×1  ${p1}`, bx, byy, bw, bh2, () => buySkill(k, 1, p1), '#ffd34d', '#2a1a00', P.gold >= p1);
    textButton(`×3  ${p3}`, bx, byy + bh2 + 4, bw, bh2, () => buySkill(k, 3, p3), '#ffd34d', '#2a1a00', P.gold >= p3);
    y += rowH;
  }
  y += 6;
  text('ALTIN PAKETLERİ', px + 20, y + 10, 15, '#ffd34d', 900, 'left'); y += 28;
  const packs = [['pack_s', 500, '₺29,99'], ['pack_m', 1500, '₺69,99'], ['pack_l', 4000, '₺149,99']];
  const cw = (pw - 24 - 16) / 3;
  packs.forEach(([icon, amount, price], i) => {
    const x = px + 12 + i * (cw + 8);
    ctx.fillStyle = 'rgba(255,255,255,0.06)'; roundRect(x, y, cw, 128, 14); ctx.fill();
    sprite(icon, x + cw / 2, y + 36, 52);
    text(`${amount}`, x + cw / 2, y + 74, 17, '#ffd34d', 900, 'center', false);
    textButton(price, x + 8, y + 90, cw - 16, 30, () => showToast('Gerçek para ile satın alma, uygulama mağazaya çıkınca açılacak'), '#7aa7ff', '#0d1430');
  });
  y += 136;
  text('Gerçek para ödemesi henüz bağlı değil, fiyatlar örnektir.', cx, y + 8, 11, 'rgba(255,255,255,0.5)', 600);
}
function buySkill(k, n, price) {
  if (P.gold < price) { showToast('Yeterli altın yok'); return; }
  P.gold -= price; P.skills[k] = (P.skills[k] || 0) + n; saveProgress();
  sfx.coin(); showToast(`${SKILL_INFO[k].name} ×${n} alındı`);
}

function drawSettings(m) {
  const pw = Math.min(W - 32, 400), ph = 300, px = cx - pw / 2, py = (H - ph) / 2;
  panel(px, py, pw, ph); addButton(px, py, pw, ph, () => {});
  closeX(px, py, pw);
  text('AYARLAR', cx, py + 36, m * 0.06, '#fff', 900);
  drawToggles(px + 24, py + 76, pw - 48, m);
  ctx.globalAlpha = 1;
  const rt = resetArmed ? 'Emin misin? Tekrar dokun: her şey silinir' : 'İlerlemeyi sıfırla';
  text(rt, cx, py + ph - 40, 14, resetArmed ? '#ff6b81' : 'rgba(255,255,255,0.5)', 700);
  addButton(px + 20, py + ph - 62, pw - 40, 44, () => {
    if (!resetArmed) { resetArmed = true; return; }
    P = JSON.parse(JSON.stringify(DEFAULT_PROGRESS)); saveProgress();
    viewChapter = 1; overlay = null; scrollToCurrent(); showToast('İlerleme sıfırlandı');
  });
}

function drawMilestone(m) {
  const c = overlay.c, req = milestoneReq(c), have = chapterStars(c), claimed = !!P.ms[c];
  const reached = starsOf(`${c}-10`) > 0, ready = !claimed && reached && have >= req;
  const pw = Math.min(W - 32, 400), ph = 420, px = cx - pw / 2, py = (H - ph) / 2;
  panel(px, py, pw, ph); addButton(px, py, pw, ph, () => {});
  closeX(px, py, pw);
  text('MİHENK TAŞI', cx, py + 36, m * 0.06, '#ffd34d', 900);
  text(`Kısım ${c} · ${chapterName(c)}`, cx, py + 66, 14, 'rgba(255,255,255,0.7)', 700);
  sprite('milestone', cx, py + 128, 96);
  text(`★ ${have} / ${req}`, cx, py + 196, m * 0.06, have >= req ? '#7dff9a' : '#fff', 900);
  text(claimed ? 'Bu mihenk taşı geçildi' : !reached ? `Önce ${c}-10 boss bölümünü geç` : have >= req ? 'Yıldızlar yeterli!' : `${req - have} yıldız eksik: önceki bölümleri tekrar oyna`, cx, py + 230, 14, 'rgba(255,255,255,0.8)', 700);
  const r = milestoneReward(c);
  const items = [['coin', `+${r.gold}`], ['sk_slow', `×${r.slow}`], ['sk_pins2', `×${r.pins2}`], ['sk_time15', `×${r.time15}`]];
  const iw = (pw - 40) / items.length;
  text('Ödül', cx, py + 262, 13, 'rgba(255,255,255,0.55)', 700);
  items.forEach(([icon, label], i) => {
    const x = px + 20 + iw * (i + 0.5);
    sprite(icon, x, py + 298, 40, claimed ? 0.4 : 1);
    text(label, x, py + 330, 15, '#fff', 900);
  });
  if (ready) textButton('Ödülü al ve ilerle', px + 30, py + ph - 66, pw - 60, 48, () => claimMilestone(c), '#58d68d', '#0b2015');
  else if (claimed) textButton(`Kısım ${c + 1}'e git`, px + 30, py + ph - 66, pw - 60, 48, () => { viewChapter = c + 1; closeOverlay(); scrollToCurrent(); }, '#7aa7ff', '#0d1430');
  else textButton('Tamam', px + 30, py + ph - 66, pw - 60, 48, () => closeOverlay(), '#ffb84d');
}
function claimMilestone(c) {
  const r = milestoneReward(c);
  P.ms[c] = true; P.gold += r.gold;
  for (const k of ['slow', 'pins2', 'time15']) P.skills[k] = (P.skills[k] || 0) + (r[k] || 0);
  saveProgress(); sfx.win();
  overlay = null; viewChapter = c + 1; scrollToCurrent();
  showToast(`Kısım ${c + 1} açıldı! Ödüller eklendi`);
}

function drawToast() {
  if (!toast) return;
  toast.t = (performance.now() - toast.start) / 1000;
  if (toast.t > 2.4) { toast = null; return; }
  const a = Math.min(1, toast.t * 6) * Math.min(1, (2.4 - toast.t) * 3);
  ctx.globalAlpha = a;
  ctx.font = `800 15px ${FONT}`; const w = Math.min(W - 40, ctx.measureText(toast.text).width + 40);
  ctx.fillStyle = 'rgba(10,8,30,0.92)'; roundRect(cx - w / 2, H - SAFE.bottom - 120, w, 42, 21); ctx.fill();
  text(toast.text, cx, H - SAFE.bottom - 99, 15, '#fff', 800, 'center', false);
  ctx.globalAlpha = 1;
}

// ---------- çizim ----------
function draw() {
  uiButtons = [];
  if (screen === 'title') drawTitle();
  else if (screen === 'map') drawMap();
  else drawPlay();
  drawOverlay();
  drawToast();
}

// ---------- giriş: oyunda dokununca atış, diğer ekranlarda dokun-bırak ve kaydırma ----------
let down = null;
function hit(mx, my) {
  for (let i = uiButtons.length - 1; i >= 0; i--) {
    const b = uiButtons[i];
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) { if (b.action) { audio(); b.action(); } return true; }
  }
  return false;
}
const playActive = () => screen === 'play' && !paused && !overlay && (state === 'play' || state === 'bossintro');
cv.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  down = { x: e.clientX, y: e.clientY, ly: e.clientY, moved: 0, id: e.pointerId };
  if (playActive()) { down.handled = true; if (!hit(e.clientX, e.clientY)) throwPin(); }
});
cv.addEventListener('pointermove', (e) => {
  if (!down || down.id !== e.pointerId) return;
  const dy = e.clientY - down.ly; down.ly = e.clientY; down.moved += Math.abs(dy);
  if (screen === 'map' && !overlay && down.moved > 8) mapScroll = clamp(mapScroll + dy, 0, mapMaxScroll());
});
cv.addEventListener('pointerup', (e) => {
  if (!down) return;
  const d = down; down = null;
  if (d.handled || d.moved > 10) return;
  hit(e.clientX, e.clientY);
});
cv.addEventListener('pointercancel', () => { down = null; });
cv.addEventListener('wheel', (e) => { if (screen === 'map' && !overlay) mapScroll = clamp(mapScroll - e.deltaY, 0, mapMaxScroll()); }, { passive: true });
cv.addEventListener('contextmenu', (e) => e.preventDefault());
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') { e.preventDefault(); if (!e.repeat) { if (paused && !overlay) setPaused(false); else throwPin(); } }
  if (e.code === 'Escape' || e.code === 'KeyP') { if (overlay) closeOverlay(); else setPaused(!paused); }
  if (e.code === 'Digit1') useSkill('slow');
  if (e.code === 'Digit2') useSkill('pins2');
  if (e.code === 'Digit3') useSkill('time15');
});
window.addEventListener('resize', () => { layout(); mapScroll = clamp(mapScroll, 0, mapMaxScroll()); });
document.addEventListener('visibilitychange', () => { if (document.hidden && playActive()) setPaused(true); musicUpdate(); });
window.addEventListener('blur', () => { if (playActive() && !SIM) setPaused(true); });
