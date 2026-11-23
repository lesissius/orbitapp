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
| `art/map_items.png` | 3×3: mavi, altın, kilitli, boss, bonus, süreli balon; mihenk taşı kemeri, hazine sandığı, altın para (yeşil perdede üretildi) | `assets/bal_*.png`, `milestone.png`, `chest.png`, `coin.png` |
| `art/skills.png` | 3×3: Yavaşlat, +2 İğne, +15 Saniye jokerleri; küçük/orta/büyük altın paketi; market, harita, kilit simgeleri | `assets/sk_*.png`, `pack_*.png`, `shop.png`, `map.png`, `lock.png` |
| `art/mapbg/map1..3.png` | 1024×1536 harita arka planları: gündüz tepeler, günbatımı dağlar, auroralı gece | `assets/map1..3.webp` (kısımlarda sırayla) |
| `art/needles.png` | 2×1, yeşil perde: düz gümüş dikiş iğnesi ve eski bronz iğne (topuzsuz) | `assets/pin.png`, `assets/pin_old.png` (parts.png içindeki topuzlu iğnelerin yerine) |
| `art/sk_pins2.png` | +2 İğne joker simgesi, düz iğnelerle; yeşil zemin yalnızca kenardan silindi (yeşil artı rozeti korunur) | `assets/sk_pins2.png` |
| `art/logo.png` | Orbitapp logosu: "O" harfi iğne saplı parlak küre, yörünge çizgisi; yeşil perdede üretildi | `assets/logo.png` (900 px), giriş ekranı ve hoş geldin penceresi |
| `art/arrows.png` | 2×1, yeşil perde: oyuncu oku (açık ahşap, turuncu-altın tüy) ve eski koyu ok | `assets/arrow.png`, `assets/arrow_old.png` (iğnelerin yerine) |
| `art/orbs_theme_a..g.png` | 3×1, yeşil ya da mavi perde: 20 kısmın temalı küreleri (perde yalnızca kenardan silinir) | `assets/orb1..orb20.png` (560 px) |
| `art/concept/bgN_*.png` | 1024×1536 kısım arka planı konseptleri; ortası küre için sakin bırakıldı | `assets/bgN.webp` (768×1152); üstüne kodla hareketli parçacık ve canlılar çizilir |
| `art/bg/bg1..6.png` | 1024×1536 dikey arka planlar, kürelerle aynı renk temaları | `assets/bg1..6.webp` (768×1152) |

**Ortak istem:** stilize, parlak casual mobil oyun çizimi; sade güçlü şekiller, sol üstten yumuşak ışık, hafif kenar ışığı; yazı, harf, sayı, filigran yok. Çıkıntı modülleri yandan görünüm ve altı düz, böylece kürenin yüzeyine dizilebiliyor. bg2–bg6, bg1 referans verilerek aynı stilde üretildi.

**Yeniden üretme:** asılları `art/` içine koyup `node tools/build-art.mjs` çalıştırın.
