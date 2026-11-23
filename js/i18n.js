// Dil desteği: tr, en. t('anahtar', { değişken }) ile kullanılır.
// Oyun adı tek yerde: BRAND (yeni ad seçilince yalnızca burası değişir).
'use strict';
const BRAND = 'Orbitapp';

const LANGS = [
  { code: 'tr', name: 'Türkçe' },
  { code: 'en', name: 'English' },
];

const STRINGS = {
  tr: {
    tap_start: 'Başlamak için dokun', title_l1: 'İğneleri dönen küreye sapla.', title_l2: 'Ne kadar çok iğne, o kadar çok yıldız.',
    chapter_n: 'Kısım {n}', chapter_caps: 'KISIM {n}', playing_guest: 'Misafir olarak oynuyorsun', welcome_user: 'Hoş geldin, {name}',
    ms_passed: '✓ Geçildi', bonus_taken: '✓ Alındı', need_ms: 'Önce Kısım {n} mihenk taşını geç', need_bonus: 'Bonus için önce {id} bölümünü geç',
    need_prev: 'Önce önceki bölümü geç', bonus_done_toast: 'Bu bonus alındı', chapter_locked: 'Kısım {n} kilitli', chapter_locked_req: 'Kısım {p} mihenk taşında ★ {req} gerekli',
    market: 'MARKET', gold_packs: 'ALTIN PAKETLERİ', soon: 'Yakında', packs_soon: 'Altın paketleri, oyun uygulama mağazasına çıkınca açılacak',
    guest_no_buy1: 'Misafir hesapla satın alma yapılamaz.', guest_no_buy2: 'Hesap oluştur, ilerlemen aynen aktarılır.',
    reason_buy: 'Satın alma için hesap gerekli. Misafir ilerlemen, altınların ve jokerlerin hesabına aktarılır.',
    not_enough_gold: 'Yeterli altın yok', bought: '{name} ×{n} alındı', settings: 'AYARLAR', guest_account: 'Misafir hesap',
    sync_offline: 'Çevrimdışı · bağlanınca kaydedilecek', sync_error: 'Kaydedilemedi', sync_saving: 'Kaydediliyor…', sync_ok: 'İlerleme bulutta kayıtlı',
    create_account: 'Hesap oluştur', login: 'Giriş yap', logout: 'Çıkış yap', delete_account: 'Hesabı sil', logged_out: 'Çıkış yapıldı',
    guest_settings_note: 'Misafirken satın alma yapılamaz. Hesap oluşturursan ilerlemen aktarılır.', delete_guest: 'Misafir hesabını sil',
    privacy_link: 'Gizlilik politikası ve şartlar', language: 'Dil',
    remind_title: 'İlerlemeni koru', remind_l1: '★ {stars} yıldız ve {gold} altının misafir hesabında.', remind_l2: 'Telefon değişirse ya da oyun silinirse kaybolabilir.',
    remind_l3: 'Hesap oluştur, hepsi aynen aktarılsın.', later: 'Sonra',
    milestone: 'MİHENK TAŞI', ms_sub: 'Kısım {n} · {name}', ms_claimed: 'Bu mihenk taşı geçildi', ms_need_boss: 'Önce {id} boss bölümünü geç',
    ms_enough: 'Yıldızlar yeterli!', ms_missing: '{n} yıldız eksik: önceki bölümleri tekrar oyna', reward: 'Ödül', claim: 'Ödülü al ve ilerle',
    go_chapter: 'Kısım {n}: devam', ok: 'Tamam', chapter_unlocked: 'Kısım {n} açıldı! Ödüller eklendi',
    intro_stars_t: '{n} İĞNE: GEÇ', intro_stars_d: '{a} iğne ★★ · {b} iğne ★★★', intro_timed_t: 'SÜRELİ BÖLÜM', intro_timed_d: '{n} saniyede iğneleri sapla',
    intro_bomb_t: 'BOMBA', intro_bomb_d: 'Patlayan iğne yanındaki iğneni de düşürür', intro_shield_t: 'ZIRH', intro_shield_d: 'Metalden seken iğne kaybolur, küre ters döner',
    intro_coin_t: 'ALTIN PARA', intro_coin_d: 'Paraya iğne sapla: +2 altın', intro_drift_t: 'GEZEN ZIRH', intro_drift_d: 'Metal plakalar kendi başına kayıyor',
    intro_bgold_t: 'BONUS: ALTIN YAĞMURU', intro_bgold_d: 'Paraları vur, altınları topla', intro_bskill_t: 'BONUS: HEDİYE KUTULARI', intro_bskill_d: 'Kutuları vur, joker kazan',
    rage_t: 'ÖFKELENDİ!', rage_d1: 'Boss hızlandı ve bomba çıkardı', rage_d2: 'Boss hızlandı',
    pop_slow: 'YAVAŞ!', pop_pins: '+2 İĞNE', pop_time: '+15 SN', pop_minus: '−1 İĞNE', pop_boom: 'BOOM', pop_bounce: 'SEKTİ', pop_clash: 'ÇARPTI', pop_gold: '+{n} ALTIN',
    no_stars_reward: 'Yıldız yok · ödül var', targets_left: 'Kalan hedef: {n}', slow_left: 'YAVAŞ {n} sn', tap_hint: 'Ekrana dokun, iğne fırlasın',
    bonus_done: 'BONUS TAMAM', gold_plus: '+{n} altın', no_gift: 'Hediye kutusu vuramadın', bonus_already: 'Bu bonus daha önce alındı',
    boss_beaten: 'BOSS YENİLDİ!', perfect: 'KUSURSUZ!', passed: 'GEÇTİN!', stuck_of: 'Saplanan iğne: {a} / {b}', no_gold_replay: 'Altın yok: sadece yeni yıldız ödül verir',
    coins_collected: 'Toplanan para: +{n}', for3: '★★★ için {n} iğne sapla', time_up: 'SÜRE DOLDU', not_enough: 'YETERSİZ İĞNE',
    stuck_need: 'Saplanan: {a} · Geçmek için: {b}', tip_time: 'Süreli bölümde +15 Saniye jokeri işe yarar', tip_pins: '+2 İğne jokeri bir sonraki denemede yardım eder',
    coins_kept: 'Toplanan para korundu: +{n}', map: 'Harita', retry: 'Tekrar', next: 'Sonraki', market_btn: 'Market',
    paused: 'DURAKLATILDI', pause_status: '{id} · {a} iğne saplandı · {b} iğne kaldı', resume: 'Devam', restart: 'Baştan', home: 'Ana sayfa',
    music: 'Müzik', sound: 'Ses', vibe: 'Titreşim', shake: 'Sarsıntı',
    ch1: 'Amber Vadisi', ch2: 'Turkuaz Koy', ch3: 'Pembe Bulutlar', ch4: 'Yeşil Orman', ch5: 'Mavi Gece', ch6: 'Kızıl Zirve',
    boss1: 'LAV GOLEMİ', boss2: 'DEMİR GÖZ', boss3: 'KRİSTAL GÖLGE',
    sk_slow: 'Yavaşlat', sk_slow_d: 'Küre 8 saniye yavaş döner', sk_pins2: '+2 İğne', sk_pins2_d: 'Bu bölümde 2 iğne fazla', sk_time15: '+15 Saniye', sk_time15_d: 'Süreli bölümde süreyi uzatır',
    net_unreachable: 'Sunucuya ulaşılamadı. İnternet bağlantını kontrol et.', guest_failed: 'Misafir hesabı açılamadı', register_failed: 'Kayıt olunamadı',
    login_failed: 'Giriş yapılamadı', no_account: 'Hesap yok', delete_failed: 'Hesap silinemedi', newer_loaded: 'Başka cihazdaki daha yeni ilerleme yüklendi',
    rejected_loaded: 'İlerleme doğrulanamadı, son geçerli kayıt yüklendi',
    au_intro: 'İlerlemen, altınların ve jokerlerin hesabında saklanır. Telefon değişse de kaldığın yerden devam edersin.',
    au_guest: 'Misafir olarak oyna', au_guest_note: 'Misafir hesabıyla satın alma yapılamaz. Sonradan hesap oluşturursan ilerlemen aktarılır.',
    au_from_guest: 'Misafir ilerlemen, altınların ve jokerlerin bu hesaba aktarılır.', au_reg_intro: 'Kullanıcı adı ve şifre belirle.', au_login_intro: 'Kullanıcı adın ve şifrenle gir.',
    au_username: 'Kullanıcı adı', au_password: 'Şifre', au_password2: 'Şifre (tekrar)', au_show_pw: 'Şifreyi göster',
    au_terms: '{link} okudum, kabul ediyorum', au_terms_link: 'Gizlilik politikasını ve kullanım şartlarını', au_create_btn: 'Hesabı oluştur',
    au_rules: '3–16 karakter: harf, rakam, alt çizgi · Şifre en az 6 karakter', au_back: 'Geri', au_have: 'Zaten hesabım var', au_new: 'Yeni hesap oluştur',
    au_login_guest_warn: 'Başka hesaba girersen bu misafir ilerlemesi bu cihazda kalmaz. Önce hesap oluşturup aktarabilirsin.',
    au_delete_t: 'Hesabı sil', au_delete_guest: 'Misafir ilerlemen kalıcı olarak silinir.', au_delete_user: '{name} hesabı, ilerlemesi, altınları ve jokerleri kalıcı olarak silinir. Bu geri alınamaz.',
    au_delete_pw: 'Onay için şifren', au_delete_btn: 'Kalıcı olarak sil', au_cancel: 'Vazgeç', au_close: 'Kapat',
    au_pw_mismatch: 'Şifreler aynı değil', au_need_terms: 'Devam etmek için gizlilik politikasını ve şartları kabul et',
    au_welcome_new: 'Hoş geldin, {name}! Hesabın hazır', au_welcome_back: 'Tekrar hoş geldin, {name}', au_offline: 'İnternet yok: ilerleme cihazda tutuluyor, bağlanınca kaydedilir',
    au_deleted: 'Hesap silindi', au_guest_lost: 'Misafir oturumu bulunamadı', au_expired: 'Oturumun sona erdi. İlerlemen hesabında güvende, tekrar giriş yap.',
    err_username_format: 'Kullanıcı adı 3–16 karakter olmalı: harf, rakam ve alt çizgi', err_username_reserved: 'Bu kullanıcı adı kullanılamaz', err_username_bad: 'Bu kullanıcı adı uygun değil',
    err_password_length: 'Şifre 6–72 karakter olmalı', err_password_common: 'Bu şifre çok kolay tahmin edilir, başka bir şifre seç', err_password_username: 'Şifre kullanıcı adını içermesin',
    err_terms: 'Kullanım şartlarını ve gizlilik politikasını kabul etmelisin', err_username_taken: 'Bu kullanıcı adı alınmış', err_bad_login: 'Kullanıcı adı ya da şifre yanlış',
    err_rate: 'Çok fazla deneme. Biraz sonra tekrar dene', err_bad_password: 'Şifre yanlış', err_session: 'Oturum geçersiz, tekrar giriş yap', err_server: 'Sunucu hatası',
  },
  en: {
    tap_start: 'Tap to start', title_l1: 'Stick the pins into the spinning orb.', title_l2: 'More pins, more stars.',
    chapter_n: 'Chapter {n}', chapter_caps: 'CHAPTER {n}', playing_guest: 'You are playing as a guest', welcome_user: 'Welcome, {name}',
    ms_passed: '✓ Cleared', bonus_taken: '✓ Collected', need_ms: 'First clear the Chapter {n} milestone', need_bonus: 'Clear level {id} to unlock the bonus',
    need_prev: 'Clear the previous level first', bonus_done_toast: 'Bonus already collected', chapter_locked: 'Chapter {n} is locked', chapter_locked_req: 'Chapter {p} milestone needs ★ {req}',
    market: 'SHOP', gold_packs: 'GOLD PACKS', soon: 'Soon', packs_soon: 'Gold packs will open when the game launches on the app store',
    guest_no_buy1: 'Guests can\'t make purchases.', guest_no_buy2: 'Create an account and keep all your progress.',
    reason_buy: 'Purchases need an account. Your guest progress, gold and boosters move to your account.',
    not_enough_gold: 'Not enough gold', bought: 'Bought {name} ×{n}', settings: 'SETTINGS', guest_account: 'Guest account',
    sync_offline: 'Offline · will save when connected', sync_error: 'Could not save', sync_saving: 'Saving…', sync_ok: 'Progress saved to the cloud',
    create_account: 'Create account', login: 'Log in', logout: 'Log out', delete_account: 'Delete account', logged_out: 'Logged out',
    guest_settings_note: 'Guests can\'t buy. Create an account to keep your progress.', delete_guest: 'Delete guest account',
    privacy_link: 'Privacy policy and terms', language: 'Language',
    remind_title: 'Protect your progress', remind_l1: '★ {stars} stars and {gold} gold are on a guest account.', remind_l2: 'They may be lost if you change phones or delete the game.',
    remind_l3: 'Create an account to keep everything.', later: 'Later',
    milestone: 'MILESTONE', ms_sub: 'Chapter {n} · {name}', ms_claimed: 'Milestone cleared', ms_need_boss: 'First beat the {id} boss level',
    ms_enough: 'Enough stars!', ms_missing: '{n} stars missing: replay earlier levels', reward: 'Reward', claim: 'Claim reward and continue',
    go_chapter: 'Go to Chapter {n}', ok: 'OK', chapter_unlocked: 'Chapter {n} unlocked! Rewards added',
    intro_stars_t: '{n} PINS: PASS', intro_stars_d: '{a} pins ★★ · {b} pins ★★★', intro_timed_t: 'TIMED LEVEL', intro_timed_d: 'Stick the pins within {n} seconds',
    intro_bomb_t: 'BOMB', intro_bomb_d: 'An exploding pin knocks off your nearest pin', intro_shield_t: 'ARMOR', intro_shield_d: 'Pins bounce off metal and are lost; the orb reverses',
    intro_coin_t: 'GOLD COIN', intro_coin_d: 'Pin the coin: +2 gold', intro_drift_t: 'MOVING ARMOR', intro_drift_d: 'Metal plates slide on their own',
    intro_bgold_t: 'BONUS: GOLD RAIN', intro_bgold_d: 'Hit the coins, collect the gold', intro_bskill_t: 'BONUS: GIFT BOXES', intro_bskill_d: 'Hit the boxes, win boosters',
    rage_t: 'ENRAGED!', rage_d1: 'The boss sped up and spawned a bomb', rage_d2: 'The boss sped up',
    pop_slow: 'SLOW!', pop_pins: '+2 PINS', pop_time: '+15 S', pop_minus: '−1 PIN', pop_boom: 'BOOM', pop_bounce: 'BOUNCED', pop_clash: 'CLASH', pop_gold: '+{n} GOLD',
    no_stars_reward: 'No stars · rewards', targets_left: 'Targets left: {n}', slow_left: 'SLOW {n} s', tap_hint: 'Tap the screen to throw a pin',
    bonus_done: 'BONUS COMPLETE', gold_plus: '+{n} gold', no_gift: 'No gift boxes hit', bonus_already: 'This bonus was already collected',
    boss_beaten: 'BOSS DEFEATED!', perfect: 'PERFECT!', passed: 'PASSED!', stuck_of: 'Pins stuck: {a} / {b}', no_gold_replay: 'No gold: only new stars give rewards',
    coins_collected: 'Coins collected: +{n}', for3: 'Stick {n} pins for ★★★', time_up: 'TIME\'S UP', not_enough: 'NOT ENOUGH PINS',
    stuck_need: 'Stuck: {a} · Needed: {b}', tip_time: 'The +15 Seconds booster helps in timed levels', tip_pins: 'The +2 Pins booster helps on your next try',
    coins_kept: 'Coins kept: +{n}', map: 'Map', retry: 'Retry', next: 'Next', market_btn: 'Shop',
    paused: 'PAUSED', pause_status: '{id} · {a} pins stuck · {b} pins left', resume: 'Resume', restart: 'Restart', home: 'Home',
    music: 'Music', sound: 'Sound', vibe: 'Vibration', shake: 'Shake',
    ch1: 'Amber Valley', ch2: 'Turquoise Bay', ch3: 'Pink Clouds', ch4: 'Green Forest', ch5: 'Blue Night', ch6: 'Crimson Peak',
    boss1: 'LAVA GOLEM', boss2: 'IRON EYE', boss3: 'CRYSTAL SHADE',
    sk_slow: 'Slow Down', sk_slow_d: 'The orb spins slowly for 8 seconds', sk_pins2: '+2 Pins', sk_pins2_d: '2 extra pins in this level', sk_time15: '+15 Seconds', sk_time15_d: 'Adds time in timed levels',
    net_unreachable: 'Can\'t reach the server. Check your internet connection.', guest_failed: 'Could not create a guest account', register_failed: 'Sign-up failed',
    login_failed: 'Login failed', no_account: 'No account', delete_failed: 'Could not delete the account', newer_loaded: 'Newer progress from another device was loaded',
    rejected_loaded: 'Progress could not be verified; the last valid save was loaded',
    au_intro: 'Your progress, gold and boosters are saved to your account. Change phones and continue where you left off.',
    au_guest: 'Play as guest', au_guest_note: 'Guests can\'t make purchases. Create an account later and your progress moves with you.',
    au_from_guest: 'Your guest progress, gold and boosters move to this account.', au_reg_intro: 'Choose a username and password.', au_login_intro: 'Log in with your username and password.',
    au_username: 'Username', au_password: 'Password', au_password2: 'Password (again)', au_show_pw: 'Show password',
    au_terms: 'I have read and accept the {link}', au_terms_link: 'privacy policy and terms of use', au_create_btn: 'Create account',
    au_rules: '3–16 characters: letters, digits, underscore · Password at least 6 characters', au_back: 'Back', au_have: 'I already have an account', au_new: 'Create a new account',
    au_login_guest_warn: 'If you log in to another account, this guest progress stays behind. Create an account first to keep it.',
    au_delete_t: 'Delete account', au_delete_guest: 'Your guest progress will be deleted permanently.', au_delete_user: 'The {name} account, its progress, gold and boosters will be deleted permanently. This can\'t be undone.',
    au_delete_pw: 'Your password to confirm', au_delete_btn: 'Delete permanently', au_cancel: 'Cancel', au_close: 'Close',
    au_pw_mismatch: 'Passwords don\'t match', au_need_terms: 'Accept the privacy policy and terms to continue',
    au_welcome_new: 'Welcome, {name}! Your account is ready', au_welcome_back: 'Welcome back, {name}', au_offline: 'No internet: progress is kept on this device and saved when you\'re online',
    au_deleted: 'Account deleted', au_guest_lost: 'Guest session not found', au_expired: 'Your session expired. Your progress is safe, please log in again.',
    err_username_format: 'Username must be 3–16 characters: letters, digits and underscore', err_username_reserved: 'This username is not allowed', err_username_bad: 'This username is not appropriate',
    err_password_length: 'Password must be 6–72 characters', err_password_common: 'This password is too easy to guess, choose another', err_password_username: 'Password must not contain your username',
    err_terms: 'You must accept the terms and privacy policy', err_username_taken: 'This username is taken', err_bad_login: 'Wrong username or password',
    err_rate: 'Too many attempts. Try again a bit later', err_bad_password: 'Wrong password', err_session: 'Session invalid, please log in again', err_server: 'Server error',
  },
};

function detectLang() {
  const saved = store.get('lang', null);
  if (saved && STRINGS[saved]) return saved;
  for (const l of navigator.languages || [navigator.language || 'en']) {
    const c = String(l).slice(0, 2).toLowerCase();
    if (STRINGS[c]) return c;
  }
  return 'en';
}
let LANG = detectLang();
document.documentElement.lang = LANG;
function setLang(code) {
  if (!STRINGS[code]) return;
  LANG = code; store.set('lang', code); document.documentElement.lang = code;
  if (typeof onLangChange === 'function') onLangChange();
}
function t(key, params) {
  let s = (STRINGS[LANG] && STRINGS[LANG][key]) || STRINGS.en[key] || STRINGS.tr[key] || key;
  if (params) s = s.replace(/\{(\w+)\}/g, (m, k) => (params[k] !== undefined ? params[k] : m));
  return s;
}
// Sunucu hata kodunu oyuncunun diline çevirir (kod yoksa sunucunun mesajı)
const errText = (data, fallbackKey) => (data && data.code && (STRINGS[LANG][`err_${data.code}`] || STRINGS.en[`err_${data.code}`]))
  || (data && data.error && (LANG === 'tr' || data.code === 'net') ? data.error : t(fallbackKey));
const privacyUrl = () => (LANG === 'tr' ? 'privacy.html' : 'privacy-en.html');
