/* Planta Neisstech · simulación (8-nov-2026). Cada agente es un guion (generador) que avanza con dt.
   Lógica real (reunión con Bastián, 7-nov): en un cruce estándar el vehículo tiene la preferencia cuando el sensor lo
   detecta: se apagan las líneas del sendero, se enciende el pictograma de riesgo, las puertas quedan cerradas y en rojo.
   Sin vehículos, se abren las puertas y se proyecta el sendero. El sensor detecta equipos, no personas.
   modo 'despues' = con Neisstech · modo 'antes' = nada coordina: casi-accidentes, la grúa golpea el portón. */
import { THREE, clamp, lerp, suave, eio } from './nucleo.js';
import * as P from './mapa.js';
import { ruta, rumbo } from './mapa.js';

export function crearSim(k, H, modo) {
  const antes = modo === 'antes', md = H.md, { M } = k;
  const raiz = k.grupo(); raiz.userData.vivo = true;
  const S = { raiz, antes, agentes: [], vehiculos: [], peatones: [], ctl: [], reloj: 0, alertas: [] };
  // senderos peatonales (a lo largo de z): para «mirar antes de incorporarse» y para la prioridad
  const SENDEROS = [{ x0: P.SENDERO_A.x0, x1: P.SENDERO_A.x1, z0: P.PUERTA_P[0] - .2, z1: P.NAVE.z1 }, { x0: P.SENDERO_H.x0, x1: P.SENDERO_H.x1, z0: P.NAVE.z0, z1: P.LEAN.z0 }];
  const enSendero = (q) => SENDEROS.some((w) => q.x >= w.x0 && q.x <= w.x1 && q.z >= w.z0 && q.z <= w.z1);

  /* ── utilidades de guion ── */
  function* esperar(t) { while (t > 0) t -= yield; }
  function* hasta(f) { while (!f()) yield; }
  function* durante(t, fn) { let a = 0; while (a < t) { a += yield; fn(Math.min(1, a / t)); } }
  const frenar = (d, dec) => Math.sqrt(2 * dec * Math.max(0, d));
  const acercar = (v, obj, dt, ac, dec) => (v < obj ? Math.min(obj, v + ac * dt) : Math.max(obj, v - dec * dt));
  function poner(a, p, rev) { a.g.position.x = p.x; a.g.position.z = p.z; const fx = rev ? -p.dx : p.dx, fz = rev ? -p.dz : p.dz; a.g.rotation.y = rumbo(fx, fz); a.x = p.x; a.z = p.z; a.fx = fx; a.fz = fz; a.mx = p.dx; a.mz = p.dz; }
  // polilínea desplazada a la derecha del sentido de marcha (personas: cada una por su lado)
  function derecha(pts, d) {
    return pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; let dx = b[0] - a[0], dz = b[1] - a[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l; return [p[0] - dz * d, p[1] + dx * d]; });
  }
  // tramos de una ruta dentro del rectángulo de un controlador
  const cacheZ = new WeakMap();
  function zonasDe(r, tipo) {
    const key = tipo; let m = cacheZ.get(r); if (!m) { m = {}; cacheZ.set(r, m); } if (m[key]) return m[key];
    const out = [];
    for (const c of S.ctl) { if (!c.rect || !c.tipos.includes(tipo)) continue; const R = c.rect; let dentro = false, sIn = 0;
      for (let s = 0; s <= r.largo + .05; s += .1) { const p = r.en(s), q = p.x >= R.x0 && p.x <= R.x1 && p.z >= R.z0 && p.z <= R.z1;
        if (q && !dentro) { dentro = true; sIn = s; } if (!q && dentro) { dentro = false; out.push({ c, sIn, sOut: s, ent: r.en(sIn) }); } }
      if (dentro) out.push({ c, sIn, sOut: r.largo, ent: r.en(sIn) }); }
    return (m[key] = out);
  }

  /* ═════════ controladores ═════════ */
  // cruce con sistema Neisstech (A y C): puertas, 2 líneas, señalética, sensores
  function cruceSistema(eq, rect, tipoInt = 'v') {
    const c = { rect, tipos: ['v', 'p'], eq, estado: 'peatonal', libreT: 0, peat: new Set(), pide: new Set(), reportes: [], k: { lineas: 1, senal: 0 }, puertasK: eq.puertas.map(() => 0) };
    c.inicio = () => { c.reportes.length = 0; };
    c.reportar = (a, d) => c.reportes.push({ a, d });
    c.puedePasar = () => antes || c.estado === 'vehicular';
    c.peatonPuede = () => antes || (c.estado === 'peatonal');
    c.solicitar = (p) => c.pide.add(p);
    c.entrar = (p) => { c.peat.add(p); c.pide.delete(p); };
    c.salir = (p) => { c.peat.delete(p); c.pide.delete(p); };
    c.puertaAbierta = (p) => { if (antes) return true; let best = null, bd = 9; eq.puertas.forEach((q, i) => { const d = Math.hypot(q.g.position.x + Math.cos(-q.g.rotation.y) * q.ancho / 2 - p.x, q.g.position.z + Math.sin(-q.g.rotation.y) * q.ancho / 2 - p.z); if (d < bd) { bd = d; best = i; } }); return best == null || c.puertasK[best] > .9; };
    c.actualizar = (dt) => {
      if (antes) return;
      const detecta = c.reportes.some((r) => r.d < 7.5), encima = c.reportes.some((r) => r.d < 1.2);
      c.espera = c.pide.size && c.estado === 'vehicular' ? (c.espera || 0) + dt : 0;
      if (c.estado === 'peatonal') { c.verdeT = (c.verdeT || 0) + dt; if (detecta && c.peat.size === 0 && (c.pide.size === 0 || c.verdeT > 9) && c.puertasK.every((q) => q < .05)) { c.estado = 'vehicular'; c.verdeT = 0; } }
      else { c.libreT = detecta ? 0 : c.libreT + dt; if (c.libreT > 1.0 || (c.espera > 10 && !encima)) { c.estado = 'peatonal'; c.verdeT = 0; } }
      // puertas: se abren cuando hay paso peatonal y alguien llega a ellas
      const R = c.rect, cuerpoV = S.cuerpos.some((b) => !b.persona && !b.empujado && b.g.visible && b.x > R.x0 - .6 && b.x < R.x1 + .6 && b.z > R.z0 - .6 && b.z < R.z1 + .6);
      eq.puertas.forEach((q, i) => {
        const cx = q.g.position.x + Math.cos(-q.g.rotation.y) * q.ancho / 2, cz = q.g.position.z + Math.sin(-q.g.rotation.y) * q.ancho / 2;
        let quiere = false; if (c.estado === 'peatonal' && !detecta && !cuerpoV) for (const p of [...c.pide, ...c.peat]) if (Math.hypot(p.x - cx, p.z - cz) < 1.5) quiere = true;
        if (c.estado === 'peatonal' && !cuerpoV) for (const p of c.peat) if (Math.hypot(p.x - cx, p.z - cz) < 1.5) quiere = true;
        c.puertasK[i] = clamp(c.puertasK[i] + (quiere ? 1.6 : -1.1) * dt); q.abrir(eio(c.puertasK[i]), q.dir || 1);
        const verde = c.estado === 'peatonal'; q.r.emissiveIntensity = verde ? .05 : 2.4; q.v.emissiveIntensity = verde ? 2.4 : .05;
        q.boton.emissiveIntensity = c.pide.size ? (Math.sin(S.reloj * 9) > 0 ? 2.5 : .4) : .3;
      });
      const linOn = c.estado === 'peatonal' ? 1 : 0; c.k.lineas = clamp(c.k.lineas + (linOn ? 3 : -3) * dt); c.k.senal = clamp(c.k.senal + (linOn ? -3 : 3) * dt);
      eq.sensores.forEach((s) => (s.led.emissiveIntensity = detecta ? (Math.sin(S.reloj * 12) > 0 ? 3 : .5) : .6));
    };
    S.ctl.push(c); return c;
  }
  // cebra pintada (B y producción): el peatón mira antes de cruzar; el vehículo cede al que ya está cruzando
  function cruceCebra(rect) {
    const c = { rect, tipos: ['v', 'p'], peat: new Set(), reportes: [] };
    c.inicio = () => { c.reportes.length = 0; };
    c.reportar = (a, d) => c.reportes.push({ a, d });
    c.puedePasar = () => antes || c.peat.size === 0;
    c.peatonPuede = () => antes || !c.reportes.some((r) => r.d <= 0 || (r.d < 5 && r.a.v > .2));
    c.solicitar = () => {}; c.entrar = (p) => c.peat.add(p); c.salir = (p) => c.peat.delete(p); c.puertaAbierta = () => true; c.actualizar = () => {};
    S.ctl.push(c); return c;
  }
  // intersección con gestor de tráfico (salida del pasillo E al pasillo principal): un flujo a la vez
  function interseccion(rect, gestor) {
    // gestor de tráfico: un equipo a la vez dentro de la intersección; verde hacia el que tiene el paso, rojo al resto
    const c = { rect, tipos: ['v'], reportes: [], dueno: null, ausente: 0, turno: null };
    c.inicio = () => { c.reportes.length = 0; };
    c.reportar = (a, d) => c.reportes.push({ a, d });
    c.puedePasar = (a) => antes || c.dueno === a;
    c.actualizar = (dt) => {
      if (antes) return;
      if (c.dueno) { const o = c.dueno, R = c.rect, dentro = o.x > R.x0 - .3 && o.x < R.x1 + .3 && o.z > R.z0 - .3 && o.z < R.z1 + .3, r = c.reportes.find((q) => q.a === o); c.ausente = r || dentro ? 0 : c.ausente + dt; if (c.ausente > .4) c.dueno = null; }   // no suelta mientras el equipo siga físicamente adentro
      if (!c.dueno) { const cand = c.reportes.filter((q) => q.d < 4).sort((x, y) => x.d - y.d)[0]; if (cand) { c.dueno = cand.a; c.ausente = 0; } }
      const o = c.dueno; c.turno = o ? (Math.abs(o.mx) > Math.abs(o.mz) ? 'cruza' : 'pasillo') : null;
      gestor.luces.forEach((l, i) => { const ok = !c.turno || gestor.flujos[i] === c.turno; l.v.emissiveIntensity = ok ? 2.4 : .05; l.r.emissiveIntensity = ok ? .05 : 2.4; });
    };
    S.ctl.push(c); return c;
  }

  /* ═════════ obstáculos (equipos y personas) ═════════ */
  // obstáculos a lo largo de la RUTA que va a seguir (no en línea recta): así un giro no confunde a quien va por su pista
  function limiteObstaculos(a, vmax, ignora, r, s0) {
    let lim = vmax; a.esperaA = null;
    const lead = a.rev ? a.atras : a.frente0;
    for (const b of S.cuerpos) {
      if (b === a || b === ignora || b.duenio === a || !b.g.visible) continue;
      if (Math.abs(b.x - a.x) > 12 || Math.abs(b.z - a.z) > 12) continue;
      let gap = null;
      for (let d = 0; d <= 9; d += .35) {
        const ss = s0 + d; if (ss > r.largo + .01) break;
        const q = r.en(ss), lx = q.x + q.dx * lead, lz = q.z + q.dz * lead;
        // la punta del equipo (un círculo del ancho del equipo) contra el rectángulo de b
        if (distRect(b, lx, lz) < a.hw + .2) { gap = Math.max(0, d - .05); break; }
        // el costado del equipo en ese punto (por los giros)
        if (d > 0 && distRect(b, q.x, q.z) < a.hw + .12) { gap = Math.max(0, d - lead); break; }
      }
      if (gap == null) continue;
      const nom = (b.persona ? 'persona' : b.camion ? 'camion' : 'equipo') + '@' + b.x.toFixed(1) + ',' + b.z.toFixed(1) + ' gap' + gap.toFixed(2);
      if (b.persona) {
        if (antes) { if (gap < 1.0) { lim = 0; S.casi(a, b); a.esperaA = b; } }
        else { if (gap < 2.6) lim = Math.min(lim, vmax * .4); if (gap < 1.0) { lim = 0; a.esperaA = b; } }
      } else { const l = frenar(gap - .5, 2.6); if (l < lim) { lim = l; a.obsDe = b.duenio || b; a.obsNom = nom; } }
    }
    if (lim > .3) a.obsDe = null;
    return lim;
  }
  S.cuerpos = [];
  const ext = (b, dx, dz) => { const ry = b.g.rotation.y, fx = Math.cos(ry), fz = -Math.sin(ry); const a = Math.abs(dx * fx + dz * fz), c = Math.abs(dx * -fz + dz * fx); return a * (b.hl ?? .28) + c * (b.hw ?? .28); };
  // distancia exacta de un punto al rectángulo orientado de un cuerpo
  const distRect = (b, px, pz) => { const ry = b.g.rotation.y, fx = Math.cos(ry), fz = -Math.sin(ry), dx = px - b.x, dz = pz - b.z, lx = dx * fx + dz * fz, lz = dx * -fz + dz * fx, hl = b.hl ?? .28, hw = b.hw ?? .28; return Math.hypot(lx - clamp(lx, -hl, hl), lz - clamp(lz, -hw, hw)); };
  // ¿se tocan dos cuerpos? (rectángulos orientados, separación por ejes)
  S.solapan = (A, B, m = 0) => { for (const C of [A, B]) { const ry = C.g.rotation.y; for (const [ax, az] of [[Math.cos(ry), -Math.sin(ry)], [Math.sin(ry), Math.cos(ry)]]) { const d = Math.abs((B.x - A.x) * ax + (B.z - A.z) * az); if (d > ext(A, ax, az) + ext(B, ax, az) + m) return false; } } return true; };
  S.casi = (a, b) => { const now = S.reloj; if (a.ultCasi && now - a.ultCasi < 3) return; a.ultCasi = now; S.alertas.push({ x: (a.x + b.x) / 2, z: (a.z + b.z) / 2, t: now }); };

  /* ═════════ convivencia entre personas (y sus carros) ═════════ */
  // prioridad: menor número pasa primero. Los carros empujados (0) > quien va por el sendero (1) > quien se incorpora o cruza (2)
  function cederPaso(p, vmax) {
    let lim = vmax; p.bloqPor = null; p.ladoObj = 0; const origenes = [p]; if (p.carroB) origenes.push(p.carroB);
    for (const b of S.cuerpos) {
      if (b === p || b === p.carroB || !b.g.visible || (!b.persona && !b.empujado)) continue;
      const bo = b.duenio || b;
      const bv = Math.hypot(b.vx || 0, b.vz || 0);
      for (const o of origenes) {
        const rx = b.x - o.x, rz = b.z - o.z, d = Math.hypot(rx, rz); if (d > 3.2) continue;
        const pr = rx * p.mx + rz * p.mz; if (pr <= 0) continue;              // solo lo que está adelante
        const vx = p.mx * vmax, vz = p.mz * vmax, rvx = (b.vx || 0) - vx, rvz = (b.vz || 0) - vz, rv2 = rvx * rvx + rvz * rvz;
        const t = rv2 > 1e-6 ? clamp(-(rx * rvx + rz * rvz) / rv2, 0, 1.6) : 0, cx = rx + rvx * t, cz = rz + rvz * t, dmin = Math.hypot(cx, cz);
        const ux = dmin > 1e-4 ? cx / dmin : p.mx, uz = dmin > 1e-4 ? cz / dmin : p.mz, rmin = ext(o, ux, uz) + ext(b, ux, uz) + .02;
        if (dmin >= rmin) continue;
        const mismo = bv > .05 && ((b.vx || 0) * p.mx + (b.vz || 0) * p.mz) / bv > .5;
        let l = lim;
        const frente = bv > .05 && ((b.vx || 0) * p.mx + (b.vz || 0) * p.mz) / bv < -.5;
        if (frente && b.persona && !p.carroB) { p.ladoObj = .2; if (dmin < rmin - .22) l = frenar(d - rmin - .25, 3); }   // viene de frente: se corre a su derecha
        else if (bv < .05 || mismo) l = frenar(pr - ext(o, p.mx, p.mz) - ext(b, p.mx, p.mz) - .2, 3);   // detenido o va igual: no atravesar, seguir
        else if ((p.prio ?? 1) > (b.prio ?? 1) || ((p.prio ?? 1) === (b.prio ?? 1) && p.idx > (bo.idx ?? 0))) { l = frenar(d - rmin - .3, 3); if (bo.bloqPor === p || (bo.v || 0) < .05) p.ladoObj = .45; }   // cede el paso (y se corre si el otro lo espera)
        if (l < lim) { lim = l; p.bloqPor = bo; }
      }
    }
    return lim;
  }

  /* ═════════ conducir y caminar ═════════ */
  function* conducir(a, r, op = {}) {
    const rev = !!op.rev, vmax = op.vmax ?? (rev ? a.vmax * .45 : a.vmax), fin = op.hasta ?? r.largo;
    const zonas = zonasDe(r, 'v'); let s = op.desde ?? 0; a.rev = rev; a.flujoE = !!op.flujoE;
    a.mx = r.en(s).dx; a.mz = r.en(s).dz;
    while (s < fin - .004) {
      const dt = yield;
      let lim = Math.min(vmax * (op.lento ? op.lento(s) : 1), frenar(fin - s, a.dec) + .04);
      const lead = rev ? a.atras : a.frente0, tail = rev ? a.frente0 : a.atras;
      for (const z of zonas) {
        if (s - tail > z.sOut + .2) continue;
        const dentro = s + lead >= z.sIn; const d = dentro ? 0 : z.sIn - (s + lead);
        z.c.reportar(a, d);
        if (!dentro && z.c.puedePasar && !z.c.puedePasar(a)) lim = Math.min(lim, frenar(d - .5, a.dec));
      }
      const lo = limiteObstaculos(a, vmax, op.ignora, r, s); a.dbg = { zonas: lim, obs: lo, fin: fin - s, quien: a.obsNom }; lim = Math.min(lim, lo);
      if (op.tope) lim = Math.min(lim, op.tope());
      a.v = acercar(a.v, lim, dt, a.ac, a.dec * (lim === 0 ? 2.2 : 1));
      // dos equipos que se bloquean mutuamente: el que no tiene el paso del gestor retrocede por su propia ruta
      const otro = a.obsDe; a.bloqT = a.v < .03 && otro && otro.obsDe === a && (otro.v || 0) < .03 ? (a.bloqT || 0) + dt : 0;
      if (a.bloqT > 4 && S.cruces?.I?.dueno !== a && a.idx > (otro.idx ?? -1) - (S.cruces?.I?.dueno === otro ? 99 : 0)) { a.atrasDe = (a.atrasDe || 0); }
      if (a.bloqT > 4 && S.cruces?.I?.dueno !== a && a.retro == null) a.retro = 1.6;
      if (a.retro != null) { const d = Math.min(a.retro, .45 * dt); a.retro -= d; s = Math.max(op.desde ?? 0, s - d); a.v = 0; poner(a, r.en(s), rev); a.s = s; if (a.retro <= 0) { a.retro = null; a.bloqT = 0; a.obsDe = null; } continue; }
      s = Math.min(fin, s + a.v * dt); poner(a, r.en(s), rev); a.s = s;
      if (op.cada) op.cada(s);
      if (op.corta && op.corta(s)) break;
    }
    if (op.parar !== false) a.v = 0;
    return s;
  }
  function* girar(a, a1, t = 1.2) { const a0 = a.g.rotation.y; let d = a1 - a0; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; yield* durante(t, (q) => { a.g.rotation.y = a0 + d * suave(q); }); }
  function* avanzar(a, dist, t) { const x0 = a.g.position.x, z0 = a.g.position.z, ry = a.g.rotation.y, dx = Math.cos(ry), dz = -Math.sin(ry); yield* durante(t, (q) => { const e = suave(q); a.g.position.x = a.x = x0 + dx * dist * e; a.g.position.z = a.z = z0 + dz * dist * e; }); }

  function* caminar(p, r, op = {}) {
    const zonas = zonasDe(r, 'p'); let s = 0; const vmax = op.v ?? 1.1; p.protegido = true;
    const estado = zonas.map(() => 0);   // 0 antes · 1 comprometido · 2 pasado
    while (s < r.largo - .004) {
      const dt = yield; let lim = Math.min(vmax, frenar(r.largo - s, 2) + .03); let quieto = false;
      zonas.forEach((z, i) => {
        if (estado[i] === 2) return;
        const d = z.sIn - s - (p.adelante || 0);   // con carro: cuenta desde la punta del carro
        if (estado[i] === 0) {
          if (d < 2.2) z.c.solicitar(p);
          if (d < 1.0) { if (z.c.peatonPuede(p)) { estado[i] = 1; z.c.entrar(p); } else { lim = Math.min(lim, frenar(d - .75, 2)); if (d < .8) quieto = true; } }
        }
        if (estado[i] === 1) { if (d < .35 && d > -.2 && !z.c.puertaAbierta(p)) lim = 0; if (s > z.sOut + .45 + (p.adelante ? .2 : 0)) { estado[i] = 2; z.c.salir(p); } }
      });
      p.protegido = !zonas.some((z, i) => estado[i] === 1 && s > z.sIn - .2);
      // incorporarse al sendero: si viene alguien por él, espera en el borde
      if (p.entrada == null) { p.entrada = []; let fuera = !enSendero(r.en(0)); for (let q = 0; q <= r.largo; q += .05) { const e = !enSendero(r.en(q)); if (fuera && !e && r.en(q).x > P.NAVE.x0 + .5) p.entrada.push(q); fuera = e; } p.rEntrada = r; }
      if (p.rEntrada !== r) p.entrada = null;
      else for (const q of p.entrada) { const d = q - s; if (d > 0 && d < 1.2 && !zonas.some((z, i) => estado[i] === 1)) { const pt = r.en(q);
        for (const b of S.cuerpos) { if (b === p || b === p.carroB || !b.g.visible || !(b.persona || b.empujado) || !enSendero(b)) continue; const dx = pt.z - b.z, vv = (b.vz || 0) * Math.sign(dx); if ((Math.abs(dx) < .8 && Math.abs(pt.x - b.x) < .7) || (vv > .2 && Math.abs(dx) < 3.4)) lim = Math.min(lim, frenar(d - .45, 3)); } } }
      p.prio = p.carroB ? 0 : enSendero(r.en(s)) && enSendero(r.en(Math.min(r.largo, s + 1.2))) ? 1 : 2;
      // convivir con las demás personas y carros: seguir al de adelante, ceder el paso según prioridad, nunca atravesar a nadie
      lim = Math.min(lim, cederPaso(p, vmax));
      // equipos y carros de equipos: predecir el cruce y detenerse antes (nadie se mete bajo un equipo, ni antes ni después)
      for (const b of S.cuerpos) { if (b.persona || b.empujado || b.duenio === p || !b.g.visible || b.camion) continue;
        const dueno = b.duenio || b; if (dueno.esperaA === p && dueno.v < .05) continue;      // el equipo me está esperando: paso
        const rx = b.x - p.x, rz = b.z - p.z, d = Math.hypot(rx, rz); if (d > 6) continue;
        const vx = p.mx * vmax, vz = p.mz * vmax, rvx = (b.vx || 0) - vx, rvz = (b.vz || 0) - vz, rv2 = rvx * rvx + rvz * rvz;
        const t = rv2 > 1e-6 ? clamp(-(rx * rvx + rz * rvz) / rv2, 0, 2.2) : 0, cx = rx + rvx * t, cz = rz + rvz * t, dm = Math.hypot(cx, cz);
        const ux = dm > 1e-4 ? cx / dm : p.mx, uz = dm > 1e-4 ? cz / dm : p.mz;
        if (dm < ext(p, ux, uz) + ext(b, ux, uz) + .25 && (rx * p.mx + rz * p.mz) > -.3) lim = Math.min(lim, frenar(d - ext(b, p.mx, p.mz) - .55, 3)); }
      p.v = acercar(p.v || 0, lim, dt, 1.6, 3.5); s = Math.min(r.largo, s + p.v * dt);
      p.lat = lerp(p.lat || 0, p.ladoObj || 0, Math.min(1, dt * 3));
      const q = r.en(s); p.g.position.x = p.x = q.x - q.dz * p.lat; p.g.position.z = p.z = q.z + q.dx * p.lat; p.mx = q.dx; p.mz = q.dz; p.g.rotation.y = rumbo(q.dx, q.dz);
      md.andar(p.m, clamp(p.v / .9), S.reloj + p.fase);
      if (p.arrastra) p.arrastra(s, r);
    }
    p.v = 0; md.andar(p.m, 0, 0); p.protegido = true;
  }

  /* ═════════ agentes ═════════ */
  const VEH = (m, op) => { const a = { g: m.g, m, v: 0, vmax: op.vmax ?? 2.2, ac: 1.2, dec: 2.4, ancho: op.ancho ?? 1.15, hw: (op.ancho ?? 1.15) / 2, hl: op.hl ?? ((op.frente ?? 1.5) + (op.atras ?? 1.2)) / 2, frente0: op.frente ?? 1.5, atras: op.atras ?? 1.2, radio: op.radio ?? 1.1, x: 0, z: 0, fx: 1, fz: 0, mx: 1, mz: 0 }; m.g.parent?.remove(m.g); raiz.add(m.g); a.idx = S.agentes.length; S.vehiculos.push(a); S.agentes.push(a); S.cuerpos.push(a); return a; };
  const PER = (tipo, op = {}) => { const m = md.persona(tipo, raiz); const a = { g: m.g, m, v: 0, x: 0, z: 0, mx: 1, mz: 0, radio: .3, hl: .2, hw: .27, persona: true, fase: Math.random() * 10, protegido: true, ...op }; a.idx = S.agentes.length; S.peatones.push(a); S.agentes.push(a); S.cuerpos.push(a); return a; };
  const poneEn = (a, x, z, ry) => { a.g.position.set(x, 0, z); a.g.rotation.y = ry; a.x = x; a.z = z; };

  const m2 = H.m2;
  /* ── controladores de esta simulación ── */
  const PG = P.PASILLO_G, SH = P.SENDERO_H, W1 = P.W1, NB = -3.1, SB = -1.5;   // pistas del pasillo de grúas: hacia +z (NB) y hacia −z (SB)
  const cD1 = cruceSistema(H.cruces.D1, H.cruces.D1.rect);
  const cD2 = cruceCebra({ x0: SH.x0 - .1, x1: SH.x1 + .1, z0: W1.d2[0], z1: W1.d2[1] });
  const cH1 = cruceCebra({ x0: P.CEBRA_H1.x0, x1: P.CEBRA_H1.x1, z0: -10.3, z1: -5.8 });
  const cH2 = cruceCebra({ x0: P.CALLES[0].x0, x1: P.CALLES[0].x1, z0: P.CEBRA_H2.z0, z1: P.CEBRA_H2.z1 + .6 });
  const cR2 = cruceCebra({ x0: P.CEBRA_REC2.x - P.CEBRA_REC2.ancho / 2, x1: P.CEBRA_REC2.x + P.CEBRA_REC2.ancho / 2, z0: P.CEBRA_REC2.z0, z1: P.CEBRA_REC2.z1 });
  const cR = cruceCebra({ x0: P.CEBRA_REC.x - P.CEBRA_REC.ancho / 2, x1: P.CEBRA_REC.x + P.CEBRA_REC.ancho / 2, z0: P.CEBRA_REC.z0, z1: P.CEBRA_REC.z1 });
  const cI = interseccion({ x0: PG.x0, x1: W1.x - .3, z0: Math.min(W1.d1[0] - 1.6, P.pasillo('01').z0 - 1.0), z1: Math.max(W1.d1[1] + 1.4, P.pasillo('01').z1 + 1.7) }, H.gestor);   // cubre el barrido de las horquillas al girar
  S.cruces = { D1: cD1, D2: cD2, H1: cH1, H2: cH2, R: cR, I: cI };

  /* ── pallets operativos de los racks ── */
  const huecos = H.huecos.filter((h) => h.oper);
  let semilla = 9; const azar = () => ((semilla = (semilla * 16807) % 2147483647) / 2147483647);
  const nuevoPallet = (tipo = azar() < .35 ? 'film' : 'caja') => { const p = md.pallet(raiz, tipo, .6 + azar() * .2); k.fusionar(p); return p; };
  for (const h of huecos) { if (azar() < .3) continue; const p = nuevoPallet(); p.position.set(h.x, h.y, h.z); p.rotation.y = Math.PI / 2; h.p = p; }
  const tomarDe = (h, carro) => { const p = h.p; h.p = null; carro.add(p); p.position.set(.56, .045, 0); p.rotation.set(0, 0, 0); return p; };
  function soltar(a, padre, h) { const p = a.carga, w = new THREE.Vector3(); p.getWorldPosition(w); padre.worldToLocal(w); padre.add(p); p.position.copy(w); p.rotation.set(0, padre === raiz ? a.g.rotation.y : 0, 0); if (h) { h.p = p; p.position.set(h.x, h.y, h.z); p.rotation.y = Math.PI / 2; } a.carga = null; return p; }
  const tomarPiso = (a, p) => { a.m.carro.add(p); p.position.set(.56, .045, 0); p.rotation.set(0, 0, 0); a.carga = p; };

  function grua() { const m = md.montacargas(raiz); const a = VEH(m, { vmax: 2.2, frente: 1.5, atras: 1.25, ancho: 1.12, radio: 1.15 }); a.carga = null; a.alza = 0; a.levantar = (q) => { a.alza = q; m.levantar(q); };
    a.techo = () => Math.max(2.14 + Math.max(0, a.alza - .12), a.carga ? .1 + a.alza + .045 + .13 + .75 : 0); return a; }
  // pasillo n (a lo largo de x): la grúa espera adentro mirando a la salida (+x); entra en reversa hasta el hueco, gira 90°, opera y vuelve
  function* operarHueco(a, h, accion) {
    const c = P.pasillo(h.pasillo).c, fz = h.norte ? 1 : -1;               // el rack está al +z (norte) o al −z del pasillo
    if (Math.abs(h.x - a.x) > .05) yield* conducir(a, ruta([[a.x, c], [h.x, c]]), { rev: true, vmax: 1.2 });
    a.opera = true; yield* girar(a, rumbo(0, fz), 1.3);
    const d = Math.abs((h.z - fz * 1.46) - c), apoyo = h.y - .145;
    if (accion === 'tomar') { yield* durante(Math.max(.6, apoyo * .6), (q) => a.levantar(lerp(a.alza, apoyo - .05, q))); yield* avanzar(a, d, 1.3 * d + .5); yield* durante(.25, (q) => a.levantar(lerp(apoyo - .05, apoyo, q))); a.carga = tomarDe(h, a.m.carro); yield* durante(.35, (q) => a.levantar(lerp(apoyo, apoyo + .06, q))); }
    else { yield* durante(Math.max(.6, apoyo * .6), (q) => a.levantar(lerp(a.alza, apoyo + .07, q))); yield* avanzar(a, d, 1.3 * d + .5); yield* durante(.3, (q) => a.levantar(lerp(apoyo + .07, apoyo, q))); soltar(a, raiz, h); yield* durante(.25, (q) => a.levantar(lerp(apoyo, apoyo - .05, q))); }
    yield* avanzar(a, -d, 1.3 * d + .5);
    if (!(a.olvida && accion === 'tomar')) yield* durante(Math.max(.6, Math.abs(a.alza - .15) * .6), (q) => a.levantar(lerp(a.alza, .15, q)));
    yield* girar(a, 0, 1.3); a.opera = false;
  }
  // volver al pasillo n por la pista SB: pasa la boca y entra en reversa
  function* aCasa(a, n, desde, cruza = false) { const c = P.pasillo(n).c; yield* conducir(a, ruta([...desde, [SB, c - 2.8]], 1.3), { flujoE: cruza }); yield* conducir(a, ruta([[SB, c - 2.8], [SB, c], [-6.2, c]], 2.0), { rev: true, vmax: 1.1, flujoE: true }); }

  /* ── andén de recepción: camión (recepción y despacho alternados) + F1 y F2 ── */
  const dock = { listo: false, modo: 'despacho', slots: [null, null, null, null], reserva: 0, reservaR: 0, ocupado: null, camion: null };
  const SLOT_X = [2.9, 1.7, .5, -.7], AZ = P.ANDEN.z, ESPERA = -4.8;
  function* alAnden(a, n, modo) {
    const c = P.pasillo(n).c;
    yield* conducir(a, ruta([[a.x, c], [NB, c], [NB, AZ], [ESPERA, AZ]], 1.3), { flujoE: true });
    yield* hasta(() => dock.listo && !dock.ocupado && dock.modo === modo);
    dock.ocupado = a;
    let i = modo === 'despacho' ? dock.slots.findIndex((x) => !x) : dock.slots.map((x, j) => (x ? j : -1)).filter((j) => j >= 0).pop();
    if (i == null || i < 0) { dock.ocupado = null; return false; }
    const cam = dock.camion, sx = cam.g.position.x - SLOT_X[i], cx = sx + 1.46, piso = -.02, apoyo = piso - .145;
    yield* conducir(a, ruta([[ESPERA, AZ], [cx, AZ]]), { vmax: 1.4, ignora: cam });
    if (modo === 'despacho') { yield* durante(.7, (q) => a.levantar(lerp(.15, apoyo, q))); const p = soltar(a, cam.g); p.position.set(SLOT_X[i], 1.18, 0); p.rotation.set(0, 0, 0); dock.slots[i] = p; yield* durante(.3, (q) => a.levantar(lerp(apoyo, apoyo - .04, q))); }
    else { yield* durante(.5, (q) => a.levantar(lerp(.15, apoyo - .04, q))); const p = dock.slots[i]; dock.slots[i] = null; yield* durante(.25, (q) => a.levantar(lerp(apoyo - .04, apoyo, q))); tomarPiso(a, p); yield* durante(.5, (q) => a.levantar(lerp(apoyo, .15, q))); }
    // sale en reversa girando hacia el norte (queda mirando a los racks) y vuelve por la pista SB
    yield* conducir(a, ruta([[cx, AZ], [-8.6, AZ], [-7.4, AZ + 1.2], [-7.4, AZ + 1.9]], 1.0), { rev: true, vmax: 1.0, ignora: cam });
    if (modo === 'despacho') dock.reserva--;
    dock.ocupado = null;
    yield* aCasa(a, n, [[-7.4, AZ + 1.9], [-7.4, AZ - 1.65], [-2.8, AZ - 1.65], [SB, AZ - 3.0]]);
    return true;
  }
  function gruaAnden(n) {
    const a = grua(), c = P.pasillo(n).c; poneEn(a, -6.2, c, 0); a.levantar(.15);
    a.it = (function* () {
      yield;
      while (true) {
        yield* esperar(.6 + azar());
        if (dock.listo && dock.modo === 'despacho' && dock.slots.filter(Boolean).length + dock.reserva < 4) {
          const llenos = huecos.filter((h) => h.pasillo === n && h.p && h.y < 2); if (!llenos.length) continue;
          dock.reserva++; yield* operarHueco(a, llenos[Math.floor(azar() * llenos.length)], 'tomar');
          if (!(yield* alAnden(a, n, 'despacho'))) { dock.reserva--; }
        } else if (dock.listo && dock.modo === 'recepcion' && dock.slots.filter(Boolean).length - dock.reservaR > 0) {
          dock.reservaR++; const ok = yield* alAnden(a, n, 'recepcion'); dock.reservaR--;
          if (ok && a.carga) { const libres = huecos.filter((h) => h.pasillo === n && !h.p && h.y < 2); const h = libres[Math.floor(azar() * libres.length)]; if (h) yield* operarHueco(a, h, 'dejar'); }
        }
      }
    })();
    return a;
  }
  const F1 = gruaAnden('01'), F2 = gruaAnden('02');
  { const m = md.camion(raiz); const a = VEH(m, { vmax: 3.0, frente: 5.9, atras: 3.6, ancho: 2.5, radio: 2.2, hl: 4.75 }); a.g.position.y = H.NIVEL_PATIO; a.camion = true; dock.camion = a; a.g.visible = false;
    const DOCKX = P.NAVE.x0 - .25 - 3.52, CUNA0 = DOCKX + 3.25, CUNA1 = DOCKX + 2.2;
    a.it = (function* () {
      yield; let ciclo = 0;
      while (true) {
        yield* esperar(ciclo ? 8 : .5); ciclo++; a.g.visible = true;
        yield* conducir(a, ruta([[-23.0, 44], [-23.0, AZ], [-27.5, AZ]], 3.4), { vmax: 3.0 });
        yield* conducir(a, ruta([[-27.5, AZ], [DOCKX, AZ]]), { rev: true, vmax: 1.2 });
        yield* durante(1.6, (q) => { H.dock.cuna.position.x = lerp(CUNA0, CUNA1, q < .6 ? q / .6 : 1); H.dock.cuna.position.z = lerp(AZ + 1.75, AZ + 1.08, q < .6 ? 0 : (q - .6) / .4); });
        dock.modo = dock.slots.some(Boolean) ? 'recepcion' : 'despacho'; dock.listo = true;
        yield* hasta(() => (dock.modo === 'despacho' ? dock.slots.filter(Boolean).length === 4 : !dock.slots.some(Boolean)) && !dock.ocupado);
        yield* esperar(2); dock.listo = false;
        yield* durante(1.4, (q) => { H.dock.cuna.position.z = lerp(AZ + 1.08, AZ + 1.75, q < .4 ? q / .4 : 1); H.dock.cuna.position.x = lerp(CUNA1, CUNA0, q < .4 ? 0 : (q - .4) / .6); });
        yield* conducir(a, ruta([[DOCKX, AZ], [-24.5, AZ], [-24.5, 44]], 3.4), { vmax: 3.0 });
        a.g.visible = false;
      }
    })();
  }

  /* ── F3: pasillo 03 ↔ hall por D1 (Safety Gate). Una de cada dos veces el operador olvida bajar la carga ── */
  const F3 = grua(); { const c = P.pasillo('03').c; poneEn(F3, -6.2, c, 0); F3.levantar(.15); }
  const MAT = P.HALL_MAT.spots.slice(0, 1).map(([x, z]) => ({ x, z, p: null })); { const p = nuevoPallet('film'); p.position.set(MAT[0].x, 0, MAT[0].z); MAT[0].p = p; }
  S.sg = { golpe: null, amp: 0 };
  F3.it = (function* () {
    yield; const a = F3, c = P.pasillo('03').c, ZD = (W1.d1[0] + W1.d1[1]) / 2; let llevadas = 0;
    while (true) {
      yield* esperar(1 + azar() * 2);
      const vacio = MAT.find((m) => !m.p), lleno = MAT.find((m) => m.p), lleva = vacio && (!lleno || azar() < .5);
      if (lleva) { llevadas++; a.olvida = llevadas % 2 === 1; const ok = huecos.filter((h) => h.pasillo === '03' && h.p && (a.olvida ? h.y > 2 : h.y < 2)); if (!ok.length) { a.olvida = false; continue; } yield* operarHueco(a, ok[Math.floor(azar() * ok.length)], 'tomar'); }
      const sp = lleva ? vacio : lleno;
      // al hall: pista NB, gira hacia D1, cruza el sendero (cruce estándar) y llega a la ubicación
      const ida = ruta([[a.x, c], [NB, c], [NB, ZD], [sp.x - 1.46, ZD]], 1.3);
      const xTubo = H.sg.g.position.x - .075; let choque = false;
      const s1 = yield* conducir(a, ida, { flujoE: true, corta: (s) => { const q = ida.en(s); if (q.dx > .7 && a.techo() > H.sg.y - .075 && q.x + (a.carga ? 1.96 : 1.45) >= xTubo && !S.sg.golpe) { choque = true; return true; } return false; } });
      if (choque) {
        const v = a.v; a.v = 0; S.sg.golpe = S.reloj; S.sg.amp = Math.min(.5, .22 + v * .16);
        yield* esperar(.22); yield* avanzar(a, -.55, .65); yield* esperar(.6);
        yield* durante(1.4, (q) => a.levantar(lerp(a.alza, .15, q))); a.olvida = false; yield* esperar(1.0);
        yield* conducir(a, ida, { desde: Math.max(0, s1 - .55) });
      }
      const piso = 0, apoyo = piso - .145;
      if (lleva) { yield* durante(.6, (q) => a.levantar(lerp(a.alza, apoyo, q))); const p = soltar(a, raiz); p.position.set(sp.x, 0, sp.z); p.rotation.set(0, 0, 0); sp.p = p; yield* durante(.3, (q) => a.levantar(lerp(apoyo, apoyo - .04, q))); }
      else { yield* durante(.5, (q) => a.levantar(lerp(.15, apoyo - .04, q))); const p = sp.p; sp.p = null; yield* durante(.25, (q) => a.levantar(lerp(apoyo - .04, apoyo, q))); tomarPiso(a, p); yield* durante(.5, (q) => a.levantar(lerp(apoyo, .15, q))); }
      yield* conducir(a, ruta([[sp.x - 1.46, ZD], [-.4, ZD], [SB, ZD + 1.1]], 1.0), { rev: true, vmax: 1.0, flujoE: true });
      if (a.alza > .2) yield* durante(.5, (q) => a.levantar(lerp(a.alza, .15, q)));
      yield* aCasa(a, '03', [[SB, ZD + 1.1], [SB, ZD - .4]], false);
      if (!lleva && a.carga) { const libres = huecos.filter((h) => h.pasillo === '03' && !h.p && h.y < 2); const h = libres[Math.floor(azar() * libres.length)]; if (h) yield* operarHueco(a, h, 'dejar'); }
    }
  })();

  /* ── AGV: circuito del hall; retiran cajas en el supermercado y las dejan en el taladro y el torno ── */
  const R_AGV = ruta([...P.AGV, P.AGV[0]], 1.0);
  const paradas = [{ s: R_AGV.cerca(P.AGV[0][0], 3.3).s, tipo: 'carga' }, { s: R_AGV.cerca(P.TALADRO.x, P.AGV[0][1]).s, tipo: 'deja' }, { s: R_AGV.cerca(P.AGV[1][0], P.ENSAMBLE.zMesa).s, tipo: 'deja' }].sort((x, y) => x.s - y.s);
  S.agvs = [0, .5].map((f, j) => {
    const m = m2.agv(raiz), a = VEH(m, { vmax: .9, frente: .55, atras: .55, ancho: .74, radio: .6, hl: .52 }); a.agv = true;
    const s0 = R_AGV.largo * f; poner(a, R_AGV.en(s0), false);
    a.it = (function* () { yield; let s = s0;
      while (true) {
        const sig = paradas.find((p) => p.s > s + .05) || paradas[0];
        if (sig.s <= s) { s = yield* conducir(a, R_AGV, { desde: s }); s = 0; continue; }
        s = yield* conducir(a, R_AGV, { desde: s, hasta: sig.s });
        yield* esperar(1.2); m.carga.visible = sig.tipo === 'carga' ? true : (m.carga.visible && false); yield* esperar(1.0);
      } })();
    return a; });

  /* ── expedición: pallets con cajas listos para salir (la transpaleta eléctrica entra en la próxima versión) ── */
  P.EXPED.spots.forEach(([x, z], i) => { if (i % 2) return; const p = md.pallet(raiz, 'nada'); for (const [dx, dz] of [[-.24, -.28], [.24, -.28], [-.24, .28], [.24, .28]]) k.caja(.44, .28, .5, dx, .13, dz, md.BIN[0], p, .05); p.position.set(x, 0, z); k.fusionar(p); });

  /* ── personas ── */
  function vaiven(p, ida, op = {}) {
    const d = op.lado ?? .4, rI = ruta(derecha(ida, d), .6), rV = ruta(derecha([...ida].reverse(), d), .6);
    const q = rI.en(0); poneEn(p, q.x, q.z, rumbo(q.dx, q.dz));
    p.it = (function* () { yield; yield* esperar(op.desfase ?? 0); while (true) { yield* caminar(p, rI); if (op.alLlegar) yield* op.alLlegar(p); yield* esperar(op.pausa ?? 4); yield* caminar(p, rV); if (op.alVolver) yield* op.alVolver(p); yield* esperar(op.pausa0 ?? 3); } })();
    return p;
  }
  const PD = (P.PUERTA_P[0] + P.PUERTA_P[1]) / 2, SA = P.SENDERO_A;
  vaiven(PER('operario'), [[-11.6, P.PUERTA_REC.z], [SA.c, P.PUERTA_REC.z], [SA.c, PD], [SH.c, PD], [SH.c, P.STANDBOARD.z + .4], [1.95, P.STANDBOARD.z + .4]], { pausa: 9, pausa0: 4, lado: 0 });
  vaiven(PER('visita'), [[-11.2, 11.3], [P.CEBRA_REC2.x, 11.3], [P.CEBRA_REC2.x, 5.0]], { pausa: 5, desfase: 6 });
  vaiven(PER('supervisor'), [[4.0, 12.8], [4.0, 10.2], [8.2, 10.2], [8.2, -.35], [11.0, -.35]], { pausa: 7, desfase: 2 });
  { const fria = P.CAMARA_FRIA; S.puertaFria = 0;
    vaiven(PER('operario'), [[2.6, -7.0], [fria.puerta, -7.0], [fria.puerta, fria.z1 - 2.2]], { pausa: 7, desfase: 4 }); }
  // en su puesto
  const fijo = (tipo, x, z, ry, extra = {}) => { const p = PER(tipo); poneEn(p, x, z, ry); Object.assign(p, extra); return p; };
  fijo('operario', P.MAQUINA.x - 1.5, -.6, 0, { trabajo: 1 });
  fijo('operario', P.TALADRO.x - .95, P.TALADRO.z, 0, { trabajo: 1 });
  fijo('operario', P.TORNO.x, P.TORNO.z - .95, -Math.PI / 2, { trabajo: 1 });
  fijo('operario', P.FRESA.x - .95, P.FRESA.z, 0, { trabajo: 1 });
  P.ENSAMBLE.estaciones.forEach((ex) => fijo('operario', ex, P.ENSAMBLE.zMesa + 1.0, Math.PI / 2, { trabajo: 1 }));
  [[2.4, 28.9], [5.2, 31.9]].forEach(([x, z]) => { const p = fijo('oficina', x, z, Math.PI / 2); md.sentar(p.m); md.brazos(p.m, 1.1); });
  [[2.6, 14.8], [4.0, 15.0], [5.4, 14.8]].forEach(([x, z], i) => fijo(i ? 'operario' : 'supervisor', x, z, -Math.PI / 2, { reunion: i }));
  fijo('oficina', P.VENDING.x, P.VENDING.z - 1.0, -Math.PI / 2, { cafe: 1 });

  /* ═════════ paso de simulación ═════════ */
  S.paso = (dt) => {
    S.reloj += dt;
    S.ctl.forEach((c) => c.inicio());
    for (const a of S.agentes) if (a.it) { if (!a.iniciado) { a.it.next(); a.iniciado = true; } a.it.next(dt); }
    S.ctl.forEach((c) => c.actualizar && c.actualizar(dt));
    for (const b of S.cuerpos) { if (b.px != null && dt > 0) { b.vx = (b.x - b.px) / dt; b.vz = (b.z - b.pz) / dt; } b.px = b.x; b.pz = b.z; }
    for (const p of S.peatones) {
      if (p.trabajo) { const t = S.reloj * 1.7 + p.idx; md.brazos(p.m, .9 + Math.sin(t) * .25, .1); p.m.bd.rotation.x = -.9 - Math.sin(t + 1.4) * .3; }
      if (p.reunion != null) { const t = S.reloj * .7 + p.reunion * 2.1; if (p.reunion === 0) p.m.bd.rotation.x = -1.2 - Math.sin(t) * .3; else p.m.c.rotation.y = Math.PI / 2 + Math.sin(t) * .12; }
      if (p.cafe) p.m.bd.rotation.x = -1.6 - Math.max(0, Math.sin(S.reloj * .8)) * .9;
    }
    // cámara fría: la puerta corredera se abre cuando alguien llega y el copo se proyecta mientras está abierta
    { const f = P.CAMARA_FRIA, cerca = S.peatones.some((p) => Math.abs(p.x - f.puerta) < 1.4 && p.z > f.z1 - 3.2 && p.z < f.z1 + 2.2); S.puertaFria = clamp(S.puertaFria + (cerca ? 1.4 : -.9) * dt); }
    // robot: ciclo de pick & place
    S.robot = S.reloj;
    // Safety Gate: péndulo amortiguado (el tubo se aleja del equipo: hacia W1, +x)
    if (S.sg.golpe != null) { const t = S.reloj - S.sg.golpe; S.sg.ang = S.sg.amp * Math.exp(-t * 1.05) * Math.sin(t * 4.6); S.sg.alarma = t < 4.5; if (t > 8) S.sg.golpe = null; } else { S.sg.ang = 0; S.sg.alarma = false; }
    // riesgos que se verían sin Neisstech (para el lado «antes»): equipo a menos de 2,6 m de una persona
    S.riesgos = [];
    for (const v of S.vehiculos) { if (!v.g.visible || v.camion || v.v < .2) continue; for (const p of S.peatones) { const d = Math.hypot(v.x - p.x, v.z - p.z); if (d < 2.6 && !p.trabajo && p.reunion == null) S.riesgos.push({ x: (v.x + p.x) / 2, z: (v.z + p.z) / 2 }); } }
    S.dock = dock;
  };
  return S;
}
