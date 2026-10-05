// Servidor do Ronald Jump: entrega o app (PWA) e guarda o ranking mundial.
// Sem dependências externas. Rode com: npm start
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUB = path.join(ROOT, 'public');
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');
const PORT = process.env.PORT || 3000;
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
ensureModel();

// ---- dados (arquivos JSON em DATA_DIR). Em produção use um volume ou, melhor, um banco (Postgres/Supabase).
fs.mkdirSync(DATA_DIR, { recursive: true });
const load = (n, d) => { try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, n), 'utf8')); } catch { return d; } };
const timers = {};
const persist = (n, get) => { clearTimeout(timers[n]); timers[n] = setTimeout(() => fs.writeFile(path.join(DATA_DIR, n), JSON.stringify(get()), { mode: 0o600 }, () => {}), 1200); };
let scores = load('scores.json', []);   // {id: userId, secs, jumps, ts, pub}
let users = load('users.json', []);     // {id,email,name,country,kg,salt,hash,created}
let sessions = load('sessions.json', {}); // sha256(token) -> {uid, exp}
const saveScores = () => persist('scores.json', () => scores);
const saveUsers = () => persist('users.json', () => users);
const saveSessions = () => persist('sessions.json', () => { const n = Date.now(); for (const k in sessions) if (sessions[k].exp < n) delete sessions[k]; return sessions; });

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

const pub = u => ({ id: u.id, email: u.email, name: u.name, country: u.country, kg: u.kg });
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
    const r = per.get(u.id) || { name: u.name, country: u.country, jumps: 0, secs: 0 };
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
function readBody(req) {
  return new Promise((ok, no) => {
    let b = ''; req.on('data', c => { b += c; if (b.length > 4096) { no(new Error('grande')); req.destroy(); } });
    req.on('end', () => { try { ok(JSON.parse(b || '{}')); } catch (e) { no(e); } });
  });
}

async function api(req, res, url, ip) {
  const p = url.pathname, m = req.method;
  if (p === '/api/ranking' && m === 'GET') return json(res, 200, ranking(url.searchParams.get('period') === 'all' ? 'all' : 'week'));

  if (p === '/api/register' && m === 'POST') {
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
    u.name = clean(merged.name, 20); u.country = clean(merged.country, 2).toUpperCase(); u.kg = +merged.kg; saveUsers();
    return json(res, 200, { user: pub(u) });
  }
  if (p === '/api/account' && m === 'DELETE') {
    const b = await readBody(req);
    if (limited('del:' + u.id, 5, 36e5)) return json(res, 429, { erro: 'Muitas tentativas.' });
    if (!(await checkPw(u, b.password))) return json(res, 401, { erro: 'Senha incorreta.' });
    users = users.filter(x => x.id !== u.id); scores = scores.filter(s => s.id !== u.id);
    for (const k in sessions) if (sessions[k].uid === u.id) delete sessions[k];
    saveUsers(); saveScores(); saveSessions(); log('delete_account', ip);
    return json(res, 200, { ok: true });
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
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="meus-dados-ronald-jump.json"', 'Cache-Control': 'no-store' });
    return res.end(JSON.stringify({ geradoEm: new Date().toISOString(), conta: { email: u.email, nome: u.name, pais: u.country, pesoKg: u.kg, criadaEm: new Date(u.created).toISOString() }, treinos: workouts }, null, 2));
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
    if (url.pathname === '/api/health') return json(res, 200, { ok: true, versao: 7, hora: new Date().toISOString() });
    if (limited('api:' + ip, 300, 6e4)) return json(res, 429, { erro: 'Muitas requisições. Aguarde um instante.' });
    try { return await api(req, res, url, ip); }
    catch (e) { return json(res, e && e.message === 'grande' ? 413 : 400, { erro: 'Requisição inválida.' }); }
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { erro: 'Método não permitido' });
  let p = decodeURIComponent(url.pathname);
  // Versão estável (sem conta) em /estavel/: os arquivos dela ficam soltos com o prefixo "estavel-"
  if (p === '/entrar') p = '/entrar.html';
  else if (p === '/estavel' || p.startsWith('/estavel/')) p = '/estavel-' + (p.slice(9).replace(/^\//, '') || 'index.html');
  else if (p.endsWith('/')) p += 'index.html';
  const file = path.normalize(path.join(PUB, p));
  if (!file.startsWith(PUB)) return json(res, 403, { erro: 'Proibido' });
  // Aceita os arquivos tanto em public/... quanto soltos na raiz do projeto (upload sem pastas)
  const base = path.basename(p);
  const alt = path.join(ROOT, base);
  const PRIVADOS = new Set(['server.js', 'package.json', 'package-lock.json', 'readme.md', 'scores.json']);
  const candidates = [file];
  if (!base.startsWith('.') && !PRIVADOS.has(base.toLowerCase())) candidates.push(alt);
  const send = (f, st) => {
    const shell = /index\.html$|sw\.js$|app\.js$|style\.css$|jump-counter\.js$|manifest/.test(f);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': shell ? 'no-cache' : 'public, max-age=604800' });
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
