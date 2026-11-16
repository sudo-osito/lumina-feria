/* Planta Neisstech · piso v4 (8-nov-2026). Red de calles de la referencia (bordes amarillos, cortados en los cruces),
   líneas blancas del circuito AGV, cebras, sendero punteado y demarcación de cada bloque.
   «después» = piso epóxico gris + demarcación total · «antes» = hormigón con restos de pintura gastada. */
import * as P from './mapa.js';

const AM = '#F2C200', AZ = '#1E6FE0', BL = '#FFFFFF', VE = '#1FA45A', NE = '#2B2F36';

export function pintarPiso(ppm, antes, sel = new Set(['senderos', 'calles', 'ubic'])) {
  let on = true; const zona = (n) => (on = sel.has(n));   // capas del piso: senderos · calles (pasillos y zonas) · ubic (ubicaciones)
  const { NAVE } = P;
  const W = Math.round((NAVE.x1 - NAVE.x0) * ppm), H = Math.round((NAVE.z1 - NAVE.z0) * ppm);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  if (!antes && sel.has('senderos')) { x.fillStyle = '#5B6068'; x.fillRect(0, 0, W, H); }
  const X = (v) => (v - NAVE.x0) * ppm, Y = (v) => (v - NAVE.z0) * ppm, S = (v) => v * ppm;
  let sem = antes ? 11 : 3; const azar = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
  const linea = (x0, z0, x1, z1, an, col, guion) => {if (!on) return; 
    x.strokeStyle = col; x.lineWidth = S(an); x.setLineDash(guion ? guion.map(S) : []);
    if (antes) { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / .6)); x.setLineDash([]); for (let i = 0; i < n; i++) { if (azar() < .55) continue; x.globalAlpha = .2 + azar() * .35; const a = i / n, b = Math.min(1, (i + .3 + azar() * .7) / n); x.beginPath(); x.moveTo(X(x0 + (x1 - x0) * a), Y(z0 + (z1 - z0) * a)); x.lineTo(X(x0 + (x1 - x0) * b), Y(z0 + (z1 - z0) * b)); x.stroke(); } x.globalAlpha = 1; return; }
    x.beginPath(); x.moveTo(X(x0), Y(z0)); x.lineTo(X(x1), Y(z1)); x.stroke(); x.setLineDash([]);
  };
  const rect = (x0, z0, x1, z1, an, col, g) => { linea(x0, z0, x1, z0, an, col, g); linea(x1, z0, x1, z1, an, col, g); linea(x1, z1, x0, z1, an, col, g); linea(x0, z1, x0, z0, an, col, g); };
  const relleno = (x0, z0, x1, z1, col, a = 1) => { if (!on) return; if (antes) return; x.globalAlpha = a; x.fillStyle = col; x.fillRect(X(x0), Y(z0), S(x1 - x0), S(z1 - z0)); x.globalAlpha = 1; };
  const rayado = (x0, z0, x1, z1, c1 = AM, c2 = NE, paso = .28) => { if (!on) return; if (antes) return; x.save(); x.beginPath(); x.rect(X(x0), Y(z0), S(x1 - x0), S(z1 - z0)); x.clip(); x.fillStyle = c1; x.fillRect(X(x0), Y(z0), S(x1 - x0), S(z1 - z0)); x.fillStyle = c2; const w = S(x1 - x0), h = S(z1 - z0), p = S(paso); for (let i = -h; i < w + h; i += p * 2) { x.beginPath(); x.moveTo(X(x0) + i, Y(z0)); x.lineTo(X(x0) + i + p, Y(z0)); x.lineTo(X(x0) + i + p - h, Y(z1)); x.lineTo(X(x0) + i - h, Y(z1)); x.closePath(); x.fill(); } x.restore(); };
  const marco = (x0, z0, x1, z1, g = .16) => { rayado(x0, z0, x1, z0 + g); rayado(x0, z1 - g, x1, z1); rayado(x0, z0, x0 + g, z1); rayado(x1 - g, z0, x1, z1); };
  const esq = (cx, cz, w, d, col = AZ, l = .26, g = .07) => { if (!sel.has('ubic')) return; const on0 = on; on = true; try { if (antes) return; for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const px = cx + sx * w / 2, pz = cz + sz * d / 2; linea(px, pz, px - sx * l, pz, g, col); linea(px, pz, px, pz - sz * l, g, col); } } finally { on = on0; } };
  const texto = (t, cx, cz, alto, col = BL, rot = 0, peso = 800) => { if (!on) return; if (antes) return; x.save(); x.translate(X(cx), Y(cz)); x.rotate(rot); x.fillStyle = col; x.font = `${peso} ${S(alto)}px Poppins, Arial, sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, 0, 0); x.restore(); };
  const cebra = (x0, z0, x1, z1, rayasA) => { if (!on) return; if (antes) x.globalAlpha = .15; x.fillStyle = BL; if (rayasA === 'x') { for (let z = z0; z < z1 - .2; z += .9) x.fillRect(X(x0), Y(z), S(x1 - x0), S(.45)); } else { for (let xx = x0; xx < x1 - .2; xx += .9) x.fillRect(X(xx), Y(z0), S(.45), S(z1 - z0)); } x.globalAlpha = 1; };
  const flecha = (cx, cz, ang, L = 1.2, col = BL) => { if (!on) return; if (antes) return; x.save(); x.translate(X(cx), Y(cz)); x.rotate(ang); x.fillStyle = col; const l = S(L), a = S(L * .22); x.beginPath(); x.moveTo(-l / 2, -a / 2); x.lineTo(l * .12, -a / 2); x.lineTo(l * .12, -a * 1.3); x.lineTo(l / 2, 0); x.lineTo(l * .12, a * 1.3); x.lineTo(l * .12, a / 2); x.lineTo(-l / 2, a / 2); x.closePath(); x.fill(); x.restore(); };
  const peaton = (cx, cz, r = .32, fondo = AZ) => { if (!on) return; if (antes) return; x.save(); x.translate(X(cx), Y(cz)); const R = S(r); x.fillStyle = fondo; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill(); x.strokeStyle = BL; x.fillStyle = BL; x.lineWidth = R * .16; x.lineCap = 'round'; x.beginPath(); x.arc(R * .05, -R * .5, R * .14, 0, 7); x.fill(); x.beginPath(); x.moveTo(0, -R * .3); x.lineTo(-R * .08, R * .12); x.lineTo(-R * .32, R * .55); x.moveTo(-R * .08, R * .12); x.lineTo(R * .22, R * .5); x.moveTo(-R * .3, -R * .05); x.lineTo(0, -R * .25); x.lineTo(R * .3, -R * .02); x.stroke(); x.restore(); };

  zona('calles');
  /* ── calles: bordes amarillos en los lados largos, cortados donde entra otra calle, junto a muros no ── */
  const calles = P.CALLES, M = .02;
  const cortes = (cal, lado, hor) => { const out = [];
    for (const o of calles) { if (o === cal) continue;
      if (hor && lado > o.z0 - M && lado < o.z1 + M) out.push([Math.max(cal.x0, o.x0), Math.min(cal.x1, o.x1)]);
      if (!hor && lado > o.x0 - M && lado < o.x1 + M) out.push([Math.max(cal.z0, o.z0), Math.min(cal.z1, o.z1)]); }
    return out.filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]); };
  for (const cal of calles) {
    const hor = cal.x1 - cal.x0 > cal.z1 - cal.z0;
    for (const lado of hor ? [cal.z0, cal.z1] : [cal.x0, cal.x1]) {
      if ((!hor && (Math.abs(lado - P.W1.x) < .2 || Math.abs(lado - NAVE.x0) < .2 || Math.abs(lado - NAVE.x1) < .2)) || (hor && (Math.abs(lado - NAVE.z0) < .2 || Math.abs(lado - NAVE.z1) < .2))) continue;
      let a = hor ? cal.x0 : cal.z0; const fin = hor ? cal.x1 : cal.z1;
      for (const [c0, c1] of [...cortes(cal, lado, hor), [fin, fin]]) { if (c0 - a > .3) { if (hor) linea(a, lado, c0, lado, .11, AM); else linea(lado, a, lado, c0, .11, AM); } a = Math.max(a, c1); }
    }
    if (cal.n === 'S5') for (let zz = cal.z0 + 3; zz < cal.z1 - 2; zz += 8) { flecha((cal.x0 + cal.x1) / 2 - .7, zz, -Math.PI / 2, 1.1); flecha((cal.x0 + cal.x1) / 2 + .7, zz + 3, Math.PI / 2, 1.1); }
    if (cal.n === 'S8' || cal.n === 'S9') for (let xx = cal.x0 + 3; xx < cal.x1 - 2; xx += 8) { flecha(xx, (cal.z0 + cal.z1) / 2 - .6, 0, 1.1); flecha(xx + 3, (cal.z0 + cal.z1) / 2 + .6, Math.PI, 1.1); }
    if (cal.n === 'PG') for (let zz = -20; zz < 22; zz += 7) { flecha(-3.0, zz, Math.PI / 2, 1.0); flecha(-1.1, zz + 3, -Math.PI / 2, 1.0); }
  }
  /* ── circuito AGV: dos líneas blancas finas con esquinas redondeadas ── */
  if (on) { const A = P.AGV, r = 1.4; for (const off of [-.45, .45]) { x.strokeStyle = antes ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.9)'; x.lineWidth = S(.05); x.beginPath();
      const xs0 = A[0][0] - off, xs1 = A[1][0] + off, zs0 = A[0][1] - off, zs1 = A[2][1] + off;
      x.moveTo(X(xs0 + r), Y(zs0)); x.arcTo(X(xs1), Y(zs0), X(xs1), Y(zs1), S(r)); x.arcTo(X(xs1), Y(zs1), X(xs0), Y(zs1), S(r)); x.arcTo(X(xs0), Y(zs1), X(xs0), Y(zs0), S(r)); x.arcTo(X(xs0), Y(zs0), X(xs1), Y(zs0), S(r)); x.closePath(); x.stroke(); } }
  zona('senderos');
  /* ── senderos peatonales ── */
  const SH = P.SENDERO_H, SA = P.SENDERO_A;
  relleno(SH.x0, -10.3, SH.x1, 3.9, '#6E747D'); relleno(SH.x0, 6.5, SH.x1, P.PUERTA_P[1], '#6E747D'); linea(SH.x1, -10.3, SH.x1, 3.9, .09, AM);
  relleno(SA.x0, 10.7, SA.x1, P.PUERTA_REC.z + .6, '#6E747D'); relleno(NAVE.x0 + .2, P.PUERTA_REC.z - .6, SA.x1, P.PUERTA_REC.z + .6, '#6E747D');
  for (const zz of [-8, -2]) peaton(SH.c, zz, .3);
  if (!antes) for (let xx = 2.2; xx < 26.4; xx += .55) { const zz = xx < 8.4 ? 8.6 : 7.4; x.fillStyle = AM; x.beginPath(); x.arc(X(xx), Y(zz), S(.07), 0, 7); x.fill(); }
  peaton(4.4, 9.6, .34); peaton(18.0, 9.8, .34);
  /* ── cebras ── */
  cebra(P.CEBRA_REC.x - P.CEBRA_REC.ancho / 2, P.CEBRA_REC.z0, P.CEBRA_REC.x + P.CEBRA_REC.ancho / 2, P.CEBRA_REC.z1, 'x');
  cebra(P.CEBRA_REC2.x - P.CEBRA_REC2.ancho / 2, P.CEBRA_REC2.z0, P.CEBRA_REC2.x + P.CEBRA_REC2.ancho / 2, P.CEBRA_REC2.z1, 'x');
  cebra(P.CEBRA_H1.x0, -10.3, P.CEBRA_H1.x1, -5.8, 'x');
  cebra(P.CALLES[0].x0, P.CEBRA_H2.z0, P.CALLES[0].x1, P.CEBRA_H2.z1 + .6, 'z');
  cebra(P.CALLES[1].x0, P.CEBRA_H3.z0, P.CALLES[1].x1, P.CEBRA_H3.z1 + .6, 'z');
  for (const xx of [14, 22]) cebra(xx, P.CALLES[3].z0, xx + 1.6, P.CALLES[3].z1, 'x');
  cebra(28.0, P.CALLES[5].z0, 29.6, P.CALLES[5].z1, 'x');
  zona('calles');
  /* ── banda alta ── */
  for (const [z0, z1] of [...P.FILAS, ...P.RACK2.filas]) { rect(P.RACK.x0 - .05, z0 - .06, P.RACK.x1 + .06, z1 + .06, .07, AM); rayado(P.RACK.x1 + .08, z0 - .06, P.RACK.x1 + .48, z1 + .06); }
  for (const [z0, z1, n] of P.PASILLOS) { const czz = (z0 + z1) / 2; relleno(P.RACK.x1 + .2, czz - .5, P.RACK.x1 + 1.1, czz + .5, AZ, .95); texto(n, P.RACK.x1 + .65, czz, .5, BL, Math.PI / 2); }
  { const z = P.PALLETS_VACIOS; marco(z.x0, z.z0, z.x1, z.z1); rect(z.x0 + .3, z.z0 + .3, z.x1 - .3, z.z1 - .3, .06, AZ, [.3, .2]); }
  for (const [sx, sz] of P.EXPED.spots) esq(sx, sz, 1.2, 1.1, VE);
  texto('EXPEDICIÓN', -7.8, -11.0, .34, AM, 0, 700);
  rayado(NAVE.x0 + .05, P.ANDEN.z - 1.6, NAVE.x0 + 1.0, P.ANDEN.z + 1.6); rayado(NAVE.x0 + .05, P.ANDEN2.z - 1.6, NAVE.x0 + 1.0, P.ANDEN2.z + 1.6);
  { const cg = P.CARGA; rect(cg.x0, cg.z0, cg.x1, cg.z1, .08, VE); texto('CARGA DE BATERÍAS', (cg.x0 + cg.x1) / 2, cg.z0 + .4, .3, VE, 0, 700); }
  for (let i = 0; i < 3; i++) esq(-9.4 + i * 1.6, 17.3, 1.2, 2.8);
  /* ── hall ── */
  esq(P.HALL_MAT.spots[0][0], P.HALL_MAT.spots[0][1], 1.2, 1.3); for (const [px, pz] of [[3.6, 3.8], [5.0, 3.8]]) esq(px, pz, 1.2, 1.3);
  { const m = P.MAQUINA; marco(m.x - 1.5, m.z0 - .6, m.x + 1.5, m.z1 + .5, .14); }
  for (const [cx, cz] of P.CUBES) marco(cx - .7, cz - .7, cx + .7, cz + .7, .12);
  rayado(P.CAMARA_FRIA.puerta - 1.0, P.CAMARA_FRIA.z1 + .02, P.CAMARA_FRIA.puerta + 1.0, P.CAMARA_FRIA.z1 + .5, '#5BA3FF', BL);
  for (const r of [P.ROBOT, P.ROBOT2]) marco(r.x - 1.9, r.z - 1.9, r.x + 1.9, r.z + 1.9, .14);
  { const s = P.SUPER, n = 9, paso = (s.z1 - s.z0 - .6) / (n - 1); for (let i = 0; i < n; i++) { const zz = s.z0 + .3 + i * paso; relleno(s.x1 - 1.3, zz - .28, s.x1 - .3, zz + .28, VE, .95); texto(String(i + 1).padStart(3, '0'), s.x1 - .8, zz, .2, BL, 0, 700); } }
  for (const [mx, mz] of [[P.TALADRO.x, P.TALADRO.z], [P.TORNO.x, P.TORNO.z], [P.FRESA.x, P.FRESA.z]]) marco(mx - 1.6, mz - 1.2, mx + 1.6, mz + 1.2, .14);
  rect(P.LEAN.x0 - .2, P.LEAN.z0 - .2, P.LEAN.x1 + .2, P.LEAN.z1 + .2, .08, AZ); for (let i = 0; i < 3; i++) peaton(2.6 + i * 1.4, 14.8, .22, '#5B8FE6');
  { const kk = P.KITTING; for (let i = 0; i < 5; i++) { esq(kk.x0 + 6.6 + i * 1.5, kk.z0 + 2.0, .8, 1.4, AZ, .18, .05); texto('K' + (i + 1), kk.x0 + 6.6 + i * 1.5, kk.z0 + 3.1, .24, AZ, 0, 700); } }
  { const pt = P.PT; for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) esq(pt.x0 + 1.6 + i * 1.5, pt.z0 + 2 + f * 3.4, 1.2, 1.3); texto('PRODUCTO TERMINADO', (pt.x0 + pt.x1) / 2, pt.z1 - .6, .4, AM, 0, 700);
    for (const d of pt.docks) rayado(NAVE.x1 - 1.0, d - 1.6, NAVE.x1 - .05, d + 1.6); }
  { const e = P.ENSAMBLE; for (const ex of e.estaciones) { rect(ex - .95, e.zMesa - .55, ex + .95, e.zMesa + 1.4, .06, AZ); rect(ex - .75, e.zMesa - 2.35, ex + .75, e.zMesa - 1.45, .06, AM); } texto('ENSAMBLE', (e.x0 + e.x1) / 2, e.z1 - .6, .4, AM, 0, 700); }
  { const pz = P.PALETIZADO; esq(pz.mesa[0], pz.mesa[1], 1.4, 1.4, AM, .3, .08); rect(pz.x1 - 5.9, pz.z1 - 1.2, pz.x1 - .2, pz.z1 - .05, .09, VE); texto('PALETIZADO', (pz.x0 + pz.x1) / 2, pz.z0 + .6, .4, AM, 0, 700); }
  if (antes) { for (let i = 0; i < 160; i++) { const cxx = NAVE.x0 + azar() * (NAVE.x1 - NAVE.x0), czz = NAVE.z0 + azar() * (NAVE.z1 - NAVE.z0); x.globalAlpha = .05 + azar() * .06; x.fillStyle = '#5A6170'; x.beginPath(); x.ellipse(X(cxx), Y(czz), S(.3 + azar() * 1.2), S(.2 + azar() * .6), azar() * 3, 0, 7); x.fill(); } x.globalAlpha = 1; }
  return c;
}
