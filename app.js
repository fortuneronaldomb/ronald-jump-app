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
    this.glitch = 0;
    this.h = 0;
    this.low = 0;
    this.lg = 0;
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
  decolar(t, h) {
    this.state = "air";
    this.peak = h;
    this.low = h;
    if (this.lastTake > 0) this.period = Math.min(1500, Math.max(250, t - this.lastTake));
    this.lastTake = t;
  }
  update(y, scale, t) {
    let jumped = false;
    if (!(scale > 0)) return { jumped, count: this.count, state: this.state, h: this.h };
    if (this.ema === null) {
      this.ema = y;
      this.base = y;
    }
    if (this.pt !== null && t - this.pt > 800) {
      this.state = "ground";
      this.armed = true;
      this.v = 0;
      this.peak = 0;
      this.ema = y;
      this.base = y;
      this.pt = null;
      this.glitch = 0;
    }
    if (Math.abs(y - this.ema) > 0.7 * scale && this.glitch < 3) {
      this.glitch++;
      return { jumped, count: this.count, state: this.state, h: this.h };
    }
    this.glitch = 0;
    if (this.state === "air" && t - this.lastTake > 1500) {
      this.state = "ground";
      this.armed = false;
      this.peak = 0;
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
      if (!this.armed) {
        this.lg = Math.min(this.lg, h);
        if (h < this.up * 0.8 || h - this.lg > this.up * 0.6) this.armed = true;
      }
      if (this.armed) this.base += (this.ema > this.base ? 0.3 : 3e-3) * (this.ema - this.base);
      if (this.armed && h > this.up && this.v > 0.2 && t - this.lastTake > this.minGap) {
        this.decolar(t, h);
      }
    } else {
      if (h >= this.peak) {
        this.peak = h;
        this.low = h;
      } else this.low = Math.min(this.low, h);
      const pousou = h < Math.max(this.down, this.peak * 0.45);
      const subiuDeNovo = this.low < this.peak * 0.6 && h - this.low > this.peak * 0.5 && this.v > 0.2 && t - this.lastTake > this.minGap;
      if (pousou || subiuDeNovo) {
        this.state = "ground";
        this.lastLand = t;
        this.armed = false;
        this.lg = h;
        if (this.peak >= this.up) {
          this.count++;
          jumped = true;
        }
        if (subiuDeNovo && h > this.up) this.decolar(t, h);
      }
    }
    this.h = h;
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

// node_modules/qrcode-generator/dist/qrcode.mjs
var qrcode = function(typeNumber, errorCorrectionLevel) {
  const PAD0 = 236;
  const PAD1 = 17;
  let _typeNumber = typeNumber;
  const _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
  let _modules = null;
  let _moduleCount = 0;
  let _dataCache = null;
  const _dataList = [];
  const _this = {};
  const makeImpl = function(test, maskPattern) {
    _moduleCount = _typeNumber * 4 + 17;
    _modules = (function(moduleCount) {
      const modules = new Array(moduleCount);
      for (let row = 0; row < moduleCount; row += 1) {
        modules[row] = new Array(moduleCount);
        for (let col = 0; col < moduleCount; col += 1) {
          modules[row][col] = null;
        }
      }
      return modules;
    })(_moduleCount);
    setupPositionProbePattern(0, 0);
    setupPositionProbePattern(_moduleCount - 7, 0);
    setupPositionProbePattern(0, _moduleCount - 7);
    setupPositionAdjustPattern();
    setupTimingPattern();
    setupTypeInfo(test, maskPattern);
    if (_typeNumber >= 7) {
      setupTypeNumber(test);
    }
    if (_dataCache == null) {
      _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
    }
    mapData(_dataCache, maskPattern);
  };
  const setupPositionProbePattern = function(row, col) {
    for (let r = -1; r <= 7; r += 1) {
      if (row + r <= -1 || _moduleCount <= row + r) continue;
      for (let c = -1; c <= 7; c += 1) {
        if (col + c <= -1 || _moduleCount <= col + c) continue;
        if (0 <= r && r <= 6 && (c == 0 || c == 6) || 0 <= c && c <= 6 && (r == 0 || r == 6) || 2 <= r && r <= 4 && 2 <= c && c <= 4) {
          _modules[row + r][col + c] = true;
        } else {
          _modules[row + r][col + c] = false;
        }
      }
    }
  };
  const getBestMaskPattern = function() {
    let minLostPoint = 0;
    let pattern = 0;
    for (let i = 0; i < 8; i += 1) {
      makeImpl(true, i);
      const lostPoint = QRUtil.getLostPoint(_this);
      if (i == 0 || minLostPoint > lostPoint) {
        minLostPoint = lostPoint;
        pattern = i;
      }
    }
    return pattern;
  };
  const setupTimingPattern = function() {
    for (let r = 8; r < _moduleCount - 8; r += 1) {
      if (_modules[r][6] != null) {
        continue;
      }
      _modules[r][6] = r % 2 == 0;
    }
    for (let c = 8; c < _moduleCount - 8; c += 1) {
      if (_modules[6][c] != null) {
        continue;
      }
      _modules[6][c] = c % 2 == 0;
    }
  };
  const setupPositionAdjustPattern = function() {
    const pos = QRUtil.getPatternPosition(_typeNumber);
    for (let i = 0; i < pos.length; i += 1) {
      for (let j = 0; j < pos.length; j += 1) {
        const row = pos[i];
        const col = pos[j];
        if (_modules[row][col] != null) {
          continue;
        }
        for (let r = -2; r <= 2; r += 1) {
          for (let c = -2; c <= 2; c += 1) {
            if (r == -2 || r == 2 || c == -2 || c == 2 || r == 0 && c == 0) {
              _modules[row + r][col + c] = true;
            } else {
              _modules[row + r][col + c] = false;
            }
          }
        }
      }
    }
  };
  const setupTypeNumber = function(test) {
    const bits = QRUtil.getBCHTypeNumber(_typeNumber);
    for (let i = 0; i < 18; i += 1) {
      const mod = !test && (bits >> i & 1) == 1;
      _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
    }
    for (let i = 0; i < 18; i += 1) {
      const mod = !test && (bits >> i & 1) == 1;
      _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
    }
  };
  const setupTypeInfo = function(test, maskPattern) {
    const data = _errorCorrectionLevel << 3 | maskPattern;
    const bits = QRUtil.getBCHTypeInfo(data);
    for (let i = 0; i < 15; i += 1) {
      const mod = !test && (bits >> i & 1) == 1;
      if (i < 6) {
        _modules[i][8] = mod;
      } else if (i < 8) {
        _modules[i + 1][8] = mod;
      } else {
        _modules[_moduleCount - 15 + i][8] = mod;
      }
    }
    for (let i = 0; i < 15; i += 1) {
      const mod = !test && (bits >> i & 1) == 1;
      if (i < 8) {
        _modules[8][_moduleCount - i - 1] = mod;
      } else if (i < 9) {
        _modules[8][15 - i - 1 + 1] = mod;
      } else {
        _modules[8][15 - i - 1] = mod;
      }
    }
    _modules[_moduleCount - 8][8] = !test;
  };
  const mapData = function(data, maskPattern) {
    let inc = -1;
    let row = _moduleCount - 1;
    let bitIndex = 7;
    let byteIndex = 0;
    const maskFunc = QRUtil.getMaskFunction(maskPattern);
    for (let col = _moduleCount - 1; col > 0; col -= 2) {
      if (col == 6) col -= 1;
      while (true) {
        for (let c = 0; c < 2; c += 1) {
          if (_modules[row][col - c] == null) {
            let dark = false;
            if (byteIndex < data.length) {
              dark = (data[byteIndex] >>> bitIndex & 1) == 1;
            }
            const mask = maskFunc(row, col - c);
            if (mask) {
              dark = !dark;
            }
            _modules[row][col - c] = dark;
            bitIndex -= 1;
            if (bitIndex == -1) {
              byteIndex += 1;
              bitIndex = 7;
            }
          }
        }
        row += inc;
        if (row < 0 || _moduleCount <= row) {
          row -= inc;
          inc = -inc;
          break;
        }
      }
    }
  };
  const createBytes = function(buffer, rsBlocks) {
    let offset = 0;
    let maxDcCount = 0;
    let maxEcCount = 0;
    const dcdata = new Array(rsBlocks.length);
    const ecdata = new Array(rsBlocks.length);
    for (let r = 0; r < rsBlocks.length; r += 1) {
      const dcCount = rsBlocks[r].dataCount;
      const ecCount = rsBlocks[r].totalCount - dcCount;
      maxDcCount = Math.max(maxDcCount, dcCount);
      maxEcCount = Math.max(maxEcCount, ecCount);
      dcdata[r] = new Array(dcCount);
      for (let i = 0; i < dcdata[r].length; i += 1) {
        dcdata[r][i] = 255 & buffer.getBuffer()[i + offset];
      }
      offset += dcCount;
      const rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
      const rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);
      const modPoly = rawPoly.mod(rsPoly);
      ecdata[r] = new Array(rsPoly.getLength() - 1);
      for (let i = 0; i < ecdata[r].length; i += 1) {
        const modIndex = i + modPoly.getLength() - ecdata[r].length;
        ecdata[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0;
      }
    }
    let totalCodeCount = 0;
    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalCodeCount += rsBlocks[i].totalCount;
    }
    const data = new Array(totalCodeCount);
    let index = 0;
    for (let i = 0; i < maxDcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < dcdata[r].length) {
          data[index] = dcdata[r][i];
          index += 1;
        }
      }
    }
    for (let i = 0; i < maxEcCount; i += 1) {
      for (let r = 0; r < rsBlocks.length; r += 1) {
        if (i < ecdata[r].length) {
          data[index] = ecdata[r][i];
          index += 1;
        }
      }
    }
    return data;
  };
  const createData = function(typeNumber2, errorCorrectionLevel2, dataList) {
    const rsBlocks = QRRSBlock.getRSBlocks(typeNumber2, errorCorrectionLevel2);
    const buffer = qrBitBuffer();
    for (let i = 0; i < dataList.length; i += 1) {
      const data = dataList[i];
      buffer.put(data.getMode(), 4);
      buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber2));
      data.write(buffer);
    }
    let totalDataCount = 0;
    for (let i = 0; i < rsBlocks.length; i += 1) {
      totalDataCount += rsBlocks[i].dataCount;
    }
    if (buffer.getLengthInBits() > totalDataCount * 8) {
      throw "code length overflow. (" + buffer.getLengthInBits() + ">" + totalDataCount * 8 + ")";
    }
    if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
      buffer.put(0, 4);
    }
    while (buffer.getLengthInBits() % 8 != 0) {
      buffer.putBit(false);
    }
    while (true) {
      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }
      buffer.put(PAD0, 8);
      if (buffer.getLengthInBits() >= totalDataCount * 8) {
        break;
      }
      buffer.put(PAD1, 8);
    }
    return createBytes(buffer, rsBlocks);
  };
  _this.addData = function(data, mode) {
    mode = mode || "Byte";
    let newData = null;
    switch (mode) {
      case "Numeric":
        newData = qrNumber(data);
        break;
      case "Alphanumeric":
        newData = qrAlphaNum(data);
        break;
      case "Byte":
        newData = qr8BitByte(data);
        break;
      case "Kanji":
        newData = qrKanji(data);
        break;
      default:
        throw "mode:" + mode;
    }
    _dataList.push(newData);
    _dataCache = null;
  };
  _this.isDark = function(row, col) {
    if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
      throw row + "," + col;
    }
    return _modules[row][col];
  };
  _this.getModuleCount = function() {
    return _moduleCount;
  };
  _this.make = function() {
    if (_typeNumber < 1) {
      let typeNumber2 = 1;
      for (; typeNumber2 < 40; typeNumber2++) {
        const rsBlocks = QRRSBlock.getRSBlocks(typeNumber2, _errorCorrectionLevel);
        const buffer = qrBitBuffer();
        for (let i = 0; i < _dataList.length; i++) {
          const data = _dataList[i];
          buffer.put(data.getMode(), 4);
          buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber2));
          data.write(buffer);
        }
        let totalDataCount = 0;
        for (let i = 0; i < rsBlocks.length; i++) {
          totalDataCount += rsBlocks[i].dataCount;
        }
        if (buffer.getLengthInBits() <= totalDataCount * 8) {
          break;
        }
      }
      _typeNumber = typeNumber2;
    }
    makeImpl(false, getBestMaskPattern());
  };
  _this.createTableTag = function(cellSize, margin) {
    cellSize = cellSize || 2;
    margin = typeof margin == "undefined" ? cellSize * 4 : margin;
    let qrHtml = "";
    qrHtml += '<table style="';
    qrHtml += " border-width: 0px; border-style: none;";
    qrHtml += " border-collapse: collapse;";
    qrHtml += " padding: 0px; margin: " + margin + "px;";
    qrHtml += '">';
    qrHtml += "<tbody>";
    for (let r = 0; r < _this.getModuleCount(); r += 1) {
      qrHtml += "<tr>";
      for (let c = 0; c < _this.getModuleCount(); c += 1) {
        qrHtml += '<td style="';
        qrHtml += " border-width: 0px; border-style: none;";
        qrHtml += " border-collapse: collapse;";
        qrHtml += " padding: 0px; margin: 0px;";
        qrHtml += " width: " + cellSize + "px;";
        qrHtml += " height: " + cellSize + "px;";
        qrHtml += " background-color: ";
        qrHtml += _this.isDark(r, c) ? "#000000" : "#ffffff";
        qrHtml += ";";
        qrHtml += '"/>';
      }
      qrHtml += "</tr>";
    }
    qrHtml += "</tbody>";
    qrHtml += "</table>";
    return qrHtml;
  };
  _this.createSvgTag = function(cellSize, margin, alt, title) {
    let opts = {};
    if (typeof arguments[0] == "object") {
      opts = arguments[0];
      cellSize = opts.cellSize;
      margin = opts.margin;
      alt = opts.alt;
      title = opts.title;
    }
    cellSize = cellSize || 2;
    margin = typeof margin == "undefined" ? cellSize * 4 : margin;
    alt = typeof alt === "string" ? { text: alt } : alt || {};
    alt.text = alt.text || null;
    alt.id = alt.text ? alt.id || "qrcode-description" : null;
    title = typeof title === "string" ? { text: title } : title || {};
    title.text = title.text || null;
    title.id = title.text ? title.id || "qrcode-title" : null;
    const size2 = _this.getModuleCount() * cellSize + margin * 2;
    let c, mc, r, mr, qrSvg2 = "", rect;
    rect = "l" + cellSize + ",0 0," + cellSize + " -" + cellSize + ",0 0,-" + cellSize + "z ";
    qrSvg2 += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
    qrSvg2 += !opts.scalable ? ' width="' + size2 + 'px" height="' + size2 + 'px"' : "";
    qrSvg2 += ' viewBox="0 0 ' + size2 + " " + size2 + '" ';
    qrSvg2 += ' preserveAspectRatio="xMinYMin meet"';
    qrSvg2 += title.text || alt.text ? ' role="img" aria-labelledby="' + escapeXml([title.id, alt.id].join(" ").trim()) + '"' : "";
    qrSvg2 += ">";
    qrSvg2 += title.text ? '<title id="' + escapeXml(title.id) + '">' + escapeXml(title.text) + "</title>" : "";
    qrSvg2 += alt.text ? '<description id="' + escapeXml(alt.id) + '">' + escapeXml(alt.text) + "</description>" : "";
    qrSvg2 += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
    qrSvg2 += '<path d="';
    for (r = 0; r < _this.getModuleCount(); r += 1) {
      mr = r * cellSize + margin;
      for (c = 0; c < _this.getModuleCount(); c += 1) {
        if (_this.isDark(r, c)) {
          mc = c * cellSize + margin;
          qrSvg2 += "M" + mc + "," + mr + rect;
        }
      }
    }
    qrSvg2 += '" stroke="transparent" fill="black"/>';
    qrSvg2 += "</svg>";
    return qrSvg2;
  };
  _this.createDataURL = function(cellSize, margin) {
    cellSize = cellSize || 2;
    margin = typeof margin == "undefined" ? cellSize * 4 : margin;
    const size2 = _this.getModuleCount() * cellSize + margin * 2;
    const min = margin;
    const max = size2 - margin;
    return createDataURL(size2, size2, function(x, y) {
      if (min <= x && x < max && min <= y && y < max) {
        const c = Math.floor((x - min) / cellSize);
        const r = Math.floor((y - min) / cellSize);
        return _this.isDark(r, c) ? 0 : 1;
      } else {
        return 1;
      }
    });
  };
  _this.createImgTag = function(cellSize, margin, alt) {
    cellSize = cellSize || 2;
    margin = typeof margin == "undefined" ? cellSize * 4 : margin;
    const size2 = _this.getModuleCount() * cellSize + margin * 2;
    let img = "";
    img += "<img";
    img += ' src="';
    img += _this.createDataURL(cellSize, margin);
    img += '"';
    img += ' width="';
    img += size2;
    img += '"';
    img += ' height="';
    img += size2;
    img += '"';
    if (alt) {
      img += ' alt="';
      img += escapeXml(alt);
      img += '"';
    }
    img += "/>";
    return img;
  };
  const escapeXml = function(s) {
    let escaped = "";
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charAt(i);
      switch (c) {
        case "<":
          escaped += "&lt;";
          break;
        case ">":
          escaped += "&gt;";
          break;
        case "&":
          escaped += "&amp;";
          break;
        case '"':
          escaped += "&quot;";
          break;
        default:
          escaped += c;
          break;
      }
    }
    return escaped;
  };
  const _createHalfASCII = function(margin) {
    const cellSize = 1;
    margin = typeof margin == "undefined" ? cellSize * 2 : margin;
    const size2 = _this.getModuleCount() * cellSize + margin * 2;
    const min = margin;
    const max = size2 - margin;
    let y, x, r1, r2, p;
    const blocks = {
      "\u2588\u2588": "\u2588",
      "\u2588 ": "\u2580",
      " \u2588": "\u2584",
      "  ": " "
    };
    const blocksLastLineNoMargin = {
      "\u2588\u2588": "\u2580",
      "\u2588 ": "\u2580",
      " \u2588": " ",
      "  ": " "
    };
    let ascii = "";
    for (y = 0; y < size2; y += 2) {
      r1 = Math.floor((y - min) / cellSize);
      r2 = Math.floor((y + 1 - min) / cellSize);
      for (x = 0; x < size2; x += 1) {
        p = "\u2588";
        if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
          p = " ";
        }
        if (min <= x && x < max && min <= y + 1 && y + 1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
          p += " ";
        } else {
          p += "\u2588";
        }
        ascii += margin < 1 && y + 1 >= max ? blocksLastLineNoMargin[p] : blocks[p];
      }
      ascii += "\n";
    }
    if (size2 % 2 && margin > 0) {
      return ascii.substring(0, ascii.length - size2 - 1) + Array(size2 + 1).join("\u2580");
    }
    return ascii.substring(0, ascii.length - 1);
  };
  _this.createASCII = function(cellSize, margin) {
    cellSize = cellSize || 1;
    if (cellSize < 2) {
      return _createHalfASCII(margin);
    }
    cellSize -= 1;
    margin = typeof margin == "undefined" ? cellSize * 2 : margin;
    const size2 = _this.getModuleCount() * cellSize + margin * 2;
    const min = margin;
    const max = size2 - margin;
    let y, x, r, p;
    const white = Array(cellSize + 1).join("\u2588\u2588");
    const black = Array(cellSize + 1).join("  ");
    let ascii = "";
    let line = "";
    for (y = 0; y < size2; y += 1) {
      r = Math.floor((y - min) / cellSize);
      line = "";
      for (x = 0; x < size2; x += 1) {
        p = 1;
        if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
          p = 0;
        }
        line += p ? white : black;
      }
      for (r = 0; r < cellSize; r += 1) {
        ascii += line + "\n";
      }
    }
    return ascii.substring(0, ascii.length - 1);
  };
  _this.renderTo2dContext = function(context, cellSize) {
    cellSize = cellSize || 2;
    const length = _this.getModuleCount();
    for (let row = 0; row < length; row++) {
      for (let col = 0; col < length; col++) {
        context.fillStyle = _this.isDark(row, col) ? "black" : "white";
        context.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  };
  return _this;
};
qrcode.stringToBytes = function(s) {
  const bytes = [];
  for (let i = 0; i < s.length; i += 1) {
    const c = s.charCodeAt(i);
    bytes.push(c & 255);
  }
  return bytes;
};
qrcode.createStringToBytes = function(unicodeData, numChars) {
  const unicodeMap = (function() {
    const bin = base64DecodeInputStream(unicodeData);
    const read = function() {
      const b = bin.read();
      if (b == -1) throw "eof";
      return b;
    };
    let count = 0;
    const unicodeMap2 = {};
    while (true) {
      const b0 = bin.read();
      if (b0 == -1) break;
      const b1 = read();
      const b2 = read();
      const b3 = read();
      const k = String.fromCharCode(b0 << 8 | b1);
      const v = b2 << 8 | b3;
      unicodeMap2[k] = v;
      count += 1;
    }
    if (count != numChars) {
      throw count + " != " + numChars;
    }
    return unicodeMap2;
  })();
  const unknownChar = "?".charCodeAt(0);
  return function(s) {
    const bytes = [];
    for (let i = 0; i < s.length; i += 1) {
      const c = s.charCodeAt(i);
      if (c < 128) {
        bytes.push(c);
      } else {
        const b = unicodeMap[s.charAt(i)];
        if (typeof b == "number") {
          if ((b & 255) == b) {
            bytes.push(b);
          } else {
            bytes.push(b >>> 8);
            bytes.push(b & 255);
          }
        } else {
          bytes.push(unknownChar);
        }
      }
    }
    return bytes;
  };
};
var QRMode = {
  MODE_NUMBER: 1 << 0,
  MODE_ALPHA_NUM: 1 << 1,
  MODE_8BIT_BYTE: 1 << 2,
  MODE_KANJI: 1 << 3
};
var QRErrorCorrectionLevel = {
  L: 1,
  M: 0,
  Q: 3,
  H: 2
};
var QRMaskPattern = {
  PATTERN000: 0,
  PATTERN001: 1,
  PATTERN010: 2,
  PATTERN011: 3,
  PATTERN100: 4,
  PATTERN101: 5,
  PATTERN110: 6,
  PATTERN111: 7
};
var QRUtil = (function() {
  const PATTERN_POSITION_TABLE = [
    [],
    [6, 18],
    [6, 22],
    [6, 26],
    [6, 30],
    [6, 34],
    [6, 22, 38],
    [6, 24, 42],
    [6, 26, 46],
    [6, 28, 50],
    [6, 30, 54],
    [6, 32, 58],
    [6, 34, 62],
    [6, 26, 46, 66],
    [6, 26, 48, 70],
    [6, 26, 50, 74],
    [6, 30, 54, 78],
    [6, 30, 56, 82],
    [6, 30, 58, 86],
    [6, 34, 62, 90],
    [6, 28, 50, 72, 94],
    [6, 26, 50, 74, 98],
    [6, 30, 54, 78, 102],
    [6, 28, 54, 80, 106],
    [6, 32, 58, 84, 110],
    [6, 30, 58, 86, 114],
    [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122],
    [6, 30, 54, 78, 102, 126],
    [6, 26, 52, 78, 104, 130],
    [6, 30, 56, 82, 108, 134],
    [6, 34, 60, 86, 112, 138],
    [6, 30, 58, 86, 114, 142],
    [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150],
    [6, 24, 50, 76, 102, 128, 154],
    [6, 28, 54, 80, 106, 132, 158],
    [6, 32, 58, 84, 110, 136, 162],
    [6, 26, 54, 82, 110, 138, 166],
    [6, 30, 58, 86, 114, 142, 170]
  ];
  const G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
  const G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
  const G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
  const _this = {};
  const getBCHDigit = function(data) {
    let digit = 0;
    while (data != 0) {
      digit += 1;
      data >>>= 1;
    }
    return digit;
  };
  _this.getBCHTypeInfo = function(data) {
    let d = data << 10;
    while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
      d ^= G15 << getBCHDigit(d) - getBCHDigit(G15);
    }
    return (data << 10 | d) ^ G15_MASK;
  };
  _this.getBCHTypeNumber = function(data) {
    let d = data << 12;
    while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
      d ^= G18 << getBCHDigit(d) - getBCHDigit(G18);
    }
    return data << 12 | d;
  };
  _this.getPatternPosition = function(typeNumber) {
    return PATTERN_POSITION_TABLE[typeNumber - 1];
  };
  _this.getMaskFunction = function(maskPattern) {
    switch (maskPattern) {
      case QRMaskPattern.PATTERN000:
        return function(i, j) {
          return (i + j) % 2 == 0;
        };
      case QRMaskPattern.PATTERN001:
        return function(i, j) {
          return i % 2 == 0;
        };
      case QRMaskPattern.PATTERN010:
        return function(i, j) {
          return j % 3 == 0;
        };
      case QRMaskPattern.PATTERN011:
        return function(i, j) {
          return (i + j) % 3 == 0;
        };
      case QRMaskPattern.PATTERN100:
        return function(i, j) {
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 == 0;
        };
      case QRMaskPattern.PATTERN101:
        return function(i, j) {
          return i * j % 2 + i * j % 3 == 0;
        };
      case QRMaskPattern.PATTERN110:
        return function(i, j) {
          return (i * j % 2 + i * j % 3) % 2 == 0;
        };
      case QRMaskPattern.PATTERN111:
        return function(i, j) {
          return (i * j % 3 + (i + j) % 2) % 2 == 0;
        };
      default:
        throw "bad maskPattern:" + maskPattern;
    }
  };
  _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
    let a = qrPolynomial([1], 0);
    for (let i = 0; i < errorCorrectLength; i += 1) {
      a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0));
    }
    return a;
  };
  _this.getLengthInBits = function(mode, type) {
    if (1 <= type && type < 10) {
      switch (mode) {
        case QRMode.MODE_NUMBER:
          return 10;
        case QRMode.MODE_ALPHA_NUM:
          return 9;
        case QRMode.MODE_8BIT_BYTE:
          return 8;
        case QRMode.MODE_KANJI:
          return 8;
        default:
          throw "mode:" + mode;
      }
    } else if (type < 27) {
      switch (mode) {
        case QRMode.MODE_NUMBER:
          return 12;
        case QRMode.MODE_ALPHA_NUM:
          return 11;
        case QRMode.MODE_8BIT_BYTE:
          return 16;
        case QRMode.MODE_KANJI:
          return 10;
        default:
          throw "mode:" + mode;
      }
    } else if (type < 41) {
      switch (mode) {
        case QRMode.MODE_NUMBER:
          return 14;
        case QRMode.MODE_ALPHA_NUM:
          return 13;
        case QRMode.MODE_8BIT_BYTE:
          return 16;
        case QRMode.MODE_KANJI:
          return 12;
        default:
          throw "mode:" + mode;
      }
    } else {
      throw "type:" + type;
    }
  };
  _this.getLostPoint = function(qrcode2) {
    const moduleCount = qrcode2.getModuleCount();
    let lostPoint = 0;
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount; col += 1) {
        let sameCount = 0;
        const dark = qrcode2.isDark(row, col);
        for (let r = -1; r <= 1; r += 1) {
          if (row + r < 0 || moduleCount <= row + r) {
            continue;
          }
          for (let c = -1; c <= 1; c += 1) {
            if (col + c < 0 || moduleCount <= col + c) {
              continue;
            }
            if (r == 0 && c == 0) {
              continue;
            }
            if (dark == qrcode2.isDark(row + r, col + c)) {
              sameCount += 1;
            }
          }
        }
        if (sameCount > 5) {
          lostPoint += 3 + sameCount - 5;
        }
      }
    }
    ;
    for (let row = 0; row < moduleCount - 1; row += 1) {
      for (let col = 0; col < moduleCount - 1; col += 1) {
        let count = 0;
        if (qrcode2.isDark(row, col)) count += 1;
        if (qrcode2.isDark(row + 1, col)) count += 1;
        if (qrcode2.isDark(row, col + 1)) count += 1;
        if (qrcode2.isDark(row + 1, col + 1)) count += 1;
        if (count == 0 || count == 4) {
          lostPoint += 3;
        }
      }
    }
    for (let row = 0; row < moduleCount; row += 1) {
      for (let col = 0; col < moduleCount - 6; col += 1) {
        if (qrcode2.isDark(row, col) && !qrcode2.isDark(row, col + 1) && qrcode2.isDark(row, col + 2) && qrcode2.isDark(row, col + 3) && qrcode2.isDark(row, col + 4) && !qrcode2.isDark(row, col + 5) && qrcode2.isDark(row, col + 6)) {
          lostPoint += 40;
        }
      }
    }
    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount - 6; row += 1) {
        if (qrcode2.isDark(row, col) && !qrcode2.isDark(row + 1, col) && qrcode2.isDark(row + 2, col) && qrcode2.isDark(row + 3, col) && qrcode2.isDark(row + 4, col) && !qrcode2.isDark(row + 5, col) && qrcode2.isDark(row + 6, col)) {
          lostPoint += 40;
        }
      }
    }
    let darkCount = 0;
    for (let col = 0; col < moduleCount; col += 1) {
      for (let row = 0; row < moduleCount; row += 1) {
        if (qrcode2.isDark(row, col)) {
          darkCount += 1;
        }
      }
    }
    const ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
    lostPoint += ratio * 10;
    return lostPoint;
  };
  return _this;
})();
var QRMath = (function() {
  const EXP_TABLE = new Array(256);
  const LOG_TABLE = new Array(256);
  for (let i = 0; i < 8; i += 1) {
    EXP_TABLE[i] = 1 << i;
  }
  for (let i = 8; i < 256; i += 1) {
    EXP_TABLE[i] = EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
  }
  for (let i = 0; i < 255; i += 1) {
    LOG_TABLE[EXP_TABLE[i]] = i;
  }
  const _this = {};
  _this.glog = function(n) {
    if (n < 1) {
      throw "glog(" + n + ")";
    }
    return LOG_TABLE[n];
  };
  _this.gexp = function(n) {
    while (n < 0) {
      n += 255;
    }
    while (n >= 256) {
      n -= 255;
    }
    return EXP_TABLE[n];
  };
  return _this;
})();
var qrPolynomial = function(num2, shift) {
  if (typeof num2.length == "undefined") {
    throw num2.length + "/" + shift;
  }
  const _num = (function() {
    let offset = 0;
    while (offset < num2.length && num2[offset] == 0) {
      offset += 1;
    }
    const _num2 = new Array(num2.length - offset + shift);
    for (let i = 0; i < num2.length - offset; i += 1) {
      _num2[i] = num2[i + offset];
    }
    return _num2;
  })();
  const _this = {};
  _this.getAt = function(index) {
    return _num[index];
  };
  _this.getLength = function() {
    return _num.length;
  };
  _this.multiply = function(e) {
    const num3 = new Array(_this.getLength() + e.getLength() - 1);
    for (let i = 0; i < _this.getLength(); i += 1) {
      for (let j = 0; j < e.getLength(); j += 1) {
        num3[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i)) + QRMath.glog(e.getAt(j)));
      }
    }
    return qrPolynomial(num3, 0);
  };
  _this.mod = function(e) {
    if (_this.getLength() - e.getLength() < 0) {
      return _this;
    }
    const ratio = QRMath.glog(_this.getAt(0)) - QRMath.glog(e.getAt(0));
    const num3 = new Array(_this.getLength());
    for (let i = 0; i < _this.getLength(); i += 1) {
      num3[i] = _this.getAt(i);
    }
    for (let i = 0; i < e.getLength(); i += 1) {
      num3[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i)) + ratio);
    }
    return qrPolynomial(num3, 0).mod(e);
  };
  return _this;
};
var QRRSBlock = (function() {
  const RS_BLOCK_TABLE = [
    // L
    // M
    // Q
    // H
    // 1
    [1, 26, 19],
    [1, 26, 16],
    [1, 26, 13],
    [1, 26, 9],
    // 2
    [1, 44, 34],
    [1, 44, 28],
    [1, 44, 22],
    [1, 44, 16],
    // 3
    [1, 70, 55],
    [1, 70, 44],
    [2, 35, 17],
    [2, 35, 13],
    // 4
    [1, 100, 80],
    [2, 50, 32],
    [2, 50, 24],
    [4, 25, 9],
    // 5
    [1, 134, 108],
    [2, 67, 43],
    [2, 33, 15, 2, 34, 16],
    [2, 33, 11, 2, 34, 12],
    // 6
    [2, 86, 68],
    [4, 43, 27],
    [4, 43, 19],
    [4, 43, 15],
    // 7
    [2, 98, 78],
    [4, 49, 31],
    [2, 32, 14, 4, 33, 15],
    [4, 39, 13, 1, 40, 14],
    // 8
    [2, 121, 97],
    [2, 60, 38, 2, 61, 39],
    [4, 40, 18, 2, 41, 19],
    [4, 40, 14, 2, 41, 15],
    // 9
    [2, 146, 116],
    [3, 58, 36, 2, 59, 37],
    [4, 36, 16, 4, 37, 17],
    [4, 36, 12, 4, 37, 13],
    // 10
    [2, 86, 68, 2, 87, 69],
    [4, 69, 43, 1, 70, 44],
    [6, 43, 19, 2, 44, 20],
    [6, 43, 15, 2, 44, 16],
    // 11
    [4, 101, 81],
    [1, 80, 50, 4, 81, 51],
    [4, 50, 22, 4, 51, 23],
    [3, 36, 12, 8, 37, 13],
    // 12
    [2, 116, 92, 2, 117, 93],
    [6, 58, 36, 2, 59, 37],
    [4, 46, 20, 6, 47, 21],
    [7, 42, 14, 4, 43, 15],
    // 13
    [4, 133, 107],
    [8, 59, 37, 1, 60, 38],
    [8, 44, 20, 4, 45, 21],
    [12, 33, 11, 4, 34, 12],
    // 14
    [3, 145, 115, 1, 146, 116],
    [4, 64, 40, 5, 65, 41],
    [11, 36, 16, 5, 37, 17],
    [11, 36, 12, 5, 37, 13],
    // 15
    [5, 109, 87, 1, 110, 88],
    [5, 65, 41, 5, 66, 42],
    [5, 54, 24, 7, 55, 25],
    [11, 36, 12, 7, 37, 13],
    // 16
    [5, 122, 98, 1, 123, 99],
    [7, 73, 45, 3, 74, 46],
    [15, 43, 19, 2, 44, 20],
    [3, 45, 15, 13, 46, 16],
    // 17
    [1, 135, 107, 5, 136, 108],
    [10, 74, 46, 1, 75, 47],
    [1, 50, 22, 15, 51, 23],
    [2, 42, 14, 17, 43, 15],
    // 18
    [5, 150, 120, 1, 151, 121],
    [9, 69, 43, 4, 70, 44],
    [17, 50, 22, 1, 51, 23],
    [2, 42, 14, 19, 43, 15],
    // 19
    [3, 141, 113, 4, 142, 114],
    [3, 70, 44, 11, 71, 45],
    [17, 47, 21, 4, 48, 22],
    [9, 39, 13, 16, 40, 14],
    // 20
    [3, 135, 107, 5, 136, 108],
    [3, 67, 41, 13, 68, 42],
    [15, 54, 24, 5, 55, 25],
    [15, 43, 15, 10, 44, 16],
    // 21
    [4, 144, 116, 4, 145, 117],
    [17, 68, 42],
    [17, 50, 22, 6, 51, 23],
    [19, 46, 16, 6, 47, 17],
    // 22
    [2, 139, 111, 7, 140, 112],
    [17, 74, 46],
    [7, 54, 24, 16, 55, 25],
    [34, 37, 13],
    // 23
    [4, 151, 121, 5, 152, 122],
    [4, 75, 47, 14, 76, 48],
    [11, 54, 24, 14, 55, 25],
    [16, 45, 15, 14, 46, 16],
    // 24
    [6, 147, 117, 4, 148, 118],
    [6, 73, 45, 14, 74, 46],
    [11, 54, 24, 16, 55, 25],
    [30, 46, 16, 2, 47, 17],
    // 25
    [8, 132, 106, 4, 133, 107],
    [8, 75, 47, 13, 76, 48],
    [7, 54, 24, 22, 55, 25],
    [22, 45, 15, 13, 46, 16],
    // 26
    [10, 142, 114, 2, 143, 115],
    [19, 74, 46, 4, 75, 47],
    [28, 50, 22, 6, 51, 23],
    [33, 46, 16, 4, 47, 17],
    // 27
    [8, 152, 122, 4, 153, 123],
    [22, 73, 45, 3, 74, 46],
    [8, 53, 23, 26, 54, 24],
    [12, 45, 15, 28, 46, 16],
    // 28
    [3, 147, 117, 10, 148, 118],
    [3, 73, 45, 23, 74, 46],
    [4, 54, 24, 31, 55, 25],
    [11, 45, 15, 31, 46, 16],
    // 29
    [7, 146, 116, 7, 147, 117],
    [21, 73, 45, 7, 74, 46],
    [1, 53, 23, 37, 54, 24],
    [19, 45, 15, 26, 46, 16],
    // 30
    [5, 145, 115, 10, 146, 116],
    [19, 75, 47, 10, 76, 48],
    [15, 54, 24, 25, 55, 25],
    [23, 45, 15, 25, 46, 16],
    // 31
    [13, 145, 115, 3, 146, 116],
    [2, 74, 46, 29, 75, 47],
    [42, 54, 24, 1, 55, 25],
    [23, 45, 15, 28, 46, 16],
    // 32
    [17, 145, 115],
    [10, 74, 46, 23, 75, 47],
    [10, 54, 24, 35, 55, 25],
    [19, 45, 15, 35, 46, 16],
    // 33
    [17, 145, 115, 1, 146, 116],
    [14, 74, 46, 21, 75, 47],
    [29, 54, 24, 19, 55, 25],
    [11, 45, 15, 46, 46, 16],
    // 34
    [13, 145, 115, 6, 146, 116],
    [14, 74, 46, 23, 75, 47],
    [44, 54, 24, 7, 55, 25],
    [59, 46, 16, 1, 47, 17],
    // 35
    [12, 151, 121, 7, 152, 122],
    [12, 75, 47, 26, 76, 48],
    [39, 54, 24, 14, 55, 25],
    [22, 45, 15, 41, 46, 16],
    // 36
    [6, 151, 121, 14, 152, 122],
    [6, 75, 47, 34, 76, 48],
    [46, 54, 24, 10, 55, 25],
    [2, 45, 15, 64, 46, 16],
    // 37
    [17, 152, 122, 4, 153, 123],
    [29, 74, 46, 14, 75, 47],
    [49, 54, 24, 10, 55, 25],
    [24, 45, 15, 46, 46, 16],
    // 38
    [4, 152, 122, 18, 153, 123],
    [13, 74, 46, 32, 75, 47],
    [48, 54, 24, 14, 55, 25],
    [42, 45, 15, 32, 46, 16],
    // 39
    [20, 147, 117, 4, 148, 118],
    [40, 75, 47, 7, 76, 48],
    [43, 54, 24, 22, 55, 25],
    [10, 45, 15, 67, 46, 16],
    // 40
    [19, 148, 118, 6, 149, 119],
    [18, 75, 47, 31, 76, 48],
    [34, 54, 24, 34, 55, 25],
    [20, 45, 15, 61, 46, 16]
  ];
  const qrRSBlock = function(totalCount, dataCount) {
    const _this2 = {};
    _this2.totalCount = totalCount;
    _this2.dataCount = dataCount;
    return _this2;
  };
  const _this = {};
  const getRsBlockTable = function(typeNumber, errorCorrectionLevel) {
    switch (errorCorrectionLevel) {
      case QRErrorCorrectionLevel.L:
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectionLevel.M:
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectionLevel.Q:
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectionLevel.H:
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default:
        return void 0;
    }
  };
  _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {
    const rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);
    if (typeof rsBlock == "undefined") {
      throw "bad rs block @ typeNumber:" + typeNumber + "/errorCorrectionLevel:" + errorCorrectionLevel;
    }
    const length = rsBlock.length / 3;
    const list = [];
    for (let i = 0; i < length; i += 1) {
      const count = rsBlock[i * 3 + 0];
      const totalCount = rsBlock[i * 3 + 1];
      const dataCount = rsBlock[i * 3 + 2];
      for (let j = 0; j < count; j += 1) {
        list.push(qrRSBlock(totalCount, dataCount));
      }
    }
    return list;
  };
  return _this;
})();
var qrBitBuffer = function() {
  const _buffer = [];
  let _length = 0;
  const _this = {};
  _this.getBuffer = function() {
    return _buffer;
  };
  _this.getAt = function(index) {
    const bufIndex = Math.floor(index / 8);
    return (_buffer[bufIndex] >>> 7 - index % 8 & 1) == 1;
  };
  _this.put = function(num2, length) {
    for (let i = 0; i < length; i += 1) {
      _this.putBit((num2 >>> length - i - 1 & 1) == 1);
    }
  };
  _this.getLengthInBits = function() {
    return _length;
  };
  _this.putBit = function(bit) {
    const bufIndex = Math.floor(_length / 8);
    if (_buffer.length <= bufIndex) {
      _buffer.push(0);
    }
    if (bit) {
      _buffer[bufIndex] |= 128 >>> _length % 8;
    }
    _length += 1;
  };
  return _this;
};
var qrNumber = function(data) {
  const _mode = QRMode.MODE_NUMBER;
  const _data = data;
  const _this = {};
  _this.getMode = function() {
    return _mode;
  };
  _this.getLength = function(buffer) {
    return _data.length;
  };
  _this.write = function(buffer) {
    const data2 = _data;
    let i = 0;
    while (i + 2 < data2.length) {
      buffer.put(strToNum(data2.substring(i, i + 3)), 10);
      i += 3;
    }
    if (i < data2.length) {
      if (data2.length - i == 1) {
        buffer.put(strToNum(data2.substring(i, i + 1)), 4);
      } else if (data2.length - i == 2) {
        buffer.put(strToNum(data2.substring(i, i + 2)), 7);
      }
    }
  };
  const strToNum = function(s) {
    let num2 = 0;
    for (let i = 0; i < s.length; i += 1) {
      num2 = num2 * 10 + chatToNum(s.charAt(i));
    }
    return num2;
  };
  const chatToNum = function(c) {
    if ("0" <= c && c <= "9") {
      return c.charCodeAt(0) - "0".charCodeAt(0);
    }
    throw "illegal char :" + c;
  };
  return _this;
};
var qrAlphaNum = function(data) {
  const _mode = QRMode.MODE_ALPHA_NUM;
  const _data = data;
  const _this = {};
  _this.getMode = function() {
    return _mode;
  };
  _this.getLength = function(buffer) {
    return _data.length;
  };
  _this.write = function(buffer) {
    const s = _data;
    let i = 0;
    while (i + 1 < s.length) {
      buffer.put(
        getCode(s.charAt(i)) * 45 + getCode(s.charAt(i + 1)),
        11
      );
      i += 2;
    }
    if (i < s.length) {
      buffer.put(getCode(s.charAt(i)), 6);
    }
  };
  const getCode = function(c) {
    if ("0" <= c && c <= "9") {
      return c.charCodeAt(0) - "0".charCodeAt(0);
    } else if ("A" <= c && c <= "Z") {
      return c.charCodeAt(0) - "A".charCodeAt(0) + 10;
    } else {
      switch (c) {
        case " ":
          return 36;
        case "$":
          return 37;
        case "%":
          return 38;
        case "*":
          return 39;
        case "+":
          return 40;
        case "-":
          return 41;
        case ".":
          return 42;
        case "/":
          return 43;
        case ":":
          return 44;
        default:
          throw "illegal char :" + c;
      }
    }
  };
  return _this;
};
var qr8BitByte = function(data) {
  const _mode = QRMode.MODE_8BIT_BYTE;
  const _data = data;
  const _bytes = qrcode.stringToBytes(data);
  const _this = {};
  _this.getMode = function() {
    return _mode;
  };
  _this.getLength = function(buffer) {
    return _bytes.length;
  };
  _this.write = function(buffer) {
    for (let i = 0; i < _bytes.length; i += 1) {
      buffer.put(_bytes[i], 8);
    }
  };
  return _this;
};
var qrKanji = function(data) {
  const _mode = QRMode.MODE_KANJI;
  const _data = data;
  const stringToBytes2 = qrcode.stringToBytes;
  !(function(c, code) {
    const test = stringToBytes2(c);
    if (test.length != 2 || (test[0] << 8 | test[1]) != code) {
      throw "sjis not supported.";
    }
  })("\u53CB", 38726);
  const _bytes = stringToBytes2(data);
  const _this = {};
  _this.getMode = function() {
    return _mode;
  };
  _this.getLength = function(buffer) {
    return ~~(_bytes.length / 2);
  };
  _this.write = function(buffer) {
    const data2 = _bytes;
    let i = 0;
    while (i + 1 < data2.length) {
      let c = (255 & data2[i]) << 8 | 255 & data2[i + 1];
      if (33088 <= c && c <= 40956) {
        c -= 33088;
      } else if (57408 <= c && c <= 60351) {
        c -= 49472;
      } else {
        throw "illegal char at " + (i + 1) + "/" + c;
      }
      c = (c >>> 8 & 255) * 192 + (c & 255);
      buffer.put(c, 13);
      i += 2;
    }
    if (i < data2.length) {
      throw "illegal char at " + (i + 1);
    }
  };
  return _this;
};
var byteArrayOutputStream = function() {
  const _bytes = [];
  const _this = {};
  _this.writeByte = function(b) {
    _bytes.push(b & 255);
  };
  _this.writeShort = function(i) {
    _this.writeByte(i);
    _this.writeByte(i >>> 8);
  };
  _this.writeBytes = function(b, off, len) {
    off = off || 0;
    len = len || b.length;
    for (let i = 0; i < len; i += 1) {
      _this.writeByte(b[i + off]);
    }
  };
  _this.writeString = function(s) {
    for (let i = 0; i < s.length; i += 1) {
      _this.writeByte(s.charCodeAt(i));
    }
  };
  _this.toByteArray = function() {
    return _bytes;
  };
  _this.toString = function() {
    let s = "";
    s += "[";
    for (let i = 0; i < _bytes.length; i += 1) {
      if (i > 0) {
        s += ",";
      }
      s += _bytes[i];
    }
    s += "]";
    return s;
  };
  return _this;
};
var base64EncodeOutputStream = function() {
  let _buffer = 0;
  let _buflen = 0;
  let _length = 0;
  let _base64 = "";
  const _this = {};
  const writeEncoded = function(b) {
    _base64 += String.fromCharCode(encode(b & 63));
  };
  const encode = function(n) {
    if (n < 0) {
      throw "n:" + n;
    } else if (n < 26) {
      return 65 + n;
    } else if (n < 52) {
      return 97 + (n - 26);
    } else if (n < 62) {
      return 48 + (n - 52);
    } else if (n == 62) {
      return 43;
    } else if (n == 63) {
      return 47;
    } else {
      throw "n:" + n;
    }
  };
  _this.writeByte = function(n) {
    _buffer = _buffer << 8 | n & 255;
    _buflen += 8;
    _length += 1;
    while (_buflen >= 6) {
      writeEncoded(_buffer >>> _buflen - 6);
      _buflen -= 6;
    }
  };
  _this.flush = function() {
    if (_buflen > 0) {
      writeEncoded(_buffer << 6 - _buflen);
      _buffer = 0;
      _buflen = 0;
    }
    if (_length % 3 != 0) {
      const padlen = 3 - _length % 3;
      for (let i = 0; i < padlen; i += 1) {
        _base64 += "=";
      }
    }
  };
  _this.toString = function() {
    return _base64;
  };
  return _this;
};
var base64DecodeInputStream = function(str) {
  const _str = str;
  let _pos = 0;
  let _buffer = 0;
  let _buflen = 0;
  const _this = {};
  _this.read = function() {
    while (_buflen < 8) {
      if (_pos >= _str.length) {
        if (_buflen == 0) {
          return -1;
        }
        throw "unexpected end of file./" + _buflen;
      }
      const c = _str.charAt(_pos);
      _pos += 1;
      if (c == "=") {
        _buflen = 0;
        return -1;
      } else if (c.match(/^\s$/)) {
        continue;
      }
      _buffer = _buffer << 6 | decode(c.charCodeAt(0));
      _buflen += 6;
    }
    const n = _buffer >>> _buflen - 8 & 255;
    _buflen -= 8;
    return n;
  };
  const decode = function(c) {
    if (65 <= c && c <= 90) {
      return c - 65;
    } else if (97 <= c && c <= 122) {
      return c - 97 + 26;
    } else if (48 <= c && c <= 57) {
      return c - 48 + 52;
    } else if (c == 43) {
      return 62;
    } else if (c == 47) {
      return 63;
    } else {
      throw "c:" + c;
    }
  };
  return _this;
};
var gifImage = function(width, height) {
  const _width = width;
  const _height = height;
  const _data = new Array(width * height);
  const _this = {};
  _this.setPixel = function(x, y, pixel) {
    _data[y * _width + x] = pixel;
  };
  _this.write = function(out) {
    out.writeString("GIF87a");
    out.writeShort(_width);
    out.writeShort(_height);
    out.writeByte(128);
    out.writeByte(0);
    out.writeByte(0);
    out.writeByte(0);
    out.writeByte(0);
    out.writeByte(0);
    out.writeByte(255);
    out.writeByte(255);
    out.writeByte(255);
    out.writeString(",");
    out.writeShort(0);
    out.writeShort(0);
    out.writeShort(_width);
    out.writeShort(_height);
    out.writeByte(0);
    const lzwMinCodeSize = 2;
    const raster = getLZWRaster(lzwMinCodeSize);
    out.writeByte(lzwMinCodeSize);
    let offset = 0;
    while (raster.length - offset > 255) {
      out.writeByte(255);
      out.writeBytes(raster, offset, 255);
      offset += 255;
    }
    out.writeByte(raster.length - offset);
    out.writeBytes(raster, offset, raster.length - offset);
    out.writeByte(0);
    out.writeString(";");
  };
  const bitOutputStream = function(out) {
    const _out = out;
    let _bitLength = 0;
    let _bitBuffer = 0;
    const _this2 = {};
    _this2.write = function(data, length) {
      if (data >>> length != 0) {
        throw "length over";
      }
      while (_bitLength + length >= 8) {
        _out.writeByte(255 & (data << _bitLength | _bitBuffer));
        length -= 8 - _bitLength;
        data >>>= 8 - _bitLength;
        _bitBuffer = 0;
        _bitLength = 0;
      }
      _bitBuffer = data << _bitLength | _bitBuffer;
      _bitLength = _bitLength + length;
    };
    _this2.flush = function() {
      if (_bitLength > 0) {
        _out.writeByte(_bitBuffer);
      }
    };
    return _this2;
  };
  const getLZWRaster = function(lzwMinCodeSize) {
    const clearCode = 1 << lzwMinCodeSize;
    const endCode = (1 << lzwMinCodeSize) + 1;
    let bitLength = lzwMinCodeSize + 1;
    const table = lzwTable();
    for (let i = 0; i < clearCode; i += 1) {
      table.add(String.fromCharCode(i));
    }
    table.add(String.fromCharCode(clearCode));
    table.add(String.fromCharCode(endCode));
    const byteOut = byteArrayOutputStream();
    const bitOut = bitOutputStream(byteOut);
    bitOut.write(clearCode, bitLength);
    let dataIndex = 0;
    let s = String.fromCharCode(_data[dataIndex]);
    dataIndex += 1;
    while (dataIndex < _data.length) {
      const c = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;
      if (table.contains(s + c)) {
        s = s + c;
      } else {
        bitOut.write(table.indexOf(s), bitLength);
        if (table.size() < 4095) {
          if (table.size() == 1 << bitLength) {
            bitLength += 1;
          }
          table.add(s + c);
        }
        s = c;
      }
    }
    bitOut.write(table.indexOf(s), bitLength);
    bitOut.write(endCode, bitLength);
    bitOut.flush();
    return byteOut.toByteArray();
  };
  const lzwTable = function() {
    const _map = {};
    let _size = 0;
    const _this2 = {};
    _this2.add = function(key) {
      if (_this2.contains(key)) {
        throw "dup key:" + key;
      }
      _map[key] = _size;
      _size += 1;
    };
    _this2.size = function() {
      return _size;
    };
    _this2.indexOf = function(key) {
      return _map[key];
    };
    _this2.contains = function(key) {
      return typeof _map[key] != "undefined";
    };
    return _this2;
  };
  return _this;
};
var createDataURL = function(width, height, getPixel) {
  const gif = gifImage(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      gif.setPixel(x, y, getPixel(x, y));
    }
  }
  const b = byteArrayOutputStream();
  gif.write(b);
  const base64 = base64EncodeOutputStream();
  const bytes = b.toByteArray();
  for (let i = 0; i < bytes.length; i += 1) {
    base64.writeByte(bytes[i]);
  }
  base64.flush();
  return "data:image/gif;base64," + base64;
};
var qrcode_default = qrcode;
var stringToBytes = qrcode.stringToBytes;

// src/instalar.js
function detectar(ua = "", { standalone = false, maxTouch = 0, platform = "" } = {}) {
  const ios = /iphone|ipad|ipod/i.test(ua) || platform === "MacIntel" && maxTouch > 1;
  const android = /android/i.test(ua);
  const dentroDeApp = /Instagram|FBAN|FBAV|FB_IAB|Snapchat|TikTok|MicroMessenger|Line\//i.test(ua);
  const edge = /edg(?:e|a|ios)?\//i.test(ua), opera = /opr\/|opios/i.test(ua), firefox = /firefox|fxios/i.test(ua);
  const chrome = /chrome|crios|chromium/i.test(ua) && !edge && !opera && !firefox;
  const safari = /safari/i.test(ua) && !/chrome|crios|fxios|edgios|edg\/|opios|opr\/|android|gsa\//i.test(ua);
  return { ios, android, desktop: !ios && !android, movel: ios || android, dentroDeApp, edge, firefox, chrome, safari, standalone };
}
function guiaPara(inf, { pronto = false } = {}) {
  if (inf.standalone) return null;
  if (inf.dentroDeApp) return {
    tipo: "guia",
    titulo: "Abra no navegador",
    copiar: true,
    qr: false,
    passos: ["Toque em <b>\u22EF</b> (ou <b>\u22EE</b>) no canto da tela.", inf.ios ? "Escolha <b>Abrir no Safari</b>." : "Escolha <b>Abrir no Chrome</b> (ou <b>Abrir no navegador</b>).", "L\xE1, toque em <b>Transformar em app</b> de novo."]
  };
  if (pronto) return { tipo: "nativo", titulo: "Instalando\u2026", passos: [], copiar: false, qr: inf.desktop };
  if (inf.ios) return {
    tipo: "guia",
    titulo: inf.safari ? "Transformar em app (iPhone e iPad)" : "Transformar em app (iPhone e iPad)",
    compartilhar: true,
    copiar: !inf.safari,
    qr: false,
    passos: ["Na folha que abriu, role e toque em <b>Adicionar \xE0 Tela de In\xEDcio</b>.", "Confirme em <b>Adicionar</b>.", "Abra o <b>Ronald Jump</b> pelo \xEDcone e entre com a sua conta.", ...inf.safari ? [] : ["Se n\xE3o aparecer a op\xE7\xE3o, abra este link no <b>Safari</b>."]]
  };
  if (inf.android) return {
    tipo: "guia",
    titulo: "Transformar em app (Android)",
    copiar: false,
    qr: false,
    passos: ["Toque no menu <b>\u22EE</b> do navegador.", "Escolha <b>Instalar app</b> ou <b>Adicionar \xE0 tela inicial</b>.", "Abra o <b>Ronald Jump</b> pelo \xEDcone e entre com a sua conta."]
  };
  const passos = inf.chrome || inf.edge ? ["Na barra de endere\xE7o, clique no \xEDcone de <b>instalar</b> (um monitor com uma seta).", inf.edge ? "Ou abra o menu <b>\u22EF</b>, escolha <b>Aplicativos</b> e depois <b>Instalar este site como um aplicativo</b>." : "Ou abra o menu <b>\u22EE</b> e escolha <b>Instalar Ronald Jump</b>."] : inf.safari ? ["No menu <b>Arquivo</b>, escolha <b>Adicionar ao Dock</b>."] : ["Este navegador n\xE3o instala sites como app no computador. Use o <b>Chrome</b> ou o <b>Edge</b>, ou instale pelo celular (c\xF3digo ao lado)."];
  return { tipo: "guia", titulo: "Instalar no computador ou no celular", passos, copiar: true, qr: true };
}
function qrSvg(texto) {
  const q = qrcode_default(0, "M");
  q.addData(texto);
  q.make();
  const n = q.getModuleCount(), m = 4;
  let d = "";
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  const t = n + 2 * m;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${t} ${t}" shape-rendering="crispEdges" role="img" aria-label="C\xF3digo QR para abrir o Ronald Jump no celular"><rect width="${t}" height="${t}" fill="#fff"/><path d="${d}" fill="#000"/></svg>`;
}
var promptEvt = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    promptEvt = e;
    window.dispatchEvent(new Event("rj-instalavel"));
  });
  window.addEventListener("appinstalled", () => {
    promptEvt = null;
    window.dispatchEvent(new Event("rj-instalado"));
  });
}
var infoAtual = () => detectar(navigator.userAgent, {
  standalone: !!(window.matchMedia && matchMedia("(display-mode: standalone)").matches || navigator.standalone),
  maxTouch: navigator.maxTouchPoints || 0,
  platform: navigator.platform || ""
});
var jaInstalado = () => infoAtual().standalone;
async function instalarAgora(link) {
  const inf = infoAtual(), guia = guiaPara(inf, { pronto: !!promptEvt });
  if (!guia) return null;
  if (guia.tipo === "nativo") {
    try {
      promptEvt.prompt();
      await promptEvt.userChoice;
    } catch {
    }
    promptEvt = null;
    return guia.qr ? { ...guia, titulo: "Quer instalar tamb\xE9m no celular?", passos: ["Abra a c\xE2mera do celular e aponte para o c\xF3digo."], copiar: true } : { ...guia, feito: true };
  }
  if (guia.compartilhar && navigator.share) {
    try {
      navigator.share({ title: "Ronald Jump", text: "Instale o Ronald Jump", url: link }).catch(() => {
      });
    } catch {
    }
  }
  return guia;
}
function renderGuia(el, guia, link) {
  el.innerHTML = "";
  const h = document.createElement("h2");
  h.textContent = guia.titulo;
  el.appendChild(h);
  if (guia.passos.length) {
    const ol = document.createElement("ol");
    guia.passos.forEach((p) => {
      const li = document.createElement("li");
      li.innerHTML = p;
      ol.appendChild(li);
    });
    el.appendChild(ol);
  }
  if (guia.qr) {
    const w = document.createElement("div");
    w.className = "ig-qr";
    w.innerHTML = qrSvg(link);
    const s = document.createElement("small");
    s.textContent = "Aponte a c\xE2mera do celular para o c\xF3digo";
    w.appendChild(s);
    el.appendChild(w);
  }
  if (guia.copiar) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ig-copiar";
    b.textContent = "Copiar link";
    b.onclick = () => {
      const ok = () => {
        b.textContent = "Link copiado!";
      };
      try {
        navigator.clipboard.writeText(link).then(ok, () => prompt("Copie o link:", link));
      } catch {
        prompt("Copie o link:", link);
      }
    };
    el.appendChild(b);
  }
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
var VERSAO = 17;
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
var profile = Object.assign({ name: "", kg: 70, country: "BR", sound: true, rank: true, rope: true, ropeSound: true, premios: 0, metaDia: 300, boas: 0, dicas: 0, goal: "free", sens: "normal" }, store.get("rj.profile", {}));
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
    const opts = (d) => ({ baseOptions: { modelAssetPath: url, delegate: d }, runningMode: "VIDEO", numPoses: 1, minPoseDetectionConfidence: 0.4, minPosePresenceConfidence: 0.4, minTrackingConfidence: 0.4 });
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
var CORPO = { min: 0.55, max: 0.92, ombrosRun: 0.05 };
var VIS_POS = 0.5;
var VIS_RUN = 0.25;
var FOLGA_MS = 3e3;
var MANTER_POSE_MS = 800;
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
  const cfg = {
    pronto: ["ok", "\u25B6", "PODE COME\xC7AR", ""],
    start: ["ok", "\u25B6", "START!", ""],
    contando: ["ok", "\u25CF", "CONTANDO", "compacto"],
    fora: ["ruim", "\u2715", "FORA DA POSI\xC7\xC3O", ""],
    foraRun: ["ruim", "\u2715", "FORA DA \xC1REA \xB7 N\xC3O EST\xC1 CONTANDO", "longo"]
  }[tipo];
  b.className = cfg[0];
  $("sinalDot").className = "dot " + (cfg[0] === "ok" ? "v" : "r");
  el.hidden = false;
  el.className = "estado " + cfg[0] + (cfg[3] ? " " + cfg[3] : "");
  el.querySelector("i").textContent = cfg[1];
  el.querySelector("b").textContent = cfg[2];
}
var foraCueT = 0;
function cueArea(tipo) {
  const agora = performance.now();
  if (tipo === "fora") {
    if (agora - foraCueT < 800) return false;
    foraCueT = agora;
    if (profile.sound) {
      beep(220, 150, 0.16);
      setTimeout(() => beep(170, 220, 0.16), 190);
      buzz([90, 60, 90]);
    }
    return true;
  }
  if (profile.sound) beep(880, 90, 0.1);
  return true;
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
  let phase = "position", okSince = 0, ultimaComida = "", ultimoMarco = 0, boa = null, boaT = 0, swBoa = 0, semAreaDesde = 0, foraAvisado = false, startT = 0;
  cordaAnc = null;
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
    const run = phase === "run", visMin = run ? VIS_RUN : VIS_POS;
    const shOk = !!lm && [L.ls, L.rs].every((i) => vis(lm, i) > visMin);
    const hipOk = !!lm && [L.lh, L.rh].every((i) => vis(lm, i) > visMin);
    const sw = shOk ? Math.hypot((lm[L.ls].x - lm[L.rs].x) * vw, (lm[L.ls].y - lm[L.rs].y) * vh) / vh : 0;
    let longe = false, perto = false, torsoOk, semPes = false;
    if (run) torsoOk = shOk && sw > CORPO.ombrosRun && Math.min(lm[L.ls].x, lm[L.rs].x) > 0.03 && Math.max(lm[L.ls].x, lm[L.rs].x) < 0.97;
    else {
      const todos = !!lm && [0, L.ls, L.rs, L.lh, L.rh, L.la, L.ra].every((i) => vis(lm, i) > VIS_POS);
      const alt = todos ? (lm[L.la].y + lm[L.ra].y) / 2 - lm[0].y : 0;
      const dentro = todos && lm[0].y > 0.01 && Math.max(lm[L.la].y, lm[L.ra].y) < 0.985;
      longe = todos && alt < CORPO.min;
      perto = todos && (alt > CORPO.max || !dentro);
      semPes = shOk && !todos;
      torsoOk = todos && !longe && !perto;
    }
    if (torsoOk) {
      const want = hipOk ? "tronco" : "ombros";
      if (!run) {
        mode = want;
        modeSince = 0;
      } else if (want !== mode) {
        if (!modeSince) modeSince = now;
        if (now - modeSince > 1500) {
          mode = want;
          modeSince = 0;
          counter.rebase();
        }
      } else modeSince = 0;
      lastSeen = now;
      boa = lm;
      boaT = now;
      swBoa = sw;
    }
    const lmD = torsoOk ? lm : run && boa && now - boaT < MANTER_POSE_MS ? boa : null, swD = torsoOk ? sw : swBoa;
    const P = (i) => [ox + lmD[i].x * vw * sc, oy + lmD[i].y * vh * sc];
    if (phase === "position") {
      if (dicaAberta) {
        okSince = 0;
        msg("");
      } else if (torsoOk) {
        if (!okSince) okSince = now;
        msg("");
      } else {
        okSince = 0;
        msg(!lm ? "Procurando voc\xEA\u2026 fique de frente para a c\xE2mera" : semPes ? "Afaste-se at\xE9 aparecer o corpo todo, da cabe\xE7a aos p\xE9s" : longe ? "Chegue um pouco mais perto: o corpo deve ocupar a maior parte da tela" : perto ? "Afaste s\xF3 um pouquinho" : "Mostre o corpo todo, da cabe\xE7a aos p\xE9s");
      }
      if (dicaAberta) estado("oculto");
      else estado(torsoOk ? "pronto" : "fora");
      if (okSince && now - okSince > 800) {
        phase = "run";
        $("stop").hidden = false;
        t0 = lastTick = lastSeen = now;
        beep(1100, 300);
        buzz(60);
        msg("");
        estado("start");
        startT = now;
        semAreaDesde = 0;
        foraAvisado = false;
      }
    } else if (phase === "run") {
      const tracked = now - lastSeen < FOLGA_MS;
      if (tracked) {
        if (paused) {
          paused = false;
          msg("");
        }
        active += (now - lastTick) / 1e3;
      } else if (!paused) {
        paused = true;
        msg("Pausado: n\xE3o estou te vendo. Volte para o enquadramento.");
      }
      if (torsoOk) {
        semAreaDesde = 0;
        if (now - startT > 1300) estado("contando");
        if (foraAvisado) {
          foraAvisado = false;
          cueArea("volta");
        }
      } else {
        if (!semAreaDesde) semAreaDesde = now;
        if (now - semAreaDesde > 350) {
          estado("foraRun");
          if (!foraAvisado && cueArea("fora")) foraAvisado = true;
        }
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
    if (lmD) {
      ctx.fillStyle = "rgba(232,194,49,.85)";
      for (const i of hipOk && torsoOk ? [L.ls, L.rs, L.lh, L.rh] : [L.ls, L.rs]) {
        const [x, y] = P(i);
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 7);
        ctx.fill();
      }
      if (phase === "run") efeitoChao(P, lmD, now, swD * vh * sc, ondas, ultimoH);
      if (profile.rope && phase !== "position") drawRope(P, lmD, now, counter, lastJumpAt, swD * vh * sc, cw, ch);
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
var cordaAnc = null;
var suave = (ant, alvo, a) => ant === void 0 ? alvo : ant + (alvo - ant) * a;
function drawRope(P, lm, now, counter, lastJumpAt, swPx, cw, ch) {
  const [lsx, lsy] = P(L.ls), [rsx, rsy] = P(L.rs);
  const [lx0, ly0] = vis(lm, L.lw) > 0.25 ? P(L.lw) : [lsx + (lsx - rsx) * 0.35, lsy + swPx * 1.5];
  const [rx0, ry0] = vis(lm, L.rw) > 0.25 ? P(L.rw) : [rsx + (rsx - lsx) * 0.35, rsy + swPx * 1.5];
  const feet = [L.la, L.ra].filter((i) => vis(lm, i) > 0.25).map((i) => P(i)[1]);
  const nose = P(L.nose)[1];
  const feetY0 = feet.length ? Math.max(...feet) + 8 : (ly0 + ry0) / 2 + swPx * 2.6, headY0 = Math.min(nose - swPx * 0.6, (ly0 + ry0) / 2 - swPx * 2);
  const A = cordaAnc || (cordaAnc = {});
  A.lx = suave(A.lx, lx0, 0.45);
  A.ly = suave(A.ly, ly0, 0.45);
  A.rx = suave(A.rx, rx0, 0.45);
  A.ry = suave(A.ry, ry0, 0.45);
  A.fy = suave(A.fy, feetY0, 0.3);
  A.hy = suave(A.hy, headY0, 0.3);
  const hy = (A.ly + A.ry) / 2, topo = Math.max(30, A.hy), base = Math.min(ch - 30, A.fy);
  const ativo = now - lastJumpAt < 1400;
  const nivel2 = ativo ? nivelCorda((now - counter.lastTake) / counter.period % 1) : -0.9;
  const alfa = ativo ? visivelCorda(nivel2) : 1;
  if (alfa > 0) {
    const alvo = nivel2 >= 0 ? hy + (topo - hy) * nivel2 : hy + (base - hy) * -nivel2;
    const dx = Math.abs(A.rx - A.lx), dir = A.lx < A.rx ? 1 : -1;
    const larg = Math.max(swPx * 1.8, dx + swPx * 0.9), e = (larg - dx) / 2 * 2.6, cy = hy + (alvo - hy) * 1.33;
    const g = ctx.createLinearGradient(A.lx, 0, A.rx, 0);
    g.addColorStop(0, "#d4511a");
    g.addColorStop(0.5, "#e8c231");
    g.addColorStop(1, "#d4511a");
    const caminho = () => {
      ctx.beginPath();
      ctx.moveTo(A.lx, A.ly);
      ctx.bezierCurveTo(A.lx - dir * e, cy, A.rx + dir * e, cy, A.rx, A.ry);
    };
    ctx.save();
    ctx.lineCap = "round";
    ctx.globalAlpha = alfa * 0.35;
    ctx.strokeStyle = "#d4511a";
    ctx.lineWidth = 17;
    ctx.shadowColor = "#e8c231";
    ctx.shadowBlur = 26;
    caminho();
    ctx.stroke();
    ctx.globalAlpha = alfa;
    ctx.strokeStyle = g;
    ctx.lineWidth = 7;
    ctx.shadowBlur = 14;
    caminho();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "rgba(255,255,255,.8)";
    ctx.lineWidth = 2;
    caminho();
    ctx.stroke();
    ctx.restore();
  }
  ctx.save();
  ctx.lineCap = "round";
  for (const [x, y] of [[A.lx, A.ly], [A.rx, A.ry]]) {
    ctx.strokeStyle = "#1c1c1c";
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(x, y - 2);
    ctx.lineTo(x, y + 20);
    ctx.stroke();
    ctx.fillStyle = "#e8c231";
    ctx.beginPath();
    ctx.arc(x, y - 3, 8, 0, 7);
    ctx.fill();
  }
  ctx.restore();
}
function abrirDica(sim) {
  dicaAberta = !!sim;
  $("dica").hidden = !sim;
}
$("dicaOk").addEventListener("click", () => abrirDica(false));
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
async function sair() {
  if (!confirm("Sair da conta neste celular?")) return;
  try {
    await api("/api/logout", { method: "POST" });
  } catch {
  }
  sairLocal();
}
$("logout").addEventListener("click", sair);
$("logout2").addEventListener("click", sair);
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
  $("pNomeTopo").textContent = u.name;
  $("pEmailTopo").textContent = u.email;
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
renderHome();
modoAuth("login");
iniciar();
var LINK_APP = location.origin + "/";
function atualizarInstalacao() {
  const inst = jaInstalado(), fechadoEm = +store.get("rj.ctaAppFechado", 0), inf = infoAtual();
  $("instStatus").textContent = inst ? "\u2705 App instalado neste aparelho" : inf.desktop ? "No computador ou no celular (com c\xF3digo QR)" : "Tela cheia, direto da tela inicial";
  $("instBtn").hidden = inst;
  $("ctaApp").hidden = inst || Date.now() - fechadoEm < 7 * 864e5;
  $("ctaAppTxt").textContent = inf.desktop ? "Instale no computador ou escaneie o QR para usar no celular." : "Abre mais r\xE1pido e em tela cheia.";
}
async function abrirInstalar() {
  const g = await instalarAgora(LINK_APP);
  if (!g) return;
  if (g.feito) {
    toast("Instalando\u2026");
    return;
  }
  renderGuia($("instGuia"), g, LINK_APP);
  $("instSheet").hidden = false;
}
$("instBtn").addEventListener("click", abrirInstalar);
$("ctaAppBtn").addEventListener("click", abrirInstalar);
$("instFechar").addEventListener("click", () => {
  $("instSheet").hidden = true;
});
$("ctaAppX").addEventListener("click", () => {
  store.set("rj.ctaAppFechado", Date.now());
  $("ctaApp").hidden = true;
});
window.addEventListener("rj-instalado", () => {
  $("instSheet").hidden = true;
  atualizarInstalacao();
  toast("App instalado! Abra pelo \xEDcone.");
});
atualizarInstalacao();
var versaoNova = 0;
var novidades = [];
function mostrarAtualizacao(estadoAtu) {
  const tem = estadoAtu === "nova";
  $("versaoApp").textContent = "Vers\xE3o " + VERSAO;
  $("avisoAtu").hidden = !tem;
  $("atuStatus").textContent = tem ? `H\xE1 uma vers\xE3o nova (${versaoNova}). Voc\xEA continua logado.` : estadoAtu === "erro" ? "Sem internet: n\xE3o consegui verificar." : estadoAtu === "verificando" ? "Verificando\u2026" : "\u2705 Voc\xEA est\xE1 na \xFAltima vers\xE3o.";
  $("btnAtualizar").textContent = tem ? "Atualizar agora" : "Verificar atualiza\xE7\xE3o";
  const ul = $("atuNovidades");
  ul.innerHTML = "";
  ul.hidden = !(tem && novidades.length);
  if (tem) for (const n of novidades) {
    const li = document.createElement("li");
    li.textContent = n;
    ul.appendChild(li);
  }
}
async function verificarAtualizacao() {
  try {
    const r = await fetch(API + "/api/health", { cache: "no-store" });
    const h = await r.json(), sv = +h.versao || 0;
    if (sv > VERSAO) {
      versaoNova = sv;
      novidades = Array.isArray(h.novidades) ? h.novidades.slice(0, 6).map((x) => String(x).slice(0, 120)) : [];
      mostrarAtualizacao("nova");
      return "nova";
    }
    versaoNova = 0;
    novidades = [];
    mostrarAtualizacao("ok");
    return "ok";
  } catch {
    mostrarAtualizacao("erro");
    return "erro";
  }
}
async function atualizarApp() {
  if (W.running) return toast("Termine o treino antes de atualizar.");
  toast("Atualizando\u2026");
  try {
    for (const reg of await navigator.serviceWorker?.getRegistrations?.() || []) await reg.unregister();
  } catch {
  }
  try {
    for (const k of await caches.keys()) await caches.delete(k);
  } catch {
  }
  location.reload();
}
$("btnAtualizar").addEventListener("click", async () => {
  if (versaoNova) return atualizarApp();
  mostrarAtualizacao("verificando");
  const r = await verificarAtualizacao();
  if (r === "ok") toast("Voc\xEA j\xE1 est\xE1 na \xFAltima vers\xE3o.");
});
$("avisoAtuBtn").addEventListener("click", atualizarApp);
mostrarAtualizacao("verificando");
verificarAtualizacao();
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && !W.running) verificarAtualizacao();
});
setInterval(() => {
  if (!document.hidden && !W.running) verificarAtualizacao();
}, 10 * 60 * 1e3);
window.__rjPronto = true;
if ("serviceWorker" in navigator) addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {
}));
