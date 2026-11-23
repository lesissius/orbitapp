// Orbitapp: canlı sahne — temalı hareketli arka plan ve içi çalkalanan küre
'use strict';

// ---------- kodla çizilen sevimli canlılar (sağa bakar); GPT çizimleri gelirse IMG['c_' + ad] onların yerine geçer ----------
function mk(w, h, fn) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.lineJoin = x.lineCap = 'round'; fn(x, w, h); c.complete = true; c.naturalWidth = w; return c; }
const OUTL = '#3a2410';
function eye(x, X, Y, r) { x.fillStyle = '#fff'; x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill(); x.fillStyle = '#1b1020'; x.beginPath(); x.arc(X + r * 0.25, Y, r * 0.6, 0, TAU); x.fill(); x.fillStyle = '#fff'; x.beginPath(); x.arc(X + r * 0.45, Y - r * 0.3, r * 0.22, 0, TAU); x.fill(); }
function rg(x, X, Y, r, a, b) { const gr = x.createRadialGradient(X - r * 0.35, Y - r * 0.4, r * 0.1, X, Y, r); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; }
function wings(x, X, Y, s, c1, c2, op = 0.75) { x.globalAlpha = op; x.fillStyle = c1; x.strokeStyle = c2; x.lineWidth = s * 0.04;
  x.beginPath(); x.ellipse(X - s * 0.15, Y - s * 0.32, s * 0.2, s * 0.32, -0.5, 0, TAU); x.fill(); x.stroke();
  x.beginPath(); x.ellipse(X + s * 0.12, Y - s * 0.3, s * 0.16, s * 0.28, 0.4, 0, TAU); x.fill(); x.stroke(); x.globalAlpha = 1; }
let CRIT = null;
function buildCritters() {
  if (CRIT) return CRIT;
  CRIT = {
  bee: mk(300, 240, (x) => { wings(x, 150, 120, 300, '#e9fbff', '#9bc7d8');
    x.fillStyle = rg(x, 150, 140, 95, '#ffe680', '#f5a300'); x.strokeStyle = OUTL; x.lineWidth = 7;
    x.beginPath(); x.ellipse(150, 145, 95, 70, 0, 0, TAU); x.fill(); x.stroke();
    x.save(); x.clip(); x.fillStyle = '#3a2410'; for (const sx of [105, 150]) { x.beginPath(); x.ellipse(sx, 145, 13, 80, 0.1, 0, TAU); x.fill(); } x.restore();
    x.beginPath(); x.ellipse(150, 145, 95, 70, 0, 0, TAU); x.stroke();
    x.fillStyle = OUTL; x.beginPath(); x.moveTo(52, 150); x.lineTo(28, 158); x.lineTo(56, 168); x.fill();
    eye(x, 205, 128, 17); x.fillStyle = '#ff8a8a'; x.globalAlpha = .6; x.beginPath(); x.arc(212, 165, 11, 0, TAU); x.fill(); x.globalAlpha = 1;
    x.strokeStyle = OUTL; x.lineWidth = 5; x.beginPath(); x.moveTo(200, 85); x.quadraticCurveTo(205, 55, 225, 50); x.moveTo(220, 90); x.quadraticCurveTo(235, 65, 255, 66); x.stroke(); }),
  butterfly_o: null, butterfly_b: null,
  fish: mk(300, 200, (x) => { x.strokeStyle = OUTL; x.lineWidth = 6;
    x.fillStyle = '#ff7a1a'; x.beginPath(); x.moveTo(70, 100); x.lineTo(15, 45); x.quadraticCurveTo(35, 100, 15, 155); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = rg(x, 160, 95, 105, '#ffe066', '#ff8a00'); x.beginPath(); x.ellipse(160, 100, 105, 70, 0, 0, TAU); x.fill(); x.stroke();
    x.save(); x.clip(); x.fillStyle = '#fff'; for (const sx of [120, 175]) { x.beginPath(); x.ellipse(sx, 100, 12, 80, 0, 0, TAU); x.fill(); } x.restore();
    x.beginPath(); x.ellipse(160, 100, 105, 70, 0, 0, TAU); x.stroke();
    x.fillStyle = '#ff7a1a'; x.beginPath(); x.moveTo(130, 35); x.quadraticCurveTo(160, 0, 200, 38); x.closePath(); x.fill(); x.stroke();
    eye(x, 220, 85, 16); x.beginPath(); x.arc(250, 115, 10, 0.2, 1.8); x.stroke(); }),
  seagull: mk(300, 200, (x) => { x.strokeStyle = OUTL; x.lineWidth = 6; x.fillStyle = '#ffffff';
    x.beginPath(); x.moveTo(140, 105); x.quadraticCurveTo(70, 20, 10, 40); x.quadraticCurveTo(80, 70, 120, 125); x.fill(); x.stroke();
    x.beginPath(); x.ellipse(160, 125, 85, 40, -0.1, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = '#e8eef5'; x.beginPath(); x.moveTo(170, 110); x.quadraticCurveTo(220, 15, 290, 30); x.quadraticCurveTo(230, 70, 195, 130); x.fill(); x.stroke();
    x.fillStyle = '#ffb020'; x.beginPath(); x.moveTo(240, 110); x.lineTo(285, 122); x.lineTo(240, 132); x.fill(); x.stroke(); eye(x, 225, 110, 9); }),
  cloud: mk(320, 190, (x) => { const c = x.createLinearGradient(0, 30, 0, 180); c.addColorStop(0, '#ffffff'); c.addColorStop(1, '#ffc6ea'); x.fillStyle = c;
    x.shadowColor = 'rgba(255,120,200,.35)'; x.shadowBlur = 18;
    for (const [X, Y, r] of [[80, 120, 55], [150, 90, 70], [225, 105, 60], [270, 135, 40], [45, 145, 35], [160, 140, 55]]) { x.beginPath(); x.arc(X, Y, r, 0, TAU); x.fill(); } }),
  balloon: mk(220, 300, (x) => { x.strokeStyle = OUTL; x.lineWidth = 6;
    x.beginPath(); x.moveTo(110, 20); x.bezierCurveTo(210, 20, 210, 150, 130, 200); x.lineTo(90, 200); x.bezierCurveTo(10, 150, 10, 20, 110, 20); x.closePath();
    x.save(); x.clip(); const cs = ['#ff6fb5', '#ffe066', '#ff6fb5', '#ffe066', '#ff6fb5']; cs.forEach((c, k) => { x.fillStyle = c; x.fillRect(k * 44, 0, 44, 220); }); x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(75, 80, 22, 45, -0.3, 0, TAU); x.fill(); x.restore(); x.stroke();
    x.lineWidth = 4; x.beginPath(); x.moveTo(92, 200); x.lineTo(90, 245); x.moveTo(128, 200); x.lineTo(130, 245); x.stroke();
    x.fillStyle = '#b8743a'; x.lineWidth = 6; x.beginPath(); x.roundRect(80, 240, 60, 42, 8); x.fill(); x.stroke(); }),
  leaf: mk(200, 140, (x) => { x.strokeStyle = '#6b4a12'; x.lineWidth = 5; const c = x.createLinearGradient(20, 0, 180, 140); c.addColorStop(0, '#d6f05a'); c.addColorStop(1, '#ff9a2a'); x.fillStyle = c;
    x.beginPath(); x.moveTo(15, 70); x.quadraticCurveTo(90, -10, 185, 70); x.quadraticCurveTo(90, 150, 15, 70); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(15, 70); x.lineTo(185, 70); for (const k of [60, 100, 140]) { x.moveTo(k, 70); x.lineTo(k + 20, 40); x.moveTo(k, 70); x.lineTo(k + 20, 100); } x.stroke(); }),
  comet: mk(360, 120, (x) => { const c = x.createLinearGradient(300, 0, 0, 0); c.addColorStop(0, 'rgba(255,250,200,.95)'); c.addColorStop(1, 'rgba(160,200,255,0)'); x.fillStyle = c;
    x.beginPath(); x.moveTo(300, 40); x.lineTo(0, 55); x.lineTo(0, 65); x.lineTo(300, 80); x.fill();
    x.fillStyle = rg(x, 300, 60, 32, '#ffffff', '#ffe066'); x.shadowColor = '#fff6a8'; x.shadowBlur = 30; x.beginPath(); x.arc(300, 60, 26, 0, TAU); x.fill(); }),
  planet: mk(300, 220, (x) => { x.strokeStyle = OUTL; x.lineWidth = 6;
    x.save(); x.translate(150, 110); x.rotate(-0.3); x.strokeStyle = '#ffb35c'; x.lineWidth = 14; x.beginPath(); x.ellipse(0, 0, 135, 32, 0, Math.PI, TAU); x.stroke(); x.restore();
    x.fillStyle = rg(x, 150, 110, 80, '#7ff3e0', '#1f8fa0'); x.beginPath(); x.arc(150, 110, 78, 0, TAU); x.fill();
    x.fillStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.ellipse(150, 95, 75, 14, -0.1, 0, TAU); x.fill(); x.beginPath(); x.ellipse(150, 135, 70, 10, -0.1, 0, TAU); x.fill();
    x.save(); x.translate(150, 110); x.rotate(-0.3); x.strokeStyle = '#ffb35c'; x.lineWidth = 14; x.beginPath(); x.ellipse(0, 0, 135, 32, 0, 0, Math.PI); x.stroke(); x.restore(); }),
  phoenix: mk(320, 220, (x) => { x.strokeStyle = '#7a1a10'; x.lineWidth = 6;
    x.fillStyle = '#ffb020'; x.beginPath(); x.moveTo(90, 130); x.quadraticCurveTo(20, 150, 5, 200); x.quadraticCurveTo(60, 160, 110, 150); x.fill(); x.stroke();
    x.beginPath(); x.moveTo(95, 125); x.quadraticCurveTo(25, 110, 10, 140); x.quadraticCurveTo(60, 135, 100, 140); x.fill(); x.stroke();
    x.fillStyle = rg(x, 170, 130, 75, '#ffcf4a', '#ff4a1a'); x.beginPath(); x.ellipse(170, 135, 75, 42, -0.15, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = '#ff7a2a'; x.beginPath(); x.moveTo(160, 120); x.quadraticCurveTo(170, 20, 260, 15); x.quadraticCurveTo(220, 70, 200, 130); x.fill(); x.stroke();
    x.fillStyle = '#ffd64a'; x.beginPath(); x.moveTo(250, 110); x.lineTo(300, 122); x.lineTo(250, 132); x.fill(); x.stroke();
    x.fillStyle = '#ffd64a'; x.beginPath(); x.moveTo(225, 95); x.lineTo(235, 70); x.lineTo(245, 92); x.fill(); eye(x, 232, 112, 10); }),
  shard: mk(140, 240, (x) => { x.strokeStyle = '#6a0a1e'; x.lineWidth = 5;
    const p = [[70, 10], [125, 80], [100, 230], [40, 230], [15, 80]]; const c = x.createLinearGradient(0, 0, 140, 240); c.addColorStop(0, '#ff8aa0'); c.addColorStop(1, '#c4002e'); x.fillStyle = c;
    x.beginPath(); p.forEach(([a, b], k) => k ? x.lineTo(a, b) : x.moveTo(a, b)); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = 'rgba(255,255,255,.45)'; x.beginPath(); x.moveTo(70, 10); x.lineTo(15, 80); x.lineTo(55, 200); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(70, 10); x.lineTo(70, 230); x.stroke(); }),
};
function butterfly(c1, c2, dot) { return mk(260, 240, (x) => { x.strokeStyle = OUTL; x.lineWidth = 6;
  for (const [X, Y, rx, ry, a] of [[95, 85, 70, 60, -0.5], [165, 85, 70, 60, 0.5], [105, 160, 45, 40, 0.4], [155, 160, 45, 40, -0.4]]) {
    x.fillStyle = rg(x, X, Y, rx, c1, c2); x.beginPath(); x.ellipse(X, Y, rx, ry, a, 0, TAU); x.fill(); x.stroke();
    x.fillStyle = dot; x.beginPath(); x.arc(X + (X < 130 ? -12 : 12), Y - 5, rx * 0.25, 0, TAU); x.fill(); }
  x.fillStyle = OUTL; x.beginPath(); x.ellipse(130, 125, 13, 70, 0, 0, TAU); x.fill();
  x.lineWidth = 4; x.beginPath(); x.moveTo(125, 60); x.quadraticCurveTo(110, 20, 95, 18); x.moveTo(135, 60); x.quadraticCurveTo(150, 20, 165, 18); x.stroke(); }); }
  CRIT.butterfly_o = butterfly('#ffe27a', '#ff7a00', '#fff6d0');
  CRIT.butterfly_b = butterfly('#bff4ff', '#2f7bff', '#ffffff');
  return CRIT;
}

// ---------- sahne durumu ----------
const scene = { c: 0, slosh: 0, sloshV: 0, wave: 0, lastRot: 0, omega: 0, inner: [], back: [], actors: [], ripples: [], flashT: 0, nextFlash: 4 };
const orbBuf = document.createElement('canvas'), orbCtx = orbBuf.getContext('2d');

function sceneReset(c) {
  const th = THEMES[(c - 1) % THEMES.length];
  scene.c = c; scene.slosh = scene.sloshV = scene.wave = 0; scene.lastRot = rot; scene.omega = 0; scene.ripples = [];
  scene.inner = Array.from({ length: 22 }, () => ({ a: Math.random() * TAU, r: Math.sqrt(Math.random()) * 0.82, w: 0, s: 0.5 + Math.random(), ph: Math.random() * TAU }));
  scene.back = Array.from({ length: th.back === 'rain' ? 60 : th.back === 'snow' ? 45 : 24 }, () => ({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.9, ph: Math.random() * TAU, rot: Math.random() * TAU }));
  scene.actors = [];
  for (const [n, count, b, size] of th.cast) for (let k = 0; k < count; k++) { const a = { n, b, size }; spawnActor(a, true); scene.actors.push(a); }
  scene.actors.sort((p, q) => p.z - q.z);
}
function spawnActor(a, first) {
  a.z = 0.55 + Math.random() * 0.45; a.dir = Math.random() < 0.5 ? 1 : -1; a.ph = Math.random() * TAU; a.wait = 0;
  const m = 0.15;
  if (a.b === 'fly' || a.b === 'flutter' || a.b === 'swim' || a.b === 'drift') {
    a.x = first ? Math.random() : (a.dir > 0 ? -m : 1 + m);
    a.y = a.b === 'swim' ? 0.62 + Math.random() * 0.22 : 0.08 + Math.random() * 0.75;
    a.sp = a.b === 'drift' ? (0.006 + Math.random() * 0.01) * a.z : (0.04 + Math.random() * 0.04) * a.z;
  } else if (a.b === 'rise') { a.x = 0.08 + Math.random() * 0.84; a.y = first ? Math.random() : 1 + m; }
  else if (a.b === 'fall') { a.x = Math.random(); a.y = first ? Math.random() : -m; a.rot = Math.random() * TAU; }
  else if (a.b === 'float') { a.x = Math.random() < 0.5 ? 0.04 + Math.random() * 0.18 : 0.78 + Math.random() * 0.18; a.y = 0.1 + Math.random() * 0.75; a.rot = (Math.random() - 0.5) * 0.6; }
  else if (a.b === 'streak') { a.x = 1.1; a.y = Math.random() * 0.3; a.wait = first ? 1 + Math.random() * 3 : 3 + Math.random() * 5; }
}
// ok saplanınca: küre içi sarsılır ve saplandığı yerden dalga yayılır
function sceneKick(a) { scene.sloshV += 0.9 * (Math.random() < 0.5 ? -1 : 1) + scene.omega * 0.3; scene.wave = Math.min(1, scene.wave + 0.45); scene.ripples.push({ a, t: 0 }); }

function sceneUpdate(dt, c) {
  if (scene.c !== c) sceneReset(c);
  const om = dt > 0 ? (rot - scene.lastRot) / dt : 0; scene.lastRot = rot;
  const acc = dt > 0 ? (om - scene.omega) / dt : 0; scene.omega += (om - scene.omega) * Math.min(1, dt * 20);
  // yay-sönüm: küre hızlanınca/yön değiştirince içerik ters yöne savrulur, salınarak oturur
  scene.sloshV += (-clamp(acc, -40, 40) * 0.05 - scene.slosh * 26 - scene.sloshV * 3.2) * dt;
  scene.slosh = clamp(scene.slosh + scene.sloshV * dt, -0.5, 0.5);
  scene.wave = Math.min(1, scene.wave * Math.exp(-dt * 1.6) + Math.abs(scene.sloshV) * dt * 1.2);
  const th = THEMES[(c - 1) % THEMES.length];
  for (const p of scene.inner) {
    p.w += (scene.omega - p.w) * Math.min(1, dt * (0.8 + p.s * 0.6)); p.a += p.w * dt; p.ph += dt * (1 + p.s);
    if (th.inner === 'bubble') { p.r -= dt * 0.05 * p.s; if (p.r < 0.05) p.r = 0.85; }
  }
  for (const r of scene.ripples) r.t += dt;
  scene.ripples = scene.ripples.filter(r => r.t < 1);
  for (const a of scene.actors) {
    a.ph += dt;
    if (a.b === 'fly' || a.b === 'flutter' || a.b === 'swim' || a.b === 'drift') { a.x += a.dir * a.sp * dt; if (a.x < -0.25 || a.x > 1.25) spawnActor(a); }
    else if (a.b === 'rise') { a.y -= 0.022 * a.z * dt; if (a.y < -0.2) spawnActor(a); }
    else if (a.b === 'fall') { a.y += 0.05 * a.z * dt; a.x += Math.sin(a.ph * 1.3) * 0.03 * dt; a.rot += Math.sin(a.ph * 1.3) * 1.2 * dt; if (a.y > 1.15) spawnActor(a); }
    else if (a.b === 'streak') { if (a.wait > 0) a.wait -= dt; else { a.x -= 0.9 * dt; a.y += 0.45 * dt; if (a.x < -0.3) spawnActor(a); } }
  }
  for (const p of scene.back) {
    const sp = 0.012 + p.z * 0.03, k = th.back;
    if (k === 'bubble' || k === 'ember' || k === 'mote' || k === 'firefly') { p.y -= sp * dt * 1.0; p.x += Math.sin(gameTimeSec() + p.ph) * 0.02 * dt; }
    else if (k === 'petal' || k === 'confetti') { p.y += sp * dt * 0.8; p.x += (Math.sin(gameTimeSec() * 0.8 + p.ph) * 0.06 + 0.02) * dt; p.rot += dt * 1.5; }
    else if (k === 'snow') { p.y += sp * dt * 1.2; p.x += Math.sin(gameTimeSec() * 0.7 + p.ph) * 0.02 * dt; }
    else if (k === 'rain') { p.y += (0.6 + p.z * 0.6) * dt; p.x -= 0.12 * dt; }
    if (p.y < -0.05) p.y = 1.05; if (p.y > 1.05) p.y = -0.05; if (p.x > 1.05) p.x = -0.05; if (p.x < -0.05) p.x = 1.05;
  }
  if (th.storm) { scene.nextFlash -= dt; scene.flashT = Math.max(0, scene.flashT - dt * 2.5); if (scene.nextFlash <= 0) { scene.flashT = 1; scene.nextFlash = 5 + Math.random() * 6; } }
}
const gameTimeSec = () => performance.now() / 1000;

// küçük ortam parçacıkları ve küre içi parçacıklar
function drawBit(g, kind, x, y, s, rr, c) {
  g.fillStyle = c; g.strokeStyle = c;
  if (kind === 'bubble') { g.lineWidth = Math.max(1, s * 0.18); g.beginPath(); g.arc(x, y, s, 0, TAU); g.stroke(); g.beginPath(); g.arc(x - s * 0.35, y - s * 0.35, s * 0.25, 0, TAU); g.fill(); }
  else if (kind === 'petal') { g.save(); g.translate(x, y); g.rotate(rr); g.beginPath(); g.ellipse(0, 0, s * 1.1, s * 0.5, 0, 0, TAU); g.fill(); g.restore(); }
  else if (kind === 'confetti') { g.save(); g.translate(x, y); g.rotate(rr); g.fillStyle = ['#ff6fb5', '#ffe066', '#7ff3e0', '#b48cff', '#ffffff'][(rr * 10 | 0) % 5]; g.fillRect(-s * 0.8, -s * 0.35, s * 1.6, s * 0.7); g.restore(); }
  else if (kind === 'snow') { g.beginPath(); g.arc(x, y, s * 0.7, 0, TAU); g.fill(); }
  else if (kind === 'rain') { g.lineWidth = Math.max(1, s * 0.25); g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * 0.8, y - s * 4); g.stroke(); }
  else if (kind === 'star' || kind === 'spark' || kind === 'glint') { g.beginPath(); for (let k = 0; k < 8; k++) { const ang = k * Math.PI / 4 + rr, rad = k % 2 ? s * 0.35 : s * 1.4; g.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad); } g.fill(); }
  else { const gr = g.createRadialGradient(x, y, 0, x, y, s * 1.6); gr.addColorStop(0, c); gr.addColorStop(1, c + '00'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, s * 1.6, 0, TAU); g.fill(); }
}

// ---------- arka plan: GPT ile çizilmiş sahne + yavaş kayma + parçacıklar + canlılar ----------
function drawSceneBackground(c) {
  const th = THEMES[(c - 1) % THEMES.length], tn = gameTimeSec();
  const im = IMG['bg' + c] || IMG['bg' + ((c - 1) % 6 + 1)];
  if (im) {
    const z = 1.05 + Math.sin(tn * 0.2) * 0.02, sc = Math.max(W / im.width, H / im.height) * z;
    const px = Math.sin(tn * 0.15) * W * 0.012, py = Math.cos(tn * 0.11) * H * 0.006;
    ctx.drawImage(im, W / 2 - im.width * sc / 2 + px, H / 2 - im.height * sc / 2 + py, im.width * sc, im.height * sc);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, W, H);
  } else { const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.bg[0]); g.addColorStop(1, th.bg[1]); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  const unit = Math.min(W, H) / 400;
  for (const p of scene.back) {
    const s = (1.5 + p.z * 3) * unit;
    ctx.globalAlpha = (0.25 + p.z * 0.45) * (th.back === 'star' || th.back === 'firefly' ? 0.4 + 0.6 * Math.abs(Math.sin(tn * 1.5 + p.ph * 5)) : 1);
    drawBit(ctx, th.back, p.x * W, p.y * H, s, p.rot, th.backC);
  }
  ctx.globalAlpha = 1;
  const crit = buildCritters();
  for (const a of scene.actors) {
    const im2 = IMG['c_' + a.n] || crit[a.n]; if (!im2) continue;
    if (a.b === 'streak' && a.wait > 0) continue;
    let x = a.x * W, y = a.y * H, sx = 1, sy = 1, rr = 0;
    const Lc = R * a.size * (0.9 + a.z * 0.9);
    if (a.b === 'fly') { y += Math.sin(a.ph * 2.2) * Lc * 0.25; sy = 0.82 + 0.18 * Math.sin(a.ph * 22); }
    if (a.b === 'flutter') { y += Math.sin(a.ph * 1.6) * Lc * 0.5; sx = 0.3 + 0.7 * Math.abs(Math.sin(a.ph * 9)); rr = Math.sin(a.ph * 1.6) * 0.2; }
    if (a.b === 'swim') { y += Math.sin(a.ph * 1.4) * Lc * 0.15; rr = Math.sin(a.ph * 6) * 0.08; }
    if (a.b === 'rise') x += Math.sin(a.ph * 0.8) * Lc * 0.3;
    if (a.b === 'float') { y += Math.sin(a.ph * 1.1) * Lc * 0.25; rr = a.rot + Math.sin(a.ph * 0.9) * 0.25; }
    if (a.b === 'fall') rr = a.rot;
    if (a.b === 'drift') y += Math.sin(a.ph * 0.5) * Lc * 0.05;
    const mx = Math.max(im2.width, im2.height), w = Lc * im2.width / mx, h = Lc * im2.height / mx;
    ctx.save(); ctx.globalAlpha = 0.6 + a.z * 0.4; ctx.translate(x, y); ctx.rotate(rr);
    ctx.scale(a.dir < 0 && a.b !== 'drift' && a.b !== 'float' && a.b !== 'flutter' ? -sx : sx, sy);
    ctx.drawImage(im2, -w / 2, -h / 2, w, h); ctx.restore();
  }
  if (scene.flashT > 0) { ctx.fillStyle = `rgba(255,250,210,${scene.flashT * 0.35})`; ctx.fillRect(0, 0, W, H); }
}

// ---------- küre: gövde dönüşle döner, "sıvı" katman gecikip savrulur, şeritler dalgalanır, cam parlaması sabit kalır ----------
function drawLiveOrb(im, pr, c) {
  const th = THEMES[(c - 1) % THEMES.length];
  const S = Math.ceil(pr * 2 * Math.min(DPR, 1.5)); if (S < 8) return;
  if (orbBuf.width !== S) { orbBuf.width = orbBuf.height = S; }
  const sr = S / 2, k = S / (pr * 2), g = orbCtx;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, S, S);
  g.save(); g.translate(sr, sr); g.beginPath(); g.arc(0, 0, sr * 0.985, 0, TAU); g.clip();
  if (im) {
    g.save(); g.rotate(rot); g.drawImage(im, -sr, -sr, S, S); g.restore();
    g.save(); g.globalAlpha = 0.5; g.rotate(rot - scene.slosh * 1.6); const zz = 1.06 + Math.abs(scene.slosh) * 0.25; g.scale(zz, zz); g.drawImage(im, -sr, -sr, S, S); g.restore();
  } else { const og = g.createRadialGradient(-sr * 0.35, -sr * 0.4, sr * 0.1, 0, 0, sr); og.addColorStop(0, th.orb[0]); og.addColorStop(1, th.orb[1]); g.fillStyle = og; g.fillRect(-sr, -sr, S, S); }
  const tn = gameTimeSec();
  for (const p of scene.inner) {
    const a = p.a - scene.slosh * 0.8, rr = p.r * sr, s = (1.6 + p.s * 2.4) * k * (pr / 120);
    g.globalAlpha = th.inner === 'firefly' || th.inner === 'star' ? 0.45 + 0.55 * Math.max(0, Math.sin(p.ph * 2)) : 0.8;
    drawBit(g, th.inner, Math.cos(a) * rr, Math.sin(a) * rr, s, p.ph, th.innerC);
  }
  g.globalAlpha = 1;
  for (const r of scene.ripples) {
    const a = r.a + rot, x = Math.cos(a) * sr * 0.95, y = Math.sin(a) * sr * 0.95;
    g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - r.t)})`; g.lineWidth = sr * 0.05 * (1 - r.t);
    g.beginPath(); g.arc(x, y, sr * 1.2 * r.t, 0, TAU); g.stroke();
  }
  g.restore();
  // dalgalanma: yatay şeritler sinüsle kaydırılarak çizilir
  const amp = (1 + scene.wave * 6) * (pr / 120);
  ctx.save(); ctx.translate(cx, cy); ctx.beginPath(); ctx.arc(0, 0, pr, 0, TAU); ctx.clip();
  const step = 3;
  for (let y = -pr; y < pr; y += step) {
    const off = Math.sin(y / pr * 5 + tn * 4.2) * amp * Math.sqrt(Math.max(0, 1 - (y / pr) ** 2));
    ctx.drawImage(orbBuf, 0, (y + pr) * k, S, step * k + 1, -pr + off, y, pr * 2, step + 0.5);
  }
  // sabit cam parlaması ve kenar gölgesi
  const rim = ctx.createRadialGradient(0, 0, pr * 0.72, 0, 0, pr);
  rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(1, 'rgba(10,0,30,0.3)');
  ctx.fillStyle = rim; ctx.fillRect(-pr, -pr, pr * 2, pr * 2);
  const hl = ctx.createRadialGradient(-pr * 0.42, -pr * 0.5, 0, -pr * 0.42, -pr * 0.5, pr * 0.45);
  hl.addColorStop(0, 'rgba(255,255,255,0.7)'); hl.addColorStop(0.35, 'rgba(255,255,255,0.22)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hl; ctx.beginPath(); ctx.ellipse(-pr * 0.4, -pr * 0.48, pr * 0.38, pr * 0.24, -0.6, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = th.glow + 'aa'; ctx.lineWidth = Math.max(2, pr * 0.025); ctx.beginPath(); ctx.arc(cx, cy, pr * 0.995, 0, TAU); ctx.stroke();
}
