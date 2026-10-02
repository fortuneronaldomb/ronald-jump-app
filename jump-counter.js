// Contador de saltos: recebe a posição vertical do tronco (y cresce para baixo)
// e o tamanho do tronco (para funcionar em qualquer distância da câmera).
export class JumpCounter {
  constructor({ up = 0.05, down = 0.02, minGap = 230 } = {}) {
    this.up = up; this.down = down; this.minGap = minGap; this.reset();
  }
  reset() {
    this.ema = null; this.base = null; this.state = 'ground';
    this.count = 0; this.peak = 0; this.armed = true; this.v = 0; this.pt = null; this.lastTake = -1e9; this.lastLand = 0; this.period = 600;
  }
  update(y, scale, t) {
    let jumped = false;
    if (!(scale > 0)) return { jumped, count: this.count, state: this.state, h: 0 };
    if (this.ema === null) { this.ema = y; this.base = y; }
    const prev = this.ema;
    this.ema += 0.6 * (y - this.ema);
    if (this.pt !== null && t > this.pt) {
      const vel = ((prev - this.ema) / scale) / ((t - this.pt) / 1000); // + = subindo (troncos/s)
      this.v = 0.5 * this.v + 0.5 * vel;
    }
    this.pt = t;
    const h = (this.base - this.ema) / scale; // deslocamento para cima, em "troncos"
    if (this.state === 'ground') {
      if (!this.armed && h < this.up * 0.8) this.armed = true;
      if (this.armed) this.base += (this.ema > this.base ? 0.3 : 0.003) * (this.ema - this.base); // base segue o ponto mais baixo do corpo (chão); y maior = mais baixo na tela
      if (this.armed && h > this.up && this.v > 0.2 && t - this.lastTake > this.minGap) {
        this.state = 'air'; this.peak = h;
        if (this.lastTake > 0) this.period = Math.min(1500, Math.max(250, t - this.lastTake));
        this.lastTake = t;
      }
    } else {
      this.peak = Math.max(this.peak, h);
      if (h < Math.max(this.down, this.peak * 0.45)) {
        this.state = 'ground'; this.lastLand = t; this.armed = false;
        if (this.peak >= this.up) { this.count++; jumped = true; }
      }
    }
    return { jumped, count: this.count, state: this.state, h };
  }
}
export const MET_PULO = 10; // gasto energético moderado de salto (estimativa)
export const kcal = (seg, kg) => MET_PULO * kg * (seg / 3600);
export const COMIDAS = [
  { n: 'brigadeiro', k: 70 }, { n: 'pão de queijo', k: 90 }, { n: 'lata de refrigerante', k: 140 },
  { n: 'coxinha', k: 250 }, { n: 'fatia de pizza', k: 270 }, { n: 'hambúrguer', k: 500 }
];
export function equivalente(k) {
  if (k < 35) return 'quase um brigadeiro';
  let c = COMIDAS[0];
  for (const f of COMIDAS) if (k >= f.k * 0.8) c = f;
  const q = k / c.k;
  const txt = q < 1.5 ? 'cerca de 1' : 'cerca de ' + Math.round(q);
  const pl = q < 1.5 ? c.n : (c.n === 'pão de queijo' ? 'pães de queijo' : c.n === 'lata de refrigerante' ? 'latas de refrigerante' : c.n === 'fatia de pizza' ? 'fatias de pizza' : c.n + 's');
  return `${txt} ${pl}`;
}
