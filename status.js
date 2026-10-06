(function () {
  var $ = function (id) { return document.getElementById(id); };
  function quando(iso) { if (!iso) return '—'; var d = new Date(iso); return isNaN(d) ? iso : d.toLocaleString('pt-BR'); }
  function linhas(pares) { $('tabela').innerHTML = ''; pares.forEach(function (p) { var tr = document.createElement('tr'); var a = document.createElement('td'), b = document.createElement('td'); a.textContent = p[0]; b.textContent = p[1]; tr.appendChild(a); tr.appendChild(b); $('tabela').appendChild(tr); }); }
  function caixa(cls, titulo, texto) { var r = $('resultado'); r.className = 'card ' + cls; r.innerHTML = ''; var t = document.createElement('b'); t.className = 't'; t.textContent = titulo; r.appendChild(t); r.appendChild(document.createTextNode(texto)); }
  function passos(lista) { var p = $('passos'); p.innerHTML = ''; p.hidden = !lista.length; if (!lista.length) return; var h = document.createElement('b'); h.textContent = 'O que fazer:'; p.appendChild(h); var ol = document.createElement('ol'); lista.forEach(function (x) { var li = document.createElement('li'); li.innerHTML = x; ol.appendChild(li); }); p.appendChild(ol); }
  function checar() {
    caixa('', 'Verificando…', ''); passos([]);
    fetch('/api/health', { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (h) {
      var cria = h.discoCriadoEm ? new Date(h.discoCriadoEm).getTime() : 0, desde = h.noArDesde ? new Date(h.noArDesde).getTime() : 0;
      var recente = cria && desde && Math.abs(desde - cria) < 120000;
      linhas([['Versão do app', String(h.versao || '?')], ['Versão do servidor', h.release || '(antiga)'], ['Servidor no ar desde', quando(h.noArDesde)], ['Dados guardados desde', quando(h.discoCriadoEm)], ['Onde ficam os dados', h.dados || '?'], ['Volume encontrado', h.volumeEncontrado ? 'sim' : 'não']]);
      if (h.dados === undefined) {
        caixa('aviso', 'Servidor com versão antiga', 'Este servidor ainda não tem a proteção de dados. Envie o arquivo server.js novo ao GitHub (Add file, Upload files, Commit changes) e espere o Railway terminar de publicar.');
        passos([]);
      } else if (h.duravel === false) {
        caixa('ruim', 'ARMAZENAMENTO TEMPORÁRIO', 'As contas são apagadas a cada atualização. Por segurança, novos cadastros estão pausados até isso ser corrigido.');
        passos(['Abra o <b>Railway</b> e entre no projeto do Ronald Jump.', 'Clique com o botão direito num <b>espaço vazio</b> do quadro do projeto (ou aperte <b>Cmd + K</b> e digite <b>Volume</b>) e escolha <b>Volume</b> / <b>Create Volume</b>.', 'Quando perguntar a qual serviço ligar, escolha <b>ronald-jump-app</b>. No caminho de montagem (<b>Mount path</b>), escreva <b>/data</b> e confirme.', 'Aguarde o Railway publicar de novo (Deployments: <b>Deployment successful</b>).', 'Volte aqui e toque em <b>Verificar de novo</b>. Deve ficar verde.']);
      } else {
        caixa('ok', 'ARMAZENAMENTO SEGURO', 'As contas e treinos ficam guardados e não são apagados nas atualizações.' + (recente ? ' Os dados foram criados junto com este deploy: é normal na primeira vez com o volume. Se isso se repetir depois de CADA atualização, eles estão sendo apagados: me avise.' : ''));
        passos([]);
        if (recente) $('resultado').className = 'card aviso';
      }
      if (h.arquivosDesatualizados && h.duravel !== false && h.dados !== undefined) {
        caixa('aviso', 'ARQUIVOS DE VERSÕES DIFERENTES', 'O servidor.js é da versão ' + h.versaoServidor + ', mas o app (app.js) é da versão ' + h.versao + '. Alguns arquivos não foram enviados ao GitHub, e por isso a atualização do app pode não chegar.');
        passos(['No GitHub, envie <b>todos os arquivos</b> da atualização (Add file, Upload files), inclusive <b>app.js</b> e <b>server.js</b>.', 'Espere o Railway terminar de publicar.', 'Volte aqui e toque em <b>Verificar de novo</b>.']);
      }
    }).catch(function () { caixa('ruim', 'Não consegui falar com o servidor', 'Confira a internet e se o Railway está com o serviço "Online".'); linhas([]); });
  }
  $('de-novo').addEventListener('click', checar); checar();
})();
