// GPT ile üretilen asılları (art/) oyunda kullanılan küçük dosyalara (assets/) çevirir.
// - art/orbs.png  (3×2, şeffaf) → assets/orb1..orb6.png (512 px)
// - art/parts.png (3×2, şeffaf) → assets/pin, pin_old, bomb, shield, star, sound .png
// - art/fx.png    (3×2, siyah)  → assets/fx_*.png (siyah zemin korunur, oyunda "lighter" karışımı)
// - art/bosses.png (3×1, şeffaf) → assets/boss1..boss3.png (512 px)
// - art/bg/bgN.png              → assets/bgN.webp (768×1152)
// Kullanım: node tools/build-art.mjs
import { createRequire } from 'node:module';
import { existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// sharp önce bu klasörde aranır (npm i sharp); yoksa SHARP_FROM ile başka bir projenin package.json yolu verilebilir.
let sharp;
try { sharp = createRequire(import.meta.url)('sharp'); }
catch {
  if (!process.env.SHARP_FROM) { console.error('sharp bulunamadı: "npm i sharp" çalıştırın ya da SHARP_FROM=<package.json yolu> verin.'); process.exit(1); }
  sharp = createRequire(process.env.SHARP_FROM)('sharp');
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const art = (p) => join(root, 'art', p);
const out = (p) => join(root, 'assets', p);
mkdirSync(join(root, 'assets'), { recursive: true });

const SHEETS = [
  { file: 'orbs.png', names: ['orb1', 'orb2', 'orb3', 'orb4', 'orb5', 'orb6'], size: 512, alpha: true },
  { file: 'parts.png', names: ['pin', 'pin_old', 'bomb', 'shield', 'star', 'sound'], size: 384, alpha: true },
  { file: 'fx.png', names: ['fx_boom', 'fx_ring', 'fx_spark', 'fx_gold', 'fx_metal', 'fx_glow'], size: 384, alpha: false },
  { file: 'bosses.png', names: ['boss1', 'boss2', 'boss3'], size: 512, alpha: true, rows: 1 },
  { file: 'map_items.png', names: ['bal_blue', 'bal_gold', 'bal_lock', 'bal_boss', 'bal_bonus', 'bal_timed', 'milestone', 'chest', 'coin'], size: 256, alpha: true, rows: 3 },
  { file: 'skills.png', names: ['sk_slow', 'sk_pins2', 'sk_time15', 'pack_s', 'pack_m', 'pack_l', 'shop', 'map', 'lock'], size: 256, alpha: true, rows: 3 },
];

// Kenara bağlı açık/beyaz ya da dama tahtası zemini şeffaflaştırır (sahte şeffaflık için yedek).
async function keyBackground(buf, w, h) {
  const px = Buffer.from(buf);
  const seen = new Uint8Array(w * h);
  const stack = [];
  const isBg = (i) => {
    const r = px[i * 4], g = px[i * 4 + 1], b = px[i * 4 + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mn > 175 && mx - mn < 22; // açık gri/beyaz, düşük doygunluk
  };
  for (let x = 0; x < w; x++) { stack.push(x, (h - 1) * w + x); }
  for (let y = 0; y < h; y++) { stack.push(y * w, y * w + w - 1); }
  while (stack.length) {
    const i = stack.pop();
    if (seen[i] || !isBg(i)) continue;
    seen[i] = 1; px[i * 4 + 3] = 0;
    const x = i % w, y = (i / w) | 0;
    if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1);
    if (y > 0) stack.push(i - w); if (y < h - 1) stack.push(i + w);
  }
  return px;
}

for (const s of SHEETS) {
  const src = art(s.file);
  if (!existsSync(src)) { console.log('atlandı:', s.file); continue; }
  const img = sharp(src).ensureAlpha();
  const { width: W, height: H } = await img.metadata();
  const { data } = await img.raw().toBuffer({ resolveWithObject: true });
  // gerçek alfa var mı?
  let transparent = 0;
  for (let i = 3; i < data.length; i += 4 * 97) if (data[i] < 20) transparent++;
  let pixels = data;
  if (s.alpha && transparent < 50) { console.log(s.file, ': gerçek alfa yok, zemin siliniyor'); pixels = await keyBackground(data, W, H); }
  const cw = Math.floor(W / 3), ch = Math.floor(H / (s.rows || 2));
  for (let k = 0; k < s.names.length; k++) {
    const cx = (k % 3) * cw, cy = Math.floor(k / 3) * ch;
    let cell = sharp(pixels, { raw: { width: W, height: H, channels: 4 } }).extract({ left: cx, top: cy, width: cw, height: ch });
    let buf = await cell.png().toBuffer();
    if (s.alpha) {
      buf = await sharp(buf).trim({ threshold: 1 }).png().toBuffer();
    } else {
      buf = await sharp(buf).flatten({ background: '#000' }).png().toBuffer();
    }
    const meta = await sharp(buf).metadata();
    const scale = Math.min(1, s.size / Math.max(meta.width, meta.height));
    await sharp(buf).resize(Math.round(meta.width * scale), Math.round(meta.height * scale)).png({ compressionLevel: 9 }).toFile(out(s.names[k] + '.png'));
    console.log(s.names[k], Math.round(meta.width * scale) + 'x' + Math.round(meta.height * scale));
  }
}

// Arayüz düğmeleri (3×3): yuvarlak düğmeleri lacivert dairenin sınırından daire maskesiyle keser
// (üretimdeki şeffaflık kenarlarında renkli artık kalmıştı).
if (existsSync(art('ui.png'))) {
  const names = ['ui_pause', 'ui_play', 'ui_restart', 'ui_music', 'ui_vibe', 'ui_shake', 'ui_settings'];
  const { data, info } = await sharp(art('ui.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width, cw = Math.floor(W / 3);
  for (let k = 0; k < names.length; k++) {
    const x0 = (k % 3) * cw, y0 = Math.floor(k / 3) * cw;
    let minX = 1e9, maxX = -1, minY = 1e9, maxY = -1;
    for (let y = y0; y < y0 + cw; y++) for (let x = x0; x < x0 + cw; x++) {
      const i = (y * W + x) * 4, r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
      if (a > 240 && b > 60 && b < 170 && r < 70 && g < 80 && b > r + 25) { // koyu lacivert düğme gövdesi
        if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    const ccx = (minX + maxX) / 2, ccy = (minY + maxY) / 2, rad = Math.min(maxX - minX, maxY - minY) / 2 + 6;
    const size = Math.ceil(rad * 2);
    const out_ = Buffer.alloc(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const sx = Math.round(ccx - rad + x), sy = Math.round(ccy - rad + y);
      const d = Math.hypot(x - rad, y - rad);
      const o = (y * size + x) * 4;
      if (sx < 0 || sy < 0 || sx >= W || sy >= info.height) continue;
      const i = (sy * W + sx) * 4;
      const edge = Math.max(0, Math.min(1, rad - d)); // yumuşak kenar
      out_[o] = data[i]; out_[o + 1] = data[i + 1]; out_[o + 2] = data[i + 2]; out_[o + 3] = Math.round(data[i + 3] * edge);
    }
    await sharp(out_, { raw: { width: size, height: size, channels: 4 } }).resize(160, 160).png().toFile(out(names[k] + '.png'));
    console.log(names[k], 'r=' + Math.round(rad));
  }
}

// El ve kupa (2×1, yeşil perde): yeşili siler, kenardaki yeşil taşmayı bastırır
if (existsSync(art('hand_trophy.png'))) {
  const { data, info } = await sharp(art('hand_trophy.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.from(data);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2];
    const m = Math.max(r, b);
    if (g > 120 && g > m * 1.35) { px[i + 3] = 0; continue; }
    if (g > m) { // yarı yeşil kenar: yeşili bastır, biraz saydamlaştır
      const spill = (g - m) / Math.max(1, g);
      px[i + 1] = m; px[i + 3] = Math.round(px[i + 3] * (1 - Math.min(0.8, spill * 1.5)));
    }
  }
  const half = Math.floor(info.width / 2);
  for (const [k, name] of ['ui_hand', 'ui_trophy'].entries()) {
    const buf = await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } })
      .extract({ left: k * half, top: 0, width: half, height: info.height }).png().toBuffer();
    const trimmed = await sharp(buf).trim({ threshold: 1 }).png().toBuffer();
    const meta = await sharp(trimmed).metadata();
    const sc = Math.min(1, 256 / Math.max(meta.width, meta.height));
    await sharp(trimmed).resize(Math.round(meta.width * sc), Math.round(meta.height * sc)).png().toFile(out(name + '.png'));
    console.log(name, Math.round(meta.width * sc) + 'x' + Math.round(meta.height * sc));
  }
}

// Ana sayfa düğmesi (tek simge, yeşil perde)
if (existsSync(art('ui_home.png'))) {
  const { data, info } = await sharp(art('ui_home.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.from(data);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2], m = Math.max(r, b);
    if (g > 120 && g > m * 1.35) { px[i + 3] = 0; continue; }
    if (g > m) { const spill = (g - m) / Math.max(1, g); px[i + 1] = m; px[i + 3] = Math.round(px[i + 3] * (1 - Math.min(0.8, spill * 1.5))); }
  }
  const buf = await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  await sharp(await sharp(buf).trim({ threshold: 1 }).png().toBuffer()).resize(160, 160, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(out('ui_home.png'));
  console.log('ui_home');
}

// Orbitap logosu (yeşil perde) → assets/logo.png (en fazla 900 px genişlik)
if (existsSync(art('logo.png'))) {
  const { data, info } = await sharp(art('logo.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = Buffer.from(data);
  for (let i = 0; i < px.length; i += 4) {
    const r = px[i], g = px[i + 1], b = px[i + 2], m = Math.max(r, b);
    if (g > 120 && g > m * 1.35) { px[i + 3] = 0; continue; }
    if (g > m) { const spill = (g - m) / Math.max(1, g); px[i + 1] = m; px[i + 3] = Math.round(px[i + 3] * (1 - Math.min(0.8, spill * 1.5))); }
  }
  const buf = await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer();
  const trimmed = await sharp(buf).trim({ threshold: 1 }).png().toBuffer();
  await sharp(trimmed).resize({ width: 900, withoutEnlargement: true }).png({ compressionLevel: 9 }).toFile(out('logo.png'));
  console.log('logo');
}

// Uygulama simgeleri (ana ekrana ekleme)
if (existsSync(art('icon.png'))) {
  for (const s of [192, 512]) await sharp(art('icon.png')).resize(s, s).png().toFile(join(root, `icon-${s}.png`));
  await sharp(art('icon.png')).resize(180, 180).png().toFile(join(root, 'apple-touch-icon.png'));
  console.log('icon-192, icon-512, apple-touch-icon');
}

// Harita arka planları (kısım başına; 3 tema döner)
for (let i = 1; i <= 3; i++) {
  const src = art(`mapbg/map${i}.png`);
  if (!existsSync(src)) continue;
  await sharp(src).resize(768, 1152, { fit: 'cover' }).webp({ quality: 82 }).toFile(out(`map${i}.webp`));
  console.log('map' + i);
}

for (let i = 1; i <= 6; i++) {
  const src = art(`bg/bg${i}.png`);
  if (!existsSync(src)) { console.log('atlandı: bg' + i); continue; }
  await sharp(src).resize(768, 1152, { fit: 'cover' }).webp({ quality: 82 }).toFile(out(`bg${i}.webp`));
  console.log('bg' + i);
}
