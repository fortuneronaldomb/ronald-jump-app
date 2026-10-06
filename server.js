// Servidor do Ronald Jump: entrega o app (PWA) e guarda o ranking mundial.
// Sem dependências externas. Rode com: npm start
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(ROOT, 'public');
// Onde ficam os dados (contas, treinos, fotos). No Railway, o Volume anexado define RAILWAY_VOLUME_MOUNT_PATH: usamos
// essa pasta sozinhos, então não depende de lembrar de configurar DATA_DIR.
const EM_RAILWAY = Object.keys(process.env).some(k => k.startsWith('RAILWAY_')); // qualquer variável do Railway
// Descobre discos de verdade (volumes) montados no contêiner, mesmo que o nome da variável mude ou que o caminho não seja /data.
function volumesMontados() {
  try {
    const out = [];
    for (const linha of fs.readFileSync(process.env.RJ_MOUNTINFO || '/proc/self/mountinfo', 'utf8').split('\n')) {
      const [pre, pos] = linha.split(' - '); if (!pos) continue;
      const campos = pre.split(' '), ponto = (campos[4] || '').replace(/\\040/g, ' '), tipo = pos.split(' ')[0];
      if (!ponto || ponto === '/' || /^\/(proc|sys|dev|run|etc|nix|usr|lib|lib64|bin|sbin|root|var\/run)(\/|$)/.test(ponto)) continue;
      if (/^(overlay|proc|sysfs|tmpfs|devtmpfs|devpts|mqueue|cgroup2?|securityfs|debugfs|shm|squashfs|fuse\.lxcfs)$/.test(tipo)) continue;
      try { if (fs.statSync(ponto).isDirectory()) out.push(ponto); } catch {}
    }
    return out;
  } catch { return []; }
}
const MONTADOS = volumesMontados();
const VOLUME = process.env.RAILWAY_VOLUME_MOUNT_PATH || (EM_RAILWAY ? (MONTADOS.find(m => m === '/data') || (MONTADOS.length === 1 ? MONTADOS[0] : '')) : '');
const dentroDe = (a, b) => { const r = path.relative(path.resolve(b), path.resolve(a)); return r === '' || (!r.startsWith('..') && !path.isAbsolute(r)); };
// No Railway, se existe um volume, os dados vão para ele, mesmo que DATA_DIR aponte para outro lugar (que seria apagado a cada publicação).
const DATA_DIR = (EM_RAILWAY && VOLUME) ? (process.env.DATA_DIR && dentroDe(process.env.DATA_DIR, VOLUME) ? process.env.DATA_DIR : VOLUME) : (process.env.DATA_DIR || path.join(ROOT, 'data'));
const DATA_DIR_IGNORADO = EM_RAILWAY && VOLUME && process.env.DATA_DIR && !dentroDe(process.env.DATA_DIR, VOLUME);
let RELEASE = ''; try { RELEASE = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')).version || ''; } catch {}
const NO_AR_DESDE = new Date().toISOString();
// Identificação da versão que está de fato no servidor: lida dos próprios arquivos, não de um número digitado.
const ARQS_BUILD = ['app.js', 'entrar.js', 'style.css', 'boot.js', 'config.js'];
const achar = nome => [path.join(PUB, nome), path.join(ROOT, nome)].find(f => { try { return fs.statSync(f).isFile(); } catch { return false; } });
let bCache = { chave: '', id: '', versao: 0 };
function infoBuild() { // muda sempre que qualquer arquivo do app mudar; serve para renovar o cache dos celulares sem depender de ninguém lembrar de subir o número
  const fs_ = ARQS_BUILD.map(achar), chave = fs_.map(f => { try { const st = fs.statSync(f); return f + st.mtimeMs + ':' + st.size; } catch { return 'x'; } }).join('|');
  if (chave !== bCache.chave) {
    const h = crypto.createHash('sha1'); let versao = 0;
    for (const f of fs_) { try { const b = fs.readFileSync(f); h.update(b); if (path.basename(f) === 'app.js') { const m = /VERSAO = (\d+)/.exec(b.toString('utf8', 0, 400000)); if (m) versao = +m[1]; } } catch {} }
    bCache = { chave, id: h.digest('hex').slice(0, 10), versao };
  }
  return bCache;
}
const PORT = process.env.PORT || 3000;
const FLAT = !fs.existsSync(PUB); // sem pasta public/ = modo "plano" (upload sem pastas no site do GitHub)
const VERSAO_APP = 19;
// O que mudou nesta versão (aparece no app quando há atualização). Atualize a cada versão nova.
const NOVIDADES = ['Botão Atualizar mais confiável: carrega a versão nova de verdade, em qualquer celular', 'Diagnóstico de arquivos desatualizados em /status']; 
const MODEL_FILE = path.join(PUB, 'model', 'pose_landmarker_lite.task');
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';

// ---- modelo de detecção do corpo: baixa uma vez e serve do mesmo domínio
async function ensureModel() {
  if (fs.existsSync(MODEL_FILE) && fs.statSync(MODEL_FILE).size > 1e6) return;
  try {
    const r = await fetch(MODEL_URL);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    fs.mkdirSync(path.dirname(MODEL_FILE), { recursive: true });
    fs.writeFileSync(MODEL_FILE, Buffer.from(await r.arrayBuffer()));
    console.log('Modelo de pose baixado.');
  } catch (e) { console.warn('Não consegui baixar o modelo agora (o app tentará direto do Google):', e.message); }
}
if (!process.env.SKIP_MODEL) ensureModel();

// ---- dados (arquivos JSON em DATA_DIR). Em produção use um volume ou, melhor, um banco (Postgres/Supabase).
fs.mkdirSync(DATA_DIR, { recursive: true });
// O dado só é "durável" se estiver num disco que sobrevive às publicações. Sinais: volume do Railway, marcador que já existia
// antes deste boot (sobreviveu a um reinício), fora do Railway, ou confirmação manual (DADOS_PERSISTENTES=1).
const MARCADOR = path.join(DATA_DIR, '.rj-marcador');
const marcadorJaExistia = fs.existsSync(MARCADOR);
try { if (!marcadorJaExistia) fs.writeFileSync(MARCADOR, new Date().toISOString()); } catch {}
const noVolume = !!VOLUME && dentroDe(DATA_DIR, VOLUME);
let discoCriadoEm = ''; try { discoCriadoEm = fs.readFileSync(MARCADOR, 'utf8').trim(); } catch {}
const DURAVEL = !EM_RAILWAY || noVolume || marcadorJaExistia || process.env.DADOS_PERSISTENTES === '1';
const ONDE = !EM_RAILWAY ? 'local' : noVolume ? 'volume' : marcadorJaExistia ? 'disco que sobreviveu a reinício' : 'TEMPORARIO';
if (!DURAVEL) console.error('\n!!! ATENÇÃO: os dados estão num disco TEMPORÁRIO do Railway e serão APAGADOS a cada publicação.\n!!! Crie um Volume no serviço (caminho /data). Novos cadastros ficam bloqueados até lá (para ninguém perder a conta).\n');
else console.log('Dados em: ' + DATA_DIR + ' (' + ONDE + ')');
if (DATA_DIR_IGNORADO) console.warn('Aviso: DATA_DIR apontava para fora do volume; usando o volume ' + VOLUME + ' para não perder contas.');

const BACKUPS = path.join(DATA_DIR, 'backups');
const carregarArquivo = (alvo) => JSON.parse(fs.readFileSync(alvo, 'utf8'));
function load(n, d) {
  const alvo = path.join(DATA_DIR, n);
  if (!fs.existsSync(alvo)) return d;
  try { return carregarArquivo(alvo); } catch (e) {
    // arquivo corrompido: guarda uma cópia para análise (não deixa ser sobrescrito) e tenta o backup mais recente
    try { fs.renameSync(alvo, alvo + '.corrompido-' + Date.now()); } catch {}
    console.error('!!! ' + n + ' estava corrompido; tentando o backup mais recente.');
    try { const dias = fs.readdirSync(BACKUPS).sort().reverse(); for (const dia of dias) { const c = path.join(BACKUPS, dia, n); if (fs.existsSync(c)) return carregarArquivo(c); } } catch {}
    return d;
  }
}
// Gravação segura: escreve num arquivo temporário e troca de nome (nunca deixa o arquivo pela metade) e grava tudo ao desligar.
const gets = {}, timers = {}, sujo = new Set();
function gravarAgora(n) {
  if (!gets[n]) return;
  const alvo = path.join(DATA_DIR, n), tmp = alvo + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(gets[n]()), { mode: 0o600 }); fs.renameSync(tmp, alvo); sujo.delete(n);
}
const persist = (n, get) => { gets[n] = get; sujo.add(n); clearTimeout(timers[n]); timers[n] = setTimeout(() => { try { gravarAgora(n); } catch (e) { console.error('Falha ao gravar ' + n + ':', e.message); } }, 1200); };
function desligar() { for (const n of [...sujo]) { try { gravarAgora(n); } catch {} } process.exit(0); }
process.on('SIGTERM', desligar); process.on('SIGINT', desligar);
const FOTOS = path.join(DATA_DIR, 'fotos'); fs.mkdirSync(FOTOS, { recursive: true });
const arqFoto = u => path.join(FOTOS, u.id + '.jpg');
let scores = load('scores.json', []);   // {id: userId, secs, jumps, ts, pub}
let users = load('users.json', []);     // {id,email,name,country,kg,salt,hash,created}
let sessions = load('sessions.json', {}); // sha256(token) -> {uid, exp}
const saveScores = () => persist('scores.json', () => scores);
const saveUsers = () => persist('users.json', () => users);
const saveSessions = () => persist('sessions.json', () => { const n = Date.now(); for (const k in sessions) if (sessions[k].exp < n) delete sessions[k]; return sessions; });

// Cópia diária dos dados (guarda 14 dias) dentro do mesmo disco. Protege contra erro e arquivo corrompido.
function backupDiario() {
  try {
    if (!users.length && !scores.length) return;
    const dia = new Date().toISOString().slice(0, 10), pasta = path.join(BACKUPS, dia);
    fs.mkdirSync(pasta, { recursive: true });
    for (const n of ['users.json', 'scores.json']) if (fs.existsSync(path.join(DATA_DIR, n))) fs.copyFileSync(path.join(DATA_DIR, n), path.join(pasta, n));
    for (const velho of fs.readdirSync(BACKUPS).sort().slice(0, -14)) fs.rmSync(path.join(BACKUPS, velho), { recursive: true, force: true });
  } catch (e) { console.error('Backup diário falhou:', e.message); }
}
setTimeout(backupDiario, 5000).unref(); setInterval(backupDiario, 6 * 36e5).unref();

const scrypt = (pw, salt) => new Promise((ok, no) => crypto.scrypt(pw, salt, 64, (e, k) => e ? no(e) : ok(k)));
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const clean = (s, n) => String(s ?? '').replace(/[<>&"'`\u0000-\u001f]/g, '').trim().slice(0, n);
const hits = new Map();
function limited(key, max, ms) {
  const now = Date.now(), arr = (hits.get(key) || []).filter(t => now - t < ms);
  arr.push(now); hits.set(key, arr); return arr.length > max;
}
setInterval(() => { const n = Date.now(); for (const [k, v] of hits) if (!v.some(t => n - t < 36e5)) hits.delete(k); }, 6e5).unref();

const log = (ev, ip, extra = '') => console.log(JSON.stringify({ t: new Date().toISOString(), ev, ip, extra }));
const COMUNS = new Set(['12345678', '123456789', '1234567890', 'password', 'password1', 'senha123', 'senha1234', 'qwerty123', 'qwertyuiop', '11111111', '00000000', 'abc12345', 'iloveyou', 'admin123', 'ronaldjump', 'ronald123', '123123123', 'brasil123', 'senha@123', 'mudar123', 'senha1234567']);
function senhaFraca(pw, email) {
  if (pw.length < 8 || pw.length > 128) return 'A senha precisa ter de 8 a 128 caracteres.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'A senha precisa ter letras e números.';
  if (/(0123|1234|2345|3456|4567|5678|6789|abcd|qwer)/i.test(pw) || /(.)\1{3,}/.test(pw)) return 'Evite sequências (1234, abcd) e caracteres repetidos.';
  const low = pw.toLowerCase(), local = String(email || '').split('@')[0];
  if (COMUNS.has(low) || low === email || (local.length >= 4 && low.includes(local))) return 'Escolha uma senha menos óbvia (não use e-mail, sequências ou senhas comuns).';
  return null;
}
const ORIGENS = new Set(['capacitor://localhost', 'ionic://localhost', 'https://localhost', 'http://localhost', ...(process.env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean)]);
const CSP = "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self' https://storage.googleapis.com; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'";
function seguranca(res, https) {
  res.setHeader(process.env.CSP_MODE === 'report' ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy', CSP);
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=(), geolocation=(), payment=()');
  if (https) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

const pidDe = u => sha('pid:' + u.id).slice(0, 16); // identificador público (não revela o id interno)
const pub = u => ({ id: u.id, email: u.email, name: u.name, country: u.country, kg: u.kg, pid: pidDe(u), foto: !!u.foto, fotoV: u.fotoV || 0, fotoRanking: !!u.fotoRanking });
function authUser(req) {
  const m = /^Bearer ([a-f0-9]{64})$/.exec(req.headers.authorization || '');
  if (!m) return null;
  const s = sessions[sha(m[1])];
  if (!s || s.exp < Date.now()) return null;
  return users.find(u => u.id === s.uid) || null;
}
function newSession(uid) {
  const token = crypto.randomBytes(32).toString('hex');
  const mine = Object.entries(sessions).filter(([, v]) => v.uid === uid).sort((a, b) => a[1].exp - b[1].exp);
  while (mine.length >= 5) delete sessions[mine.shift()[0]]; // no máximo 5 aparelhos por conta
  sessions[sha(token)] = { uid, exp: Date.now() + 90 * 864e5 }; saveSessions(); return token;
}
async function checkPw(u, pw) {
  const salt = u ? u.salt : 'x'.repeat(32);
  const h = await scrypt(String(pw ?? '').slice(0, 128), salt);
  return !!u && crypto.timingSafeEqual(h, Buffer.from(u.hash, 'hex'));
}
const okProfile = b => {
  const name = clean(b.name, 20), country = clean(b.country, 2).toUpperCase(), kg = +b.kg;
  if (!name) return 'Informe um nome (até 20 letras).';
  if (!/^[A-Z]{2}$/.test(country)) return 'País inválido.';
  if (!(kg >= 30 && kg <= 250)) return 'Peso deve estar entre 30 e 250 kg.';
  return null;
};

function ranking(period) {
  const since = period === 'week' ? Date.now() - 7 * 864e5 : 0;
  const byId = new Map(users.map(u => [u.id, u]));
  const per = new Map(), countries = new Map();
  for (const s of scores) {
    const u = byId.get(s.id);
    if (!u || s.pub === false || s.ts < since) continue;
    const r = per.get(u.id) || { name: u.name, country: u.country, jumps: 0, secs: 0, ...(u.foto && u.fotoRanking ? { pid: pidDe(u), fv: u.fotoV || 0 } : {}) };
    r.jumps += s.jumps; r.secs += s.secs; per.set(u.id, r);
    countries.set(u.country, (countries.get(u.country) || 0) + s.jumps);
  }
  return {
    users: [...per.values()].sort((a, b) => b.jumps - a.jumps).slice(0, 50),
    countries: [...countries].map(([country, jumps]) => ({ country, jumps })).sort((a, b) => b.jumps - a.jumps).slice(0, 20)
  };
}

function json(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function readBody(req, max = 4096) {
  return new Promise((ok, no) => {
    let b = ''; req.on('data', c => { b += c; if (b.length > max) { no(new Error('grande')); req.destroy(); } });
    req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { no(e); } });
  });
}

async function api(req, res, url, ip) {
  const p = url.pathname, m = req.method;
  if (p === '/api/ranking' && m === 'GET') return json(res, 200, ranking(url.searchParams.get('period') === 'all' ? 'all' : 'week'));

  if (p.startsWith('/api/foto/') && m === 'GET') { // foto só aparece para outras pessoas se o dono ativou "mostrar no ranking"
    const dono = users.find(x => pidDe(x) === p.slice(10));
    if (!dono || !dono.foto || !dono.fotoRanking) return json(res, 404, { erro: 'Não encontrado' });
    return fs.readFile(arqFoto(dono), (e, buf) => {
      if (e) return json(res, 404, { erro: 'Não encontrado' });
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': buf.length, 'Cache-Control': 'public, max-age=3600' }); res.end(buf);
    });
  }

  if (p === '/api/register' && m === 'POST') {
    if (!DURAVEL) return json(res, 503, { erro: 'Cadastros temporariamente pausados: o servidor está sendo configurado para guardar as contas com segurança. Tente de novo mais tarde.' });
    if (limited('reg:' + ip, 10, 36e5)) return json(res, 429, { erro: 'Muitas tentativas. Tente mais tarde.' });
    const b = await readBody(req);
    const email = clean(b.email, 120).toLowerCase(), pw = String(b.password ?? '');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json(res, 400, { erro: 'E-mail inválido.' });
    const fraca = senhaFraca(pw, email); if (fraca) return json(res, 400, { erro: fraca });
    const bad = okProfile(b); if (bad) return json(res, 400, { erro: bad });
    if (b.consent !== true) return json(res, 400, { erro: 'É preciso aceitar a Política de Privacidade para criar a conta.' });
    if (users.some(u => u.email === email)) return json(res, 409, { erro: 'Este e-mail já está cadastrado. Entre com sua senha.' });
    const salt = crypto.randomBytes(16).toString('hex'), hash = (await scrypt(pw, salt)).toString('hex');
    const u = { id: crypto.randomUUID(), email, name: clean(b.name, 20), country: clean(b.country, 2).toUpperCase(), kg: +b.kg, salt, hash, created: Date.now() };
    users.push(u); saveUsers(); log('register', ip);
    return json(res, 200, { token: newSession(u.id), user: pub(u) });
  }

  if (p === '/api/login' && m === 'POST') {
    const b = await readBody(req), email = clean(b.email, 120).toLowerCase();
    if (limited('login:' + ip, 20, 9e5) || limited('loginE:' + email, 5, 9e5)) return json(res, 429, { erro: 'Muitas tentativas. Aguarde alguns minutos.' });
    const u = users.find(x => x.email === email);
    if (!(await checkPw(u, b.password))) { log('login_fail', ip, sha(email).slice(0, 8)); return json(res, 401, { erro: 'E-mail ou senha incorretos.' }); }
    return json(res, 200, { token: newSession(u.id), user: pub(u) });
  }

  if (p.startsWith('/api/admin/')) { // só com o ADMIN_TOKEN configurado no Railway (Variables)
    const tk = process.env.ADMIN_TOKEN || '', recebido = (req.headers.authorization || '').replace(/^Bearer /, '');
    if (tk.length < 24) return json(res, 404, { erro: 'Não encontrado' });
    if (limited('admin:' + ip, 10, 9e5)) return json(res, 429, { erro: 'Muitas tentativas.' });
    const a = Buffer.from(recebido), b2 = Buffer.from(tk);
    if (a.length !== b2.length || !crypto.timingSafeEqual(a, b2)) { log('admin_recusado', ip); return json(res, 401, { erro: 'Não autorizado.' }); }
    if (p === '/api/admin/estado' && m === 'GET') return json(res, 200, { contas: users.length, treinos: scores.length, fotos: users.filter(x => x.foto).length, dados: ONDE, duravel: DURAVEL, pasta: DATA_DIR, versao: VERSAO_APP });
    if (p === '/api/admin/backup' && m === 'GET') {
      const fotos = {}; for (const x of users) if (x.foto) { try { fotos[x.id] = 'data:image/jpeg;base64,' + fs.readFileSync(arqFoto(x)).toString('base64'); } catch {} }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="backup-ronald-jump-' + new Date().toISOString().slice(0, 10) + '.json"', 'Cache-Control': 'no-store' });
      return res.end(JSON.stringify({ tipo: 'ronald-jump-backup', versao: VERSAO_APP, geradoEm: new Date().toISOString(), users, scores, fotos }));
    }
    if (p === '/api/admin/restaurar' && m === 'POST') { // junta o backup com o que já existe (não apaga contas novas)
      const b = await readBody(req, 40e6);
      if (b.tipo !== 'ronald-jump-backup' || !Array.isArray(b.users) || !Array.isArray(b.scores)) return json(res, 400, { erro: 'Arquivo de backup inválido.' });
      let novas = 0, treinos = 0, fotosOk = 0;
      for (const x of b.users) {
        if (!x || typeof x.id !== 'string' || typeof x.email !== 'string' || typeof x.hash !== 'string' || typeof x.salt !== 'string') continue;
        if (users.some(y => y.id === x.id || y.email === x.email)) continue;
        users.push({ id: x.id, email: clean(x.email, 120).toLowerCase(), name: clean(x.name, 20), country: clean(x.country, 2).toUpperCase(), kg: +x.kg || 70, salt: x.salt, hash: x.hash, created: +x.created || Date.now(), foto: false, fotoV: 0, fotoRanking: !!x.fotoRanking }); novas++;
      }
      for (const x of b.scores) {
        if (!x || !users.some(y => y.id === x.id) || !(+x.jumps >= 1) || !(+x.secs >= 5)) continue;
        if (scores.some(y => y.id === x.id && y.ts === +x.ts && y.jumps === +x.jumps)) continue;
        scores.push({ id: x.id, jumps: Math.floor(+x.jumps), secs: Math.floor(+x.secs), ts: Math.floor(+x.ts), pub: x.pub !== false }); treinos++;
      }
      for (const [id, d] of Object.entries(b.fotos || {})) {
        const u2 = users.find(y => y.id === id), mm = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(d));
        if (!u2 || u2.foto || !mm) continue; const buf = Buffer.from(mm[1], 'base64');
        if (buf.length > 100000 || !(buf[0] === 0xff && buf[1] === 0xd8)) continue;
        fs.writeFileSync(arqFoto(u2), buf, { mode: 0o600 }); u2.foto = true; u2.fotoV = Date.now(); fotosOk++;
      }
      saveUsers(); saveScores(); log('admin_restaurar', ip, novas + ' contas');
      return json(res, 200, { ok: true, contasRestauradas: novas, treinosRestaurados: treinos, fotosRestauradas: fotosOk });
    }
    return json(res, 404, { erro: 'Não encontrado' });
  }

  const u = authUser(req);
  if (!u) return json(res, 401, { erro: 'Faça login para continuar.' });

  if (p === '/api/logout' && m === 'POST') {
    const t = (req.headers.authorization || '').slice(7); delete sessions[sha(t)]; saveSessions(); return json(res, 200, { ok: true });
  }
  if (p === '/api/me' && m === 'GET') {
    const workouts = scores.filter(s => s.id === u.id).sort((a, b) => b.ts - a.ts).slice(0, 300).map(s => ({ t: s.ts, jumps: s.jumps, secs: s.secs }));
    return json(res, 200, { user: pub(u), workouts });
  }
  if (p === '/api/me' && m === 'PATCH') {
    const b = await readBody(req), merged = { name: b.name ?? u.name, country: b.country ?? u.country, kg: b.kg ?? u.kg };
    const bad = okProfile(merged); if (bad) return json(res, 400, { erro: bad });
    u.name = clean(merged.name, 20); u.country = clean(merged.country, 2).toUpperCase(); u.kg = +merged.kg;
    if (typeof b.fotoRanking === 'boolean') u.fotoRanking = b.fotoRanking && !!u.foto;
    saveUsers();
    return json(res, 200, { user: pub(u) });
  }
  if (p === '/api/account' && m === 'DELETE') {
    const b = await readBody(req);
    if (limited('del:' + u.id, 5, 36e5)) return json(res, 429, { erro: 'Muitas tentativas.' });
    if (!(await checkPw(u, b.password))) return json(res, 401, { erro: 'Senha incorreta.' });
    try { fs.unlinkSync(arqFoto(u)); } catch {}
    users = users.filter(x => x.id !== u.id); scores = scores.filter(s => s.id !== u.id);
    for (const k in sessions) if (sessions[k].uid === u.id) delete sessions[k];
    saveUsers(); saveScores(); saveSessions(); log('delete_account', ip);
    return json(res, 200, { ok: true });
  }
  if (p === '/api/foto' && m === 'GET') { // a própria foto (precisa do token, por isso o app a baixa por aqui)
    return fs.readFile(u.foto ? arqFoto(u) : '/nada', (e, buf) => {
      if (e) return json(res, 404, { erro: 'Sem foto' });
      res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Content-Length': buf.length, 'Cache-Control': 'no-store' }); res.end(buf);
    });
  }
  if (p === '/api/foto' && m === 'PUT') {
    if (limited('foto:' + u.id, 10, 36e5)) return json(res, 429, { erro: 'Muitas trocas de foto. Tente mais tarde.' });
    const b = await readBody(req, 140000), m2 = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(b.foto || ''));
    if (!m2) return json(res, 400, { erro: 'Envie uma imagem JPEG.' });
    const buf = Buffer.from(m2[1], 'base64');
    if (buf.length < 200 || buf.length > 100000) return json(res, 400, { erro: 'A foto deve ter no máximo 100 KB.' });
    if (!(buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)) return json(res, 400, { erro: 'Arquivo de imagem inválido.' });
    fs.writeFileSync(arqFoto(u), buf, { mode: 0o600 }); u.foto = true; u.fotoV = Date.now(); saveUsers(); log('foto_atualizada', ip);
    return json(res, 200, { user: pub(u) });
  }
  if (p === '/api/foto' && m === 'DELETE') {
    try { fs.unlinkSync(arqFoto(u)); } catch {}
    u.foto = false; u.fotoV = 0; u.fotoRanking = false; saveUsers();
    return json(res, 200, { user: pub(u) });
  }
  if (p === '/api/logout-all' && m === 'POST') {
    for (const k in sessions) if (sessions[k].uid === u.id) delete sessions[k];
    saveSessions(); log('logout_all', ip); return json(res, 200, { ok: true });
  }
  if (p === '/api/password' && m === 'POST') {
    if (limited('pw:' + u.id, 5, 36e5)) return json(res, 429, { erro: 'Muitas tentativas.' });
    const b = await readBody(req), nova = String(b.novaSenha ?? '');
    if (!(await checkPw(u, b.senhaAtual))) return json(res, 401, { erro: 'Senha atual incorreta.' });
    const fraca = senhaFraca(nova, u.email); if (fraca) return json(res, 400, { erro: fraca });
    u.salt = crypto.randomBytes(16).toString('hex'); u.hash = (await scrypt(nova, u.salt)).toString('hex'); saveUsers();
    const atual = sha((req.headers.authorization || '').slice(7));
    for (const k in sessions) if (sessions[k].uid === u.id && k !== atual) delete sessions[k]; // derruba os outros aparelhos
    saveSessions(); log('password_change', ip); return json(res, 200, { ok: true });
  }
  if (p === '/api/export' && m === 'GET') {
    const workouts = scores.filter(s => s.id === u.id).sort((a, b) => b.ts - a.ts).map(s => ({ data: new Date(s.ts).toISOString(), saltos: s.jumps, segundos: s.secs, noRanking: s.pub !== false }));
    let foto = null; try { if (u.foto) foto = 'data:image/jpeg;base64,' + fs.readFileSync(arqFoto(u)).toString('base64'); } catch {}
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="meus-dados-ronald-jump.json"', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ geradoEm: new Date().toISOString(), conta: { email: u.email, nome: u.name, pais: u.country, pesoKg: u.kg, criadaEm: new Date(u.created).toISOString(), fotoVisivelNoRanking: !!u.fotoRanking }, foto, treinos: workouts }, null, 2));
  }
  if (p === '/api/score' && m === 'POST') {
    if (limited('score:' + u.id, 60, 36e5)) return json(res, 429, { erro: 'Muitos envios. Tente mais tarde.' });
    const b = await readBody(req), jumps = Math.floor(+b.jumps), secs = Math.floor(+b.secs), now = Date.now();
    if (!(secs >= 5 && secs <= 3600) || !(jumps >= 1 && jumps <= 5000) || jumps > secs * 5) return json(res, 400, { erro: 'Resultado fora do limite.' });
    const t = Number.isFinite(+b.t) && +b.t > now - 7 * 864e5 && +b.t < now + 3e5 ? Math.floor(+b.t) : now;
    if (scores.some(s => s.id === u.id && s.ts === t && s.jumps === jumps)) return json(res, 200, { ok: true, ts: t, posicao: null });
    const day = scores.filter(s => s.id === u.id && s.ts > now - 864e5).reduce((a, s) => a + s.jumps, 0);
    if (day + jumps > 60000) return json(res, 400, { erro: 'Limite diário atingido.' });
    scores.push({ id: u.id, jumps, secs, ts: t, pub: b.pub !== false }); saveScores();
    const pos = b.pub === false ? 0 : ranking('week').users.findIndex(x => x.name === u.name && x.country === u.country) + 1;
    return json(res, 200, { ok: true, ts: t, posicao: pos || null });
  }
  return json(res, 404, { erro: 'Não encontrado' });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.task': 'application/octet-stream' };

const srv = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const proto = String(req.headers['x-forwarded-proto'] || '').split(',').pop().trim();
  if (proto === 'http' && !/^(localhost|127\.)/.test(req.headers.host || '')) { res.writeHead(301, { Location: 'https://' + req.headers.host + req.url }); return res.end(); }
  seguranca(res, proto === 'https');
  const ip = String(req.headers['x-real-ip'] || String(req.headers['x-forwarded-for'] || '').split(',').pop() || req.socket.remoteAddress || '').trim(); // IP do cliente informado pelo proxy
  if (url.pathname.startsWith('/api/')) {
    // Token no cabeçalho (sem cookies). Só origens conhecidas podem chamar a API de outro domínio (o app das lojas).
    const o = req.headers.origin;
    if (o && ORIGENS.has(o)) { res.setHeader('Access-Control-Allow-Origin', o); res.setHeader('Vary', 'Origin'); }
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, versao: infoBuild().versao || VERSAO_APP, build: infoBuild().id, versaoServidor: VERSAO_APP, arquivosDesatualizados: !!infoBuild().versao && infoBuild().versao !== VERSAO_APP, novidades: NOVIDADES, hora: new Date().toISOString(), dados: ONDE, duravel: DURAVEL, volumeEncontrado: !!VOLUME, discoCriadoEm, noArDesde: NO_AR_DESDE, release: RELEASE });
    if (limited('api:' + ip, 300, 6e4)) return json(res, 429, { erro: 'Muitas requisições. Aguarde um instante.' });
    try { return await api(req, res, url, ip); }
    catch (e) { return json(res, e && e.message === 'grande' ? 413 : 400, { erro: 'Requisição inválida.' }); }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { erro: 'Método não permitido' });
  let p = decodeURIComponent(url.pathname);
  if (p === '/entrar') p = '/entrar.html';
  if (p === '/status') p = '/status.html';
  if (p === '/estavel') p = '/estavel/';
  if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB)) return json(res, 403, { erro: 'Proibido' });
  const base = path.basename(p);
  const PRIVADOS = new Set(['server.js', 'package.json', 'package-lock.json', 'readme.md', 'scores.json', 'users.json', 'sessions.json']);
  const candidates = [file];
  if (FLAT && !base.startsWith('.') && !PRIVADOS.has(base.toLowerCase())) { // modo plano: arquivos soltos na raiz; a versão estável usa o prefixo estavel-
    if (p.startsWith('/estavel/')) candidates.push(path.join(ROOT, 'estavel-' + p.slice(9)));
    candidates.push(path.join(ROOT, base));
  }
  const send = (f, st) => {
    const ext = path.extname(f), tipo = MIME[ext] || 'application/octet-stream';
    if (/^index\.html$|^entrar\.html$/.test(path.basename(f)) && req.method !== 'HEAD') { // páginas: apontam para os arquivos da versão atual (?v=<build>) e nunca ficam em cache
      return fs.readFile(f, 'utf8', (e, html) => {
        if (e) return json(res, 404, { erro: 'Não encontrado' });
        const corpo = Buffer.from(html.replace(/\?v=__V__/g, '?v=' + infoBuild().id), 'utf8');
        res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': corpo.length, 'Cache-Control': 'no-store' }); res.end(corpo);
      });
    }
    const longo = /^\/(vendor|icons|model)\//.test(p);                                  // bibliotecas, ícones e modelo: cache longo
    const versionado = /\.(js|css|mjs)$/.test(f) && /^[a-f0-9]{6,}$/.test(url.searchParams.get('v') || ''); // ?v=<build>: a URL muda quando o arquivo muda
    const cc = (longo || versionado) ? (versionado ? 'public, max-age=31536000, immutable' : 'public, max-age=604800') : (/\.html$/.test(f) ? 'no-store' : 'no-cache');
    res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': st.size, 'Cache-Control': cc });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(f).pipe(res);
  };
  const tryNext = i => {
    if (i >= candidates.length) return json(res, 404, { erro: 'Não encontrado' });
    fs.stat(candidates[i], (err, st) => (err || !st.isFile()) ? tryNext(i + 1) : send(candidates[i], st));
  };
  tryNext(0);
});
srv.requestTimeout = 30000; srv.headersTimeout = 15000; srv.keepAliveTimeout = 5000;
srv.listen(PORT, () => console.log('Ronald Jump rodando na porta ' + PORT));
