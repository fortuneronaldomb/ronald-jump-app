(function () {
  var $ = function (id) { return document.getElementById(id); };
  var API = window.RJ_API_BASE || '';
  var modo = 'login';
  var PAISES = { BR: 'Brasil', PT: 'Portugal', US: 'Estados Unidos', AR: 'Argentina', UY: 'Uruguai', PY: 'Paraguai', CL: 'Chile', CO: 'Colômbia', MX: 'México', ES: 'Espanha', IT: 'Itália', FR: 'França', DE: 'Alemanha', GB: 'Reino Unido', JP: 'Japão', AO: 'Angola', MZ: 'Moçambique' };
  function flag(c) { try { return String.fromCodePoint.apply(null, c.split('').map(function (x) { return 127397 + x.charCodeAt(0); })); } catch (e) { return ''; } }

  // quem já está logado vai direto para o app
  try { if (JSON.parse(localStorage.getItem('rj.token'))) { location.replace('/'); return; } } catch (e) {}

  var sel = $('pais'); sel.innerHTML = '';
  Object.keys(PAISES).forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = flag(c) + ' ' + PAISES[c]; sel.appendChild(o); });

  function erro(t) { $('erro').textContent = t || ''; }
  function setModo(m) {
    modo = m; erro('');
    $('tLogin').className = m === 'login' ? 'on' : ''; $('tReg').className = m === 'reg' ? 'on' : '';
    $('tLogin').setAttribute('aria-selected', m === 'login'); $('tReg').setAttribute('aria-selected', m === 'reg');
    Array.prototype.forEach.call(document.querySelectorAll('[data-reg]'), function (el) { el.hidden = m !== 'reg'; });
    $('go').textContent = m === 'login' ? 'Entrar' : 'Criar conta';
    $('senha').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('senha').placeholder = m === 'login' ? 'Sua senha' : 'Crie uma senha';
    regras();
  }
  $('tLogin').addEventListener('click', function () { setModo('login'); });
  $('tReg').addEventListener('click', function () { setModo('reg'); });

  function checaSenha(pw) {
    var seq = /(0123|1234|2345|3456|4567|5678|6789|abcd|qwer)/i.test(pw) || /(.)\1{3,}/.test(pw);
    return { r1: pw.length >= 8 && pw.length <= 128, r2: /[A-Za-z]/.test(pw) && /[0-9]/.test(pw), r3: pw.length > 0 && !seq };
  }
  function regras() { var c = checaSenha($('senha').value); ['r1', 'r2', 'r3'].forEach(function (k) { $(k).className = c[k] ? 'ok' : ''; }); }
  $('senha').addEventListener('input', regras);

  $('f').addEventListener('submit', function (ev) {
    ev.preventDefault(); erro('');
    var email = $('email').value.trim(), senha = $('senha').value;
    if (!email || !senha) return erro('Preencha o e-mail e a senha.');
    var body = { email: email, password: senha };
    if (modo === 'reg') {
      body.name = $('nome').value.trim(); body.country = $('pais').value; body.kg = Number(String($('kg').value).replace(',', '.')); body.consent = $('ok').checked;
      if (!body.name) return erro('Escolha um nome para o ranking.');
      var c = checaSenha(senha); if (!(c.r1 && c.r2 && c.r3)) return erro('A senha precisa seguir as três regras da lista.');
      if (!(body.kg >= 30 && body.kg <= 250)) return erro('O peso deve estar entre 30 e 250 kg.');
      if (!body.consent) return erro('Confirme que tem 18 anos ou mais e aceite a Política de Privacidade.');
    }
    $('go').disabled = true; $('go').textContent = 'Aguarde…';
    fetch(API + (modo === 'reg' ? '/api/register' : '/api/login'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) { erro(res.d.erro || 'Não foi possível continuar. Tente de novo.'); return; }
        localStorage.setItem('rj.token', JSON.stringify(res.d.token)); localStorage.setItem('rj.user', JSON.stringify(res.d.user));
        location.replace('/');
      })
      .catch(function () { erro('Sem conexão com o servidor. Confira a internet e tente de novo.'); })
      .then(function () { $('go').disabled = false; $('go').textContent = modo === 'login' ? 'Entrar' : 'Criar conta'; });
  });

  // instalar como app
  var standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
  var ios = /iphone|ipad|ipod/i.test(navigator.userAgent), android = /android/i.test(navigator.userAgent), movel = ios || android;
  var promptInstalar = null;
  if (!standalone && movel) {
    $('instalar').hidden = false;
    if (ios) $('iIos').hidden = false; else $('iOutro').hidden = false;
  }
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault(); promptInstalar = e;
    if (standalone) return;
    $('instalar').hidden = false; $('iAndroid').hidden = false; $('iOutro').hidden = true;
  });
  $('btnInstalar').addEventListener('click', function () {
    if (!promptInstalar) return;
    promptInstalar.prompt(); promptInstalar.userChoice.then(function () { promptInstalar = null; $('iAndroid').hidden = true; });
  });
  window.addEventListener('appinstalled', function () { $('instalar').hidden = true; });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function () {});
  setModo('login');
})();
