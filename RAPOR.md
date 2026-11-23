# İğne Ustası: kullanıcı incelemesi ve düzeltme raporu

23 Kasım 2026

## Nasıl incelendi

1. **Kullanıcı gibi oynama.** Kayıtlar silinerek ilk açılış denendi; telefon (375×812) ve masaüstü boyutunda ekrana dokunarak oynandı. Giriş ekranı, ilk seviyeler, yenilgi, kazanma, boss ve menüler tek tek açıldı.
2. **Kod incelemesi.** Oyun dosyası baştan sona okundu; akış, giriş, kayıt ve çizim tarafındaki açıklar listelendi.
3. **Test botu.** Oyuna, gerçek oyun mantığını görüntüsüz çalıştıran ve mükemmel zamanlamayla atış yapan bir bot eklendi (`__igne.sim(n)`). Bot her seviye için iki şey ölçüyor:
   - Seviye kazanılabiliyor mu?
   - Son atışlarda küre çevresinin ne kadarı güvenli kaldı? Buna "güvenli açı" diyoruz; insan için zorluğun ölçüsü bu. %5'in altı fiilen imkânsız demek.

**Test sınırı:** Tarayıcı paneli gizliyken animasyon kareleri yavaşladığı için gerçek zamanlı dokunuşlu oynanış kısa tutuldu. Zorluk ölçümü bu yüzden botla yapıldı. Kendi telefonunda bir tur oynayıp hissi doğrulaman iyi olur.

---

## Bulgular ve yapılanlar

Önem sırası: 🔴 kritik · 🟠 yüksek · 🟡 orta · ⚪ düşük. Tüm maddeler bu turda düzeltildi.

### 🔴 Kritik

| # | Bulgu | Neden | Yapılan |
|---|---|---|---|
| K1 | **4 seviye kazanılamıyordu** (11, 16, 18, 24). Bot mükemmel zamanlamayla bile bitiremedi. | "İleri-geri" dönüş deseninde küre gidip geldiği yay 360°'den kısa kalınca kürenin bir kısmı hiç atış noktasına gelmiyordu. Boşluk o kısımdaysa seviye bitmiyordu. | Geri dönüş artık ileri dönüşün yarısı kadar sürüyor, küre net olarak ilerliyor. Boss dönüşündeki geri hareketler de kısa ve yavaş yapıldı. |
| K2 | **Zorluk 14. seviyeden sonra fiilen imkânsızdı.** Son iğnede güvenli açı %1–5'e iniyordu. | Bölge sayısı hızlı artıyordu (17. seviyede 5 bölge), iğneler küreye çok sık diziliyordu. | Bölgeler daha yavaş ve daha dar geliyor. İğne yoğunluğu seviyeyle yavaş yavaş artıyor. Hız tavanı 3,1'den 2,8'e indi. |
| K3 | Hızlanıp yavaşlama deseninde küre yüksek seviyede 7 rad/sn'ye çıkıyordu. | Hız çarpanına sınır yoktu. | Hız 4,6 rad/sn ile sınırlandı. |

**Botla zorluk ölçümü (önce → sonra):**

| Seviyeler | Kazanılamayan | Son iğnede güvenli açı (ortalama) |
|---|---|---|
| 1–10 | 0 → 0 | %55 → %63 |
| 11–20 | **3 → 0** | %9 → %38 |
| 21–40 | **1 → 0** | %4 → %25 |
| 41–60 (önce) / 41–100 (sonra) | 0 → 0 | %4 → %15 (en dar seviye %7) |

Sonuç olarak 1–100 arasındaki bütün seviyeler kazanılabiliyor ve zorluk düzgün bir eğriyle artıyor.

### 🟠 Yüksek

| # | Bulgu | Yapılan |
|---|---|---|
| Y1 | Bölüm yanınca 0,45 sn sonra **herhangi bir dokunuş bölümü yeniden başlatıyordu.** Hızlı dokunan oyuncu yenilgi ekranını görmeden kendini yeniden başlamış buluyordu. | Bekleme 0,8 sn'ye çıktı. Yenilgi panelinde artık yenilgi sebebi, kısa bir ipucu ("İki iğne arasında boşluk bekle" gibi), kalan iğne sayısı ve "Tekrar" düğmesi var. |
| Y2 | **Duraklatma yoktu.** Telefona arama gelince ya da sekme değişince oyun durmuyordu. | Sağ üstte duraklat düğmesi var. Uygulama arka plana geçince oyun kendiliğinden duruyor. Klavyede Esc veya P ile de duruyor. |
| Y3 | **Ayar yoktu.** Ses ve titreşim tek düğmeye bağlıydı, müzik yoktu, ekran sarsıntısı kapatılamıyordu. | Duraklatma menüsünde Müzik, Ses, Titreşim ve Sarsıntı ayrı ayrı açılıp kapanıyor ve kaydediliyor. |
| Y4 | Kazanma ekranındaki **3 yıldız her zaman 3'tü**, bir anlamı yoktu. | Yıldızlar artık hak ediliyor: bitirmek ★, can harcamamak ★, metale çarpmamak ★. Her seviyenin en iyi yıldızı kaydediliyor, toplam üstte görünüyor. Eksik yıldızda nasıl alınacağı yazıyor, 3 yıldızda "KUSURSUZ!" çıkıyor. |
| Y5 | Seviyeler **ekran boyutuna göre farklı üretiliyordu**: çok küçük ekranda iğne sayısı değişebiliyordu. | İğneler arası boşluk ekrandan bağımsız sabit bir değer; her cihazda aynı seviye üretiliyor. |
| Y6 | Yavaş telefonda **oyun ağır çekime düşüyordu** (kare süresi 33 ms ile sınırlıydı). | Oyun sabit adımlı döngüye geçti (saniyede 120 adım). Hız cihazdan bağımsız. |

### 🟡 Orta

| # | Bulgu | Yapılan |
|---|---|---|
| O1 | Giriş ekranındaki kural satırı dar telefonda kenarlara taşıyordu. | İki kısa satıra bölündü. Kaldığın seviye ("Devam etmek için dokun · Seviye 8") ve rekor/yıldız özeti eklendi. |
| O2 | İlk açılışta nereye dokunulacağını gösteren bir şey yoktu. | İlk atışa kadar dokunan bir el ve "Ekrana dokun, iğne fırlasın" yazısı çıkıyor (el GPT çizimi). |
| O3 | Boss'a kaç seviye kaldığı görünmüyordu; ilerleme hissi zayıftı. | Sol üstte 10 noktalık ilerleme çubuğu var: geçilen seviyeler, bulunduğun seviye ve en sonda kırmızı boss noktası. |
| O4 | Sıradaki iğne kuyruğundaki noktalar iğnenin başıyla üst üste biniyordu. | Sadece sıradaki iğne ve "× kalan" sayısı kaldı. Yenilgi ve kazanma ekranında gizleniyor. |
| O5 | Çentikli telefonlarda (iPhone) üst bilgi çentiğin altında kalabiliyordu. | Ekranın güvenli alanı okunuyor; bilgi alanı, düğmeler ve atış noktası buna göre kayıyor. |
| O6 | Geçilen seviyeyi yeniden oynamanın ya da ilerlemeyi sıfırlamanın yolu yoktu. | Duraklatma menüsünde seviye seçici (rekora kadar, yıldızlarıyla birlikte) ve iki dokunuşla onaylanan "İlerlemeyi sıfırla" var. |
| O7 | Boss öfkelenip bomba için yer bulamayınca da "bomba çıkardı" yazıyordu. | Yazı duruma göre değişiyor. |
| O8 | Telefonda ana ekrana eklenemiyor, internetsiz açılmıyordu. | Uygulama tanımı, simgeler (GPT çizimi) ve çevrimdışı önbellek eklendi. Telefonda ana ekrana eklenip internetsiz oynanabiliyor; 41 dosyanın önbelleğe alındığı denendi. |
| O9 | Masaüstünde (yatay pencerede) küre küçük kalıyordu. | Geniş ekranda küre biraz büyütüldü. |

### ⚪ Düşük

| # | Bulgu | Yapılan |
|---|---|---|
| D1 | Müzik yoktu. | Oyunun içinde üretilen sakin bir müzik eklendi: renk temasına göre değişen akor ve arpej, boss'ta daha karanlık ve hızlı. Duraklatınca ya da uygulama arka plana geçince susuyor. |
| D2 | Ses kapatılınca titreşim de kapanıyordu. | İkisi ayrı ayar. |
| D3 | Sağ tık ve uzun basma menüsü oyunun üstünde açılabiliyordu. | Kapatıldı. |

---

## Bu turda eklenen GPT görselleri

- **Arayüz düğmeleri:** duraklat, oynat, baştan, müzik, titreşim, sarsıntı. Codex'in şeffaflık kesiminde renkli artık kaldığı için düğmeler daire maskesiyle temizlendi.
- **Öğretici el ve kupa:** yeşil zeminde üretilip zemini silindi.
- **Uygulama simgesi:** 192, 512 ve 180 px.

Hangi görselin hangi istemle üretildiği `art/KAYNAK.md` dosyasında.

---

## Açık kalanlar ve öneriler

1. **Gerçek telefonda deneme.** Dokunma hissi, titreşim ve müzik gerçek cihazda bir kez denenmeli. Telefondan açmak için oyunun bir sunucuda yayınlanması gerekiyor; şu an yalnızca bu bilgisayarda çalışıyor.
2. **Ses düğmesinin görünümü.** Duraklatma menüsündeki ses simgesi beyaz düğme, diğerleri lacivert. İstersen GPT ile aynı stilde bir ses düğmesi çizdirebilirim.
3. **Önbellek sürümü.** Oyun güncellendiğinde `sw.js` içindeki `VERSION` değeri artırılmalı; yoksa ana ekrana eklenmiş oyunda eski görseller kalabilir.
4. **Gelecekteki fikirler** (yapılmadı): günlük meydan okuma, iğne ve küre görünümü açılan bir koleksiyon, liderlik tablosu.

## Dosyalar

- `index.html`: oyun
- `manifest.webmanifest`, `sw.js`, `icon-*.png`, `apple-touch-icon.png`: ana ekrana ekleme ve çevrimdışı oynama
- `assets/`: oyunda kullanılan kesilmiş görseller (yeniden üretmek için `node tools/build-art.mjs`)
- `art/`: GPT asılları ve `KAYNAK.md`
