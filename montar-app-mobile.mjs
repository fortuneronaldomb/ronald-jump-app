// Monta a pasta "mobile/www" com o app pronto para o Capacitor (Android e iOS).
// Uso:  node montar-app-mobile.mjs https://SEU-APP.up.railway.app
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const api = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https:\/\/[^/\s]+$/.test(api)) { console.error('Uso: node montar-app-mobile.mjs https://SEU-APP.up.railway.app'); process.exit(1); }
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, 'mobile');
const www = path.join(out, 'www');

// destino dentro de www -> aceita o arquivo em public/<destino> ou solto ao lado deste script
const arquivos = [
  'index.html', 'config.js', 'boot.js', 'style.css', 'app.js', 'privacidade.html', 'manifest.webmanifest',
  'icons/logo.png', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
  'vendor/fonts/big-shoulders-display-latin-700-normal.woff2', 'vendor/fonts/big-shoulders-display-latin-900-normal.woff2',
  'vendor/fonts/dm-sans-latin-400-normal.woff2', 'vendor/fonts/dm-sans-latin-700-normal.woff2',
  'vendor/mediapipe/vision_bundle.mjs',
  'vendor/mediapipe/wasm/vision_wasm_internal.js', 'vendor/mediapipe/wasm/vision_wasm_internal.wasm',
  'vendor/mediapipe/wasm/vision_wasm_module_internal.js', 'vendor/mediapipe/wasm/vision_wasm_module_internal.wasm'
];
// jump-counter.js e celebration.js só existem se o app.js estiver em partes (versão de desenvolvimento)
const opcionais = ['jump-counter.js', 'celebration.js'];
fs.rmSync(www, { recursive: true, force: true });
let faltam = [];
for (const dest of arquivos) {
  const src = [path.join(here, 'public', dest), path.join(here, path.basename(dest))].find(f => fs.existsSync(f));
  if (!src) { faltam.push(dest); continue; }
  fs.mkdirSync(path.dirname(path.join(www, dest)), { recursive: true });
  fs.copyFileSync(src, path.join(www, dest));
}
for (const dest of opcionais) { const src = [path.join(here, 'public', dest), path.join(here, dest)].find(f => fs.existsSync(f)); if (src) fs.copyFileSync(src, path.join(www, dest)); }
if (faltam.length) { console.error('Arquivos que não encontrei:\n - ' + faltam.join('\n - ')); process.exit(1); }

// aponta o app para o seu servidor (login, treinos e ranking)
fs.writeFileSync(path.join(www, 'config.js'), `window.RJ_API_BASE=${JSON.stringify(api)};\n`);
// no app das lojas não há servidor para mandar cabeçalhos de segurança, então travamos as conexões aqui
const idx = path.join(www, 'index.html');
const csp = `default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; font-src 'self'; connect-src 'self' ${api} https://storage.googleapis.com; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'`;
let html = fs.readFileSync(idx, 'utf8');
html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${csp}">`);
fs.writeFileSync(idx, html);

// modelo de detecção do corpo dentro do app (funciona offline)
const modeloDest = path.join(www, 'model', 'pose_landmarker_lite.task');
fs.mkdirSync(path.dirname(modeloDest), { recursive: true });
const MODELO = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task';
try {
  const r = await fetch(MODELO); if (!r.ok) throw new Error('HTTP ' + r.status);
  fs.writeFileSync(modeloDest, Buffer.from(await r.arrayBuffer())); console.log('Modelo de detecção incluído.');
} catch (e) {
  console.warn('ATENÇÃO: não consegui baixar o modelo (' + e.message + ').\nBaixe manualmente e salve em mobile/www/model/pose_landmarker_lite.task:\n' + MODELO);
}

fs.writeFileSync(path.join(out, 'capacitor.config.json'), JSON.stringify({
  appId: 'br.com.ronaldjump.app', // troque pelo seu identificador definitivo ANTES de publicar (não dá para mudar depois)
  appName: 'Ronald Jump',
  webDir: 'www',
  server: { androidScheme: 'https' }
}, null, 2));
console.log('Pronto: pasta mobile/ criada. API usada: ' + api);
