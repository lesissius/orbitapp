// Orbitapp: üyelik ekranları (hoş geldin, kayıt, giriş, hesap silme). Metin kutuları için HTML kullanılır.
'use strict';
const authRoot = document.createElement('div');
authRoot.id = 'auth';
document.body.appendChild(authRoot);
const authStyle = document.createElement('style');
authStyle.textContent = `
#auth{position:fixed;inset:0;display:none;align-items:center;justify-content:center;z-index:10;
  background:rgba(8,6,22,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);
  font-family:system-ui,-apple-system,"Segoe UI",sans-serif;color:#fff;padding:16px;box-sizing:border-box;
  padding-top:max(16px,env(safe-area-inset-top));padding-bottom:max(16px,env(safe-area-inset-bottom))}
#auth.open{display:flex}
#auth .card{width:100%;max-width:380px;background:rgba(18,12,40,.97);border:2px solid rgba(255,255,255,.14);
  border-radius:22px;padding:24px 22px 20px;box-sizing:border-box;box-shadow:0 20px 60px rgba(0,0,0,.5);position:relative}
#auth h1{margin:0 0 4px;font-size:26px;font-weight:900;text-align:center;letter-spacing:.5px}
#auth h2{margin:0 0 6px;font-size:21px;font-weight:900;text-align:center;color:#ffd34d}
#auth p{margin:6px 0 14px;font-size:14px;line-height:1.45;color:rgba(255,255,255,.75);text-align:center}
#auth label{display:block;font-size:13px;font-weight:700;margin:12px 0 6px;color:rgba(255,255,255,.8)}
#auth input{width:100%;box-sizing:border-box;padding:13px 14px;border-radius:12px;border:2px solid rgba(255,255,255,.18);
  background:rgba(255,255,255,.08);color:#fff;font-size:16px;outline:none}
#auth input:focus{border-color:#ffb84d}
#auth button{width:100%;margin-top:12px;padding:14px;border:0;border-radius:14px;font-size:17px;font-weight:900;cursor:pointer;
  color:#1a1030;background:linear-gradient(#ffcf6b,#e89a2c);box-shadow:inset 0 0 0 2px rgba(255,255,255,.3)}
#auth button.green{background:linear-gradient(#7ee8a6,#3fb36c);color:#0b2015}
#auth button.blue{background:linear-gradient(#a3c2ff,#5f86e6);color:#0d1430}
#auth button.ghost{background:transparent;color:rgba(255,255,255,.75);box-shadow:inset 0 0 0 2px rgba(255,255,255,.18)}
#auth button.red{background:linear-gradient(#ff8f9f,#e2475f);color:#2a0710}
#auth button:disabled{opacity:.55;cursor:default}
#auth .err{min-height:18px;margin-top:10px;font-size:14px;font-weight:700;color:#ff8da1;text-align:center}
#auth .close{position:absolute;top:10px;right:12px;width:36px;height:36px;margin:0;padding:0;border-radius:18px;
  background:rgba(255,255,255,.1);color:#fff;font-size:18px;box-shadow:none}
#auth .small{font-size:12px;color:rgba(255,255,255,.5);text-align:center;margin-top:14px}
#auth label.chk{display:flex;gap:10px;align-items:flex-start;font-weight:600;font-size:13px;margin:12px 0 0;cursor:pointer}
#auth label.chk input{width:20px;height:20px;flex:none;margin:0;accent-color:#ffb84d}
#auth a{color:#ffd34d}
#auth .legal{font-size:12px;color:rgba(255,255,255,.5);text-align:center;margin-top:10px}
#auth .langs{display:flex;gap:6px;justify-content:center;margin:-6px 0 12px}
#auth button.lang{width:auto;margin:0;padding:6px 12px;font-size:13px;font-weight:800;border-radius:10px;background:rgba(255,255,255,.08);color:rgba(255,255,255,.75);box-shadow:inset 0 0 0 2px rgba(255,255,255,.14)}
#auth button.lang.on{background:#ffb84d;color:#1a1030}
#auth .wordmark{display:block;width:100%;max-width:300px;height:auto;margin:0 auto 6px}
#auth .logo{display:block;width:84px;height:84px;margin:0 auto 8px;border-radius:20px;box-shadow:0 6px 18px rgba(0,0,0,.4)}
`;
document.head.appendChild(authStyle);

let authAfter = null; // giriş tamamlanınca yapılacak iş
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function closeAuth() { authRoot.classList.remove('open'); authRoot.innerHTML = ''; }
function authDone() {
  closeAuth();
  const fn = authAfter; authAfter = null;
  if (fn) fn();
}

// mode: 'welcome' | 'register' | 'login' | 'delete'
// opts.reasonKey: üstte gösterilecek açıklamanın dil anahtarı
let authState = null; // dil değişince aynı pencere yeniden çizilir
function langSwitch() {
  return `<div class="langs">${LANGS.map((l) => `<button type="button" class="lang${l.code === LANG ? ' on' : ''}" data-lang="${l.code}">${l.name}</button>`).join('')}</div>`;
}
function showAuth(mode, opts = {}) {
  if (opts.after) authAfter = opts.after;
  authState = { mode, opts: { reasonKey: opts.reasonKey } };
  const closable = !!ACCOUNT && mode !== 'welcome';
  const x = closable ? `<button class="close" data-a="close" aria-label="${esc(t('au_close'))}">✕</button>` : '';
  const terms = `<a href="${privacyUrl()}" target="_blank" rel="noopener">${esc(t('au_terms_link'))}</a>`;
  let html = '';
  if (mode === 'welcome') {
    html = `${langSwitch()}<img class="wordmark" src="assets/logo.png?v=${ASSET_V}" alt="${esc(BRAND)}">
      <p>${esc(t('au_intro'))}</p>
      <button class="green" data-a="register">${esc(t('create_account'))}</button>
      <button class="blue" data-a="login">${esc(t('login'))}</button>
      <button class="ghost" data-a="guest">${esc(t('au_guest'))}</button>
      <div class="err"></div>
      <div class="small">${esc(t('au_guest_note'))}</div>
      <div class="legal"><a href="${privacyUrl()}" target="_blank" rel="noopener">${esc(t('privacy_link'))}</a></div>`;
  } else if (mode === 'register' || mode === 'login') {
    const reg = mode === 'register', fromGuest = reg && ACCOUNT && ACCOUNT.guest;
    const intro = opts.reasonKey ? t(opts.reasonKey) : fromGuest ? t('au_from_guest') : reg ? t('au_reg_intro') : t('au_login_intro');
    html = `${x}<h2>${esc(reg ? t('create_account') : t('login'))}</h2>
      <p>${esc(intro)}</p>
      <form novalidate>
        <label for="au">${esc(t('au_username'))}</label>
        <input id="au" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="16" required>
        <label for="ap">${esc(t('au_password'))}</label>
        <input id="ap" name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" maxlength="72" required>
        ${reg ? `<label for="ap2">${esc(t('au_password2'))}</label><input id="ap2" name="password2" type="password" autocomplete="new-password" maxlength="72" required>` : ''}
        <label class="chk"><input type="checkbox" data-a="showpw"> ${esc(t('au_show_pw'))}</label>
        ${reg ? `<label class="chk"><input type="checkbox" name="terms"> <span>${esc(t('au_terms', { link: '\u0000' })).replace('\u0000', terms)}</span></label>` : ''}
        <button class="${reg ? 'green' : 'blue'}" type="submit">${esc(reg ? t('au_create_btn') : t('login'))}</button>
      </form>
      <div class="err"></div>
      ${reg ? `<div class="small">${esc(t('au_rules'))}</div>` : ''}
      ${!ACCOUNT ? `<button class="ghost" data-a="welcome">${esc(t('au_back'))}</button>` : `<button class="ghost" data-a="${reg ? 'login' : 'register'}">${esc(reg ? t('au_have') : t('au_new'))}</button>`}
      ${mode === 'login' && ACCOUNT && ACCOUNT.guest ? `<div class="small">${esc(t('au_login_guest_warn'))}</div>` : ''}`;
  } else if (mode === 'delete') {
    const guest = ACCOUNT && ACCOUNT.guest;
    html = `${x}<h2 style="color:#ff8da1">${esc(t('au_delete_t'))}</h2>
      <p>${guest ? esc(t('au_delete_guest')) : esc(t('au_delete_user', { name: '\u0000' })).replace('\u0000', `<b>${esc(ACCOUNT.username)}</b>`)}</p>
      <form novalidate>
        ${guest ? '' : `<label for="ap">${esc(t('au_delete_pw'))}</label><input id="ap" name="password" type="password" autocomplete="current-password" maxlength="72" required>`}
        <button class="red" type="submit">${esc(t('au_delete_btn'))}</button>
      </form>
      <div class="err"></div>
      <button class="ghost" data-a="close">${esc(t('au_cancel'))}</button>`;
  }
  authRoot.innerHTML = `<div class="card" role="dialog" aria-modal="true">${html}</div>`;
  authRoot.classList.add('open');
  const err = authRoot.querySelector('.err');
  const setErr = (m) => { if (err) err.textContent = m || ''; };
  const busy = (on) => authRoot.querySelectorAll('button,input').forEach((el) => { el.disabled = on; });

  authRoot.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  const showPw = authRoot.querySelector('[data-a="showpw"]');
  if (showPw) showPw.addEventListener('change', () => authRoot.querySelectorAll('input[name^="password"]').forEach((el) => { el.type = showPw.checked ? 'text' : 'password'; }));
  authRoot.querySelectorAll('[data-a]').forEach((b) => b.dataset.a !== 'showpw' && b.addEventListener('click', async (e) => {
    e.preventDefault();
    const a = b.dataset.a;
    if (a === 'close') { closeAuth(); authAfter = null; return; }
    if (a === 'guest') {
      busy(true); setErr('');
      const r = await startGuest();
      busy(false);
      if (!r.ok) { setErr(r.error); return; }
      authDone();
      if (r.offline) showToast(t('au_offline'));
      return;
    }
    showAuth(a, { reasonKey: opts.reasonKey });
  }));
  const form = authRoot.querySelector('form');
  if (form) {
    const first = form.querySelector('input'); if (first) setTimeout(() => first.focus(), 50);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(form), u = String(f.get('username') || '').trim(), pw = String(f.get('password') || '');
      setErr('');
      if (mode === 'register' && pw !== String(f.get('password2') || '')) { setErr(t('au_pw_mismatch')); return; }
      if (mode === 'register' && !f.get('terms')) { setErr(t('au_need_terms')); return; }
      busy(true);
      const r = mode === 'register' ? await register(u, pw) : mode === 'login' ? await login(u, pw) : await deleteAccount(pw);
      busy(false);
      if (!r.ok) { setErr(r.error); return; }
      if (mode === 'delete') { closeAuth(); afterSignOut(t('au_deleted')); return; }
      authDone();
      showToast(mode === 'register' ? t('au_welcome_new', { name: ACCOUNT.username }) : t('au_welcome_back', { name: ACCOUNT.username }));
    });
  }
}
// Dil değişince açık üyelik penceresi yeni dilde yeniden çizilir (yazılanlar korunur)
function onLangChange() {
  if (!authRoot.classList.contains('open') || !authState) return;
  const vals = {}; authRoot.querySelectorAll('input[name]').forEach((el) => { vals[el.name] = el.type === 'checkbox' ? el.checked : el.value; });
  showAuth(authState.mode, authState.opts);
  authRoot.querySelectorAll('input[name]').forEach((el) => { if (el.name in vals) { if (el.type === 'checkbox') el.checked = vals[el.name]; else el.value = vals[el.name]; } });
}

// Çıkış ya da silme sonrası: giriş ekranına dön
function afterSignOut(msg) {
  screen = 'title'; overlay = null; paused = false; lv = null;
  musicUpdate();
  if (msg) showToast(msg);
  showAuth('welcome', { after: () => { screen = 'map'; viewChapter = maxOpenChapter(); scrollToCurrent(); musicUpdate(); } });
}
// Oturum süresi dolduysa: kayıtlı hesapta tekrar giriş istenir
function sessionExpired() {
  if (!ACCOUNT) return;
  if (ACCOUNT.guest) { ACCOUNT = null; saveAccount(); afterSignOut(t('au_guest_lost')); return; }
  showAuth('login', { reasonKey: 'au_expired' });
}
