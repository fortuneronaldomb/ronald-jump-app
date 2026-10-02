// Servidor do Ronald Jump: entrega o app (PWA) e guarda o ranking mundial.
// Sem dependências externas. Rode com: npm start
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
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

// ---- ranking (arquivo JSON). Em produção use um volume em DATA_DIR ou um banco.
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB = path.join(DATA_DIR, 'scores.json');
let scores = [];
try { scores = JSON.parse(fs.readFileSync(DB, 'utf8')); } catch {}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const cutoff = Date.now() - 400 * 864e5;
    scores = scores.filter(s => s.ts > cutoff);
    fs.writeFile(DB, JSON.stringify(scores), () => {});
  }, 1500);
}
const hits = new Map();
function limited(ip) {
  const now = Date.now(), arr = (hits.get(ip) || []).filter(t => now - t < 36e5);
  arr.push(now); hits.set(ip, arr); return arr.length > 40;
}
const clean = (s, n) => String(s ?? '').replace(/[<>&"'`\u0000-\u001f]/g, '').trim().slice(0, n);

function ranking(period) {
  const since = period === 'week' ? Date.now() - 7 * 864e5 : 0;
  const users = new Map(), countries = new Map();
  for (const s of scores) {
    if (s.ts < since) continue;
    const u = users.get(s.id) || { name: s.name, country: s.country, jumps: 0, secs: 0 };
    u.name = s.name; u.country = s.country; u.jumps += s.jumps; u.secs += s.secs; users.set(s.id, u);
    countries.set(s.country, (countries.get(s.country) || 0) + s.jumps);
  }
  return {
    users: [...users.values()].sort((a, b) => b.jumps - a.jumps).slice(0, 50),
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
    req.on('end', () => { try { ok(JSON.parse(b)); } catch (e) { no(e); } });
  });
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.wasm': 'application/wasm', '.task': 'application/octet-stream' };

http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  res.setHeader('Permissions-Policy', 'camera=(self)');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

  if (url.pathname === '/api/ranking' && req.method === 'GET')
    return json(res, 200, ranking(url.searchParams.get('period') === 'all' ? 'all' : 'week'));

  if (url.pathname === '/api/score' && req.method === 'POST') {
    if (limited(ip)) return json(res, 429, { erro: 'Muitas tentativas. Tente mais tarde.' });
    try {
      const b = await readBody(req);
      const id = clean(b.id, 64), name = clean(b.name, 20), country = clean(b.country, 2).toUpperCase();
      const jumps = Math.floor(+b.jumps), secs = Math.floor(+b.secs);
      if (id.length < 8 || !name || !/^[A-Z]{2}$/.test(country)) return json(res, 400, { erro: 'Dados inválidos.' });
      if (!(secs >= 5 && secs <= 3600) || !(jumps >= 1 && jumps <= 5000) || jumps > secs * 5)
        return json(res, 400, { erro: 'Resultado fora do limite.' });
      scores.push({ id, name, country, jumps, secs, ts: Date.now() }); save();
      const r = ranking('week'); const pos = r.users.findIndex(u => u.name === name) + 1;
      return json(res, 200, { ok: true, posicao: pos || null });
    } catch { return json(res, 400, { erro: 'Requisição inválida.' }); }
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { erro: 'Método não permitido' });
  let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
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
}).listen(PORT, () => console.log('Ronald Jump rodando na porta ' + PORT));
