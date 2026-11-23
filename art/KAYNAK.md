# Görsel kaynakları

Oyundaki tüm görseller OpenAI GPT görsel üretimiyle, Codex CLI üzerinden üretildi (23 Kasım 2026). Mağazalar yapay zekâ ile üretilmiş içeriğin beyanını isteyebilir; bu dosya o beyan için başvuru kaynağıdır.

| Asıl | İçerik | Oyundaki hali |
|---|---|---|
| `art/orbs.png` | 3×2, şeffaf: amber, turkuaz, pembe, yeşil, mavi, kırmızı küre | `assets/orb1..6.png` (her 10 seviyede bir tema) |
| `art/parts.png` | 3×2, şeffaf: gümüş iğne, eski bronz iğne, bomba çıkıntısı, metal zırh çıkıntısı, altın yıldız, ses simgesi | `assets/pin, pin_old, bomb, shield, star, sound.png` |
| `art/fx.png` | 3×2, siyah zemin: patlama, şok halkası, kıvılcım yıldızı, altın ışık patlaması, metal kıvılcımları, yumuşak parıltı | `assets/fx_*.png` ("lighter" karışımıyla çizilir) |
| `art/bosses.png` | 3×1, şeffaf: lav golemi, demir göz, kristal gölge (yüzlü boss küreleri; normal küreler referans verildi) | `assets/boss1..3.png` (her 10. seviye) |
| `art/ui.png` | 3×3: duraklat, oynat, baştan, müzik, titreşim, sarsıntı, ayar düğmeleri (+ kullanılmayan el ve kupa) | `assets/ui_*.png`; üretimdeki şeffaflık kenarında renkli artık kaldığı için düğmeler daire maskesiyle kesildi |
| `art/hand_trophy.png` | 2×1, yeşil perde: öğretici el, kupa | `assets/ui_hand.png`, `assets/ui_trophy.png` (yeşil silindi) |
| `art/icon.png` | 1024×1024 uygulama simgesi | `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` |
| `art/bg/bg1..6.png` | 1024×1536 dikey arka planlar, kürelerle aynı renk temaları | `assets/bg1..6.webp` (768×1152) |

**Ortak istem:** stilize, parlak casual mobil oyun çizimi; sade güçlü şekiller, sol üstten yumuşak ışık, hafif kenar ışığı; yazı, harf, sayı, filigran yok. Çıkıntı modülleri yandan görünüm ve altı düz, böylece kürenin yüzeyine dizilebiliyor. bg2–bg6, bg1 referans verilerek aynı stilde üretildi.

**Yeniden üretme:** asılları `art/` içine koyup `node tools/build-art.mjs` çalıştırın.
