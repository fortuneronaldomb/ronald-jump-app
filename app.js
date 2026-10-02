import { JumpCounter, kcal as calcKcal, equivalente } from '/jump-counter.js';

const $ = id => document.getElementById(id);
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const PAISES = { BR: 'Brasil', PT: 'Portugal', US: 'Estados Unidos', AR: 'Argentina', UY: 'Uruguai', PY: 'Paraguai', CL: 'Chile', CO: 'Colômbia', MX: 'México', ES: 'Espanha', IT: 'Itália', FR: 'França', DE: 'Alemanha', GB: 'Reino Unido', JP: 'Japão', AO: 'Angola', MZ: 'Moçambique' };
const flag = c => c && c.length === 2 ? String.fromCodePoint(...[...c.toUpperCase()].map(x => 127397 + x.charCodeAt(0))) : '';
const pad = n => String(n).padStart(2, '0');
const mmss = s => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;
const num = (n, d = 0) => n.toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };

// ---------- perfil e histórico
const profile = Object.assign({ name: '', kg: 70, country: 'BR', sound: true, rank: true, rope: true, goal: 'free', id: '' }, store.get('rj.profile', {}));
if (!profile.id) profile.id = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());
const saveProfile = () => store.set('rj.profile', profile);
saveProfile();
let history = store.get('rj.hist', []);

function toast(t) { const el = $('toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('on'), 2800); }

// ---------- navegação
function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  document.querySelectorAll('#nav button').forEach(b => b.classList.toggle('on', b.dataset.s === id));
  $('screens').scrollTop = 0;
  if (id === 'home') renderHome(); if (id === 'history') renderHistory(); if (id === 'rank') loadRank();
}
document.querySelectorAll('#nav button').forEach(b => b.addEventListener('click', () => show(b.dataset.s)));

// ---------- metas
const GOALS = [['free', 'Livre'], ['t60', '1 min'], ['t180', '3 min'], ['t300', '5 min'], ['t600', '10 min'], ['k50', '50 kcal'], ['k100', '100 kcal']];
function renderGoals() {
  const box = $('goals'); box.innerHTML = '';
  for (const [id, label] of GOALS) {
    const b = document.createElement('button');
    b.className = 'chip'; b.type = 'button'; b.textContent = label; b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(profile.goal === id));
    b.onclick = () => { profile.goal = id; saveProfile(); renderGoals(); };
    box.appendChild(b);
  }
}
const goalOf = id => id[0] === 't' ? { type: 'time', v: +id.slice(1) } : id[0] === 'k' ? { type: 'kcal', v: +id.slice(1) } : { type: 'free', v: 0 };

// ---------- início
function renderHome() {
  const today = dayKey(Date.now());
  const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d; });
  const per = {}; let tj = 0, tk = 0;
  for (const h of history) { const k = dayKey(h.t); per[k] = (per[k] || 0) + h.jumps; if (k === today) { tj += h.jumps; tk += h.kcal; } }
  $('sToday').textContent = num(tj); $('sKcal').textContent = num(tk);
  let streak = 0, d = new Date(); if (!per[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (per[dayKey(d)]) { streak++; d.setDate(d.getDate() - 1); }
  $('sStreak').textContent = streak;
  const max = Math.max(1, ...days.map(x => per[dayKey(x)] || 0));
  $('bars').innerHTML = days.map(x => {
    const v = per[dayKey(x)] || 0;
    return `<div class="${dayKey(x) === today ? 'today' : ''}" title="${num(v)} saltos"><i class="${v ? 'has' : ''}" style="height:${Math.max(3, v / max * 82)}px"></i>${'DSTQQSS'[x.getDay()]}</div>`;
  }).join('');
}
function renderHistory() {
  const tot = history.reduce((a, h) => a + h.jumps, 0);
  $('histTotal').textContent = history.length ? `${num(history.length)} treinos, ${num(tot)} saltos no total.` : 'Seus treinos aparecem aqui depois do primeiro salto.';
  $('histList').innerHTML = history.slice(0, 100).map(h => {
    const d = new Date(h.t);
    return `<li><div>${d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}, ${pad(d.getHours())}:${pad(d.getMinutes())}<small>${mmss(h.secs)} · ${num(h.kcal, 1)} kcal</small></div><b>${num(h.jumps)}</b></li>`;
  }).join('');
}

// ---------- ranking
let rankPeriod = 'week';
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  rankPeriod = t.dataset.p; document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t)); loadRank();
}));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
async function loadRank() {
  $('rankMsg').textContent = 'Carregando…';
  try {
    const r = await fetch('/api/ranking?period=' + rankPeriod); if (!r.ok) throw 0; const d = await r.json();
    $('rankMsg').textContent = d.users.length ? '' : 'Ninguém no ranking ainda. Faça um treino e seja o primeiro.';
    $('rankUsers').innerHTML = d.users.map(u => `<li class="${u.name === profile.name && u.country === profile.country ? 'me' : ''}"><span>${flag(u.country)} ${esc(u.name)}</span><b>${num(u.jumps)}</b></li>`).join('');
    $('rankCountries').innerHTML = d.countries.map(c => `<li><span>${flag(c.country)} ${esc(PAISES[c.country] || c.country)}</span><b>${num(c.jumps)}</b></li>`).join('');
  } catch { $('rankMsg').textContent = 'Sem conexão com o ranking. Confira a internet e abra a aba de novo.'; }
}

// ---------- perfil
function renderProfile() {
  $('pName').value = profile.name; $('pKg').value = profile.kg; $('pSound').checked = profile.sound; $('pRank').checked = profile.rank; $('ropeToggle').checked = profile.rope;
  $('pCountry').innerHTML = Object.entries(PAISES).map(([c, n]) => `<option value="${c}">${flag(c)} ${n}</option>`).join('');
  $('pCountry').value = profile.country;
}
$('pName').addEventListener('change', e => { profile.name = e.target.value.replace(/[<>&"'`]/g, '').trim().slice(0, 20); e.target.value = profile.name; saveProfile(); });
$('pKg').addEventListener('change', e => { const v = +String(e.target.value).replace(',', '.'); profile.kg = v >= 30 && v <= 250 ? v : 70; e.target.value = profile.kg; saveProfile(); });
$('pCountry').addEventListener('change', e => { profile.country = e.target.value; saveProfile(); });
$('pSound').addEventListener('change', e => { profile.sound = e.target.checked; saveProfile(); });
$('pRank').addEventListener('change', e => { profile.rank = e.target.checked; saveProfile(); });
$('ropeToggle').addEventListener('change', e => { profile.rope = e.target.checked; saveProfile(); });
let deferred = null;
addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferred = e; $('install').hidden = false; });
$('install').addEventListener('click', async () => { if (!deferred) return; deferred.prompt(); await deferred.userChoice; deferred = null; $('install').hidden = true; });
if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) $('iosHint').hidden = false;

// ---------- som
let actx = null;
function beep(freq, ms, vol = 0.12) {
  if (!profile.sound || !actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.frequency.value = freq; g.gain.value = vol; o.connect(g); g.connect(actx.destination);
  o.start(); g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + ms / 1000); o.stop(actx.currentTime + ms / 1000 + 0.02);
}
const buzz = ms => { if (profile.sound && navigator.vibrate) navigator.vibrate(ms); };

// ---------- detector de corpo
let landmarker = null, loading = null;
async function loadModel(onStatus) {
  if (landmarker) return landmarker;
  if (loading) return loading;
  loading = (async () => {
    onStatus('Carregando o detector de movimento…');
    const { FilesetResolver, PoseLandmarker } = await import('/vendor/mediapipe/vision_bundle.mjs');
    const fileset = await FilesetResolver.forVisionTasks('/vendor/mediapipe/wasm');
    let url = '/model/pose_landmarker_lite.task';
    try { const h = await fetch(url, { method: 'HEAD' }); if (!h.ok || +h.headers.get('content-length') < 1e6) throw 0; }
    catch { url = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task'; }
    const opts = d => ({ baseOptions: { modelAssetPath: url, delegate: d }, runningMode: 'VIDEO', numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try { landmarker = await PoseLandmarker.createFromOptions(fileset, opts('GPU')); }
    catch { landmarker = await PoseLandmarker.createFromOptions(fileset, opts('CPU')); }
    return landmarker;
  })();
  try { return await loading; } finally { loading = null; }
}

// ---------- treino
const W = { running: false, raf: 0, stream: null, lock: null };
const video = document.createElement('video'); video.playsInline = true; video.muted = true; video.setAttribute('playsinline', '');
video.style.cssText = 'position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none'; document.body.appendChild(video);
const cv = $('cv'), ctx = cv.getContext('2d');
const L = { nose: 0, ls: 11, rs: 12, lw: 15, rw: 16, lh: 23, rh: 24, lk: 25, rk: 26, la: 27, ra: 28 };

function fit() {
  const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
  cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); return [w, h];
}
const vis = (lm, i) => lm[i] ? (lm[i].visibility ?? 1) : 0;

async function startWorkout() {
  if (!$('workout').hidden) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume && actx.resume(); } catch {}
  $('workout').hidden = false; $('stop').hidden = true; $('hCount').textContent = '0'; $('hEq').textContent = ''; $('hTime').textContent = '00:00'; $('hKcal').textContent = '0,0';
  const goal = goalOf(profile.goal); $('goalbar').hidden = goal.type === 'free'; $('goalfill').style.width = '0';
  const msg = t => $('hMsg').textContent = t;
  try {
    msg('Abrindo a câmera…');
    W.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    video.srcObject = W.stream; await video.play();
  } catch (e) {
    endWorkout(true);
    toast(e && e.name === 'NotAllowedError' ? 'Permita o uso da câmera nas configurações do navegador e tente de novo.' : 'Não consegui abrir a câmera neste aparelho.');
    return;
  }
  let lmk;
  try { lmk = await loadModel(msg); } catch (e) { console.error(e); endWorkout(true); toast('Não consegui carregar o detector. Verifique a internet e tente de novo.'); return; }
  try { W.lock = await navigator.wakeLock?.request('screen'); } catch {}

  const counter = new JumpCounter();
  let phase = 'position', okSince = 0, cdStart = 0, lastCd = 0;
  let t0 = 0, active = 0, lastTick = 0, lastSeen = 0, lastJumpAt = 0, lastVT = -1, paused = false;
  const counted = () => counter.count;
  W.running = true; W.end = null;
  msg('Afaste-se até aparecer o corpo inteiro na tela');

  const loop = () => {
    if (!W.running) return;
    W.raf = requestAnimationFrame(loop);
    const [cw, ch] = [innerWidth, innerHeight];
    if (cv.width !== Math.round(cw * Math.min(devicePixelRatio || 1, 2))) fit();
    const vw = video.videoWidth, vh = video.videoHeight; if (!vw) return;
    const sc = Math.max(cw / vw, ch / vh), ox = (cw - vw * sc) / 2, oy = (ch - vh * sc) / 2;
    const now = performance.now();
    let lm = null;
    if (video.currentTime !== lastVT) {
      lastVT = video.currentTime;
      try { const r = lmk.detectForVideo(video, now); lm = r.landmarks && r.landmarks[0]; } catch {}
    }
    ctx.save(); ctx.clearRect(0, 0, cw, ch); ctx.translate(cw, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, ox, oy, vw * sc, vh * sc);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, 0, cw, ch);
    const P = i => [ox + lm[i].x * vw * sc, oy + lm[i].y * vh * sc];

    const torsoOk = lm && [L.ls, L.rs, L.lh, L.rh].every(i => vis(lm, i) > 0.55);
    const lowerOk = lm && [L.lk, L.rk, L.la, L.ra].some(i => vis(lm, i) > 0.4);
    if (torsoOk) lastSeen = now;

    if (phase === 'position') {
      if (torsoOk && lowerOk) { if (!okSince) okSince = now; msg('Isso! Fique parado por um instante…'); }
      else { okSince = 0; msg(lm ? 'Afaste-se até aparecer o corpo inteiro na tela' : 'Procurando você… fique de frente para a câmera'); }
      if (okSince && now - okSince > 1200) { phase = 'count'; cdStart = now; lastCd = 4; msg(''); $('cd').hidden = false; }
    } else if (phase === 'count') {
      const left = 3 - Math.floor((now - cdStart) / 1000);
      if (left !== lastCd && left > 0) { lastCd = left; $('cd').textContent = left; beep(660, 120); }
      if (left <= 0) { phase = 'run'; $('cd').hidden = true; $('stop').hidden = false; t0 = lastTick = now; beep(1100, 300); buzz(60); msg('Salte!'); setTimeout(() => { if (phase === 'run') msg(''); }, 1500); }
    } else if (phase === 'run') {
      const tracked = now - lastSeen < 1500;
      if (tracked) {
        if (paused) { paused = false; msg(''); }
        active += (now - lastTick) / 1000;
      } else if (!paused) { paused = true; msg('Pausado. Volte para o enquadramento para continuar.'); }
      lastTick = now;
      if (torsoOk) {
        const sx = (lm[L.ls].x + lm[L.rs].x) / 2, sy = (lm[L.ls].y + lm[L.rs].y) / 2, hx = (lm[L.lh].x + lm[L.rh].x) / 2, hy = (lm[L.lh].y + lm[L.rh].y) / 2;
        const torso = Math.hypot((sx - hx) * vw, (sy - hy) * vh) / vh;
        const r = counter.update((sy + hy) / 2, torso, now);
        if (r.jumped) {
          lastJumpAt = now; beep(880, 45); buzz(12);
          $('hCount').textContent = counter.count; $('hCount').classList.remove('pop'); void $('hCount').offsetWidth; $('hCount').classList.add('pop');
        }
      }
      const k = calcKcal(active, profile.kg);
      $('hTime').textContent = mmss(active); $('hKcal').textContent = num(k, 1);
      $('hEq').textContent = k >= 5 ? '≈ ' + equivalente(k) : '';
      if (goal.type !== 'free') {
        const frac = goal.type === 'time' ? active / goal.v : k / goal.v;
        $('goalfill').style.width = Math.min(100, frac * 100) + '%';
        if (frac >= 1) { W.end = { jumps: counter.count, secs: Math.round(active) }; finish(); ctx.restore(); return; }
      }
      W.end = { jumps: counter.count, secs: Math.round(active) };
    }

    if (lm && torsoOk) {
      ctx.fillStyle = 'rgba(232,194,49,.85)';
      for (const i of [L.ls, L.rs, L.lh, L.rh]) { const [x, y] = P(i); ctx.beginPath(); ctx.arc(x, y, 5, 0, 7); ctx.fill(); }
      if (profile.rope && phase !== 'position' && vis(lm, L.lw) > 0.3 && vis(lm, L.rw) > 0.3) drawRope(P, lm, now, counter, lastJumpAt);
    }
    ctx.restore();
  };
  loop();
}

function drawRope(P, lm, now, counter, lastJumpAt) {
  const [lx, ly] = P(L.lw), [rx, ry] = P(L.rw);
  const feet = [L.la, L.ra].filter(i => vis(lm, i) > 0.3).map(i => P(i)[1]);
  const hy = (ly + ry) / 2, nose = P(L.nose)[1];
  const feetY = feet.length ? Math.max(...feet) + 8 : hy + 220, headY = Math.min(nose - 50, hy - 160);
  let ropeY;
  if (now - lastJumpAt < 1400) {
    const th = 2 * Math.PI * (((now - counter.lastTake) / counter.period) % 1);
    ropeY = feetY * (1 + Math.cos(th)) / 2 + headY * (1 - Math.cos(th)) / 2;
  } else ropeY = hy + (feetY - hy) * 0.55;
  const mx = (lx + rx) / 2, cy = 2 * ropeY - hy;
  const g = ctx.createLinearGradient(lx, 0, rx, 0); g.addColorStop(0, '#d4511a'); g.addColorStop(.5, '#e8c231'); g.addColorStop(1, '#d4511a');
  ctx.lineCap = 'round'; ctx.strokeStyle = g; ctx.lineWidth = 7; ctx.shadowColor = '#d4511a'; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.moveTo(lx, ly); ctx.quadraticCurveTo(mx, cy, rx, ry); ctx.stroke();
  ctx.shadowBlur = 0; ctx.fillStyle = '#f5f0e8';
  for (const [x, y] of [[lx, ly], [rx, ry]]) { ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill(); }
}

function endWorkout(silent) {
  W.running = false; cancelAnimationFrame(W.raf);
  if (W.stream) W.stream.getTracks().forEach(t => t.stop()); W.stream = null; video.srcObject = null;
  try { W.lock && W.lock.release(); } catch {} W.lock = null;
  $('workout').hidden = true; $('cd').hidden = true;
}
function finish() {
  const e = W.end || { jumps: 0, secs: 0 }; endWorkout();
  if (e.jumps < 1 || e.secs < 3) { toast('Treino muito curto, nada foi salvo.'); return; }
  const k = calcKcal(e.secs, profile.kg), item = { t: Date.now(), jumps: e.jumps, secs: e.secs, kcal: +k.toFixed(1) };
  history.unshift(item); history = history.slice(0, 500); store.set('rj.hist', history);
  $('rJumps').textContent = num(e.jumps); $('rTime').textContent = mmss(e.secs); $('rKcal').textContent = num(k, 1);
  $('rPace').textContent = num(Math.round(e.jumps / e.secs * 60)); $('rEq').textContent = k >= 5 ? `Você queimou ${num(k, 1)} kcal, ${equivalente(k)}.` : '';
  $('rRank').textContent = ''; $('result').hidden = false; W.last = item;
  if (profile.rank && profile.name) {
    $('rRank').textContent = 'Enviando ao ranking…';
    fetch('/api/score', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: profile.id, name: profile.name, country: profile.country, jumps: e.jumps, secs: e.secs }) })
      .then(r => r.json()).then(d => { $('rRank').textContent = d.ok ? (d.posicao ? `Você está em ${d.posicao}º no ranking da semana.` : 'Treino enviado ao ranking.') : (d.erro || 'Não foi possível enviar.'); })
      .catch(() => { $('rRank').textContent = 'Sem conexão: o treino ficou salvo só no seu celular.'; });
  } else if (profile.rank) $('rRank').textContent = 'Defina seu nome no Perfil para entrar no ranking.';
}

$('start').addEventListener('click', startWorkout);
$('cancel').addEventListener('click', () => endWorkout());
$('stop').addEventListener('click', finish);
$('rClose').addEventListener('click', () => { $('result').hidden = true; show('home'); });
$('rShare').addEventListener('click', async () => {
  const it = W.last; if (!it) return;
  const text = `Fiz ${it.jumps} saltos em ${mmss(it.secs)} no Ronald Jump e queimei ${num(it.kcal, 1)} kcal. Venha saltar também!`;
  try { if (navigator.share) await navigator.share({ title: 'Ronald Jump', text, url: location.origin }); else { await navigator.clipboard.writeText(text + ' ' + location.origin); toast('Texto copiado.'); } } catch {}
});
document.addEventListener('visibilitychange', () => { if (document.hidden && W.running) finish(); });

renderGoals(); renderProfile(); renderHome();
if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
