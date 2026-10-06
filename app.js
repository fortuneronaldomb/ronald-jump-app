/* ARQUIVO GERADO por "npm run build". Não edite aqui: edite os arquivos em src/. */

// src/jump-counter.js
var JumpCounter = class {
  constructor({ up = 0.05, down = 0.02, minGap = 230 } = {}) {
    this.up = up;
    this.down = down;
    this.minGap = minGap;
    this.reset();
  }
  reset() {
    this.ema = null;
    this.base = null;
    this.state = "ground";
    this.count = 0;
    this.peak = 0;
    this.armed = true;
    this.v = 0;
    this.pt = null;
    this.lastTake = -1e9;
    this.lastLand = 0;
    this.period = 600;
  }
  rebase() {
    this.ema = null;
    this.base = null;
    this.state = "ground";
    this.armed = true;
    this.v = 0;
    this.pt = null;
    this.peak = 0;
  }
  update(y, scale, t) {
    let jumped = false;
    if (!(scale > 0)) return { jumped, count: this.count, state: this.state, h: 0 };
    if (this.ema === null) {
      this.ema = y;
      this.base = y;
    }
    const prev = this.ema;
    this.ema += 0.6 * (y - this.ema);
    if (this.pt !== null && t > this.pt) {
      const vel = (prev - this.ema) / scale / ((t - this.pt) / 1e3);
      this.v = 0.5 * this.v + 0.5 * vel;
    }
    this.pt = t;
    const h = (this.base - this.ema) / scale;
    if (this.state === "ground") {
      if (!this.armed && h < this.up * 0.8) this.armed = true;
      if (this.armed) this.base += (this.ema > this.base ? 0.3 : 3e-3) * (this.ema - this.base);
      if (this.armed && h > this.up && this.v > 0.2 && t - this.lastTake > this.minGap) {
        this.state = "air";
        this.peak = h;
        if (this.lastTake > 0) this.period = Math.min(1500, Math.max(250, t - this.lastTake));
        this.lastTake = t;
      }
    } else {
      this.peak = Math.max(this.peak, h);
      if (h < Math.max(this.down, this.peak * 0.45)) {
        this.state = "ground";
        this.lastLand = t;
        this.armed = false;
        if (this.peak >= this.up) {
          this.count++;
          jumped = true;
        }
      }
    }
    return { jumped, count: this.count, state: this.state, h };
  }
};
var MET_PULO = 10;
var kcal = (seg, kg) => MET_PULO * kg * (seg / 3600);
var COMIDAS = [
  // kcal aproximadas por unidade
  { e: "\u{1F347}", s: "uva", p: "uvas", k: 3, v: "comer" },
  { e: "\u{1F353}", s: "morango", p: "morangos", k: 5, v: "comer" },
  { e: "\u{1F36A}", s: "biscoito", p: "biscoitos", k: 22, v: "comer" },
  { e: "\u{1F35E}", s: "fatia de p\xE3o", p: "fatias de p\xE3o", k: 65, v: "comer" },
  { e: "\u{1F36B}", s: "brigadeiro", p: "brigadeiros", k: 70, v: "comer" },
  { e: "\u{1F34C}", s: "banana", p: "bananas", k: 90, v: "comer" },
  { e: "\u{1F9C0}", s: "p\xE3o de queijo", p: "p\xE3es de queijo", k: 95, v: "comer" },
  { e: "\u{1F964}", s: "lata de refrigerante", p: "latas de refrigerante", k: 140, v: "tomar" },
  { e: "\u{1F357}", s: "coxinha", p: "coxinhas", k: 250, v: "comer" },
  { e: "\u{1F355}", s: "fatia de pizza", p: "fatias de pizza", k: 270, v: "comer" },
  { e: "\u{1F354}", s: "hamb\xFArguer", p: "hamb\xFArgueres", k: 500, v: "comer" }
];
function comida(k) {
  if (!(k >= 1.5)) return null;
  let f = COMIDAS[0];
  for (const c of COMIDAS) if (k >= c.k) f = c;
  const n = Math.max(1, Math.round(k / f.k)), nome = n === 1 ? f.s : f.p;
  return { emoji: f.e, n, nome, verbo: f.v, texto: `D\xE1 para ${f.v} ${n} ${nome}!` };
}
var PREMIOS = { 50: ["\u{1F949}", "Medalha de Bronze"], 100: ["\u{1F948}", "Medalha de Prata"], 200: ["\u{1F947}", "Medalha de Ouro"], 300: ["\u{1F3C6}", "Trof\xE9u"], 500: ["\u{1F48E}", "Diamante"], 1e3: ["\u{1F451}", "Coroa de Lenda"] };
var premio = (n) => PREMIOS[n] ? { emoji: PREMIOS[n][0], nome: PREMIOS[n][1] } : { emoji: "\u2B50", nome: "+1 estrela" };
function ritmoDe(temposMs) {
  const iv = [];
  for (let i = 1; i < temposMs.length; i++) {
    const d = (temposMs[i] - temposMs[i - 1]) / 1e3;
    if (d > 0 && d < 1.5) iv.push(d);
  }
  if (iv.length < 10) return null;
  const m = iv.reduce((a, b) => a + b, 0) / iv.length, sd = Math.sqrt(iv.reduce((a, b) => a + (b - m) ** 2, 0) / iv.length);
  return { estavel: Math.max(0, Math.round(100 - sd / m * 100)), cadencia: Math.round(60 / m) };
}

// src/rope-shape.js
var nivelCorda = (fase) => -Math.cos(2 * Math.PI * fase - 0.55 * Math.PI);
var visivelCorda = (nivel2) => Math.min(1, Math.max(0, (Math.abs(nivel2) - 0.35) / 0.3));

// src/cartao.js
var carregar = (url) => new Promise((ok, no) => {
  const i = new Image();
  i.onload = () => ok(i);
  i.onerror = no;
  i.src = url;
});
async function gerarCartao({ jumps, secs, kcal: kcal2, comida: comida2 = "", premios = "", ritmo = "", logoUrl = "/icons/logo.png", site = "" }) {
  const W2 = 1080, H = 1920, c = document.createElement("canvas");
  c.width = W2;
  c.height = H;
  const x = c.getContext("2d");
  try {
    await document.fonts.load('900 120px "Big Shoulders Display"');
    await document.fonts.load('700 40px "DM Sans"');
  } catch {
  }
  const DISP = '900 %spx "Big Shoulders Display","Arial Narrow",Impact,sans-serif', SANS = '700 %spx "DM Sans",system-ui,sans-serif';
  const f = (m, n) => m.replace("%s", n);
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#0a0a0a");
  g.addColorStop(1, "#241006");
  x.fillStyle = g;
  x.fillRect(0, 0, W2, H);
  ["#d4511a", "#e8c231", "#2bb3c0"].forEach((cor, i) => {
    x.strokeStyle = cor + "66";
    x.lineWidth = 10;
    x.beginPath();
    x.ellipse(W2 / 2, 520, 400 + i * 75, 140 + i * 34, -0.18 + i * 0.16, 0, Math.PI * 2);
    x.stroke();
  });
  try {
    const img = await carregar(logoUrl);
    x.save();
    x.beginPath();
    x.arc(W2 / 2, 520, 165, 0, Math.PI * 2);
    x.clip();
    x.drawImage(img, W2 / 2 - 165, 355, 330, 330);
    x.restore();
  } catch {
  }
  x.textAlign = "center";
  x.fillStyle = "#f5f0e8";
  x.font = f(DISP, 96);
  x.fillText("RONALD JUMP", W2 / 2, 800);
  x.fillStyle = "#e8c231";
  x.font = f(DISP, 380);
  x.fillText(String(jumps), W2 / 2, 1130);
  x.fillStyle = "#f5f0e8";
  x.font = f(DISP, 84);
  x.fillText("SALTOS", W2 / 2, 1220);
  const mm = `${String(Math.floor(secs / 60)).padStart(2, "0")}:${String(secs % 60).padStart(2, "0")}`;
  x.font = f(DISP, 120);
  x.fillStyle = "#e8c231";
  x.fillText(mm, W2 * 0.3, 1400);
  x.fillText(kcal2, W2 * 0.7, 1400);
  x.font = f(SANS, 40);
  x.fillStyle = "#a49f95";
  x.fillText("TEMPO", W2 * 0.3, 1456);
  x.fillText("KCAL QUEIMADAS", W2 * 0.7, 1456);
  x.fillStyle = "#f5f0e8";
  x.font = f(SANS, 54);
  if (comida2) x.fillText(comida2, W2 / 2, 1590);
  if (premios) {
    x.font = f(SANS, 76);
    x.fillText(premios, W2 / 2, 1700);
  }
  if (ritmo) {
    x.font = f(SANS, 42);
    x.fillStyle = "#a49f95";
    x.fillText(ritmo, W2 / 2, 1775);
  }
  x.fillStyle = "#e8c231";
  x.font = f(SANS, 40);
  x.fillText(site ? "Salte tamb\xE9m: " + site : "Salte tamb\xE9m no Ronald Jump", W2 / 2, 1855);
  return new Promise((ok) => c.toBlob((b) => ok(b), "image/png"));
}

// src/celebration.js
var fxc = document.getElementById("fx");
var fx = fxc.getContext("2d");
var banner = document.getElementById("banner");
var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
var CONFETTI = ["#e8c231", "#d4511a", "#2bb3c0", "#f5f0e8"];
var parts = [];
var raf = 0;
var hideT = 0;
var nivel = (n) => n % 500 === 0 ? 3 : n % 100 === 0 ? 2 : 1;
function size() {
  const d = Math.min(devicePixelRatio || 1, 2);
  fxc.width = innerWidth * d;
  fxc.height = innerHeight * d;
  fx.setTransform(d, 0, 0, d, 0, 0);
}
function spawn(tier) {
  const W2 = innerWidth, H = innerHeight, coins = [40, 80, 150][tier - 1], conf = [30, 70, 120][tier - 1];
  for (let i = 0; i < coins; i++) {
    const fromLeft = i % 2 === 0;
    parts.push({
      k: "c",
      x: fromLeft ? W2 * 0.1 : W2 * 0.9,
      y: H * 0.78,
      vx: (fromLeft ? 1 : -1) * (2 + Math.random() * 6),
      vy: -(11 + Math.random() * 10),
      r: 9 + Math.random() * 8,
      a: Math.random() * 6,
      va: 0.15 + Math.random() * 0.2,
      life: 0
    });
  }
  for (let i = 0; i < conf; i++)
    parts.push({
      k: "f",
      x: Math.random() * W2,
      y: -20 - Math.random() * H * 0.4,
      vx: (Math.random() - 0.5) * 3,
      vy: 2 + Math.random() * 4,
      w: 6 + Math.random() * 6,
      h: 3 + Math.random() * 5,
      a: Math.random() * 6,
      va: (Math.random() - 0.5) * 0.4,
      col: CONFETTI[i % 4],
      life: 0
    });
}
function frame() {
  fx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter((p) => p.y < innerHeight + 40 && p.life < 260);
  for (const p of parts) {
    p.life++;
    p.x += p.vx;
    p.y += p.vy;
    p.a += p.va;
    if (p.k === "c") {
      p.vy += 0.5;
      const sx = Math.abs(Math.cos(p.a));
      fx.save();
      fx.translate(p.x, p.y);
      fx.scale(Math.max(sx, 0.15), 1);
      fx.fillStyle = "#e8c231";
      fx.beginPath();
      fx.arc(0, 0, p.r, 0, 7);
      fx.fill();
      fx.strokeStyle = "#a8861a";
      fx.lineWidth = 2.5;
      fx.stroke();
      fx.strokeStyle = "#fff3b0";
      fx.lineWidth = 1.5;
      fx.beginPath();
      fx.arc(0, 0, p.r * 0.6, 0, 7);
      fx.stroke();
      fx.restore();
    } else {
      p.vy += 0.06;
      p.vx *= 0.995;
      fx.save();
      fx.translate(p.x, p.y);
      fx.rotate(p.a);
      fx.fillStyle = p.col;
      fx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      fx.restore();
    }
  }
  if (parts.length) raf = requestAnimationFrame(frame);
  else {
    raf = 0;
    fx.clearRect(0, 0, innerWidth, innerHeight);
  }
}
function reels(n) {
  const box = banner.querySelector(".reels");
  box.innerHTML = "";
  [...String(n)].forEach((d, i) => {
    const cells = [], total = 14;
    for (let k = 0; k < total - 1; k++) cells.push(Math.floor(Math.random() * 10));
    cells.push(+d);
    const reel = document.createElement("div");
    reel.className = "reel";
    const strip = document.createElement("div");
    strip.className = "strip";
    strip.innerHTML = cells.map((c) => `<span>${c}</span>`).join("");
    reel.appendChild(strip);
    box.appendChild(reel);
    if (reduce) {
      strip.style.transform = `translateY(-${total - 1}em)`;
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(() => {
      strip.style.transition = `transform ${1 + i * 0.28}s cubic-bezier(.15,.85,.25,1)`;
      strip.style.transform = `translateY(-${total - 1}em)`;
    }));
  });
}
function tone(a, f, t0, d, type = "triangle", v = 0.14) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.setValueAtTime(v, t0);
  g.gain.exponentialRampToValueAtTime(1e-4, t0 + d);
  o.connect(g);
  g.connect(a.destination);
  o.start(t0);
  o.stop(t0 + d + 0.02);
}
function som(a, tier) {
  const t = a.currentTime;
  for (let i = 0; i < 10; i++) tone(a, 300 + i * 25, t + i * 0.08, 0.03, "square", 0.04);
  const base = t + 0.85;
  const notas = [[1047, 1319, 1568], [1047, 1319, 1568, 2093, 2637], [784, 1047, 1319, 1568, 2093, 2637, 3136]][tier - 1];
  notas.forEach((f, i) => tone(a, f, base + i * 0.07, 0.4));
  for (let i = 0; i < tier * 5; i++) tone(a, 2600 + Math.random() * 1400, base + 0.3 + i * 0.06, 0.09, "sine", 0.06);
}
function celebrate(n, { actx: actx2 = null, vibrate = false, premio: premio2 = null } = {}) {
  const tier = nivel(n);
  banner.className = "t" + tier;
  banner.querySelector(".title").textContent = ["COMBO!", "JACKPOT!", "MEGA JACKPOT!"][tier - 1];
  banner.querySelector(".sub").textContent = n + " saltos";
  const pr = banner.querySelector(".premio");
  if (pr) pr.textContent = premio2 ? premio2.emoji + " " + premio2.nome : "";
  reels(n);
  banner.hidden = false;
  void banner.offsetWidth;
  banner.classList.add("show");
  clearTimeout(hideT);
  hideT = setTimeout(() => {
    banner.classList.remove("show");
    setTimeout(() => {
      banner.hidden = true;
    }, 350);
  }, 2600 + tier * 400);
  if (!reduce) {
    size();
    spawn(tier);
    if (!raf) raf = requestAnimationFrame(frame);
  }
  if (actx2) {
    try {
      som(actx2, tier);
    } catch {
    }
  }
  if (vibrate && navigator.vibrate) navigator.vibrate(tier === 1 ? [40, 40, 40] : [60, 40, 60, 40, 140]);
}

// src/rope-sound.js
var ruido = null;
function bufferRuido(a) {
  if (ruido && ruido.sampleRate === a.sampleRate) return ruido;
  const n = Math.floor(a.sampleRate * 0.5), b = a.createBuffer(1, n, a.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return ruido = b;
}
function vento(a, quando, dur, vol) {
  const s = a.createBufferSource();
  s.buffer = bufferRuido(a);
  const f = a.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 1.1;
  f.frequency.setValueAtTime(500, quando);
  f.frequency.exponentialRampToValueAtTime(2600, quando + dur);
  const g = a.createGain();
  g.gain.setValueAtTime(1e-4, quando);
  g.gain.exponentialRampToValueAtTime(vol, quando + dur * 0.35);
  g.gain.exponentialRampToValueAtTime(1e-4, quando + dur);
  s.connect(f);
  f.connect(g);
  g.connect(a.destination);
  s.start(quando);
  s.stop(quando + dur + 0.02);
}
function batida(a, quando, vol) {
  const o = a.createOscillator(), g = a.createGain();
  o.type = "sine";
  o.frequency.setValueAtTime(170, quando);
  o.frequency.exponentialRampToValueAtTime(55, quando + 0.07);
  g.gain.setValueAtTime(vol, quando);
  g.gain.exponentialRampToValueAtTime(1e-4, quando + 0.09);
  o.connect(g);
  g.connect(a.destination);
  o.start(quando);
  o.stop(quando + 0.1);
  const s = a.createBufferSource();
  s.buffer = bufferRuido(a);
  const h = a.createBiquadFilter();
  h.type = "highpass";
  h.frequency.value = 2500;
  const g2 = a.createGain();
  g2.gain.setValueAtTime(vol * 0.5, quando);
  g2.gain.exponentialRampToValueAtTime(1e-4, quando + 0.025);
  s.connect(h);
  h.connect(g2);
  g2.connect(a.destination);
  s.start(quando);
  s.stop(quando + 0.03);
}
function somCorda(a, periodoMs = 500, volume = 1) {
  if (!a) return;
  const t = a.currentTime, p = Math.min(1200, Math.max(250, periodoMs)) / 1e3;
  batida(a, t, 0.22 * volume);
  vento(a, t + Math.min(0.3, p * 0.4), Math.min(0.26, p * 0.45), 0.12 * volume);
}

// src/app.js
var NADA = new Proxy(function() {
}, { get: (t, k) => k === "style" || k === "dataset" ? {} : k === "classList" ? { add() {
}, remove() {
}, toggle() {
}, contains: () => false } : k === Symbol.toPrimitive ? () => "" : NADA, set: () => true, apply: () => NADA });
var $ = (id) => document.getElementById(id) || NADA;
var VERSAO = 13;
(async () => {
  const meta = Number(document.querySelector('meta[name="rj-versao"]')?.content || 0);
  try {
    if (meta === VERSAO) {
      sessionStorage.removeItem("rj.recarregou");
      return;
    }
    if (sessionStorage.getItem("rj.recarregou")) return;
    sessionStorage.setItem("rj.recarregou", "1");
  } catch {
  }
  try {
    for (const r of await navigator.serviceWorker?.getRegistrations?.() || []) await r.unregister();
  } catch {
  }
  try {
    for (const k of await caches.keys()) await caches.delete(k);
  } catch {
  }
  location.reload();
})();
var store = {
  get: (k, d) => {
    try {
      return JSON.parse(localStorage.getItem(k)) ?? d;
    } catch {
      return d;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
    }
  }
};
var PAISES = { BR: "Brasil", PT: "Portugal", US: "Estados Unidos", AR: "Argentina", UY: "Uruguai", PY: "Paraguai", CL: "Chile", CO: "Col\xF4mbia", MX: "M\xE9xico", ES: "Espanha", IT: "It\xE1lia", FR: "Fran\xE7a", DE: "Alemanha", GB: "Reino Unido", JP: "Jap\xE3o", AO: "Angola", MZ: "Mo\xE7ambique" };
var flag = (c) => c && c.length === 2 ? String.fromCodePoint(...[...c.toUpperCase()].map((x) => 127397 + x.charCodeAt(0))) : "";
var pad = (n) => String(n).padStart(2, "0");
var mmss = (s) => `${pad(Math.floor(s / 60))}:${pad(Math.floor(s % 60))}`;
var num = (n, d = 0) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
var dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`;
};
var profile = Object.assign({ name: "", kg: 70, country: "BR", sound: true, rank: true, rope: true, ropeSound: true, dist: "corpo", distV: 0, distCustom: null, premios: 0, metaDia: 300, boas: 0, dicas: 0, goal: "free", sens: "normal" }, store.get("rj.profile", {}));
if (!profile.distV) {
  if (profile.dist !== "custom") profile.dist = "corpo";
  profile.distV = 1;
}
var saveProfile = () => store.set("rj.profile", profile);
saveProfile();
var history = store.get("rj.hist", []);
var pending = store.get("rj.pending", []);
var API = window.RJ_API_BASE || "";
var token = store.get("rj.token", "");
var user = store.get("rj.user", null);
async function api(path, opts = {}) {
  const r = await fetch(API + path, { method: opts.method || "GET", headers: { "Content-Type": "application/json", ...token ? { Authorization: "Bearer " + token } : {} }, body: opts.body ? JSON.stringify(opts.body) : void 0 });
  let d = {};
  try {
    d = await r.json();
  } catch {
  }
  if (r.status === 401 && token && !/^\/api\/(login|register|account)/.test(path)) {
    sairLocal();
  }
  return { ok: r.ok, status: r.status, d };
}
function sairLocal() {
  token = "";
  user = null;
  history = [];
  pending = [];
  ["rj.token", "rj.user", "rj.hist", "rj.pending", "rj.guest"].forEach((k) => {
    try {
      localStorage.removeItem(k);
    } catch {
    }
  });
  endWorkout(true);
  $("result").hidden = true;
  irParaEntrar();
}
function toast(t) {
  const el = $("toast");
  el.textContent = t;
  el.classList.add("on");
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove("on"), 2800);
}
function show(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("on", s.id === id));
  document.querySelectorAll("#nav button").forEach((b) => b.classList.toggle("on", b.dataset.s === id));
  $("screens").scrollTop = 0;
  if (id === "home") renderHome();
  if (id === "history") renderHistory();
  if (id === "rank") loadRank();
}
document.querySelectorAll("#nav button").forEach((b) => b.addEventListener("click", () => show(b.dataset.s)));
var GRUPOS = [
  ["Tempo", [["free", "Livre"], ["t60", "1 min"], ["t180", "3 min"], ["t300", "5 min"], ["t600", "10 min"]]],
  ["Saltos", [["j100", "100"], ["j200", "200"], ["j300", "300"], ["j500", "500"], ["j1000", "1.000"]]],
  ["Calorias", [["k50", "50 kcal"], ["k100", "100 kcal"]]]
];
function renderGoals() {
  const box = $("goals");
  box.innerHTML = "";
  for (const [nome, itens] of GRUPOS) {
    const lista = [...itens];
    if (nome === "Saltos" && /^j\d+$/.test(profile.goal) && !itens.some((i) => i[0] === profile.goal)) lista.push([profile.goal, num(+profile.goal.slice(1))]);
    const g = document.createElement("div");
    g.className = "grp";
    const l = document.createElement("span");
    l.className = "glabel";
    l.textContent = nome;
    g.appendChild(l);
    const row = document.createElement("div");
    row.className = "chips";
    for (const [id, label] of lista) {
      const b = document.createElement("button");
      b.className = "chip";
      b.type = "button";
      b.textContent = label;
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", String(profile.goal === id));
      b.onclick = () => {
        profile.goal = id;
        saveProfile();
        renderGoals();
      };
      row.appendChild(b);
    }
    g.appendChild(row);
    box.appendChild(g);
  }
}
$("metaJok").addEventListener("click", () => {
  const n = Math.floor(+String($("metaJ").value).replace(",", "."));
  if (!(n >= 10 && n <= 5e3)) return toast("Digite uma meta entre 10 e 5.000 saltos.");
  profile.goal = "j" + n;
  saveProfile();
  $("metaJ").value = "";
  renderGoals();
  toast(`Meta definida: ${num(n)} saltos.`);
});
var goalOf = (id) => id[0] === "t" ? { type: "time", v: +id.slice(1) } : id[0] === "k" ? { type: "kcal", v: +id.slice(1) } : id[0] === "j" ? { type: "jumps", v: +id.slice(1) } : { type: "free", v: 0 };
function renderHome() {
  const today = dayKey(Date.now());
  const days = [...Array(7)].map((_, i) => {
    const d2 = /* @__PURE__ */ new Date();
    d2.setDate(d2.getDate() - (6 - i));
    return d2;
  });
  const per = {};
  let tj = 0, tk = 0;
  for (const h of history) {
    const k = dayKey(h.t);
    per[k] = (per[k] || 0) + h.jumps;
    if (k === today) {
      tj += h.jumps;
      tk += h.kcal;
    }
  }
  $("sToday").textContent = num(tj);
  $("sKcal").textContent = num(tk);
  let streak = 0, d = /* @__PURE__ */ new Date();
  if (!per[dayKey(d)]) d.setDate(d.getDate() - 1);
  while (per[dayKey(d)]) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  $("sStreak").textContent = streak;
  const meta = profile.metaDia || 300, pct = Math.min(1, tj / meta);
  $("anelProg").style.strokeDashoffset = String(314 * (1 - pct));
  $("anel").classList.toggle("ok", pct >= 1);
  $("anelN").textContent = num(tj);
  $("anelM").textContent = pct >= 1 ? `meta de ${num(meta)} batida! \u{1F389}` : `de ${num(meta)} saltos hoje`;
  $("chama").textContent = streak ? `\u{1F525} ${streak} ${streak === 1 ? "dia seguido" : "dias seguidos"}` : "Comece sua sequ\xEAncia hoje";
  const max = Math.max(1, ...days.map((x) => per[dayKey(x)] || 0));
  $("bars").innerHTML = days.map((x) => {
    const v = per[dayKey(x)] || 0;
    return `<div class="${dayKey(x) === today ? "today" : ""}" title="${num(v)} saltos"><i class="${v ? "has" : ""}" style="height:${Math.max(3, v / max * 82)}px"></i>${"DSTQQSS"[x.getDay()]}</div>`;
  }).join("");
}
function renderHistory() {
  const tot = history.reduce((a, h) => a + h.jumps, 0);
  $("histTotal").textContent = history.length ? `${num(history.length)} treinos, ${num(tot)} saltos no total.` : "Seus treinos aparecem aqui depois do primeiro salto.";
  $("histList").innerHTML = history.slice(0, 100).map((h) => {
    const d = new Date(h.t);
    return `<li><div>${d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}, ${pad(d.getHours())}:${pad(d.getMinutes())}<small>${mmss(h.secs)} \xB7 ${num(h.kcal, 1)} kcal</small></div><b>${num(h.jumps)}</b></li>`;
  }).join("");
}
var rankPeriod = "week";
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => {
  rankPeriod = t.dataset.p;
  document.querySelectorAll(".tab").forEach((x) => x.classList.toggle("on", x === t));
  loadRank();
}));
var esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
function avatarHtml(nome, src) {
  return src ? `<img src="${src}" alt="">` : `<span>${esc(String(nome || "?").trim().charAt(0).toUpperCase() || "?")}</span>`;
}
async function loadRank() {
  $("rankMsg").textContent = "Carregando\u2026";
  try {
    const r = await fetch(API + "/api/ranking?period=" + rankPeriod);
    if (!r.ok) throw 0;
    const d = await r.json();
    $("rankMsg").textContent = d.users.length ? "" : "Ningu\xE9m no ranking ainda. Fa\xE7a um treino e seja o primeiro.";
    $("rankUsers").innerHTML = d.users.map((u) => `<li class="${u.name === profile.name && u.country === profile.country ? "me" : ""}"><i class="avatar">${avatarHtml(u.name, u.pid ? API + "/api/foto/" + u.pid + "?v=" + (u.fv || 0) : "")}</i><span>${flag(u.country)} ${esc(u.name)}</span><b>${num(u.jumps)}</b></li>`).join("");
    $("rankCountries").innerHTML = d.countries.map((c) => `<li><span>${flag(c.country)} ${esc(PAISES[c.country] || c.country)}</span><b>${num(c.jumps)}</b></li>`).join("");
  } catch {
    $("rankMsg").textContent = "Sem conex\xE3o com o ranking. Confira a internet e abra a aba de novo.";
  }
}
function renderProfile() {
  $("pName").value = profile.name;
  $("pKg").value = profile.kg;
  $("pSound").checked = profile.sound;
  $("pSens").value = profile.sens;
  $("pRank").checked = profile.rank;
  $("ropeToggle").checked = profile.rope;
  $("pRope").checked = profile.ropeSound;
  $("pCountry").innerHTML = Object.entries(PAISES).map(([c, n]) => `<option value="${c}">${flag(c)} ${n}</option>`).join("");
  $("pCountry").value = profile.country;
  $("pMetaDia").value = profile.metaDia || 300;
  $("pPremios").textContent = `\u{1F3C5} Pr\xEAmios conquistados: ${num(profile.premios || 0)}`;
}
async function salvarConta() {
  saveProfile();
  if (!token) return;
  const r = await api("/api/me", { method: "PATCH", body: { name: profile.name, country: profile.country, kg: profile.kg } }).catch(() => null);
  if (r && r.ok) {
    user = r.d.user;
    store.set("rj.user", user);
  } else if (r && r.d.erro) toast(r.d.erro);
}
$("pName").addEventListener("change", (e) => {
  profile.name = e.target.value.replace(/[<>&"'`]/g, "").trim().slice(0, 20) || profile.name;
  e.target.value = profile.name;
  salvarConta();
});
$("pKg").addEventListener("change", (e) => {
  const v = +String(e.target.value).replace(",", ".");
  profile.kg = v >= 30 && v <= 250 ? v : profile.kg;
  e.target.value = profile.kg;
  salvarConta();
});
$("pCountry").addEventListener("change", (e) => {
  profile.country = e.target.value;
  salvarConta();
});
$("pMetaDia").addEventListener("change", (e) => {
  const n = Math.floor(+e.target.value);
  profile.metaDia = n >= 50 && n <= 5e3 ? n : profile.metaDia || 300;
  e.target.value = profile.metaDia;
  saveProfile();
  renderHome();
});
$("pSens").addEventListener("change", (e) => {
  profile.sens = e.target.value;
  saveProfile();
});
$("pSound").addEventListener("change", (e) => {
  profile.sound = e.target.checked;
  saveProfile();
});
$("pRank").addEventListener("change", (e) => {
  profile.rank = e.target.checked;
  saveProfile();
});
$("ropeToggle").addEventListener("change", (e) => {
  profile.rope = e.target.checked;
  saveProfile();
});
$("pRope").addEventListener("change", (e) => {
  profile.ropeSound = e.target.checked;
  saveProfile();
  if (e.target.checked) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      actx.resume && actx.resume();
      somCorda(actx, 500);
    } catch {
    }
  }
});
var minhaFotoUrl = "";
function pintaAvatar(el, nome, src) {
  el.innerHTML = avatarHtml(nome, src);
}
function atualizarAvatares() {
  pintaAvatar($("pFotoImg"), profile.name, minhaFotoUrl);
  pintaAvatar($("hAvatar"), profile.name, minhaFotoUrl);
  $("pFotoRem").hidden = !minhaFotoUrl;
  $("pFotoRankLbl").hidden = !minhaFotoUrl;
  $("pFotoRank").checked = !!(user && user.fotoRanking);
  $("pFotoBtn").textContent = minhaFotoUrl ? "Trocar foto" : "Escolher foto";
}
async function carregarMinhaFoto() {
  if (minhaFotoUrl) {
    try {
      URL.revokeObjectURL(minhaFotoUrl);
    } catch {
    }
    minhaFotoUrl = "";
  }
  if (token && user && user.foto) {
    try {
      const r = await fetch(API + "/api/foto", { headers: { Authorization: "Bearer " + token } });
      if (r.ok) minhaFotoUrl = URL.createObjectURL(await r.blob());
    } catch {
    }
  }
  atualizarAvatares();
}
async function fotoParaJpeg(arquivo) {
  const img = window.createImageBitmap ? await createImageBitmap(arquivo) : await new Promise((ok, no) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = no;
    i.src = URL.createObjectURL(arquivo);
  });
  const w = img.width || img.naturalWidth, h = img.height || img.naturalHeight, lado = Math.min(w, h);
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  c.getContext("2d").drawImage(img, (w - lado) / 2, (h - lado) / 2, lado, lado, 0, 0, 256, 256);
  for (const q of [0.85, 0.75, 0.65, 0.5, 0.4]) {
    const url = c.toDataURL("image/jpeg", q);
    if (url.length * 0.75 < 9e4) return url;
  }
  throw new Error("grande");
}
$("pFotoBtn").addEventListener("click", () => $("pFotoInput").click());
$("pFotoInput").addEventListener("change", async (e) => {
  const arq = e.target.files && e.target.files[0];
  e.target.value = "";
  if (!arq) return;
  if (!/^image\//.test(arq.type)) return toast("Escolha uma imagem.");
  try {
    const foto = await fotoParaJpeg(arq);
    const r = await api("/api/foto", { method: "PUT", body: { foto } });
    if (!r.ok) return toast(r.d.erro || "N\xE3o foi poss\xEDvel salvar a foto.");
    user = r.d.user;
    store.set("rj.user", user);
    await carregarMinhaFoto();
    toast("Foto atualizada.");
  } catch {
    toast("N\xE3o consegui usar essa foto. Tente outra.");
  }
});
$("pFotoRem").addEventListener("click", async () => {
  const r = await api("/api/foto", { method: "DELETE" }).catch(() => null);
  if (r && r.ok) {
    user = r.d.user;
    store.set("rj.user", user);
    await carregarMinhaFoto();
    toast("Foto removida.");
  } else toast("N\xE3o foi poss\xEDvel remover agora.");
});
$("pFotoRank").addEventListener("change", async (e) => {
  const r = await api("/api/me", { method: "PATCH", body: { fotoRanking: e.target.checked } }).catch(() => null);
  if (r && r.ok) {
    user = r.d.user;
    store.set("rj.user", user);
  } else {
    e.target.checked = !e.target.checked;
    toast("N\xE3o foi poss\xEDvel salvar agora.");
  }
});
var deferred = null;
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferred = e;
  $("install").hidden = false;
});
$("install").addEventListener("click", async () => {
  if (!deferred) return;
  deferred.prompt();
  await deferred.userChoice;
  deferred = null;
  $("install").hidden = true;
});
if (/iphone|ipad/i.test(navigator.userAgent) && !navigator.standalone) $("iosHint").hidden = false;
var actx = null;
function beep(freq, ms, vol = 0.12) {
  if (!profile.sound || !actx) return;
  const o = actx.createOscillator(), g = actx.createGain();
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(actx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(1e-4, actx.currentTime + ms / 1e3);
  o.stop(actx.currentTime + ms / 1e3 + 0.02);
}
var buzz = (ms) => {
  if (profile.sound && navigator.vibrate) navigator.vibrate(ms);
};
var landmarker = null;
var loading = null;
async function loadModel(onStatus) {
  if (landmarker) return landmarker;
  if (loading) return loading;
  loading = (async () => {
    onStatus("Carregando o detector de movimento\u2026");
    const { FilesetResolver, PoseLandmarker } = await import("/vendor/mediapipe/vision_bundle.mjs");
    const fileset = await FilesetResolver.forVisionTasks("/vendor/mediapipe/wasm");
    let url = "/model/pose_landmarker_lite.task";
    try {
      const h = await fetch(url, { method: "HEAD" });
      if (!h.ok || +h.headers.get("content-length") < 1e6) throw 0;
    } catch {
      url = "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task";
    }
    const opts = (d) => ({ baseOptions: { modelAssetPath: url, delegate: d }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.5, minPosePresenceConfidence: 0.5, minTrackingConfidence: 0.5 });
    try {
      landmarker = await PoseLandmarker.createFromOptions(fileset, opts("GPU"));
    } catch {
      landmarker = await PoseLandmarker.createFromOptions(fileset, opts("CPU"));
    }
    return landmarker;
  })();
  try {
    return await loading;
  } finally {
    loading = null;
  }
}
var DIST = {
  perto: { min: 0.2, run: 0.15, ideal: 0.28, max: 0.62, txt: "cerca de 1 metro", passos: "dois passos" },
  medio: { min: 0.13, run: 0.1, ideal: 0.17, max: 0.45, txt: "cerca de 1,5 a 2 metros", passos: "tr\xEAs passos" },
  longe: { min: 0.09, run: 0.07, ideal: 0.12, max: 0.3, txt: "cerca de 2,5 a 3 metros", passos: "quatro passos" },
  // corpo inteiro: exige cabeça, ombros, quadril e pés na tela (altura do corpo = 55% a 92% da imagem); não usa a largura dos ombros
  corpo: { min: 0.09, run: 0.05, ideal: 0.12, max: 0.3, corpo: true, txt: "cerca de 2 a 2,5 metros", passos: "tr\xEAs a quatro passos" }
};
var distAtual = () => profile.dist === "custom" && profile.distCustom ? { ...profile.distCustom, txt: "a dist\xE2ncia que voc\xEA calibrou", passos: "a mesma posi\xE7\xE3o da calibra\xE7\xE3o" } : DIST[profile.dist] || DIST.medio;
function salvarDistCustom(sw) {
  profile.distCustom = { ideal: +sw.toFixed(3), min: +(sw * 0.78).toFixed(3), run: +(sw * 0.6).toFixed(3), max: +(sw * 1.7).toFixed(3) };
  profile.dist = "custom";
  saveProfile();
  aplicarDist();
}
var mediana = (a) => {
  const b = [...a].sort((x, y) => x - y);
  return b[Math.floor(b.length / 2)];
};
var dicaAberta = false;
var estadoAtual = "";
function estado(tipo) {
  if (tipo === estadoAtual) return;
  estadoAtual = tipo;
  const el = $("estado"), b = $("borda");
  if (tipo === "oculto") {
    el.hidden = true;
    b.className = "";
    $("sinalDot").className = "dot";
    return;
  }
  const cfg = { pronto: ["ok", "\u25B6", "PODE COME\xC7AR"], start: ["ok", "\u25B6", "START!"], fora: ["ruim", "\u2715", "FORA DA POSI\xC7\xC3O"], ok: ["ok", "", ""] }[tipo];
  b.className = cfg[0];
  $("sinalDot").className = "dot " + (cfg[0] === "ok" ? "v" : "r");
  if (tipo === "ok") {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.className = "estado " + cfg[0];
  el.querySelector("i").textContent = cfg[1];
  el.querySelector("b").textContent = cfg[2];
}
var W = { running: false, raf: 0, stream: null, lock: null };
var video = document.createElement("video");
video.playsInline = true;
video.muted = true;
video.setAttribute("playsinline", "");
video.style.cssText = "position:fixed;left:0;top:0;width:2px;height:2px;opacity:0;pointer-events:none";
document.body.appendChild(video);
var cv = $("cv");
var ctx = cv.getContext("2d");
var L = { nose: 0, ls: 11, rs: 12, lw: 15, rw: 16, lh: 23, rh: 24, lk: 25, rk: 26, la: 27, ra: 28 };
function fit() {
  const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
  cv.width = w * dpr;
  cv.height = h * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return [w, h];
}
var vis = (lm, i) => lm[i] ? lm[i].visibility ?? 1 : 0;
async function startWorkout() {
  if (!$("workout").hidden) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    actx.resume && actx.resume();
  } catch {
  }
  $("workout").hidden = false;
  $("stop").hidden = true;
  $("hCount").textContent = "0";
  $("hFood").textContent = "Continue pulando\u2026";
  $("hKcalBig").textContent = "0";
  $("hTime").textContent = "00:00";
  $("hKcal").textContent = "0,0";
  const goal = goalOf(profile.goal);
  $("goalbar").hidden = goal.type === "free";
  $("goalfill").style.width = "0";
  const msg = (t) => $("hMsg").textContent = t;
  try {
    msg("Abrindo a c\xE2mera\u2026");
    W.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
    video.srcObject = W.stream;
    await video.play();
    if (profile.dicas < 2) {
      profile.dicas++;
      saveProfile();
      abrirDica(true);
    }
  } catch (e) {
    endWorkout(true);
    toast(e && e.name === "NotAllowedError" ? "Permita o uso da c\xE2mera nas configura\xE7\xF5es do navegador e tente de novo." : "N\xE3o consegui abrir a c\xE2mera neste aparelho.");
    return;
  }
  let lmk;
  try {
    lmk = await loadModel(msg);
  } catch (e) {
    console.error(e);
    endWorkout(true);
    toast("N\xE3o consegui carregar o detector. Verifique a internet e tente de novo.");
    return;
  }
  try {
    W.lock = await navigator.wakeLock?.request("screen");
  } catch {
  }
  const counter = new JumpCounter({ up: { alta: 0.035, normal: 0.05, baixa: 0.07 }[profile.sens] || 0.05 });
  let mode = "tronco", modeSince = 0;
  let phase = "position", okSince = 0, calib = null, calibBeep = 0, ultimaComida = "", ultimoMarco = 0;
  W.calibrar = () => {
    calib = { t0: performance.now(), s: [] };
    abrirDica(false);
    $("calibrar").hidden = true;
  };
  $("calibrar").hidden = false;
  let t0 = 0, active = 0, lastTick = 0, lastSeen = 0, lastJumpAt = 0, lastVT = -1, paused = false;
  const counted = () => counter.count;
  W.running = true;
  W.end = null;
  W.premios = [];
  W.tempos = [];
  W.meta = false;
  estadoAtual = "";
  const ondas = [];
  let ultimoH = 0;
  msg("Fique de frente, com a cabe\xE7a e os ombros na tela");
  const loop = () => {
    if (!W.running) return;
    W.raf = requestAnimationFrame(loop);
    const [cw, ch] = [innerWidth, innerHeight];
    if (cv.width !== Math.round(cw * Math.min(devicePixelRatio || 1, 2))) fit();
    const vw = video.videoWidth, vh = video.videoHeight;
    if (!vw) return;
    const sc = Math.max(cw / vw, ch / vh), ox = (cw - vw * sc) / 2, oy = (ch - vh * sc) / 2;
    const now = performance.now();
    let lm = null;
    if (video.currentTime !== lastVT) {
      lastVT = video.currentTime;
      try {
        const r = lmk.detectForVideo(video, now);
        lm = r.landmarks && r.landmarks[0];
      } catch {
      }
    }
    ctx.save();
    ctx.clearRect(0, 0, cw, ch);
    ctx.translate(cw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, ox, oy, vw * sc, vh * sc);
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.fillRect(0, 0, cw, ch);
    const P = (i) => [ox + lm[i].x * vw * sc, oy + lm[i].y * vh * sc];
    const shOk = !!lm && [L.ls, L.rs].every((i) => vis(lm, i) > 0.5);
    const hipOk = !!lm && [L.lh, L.rh].every((i) => vis(lm, i) > 0.5);
    const sw = shOk ? Math.hypot((lm[L.ls].x - lm[L.rs].x) * vw, (lm[L.ls].y - lm[L.rs].y) * vh) / vh : 0;
    const dd = distAtual();
    let longe, perto, torsoOk, semPes = false;
    if (dd.corpo) {
      const todos = !!lm && [0, L.ls, L.rs, L.lh, L.rh, L.la, L.ra].every((i) => vis(lm, i) > 0.5);
      const alt = todos ? (lm[L.la].y + lm[L.ra].y) / 2 - lm[0].y : 0;
      const dentro = todos && lm[0].y > 0.01 && Math.max(lm[L.la].y, lm[L.ra].y) < 0.985;
      longe = todos && alt < 0.55;
      perto = todos && (alt > 0.92 || !dentro);
      semPes = shOk && !todos;
      torsoOk = phase === "run" ? shOk && sw > dd.run : todos && !longe && !perto;
    } else {
      longe = shOk && sw < (phase === "run" ? dd.run : dd.min);
      perto = shOk && sw > dd.max;
      torsoOk = shOk && !longe && (phase === "run" || !perto);
    }
    if (torsoOk) {
      const want = hipOk ? "tronco" : "ombros";
      if (phase !== "run") {
        mode = want;
        modeSince = 0;
      } else if (want !== mode) {
        if (!modeSince) modeSince = now;
        if (now - modeSince > 500) {
          mode = want;
          modeSince = 0;
          counter.rebase();
        }
      } else modeSince = 0;
      lastSeen = now;
    }
    if (phase === "position") {
      if (calib) {
        okSince = 0;
        const dt = now - calib.t0;
        if (dt < 5e3) {
          const seg = Math.ceil((5e3 - dt) / 1e3);
          msg(`V\xE1 para a posi\xE7\xE3o em que o outro app funciona bem\u2026 ${seg}`);
          if (seg !== calibBeep) {
            calibBeep = seg;
            beep(660, 100);
          }
        } else if (dt < 6500) {
          msg("Fique parado\u2026");
          if (shOk) calib.s.push(sw);
        } else {
          if (calib.s.length >= 10) {
            salvarDistCustom(mediana(calib.s));
            msg("Pronto! Dist\xE2ncia salva.");
            beep(1100, 250);
            toast("Dist\xE2ncia salva. O app vai usar essa posi\xE7\xE3o.");
          } else msg("N\xE3o consegui ver voc\xEA. Fique de frente para a c\xE2mera e tente de novo.");
          calib = null;
          $("calibrar").hidden = false;
        }
      } else if (dicaAberta) {
        okSince = 0;
        msg("");
      } else if (torsoOk) {
        if (!okSince) okSince = now;
        msg("");
      } else {
        okSince = 0;
        msg(!lm ? "Procurando voc\xEA\u2026 fique de frente para a c\xE2mera" : semPes ? "Afaste-se at\xE9 aparecer o corpo todo, da cabe\xE7a aos p\xE9s" : longe && dd.corpo ? "Chegue um pouco mais perto: o corpo deve ocupar a maior parte da tela" : longe ? "Chegue mais perto: encha o contorno com cabe\xE7a e ombros" : perto ? "Afaste s\xF3 um pouquinho" : "Mostre a cabe\xE7a e os ombros para a c\xE2mera");
      }
      if (calib || dicaAberta) estado("oculto");
      else estado(torsoOk ? "pronto" : "fora");
      if (okSince && now - okSince > 800) {
        phase = "run";
        $("calibrar").hidden = true;
        $("stop").hidden = false;
        t0 = lastTick = lastSeen = now;
        beep(1100, 300);
        buzz(60);
        msg("");
        estado("start");
        setTimeout(() => {
          if (phase === "run" && !paused) estado("ok");
        }, 1300);
      }
    } else if (phase === "run") {
      const tracked = now - lastSeen < 1500;
      if (tracked) {
        if (paused) {
          paused = false;
          msg("");
          estado("ok");
        }
        active += (now - lastTick) / 1e3;
      } else if (!paused) {
        paused = true;
        estado("fora");
        msg("Pausado. Chegue mais perto e volte ao enquadramento.");
      }
      lastTick = now;
      let y = 0, scale = 0;
      if (torsoOk) {
        const sx = (lm[L.ls].x + lm[L.rs].x) / 2, sy = (lm[L.ls].y + lm[L.rs].y) / 2;
        if (mode === "tronco" && hipOk) {
          const hx = (lm[L.lh].x + lm[L.rh].x) / 2, hy = (lm[L.lh].y + lm[L.rh].y) / 2;
          y = (sy + hy) / 2;
          scale = Math.hypot((sx - hx) * vw, (sy - hy) * vh) / vh;
        } else if (mode === "ombros") {
          y = sy;
          scale = sw * 1.3;
        }
      }
      if (scale > 0) {
        const r = counter.update(y, scale, now);
        ultimoH = r.h;
        if (r.jumped) {
          W.tempos.push(now);
          ondas.push({ t0: now, sp: Array.from({ length: 10 }, (_, i) => ({ a: Math.PI * (0.08 + 0.84 * i / 9) + (Math.random() - 0.5) * 0.2, v: 0.6 + Math.random() * 0.8 })) });
          lastJumpAt = now;
          if (profile.ropeSound) somCorda(actx, counter.period);
          else beep(880, 45);
          buzz(12);
          if (counter.count % 50 === 0) {
            const pr = premio(counter.count);
            W.premios.push(pr.emoji);
            profile.premios = (profile.premios || 0) + 1;
            saveProfile();
            renderProfile();
            celebrate(counter.count, { actx: profile.sound ? actx : null, vibrate: profile.sound, premio: pr });
          }
          $("hCount").textContent = counter.count;
          $("hCount").classList.remove("pop");
          void $("hCount").offsetWidth;
          $("hCount").classList.add("pop");
        }
      }
      const k = kcal(active, profile.kg);
      $("hTime").textContent = mmss(active);
      $("hKcal").textContent = num(k, 1);
      $("hKcalBig").textContent = num(k, 1);
      const cf = comida(k), chave = cf ? cf.emoji + cf.n : "";
      if (chave !== ultimaComida) {
        ultimaComida = chave;
        $("hFood").textContent = cf ? `${cf.emoji} ${cf.texto}` : "Continue pulando\u2026";
        const f = $("hFood");
        f.classList.remove("pop");
        void f.offsetWidth;
        f.classList.add("pop");
      }
      const marco = Math.floor(k / 10);
      if (marco > ultimoMarco) {
        ultimoMarco = marco;
        kcalPop(`\u{1F525} ${marco * 10} kcal queimadas!`, cf ? cf.texto : "");
      }
      if (goal.type !== "free") {
        const frac = goal.type === "time" ? active / goal.v : goal.type === "kcal" ? k / goal.v : counter.count / goal.v;
        $("goalfill").style.width = Math.min(100, frac * 100) + "%";
        if (frac >= 1) {
          W.meta = true;
          W.end = { jumps: counter.count, secs: Math.round(active) };
          finish();
          ctx.restore();
          return;
        }
      }
      W.end = { jumps: counter.count, secs: Math.round(active) };
    }
    if (lm && torsoOk) {
      ctx.fillStyle = "rgba(232,194,49,.85)";
      for (const i of hipOk ? [L.ls, L.rs, L.lh, L.rh] : [L.ls, L.rs]) {
        const [x, y] = P(i);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 7);
        ctx.fill();
      }
      if (phase === "run") efeitoChao(P, lm, now, sw * vh * sc, ondas, ultimoH);
      if (profile.rope && phase !== "position") drawRope(P, lm, now, counter, lastJumpAt, sw * vh * sc);
    }
    ctx.restore();
  };
  loop();
}
function chaoDe(P, lm, swPx) {
  const pes = [L.la, L.ra].filter((i) => vis(lm, i) > 0.3).map((i) => P(i));
  if (pes.length) return { x: pes.reduce((a2, p) => a2 + p[0], 0) / pes.length, y: Math.max(...pes.map((p) => p[1])) + swPx * 0.12 };
  const a = P(L.ls), b2 = P(L.rs);
  return { x: (a[0] + b2[0]) / 2, y: (a[1] + b2[1]) / 2 + swPx * 3.6 };
}
function efeitoChao(P, lm, now, swPx, ondas, h) {
  const c = chaoDe(P, lm, swPx), alt = Math.min(0.6, Math.max(0, h) * 2.5), rx = swPx * 0.95 * (1 - alt * 0.5);
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,.38)";
  ctx.beginPath();
  ctx.ellipse(c.x, c.y, rx, rx * 0.22, 0, 0, 7);
  ctx.fill();
  ctx.strokeStyle = "rgba(232,194,49,.45)";
  ctx.lineWidth = 3;
  ctx.stroke();
  for (let i = ondas.length - 1; i >= 0; i--) {
    const o = ondas[i], a = (now - o.t0) / 700;
    if (a >= 1) {
      ondas.splice(i, 1);
      continue;
    }
    const r = swPx * 0.8 + a * swPx * 2.4;
    ctx.globalAlpha = 1 - a;
    ctx.shadowColor = "#d4511a";
    ctx.shadowBlur = 18;
    ctx.lineWidth = 2 + 7 * (1 - a);
    ctx.strokeStyle = "#e8c231";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, r, r * 0.24, 0, 0, 7);
    ctx.stroke();
    ctx.lineWidth = 2 + 4 * (1 - a);
    ctx.strokeStyle = "#d4511a";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, r * 0.65, r * 0.65 * 0.24, 0, 0, 7);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff3b0";
    for (const sp of o.sp) {
      const d = a * sp.v * swPx * 1.6;
      ctx.beginPath();
      ctx.arc(c.x + Math.cos(sp.a) * d * 1.6, c.y - Math.sin(sp.a) * d * 0.9 - a * swPx * 0.25, 4 * (1 - a) + 1, 0, 7);
      ctx.fill();
    }
  }
  ctx.restore();
}
function drawRope(P, lm, now, counter, lastJumpAt, swPx) {
  const [lsx, lsy] = P(L.ls), [rsx, rsy] = P(L.rs);
  const [lx, ly] = vis(lm, L.lw) > 0.3 ? P(L.lw) : [lsx + (lsx - rsx) * 0.35, lsy + swPx * 1.5];
  const [rx, ry] = vis(lm, L.rw) > 0.3 ? P(L.rw) : [rsx + (rsx - lsx) * 0.35, rsy + swPx * 1.5];
  const feet = [L.la, L.ra].filter((i) => vis(lm, i) > 0.3).map((i) => P(i)[1]);
  const hy = (ly + ry) / 2, nose = P(L.nose)[1];
  const feetY = feet.length ? Math.max(...feet) + 8 : hy + swPx * 2.6, headY = Math.min(nose - swPx * 0.6, hy - swPx * 2);
  const ativo = now - lastJumpAt < 1400;
  const nivel2 = ativo ? nivelCorda((now - counter.lastTake) / counter.period % 1) : -0.9;
  const alfa = ativo ? visivelCorda(nivel2) : 1;
  if (alfa > 0) {
    const alvo = nivel2 >= 0 ? hy + (headY - hy) * nivel2 : hy + (feetY - hy) * -nivel2;
    const dir = lx < rx ? 1 : -1, folga = Math.max(swPx * 0.7, Math.abs(rx - lx) * 0.55), cy = hy + (alvo - hy) * 1.33;
    const g = ctx.createLinearGradient(lx, 0, rx, 0);
    g.addColorStop(0, "#d4511a");
    g.addColorStop(0.5, "#e8c231");
    g.addColorStop(1, "#d4511a");
    ctx.save();
    ctx.globalAlpha = alfa;
    ctx.lineCap = "round";
    ctx.strokeStyle = g;
    ctx.lineWidth = 7;
    ctx.shadowColor = "#d4511a";
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.bezierCurveTo(lx - dir * folga, cy, rx + dir * folga, cy, rx, ry);
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = "#f5f0e8";
  for (const [x, y] of [[lx, ly], [rx, ry]]) {
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, 7);
    ctx.fill();
  }
}
function aplicarDist() {
  if (profile.dist === "custom" && !profile.distCustom) profile.dist = "medio";
  const d = distAtual(), tem = !!profile.distCustom;
  document.querySelectorAll("#distChips button").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.d === profile.dist));
    if (b.dataset.d === "custom") b.hidden = !tem;
  });
  $("dicaDist").innerHTML = d.corpo ? `D\xEA alguns passos para tr\xE1s, a <b>${d.txt}</b>, at\xE9 aparecer o <b>corpo todo, da cabe\xE7a aos p\xE9s</b>.` : profile.dist === "custom" ? "Fique na <b>mesma posi\xE7\xE3o que voc\xEA calibrou</b>." : `Fique a <b>${d.txt}</b> (${d.passos}).`;
  $("dicaTxt").textContent = profile.dist === "custom" ? "sua posi\xE7\xE3o" : d.txt;
  const oc = $("pDist").querySelector('option[value="custom"]');
  if (oc) oc.disabled = !tem;
  $("pDist").value = profile.dist;
}
function escolherDist(v) {
  if (!DIST[v] && !(v === "custom" && profile.distCustom)) return;
  profile.dist = v;
  saveProfile();
  aplicarDist();
}
document.querySelectorAll("#distChips button").forEach((b) => b.addEventListener("click", () => escolherDist(b.dataset.d)));
$("pDist").addEventListener("change", (e) => escolherDist(e.target.value));
function abrirDica(sim) {
  dicaAberta = !!sim;
  $("dica").hidden = !sim;
}
$("dicaOk").addEventListener("click", () => abrirDica(false));
$("calibrar").addEventListener("click", () => W.calibrar && W.calibrar());
$("ajuda").addEventListener("click", () => abrirDica(true));
var kcalPopT = 0;
function kcalPop(t1, t2, tent = 0) {
  if (!$("banner").hidden) {
    if (tent < 5) setTimeout(() => {
      if (W.running) kcalPop(t1, t2, tent + 1);
    }, 1200);
    return;
  }
  const el = $("kcalPop");
  $("kcalPopA").textContent = t1;
  $("kcalPopB").textContent = t2;
  el.hidden = false;
  el.classList.remove("show");
  void el.offsetWidth;
  el.classList.add("show");
  clearTimeout(kcalPopT);
  kcalPopT = setTimeout(() => {
    el.hidden = true;
  }, 3400);
}
function endWorkout(silent) {
  abrirDica(false);
  estado("oculto");
  $("kcalPop").hidden = true;
  W.running = false;
  cancelAnimationFrame(W.raf);
  if (W.stream) W.stream.getTracks().forEach((t) => t.stop());
  W.stream = null;
  video.srcObject = null;
  try {
    W.lock && W.lock.release();
  } catch {
  }
  W.lock = null;
  $("workout").hidden = true;
  $("cd").hidden = true;
}
function finish() {
  const e = W.end || { jumps: 0, secs: 0 };
  endWorkout();
  if (e.jumps < 1 || e.secs < 3) {
    toast("Treino muito curto, nada foi salvo.");
    return;
  }
  const k = kcal(e.secs, profile.kg), item = { t: Date.now(), jumps: e.jumps, secs: e.secs, kcal: +k.toFixed(1) };
  history.unshift(item);
  history = history.slice(0, 500);
  store.set("rj.hist", history);
  $("rJumps").textContent = num(e.jumps);
  $("rTime").textContent = mmss(e.secs);
  $("rKcal").textContent = num(k, 1);
  $("rPace").textContent = num(Math.round(e.jumps / e.secs * 60));
  const cf = comida(k);
  $("kcalRes").hidden = !cf;
  if (cf) {
    $("rEmoji").textContent = cf.emoji;
    $("rKcalTxt").textContent = `Voc\xEA queimou ${num(k, 1)} kcal`;
    $("rFood").textContent = cf.texto;
  }
  $("rPremios").textContent = W.premios && W.premios.length ? "Pr\xEAmios deste treino: " + W.premios.join(" ") : "";
  $("rMeta").hidden = !W.meta;
  const rt = ritmoDe(W.tempos || []);
  $("rRitmo").textContent = rt ? `Ritmo est\xE1vel: ${rt.estavel}% \xB7 cad\xEAncia m\xE9dia: ${rt.cadencia} saltos/min` : "";
  W.last = { ...item, comida: cf ? `${cf.emoji} ${cf.texto}` : "", premios: (W.premios || []).join(" "), ritmo: rt ? `Ritmo est\xE1vel ${rt.estavel}% \xB7 ${rt.cadencia} saltos/min` : "" };
  $("rRank").textContent = "";
  $("result").hidden = false;
  if (!token) {
    $("rRank").textContent = "Treino salvo neste celular. Crie uma conta para entrar no ranking.";
    renderHome();
    return;
  }
  pending.push({ t: item.t, jumps: e.jumps, secs: e.secs });
  store.set("rj.pending", pending);
  $("rRank").textContent = "Enviando\u2026";
  flush().then((d) => {
    $("rRank").textContent = d && d.posicao ? `Voc\xEA est\xE1 em ${d.posicao}\xBA no ranking da semana.` : d && d.ok ? "Treino salvo na sua conta." : pending.length ? "Sem conex\xE3o: o treino ser\xE1 enviado quando a internet voltar." : "";
  });
}
async function flush() {
  if (!token || !pending.length) return null;
  let last = null;
  for (const it of [...pending]) {
    try {
      const { ok, status, d } = await api("/api/score", { method: "POST", body: { jumps: it.jumps, secs: it.secs, t: it.t, pub: profile.rank } });
      if (ok) {
        last = d;
        pending = pending.filter((x) => x !== it);
      } else if (status >= 400 && status < 500 && status !== 401 && status !== 429) pending = pending.filter((x) => x !== it);
      else break;
    } catch {
      break;
    }
  }
  store.set("rj.pending", pending);
  return last;
}
$("start").addEventListener("click", startWorkout);
$("cancel").addEventListener("click", () => endWorkout());
$("stop").addEventListener("click", finish);
$("rClose").addEventListener("click", () => {
  $("result").hidden = true;
  show("home");
});
$("rShare").addEventListener("click", async () => {
  const it = W.last;
  if (!it) return;
  const text = `Fiz ${it.jumps} saltos em ${mmss(it.secs)} no Ronald Jump e queimei ${num(it.kcal, 1)} kcal. Venha saltar tamb\xE9m!`;
  try {
    const blob = await gerarCartao({ jumps: it.jumps, secs: it.secs, kcal: num(it.kcal, 1), comida: it.comida, premios: it.premios, ritmo: it.ritmo, site: location.host });
    const file = blob && new File([blob], "ronald-jump-treino.png", { type: "image/png" });
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: "Ronald Jump", text });
      return;
    }
    if (blob) {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "ronald-jump-treino.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 4e3);
      toast("Imagem salva. Poste nos seus Stories!");
      return;
    }
  } catch (e) {
    if (e && e.name === "AbortError") return;
  }
  try {
    if (navigator.share) await navigator.share({ title: "Ronald Jump", text, url: location.origin });
    else {
      await navigator.clipboard.writeText(text + " " + location.origin);
      toast("Texto copiado.");
    }
  } catch {
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden && W.running) finish();
});
var modo = "login";
function irParaEntrar() {
  try {
    location.replace("/entrar.html");
  } catch {
    abrirAuth();
  }
}
function abrirAuth() {
  $("auth").hidden = false;
  $("auth").className = modo === "login" ? "login" : "";
  $("aErr").textContent = "";
}
function modoAuth(m) {
  modo = m;
  $("auth").className = m === "login" ? "login" : "";
  document.querySelectorAll(".atab").forEach((b) => b.classList.toggle("on", b.dataset.m === m));
  $("aSubmit").textContent = m === "login" ? "Entrar" : "Criar conta";
  $("aPass").autocomplete = m === "login" ? "current-password" : "new-password";
  $("aErr").textContent = "";
}
document.querySelectorAll(".atab").forEach((b) => b.addEventListener("click", () => modoAuth(b.dataset.m)));
$("aCountry").innerHTML = Object.entries(PAISES).map(([c, n]) => `<option value="${c}">${flag(c)} ${n}</option>`).join("");
$("authForm").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const err = (t) => {
    $("aErr").textContent = t;
  };
  err("");
  const email = $("aEmail").value.trim(), password = $("aPass").value;
  if (!email || !password) return err("Preencha e-mail e senha.");
  const body = { email, password };
  if (modo === "reg") {
    Object.assign(body, { name: $("aName").value.trim(), country: $("aCountry").value, kg: +String($("aKg").value).replace(",", "."), consent: $("aConsent").checked });
    if (!body.name) return err("Escolha um nome para o ranking.");
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return err("A senha precisa ter 8 caracteres ou mais, com letras e n\xFAmeros.");
    if (!body.consent) return err("Confirme que tem 18 anos ou mais e aceite a Pol\xEDtica de Privacidade.");
  }
  $("aSubmit").disabled = true;
  try {
    const r = await api(modo === "reg" ? "/api/register" : "/api/login", { method: "POST", body });
    if (!r.ok) return err(r.d.erro || "N\xE3o foi poss\xEDvel continuar.");
    token = r.d.token;
    store.set("rj.token", token);
    $("aPass").value = "";
    await iniciar();
  } catch {
    err("Sem conex\xE3o. Tente de novo.");
  } finally {
    $("aSubmit").disabled = false;
  }
});
$("sChange").addEventListener("click", async () => {
  const r = await api("/api/password", { method: "POST", body: { senhaAtual: $("sOld").value, novaSenha: $("sNew").value } }).catch(() => null);
  if (r && r.ok) {
    $("sOld").value = "";
    $("sNew").value = "";
    toast("Senha alterada. Os outros aparelhos foram desconectados.");
  } else toast(r && r.d.erro || "N\xE3o foi poss\xEDvel alterar agora.");
});
$("sAll").addEventListener("click", async () => {
  try {
    await api("/api/logout-all", { method: "POST" });
  } catch {
  }
  sairLocal();
  toast("Voc\xEA saiu de todos os aparelhos.");
});
$("sExport").addEventListener("click", async () => {
  try {
    const r = await fetch(API + "/api/export", { headers: { Authorization: "Bearer " + token } });
    if (!r.ok) throw 0;
    const blob = await r.blob(), a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "meus-dados-ronald-jump.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4e3);
  } catch {
    toast("N\xE3o foi poss\xEDvel baixar seus dados agora.");
  }
});
$("logout").addEventListener("click", async () => {
  try {
    await api("/api/logout", { method: "POST" });
  } catch {
  }
  sairLocal();
});
$("delAcc").addEventListener("click", async () => {
  const pw = $("dPass").value;
  if (!pw) return toast("Digite sua senha para confirmar.");
  const r = await api("/api/account", { method: "DELETE", body: { password: pw } }).catch(() => null);
  if (r && r.ok) {
    $("dPass").value = "";
    sairLocal();
    toast("Conta exclu\xEDda.");
  } else toast(r && r.d.erro || "N\xE3o foi poss\xEDvel excluir agora.");
});
function aplicarUsuario(u) {
  user = u;
  store.set("rj.user", u);
  profile.name = u.name;
  profile.country = u.country;
  profile.kg = u.kg;
  saveProfile();
  $("pEmail").textContent = u.email;
  renderProfile();
  carregarMinhaFoto();
}
async function iniciar() {
  if (!token) {
    if (store.get("rj.guest", false)) {
      entrar();
      return;
    }
    return irParaEntrar();
  }
  let r = null;
  try {
    r = await api("/api/me");
  } catch {
  }
  if (!r) {
    if (user) {
      aplicarUsuario(user);
      entrar();
    } else irParaEntrar();
    return;
  }
  if (!r.ok) {
    if (r.status === 401) return irParaEntrar();
    toast("Servidor indispon\xEDvel agora. Tente de novo em instantes.");
    if (user) {
      aplicarUsuario(user);
      entrar();
    } else abrirAuth();
    return;
  }
  aplicarUsuario(r.d.user);
  const srv = r.d.workouts.map((w) => ({ t: w.t, jumps: w.jumps, secs: w.secs, kcal: +kcal(w.secs, r.d.user.kg).toFixed(1) }));
  const ts = new Set(srv.map((x) => x.t));
  history = [...pending.filter((p) => !ts.has(p.t)).map((p) => ({ t: p.t, jumps: p.jumps, secs: p.secs, kcal: +kcal(p.secs, profile.kg).toFixed(1) })), ...srv].sort((a, b) => b.t - a.t);
  store.set("rj.hist", history);
  entrar();
  flush();
}
function entrar() {
  $("auth").hidden = true;
  document.body.classList.toggle("convidado", !token);
  renderGoals();
  renderProfile();
  show("home");
  if (!profile.boas) abrirBoas();
}
var boasI = 0;
function abrirBoas() {
  boasI = 0;
  $("boas").hidden = false;
  mostrarBoas();
}
function mostrarBoas() {
  document.querySelectorAll("#boas .slide").forEach((el, i) => {
    el.hidden = i !== boasI;
  });
  document.querySelectorAll("#boas .pts i").forEach((el, i) => el.classList.toggle("on", i === boasI));
  $("boasNext").textContent = boasI === 2 ? "Come\xE7ar" : "Pr\xF3ximo";
}
$("boasNext").addEventListener("click", () => {
  if (boasI < 2) {
    boasI++;
    mostrarBoas();
  } else {
    $("boas").hidden = true;
    profile.boas = 1;
    saveProfile();
  }
});
$("boasPular").addEventListener("click", () => {
  $("boas").hidden = true;
  profile.boas = 1;
  saveProfile();
});
renderGoals();
renderProfile();
aplicarDist();
renderHome();
modoAuth("login");
iniciar();
window.__rjPronto = true;
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {
}));
