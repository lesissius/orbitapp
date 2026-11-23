// İğne Ustası: üyelik ekranları (hoş geldin, kayıt, giriş, hesap silme). Metin kutuları için HTML kullanılır.
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
function showAuth(mode, opts = {}) {
  if (opts.after) authAfter = opts.after;
  const closable = !!ACCOUNT && mode !== 'welcome';
  const x = closable ? '<button class="close" data-a="close" aria-label="Kapat">✕</button>' : '';
  let html = '';
  if (mode === 'welcome') {
    html = `<img class="logo" src="icon-192.png" alt=""><h1>İĞNE USTASI</h1>
      <p>İlerlemen, altınların ve jokerlerin hesabında saklanır. Telefon değişse de kaldığın yerden devam edersin.</p>
      <button class="green" data-a="register">Hesap oluştur</button>
      <button class="blue" data-a="login">Giriş yap</button>
      <button class="ghost" data-a="guest">Misafir olarak oyna</button>
      <div class="err"></div>
      <div class="small">Misafir hesabıyla satın alma yapılamaz. Sonradan hesap oluşturursan ilerlemen aktarılır.</div>
      <div class="legal"><a href="privacy.html" target="_blank" rel="noopener">Gizlilik politikası ve kullanım şartları</a></div>`;
  } else if (mode === 'register' || mode === 'login') {
    const reg = mode === 'register', fromGuest = reg && ACCOUNT && ACCOUNT.guest;
    html = `${x}<h2>${reg ? 'Hesap oluştur' : 'Giriş yap'}</h2>
      <p>${esc(opts.reason || (fromGuest ? 'Misafir ilerlemen, altınların ve jokerlerin bu hesaba aktarılır.' : reg ? 'Kullanıcı adı ve şifre belirle.' : 'Kullanıcı adın ve şifrenle gir.'))}</p>
      <form novalidate>
        <label for="au">Kullanıcı adı</label>
        <input id="au" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="16" required>
        <label for="ap">Şifre</label>
        <input id="ap" name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" maxlength="72" required>
        ${reg ? '<label for="ap2">Şifre (tekrar)</label><input id="ap2" name="password2" type="password" autocomplete="new-password" maxlength="72" required>' : ''}
        <label class="chk"><input type="checkbox" data-a="showpw"> Şifreyi göster</label>
        ${reg ? '<label class="chk"><input type="checkbox" name="terms"> <span><a href="privacy.html" target="_blank" rel="noopener">Gizlilik politikasını ve kullanım şartlarını</a> okudum, kabul ediyorum</span></label>' : ''}
        <button class="${reg ? 'green' : 'blue'}" type="submit">${reg ? 'Hesabı oluştur' : 'Giriş yap'}</button>
      </form>
      <div class="err"></div>
      ${reg ? '<div class="small">3–16 karakter: harf, rakam, alt çizgi · Şifre en az 6 karakter</div>' : ''}
      ${!ACCOUNT ? '<button class="ghost" data-a="welcome">Geri</button>' : `<button class="ghost" data-a="${reg ? 'login' : 'register'}">${reg ? 'Zaten hesabım var' : 'Yeni hesap oluştur'}</button>`}
      ${mode === 'login' && ACCOUNT && ACCOUNT.guest ? '<div class="small">Başka hesaba girersen bu misafir ilerlemesi bu cihazda kalmaz. Önce hesap oluşturup aktarabilirsin.</div>' : ''}`;
  } else if (mode === 'delete') {
    const guest = ACCOUNT && ACCOUNT.guest;
    html = `${x}<h2 style="color:#ff8da1">Hesabı sil</h2>
      <p>${guest ? 'Misafir ilerlemen kalıcı olarak silinir.' : `<b>${esc(ACCOUNT.username)}</b> hesabı, ilerlemesi, altınları ve jokerleri kalıcı olarak silinir. Bu geri alınamaz.`}</p>
      <form novalidate>
        ${guest ? '' : '<label for="ap">Onay için şifren</label><input id="ap" name="password" type="password" autocomplete="current-password" maxlength="72" required>'}
        <button class="red" type="submit">Kalıcı olarak sil</button>
      </form>
      <div class="err"></div>
      <button class="ghost" data-a="close">Vazgeç</button>`;
  }
  authRoot.innerHTML = `<div class="card" role="dialog" aria-modal="true">${html}</div>`;
  authRoot.classList.add('open');
  const err = authRoot.querySelector('.err');
  const setErr = (m) => { if (err) err.textContent = m || ''; };
  const busy = (on) => authRoot.querySelectorAll('button,input').forEach((el) => { el.disabled = on; });

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
      if (r.offline) showToast('İnternet yok: ilerleme cihazda tutuluyor, bağlanınca kaydedilir');
      return;
    }
    showAuth(a, { reason: opts.reason });
  }));
  const form = authRoot.querySelector('form');
  if (form) {
    const first = form.querySelector('input'); if (first) setTimeout(() => first.focus(), 50);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = new FormData(form), u = String(f.get('username') || '').trim(), pw = String(f.get('password') || '');
      setErr('');
      if (mode === 'register' && pw !== String(f.get('password2') || '')) { setErr('Şifreler aynı değil'); return; }
      if (mode === 'register' && !f.get('terms')) { setErr('Devam etmek için gizlilik politikasını ve şartları kabul et'); return; }
      busy(true);
      const r = mode === 'register' ? await register(u, pw) : mode === 'login' ? await login(u, pw) : await deleteAccount(pw);
      busy(false);
      if (!r.ok) { setErr(r.error); return; }
      if (mode === 'delete') { closeAuth(); afterSignOut('Hesap silindi'); return; }
      authDone();
      showToast(mode === 'register' ? `Hoş geldin, ${ACCOUNT.username}! Hesabın hazır` : `Tekrar hoş geldin, ${ACCOUNT.username}`);
    });
  }
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
  if (ACCOUNT.guest) { ACCOUNT = null; saveAccount(); afterSignOut('Misafir oturumu bulunamadı'); return; }
  showAuth('login', { reason: 'Oturumun sona erdi. İlerlemen hesabında güvende, tekrar giriş yap.' });
}
