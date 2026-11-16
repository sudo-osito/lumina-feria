/* Planta Neisstech v5 · demostraciones (14-nov-2026, rehechas). Cada una cuenta el problema (antes) y la solución
   funcionando (después) solo con imagen: cámara que sigue la acción, recorridos dibujados en el piso, el punto de
   conflicto que late, el equipo Neisstech que brilla cuando actúa, cámara lenta y destello en el momento clave, y un
   foco que oscurece lo que no importa. Los textos de la ficha vienen de las páginas de solución (fuente/paginas). */
import { THREE, clamp, lerp, eio } from '../planta/nucleo.js';
import { ruta, rumbo } from '../planta/mapa.js';
import * as P from './trazado.js';
import { crearFx } from './fx.js';

const dif = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };
const { Bs, Bn, Ee, Ew, Ae } = P.PISTA;
const ROJO = 0xFF3B3B, AMAR = 0xFFC83D, AZUL = 0x2F86FF, VERDE = 0x2ED47A, OSC = 0x1B1D22;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const VEL = 1.4;   // las demostraciones corren un 40 % más rápido que la simulación

export function crearEscenas(k, H, S) {
  const { md, eq } = H, raiz = k.grupo(); raiz.userData.vivo = true;
  const E = { sacudida: 0 };
  const altura = (x, z) => { for (const an of P.ANDENES) if (x > an.x - 1.3 && x < an.x + 1.3 && z > -2.3 && z < 5) return 0; return P.suelo(x, z); };
  const ok = (x, z, texto, y = 0) => S.evento(x, z, 'ok', y, texto, true);
  const mal = (x, z, tipo, texto, y = 0) => S.evento(x, z, tipo, y, texto, false);

  const { brillo, aro, trazo, abanico, destello, enlace, estelas } = crearFx(k, altura);

  /* ═════════ actores ═════════ */
  function actor(obj, tipo) { return { obj, tipo, r: null, s: 0, v: 0, vObj: 0, acel: 1.6, dec: 3, rev: false, th: 0, x: 0, z: 0 }; }
  function grua(padre, carga) { const m = md.montacargas(padre); k.fusionar(m.cuerpo); m.carga.visible = !!carga; const a = actor(m.g, 'grua'); a.m = m; a.alto = a.altoObj = .18; a.carga = !!carga; return a; }
  function persona(padre, tipo = 'operario') { const p = md.persona(tipo, padre); p.c.rotation.order = 'YXZ'; const a = actor(p.g, 'persona'); a.p = p; a.acel = 3; a.dec = 6; return a; }
  function camino(a, pts, { radio = 1.1, rev = false, v = 0, vObj } = {}) {
    a.r = ruta(pts, radio); a.s = 0; a.rev = rev; a.v = v; a.vObj = vObj ?? v; a.dec = a.tipo === 'persona' ? 6 : 3; const q = a.r.en(0); a.th = rumbo(rev ? -q.dx : q.dx, rev ? -q.dz : q.dz); colocar(a, 1);
  }
  function colocar(a, dt) {
    const q = a.r.en(a.s), fx = a.rev ? -q.dx : q.dx, fz = a.rev ? -q.dz : q.dz; a.th += dif(a.th, rumbo(fx, fz)) * Math.min(1, dt * 7);
    a.x = q.x; a.z = q.z; a.obj.position.set(q.x, a.y ?? altura(q.x, q.z), q.z); a.obj.rotation.y = a.th;
  }
  function mover(a, dt) {
    if (!a.r || !a.obj.visible) return;
    a.v = a.vObj > a.v ? Math.min(a.vObj, a.v + a.acel * dt) : Math.max(a.vObj, a.v - a.dec * dt);
    a.s = Math.min(a.r.largo, a.s + a.v * dt); if (a.s >= a.r.largo) a.v = 0;
    colocar(a, dt);
    if (a.p && !a.quieto) md.andar(a.p, Math.min(1, a.v / 1.3), S.reloj);
    if (a.m) { a.alto += (a.altoObj - a.alto) * Math.min(1, dt * 2.4); a.m.levantar(a.alto); a.m.carga.visible = a.carga; if (a.m.balMat) a.m.balMat.emissiveIntensity = a.v > .05 ? (Math.sin(S.reloj * 9) > 0 ? 2.4 : .3) : .25; if (a.m.spot) a.m.spot.visible = S.modo === 'despues' && a.v > .05; if (a.m.cams) a.m.cams.visible = S.modo === 'despues'; }
  }
  const adelante = (a, d) => [a.x + Math.cos(a.th) * d, a.z - Math.sin(a.th) * d];
  const parada = (a, dec = 9) => { a.vObj = 0; a.dec = dec; };
  const sigue = (a, v, dec = 3) => { a.vObj = v; a.dec = dec; };
  const susto = (a) => { a.quieto = true; md.brazos(a.p, 2.3, .45); a.p.c.rotation.x = -.18; };
  const calma = (a) => { a.quieto = false; md.brazos(a.p, 0, 0); a.p.c.rotation.x = 0; };
  const fin = (a) => a.s >= a.r.largo - .03;
  const pos = (a, y = 0) => V(a.x, altura(a.x, a.z) + y, a.z);

  /* ═════════ escenas ═════════ */
  const L = [];
  const def = (d) => { d.g = k.grupo(0, 0, 0, 0, raiz); d.g.visible = false; d.fx = { ds: destello(d.g) }; L.push(d); return d; };
  let lentoHasta = -1, lentoF = 1;
  const lento = (t, dur, f = .3) => { lentoHasta = t + dur; lentoF = f; };
  const golpe = (d, t, x, y, z, c = ROJO, s = .5) => { d.fx.ds.disparar(x, y, z, c, t); if (c === ROJO) E.sacudida = s; };

  /* 1 · Gestión de tráfico — cruce ciego del sendero con la calle E */
  def({ id: 'trafico', titulo: 'Gestión de tráfico', centro: [68, 16], radio: 16,
    crear(d) { d.G = grua(d.g, true); d.P = persona(d.g); d.tG = trazo(d.g, ROJO, .3); d.tP = trazo(d.g, AMAR, .22); d.tP2 = trazo(d.g, VERDE, .22); d.conf = aro(d.g, ROJO, .9); d.esp = aro(d.g, AMAR, .55);
      d.bK = brillo(d.g, AZUL, 1.6); d.bPu = brillo(d.g, ROJO, 1.0); d.ln = enlace(d.g, AZUL); },
    antes: { texto: 'Un punto ciego, dos recorridos. La pintura está gastada y nadie avisa a tiempo.', dur: 9.5,
      cam: [[0, { x: 69, z: 16.2, zoom: 7.4, az: -42, el: 50 }], [4.2, { x: 68.4, z: 16.0, zoom: 4.8, az: -42, el: 40, y: .8 }]],
      foco: (d, t) => t > 2.4 && { x: 68.2, y: .6, z: 15.8, r: 4.2 },
      montar(d) { camino(d.G, [[86, Ew], [64.6, Ew], [Bs, 18.4], [Bs, 30]], { radio: 1.6, v: 2.8 }); camino(d.P, [[68, 7.6], [68, 25]], { radio: .3, v: 1.25 });
        d.tG.set([[86, Ew], [64.6, Ew], [Bs, 18.4], [Bs, 24]], 1.6); d.tP.set([[68, 7.6], [68, 24]], .3); d.conf.at(68, 15.7); d.f = {}; },
      paso(d, t) { const { G, P: p, f } = d;
        d.tG.pintar(clamp(t / 1.4), .9, t); d.tP.pintar(clamp(t / 1.4), .9, t); d.conf.pintar(clamp((t - 2.4) * 2) * (f.casi ? 0 : 1), t);
        if (!f.casi && G.x <= 70.4 && p.z > 13.6 && p.z < 17.6) { f.casi = t; parada(G, 12); parada(p, 9); susto(p); lento(t, 1.5); golpe(d, t, 68.3, 1.1, 15.6); mal(68.2, 15.7, 'casi'); f.listo = t + 2.4; } } },
    despues: { texto: 'Si viene una grúa, el paso se apaga: el X-KUBE la detecta, pone rojo al peatón y proyecta la advertencia en el piso. Pasa la grúa y el paso vuelve a encenderse.', dur: 12,
      cam: [[0, { x: 69.4, z: 16.2, zoom: 7.4, az: -42, el: 48 }], [1.0, { x: 69.2, z: 16.0, zoom: 5.4, az: -42, el: 34, y: 1.8 }], [5.6, { x: 68.2, z: 16.4, zoom: 4.8, az: -42, el: 42, y: .6 }]],
      foco: (d, t) => (t < 5.4 ? { x: 69.2, y: 2, z: 15.8, r: 4.4 } : { x: 68.1, y: .6, z: 16.4, r: 3.6 }),
      montar(d) { camino(d.G, [[86, Ew], [64.6, Ew], [Bs, 18.4], [Bs, 30]], { radio: 1.6, v: 2.3 }); camino(d.P, [[68, 7.6], [68, 25]], { radio: .3, v: 1.25 });
        d.tG.set([[86, Ew], [64.6, Ew], [Bs, 18.4], [Bs, 24]], 1.6); d.tP.set([[68, 7.6], [68, 13.9]], .3); d.tP2.set([[68, 13.9], [68, 24]], .3); d.esp.at(68, 13.85); d.f = {};
        S.cruces.Z2.forzar = { veh: false }; S.cruces.Z1.forzar = { veh: false }; },
      paso(d, t) { const { G, P: p, f } = d, z2 = S.cruces.Z2.forzar, kb = H.cruces.Z2.holo.kb;
        d.tG.pintar(clamp(t / 1.4), .8, t); d.tP.pintar(clamp(t / 1.4), .85, t);
        if (t > .9 && !f.det) { f.det = t; z2.veh = true; ok(69.6, 15.9, 'Detecta la grúa: cruce en rojo', 3); }
        d.ln.pintar(z2.veh ? 1 : 0, kb.origen, pos(G, 1.2), t);
        d.bK.at(kb.origen.x, kb.origen.y + .3, kb.origen.z).pintar(z2.veh ? 1 : f.libT ? clamp(1 - (t - f.libT) * 2) : 0, t);
        d.bPu.at(67.6, 1.0, 14.55).pintar(z2.veh && t > 1.6 ? .8 : 0, t);
        if (z2.veh && p.z > 13.5 && p.z < 14.2) { parada(p, 5); d.esp.pintar(1, t); } else d.esp.pintar(0, t);
        if (f.det && !f.libT && G.x < 65.4) { f.libT = t; z2.veh = false; ok(67.8, 16.5, 'Pasa la grúa: se enciende el paso'); }
        if (f.libT && !f.listo) f.listo = f.libT + 3.0; if (f.libT && t > f.libT + .8) { sigue(p, 1.25, 5); d.tP2.pintar(clamp((t - f.libT - .8) / 1.5), .9, t); } else d.tP2.pintar(0, 0, t);
        S.cruces.Z1.forzar.veh = G.z > 15.6 && G.z < 22.5 && G.x < 66; } } });

  /* 2 · Safety Gate — la grúa va al norte por el portón central; el tubo cuelga del lado por donde llega */
  def({ id: 'safetygate', titulo: 'Safety Gate', centro: [65, 28], radio: 13, sinViga: true,
    crear(d) { d.G = grua(d.g, true); d.caja = k.caja(.5, .4, .55, 0, 0, 0, k.M.caja2, d.g, .03);
      d.lim = new THREE.Mesh(new THREE.BoxGeometry(7.4, .06, .34), new THREE.MeshBasicMaterial({ color: ROJO, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); d.lim.position.set(65, 2.98, 25.3); d.lim.renderOrder = 18; d.g.add(d.lim);
      d.bC = brillo(d.g, ROJO, 1.4); d.bB = brillo(d.g, AZUL, 2.6); d.tG = trazo(d.g, ROJO, .3); d.okA = aro(d.g, VERDE, 1.4); },
    antes: { texto: 'Activos dañados: una grúa llega al portón con la carga en alto y el golpe lo recibe la estructura.', dur: 7,
      cam: [[0, { x: 65.6, z: 28.6, zoom: 5.0, az: 52, el: 16, y: 1.8 }], [2.0, { x: 65.4, z: 26.6, zoom: 3.8, az: 52, el: 14, y: 2.3 }]],
      foco: () => ({ x: 65.4, y: 2.4, z: 26.2, r: 3.8 }),
      montar(d) { camino(d.G, [[Bn, 36], [Bn, 12]], { v: 2.6 }); d.G.alto = d.G.altoObj = 2.45; d.tG.set([[Bn, 36], [Bn, 25.3]], .5); d.caja.visible = false; d.f = {}; },
      paso(d, t) { const { G, f } = d, [, fz] = adelante(G, G.m.frente()); d.tG.pintar(clamp(t / 1), .7, t);
        d.lim.material.opacity = f.h ? .9 : clamp((t - .6) / 1.2) * (.45 + .3 * Math.sin(t * 7)); d.lim.visible = true;
        if (!f.h && fz <= 25.25) { f.h = t; G.v = 0; parada(G); lento(t, 1.1, .3); golpe(d, t, Bn, 3.0, 25.2, ROJO, .7); mal(Bn, 25.4, 'golpe', 'Golpe al portón', 3); d.caja.visible = true; f.listo = t + 2.6; }
        if (f.h) { const q = clamp((t - f.h) / 1.0); d.caja.position.set(Bn - .2 - q * .4, 3.3 - 3.3 * q * q, 25.5 + q * .7); d.caja.rotation.set(-q * 2.2, 0, q * 1.2); d.bC.at(Bn, 3.1, 25.3).pintar(clamp(1.6 - (t - f.h)), t); } } },
    despues: { texto: 'Para lo que va en altura, Safety Gate: si la grúa llega al portón con la carga arriba, el tubo avisa con luz y alarma.', dur: 8,
      cam: [[0, { x: 65.6, z: 29.6, zoom: 5.0, az: 52, el: 16, y: 1.8 }], [1.8, { x: 65.4, z: 27.8, zoom: 3.8, az: 52, el: 14, y: 2.2 }], [4.6, { x: 65.2, z: 26.6, zoom: 4.8, az: 52, el: 18, y: 1.4 }]],
      foco: () => ({ x: 65.4, y: 2.4, z: 27.4, r: 3.8 }),
      montar(d) { camino(d.G, [[Bn, 37], [Bn, 12]], { v: 2.6 }); d.G.alto = d.G.altoObj = 2.45; d.tG.set([[Bn, 37], [Bn, 27.2]], .5); d.caja.visible = false; d.lim.visible = false; d.f = {}; },
      paso(d, t) { const { G, f } = d, sg = H.sg.M1s, [, fz] = adelante(G, G.m.frente()); d.tG.pintar(clamp(t / 1), .6, t);
        if (!f.h && fz <= sg.z + .1) { f.h = t; G.v = 0; parada(G); lento(t, 1.0, .3); S.sg.M1s.golpe = S.reloj; S.sg.M1s.amp = .34; golpe(d, t, Bn, 2.85, sg.z, AZUL); ok(Bn, sg.z + .4, 'El tubo avisa: baja la carga', 2.9); }
        d.bB.at(Bn, 2.85, sg.z).pintar(f.h ? clamp(2.4 - (t - f.h)) : 0, t);
        if (f.h && t > f.h + .8) G.altoObj = .18; if (f.h && t > f.h + 2.3) sigue(G, 2.0);
        if (f.h && !f.listo && t > f.h + 2.3) f.listo = t + 2.0;
        d.okA.at(Bn, 25).pintar(f.h && t > f.h + 2.8 ? clamp((t - f.h - 2.8) * 2) : 0, t); } } });

  /* 3 · SmartDock — el andén 2 visto desde el patio, sin techo en el remolque: la cuña sale de su caja y se mete delante de la rueda */
  const A2 = P.ANDENES[1].x;
  const DOCK = { x: 65.6, z: 2.2, zoom: 5.2, az: 128, el: 50, y: -.6 };
  def({ id: 'smartdock', titulo: 'SmartDock', centro: [64, 3], radio: 14,
    crear(d) { d.T = eq.camion(d.g, 0x2F6FB0); d.T.g.rotation.y = Math.PI / 2; d.T.techo.visible = false;
      d.G = grua(d.g, true); d.tG = trazo(d.g, AZUL, .3); d.tT = trazo(d.g, AMAR, .3);
      d.gap = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1.1, 1), new THREE.MeshBasicMaterial({ color: ROJO, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); d.gap.renderOrder = 18; d.gap.visible = false; d.g.add(d.gap);
      d.bCu = brillo(d.g, AZUL, 1.6); d.bIn = brillo(d.g, VERDE, 1.2); d.bOut = brillo(d.g, ROJO, 1.4); d.aCu = aro(d.g, AZUL, .8); d.bR = brillo(d.g, ROJO, 1.1); },
    antes: { texto: 'El camión se adelanta: la grúa entra a cargar y no hay nada que lo bloquee.', dur: 8,
      cam: [[0, { ...DOCK, x: 64.8, z: 3.6, zoom: 4.4, el: 58 }], [2.0, { ...DOCK, x: 64.6, z: 4.2, zoom: 3.4, el: 60, y: -.3 }]],
      foco: () => ({ x: 64.6, y: -.4, z: 3.6, r: 3.6 }),
      montar(d) { d.T.g.position.set(A2, P.NIVEL_PATIO, 1.35); camino(d.G, [[A2, 8.4], [A2, 2.4]], { v: 1.9 }); d.G.alto = d.G.altoObj = .25; d.G.carga = true; d.tG.set([[A2, 8.4], [A2, 2.6]], .3).color(ROJO); d.f = {}; },
      paso(d, t) { const { T, G, f } = d, [, fz] = adelante(G, G.m.frente()); d.tG.pintar(clamp(t / 1), .7, t);
        if (!f.c && fz < 4.6) { f.c = t; mal(A2, 1.0, 'camion', 'El camión se mueve', -.4); }
        d.bR.at(A2 + 1.02, P.NIVEL_PATIO + .5, 2.95).pintar(f.c ? 1 : 0, t);
        const cz = f.c ? 1.35 - eio(clamp((t - f.c) / .9)) * 1.4 : 1.35; T.g.position.z = cz;
        const borde = cz + 3.5, hueco = 4.9 - borde; d.gap.visible = hueco > .05; if (d.gap.visible) { d.gap.scale.z = hueco; d.gap.position.set(A2, -.55, borde + hueco / 2); d.gap.material.opacity = .55 + .3 * Math.sin(t * 9); }
        if (f.c && !f.cae && G.z < 5.9) { f.cae = t; parada(G, 14); lento(t, 1.2, .3); golpe(d, t, A2, .2, 4.8, ROJO, .6); mal(A2, 4.6, 'casi', 'La grúa queda al borde'); f.listo = t + 2.4; } },
      post(d, t) { if (d.f.cae) { const q = eio(clamp((t - d.f.cae) / .5)); d.G.obj.rotation.z = -.32 * q; d.G.obj.position.y = -.3 * q; } } },
    despues: { texto: 'Primero se bloquea el camión: la cuña en la rueda y los semáforos del andén. La grúa entra solo cuando el camión está fijo.', dur: 12,
      cam: [[0, { ...DOCK, x: 65.2, z: .6, zoom: 5.6 }], [2.4, { ...DOCK, x: 65.6, z: 2.4, zoom: 4.0, el: 40 }], [4.4, { ...DOCK }]],
      foco: (d, t) => (t < 4.4 ? { x: 65.6, y: -.6, z: 2.4, r: 2.8 } : { x: 64.8, y: -.3, z: 3.4, r: 3.8 }),
      montar(d) { d.gap.visible = false; d.T.g.position.set(A2, P.NIVEL_PATIO, -4.6); camino(d.G, [[A2, 7.6], [A2, 2.6]], { v: 0 }); d.G.alto = d.G.altoObj = .25; d.G.carga = true;
        d.tT.set([[A2, -6.0], [A2, 4.85]], .3); d.tG.set([[A2, 7.6], [A2, 2.6]], .3).color(AZUL); d.f = {}; S.dockForzado = 'libre'; H.docks.N2.k = 0; },
      paso(d, t) { const { T, G, f } = d, dk = H.docks.N2;
        // el camión retrocede hasta el andén
        const qT = eio(clamp(t / 2.2)); if (!f.mov) T.g.position.z = lerp(-4.6, 1.35, qT); d.tT.pintar(1, f.cu ? clamp(1 - (t - f.cu) * 2) * .7 : .7, t);
        if (!f.cu && t > 2.3) { f.cu = t; S.dockForzado = 'atracado'; ok(A2 + 1.6, 1.6, 'La cuña bloquea la rueda', -.6); }
        const cu = dk.cuna.position; d.bCu.at(cu.x, cu.y + .35, cu.z).pintar(f.cu ? (f.mov && t < f.mov + 1.4 ? 1.5 : .9) : 0, t); d.aCu.at(cu.x, cu.z, cu.y).pintar(f.cu && dk.k > .9 ? 1 : 0, t);
        const listo = S.dockForzado === 'atracado' && dk.k > .9; d.bIn.at(A2 + 1.95, 2.05, 5.25).pintar(listo ? .9 : 0, t); d.bOut.at(A2 + 1.95, 1.75, 4.6).pintar(listo ? 1 : 0, t);
        if (listo && !f.g) { f.g = t; sigue(G, 2.0); }
        d.tG.pintar(f.g ? clamp((t - f.g) / .8) : 0, f.sal ? 0 : .7, t);
        if (f.g && !f.dej && fin(G)) { f.dej = t; G.altoObj = .32; f.mov = t; ok(A2, -.4, 'La cuña sujeta el camión', -.4); }
        // a media carga el chofer intenta salir: el camión se sacude, pero la cuña lo sujeta
        if (f.mov) T.g.position.z = 1.35 - .1 * Math.max(0, Math.sin(clamp((t - f.mov) / 1.1) * Math.PI * 3)) * (1 - clamp((t - f.mov) / 1.1));
        if (f.dej && t > f.dej + .7 && G.carga) G.carga = false;
        if (f.dej && t > f.dej + 1.1 && !f.sal) { f.sal = t; G.altoObj = .18; camino(G, [[A2, 2.6], [A2, 9]], { rev: true, v: 0, vObj: 1.8 }); }
        if (f.sal && G.z > 6.4 && !f.lib) { f.lib = t; S.dockForzado = 'libre'; ok(A2 + 1.6, 1.4, 'Termina la carga: se libera la rueda', -.6); f.listo = t + 1.6; } } } });

  /* 4 · Zonas de la grúa — vista cenital, la grúa retrocede */
  def({ id: 'zonas', titulo: 'Zonas de la grúa', centro: [58, 10], radio: 12,
    crear(d) { d.G = grua(d.g, false); d.P = persona(d.g); d.ciego = abanico(d.g, ROJO, 1.4, 4.2); d.Z = eq.proyeccion(d.g, eq.TX.zonas, 7, 7, 0, 0, 0, null, 0xFFFFFF, .03); d.tP = trazo(d.g, AMAR, .22); d.pulso = aro(d.g, AMAR, 1.2); },
    antes: { texto: 'Puntos ciegos: el operador no ve a la persona que aparece detrás de la carga.', dur: 8,
      cam: [[0, { x: 58.4, z: 10.2, zoom: 5.4, az: 24, el: 68 }]], foco: (d) => ({ x: d.G.x + 1.4, y: .5, z: d.G.z, r: 4.4 }),
      montar(d) { camino(d.G, [[54.4, 10.1], [61.6, 10.1]], { rev: true, v: 0, vObj: 1.5 }); camino(d.P, [[59.8, 5.6], [59.8, 14.6]], { radio: .3, v: 1.25 }); d.tP.set([[59.8, 5.6], [59.8, 14.6]], .3); d.Z.pintar(0, 0); d.f = {}; },
      paso(d, t) { const { G, P: p, f } = d; d.tP.pintar(clamp(t / 1.2), .8, t);
        const dentro = Math.abs(p.z - G.z) < 1.4 && p.x > G.x && p.x - G.x < 4.2; d.ciego.at(G.x + .9, G.z, G.th + Math.PI).pintar(dentro ? 1 : .5);
        if (!f.casi && p.x - G.x < 2.0 && Math.abs(p.z - G.z) < .9) { f.casi = t; parada(G, 12); parada(p, 9); susto(p); lento(t, 1.4); golpe(d, t, p.x, 1, p.z); mal(p.x, p.z, 'casi'); f.listo = t + 2.2; } } },
    despues: { texto: 'La grúa ve a su alrededor: cámaras con IA y tres zonas. Verde avisa, amarilla baja a la mitad y roja detiene.', dur: 9.5,
      cam: [[0, { x: 58.4, z: 10.2, zoom: 5.4, az: 24, el: 68 }]], foco: (d) => ({ x: d.G.x, y: .5, z: d.G.z, r: 4.4 }),
      montar(d) { camino(d.G, [[54.4, 10.1], [61.6, 10.1]], { rev: true, v: 0, vObj: 1.5 }); camino(d.P, [[59.8, 5.6], [59.8, 14.6]], { radio: .3, v: 1.2 }); d.tP.set([[59.8, 5.6], [59.8, 14.6]], .3); d.ciego.pintar(0); d.f = {}; },
      paso(d, t) { const { G, P: p, f } = d, dd = Math.hypot(p.x - G.x, p.z - G.z); d.tP.pintar(clamp(t / 1.2), .8, t);
        d.Z.m.position.set(G.x, .03, G.z); d.Z.pintar(1, S.reloj);
        const zona = dd < 1.9 ? 'r' : dd < 2.9 ? 'a' : dd < 3.5 ? 'v' : null;
        if (zona && zona !== f.z) { f.z = zona; f.zt = t; d.pulso.color(zona === 'r' ? ROJO : zona === 'a' ? AMAR : VERDE); }
        d.pulso.at(G.x, G.z).pintar(f.zt != null ? clamp(1.2 - (t - f.zt) * 1.2) : 0, t);
        if (zona === 'r') { G.vObj = 0; G.dec = 6; if (!f.r) { f.r = 1; ok(G.x, G.z, 'Zona roja: se detiene', 1); } }
        else if (zona === 'a') { G.vObj = .7; if (!f.a) { f.a = 1; ok(G.x, G.z + 1.2, 'Zona amarilla: baja a la mitad', 1); } }
        else if (zona === 'v') { if (!f.v) { f.v = 1; ok(G.x, G.z - 1.2, 'Zona verde: avisa', 1); } G.vObj = 1.5; }
        else G.vObj = 1.5; } } });

  /* 5 · Control de velocidad — la calle A hacia el oeste y el cruce del sendero (Z3); el radar cuelga del techo y mira al tránsito */
  const XP = 68, ZA = P.PISTA.Aw;
  const CV = { x: 72.6, z: 34.0, zoom: 6.0, az: 46, el: 46, y: .5 };
  def({ id: 'velocidad', titulo: 'Control de velocidad', centro: [72, 34], radio: 14, sinViga: true,
    crear(d) { d.G = grua(d.g, true); d.P = persona(d.g); d.est = estelas(d.G); d.tF = trazo(d.g, OSC, .7); d.tP = trazo(d.g, AMAR, .22); d.bR = brillo(d.g, ROJO, 1.8); d.okA = aro(d.g, VERDE, 1.1); d.esp = aro(d.g, AMAR, .55); d.bK = brillo(d.g, AZUL, 1.6); d.ln = enlace(d.g, AZUL); },
    antes: { texto: 'Exceso de velocidad: sin control, la grúa va más rápido de lo que el espacio permite.', dur: 8,
      cam: [[0, { ...CV, x: 75 }], [3.0, { ...CV, x: 70.6, zoom: 4.8 }]],
      foco: (d) => ({ x: (d.G.x + XP) / 2, y: .6, z: ZA, r: 5.6 }),
      montar(d) { camino(d.G, [[90, ZA], [50, ZA]], { v: 4.4 }); camino(d.P, [[XP, 27.8], [XP, 44]], { radio: .3, v: 1.25 }); d.tP.set([[XP, 27.8], [XP, 40]], .3); d.tF.set([[90, ZA], [50, ZA]], .2, 0); d.f = {}; },
      paso(d, t) { const { G, P: p, f } = d; d.est.pintar(G.v); d.tP.pintar(clamp(t / 1.2), .8, t);
        // frena tarde: la distancia de frenado se dibuja en el piso y termina encima de la persona
        if (!f.fr && p.z > 32.6) { f.fr = t; f.s0 = G.s; const dist = Math.max(.5, G.x - G.m.frente() - XP - .4); parada(G, G.v * G.v / (2 * dist)); }
        d.tF.pintar(f.fr ? G.s / G.r.largo : 0, .55, t, f.fr ? f.s0 / G.r.largo : 0);
        if (f.fr && !f.casi && G.v < .25) { f.casi = t; parada(p, 9); susto(p); lento(t, 1.1); golpe(d, t, p.x, 1, p.z); mal(p.x, p.z, 'casi'); f.listo = t + 2.2; } } },
    despues: { texto: 'La velocidad, a la vista: el letrero muestra la velocidad y la grúa la ajusta antes del cruce.', dur: 12,
      cam: [[0, { ...CV, x: 77.4, z: 33.6, zoom: 4.8, y: 1.4 }], [3.0, { ...CV }]],
      foco: (d, t) => (t < 3 ? { x: 76.6, y: 1.8, z: 33.4, r: 4.6 } : { x: 70, y: .6, z: 34, r: 5 }),
      montar(d) { camino(d.G, [[85, ZA], [50, ZA]], { v: 4.2 }); camino(d.P, [[XP, 27.6], [XP, 44]], { radio: .3, v: 0 }); d.tP.set([[XP, 27.6], [XP, 40]], .3); d.f = {}; S.radarForzado = { A: null }; S.cruces.Z3.forzar = { veh: false }; },
      paso(d, t) { const { G, P: p, f } = d, z3 = S.cruces.Z3.forzar, kb = H.cruces.Z3.holo?.kb, rango = G.x > 75.5 && G.x < 88; d.est.pintar(G.v);
        // el radar mide y muestra la velocidad; el operador baja a la velocidad de la planta
        S.radarForzado.A = rango ? G.v * 3.6 : null; d.bR.at(74.2, 3.0, 33.1).pintar(rango && G.v * 3.6 > 10 ? 1 : 0, t);
        if (rango && G.v * 3.6 > 10 && !f.av) { f.av = t; ok(74.2, 33.1, 'El radar avisa: baja la velocidad', 2.6); }
        if (f.av && t > f.av + .3 && !f.b) { f.b = 1; G.vObj = 2.2; G.dec = 1.8; }
        // el cruce se cierra antes de que llegue la grúa: puertas cerradas y advertencia proyectada
        if (!f.det && G.x < 83) { f.det = t; z3.veh = true; }
        if (kb) { d.ln.pintar(z3.veh ? 1 : 0, kb.origen, pos(G, 1.2), t); d.bK.at(kb.origen.x, kb.origen.y + .3, kb.origen.z).pintar(z3.veh ? .9 : 0, t); }
        if (!f.pa && t > .4) { f.pa = t; sigue(p, 1.25); } d.tP.pintar(f.pa ? clamp((t - f.pa) / 1.2) : 0, .8, t);
        if (z3.veh && p.z > 31.7 && p.z < 32.4) { parada(p, 6); d.esp.at(XP, 32.1).pintar(1, t); } else d.esp.pintar(0, t);
        if (f.det && !f.lib && G.x + 1.7 < 67.1) { /* se abre recién cuando la cola de la grúa dejó atrás las hojas */ f.lib = t; z3.veh = false; ok(XP, 33.4, 'Pasa la grúa: se abre el cruce'); }
        if (f.lib && t > f.lib + .5) sigue(p, 1.25, 5);
        if (f.lib && !f.listo) f.listo = f.lib + 2.6; } } });

  /* 6 · Barreras y protecciones — la cabecera del rack en la entrada del pasillo B3 */
  const PROT = () => H.protRack?.find((q) => q.bloque === 'S' && Math.abs(q.x - 79.6) < .2);
  def({ id: 'barreras', titulo: 'Barreras y protecciones', centro: [80, 18], radio: 11,
    crear(d) { d.G = grua(d.g, true); d.caja = k.caja(.5, .4, .55, 0, 0, 0, k.M.caja2, d.g, .03); d.tG = trazo(d.g, ROJO, .3); d.bU = brillo(d.g, ROJO, 1.4); d.bP = brillo(d.g, AZUL, 1.6); d.okA = aro(d.g, VERDE, .7); },
    antes: { texto: 'Una maniobra, un golpe: la grúa abre el giro y el rack lo recibe.', dur: 8,
      cam: [[0, { x: 79.0, z: 17.6, zoom: 5.4, az: 110, el: 38, y: .8 }], [3.0, { x: 80.4, z: 18.8, zoom: 3.8, az: 110, el: 34, y: 1.0 }]], foco: () => ({ x: 80.6, y: 1.0, z: 19.3, r: 3.0 }),
      montar(d) { camino(d.G, [[71.5, Ee], [80.0, Ee], [81.6, 18.5], [82.2, 21.6]], { radio: .9, v: 2.2 }); d.tG.set([[71.5, Ee], [80.0, Ee], [81.6, 18.5], [82.2, 21.6]], .9).color(ROJO); d.f = {}; d.caja.visible = true; d.caja.position.set(80.2, 4.45, 19.7); d.caja.rotation.set(0, 0, 0); },
      paso(d, t) { const { G, f } = d; d.tG.pintar(clamp(t / 1.2), .75, t);
        if (!f.h && G.x > 80.6) { f.h = t; parada(G, 12); lento(t, 1.3, .28); golpe(d, t, 80.66, 1, 19.4, ROJO, .45); mal(80.7, 19.4, 'rack', 'Golpe al rack'); f.listo = t + 2.8; }
        d.bU.at(80.66, 1.4, 19.4).pintar(f.h ? 1 : 0, t);
        if (f.h) { const q = clamp((t - f.h) / .9); d.caja.position.set(80.2, 4.45 * (1 - q * q), 19.7 - q * .9); d.caja.rotation.set(q * 1.4, 0, q * .8); }
        if (f.h && t > f.h + 2.8) sigue(G, 1.0); } },
    despues: { texto: 'El rack deja de recibir el golpe: el protector de cabecera recibe la maniobra y el parante queda intacto.', dur: 8,
      cam: [[0, { x: 79.0, z: 17.6, zoom: 5.4, az: 110, el: 38, y: .8 }], [3.0, { x: 80.2, z: 18.8, zoom: 3.8, az: 110, el: 34, y: .7 }]], foco: () => ({ x: 80.2, y: .5, z: 19.1, r: 3.0 }),
      montar(d) { camino(d.G, [[71.5, Ee], [80.0, Ee], [81.6, 18.5], [82.2, 21.6]], { radio: .9, v: 2.2 }); d.tG.set([[71.5, Ee], [80.0, Ee], [81.6, 18.5], [82.2, 21.6]], .9).color(AZUL); d.f = {}; d.caja.visible = false; },
      paso(d, t) { const { G, f } = d, pr = PROT(); d.tG.pintar(clamp(t / 1.2), .6, t);
        if (!f.h && G.x > 80.6) { f.h = t; parada(G, 12); golpe(d, t, 79.6, .4, 19.05, AZUL); ok(79.6, 19.05, 'El protector recibe el golpe', .8); }
        d.bP.at(79.6, .45, 19.05).pintar(f.h ? clamp(2.4 - (t - f.h)) : 0, t);
        if (pr) { const q = f.h ? clamp((t - f.h) / 1.2) : 0; pr.g.scale.z = 1 - .35 * Math.sin(q * Math.PI) * (1 - q * .5); }
        d.okA.at(80.66, 19.4).pintar(f.h && t > f.h + 1.3 ? 1 : 0, t);
        if (f.h && t > f.h + 2.2) sigue(G, 1.0); if (f.h && !f.listo) f.listo = f.h + 3.4; },
      salir() { const pr = PROT(); if (pr) pr.g.scale.z = 1; } } });

  /* 7 · Demarcación de pisos — la explanada del andén: el piso se ordena */
  const libres = []; P.ESPERA.filas.forEach((z, i) => P.ESPERA.xs.forEach((x, j) => { if (!((i * 7 + j * 3) % 5 < 3 && !(j === 0 && (i === 1 || i === 2)))) libres.push([x, z]); }));
  const SUELTOS = [[57.4, 7.6, .7], [58.8, 12.2, 2.1], [56.2, 10.3, 1.3], [59.6, 16.4, .4], [55.4, 15.6, 2.6], [60.6, 8.6, 1.8]];
  def({ id: 'demarcacion', titulo: 'Demarcación de pisos', centro: [60, 13], radio: 14, barrido: [60, 12],
    crear(d) { d.A = persona(d.g); d.B = persona(d.g, 'supervisor'); d.F = grua(d.g, true); d.pal = SUELTOS.map(() => H.palletR(d.g, 0, 0, 0, 0, .7));
      d.tA = trazo(d.g, AMAR, .22); d.tB = trazo(d.g, AMAR, .22); d.tF = trazo(d.g, ROJO, .3); d.conf = [aro(d.g, ROJO, .8), aro(d.g, ROJO, .8)]; d.marca = libres.slice(0, 6).map(() => aro(d.g, AZUL, .6)); },
    antes: { texto: 'Un piso sin reglas: pallets donde caben y personas cruzando entre las grúas.', dur: 8,
      cam: [[0, { x: 59.6, z: 12.4, zoom: 9.4, az: 24, el: 62 }]], foco: () => ({ x: 59.6, y: 0, z: 12.4, r: 8 }),
      montar(d) { d.pal.forEach((p, i) => { const [x, z, r] = SUELTOS[i]; p.position.set(x, 0, z); p.rotation.y = r; p.visible = true; });
        const a = [[55.4, 21.6], [58.6, 15.4], [62.4, 11.0], [66.4, 7.6]], b = [[61.8, 6.2], [59.4, 11.4], [63.8, 15.8], [66.6, 21.2]], fF = [[Bs, 5.6], [61.2, 9.4], [57.4, 11.6], [60.8, 14.2]];
        camino(d.A, a, { radio: .6, v: 1.25 }); camino(d.B, b, { radio: .6, v: 1.15 }); camino(d.F, fF, { radio: 1.2, v: 1.8 }); d.tA.set(a, .6); d.tB.set(b, .6); d.tF.set(fF, 1.2).color(ROJO);
        d.conf[0].at(59.4, 11.6); d.conf[1].at(61.2, 12.8); d.marca.forEach((m) => m.pintar(0, 0)); d.f = {}; },
      paso(d, t) { d.tA.pintar(d.A.s / d.A.r.largo, .85, t); d.tB.pintar(d.B.s / d.B.r.largo, .85, t); d.tF.pintar(d.F.s / d.F.r.largo, .85, t);
        d.conf.forEach((c, i) => c.pintar(clamp((t - 2.2 - i * .8) * 2), t));
        if (t > 2.4 && !d.f.a) { d.f.a = 1; mal(59.4, 11.6, 'aviso', 'Nadie sabe por dónde ir'); } } },
    despues: { texto: 'Cada color, una regla: cinta de alto tráfico para senderos, pasillos, despacho y zonas de espera. Las personas, por su camino.', dur: 10,
      cam: [[0, { x: 59.6, z: 12.4, zoom: 9.4, az: 24, el: 62 }]], foco: () => ({ x: 59.6, y: 0, z: 12.4, r: 8 }),
      montar(d) { const a = [[55.6, 18.75], [61.2, 18.75], [67.7, 18.75], [68, 20], [68, 24.4]], b = [[68, 6.2], [68, 14.4]], fF = [[Bs, 5.6], [Bs, 13.8], [64.4, 15.7], [72, 15.7]];
        camino(d.A, a, { radio: .4, v: 1.25 }); camino(d.B, b, { radio: .3, v: 1.15 }); camino(d.F, fF, { radio: 1.4, v: 1.8 }); d.tA.set(a, .4); d.tB.set(b, .3); d.tF.set(fF, 1.4).color(AZUL);
        d.desde = d.pal.map((p) => [p.position.x, p.position.z, p.rotation.y]); d.conf.forEach((c) => c.pintar(0, 0)); d.f = {}; },
      paso(d, t) { d.tA.pintar(d.A.s / d.A.r.largo, .85, t); d.tB.pintar(d.B.s / d.B.r.largo, .85, t); d.tF.pintar(d.F.s / d.F.r.largo, .85, t);
        d.pal.forEach((p, i) => { const q = eio(clamp((t - 1.4 - i * .35) / 1.1)), [x0, z0, r0] = d.desde[i], [x1, z1] = libres[i];
          p.position.set(lerp(x0, x1, q), Math.sin(q * Math.PI) * .25, lerp(z0, z1, q)); p.rotation.y = lerp(r0, Math.PI / 2, q);
          d.marca[i].at(x1, z1).pintar(q > .98 ? clamp(1.6 - (t - 2.5 - i * .35)) : 0, t); });
        if (t > 4.6 && !d.f.a) { d.f.a = 1; ok(61.6, 13.6, 'Cada color, una regla'); } if (t > 6.6 && !d.f.b) { d.f.b = 1; ok(68, 19.5, 'Las personas, por su camino'); } } } });

  /* 8 · Señalización y etiquetado — encontrar la ubicación B3-2 */
  const ET = { x: 82.2 - 1.47, y: 1.42, z: P.BLOQUE_S.z0 + .7 + (P.BLOQUE_S.z1 - P.BLOQUE_S.z0 - 1.4) / 3 };
  def({ id: 'senalizacion', titulo: 'Señalización y etiquetado', centro: [80, 20], radio: 10,
    crear(d) { d.O = persona(d.g); d.t = trazo(d.g, ROJO, .2); d.bH = brillo(d.g, ROJO, .9); d.bS = brillo(d.g, AZUL, 2.0); d.bE = brillo(d.g, AZUL, 1.0); d.okA = aro(d.g, VERDE, .6); },
    antes: { texto: 'Buscando el pasillo B: entra, duda, vuelve. Nada le indica dónde está.', dur: 11,
      cam: [[0, { sigue: 'O', dz: 1, zoom: 6.2, az: 150, el: 56 }]], foco: (d) => ({ x: d.O.x, y: .8, z: d.O.z, r: 4.2 }),
      montar(d) { const pts = [[74.4, 18.9], [77, 18.9], [77, 22.2], [77.1, 19.0], [79.6, 19.0], [87.4, 19.0], [87.4, 21.6], [87.3, 19.0], [82.2, 18.9], [82.2, 21.0]];
        camino(d.O, pts, { radio: .35, v: 1.05 }); d.t.set(pts, .35).color(ROJO); d.f = {}; },
      paso(d, t) { d.t.pintar(d.O.s / d.O.r.largo, .8, t); d.bH.at(d.O.x, altura(d.O.x, d.O.z) + 2.0, d.O.z).pintar(.85, t);
        if (t > .8 && !d.f.a) { d.f.a = 1; mal(d.O.x, d.O.z, 'duda', '¿Pasillo B3?', 1.6); } if (t > 5.4 && !d.f.b) { d.f.b = 1; mal(d.O.x, d.O.z, 'duda', 'Entra, duda, vuelve', 1.6); } } },
    despues: { texto: 'Cada pasillo tiene nombre: letreros colgantes y etiquetas de ubicación en cada viga. Ahora llega directo.', dur: 8,
      cam: [[0, { sigue: 'O', dz: 1, zoom: 6.2, az: 150, el: 56 }]], foco: (d) => ({ x: d.O.x, y: .8, z: d.O.z + .6, r: 4.4 }),
      montar(d) { const pts = [[74.4, 18.9], [82.2, 18.9], [82.2, ET.z]]; camino(d.O, pts, { radio: .5, v: 1.2 }); d.t.set(pts, .5).color(AZUL); d.bH.pintar(0, 0); d.f = {}; },
      paso(d, t) { d.t.pintar(d.O.s / d.O.r.largo, .85, t); d.bS.at(82.2, P.RACK.alto + .3, P.BLOQUE_S.z0 + .05).pintar(t < 4.2 ? 1 : .4, t); d.bE.at(ET.x, ET.y, ET.z).pintar(t > 3.2 ? 1 : 0, t);
        d.okA.at(82.2, ET.z).pintar(fin(d.O) ? 1 : 0, t); if (fin(d.O) && !d.f.listo) d.f.listo = t + 1.6; if (t > 1.2 && !d.f.a) { d.f.a = 1; ok(82.2, 19.4, 'Sigue los letreros hasta su ubicación', 1.4); } } } });

  /* 9 · Proyección en el piso — la puerta de la cámara de frío y el cruce de la calle este */
  def({ id: 'frio', titulo: 'Proyección en el piso', centro: [100, 30], radio: 11,
    crear(d) { d.G = grua(d.g, true); d.P = persona(d.g); d.tG = trazo(d.g, ROJO, .3); d.tP = trazo(d.g, AMAR, .22); d.tP2 = trazo(d.g, VERDE, .22); d.conf = aro(d.g, ROJO, .9); d.esp = aro(d.g, AMAR, .55); d.bPr = brillo(d.g, AZUL, 1.4); },
    antes: { texto: 'Riesgos sin advertir: nada avisa que de esa puerta sale una grúa.', dur: 9,
      cam: [[0, { x: 100.2, z: 30.2, zoom: 6.0, az: -38, el: 48, y: .4 }]], foco: () => ({ x: 101.2, y: .8, z: 29.6, r: 4.4 }),
      montar(d) { camino(d.G, [[107.2, 29], [101.2, 29], [99.4, 30.8], [98.4, 35]], { radio: 1.3, v: 0 }); camino(d.P, [[93.4, 29.2], [102.8, 29.2]], { radio: .3, v: 1.25 });
        d.tP.set([[93.4, 29.2], [102.8, 29.2]], .3); d.tG.set([[107.2, 29], [101.2, 29], [99.4, 30.8], [98.4, 33]], 1.3); d.conf.at(101.6, 29.1); d.f = {}; S.puertaFriaForzada = 0; },
      paso(d, t) { const { G, P: p, f } = d; d.tP.pintar(clamp(t / 1.2), .8, t); if (t > 1.2) S.puertaFriaForzada = 1;
        if (t > 2.4 && !f.s) { f.s = t; sigue(G, 2.2); } d.tG.pintar(f.s ? clamp((t - f.s) / 1) : 0, .8, t); d.conf.pintar(f.s && !f.casi ? 1 : 0, t);
        const [gx, gz] = adelante(G, G.m.frente()); if (!f.casi && G.x < 103.4 && Math.hypot(p.x - gx, p.z - gz) < 1.5) { f.casi = t; parada(G, 12); parada(p, 9); susto(p); lento(t, 1.4); golpe(d, t, p.x, 1, p.z); mal(p.x, p.z, 'casi'); f.listo = t + 2.4; } } },
    despues: { texto: 'La advertencia, en el piso: al abrirse la puerta, un proyector marca el punto de riesgo donde se mira al caminar.', dur: 11,
      cam: [[0, { x: 100.2, z: 30.2, zoom: 6.0, az: -38, el: 48, y: .4 }]], foco: () => ({ x: 100.4, y: .8, z: 29.8, r: 4.6 }),
      montar(d) { camino(d.G, [[107.2, 29], [101.2, 29], [99.4, 30.8], [98.4, 35]], { radio: 1.3, v: 0 }); camino(d.P, [[93.4, 29.2], [102.6, 29.2], [105.2, 29.0]], { radio: .4, v: 1.25 });
        d.tP.set([[93.4, 29.2], [95.2, 29.2]], .3); d.tP2.set([[95.2, 29.2], [103.2, 29.2]], .3); d.tG.pintar(0, 0, 0); d.conf.pintar(0, 0); d.esp.at(95.1, 29.2); d.f = {}; S.puertaFriaForzada = 0; S.cruces.Z6.forzar = { veh: false }; },
      paso(d, t) { const { G, P: p, f } = d, z6 = S.cruces.Z6.forzar; d.tP.pintar(clamp(t / 1.2), .8, t); if (p.x > 104.3) p.obj.visible = false;
        if (t > 1.2 && !f.o) { f.o = t; S.puertaFriaForzada = 1; z6.veh = true; ok(100.6, 31.4, 'Se abre la puerta: se proyecta la advertencia'); }
        d.bPr.at(103.1, 2.75, 31.2).pintar(z6.veh ? 1 : 0, t);
        if (z6.veh && p.x > 94.6 && p.x < 95.3) { parada(p, 6); d.esp.pintar(1, t); } else d.esp.pintar(0, t);
        if (f.o && t > f.o + 1.0 && !f.s) { f.s = 1; sigue(G, 2.0); }
        if (f.s && G.z > 32 && !f.lib) { f.lib = t; f.listo = t + 3.0; z6.veh = false; S.puertaFriaForzada = 0; }
        if (f.lib && t > f.lib + .6) { sigue(p, 1.25, 6); d.tP2.pintar(clamp((t - f.lib - .6) / 1.4), .9, t); } else d.tP2.pintar(0, 0, t); } } });

  /* 10 · Tableros y pizarras — la reunión del turno */
  const arco = [[79.6, 41.1], [80.5, 41.5], [81.4, 41.6], [82.3, 41.5], [83.1, 41.1]], lejos = [[74.4, 46.6], [86.6, 38.4], [77.0, 36.2], [84.4, 46.0], [72.6, 40.2]];
  def({ id: 'tableros', titulo: 'Tableros y pizarras', centro: [80, 41], radio: 10,
    crear(d) { d.T = arco.map((_, i) => persona(d.g, i === 2 ? 'supervisor' : 'operario')); d.tr = arco.map(() => trazo(d.g, AMAR, .18)); d.bT = brillo(d.g, AZUL, 3.2); },
    antes: { texto: '¿Cómo va el turno? Papeles en la mesa y cada uno con su versión.', dur: 8,
      cam: [[0, { x: 79.6, z: 41.4, zoom: 7.2, az: 16, el: 54 }]], foco: () => ({ x: 79.6, y: .6, z: 41.4, r: 6.6 }),
      montar(d) { d.T.forEach((a, i) => { const [x, z] = lejos[i], pts = [[x, z], [81.3 + (i - 2) * .7, 39.8 + (i % 2) * .4], [lejos[(i + 2) % 5][0], lejos[(i + 2) % 5][1]]]; camino(a, pts, { radio: .8, v: 1.1 }); d.tr[i].set(pts, .8).color(AMAR); }); d.f = {}; },
      paso(d, t) { d.T.forEach((a, i) => d.tr[i].pintar(a.s / a.r.largo, .7, t)); d.bT.pintar(0, t);
        if (t > 1.6 && !d.f.a) { d.f.a = 1; mal(81.3, 39.6, 'aviso', 'Cada uno con su versión', 1.2); } } },
    despues: { texto: 'Diez minutos, todos frente al mismo tablero: seguridad, calidad, entregas, costos y personas en un solo lugar.', dur: 11,
      cam: [[0, { x: 80.4, z: 41.2, zoom: 7, az: 16, el: 50 }], [3.6, { x: 81.2, z: 40.6, zoom: 4.6, az: 16, el: 32, y: 1 }]], foco: () => ({ x: 81.3, y: 1.2, z: 40.2, r: 4.2 }),
      montar(d) { d.T.forEach((a, i) => { const pts = [lejos[i], arco[i]]; camino(a, pts, { radio: .4, v: 0, vObj: 1.25 }); d.tr[i].set(pts, .4).color(AZUL); }); d.f = {}; },
      paso(d, t) { d.T.forEach((a, i) => { d.tr[i].pintar(a.s / a.r.largo, d.f.sal ? .3 : .8, t); if (!d.f.sal && fin(a)) { a.th += dif(a.th, Math.PI / 2) * .12; a.obj.rotation.y = a.th; } });
        d.bT.at(81.3, 1.4, 38.8).pintar(t > 3.0 && t < 8.4 ? 1 : 0, t);
        if (t > 3.4 && !d.f.a) { d.f.a = 1; ok(81.3, 40.2, 'Todos con el mismo dato', 1.6); }
        if (t > 8.2 && !d.f.sal) { d.f.sal = 1; d.T.forEach((a, i) => { const pts = [arco[i], lejos[(i + 1) % 5]]; camino(a, pts, { radio: .4, v: 0, vObj: 1.3 }); d.tr[i].set(pts, .4); }); } } } });

  /* 11 · Orden y almacenamiento — del piso a la estantería */
  const slotsOrden = [[73.0, 1.0, 29.6], [74.4, .45, 29.6], [75.8, 1.0, 29.6], [81.4, .45, 29.6], [82.8, 1.0, 29.6], [84.2, .45, 29.6]];
  def({ id: 'orden', titulo: 'Orden y almacenamiento', centro: [79, 30], radio: 11,
    crear(d) { d.O = persona(d.g); d.C = slotsOrden.map((_, i) => k.caja(.46, .3, .4, 0, 0, 0, i % 2 ? k.M.caja : k.M.caja2, d.g, .03)); d.t = trazo(d.g, ROJO, .2); d.aC = slotsOrden.map(() => aro(d.g, ROJO, .5)); d.bS = slotsOrden.map(() => brillo(d.g, AZUL, .9)); d.libre = aro(d.g, VERDE, 2.2); },
    antes: { texto: '¿Dónde quedó? Cajas en el piso, residuos en un rincón y un operador que busca.', dur: 9,
      cam: [[0, { x: 79.4, z: 31.4, zoom: 6.6, az: 10, el: 52 }]], foco: () => ({ x: 79.4, y: .4, z: 31.6, r: 6 }),
      montar(d) { d.C.forEach((c, i) => { c.position.set(72.6 + i * 2.2, 0, 31.4 + (i % 2) * .6); c.rotation.set(0, i * .7, 0); d.aC[i].at(72.6 + i * 2.2, 31.4 + (i % 2) * .6); });
        const pts = [[72.4, 33.6], [75.2, 31.2], [78.6, 31.9], [76.6, 33.2], [82.0, 31.0], [85.2, 31.8], [83.6, 32.6]]; camino(d.O, pts, { radio: .5, v: 1.0 }); d.t.set(pts, .5).color(ROJO); d.f = {}; },
      paso(d, t) { d.t.pintar(d.O.s / d.O.r.largo, .8, t); d.aC.forEach((a, i) => a.pintar(clamp((t - .6 - i * .2) * 2), t)); d.bS.forEach((b) => b.pintar(0, t)); d.libre.pintar(0, t);
        if (t > 1.4 && !d.f.a) { d.f.a = 1; mal(d.O.x, d.O.z, 'duda', '¿Dónde quedó?', 1.6); } } },
    despues: { texto: 'Del piso a su lugar: cada caja sube a un nivel de la estantería, lo chico va por color y el pasillo queda libre.', dur: 9,
      cam: [[0, { x: 79.4, z: 31.0, zoom: 6.6, az: 10, el: 46 }]], foco: () => ({ x: 79.4, y: .6, z: 30.6, r: 6 }),
      montar(d) { d.desde = d.C.map((c, i) => [72.6 + i * 2.2, 0, 31.4 + (i % 2) * .6]); camino(d.O, [[72.4, 33.6], [73.0, 30.8]], { radio: .4, v: 0, vObj: 0 }); d.t.set([[72.4, 33.6], [73.0, 30.8]], .4).color(AZUL); d.f = {}; },
      paso(d, t) { d.C.forEach((c, i) => { const q = eio(clamp((t - .5 - i * .45) / 1.1)), [x0, y0, z0] = d.desde[i], [x1, y1, z1] = slotsOrden[i];
          c.position.set(lerp(x0, x1, q), lerp(y0, y1, q) + Math.sin(q * Math.PI) * 1.2, lerp(z0, z1, q)); c.rotation.y = lerp(i * .7, 0, q);
          d.aC[i].pintar(q < .05 ? 1 : 0, t); d.bS[i].at(x1, y1 + .2, z1).pintar(q > .98 ? clamp(1.5 - (t - 1.6 - i * .45)) : 0, t); });
        d.libre.at(78.4, 31.6).pintar(t > 3.8 ? clamp((t - 3.8) * 2) * clamp(6.4 - t) : 0, t);
        if (t > 3.8 && !d.f.o) { d.f.o = 1; sigue(d.O, 1.2); ok(80.6, 30.4, 'Del piso a su lugar', 1.4); } d.t.pintar(d.f.o ? d.O.s / d.O.r.largo : 0, .8, t); } } });

  /* 12 · Estaciones de trabajo — la línea 2: pocas personas en mesas baratas y chuecas; después, todos los puestos ordenados */
  const L2 = P.ENSAMBLE.lineas[1], XS = P.ENSAMBLE.xs, CE = { x: 98.4, z: 49.6, zoom: 4.6, az: 18, el: 40, y: .6 };
  def({ id: 'estaciones', titulo: 'Estaciones de trabajo', centro: [98, 50], radio: 7,
    crear(d) { d.O = persona(d.g); d.t = trazo(d.g, ROJO, .2); d.vacio = XS.map(() => aro(d.g, ROJO, .6)); d.bDolor = brillo(d.g, ROJO, 1.0);
      d.okP = XS.map(() => aro(d.g, AZUL, .7)); d.bA = XS.map(() => brillo(d.g, VERDE, 1.0)); },
    antes: { texto: 'Un puesto que cansa: se trabaja agachado y el material queda lejos.', dur: 8,
      cam: [[0, { ...CE, zoom: 5.4 }], [2.6, { ...CE }]], foco: () => ({ x: 98.4, y: .5, z: 50, r: 5 }),
      montar(d) { camino(d.O, [[98.55, 50.1], [98.55, 50.0]], { radio: .2, v: 0 }); d.O.obj.visible = true; d.O.quieto = true; md.brazos(d.O.p, 1.0);
        d.t.set([[98.55, 50.0], [99.2, 52.4], [104.0, 52.9]], .6); d.f = {}; },
      paso(d, t) { const O = d.O, f = d.f;
        // donde debería haber un puesto, no hay nada: late en rojo
        XS.forEach((x, i) => d.vacio[i].at(x, L2 + .9).pintar(i === 1 || i === 3 ? clamp((t - .6 - i * .15) * 2) * (f.vuelta ? .5 : 1) : 0, t));
        if (t > .8 && !f.a) { f.a = 1; mal(98.4, L2 + .4, 'aviso', 'Pocos puestos, mesas improvisadas', 1.2); }
        // la que falta: sale a buscar material al otro extremo
        if (t > 1.6 && !f.b) { f.b = 1; O.quieto = false; md.brazos(O.p, 0); camino(O, [[98.55, 50.0], [99.2, 52.4], [104.0, 52.9]], { radio: .6, v: 0, vObj: 1.3 }); }
        d.t.pintar(f.b ? clamp(O.s / O.r.largo) : 0, .7, t);
        if (f.b && !f.c && fin(O)) { f.c = t; O.quieto = true; O.p.c.rotation.x = .8; mal(104.0, 52.9, 'aviso', 'El material, lejos', 1.2); }
        d.bDolor.at(O.x, 1.0, O.z).pintar(f.c ? 1 : 0, t);
        if (f.c && t > f.c + .8 && !f.vuelta) { f.vuelta = t; O.quieto = false; O.p.c.rotation.x = 0; md.brazos(O.p, 1.1); camino(O, [[104.0, 52.9], [99.2, 52.4], [98.55, 50.6], [98.55, 50.0]], { radio: .6, v: 0, vObj: 1.3 }); f.listo = t + 3.0; } },
      salir(d) { d.O.p.c.rotation.x = 0; } },
    despues: { texto: 'A la altura de quien trabaja: todo al alcance de la mano y el estado del puesto a la vista.', dur: 7,
      cam: [[0, { ...CE }], [3.4, { ...CE, x: 98.0, zoom: 4.0, el: 34 }]], foco: () => ({ x: 98, y: 1, z: 49.4, r: 5 }),
      montar(d) { d.O.obj.visible = false; d.f = {}; },
      paso(d, t) { // cada puesto se enciende: andon en verde y su lugar marcado
        XS.forEach((x, i) => { const q = clamp((t - .8 - i * .35) * 2); d.okP[i].at(x, L2 + .9).pintar(q * clamp(1.4 - (t - 3.6)), t); d.bA[i].at(x + .78, 2.4, L2 - .36).pintar(q, t); });
        if (t > 2.4 && !d.f.a) { d.f.a = 1; ok(98.4, L2 + .4, 'Cada puesto ordenado y a la vista', 1.6); } } } });

  /* 13 · Carros y manipuladores — del supermercado a la cabeza de la línea 1: a pulso y en un carro chico, o en el tren */
  const L1 = P.ENSAMBLE.lineas[0] - 1.05, CAB = [93.0, L1 - .95];
  def({ id: 'carros', titulo: 'Carros y manipuladores', centro: [92, 36], radio: 12,
    crear(d) { d.A = persona(d.g); d.cajaA = k.caja(.46, .32, .4, .42, .95, 0, k.M.caja, d.A.obj, .03);
      d.B = persona(d.g); d.carroB = eq.carroMano(d.B.obj, 3); d.carroB.position.x = .78;
      d.extra = [[-.1, .55, .05, .35], [.18, .55, -.08, -.5], [.02, .82, 0, .9]].map(([x, y, z, r]) => { const c = k.caja(.4, .28, .36, x, y, z, k.M.caja2, d.carroB, .03); c.rotation.set(r * .3, r, r * .2); return c; });
      d.cae = k.caja(.4, .28, .36, 0, 0, 0, k.M.caja2, d.g, .03); d.puesta = k.caja(.46, .32, .4, CAB[0], .84, L1, k.M.caja, d.g, .03);
      d.tA = trazo(d.g, ROJO, .2); d.tB = trazo(d.g, ROJO, .2); d.bA = brillo(d.g, ROJO, 1.0); d.bB = brillo(d.g, ROJO, 1.0);
      d.tr = actor(md.tractor(d.g).g, 'tren'); d.carros = [0, 1, 2].map((i) => md.carroKitting(d.g, i % 2 ? k.M.amarillo : undefined)); d.tT = trazo(d.g, AZUL, .3); d.okA = aro(d.g, VERDE, 1.4); d.bT = brillo(d.g, VERDE, 2.2); },
    antes: { texto: 'Una caja, un viaje: cada caja que se carga a mano la paga la espalda.', dur: 9,
      cam: [[0, { x: 92.8, z: 35.0, zoom: 4.6, az: -24, el: 44, y: .5 }], [3.4, { x: 93.4, z: 37.2, zoom: 4.4, az: -24, el: 44, y: .5 }]], foco: () => ({ x: 93.2, y: .6, z: 36.2, r: 4.8 }),
      montar(d) { for (const a of [d.A, d.B]) a.obj.visible = true; d.carroB.visible = true; d.tr.obj.visible = false; d.carros.forEach((c) => (c.g.visible = false)); d.puesta.visible = false;
        const pa = [[90.6, 31.8], [90.6, 37.6], [CAB[0], 38.4], [CAB[0], CAB[1]]]; camino(d.A, pa, { radio: .7, v: 1.15 }); md.brazos(d.A.p, 1.25, .1); d.cajaA.visible = true; d.tA.set(pa, .7);
        const pb = [[96.2, 31.4], [96.2, L1 - 1.6]]; camino(d.B, pb, { radio: .5, v: 1.0 }); md.brazos(d.B.p, 1.05, .05); d.tB.set(pb, .5);
        d.extra.forEach((c) => (c.visible = true)); d.cae.visible = false; d.f = {}; },
      paso(d, t) { const { A, B, f } = d; d.tA.pintar(clamp(t / 1.2), .75, t); d.tB.pintar(clamp(t / 1.2), .75, t);
        d.bA.at(A.x, 1.0, A.z).pintar(d.cajaA.visible && t > .6 ? 1 : 0, t); d.bB.at(B.x + .6, .9, B.z).pintar(t > .6 && !f.c2 ? .8 : 0, t);
        if (t > 1.0 && !f.a) { f.a = 1; mal(A.x, A.z, 'aviso', 'Una caja, un viaje', 1.8); }
        // el carro chico va sobrecargado: en la calle se le cae una caja
        if (!f.c && B.z > 34.6) { f.c = t; const c = d.extra[2]; c.visible = false; d.cae.visible = true; f.c0 = [B.x + .8, B.z]; mal(B.x + .8, B.z, 'aviso', 'Se cae la carga', 1.4); }
        if (f.c) { const q = clamp((t - f.c) / .6); d.cae.position.set(f.c0[0] + q * .5, 1.1 * (1 - q * q), f.c0[1] + q * .3); d.cae.rotation.set(q * 1.6, q, q * .8); if (q > .99) f.c2 = 1; }
        // deja la caja en la cinta y vuelve por otra
        if (!f.dej && fin(A)) { f.dej = t; d.cajaA.visible = false; d.puesta.visible = true; md.brazos(A.p, 0); camino(A, [[CAB[0], CAB[1]], [CAB[0], 38.4], [90.6, 37.6], [90.6, 31.8]], { radio: .7, v: 0, vObj: 1.2 }); f.listo = t + 2.2; } },
      salir(d) { md.brazos(d.A.p, 0); md.brazos(d.B.p, 0); } },
    despues: { texto: 'Varios carros, un solo viaje: el tren lleva todo lo que la línea necesita.', dur: 8,
      cam: [[0, { x: 86.4, z: 36.4, zoom: 6.2, az: -24, el: 44, y: .4 }], [2.6, { x: 91.4, z: 37.0, zoom: 5.6, az: -24, el: 44, y: .4 }]], foco: (d) => ({ x: d.tr.x - 1.8, y: .6, z: 36.6, r: 5 }),
      montar(d) { for (const a of [d.A, d.B]) a.obj.visible = false; d.cae.visible = false; d.puesta.visible = false; d.tr.obj.visible = true; d.carros.forEach((c) => (c.g.visible = true));
        camino(d.tr, [[76, Ae], [98, Ae]], { v: 2.6 }); d.tT.set([[76, Ae], [93.4, Ae]], .5); d.f = {}; },
      paso(d, t) { d.carros.forEach((c, i) => { const q = d.tr.r.en(Math.max(0, d.tr.s - 1.5 * (i + 1))); c.g.position.set(q.x, 0, q.z); c.g.rotation.y = 0; });
        d.tT.pintar(clamp(d.tr.s / 17.4), .75, t);
        if (d.tr.x > 92.6 && !d.f.p) { d.f.p = t; parada(d.tr, 2.4); ok(90.4, Ae + .6, 'Varios carros, un solo viaje', 1.2); d.f.listo = t + 2.4; }
        d.okA.at(90.4, Ae).pintar(d.f.p ? 1 : 0, t); d.bT.at(90.4, 1.0, Ae).pintar(d.f.p ? clamp(1.8 - (t - d.f.p)) : 0, t); } } });

  /* ═════════ motor ═════════ */
  let act = null, salientes = [], escala = 1;
  const actores = (d) => Object.values(d).flatMap((v) => (Array.isArray(v) ? v : [v])).filter((v) => v && v.obj && v.r !== undefined);
  function preparar(fase) {
    const d = act.d; S.reserva = { x: d.centro[0], z: d.centro[1], r: d.radio };
    for (const c of Object.values(S.cruces)) c.forzar = null; S.dockForzado = undefined; S.radarForzado = undefined; S.puertaFriaForzada = undefined;
    for (const a of actores(d)) { a.obj.visible = true; a.quieto = false; if (a.p) { md.brazos(a.p, 0); a.p.c.rotation.x = 0; } if (a.m) a.obj.rotation.z = 0; }
    for (const o of d.g.children) if (o.renderOrder >= 8) o.visible = false;
    d[fase].montar(d); act.fase = fase; act.t = 0; lentoHasta = -1;
  }
  function limpiar(diferido = 0) {
    if (!act) return; const d = act.d; d.despues.salir?.(d); d.antes.salir?.(d);
    if (diferido > 0) salientes.push({ d, t: diferido }); else d.g.visible = false;
    if (H.viga) H.viga.visible = true; S.reserva = null; for (const c of Object.values(S.cruces)) c.forzar = null; S.dockForzado = undefined; S.radarForzado = undefined; S.puertaFriaForzada = undefined; act = null;
  }
  function tomaDe(d, F, t) {
    const ks = F.cam || []; let o = ks[0]?.[1]; for (const [t0, tk] of ks) if (t >= t0) o = tk; if (!o) return null;
    if (o.sigue) { const a = d[o.sigue]; return { y: 0, ...o, x: a.x + (o.dx || 0), z: a.z + (o.dz || 0) }; }
    return { y: 0, ...o };
  }
  return {
    lista: L.map((d) => ({ id: d.id, titulo: d.titulo, antes: d.antes.texto, despues: d.despues.texto, barrido: d.barrido || d.centro })),
    activa: () => act && !act.fin && { id: act.d.id, fase: act.fase, t: act.t, dur: act.d.f?.listo ? Math.min(act.d[act.fase].dur, act.d.f.listo) : act.d[act.fase].dur },
    iniciar(id, fase = 'antes') { const d = L.find((q) => q.id === id); if (!d) return; limpiar(act && act.d !== d ? 2.2 : 0); salientes = salientes.filter((q) => q.d !== d); if (!d.listo) { d.crear(d); d.listo = true; } d.g.visible = true; if (H.viga) H.viga.visible = !d.sinViga; act = { d }; preparar(fase); },
    fase(f) { if (act) { act.fin = false; preparar(f); } },
    detener: () => { limpiar(); salientes.forEach((q) => (q.d.g.visible = false)); salientes = []; },
    // presentación de Lumina (16-nov): leer los actores de la escena y dejarla quieta al terminar una fase
    actual: () => (act ? act.d : null),
    congelar: () => { if (act) act.fin = true; },
    // la toma de cámara y el foco que pide la escena en este instante (null si no hay escena)
    toma: () => (act ? tomaDe(act.d, act.d[act.fase], act.t) : null),
    foco: () => (act ? act.d[act.fase].foco?.(act.d, act.t) || null : null),
    // cámara lenta en el momento clave
    escala(dt) { const obj = act && act.t < lentoHasta ? lentoF : 1; escala += (obj - escala) * Math.min(1, dt * 7); return escala * VEL; },
    paso(dt) {
      E.sacudida *= Math.pow(.02, dt);
      salientes = salientes.filter((q) => { q.t -= dt; if (q.t <= 0) { if (!act || act.d !== q.d) q.d.g.visible = false; return false; } return true; });
      if (!act) return null;
      const d = act.d, F = d[act.fase]; act.t += dt;
      if (!act.fin) F.paso(d, act.t, dt);
      for (const a of actores(d)) mover(a, dt);
      F.post?.(d, act.t); d.fx.ds.pintar(act.t);
      if (act.fin) return 'quieta';
      if (act.t >= F.dur || (d.f?.listo && act.t >= d.f.listo)) { if (act.fase === 'antes') return 'fase'; act.fin = true; return 'fin'; }
      return 'sigue';
    },
    E,
  };
}
