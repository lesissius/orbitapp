// İğne Ustası: başlangıç, sabit adımlı döngü, çevrimdışı destek, test kancası
'use strict';
const STEP = 1 / 120;
let last = performance.now(), acc = 0;
function frame(nowMs) {
  acc += Math.min(0.1, (nowMs - last) / 1000); last = nowMs;
  if (paused || overlay) acc = 0;
  while (acc >= STEP) { update(STEP); acc -= STEP; }
  draw();
  requestAnimationFrame(frame);
}
layout();
viewChapter = maxOpenChapter();
requestAnimationFrame(frame);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// Test kancası (konsoldan): __igne.sim('1-3'), __igne.start('2-10'), __igne.P
window.__igne = {
  get state() { return { screen, state, id: lv && lv.id, pinsLeft, stuckCount, timeLeft: lv && lv.timeLimit ? +timeLeft.toFixed(1) : null, paused, overlay: overlay && overlay.type }; },
  get P() { return P; },
  start(id) { startLevel(findNode(id)); },
  map() { goMap(); },
  sim: simLevel,
  throw: throwPin,
  skill: useSkill,
  finish(n) { stuckCount = n; finishLevel(false); },
};
