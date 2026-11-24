// Orbitapp: canlı sahne — temalı hareketli arka plan ve içi çalkalanan küre
'use strict';

// ---------- sahne durumu ----------
const scene = { c: 0, slosh: 0, sloshV: 0, wave: 0, lastRot: 0, omega: 0, inner: [], back: [], ripples: [], flashT: 0, nextFlash: 4 };
const orbBuf = document.createElement('canvas'), orbCtx = orbBuf.getContext('2d');

function sceneReset(c) {
  const th = THEMES[(c - 1) % THEMES.length];
  scene.c = c; scene.slosh = scene.sloshV = scene.wave = 0; scene.lastRot = rot; scene.omega = 0; scene.ripples = [];
  scene.inner = Array.from({ length: 22 }, () => ({ a: Math.random() * TAU, r: Math.sqrt(Math.random()) * 0.82, w: 0, s: 0.5 + Math.random(), ph: Math.random() * TAU }));
  scene.back = Array.from({ length: th.back === 'rain' ? 60 : th.back === 'snow' ? 45 : 24 }, () => ({ x: Math.random(), y: Math.random(), z: 0.3 + Math.random() * 0.9, ph: Math.random() * TAU, rot: Math.random() * TAU }));
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

// ---------- arka plan: GPT ile çizilmiş sahne (canlılar çizimin içinde) + yavaş kayma + hafif parçacıklar ----------
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
