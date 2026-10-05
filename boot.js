// Rede de segurança: se o app não terminar de carregar (arquivos misturados, cache velho, erro de script),
// mostra um aviso com o motivo e o botão "Atualizar o app", que limpa o cache e recarrega.
(function () {
  var ultimoErro = '';
  function limpar() {
    var p = [];
    try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) p.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })); } catch (e) {}
    try { if (window.caches) p.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })); } catch (e) {}
    return Promise.all(p).catch(function () {});
  }
  function diagnostico(box) {
    var arqs = ['/app.js', '/config.js', '/style.css'], linhas = [];
    if (ultimoErro) linhas.push('Erro: ' + ultimoErro);
    Promise.all(arqs.map(function (u) {
      return fetch(u, { cache: 'no-store' }).then(function (r) {
        return r.text().then(function (t) {
          var ct = (r.headers.get('content-type') || '').split(';')[0];
          if (!r.ok) linhas.push(u + ': não encontrado (' + r.status + ')');
          else if (/json/.test(ct)) linhas.push(u + ': resposta errada');
          if (u === '/app.js' && r.ok) {
            var m = /VERSAO\s*=\s*(\d+)/.exec(t); linhas.push('app.js versão ' + (m ? m[1] : '?'));
            var im = t.match(/from\s*['"](\/[^'"]+\.js)['"]/g) || [];
            return Promise.all(im.map(function (x) { var f = /['"](\/[^'"]+)['"]/.exec(x)[1]; return fetch(f, { cache: 'no-store' }).then(function (rr) { if (!rr.ok) linhas.push(f + ': não encontrado (' + rr.status + ')'); }).catch(function () { linhas.push(f + ': sem conexão'); }); }));
          }
        });
      }).catch(function () { linhas.push(u + ': sem conexão'); });
    })).then(function () { box.textContent = linhas.join('\n'); });
  }
  function mostrar() {
    if (window.__rjPronto || document.getElementById('rj-erro')) return;
    var d = document.createElement('div'); d.id = 'rj-erro';
    d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#e8c231;color:#0a0a0a;padding:16px 18px calc(16px + env(safe-area-inset-bottom,0px));font:700 16px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 -4px 20px #0008';
    d.appendChild(document.createTextNode('O app não carregou direito.'));
    var info = document.createElement('div'); info.style.cssText = 'white-space:pre-wrap;font:12px/1.4 ui-monospace,monospace;margin:6px 0 8px;text-align:left'; d.appendChild(info);
    var b = document.createElement('button'); b.textContent = 'Atualizar o app';
    b.style.cssText = 'display:block;width:100%;border:0;border-radius:999px;padding:14px;background:#0a0a0a;color:#e8c231;font:700 16px system-ui,sans-serif';
    b.onclick = function () { b.textContent = 'Atualizando…'; limpar().then(function () { location.reload(); }); };
    d.appendChild(b); (document.body || document.documentElement).appendChild(d); diagnostico(info);
  }
  window.addEventListener('error', function (e) { if (e && e.message) ultimoErro = e.message + (e.filename ? ' (' + String(e.filename).split('/').pop() + ':' + e.lineno + ')' : ''); if (!window.__rjPronto) setTimeout(mostrar, 400); }, true);
  window.addEventListener('unhandledrejection', function (e) { ultimoErro = String(e && e.reason && e.reason.message || e.reason || ''); if (!window.__rjPronto) setTimeout(mostrar, 400); });
  setTimeout(function () { if (!window.__rjPronto) mostrar(); }, 6000);
})();
