import { JumpCounter, kcal, equivalente } from '../public/jump-counter.js';
import assert from 'node:assert/strict';
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5;
function sim({ hz, amp, secs, noise = 0.01, sway = 0 }) {
  const c = new JumpCounter(); const scale = 0.25; let n = 0;
  for (let i = 0; i < secs * 30; i++) {
    const t = i * (1000 / 30), s = t / 1000;
    const jump = hz ? Math.abs(Math.sin(Math.PI * hz * s)) * amp * scale : 0;
    const y = 0.5 - jump + sway * Math.sin(s * 0.7) * scale + rnd() * noise * scale;
    c.update(y, scale, t);
  }
  return c.count;
}
const cases = [
  ['parado com ruído', { hz: 0, amp: 0, secs: 30 }, 0, 0],
  ['balanço lento sem pular', { hz: 0, amp: 0, secs: 30, sway: 0.08 }, 0, 0],
  ['2 saltos/s, 20s', { hz: 2, amp: 0.15, secs: 20 }, 40, 2],
  ['micro-saltos 2,5/s, 20s', { hz: 2.5, amp: 0.10, secs: 20 }, 50, 3],
  ['1 salto/s, 30s', { hz: 1, amp: 0.25, secs: 30 }, 30, 2],
  ['3 saltos/s, 20s', { hz: 3, amp: 0.12, secs: 20 }, 60, 5],
];
for (const [nome, cfg, esperado, tol] of cases) {
  const got = sim(cfg);
  console.log(`${got >= esperado - tol && got <= esperado + tol ? 'OK  ' : 'FALHA'} ${nome}: esperado ${esperado}, contou ${got}`);
  assert.ok(Math.abs(got - esperado) <= tol, nome);
}
assert.equal(Math.round(kcal(600, 70)), 117);
console.log('kcal 10min/70kg =', Math.round(kcal(600, 70)), '|', equivalente(117));
console.log('Todos os testes passaram.');
