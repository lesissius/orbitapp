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

---

# Sürüm 2: kısımlar, yıldız eşikleri, jokerler ve market

23 Kasım 2026

## Yeni kurallar

- **Her bölümde 12 iğne var.** 5 iğne saplayınca bölüm geçilir, 8 iğnede ★★, 10 iğnede ★★★ alınır. Boss bölümlerinde 14 iğne ve 6/9/12 eşikleri var.
- **Hatalı atış bölümü bitirmez, iğneyi harcar.**
  - Başka iğneye çarpan iğne kırılıp düşer.
  - Metalden seken iğne kaybolur ve küre ters döner.
  - Bombaya gelen iğne patlar ve en yakın iğneni de düşürür (−1).
- **Bölüm sonu:** İğneler bitince ya da süre dolunca saplanan sayı yıldızlara çevrilir. 10 iğneye ulaşınca bölüm hemen biter; artan iğneler altına döner.
- **Kısımlar:** 1-1…1-10, 2-1…2-10 diye ilerler. Her kısım ayrı bir haritada; bölümler kıvrılarak yükselen bir yolun üstündeki balonlar.
- **Mihenk taşı:** Her kısmın sonunda bir taş kemer var. Geçmek için o kısımda belirli sayıda yıldız toplamak gerekiyor (1. kısımda 15/30, her kısımda +1, en fazla 22). Yıldız eksikse oyuncu eski bölümleri tekrar oynayabilir. Taşı geçince altın ve her jokerden bir ödül veriliyor; her 3. kısımda ödül daha büyük.
- **Süreli bölümler:** Her kısmın 4. ve 8. bölümü süreli: 1. kısımda 30 saniye, ilerledikçe azalıp en az 20 saniye.
- **Bonus bölümler:** Her kısımda 5. bölümden sonra bir bonus var. Tek kısımlarda altın yağmuru (paraları vur), çift kısımlarda hediye kutuları (kutuları vur, rastgele joker kazan). Bonusların yıldızı yok ve bir kez alınıyor.
- **Jokerler:**
  - Yavaşlat: küre 8 saniye yavaş döner.
  - +2 İğne: bölüme 2 iğne ekler.
  - +15 Saniye: yalnızca süreli bölümlerde kullanılır.
  - Kullandıkça hakkı azalıyor. Hakkı kalmayan jokere dokununca market açılıyor. Yeni oyuncu 2 adet +2 İğne ile başlıyor.
- **Altın** (bir joker için 10–11 bölüm biriktirmek gerekir; jokerler bilinçli ve az kullanılsın, altın paketleri anlamlı olsun):
  - Bölüm ödülü: 1★ 3, 2★ 8, 3★ 12 altın (boss dahil, ek ödül yok).
  - Aynı bölümü tekrar oynamak yalnızca yıldız artarsa farkı verir (1★'dan 3★'a çıkınca +9). Yıldız artmazsa altın yok; böylece altın kasılamaz.
  - Küredeki altın para +2, bonus altın yağmurunda para başına 2 (+6 tamamlama), mihenk taşında 20 + kısım×5.
  - Joker fiyatları: her biri 85 altın; üçlü paket 213.
  - Ortalama oyuncu (1★ %30, 2★ %45, 3★ %25) bir bölümden yaklaşık 8 altın kazanıyor; bir joker yaklaşık 10,5 bölüm (85 altın).
- **Market:** Jokerler altınla tek tek ya da üçlü paket olarak alınıyor. Gerçek parayla altın paketleri (500 / 1500 / 4000) görünüyor ama ödeme henüz bağlı değil; dokununca "uygulama mağazaya çıkınca açılacak" yazıyor. Fiyatlar örnek.

## Doğrulama

- Test botu 10 kısmın 110 bölümünü oynadı.
  - Normal bölümlerin hepsinde 3 yıldız alınabiliyor.
  - Bonusların hepsi tamamlanabiliyor.
  - Süreli bölümlerde bot süreyi aşmıyor.
- Son gereken iğnede güvenli açı 1. kısımda ortalama %61, 8. kısımda %18; en dar bölümde %13.
- Telefon boyutunda giriş ekranı, harita, bölüm, çarpışma, sonuç penceresi, market satın alma, mihenk taşı ödülü, süreli bölüm, üç joker ve bonus bölüm tek tek denendi.

## Kod düzeni

Oyun tek dosyadan beş dosyaya ayrıldı:

- `js/core.js`: kayıt, ses, görseller, bölüm kataloğu, ilerleme, seviye üretimi
- `js/play.js`: oynanış, jokerler, sonuç hesabı, test botu
- `js/render.js`: oyun ekranı ve sonuç/duraklatma pencereleri
- `js/screens.js`: giriş ekranı, harita, mihenk taşı, market, ayarlar, dokunma girişi
- `js/main.js`: döngü ve başlangıç

Eski ilerleme yeni yapıya taşınıyor: geçilen seviyeler 1 yıldızla işaretleniyor.

---

# Sürüm 3: bulut hesap ve misafir girişi

## Nasıl çalışıyor

- **İlk açılış:** Hoş geldin ekranında üç seçenek var: **Hesap oluştur**, **Giriş yap**, **Misafir olarak oyna**.
- **Hesap:** Kullanıcı adı (3–16 karakter) ve şifre (en az 6 karakter). E-posta istenmiyor.
- **İlerleme bulutta:** Yıldızlar, altın, jokerler ve mihenk taşları sunucuda tutuluyor. Her değişiklikten 1,5 saniye sonra ve uygulama arka plana geçince kaydediliyor. İnternet yoksa cihazda bekliyor, bağlantı gelince gönderiliyor.
- **Misafir:**
  - Kayıt olmadan oynuyor, ilerlemesi yine sunucuda tutuluyor.
  - Marketten satın alma yapamıyor; denerse "hesap oluştur" ekranı açılıyor.
  - Hesap oluşturunca aynı hesap yükseltiliyor, ilerleme, altın ve jokerler aynen aktarılıyor.
- **Aynı cihazda birden fazla hesap:** Her hesabın ilerlemesi cihazda ayrı tutuluyor, karışmıyor.
- **İki cihaz:** Aynı hesapla iki cihazda oynanırsa en yeni kayıt kazanıyor; eski cihaz açılınca yeni ilerlemeyi alıyor.
- **Ayarlar:** Hesap adı, kayıt durumu, Çıkış yap ve Hesabı sil (şifreyle onaylanır, her şey kalıcı olarak silinir; App Store kuralı). Misafir için Hesap oluştur, Giriş yap ve Misafir hesabını sil.
- **Eski ilerleme:** Hesapsız dönemden kalan ilerleme bu cihazda açılan ilk hesaba bir kez taşınıyor. Eski sürümlerin cömert ekonomisinden kalan fazla altın yeni sınıra göre kırpılıyor.

## Güvenlik

- Şifreler PBKDF2-SHA256 ile 100.000 turda, rastgele tuzla özetleniyor; şifrenin kendisi hiçbir yerde saklanmıyor.
- Oturum anahtarlarının yalnızca SHA-256 özeti tutuluyor. Oturumlar 180 gün geçerli.
- Aynı IP ve kullanıcı adı için 15 dakikada en fazla 8 hatalı giriş denemesi yapılabiliyor.
- Sunucu yalnızca oyunun adresinden (lesissius.github.io) gelen isteklere izin veriyor.
- **Hile sınırı:** Sunucu, kaydedilen altın ve joker değerinin yıldızlardan, mihenk taşlarından ve bonuslardan kazanılabilecek en yüksek değeri aşmasına izin vermiyor. Küredeki altın para artık yalnızca bölüm ilk kez geçilene kadar çıkıyor; tekrar oynayarak altın kasılamıyor.

## Sunucu

- Cloudflare Worker: `igne-ustasi-api` (https://igne-ustasi-api.munaris.workers.dev)
- D1 veritabanı: `igne-ustasi`
- Kod `server/` klasöründe. Yeniden yayınlamak için `server` klasöründe `wrangler deploy`; tablo değişikliği için `wrangler d1 migrations apply igne-ustasi --remote`.

## Gerçek parayla satıştan önce yapılması gerekenler

- Satın almayı sunucu üzerinden yapmak: altını sunucu versin, istemci yalnızca sonucu göstersin.
- Google Play ve App Store ödeme makbuzlarını sunucuda doğrulamak.
- Gizlilik politikası (KVKK): hangi verinin tutulduğu, nasıl silineceği.
- Uygulamada "Apple ile giriş" ve "Google ile giriş" seçenekleri.

---

# Sürüm 4: oyuncu ve saldırgan gözüyle inceleme

23 Kasım 2026

## Saldırgan gözüyle: bulunan açıklar ve durumu

Sunucuya yerelde gerçek saldırı istekleri gönderildi. Önce 7 açık tespit edildi, düzeltmeden sonra hepsi kapandı. Canlı sunucuda da kendini temizleyen kısa bir kontrol yapıldı.

| # | Açık | Önce | Sonra |
|---|---|---|---|
| 1 | Sahte ilerleme: 50 kısmı 3 yıldızlı gösterip binlerce altın ve 150 joker tek seferde yazmak | Kabul ediliyordu | Reddediliyor |
| 2 | Misafirin, istemcideki engeli atlayıp sunucuda joker "satın alması" | Mümkündü | Reddediliyor |
| 3 | Hiç açılmamış bölümün (ör. 5-10) yıldızını yazmak | Mümkündü | Reddediliyor |
| 4 | İlerlemeye keyfi veri ve kod parçası gömmek | Saklanıyordu | Yalnızca bilinen alanlar saklanıyor |
| 5 | Tek IP'den sınırsız misafir hesabı açmak | 40/40 | Saatte 15 |
| 6 | "admin", "Destek", "moderator", "admın", "4dm1n" gibi yetkili görünen adlar | Alınabiliyordu | Reddediliyor |
| 7 | "123456" gibi çok yaygın şifreler | Kabul ediliyordu | Reddediliyor |
| 8 | Saniyeler içinde 10 bölüm geçilmiş göstermek | — | Reddediliyor |
| 9 | Hatalı giriş süresinden kullanıcı adının var olup olmadığını anlamak | Fark yoktu | Olmayan adda da aynı şifre hesabı yapılıyor |

## Sunucuda yapılanlar

- **İlerleme dört kontrolden geçiyor:**
  1. Biçim: yalnızca bilinen alanlar ve türler saklanıyor.
  2. Sıra: kilitli bölüm, kısım, bonus ya da mihenk taşı yazılamıyor.
  3. Değer: altın ve jokerler kazanılabilecek değeri aşamıyor, iki kayıt arasındaki artış da kazanılan kadar olabiliyor.
  4. Hız: kısa sürede çok bölüm geçilmiş görünemiyor (3 + her 4 saniyede 1).
- **Misafir:** Jokerleri yalnızca oyunun verdiği kadar artabiliyor; satın alma sunucuda da engelli.
- **İstek sınırları:**
  - Misafir hesabı açma: IP başına saatte 15.
  - Kayıt: IP başına saatte 6.
  - Hatalı giriş: IP + kullanıcı adı için 15 dakikada 8, kullanıcı adı için saatte 20, IP için 15 dakikada 40.
  - Kayıt gönderme: hesap başına 10 dakikada 120.
  - Hesap silmede hatalı şifre denemesi de sınırlı.
- **Kullanıcı adı:**
  - Büyük/küçük harf ve Türkçe harf farkı benzersizlikte yok sayılıyor ("Admın" = "admin").
  - Yetkili gibi görünen adlar ve küfür/nefret içeren adlar reddediliyor. Filtre, harf yerine rakam yazılmasını da yakalıyor ("4dm1n").
- **Şifre:** Çok yaygın şifreler, tek karakter tekrarı, 7 haneye kadar yalnız rakam ve kullanıcı adını içeren şifre reddediliyor.
- **Kişisel veri (KVKK):** IP adresi artık açık saklanmıyor; yalnızca gizli tuzla alınmış özeti en fazla 2 gün tutuluyor. Eskiden IP'yi açık tutan tablo kaldırıldı.
- **Günlük temizlik (her gün 03:17 UTC):** Süresi dolan oturumlar, eski sayaçlar ve 120 gün girmeyen misafir hesapları siliniyor.
- **Güvenlik başlıkları:** nosniff, no-store, no-referrer, DENY. Kayıt için şart onayı sunucuda da zorunlu.

## Oyun tarafında yapılanlar

- **Test kancası** (`__igne`: bölümü bitirme, botu çalıştırma) yalnızca bu bilgisayarda açılıyor; yayındaki oyunda yok.
- **İçerik Güvenliği Politikası (CSP):** Sayfa yalnızca kendi dosyalarını ve hesap sunucusunu yükleyebiliyor.
- **Altın para:** Hesap başına bölümde bir kez veriliyor. Eskiden bölümü kaybedip tekrar oynayarak para toplanabiliyordu. Bonus parası, bonus bitince bir kez yazılıyor.
- **Ret durumu:** Sunucu bir kaydı reddederse oyun son geçerli kayda dönüyor ve oyuncuya söylüyor.
- **Bulunup düzeltilen hata:** Misafirken arka planda bir kayıt beklerken hesap oluşturulursa, eski anahtarla giden kayıt yüzünden yeni hesapta "Oturumun sona erdi" çıkıyordu. Giriş, kayıt, çıkış ve silme artık arka plan kaydıyla çakışmıyor.
- **Satış yokken fiyat göstermemek:** Gerçek para fiyatları kaldırıldı, "Yakında" yazıyor; satış yokken fiyat göstermek yanıltıcı olabilirdi.
- **Gizlilik politikası ve kullanım şartları:** `privacy.html`. Hangi verinin tutulduğu, saklama süresi, hesap silme ve adil oyun kuralları burada. Kayıtta onay kutusu var. İletişim için kişisel bilgi yerine GitHub "Issues" sayfası gösteriliyor.

## Oyuncu gözüyle yapılanlar

- **Misafir hatırlatması:** 6 yıldıza ulaşan misafire günde en fazla bir kez "İlerlemeni koru" penceresi çıkıyor; kaç yıldız ve altını olduğunu gösteriyor.
- **Kayıt durumu:** Haritada ayar düğmesinin yanında küçük bir işaret var: yeşil kayıtlı, sarı kaydediliyor, gri çevrimdışı, kırmızı hata.
- **Giriş ve kayıt formu:** "Şifreyi göster" seçeneği var.
- **Ayarlar:** Gizlilik politikası ve şartlar bağlantısı var.

## Doğrulama

- Yerelde normal akışın 18 kontrolü ve saldırıların 9 kontrolü geçti.
- Oyunun içinden bir misafir 10 bölüm, mihenk taşı, bonus ve 2. kısmı gerçek tempoda oynadı; 14 kaydın hepsi kabul edildi.
- Oyunun içinden yapılan hile denemeleri reddedildi: misafirin altını jokere çevirmesi ve altını elle artırmak. Hesap açtıktan sonra normal satın alma kabul edildi.
- Canlı sunucuda 10 kontrol geçti; test hesapları silindi.

## Kalan riskler ve öneriler

- **İstemci tarafında oynanış:** Oyun tarayıcıda çalıştığı için sabırlı biri, her bölümü kurallara uygun hızda "geçmiş" gibi göndererek yine ilerleyebilir. Bu yalnızca kendi hesabını etkiler. Liderlik tablosu ya da gerçek para gelmeden önce bölüm sonuçlarının sunucuda daha sıkı doğrulanması gerekir (atış zamanları gibi).
- **Kullanıcı adı filtresi:** Basit bir listeye dayanıyor; her uygunsuz adı yakalayamaz. Adlar başkalarına gösterilmeye başlanırsa (liderlik tablosu) bildirme ve ad değiştirme gerekir.
- **Gizlilik politikası:** Bir hukukçuya okutulmalı, özellikle uygulama mağazasına çıkmadan ve gerçek para eklenmeden önce.
- **Cloudflare ücretsiz katman:** Günde 100.000 istek ve D1 yazma sınırı var. Oyun büyürse aşılabilir; bu durumda istekler reddedilir ama ücret çıkmaz.
