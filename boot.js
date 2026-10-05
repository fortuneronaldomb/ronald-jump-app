// Rede de segurança: se o app não terminar de carregar (arquivos misturados, cache velho, erro de script),
// mostra um aviso com botão "Atualizar o app" que limpa o cache e recarrega, em vez de deixar a tela travada.
(function () {
  function limpar() {
    var p = [];
    try { if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) p.push(navigator.serviceWorker.getRegistrations().then(function (rs) { return Promise.all(rs.map(function (r) { return r.unregister(); })); })); } catch (e) {}
    try { if (window.caches) p.push(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })); } catch (e) {}
    return Promise.all(p).catch(function () {});
  }
  function mostrar() {
    if (window.__rjPronto || document.getElementById('rj-erro')) return;
    var d = document.createElement('div'); d.id = 'rj-erro';
    d.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#e8c231;color:#0a0a0a;padding:16px 18px calc(16px + env(safe-area-inset-bottom,0px));font:700 16px/1.4 system-ui,sans-serif;text-align:center;box-shadow:0 -4px 20px #0008';
    d.textContent = 'O app não carregou direito. ';
    var b = document.createElement('button');
    b.textContent = 'Atualizar o app';
    b.style.cssText = 'margin-top:8px;display:block;width:100%;border:0;border-radius:999px;padding:14px;background:#0a0a0a;color:#e8c231;font:700 16px system-ui,sans-serif';
    b.onclick = function () { b.textContent = 'Atualizando…'; limpar().then(function () { location.reload(); }); };
    d.appendChild(b); (document.body || document.documentElement).appendChild(d);
  }
  window.addEventListener('error', function () { if (!window.__rjPronto) setTimeout(mostrar, 400); });
  window.addEventListener('unhandledrejection', function () { if (!window.__rjPronto) setTimeout(mostrar, 400); });
  setTimeout(function () { if (!window.__rjPronto) mostrar(); }, 6000);
})();
