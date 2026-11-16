/* Planta Neisstech v5 · simulación (11-nov-2026). Grúas, tren logístico, camión, autos y personas recorren el plano de
   Max. Un mismo reparto de equipos en los dos modos; cambia la conducta:
   · después: las personas van por el sendero y esperan en los cruces; las grúas se detienen cuando hay alguien cruzando,
     la barra Safetygate frena la carga alta, el radar baja la velocidad y el camión queda bloqueado en el andén.
   · antes: nadie espera, las personas acortan camino por las calles, las grúas van más rápido y frenan encima
     (casi accidentes), la carga alta golpea el portón y el camión se mueve con la grúa adentro. */
import { THREE, clamp, lerp, suave, eio } from '../planta/nucleo.js';
import { ruta, rumbo } from '../planta/mapa.js';
import * as P from './trazado.js';

const dif = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const dentro = (r, x, z, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
const { Bs, Bn, Ae, Aw, Ds, Dn, Ee, Ew } = P.PISTA;

export function crearSim(k, H) {
  const { md, m2, vivo } = H;
  const S = { reloj: 0, modo: 'despues', eventos: [], vehiculos: [], peatones: [], cruces: {}, sg: Object.fromEntries(Object.keys(H.sg).map((id) => [id, { golpe: null, amp: 0, ang: 0, alarma: false }])), radar: {}, puertaFria: 0 };
  for (const [id, r] of Object.entries(P.CRUCES)) S.cruces[id] = { id, r, vehCerca: false, pedIn: 0, kVeh: 0, kPed: 0 };
  const evento = (x, z, tipo, y = 0, texto, bien) => { S.eventos.push({ x, z, y, tipo, t: S.reloj, texto, bien }); };
  S.evento = evento;

  /* ═════════ equipos ═════════ */
  const grua = () => { const m = md.montacargas(vivo); k.fusionar(m.cuerpo); return m; };
  const tomar = (t, alto, extra = {}) => ({ t, accion: 'tomar', alto, ...extra });
  const dejar = (t, alto, extra = {}) => ({ t, accion: 'dejar', alto, ...extra });
  const enAnden = (a) => (id) => { const x = P.ANDENES.find((q) => q.id === id).x; return a.x > x - 2 && a.x < x + 2 && a.z < 7.6; };
  const T2 = { nombre: 'T2', tipo: 'camion', vMax: 5, vRev: 1.1, vCurva: 2.2, frenteF: 5.95, frenteR: 3.6, radio: 1.3,
    legs: [
      { p: [[115, -24], [115, -8.6], [112.4, -4.9], [52, -4.9]] },
      { p: [[52, -4.9], [58.8, -4.9], [63.4, -3.2], [64.5, -.6], [64.5, 1.35]], rev: true, radio: 2.6, fin: { t: 4, accion: 'atracar' } },
      { p: [[64.5, 1.35], [64.5, 1.34]], fin: { t: 36, accion: 'cargar' } },
      { p: [[64.5, 1.35], [64.5, -1.8], [67.4, -4.6], [71, -5.2], [108, -5.2], [112.4, -4.9], [117.2, -7.2], [119, -11], [119, -26]], radio: 2.8 },
      { p: [[119, -26], [119, -26.01]], fin: { t: 3, accion: 'ocultar' } },
    ] };
  const TREN = { nombre: 'tren', tipo: 'tren', vMax: 1.7, vRev: 1, vCurva: 1.1, frenteF: .75, frenteR: .7, radio: .7,
    legs: [
      { p: [[90, Ew], [67.2, Ew], [Bs, 18.4], [Bs, 33.2], [64.8, Ae], [82.6, Ae]], radio: 1.6, fin: { t: 6 } },
      { p: [[82.6, Ae], [99.6, Ae], [Dn, 34.4], [Dn, 17.6], [99.4, Ew], [90, Ew]], radio: 1.6 },
    ] };
  const R1 = { nombre: 'R1', tipo: 'grua', legs: [
    { p: [[60, 8.5], [60, 2.2]], fin: tomar(3, .2) },
    { p: [[60, 2.2], [60, 8.5]], rev: true },
    { p: [[60, 8.5], [56.3, 8.5]], fin: dejar(3, .15, { slot: 'R2' }), cond: () => !H.slots.R2.visible },
    { p: [[56.3, 8.5], [60, 8.5]], rev: true },
  ] };
  const R2 = { nombre: 'R2', tipo: 'grua', legs: [
    { p: [[Bs, 12.0], [60.6, 11.0], [58.6, 10.1], [56.3, 10.1]], fin: tomar(3, .2, { slot: 'R3' }), cond: () => H.slots.R3.visible },
    { p: [[56.3, 10.1], [59.4, 10.1]], rev: true },
    { p: [[59.4, 10.1], [61.6, 10.6], [Bs, 11.8], [Bs, Ee], [77, Ee], [77, 9.0]], radio: 1.4 },
    { p: [[77, 9.0], [77.55, 9.0]], fin: dejar(4, 2.9) },
    { p: [[77.55, 9.0], [77, 9.0]], rev: true },
    { p: [[77, 9.0], [77, Ew]], rev: true },
    { p: [[77, Ew], [Bn, Ew], [Bn, 13.0], [Bs, 12.0]], radio: 1.3 },
  ] };
  const R3 = { nombre: 'R3', tipo: 'grua', cargaAlta: true, legs: [
    { p: [[85, Ew], [82.2, 16.6], [82.2, 21.0]], radio: 1.1, fin: tomar(4, 1.45) },
    { p: [[82.2, 21.0], [82.2, Ew]], rev: true },
    { p: [[82.2, Ew], [64.6, Ew], [Bs, 17.4], [Bs, 32.6], [64.6, Ae], [74.4, Ae]], radio: 1.4 },
    { p: [[74.4, Ae], [74.4, 34.0]], fin: dejar(3, .15, { slot: 'K1' }) },
    { p: [[74.4, 34.0], [74.4, Ae]], rev: true },
    { p: [[74.4, Ae], [99.6, Ae], [Dn, 34.4], [Dn, 17.6], [99.4, Ew], [85, Ew]], radio: 1.4 },
  ] };
  const R4 = { nombre: 'R4', tipo: 'grua', vB: 2.95, legs: [
    { p: [[Bs, 37.5], [62.4, 39.6], [60.6, 40.6], [56.9, 40.6]], radio: 1.2, fin: tomar(3, .2, { envolvedora: true }), cond: () => S.env.listo },
    { p: [[56.9, 40.6], [60.6, 40.6], [62.6, 42.2]], rev: true, radio: 1.0 },
    { p: [[62.6, 42.2], [64.4, 40.2], [Bn, 37.4], [Bn, 12.4], [64.5, 9.9], [64.5, 9.0]], radio: 1.4 },
    { p: [[64.5, 9.0], [64.5, 2.6]], fin: dejar(3, .2), cond: () => S.dockN2 === 'atracado' && S.t2Resta > 16 },
    { p: [[64.5, 2.6], [64.5, 9.5]], rev: true },
    { p: [[64.5, 9.5], [Bs, 12.4], [Bs, 37.5]], radio: 1.4 },
  ] };
  const R5 = { nombre: 'R5', tipo: 'grua', legs: [
    { p: [[87.4, 38.5], [87.4, 49.0]] },
    { p: [[87.4, 49.0], [88.6, 49.0]], fin: tomar(3, .3) },
    { p: [[88.6, 49.0], [87.6, 49.0]], rev: true },
    { p: [[87.6, 49.0], [87.6, 53.0], [87.4, 58.6]], fin: dejar(3, .15) },
    { p: [[87.4, 58.6], [87.6, 56.0]], rev: true },
    { p: [[87.6, 56.0], [88.8, 52.0], [88.8, 37.6], [90.2, Ae], [99.6, Ae], [Dn, 34.4], [Dn, 31.0], [100.4, 28.8], [99.5, 28.2], [98.5, 28.8], [Ds, 31.0], [Ds, 32.6], [96.4, Aw], [89.2, Aw], [87.4, 35.8], [87.4, 38.5]], radio: 1.2 },
  ] };
  const R6 = { nombre: 'R6', tipo: 'grua', legs: [
    { p: [[97.6, Ew], [93.4, Ew], [92.6, 14.4], [92.6, 9.6]], radio: 1.1, fin: tomar(4, 1.45) },
    { p: [[92.6, 9.6], [92.6, Ee]], rev: true },
    { p: [[92.6, Ee], [99.6, Ee], [Dn, 15.4], [Dn, 6.0], [100.9, 3.0], [100.9, -1.4], [100.9, -10.0]], radio: 1.4 },
    { p: [[100.9, -10.0], [100.9, -10.01]], fin: dejar(3, 1.3, { rampla: true }) },
    { p: [[100.9, -10.0], [100.9, -8.4], [102.4, -6.4]], rev: true, radio: 1.2 },
    { p: [[102.4, -6.4], [100.6, -4.6], [100.0, -2.0], [100.0, 4.4], [Ds, 7.8], [Ds, 15.0], [97.6, Ew]], radio: 1.3 },
  ] };
  const DEF_V = [T2, TREN, R4, R3, R1, R2, R5, R6];
  // dónde parte cada uno (tramo, fracción) para que la planta ya esté andando
  const INICIO = { T2: [2, 0], tren: [0, .3], R4: [2, .1], R3: [2, .05], R1: [0, 0], R2: [2, .5], R5: [5, .2], R6: [2, .2] };
  for (const d of DEF_V) {
    if (d.tipo === 'camion') { d.m = H.eq.camion(vivo); }
    else if (d.tipo === 'tren') { d.mD = md.tractor(vivo); d.carrosD = [0, 1, 2].map((i) => md.carroKitting(vivo, i % 2 ? M_AMARILLO() : undefined));
      // antes del tren logístico: una persona empuja un solo carro a mano (frente +x = el carro)
      const g = k.grupo(0, 0, 0, 0, vivo), carro = H.eq.carroMano(g, 4); carro.position.x = .75; const pe = md.persona('operario', g); pe.g.position.x = -.25; md.brazos(pe, 1.1, .05);
      d.mA = { g, pe }; d.m = d.mD; d.carros = d.carrosD; }
    else d.m = grua();
    d.legs.forEach((L) => (L.r = ruta(L.p, L.radio ?? 1.2)));
  }
  function M_AMARILLO() { return k.M.amarillo; }
  S.vehiculos = DEF_V;
  // autos en la calle pública
  const AUTOS = [[115, 1, 0xD9363E, 0], [115, 1, 0x9AA3AE, 48], [119, -1, 0x2B2F36, 10], [119, -1, 0xE9ECF0, 60]].map(([x, s, c, z0]) => ({ x, s, z0, g: H.eq.auto(vivo, x, 0, 0, c) }));
  // slots que cambian
  H.slots.K1 = H.palletR(vivo, 74.4, 0, 32.54, Math.PI / 2, .75); H.slots.K1.visible = false;
  S.env = { listo: true, t: 0 };

  /* ═════════ personas ═════════ */
  const ida = (p, t1 = 6, t2 = 6) => [{ p, fin: { t: t1 } }, { p: [...p].reverse(), fin: { t: t2 } }];
  const DEF_P = [
    { n: 'P1', ropa: 'operario', despues: ida([[68, 5.8], [68, 25.6], [68.3, 28.4], [71.6, 30.6]], 8, 5), antes: ida([[68, 5.8], [66.1, 8.2], [66.1, 24.4], [69.4, 28.8], [71.6, 30.6]], 8, 5) },
    { n: 'P2', ropa: 'supervisor', despues: ida([[53.8, 18.75], [61.2, 18.75], [67.7, 18.75], [68, 19.8], [68, 37.6], [70.4, 39.6], [75.4, 40.8]], 8, 9), antes: ida([[53.8, 18.75], [59, 21.5], [63, 26.5], [66, 33.4], [72, 38.6], [75.4, 40.8]], 8, 9) },
    { n: 'P3', ropa: 'operario', despues: ida([[49.4, 31.6], [51.5, 32.6], [51.5, 37.5], [54.3, 37.5], [54.3, 38.55], [50.7, 38.55], [50.2, 39.2], [50.2, 41.4], [48.4, 41.4], [47.4, 42.6]], 7, 9), antes: ida([[49.4, 31.6], [56.6, 35.4], [53.4, 42.6]], 7, 9) },
    { n: 'P4', ropa: 'operario', despues: ida([[82.4, 31.0], [78.5, 32.6], [78.5, 37.6], [77.2, 43.8], [77.6, 45.8]], 6, 8), antes: ida([[82.4, 31.0], [81.2, 35.6], [77.6, 45.8]], 6, 8) },
    { n: 'P5', ropa: 'operario', despues: ida([[93.6, 30.8], [95.4, 29], [103.2, 29], [104.6, 29], [106.6, 31.2]], 5, 7), antes: ida([[93.6, 31.6], [97.8, 32.6], [103.2, 29.3], [104.6, 29.1], [106.6, 31.2]], 5, 7) },
    { n: 'P6', ropa: 'supervisor', despues: ida([[104.6, 43.0], [92.0, 43.0], [90.4, 41.8], [85.4, 41.8], [84.0, 41.0]], 5, 7), antes: ida([[104.6, 43.0], [92.0, 43.0], [88, 46.4], [84.0, 41.0]], 5, 7) },
    { n: 'P7', ropa: 'oficina', despues: ida([[66.6, -12.6], [68, -10.6], [68, -7.6], [68, -2.4], [68, 3.3], [68, 4.9], [68, 6.4], [69.4, 7.4]], 4, 7), antes: ida([[64.6, -12.6], [66.2, -4.4], [67.8, 2.6], [68, 3.3], [68, 4.9], [68, 6.4], [69.4, 7.4]], 4, 7) },
    { n: 'P9', ropa: 'operario', despues: ida([[62.5, 58.8], [62.5, 56.2], [67.6, 56.0], [68, 55.2], [68, 44.0], [68.9, 43.0], [72.6, 41.6]], 5, 8), antes: ida([[62.5, 58.8], [62.5, 56.2], [67.6, 56.0], [68, 55.4], [66.2, 52.0], [65.6, 40.4], [69.6, 38.6], [72.6, 41.6]], 5, 8) },
    { n: 'P8', ropa: 'operario', despues: ida([[56.0, 19.8], [56.0, 24.0], [56.0, 26.2], [55.2, 28.0]], 6, 4), antes: ida([[60.6, 17.0], [62.0, 22.8], [62.8, 26.6], [58.4, 28.4]], 6, 4) },
  ];
  for (const d of DEF_P) { d.m = md.persona(d.ropa, vivo); for (const mo of ['antes', 'despues']) d[mo].forEach((L) => (L.r = ruta(L.p, .6))); }
  S.peatones = DEF_P;
  const INICIO_P = { P9: [0, .5], P1: [0, .1], P2: [0, .4], P3: [1, .2], P4: [0, .6], P5: [0, .2], P6: [1, .5], P7: [0, .3], P8: [0, .5] };

  /* ═════════ reinicio por modo ═════════ */
  function poner(a, i, f) {
    a.i = i; const L = a.legs[i]; a.s = L.r.largo * f; a.v = 0; a.espera = 0; a.accion = null; a.bloq = 0; a.oculto = false; a.alto = .18; a.carga = false; a.bajado = false; a.freno = 0; a.ultEv = -9; a.hist = [];
    const q = L.r.en(a.s); a.x = q.x; a.z = q.z; a.th = rumbo(L.rev ? -q.dx : q.dx, L.rev ? -q.dz : q.dz); a.m.g.visible = true;
    if (a.tipo === 'grua') { a.m.carga.visible = false; a.m.levantar(a.alto); }
    if (a.tipo === 'tren') { a.hist = [{ x: a.x, z: a.z, th: a.th, d: 0 }]; for (let n = 1; n < 60; n++) { const p = L.r.en(Math.max(0, a.s - n * .1)); a.hist.push({ x: p.x, z: p.z, th: rumbo(p.dx, p.dz), d: n * .1 }); } }
  }
  function reiniciar(modo) {
    S.modo = modo; S.eventos.length = 0; S.reloj = 0; S.dockN2 = 'libre'; S.t2Resta = 0; S.creep = 0; S.creepHecho = false; S.env = { listo: true, t: 0 };
    for (const s of Object.values(S.sg)) { s.golpe = null; s.ang = 0; s.alarma = false; }
    for (const a of DEF_V) {
      if (a.tipo === 'tren') { const antes = modo === 'antes'; a.m = antes ? a.mA : a.mD; a.carros = antes ? null : a.carrosD; a.mA.g.visible = antes; a.mD.g.visible = !antes; a.carrosD.forEach((c) => (c.g.visible = !antes)); a.vMax = antes ? 1.0 : 1.7; a.frenteF = antes ? 1.4 : .75; }
      const [i, f] = INICIO[a.nombre]; poner(a, i, f);
      if (a.tipo === 'grua') { a.vMax = modo === 'antes' ? 3.1 : 2.0; a.vRev = modo === 'antes' ? 1.6 : 1.1; a.vCurva = modo === 'antes' ? 2.0 : 1.2; a.acel = modo === 'antes' ? 2.0 : 1.3; a.frenteR = 1.2; a.radio = .75; }
      else a.acel = 1.2;
      if (a.tipo === 'tren' && modo === 'antes') a.acel = .8;
      if (a.nombre === 'T2' && i === 2) { S.dockN2 = 'atracado'; a.espera = a.legs[2].fin.t * (1 - f) + 4; a.accion = a.legs[2].fin; a.s = 0; }
      if (a.nombre === 'R3' || a.nombre === 'R6' || a.nombre === 'R4') { a.carga = true; a.m.carga.visible = true; a.alto = transporte(a); a.m.levantar(a.alto); }
    }
    for (const p of DEF_P) { p.legs = p[modo]; const [i, f] = INICIO_P[p.n]; p.i = i; p.s = p.legs[i].r.largo * f; p.v = 0; p.espera = 0; p.permiso = {}; const q = p.legs[i].r.en(p.s); p.x = q.x; p.z = q.z; p.th = rumbo(q.dx, q.dz); }
    H.slots.R2.visible = false; H.slots.R3.visible = true; S.tR2 = S.tR3 = 0; H.slots.K1.visible = false; H.rampla.huecos.forEach((h, i) => (h.visible = i === 0)); H.envolvedora.pal.visible = true;
    for (let n = 0; n < 20 * 10; n++) paso(1 / 20, true);
    S.eventos.length = 0;
  }
  const transporte = (a) => (a.cargaAlta && a.carga && !a.bajado ? 2.45 : .18);

  /* ═════════ geometría de los equipos ═════════ */
  const altura = (x, z) => { for (const an of P.ANDENES) if (x > an.x - 1.3 && x < an.x + 1.3 && z > -2.3 && z < 5) return 0; return P.suelo(x, z); };
  function puntos(a) {   // círculos que ocupa cada equipo (centro x,z)
    const cx = Math.cos(a.th), cz = -Math.sin(a.th), out = [];
    if (a.tipo === 'camion') for (const d of [-3.2, -1, 1.4, 3.6, 5.3]) out.push([a.x + cx * d, a.z + cz * d]);
    else if (a.tipo === 'tren') { out.push([a.x, a.z]); if (a.carros) for (const c of a.carros) out.push([c.g.position.x, c.g.position.z]); else out.push([a.x + Math.cos(a.th) * .8, a.z - Math.sin(a.th) * .8]); }
    else { out.push([a.x - cx * .5, a.z - cz * .5]); out.push([a.x + cx * (a.carga ? 1.5 : 1.1), a.z + cz * (a.carga ? 1.5 : 1.1)]); }
    return out;
  }
  function frentePunto(a, rev) { const cx = Math.cos(a.th), cz = -Math.sin(a.th); const d = rev ? -(a.frenteR ?? 1.2) : (a.tipo === 'grua' ? a.m.frente() : a.frenteF); return [a.x + cx * d, a.z + cz * d]; }

  /* ═════════ un paso ═════════ */
  function bloqueo(a, L, q, calentar) {
    const dm = [q.dx, q.dz], [fx, fz] = frentePunto(a, L.rev), mira = 1.0 + a.v * a.v / 5 + .5;
    const delante = (x, z, lat = 1.25, largo = mira) => { const rx = x - fx, rz = z - fz, al = rx * dm[0] + rz * dm[1], la = Math.abs(rx * dm[1] - rz * dm[0]); return al > -.4 && al < largo && la < lat; };
    // otros equipos
    for (const b of S.vehiculos) {
      if (a.ghost > S.reloj) break;   // destrabe: tras 5 s bloqueado, cede el paso pasando (14-nov: se atascaban)
      if (b === a || b.oculto || b.res) continue;
      if (b.tipo === 'camion' && a.tipo === 'grua' && S.dockN2 === 'atracado' && a.z > -1) continue;   // la grúa entra al remolque atracado
      const prioridad = S.vehiculos.indexOf(b) < S.vehiculos.indexOf(a);
      for (const [x, z] of puntos(b)) if (delante(x, z, (b.radio ?? .8) + .35)) { if (prioridad || a.bloq < 5) return 1; }
    }
    // personas
    for (const p of S.peatones) {
      if (p.res) continue;
      if (S.modo === 'antes') { if (delante(p.x, p.z, .9, 1.9)) { if (a.v > .6 && S.reloj - a.ultEv > 3 && !calentar && !a.res) { a.ultEv = S.reloj; evento(p.x, p.z, 'casi'); } return 2; } }
      else if (delante(p.x, p.z, 1.0, mira + .8)) return 1;
    }
    // cruces ocupados (después)
    if (S.modo === 'despues') for (const c of Object.values(S.cruces)) {
      if (c.pedIn <= 0 || dentro(c.r, fx, fz, .1) || dentro(c.r, a.x, a.z, .1)) continue;
      for (const d of [.3, 1.2, 2.2, 3.2]) if (dentro(c.r, fx + dm[0] * d, fz + dm[1] * d, .35)) return 1;
    }
    return 0;
  }
  // carga alta contra el portón (antes) o contra la barra Safetygate (después)
  function cargaAlta(a, L, calentar) {
    if (a.tipo !== 'grua' || !a.carga || a.bajado || a.v < .1) return false;
    const top = a.m.techo() + altura(a.x, a.z);
    for (const [id, g] of Object.entries(H.sg)) {
      const [fx, fz] = frentePunto(a, L.rev), des = S.modo === 'despues', lim = des ? g.y - .08 : g.dintel;
      if (top < lim) continue;
      const linea = des ? g.c : g.muro + g.lado * .13, ej = g.eje === 'z' ? fz : fx, tr = g.eje === 'z' ? fx : fz;
      if (tr < g.a0 || tr > g.a1 || Math.abs(ej - linea) > .22) continue;
      a.v = 0; a.bajado = true; a.espera = 2.6; a.accion = { accion: 'bajar', t: 2.6, sigue: true };
      if (calentar) return true;
      if (des) { if (!a.res) { S.sg[id].golpe = S.reloj; S.sg[id].amp = .32; } } else if (!a.res) evento(fx, fz, 'golpe', g.dintel);
      return true;
    }
    return false;
  }
  function accion(a, A, ini) {
    if (ini) {
      if (A.accion === 'atracar') S.dockN2 = 'atracando';
      if (A.accion === 'cargar') { S.dockN2 = 'atracado'; S.t2Resta = A.t; }
      if (A.accion === 'ocultar') { a.oculto = true; a.m.g.visible = false; }
      return;
    }
    if (A.accion === 'tomar') { a.carga = true; a.bajado = false; if (a.m.carga) a.m.carga.visible = true; if (A.slot) H.slots[A.slot].visible = false; if (A.envolvedora) { H.envolvedora.pal.visible = false; S.env.listo = false; S.env.t = 0; } }
    if (A.accion === 'dejar') { a.carga = false; if (a.m.carga) a.m.carga.visible = false; if (A.slot) { H.slots[A.slot].visible = true; if (A.slot === 'K1') S.k1 = S.reloj; } if (A.rampla) { const h = H.rampla.huecos.find((q) => !q.visible); if (h) h.visible = true; else H.rampla.huecos.forEach((q, i) => (q.visible = i === 0)); } }
    if (A.accion === 'atracar') S.dockN2 = 'atracado';
    if (A.accion === 'cargar') { S.dockN2 = 'saliendo'; S.creepHecho = false; }
    if (A.accion === 'ocultar') { a.oculto = false; a.m.g.visible = true; S.dockN2 = 'libre'; }
  }
  function sigTramo(a) { a.i = (a.i + 1) % a.legs.length; a.s = 0; a.bloq = 0; }
  function moverVeh(a, dt, calentar) {
    const L0 = a.legs[a.i];
    if (a.espera > 0) {
      const A = a.accion; a.espera -= dt;
      if (A && a.tipo === 'grua') { const f = 1 - a.espera / A.t; const obj = A.accion === 'bajar' ? .18 : f < .5 ? A.alto : transporte(a);
        if (f >= .5 && !A.hecho && A.accion !== 'bajar') { A.hecho = true; accion(a, A, false); } a.alto += (obj - a.alto) * Math.min(1, dt * 2.6); }
      if (A && A.accion === 'cargar') { const r4 = S.vehiculos.find((v) => v.nombre === 'R4'); if (a.espera < .5 && r4.z < 7.8 && r4.x > 62.5 && r4.x < 66.5) a.espera = .5; S.t2Resta = a.espera; }
      if (a.espera <= 0) { if (A && !A.hecho && a.tipo !== 'grua') accion(a, A, false); if (A) A.hecho = false; const sigue = A?.sigue; a.accion = null; if (!sigue) sigTramo(a); }
      return;
    }
    const L = L0;
    if (a.s === 0 && L.cond && !L.cond()) { a.v = 0; return; }
    const q = L.r.en(a.s), fx = L.rev ? -q.dx : q.dx, fz = L.rev ? -q.dz : q.dz, d = dif(a.th, rumbo(fx, fz));
    if (Math.abs(d) > .3 && a.v < .3) { a.th += Math.sign(d) * Math.min(Math.abs(d), 1.5 * dt); a.v = 0; return; }
    a.th += d * Math.min(1, dt * 6);
    let vmax = L.rev ? a.vRev : a.vMax;
    if (a.vB && !L.rev && a.x > 61 && a.x < 69 && a.z > 26 && a.z < 55) vmax = S.modo === 'antes' ? 3.4 : (a.radarFreno > S.reloj ? 1.9 : a.vB);
    const resto = L.r.largo - a.s; vmax = Math.min(vmax, Math.sqrt(2 * 1.1 * Math.max(0, resto)) + .18);
    const q2 = L.r.en(a.s + 1.8); if (q.dx * q2.dx + q.dz * q2.dz < .93) vmax = Math.min(vmax, a.vCurva);
    if (cargaAlta(a, L, calentar)) return;
    const fr = bloqueo(a, L, q, calentar); a.bloq = fr ? a.bloq + dt : 0; if (a.bloq > 5) { a.ghost = S.reloj + 3; a.bloq = 0; }
    const vt = fr ? 0 : vmax, dec = fr === 2 ? 8 : 3;
    a.v = vt > a.v ? Math.min(vt, a.v + a.acel * dt) : Math.max(vt, a.v - dec * dt);
    a.s += a.v * dt;
    if (a.s >= L.r.largo - .004) {
      a.s = L.r.largo;
      if (L.fin) { a.espera = L.fin.t; a.accion = L.fin; L.fin.hecho = false; a.v = 0; accion(a, L.fin, true); }
      else sigTramo(a);
    }
  }
  const reservado = (x, z) => S.reserva && Math.hypot(x - S.reserva.x, z - S.reserva.z) < S.reserva.r;
  function ubicarVeh(a, dt) {
    if (a.oculto) return;
    const L = a.legs[a.i], q = L.r.en(a.s); a.x = q.x; a.z = q.z;
    let y = altura(a.x, a.z), ox = 0, oz = 0;
    if (a.nombre === 'T2' && S.creep) { oz = -S.creep; }
    a.m.g.position.set(a.x + ox, a.tipo === 'camion' ? P.NIVEL_PATIO : y, a.z + oz); a.m.g.rotation.y = a.th;
    a.res = reservado(a.x, a.z); a.m.g.visible = !a.res; if (a.carros) a.carros.forEach((c) => (c.g.visible = !a.res));
    if (a.tipo === 'camion' && a.z > -3) a.m.g.position.y = P.NIVEL_PATIO;
    // inclinación en la rampa del patio
    if (a.tipo === 'grua') { const y2 = altura(a.x + Math.cos(a.th) * .8, a.z - Math.sin(a.th) * .8); a.m.g.rotation.z = Math.atan2(y2 - y, .8); a.m.levantar(a.alto); }
    // el recorrido del tractor se guarda siempre, aunque esté oculto por una demo: si no, al reaparecer el primer carro
    // quedaba en un punto viejo junto al cruce y las grúas lo atravesaban (13-nov)
    if (a.carros) {
      const h = a.hist, u = h[0]; if (!u || Math.hypot(a.x - u.x, a.z - u.z) > .06) { h.unshift({ x: a.x, z: a.z, th: a.th }); if (h.length > 260) h.pop(); }
      let acc = 0, j = 0; a.carros.forEach((c, i) => { const obj = 1.5 * (i + 1); while (j < h.length - 1 && acc < obj) { acc += Math.hypot(h[j + 1].x - h[j].x, h[j + 1].z - h[j].z); j++; } const p = h[j]; c.g.position.set(p.x, 0, p.z); c.g.rotation.y = p.th; });
    }
    // balizas y luz azul de piso solo con equipos Neisstech (después)
    if (a.m.pe) md.andar(a.m.pe, Math.min(1, a.v / 1.1), S.reloj), md.brazos(a.m.pe, 1.1, .05);
    if (a.m.balMat) a.m.balMat.emissiveIntensity = a.v > .05 ? (Math.sin(S.reloj * 9 + a.x) > 0 ? 2.4 : .3) : .25;
    if (a.m.spot) { const on = S.modo === 'despues' && a.v > .05; a.m.spot.visible = on; if (a.m.cams) a.m.cams.visible = S.modo === 'despues'; }
  }
  function moverPeaton(p, dt) {
    if (p.espera > 0) { p.espera -= dt; md.andar(p.m, 0, S.reloj); if (p.espera <= 0) { p.i = (p.i + 1) % p.legs.length; p.s = 0; } return; }
    const L = p.legs[p.i], q = L.r.en(p.s);
    if (S.modo === 'despues') {
      const ad = L.r.en(p.s + .7);
      for (const c of Object.values(S.cruces)) {
        const den = dentro(c.r, q.x, q.z, .05), va = dentro(c.r, ad.x, ad.z, 0);
        if (!den && va && !p.permiso[c.id]) { if (c.vehCerca) { p.v = Math.max(0, p.v - 4 * dt); p.esperando = c.id; md.andar(p.m, p.v / 1.3, S.reloj); return; } p.permiso[c.id] = true; }
        if (!den && !va) p.permiso[c.id] = false;
      }
    }
    p.esperando = null;
    const vt = S.modo === 'antes' ? 1.4 : 1.25; p.v = Math.min(vt, p.v + 2.5 * dt);
    p.s += p.v * dt; const d = dif(p.th, rumbo(q.dx, q.dz)); p.th += d * Math.min(1, dt * 8);
    if (p.s >= L.r.largo) { p.s = L.r.largo; p.espera = L.fin?.t ?? 0; p.v = 0; if (!p.espera) { p.i = (p.i + 1) % p.legs.length; p.s = 0; } }
    md.andar(p.m, p.v / 1.3, S.reloj);
  }
  function ubicarPeaton(p) { const q = p.legs[p.i].r.en(p.s); p.x = q.x; p.z = q.z; p.m.g.position.set(p.x, altura(p.x, p.z), p.z); p.m.g.rotation.y = p.th; p.res = reservado(p.x, p.z); p.m.g.visible = !p.res; }

  S.pausada = false;
  S.pausar = (si) => { S.pausada = si; for (const a of DEF_V) { a.m.g.visible = !si && !a.oculto; if (a.carrosD) a.carrosD.forEach((c) => (c.g.visible = !si && S.modo !== 'antes')); if (a.mA) a.mA.g.visible = !si && S.modo === 'antes' && a.m === a.mA; if (a.mD) a.mD.g.visible = !si && a.m === a.mD; } for (const p of DEF_P) p.m.g.visible = !si; if (si) S.eventos.length = 0; };
  function pasoPausado(dt) {
    S.reloj += dt;
    for (const c of Object.values(S.cruces)) { const f = c.forzar; c.vehCerca = !!f?.veh; c.pedIn = f?.ped || 0; c.kVeh = clamp(c.kVeh + (c.vehCerca ? dt * 4 : -dt * 2)); c.kPed = clamp(c.kPed + (c.pedIn ? dt * 4 : -dt * 2)); }
    for (const s of Object.values(S.sg)) { if (s.golpe != null) { const t = S.reloj - s.golpe; s.ang = s.amp * Math.exp(-t * 1.05) * Math.sin(t * 4.6); s.alarma = t < 4.5; if (t > 8) s.golpe = null; } else { s.ang = 0; s.alarma = false; } }
    for (const r of H.radares) S.radar[r.carril] = S.radarForzado?.[r.carril] ?? null;
    S.puertaFria = clamp(S.puertaFria + ((S.puertaFriaForzada ?? 0) > .5 ? dt * 1.2 : -dt * .8));
    if (!S.env.listo) { S.env.t += dt; if (S.env.t > 4) H.envolvedora.pal.visible = true; if (S.env.t > 12) S.env.listo = true; }
    for (const c of AUTOS) { const z = ((c.z0 + S.reloj * 8) % 96) - 22; c.g.position.set(c.x, P.NIVEL_PATIO, c.s > 0 ? z : 70 - (z + 22)); c.g.rotation.y = c.s > 0 ? -Math.PI / 2 : Math.PI / 2; }
    while (S.eventos.length && S.reloj - S.eventos[0].t > 3.2) S.eventos.shift();
  }
  function paso(dt, calentar = false) {
    if (S.pausada && !calentar) return pasoPausado(dt);
    S.reloj += dt;
    // estado de los cruces: ¿viene un equipo? ¿hay alguien cruzando?
    for (const c of Object.values(S.cruces)) {
      c.vehCerca = false; c.pedIn = 0;
      if (c.forzar) { c.vehCerca = !!c.forzar.veh; c.pedIn = c.forzar.ped || 0; c.kVeh = clamp(c.kVeh + (c.vehCerca ? dt * 4 : -dt * 2)); c.kPed = clamp(c.kPed + (c.pedIn ? dt * 4 : -dt * 2)); continue; }
      for (const a of S.vehiculos) { if (a.oculto || a.v < .25 || a.res) continue; const L = a.legs[a.i], q = L.r.en(a.s), dm = [q.dx, q.dz];
        for (const [x, z] of puntos(a)) { if (dentro(c.r, x, z, 0)) { c.vehCerca = true; break; } if (dentro(c.r, x, z, 3.8)) { const cx = (c.r.x0 + c.r.x1) / 2 - x, cz = (c.r.z0 + c.r.z1) / 2 - z; if (cx * dm[0] + cz * dm[1] > 0) { c.vehCerca = true; break; } } }
        if (c.vehCerca) break; }
      for (const p of S.peatones) if (!p.res && dentro(c.r, p.x, p.z, .25)) c.pedIn++;
      c.kVeh = clamp(c.kVeh + (c.vehCerca ? dt * 4 : -dt * 2)); c.kPed = clamp(c.kPed + (c.pedIn ? dt * 4 : -dt * 2));
    }
    for (const a of S.vehiculos) { moverVeh(a, dt, calentar); ubicarVeh(a, dt); }
    for (const p of S.peatones) { moverPeaton(p, dt); ubicarPeaton(p); }
    // antes: equipo que pasa rozando a una persona
    if (S.modo === 'antes' && !calentar && !S.reserva) for (const p of S.peatones) { if (S.reloj - (p.ultEv ?? -9) < 3.5 || p.res) continue;
      for (const a of S.vehiculos) { if (a.oculto || a.v < .8 || a.res) continue; if (puntos(a).some(([x, z]) => Math.hypot(x - p.x, z - p.z) < 1.35)) { p.ultEv = S.reloj; evento(p.x, p.z, 'casi'); break; } } }
    // camión: antes se mueve con la grúa adentro (sin bloqueo); después la cuña lo traba
    const r4 = S.vehiculos.find((v) => v.nombre === 'R4');
    if (S.modo === 'antes' && !S.reserva && S.dockN2 === 'atracado' && !S.creepHecho && r4.x > 63 && r4.x < 66 && r4.z < 4.6) { S.creepHecho = true; S.creepT = S.reloj; if (!calentar) evento(64.5, 4.4, 'camion'); }
    S.creep = S.creepHecho && S.dockN2 !== 'libre' ? .55 * suave(clamp((S.reloj - (S.creepT ?? 0)) / 1.2)) : 0;
    // Safetygate
    for (const s of Object.values(S.sg)) { if (s.golpe != null) { const t = S.reloj - s.golpe; s.ang = s.amp * Math.exp(-t * 1.05) * Math.sin(t * 4.6); s.alarma = t < 4.5; if (t > 8) s.golpe = null; } else { s.ang = 0; s.alarma = false; } }
    // radares: velocidad del equipo que se acerca y aviso al operador si pasa el límite
    for (const r of H.radares) { let v = null;
      for (const a of S.vehiculos) { if (a.tipo !== 'grua' || a.v < .2) continue; const L = a.legs[a.i], q = L.r.en(a.s), rx = a.x - r.x, rz = a.z - r.z;
        const al = rx * r.dx + rz * r.dz, la = Math.abs(rx * r.dz - rz * r.dx);   // delante de la pantalla, acercándose
        if (al > 1 && al < 16 && la < 7 && q.dx * r.dx + q.dz * r.dz < -.7 && !L.rev) { v = Math.max(v ?? 0, a.v * 3.6); if (a.v * 3.6 > 10) a.radarFreno = S.reloj + 3; } }
      S.radar[r.carril] = S.radarForzado?.[r.carril] !== undefined ? S.radarForzado[r.carril] : v; }
    // envolvedora: el pallet nuevo se envuelve en 12 s
    if (!S.env.listo) { S.env.t += dt; if (S.env.t > 4 && !H.envolvedora.pal.visible) H.envolvedora.pal.visible = true; if (S.env.t > 12) S.env.listo = true; }
    if (H.slots.K1.visible && S.reloj - (S.k1 ?? 0) > 18) H.slots.K1.visible = false;
    // la espera del andén se mueve sola: lo que deja R1 pasa al fondo de la fila; lo que retira R2 se repone
    S.tR2 = H.slots.R2.visible ? S.tR2 + dt : 0; if (S.tR2 > 10) H.slots.R2.visible = false;
    S.tR3 = H.slots.R3.visible ? 0 : S.tR3 + dt; if (S.tR3 > 8) H.slots.R3.visible = true;
    // puerta de la cámara de frío: se abre cuando alguien llega
    const p5 = S.peatones.find((p) => p.n === 'P5'), cerca = Math.hypot(p5.x - P.FRIO.x0, p5.z - P.FRIO.puerta.z) < 2.4;
    const abre = S.puertaFriaForzada !== undefined ? S.puertaFriaForzada > .5 : cerca;
    S.puertaFria = clamp(S.puertaFria + (abre ? dt * 1.2 : -dt * .8));
    // autos
    for (const c of AUTOS) { const L = 96, z = ((c.z0 + S.reloj * 8) % L) - 22; c.g.position.set(c.x, P.NIVEL_PATIO, c.s > 0 ? z : 70 - (z + 22)); c.g.rotation.y = c.s > 0 ? -Math.PI / 2 : Math.PI / 2; }
    while (S.eventos.length && S.reloj - S.eventos[0].t > 3.2) S.eventos.shift();
  }
  S.paso = paso; S.reiniciar = reiniciar;
  return S;
}
