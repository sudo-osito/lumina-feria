/* Planta Neisstech v5 · escena (11-nov-2026). Construye la planta del plano de Max con todo lo inventado encima.
   Grupos: base (igual antes y después) · neiss (solo después: demarcación física, equipos y orden) · desorden (solo antes)
   · vivo (lo que se mueve). Lo amarillo, azul y luminoso es Neisstech; lo blanco y gris es la planta. */
import { THREE } from '../planta/nucleo.js';
import { modelos } from '../planta/modelos.js';
import { modelos2 } from '../planta/modelos2.js';
import { pintarPiso, MAQ, EXT, impar } from './piso.js';
import { equipos } from './equipos.js';
import * as P from './trazado.js';

export function construir(k) {
  const { M, caja, cil, esfera, std, grupo, luz, tex } = k, md = modelos(k), m2 = modelos2(k, md), eq = equipos(k, md);
  const base = grupo(), neiss = grupo(), desorden = grupo(), vivo = grupo(); vivo.userData.vivo = true;
  const H = { md, m2, eq, base, neiss, desorden, vivo, pisoA: [], pisoD: [], cruces: {}, sg: {}, docks: {}, radares: [], andon: [], robots: [], slots: {} };
  const PY = P.NIVEL_PATIO, T = .25;
  let sem = 7; const azar = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);
  const vivir = (o) => { o.userData.vivo = true; return o; };
  const cara = (dx, dz) => Math.atan2(-dz, dx);            // giro para que el +x local mire hacia (dx, dz)
  const frente = (dx, dz) => Math.atan2(dx, dz);           // giro para que el +z local mire hacia (dx, dz)
  /* trabajadores con su tarea animada (14-nov: «la mayoría están quietos sin hacer nada») */
  H.anim = [];
  const sn = Math.sin, ab = Math.abs, mx = Math.max;
  const ANIM = {
    ensamblar: (p, t) => { const a = sn(t * 2.6); p.bi.rotation.x = -.9 - .35 * a; p.bd.rotation.x = -.9 + .35 * a; p.c.rotation.x = .14 + .05 * sn(t * 1.3); },
    maquina: (p, t) => { p.bd.rotation.x = -1.15 + .18 * sn(t * 1.7); p.bi.rotation.x = -.35 - .45 * mx(0, sn(t * .6)); p.c.rotation.x = .1; },
    comer: (p, t) => { p.bi.rotation.x = -.7; p.bd.rotation.x = -.7 - .75 * mx(0, sn(t * 1.1)); },
    teclear: (p, t) => { p.bi.rotation.x = -.85 + .07 * sn(t * 9); p.bd.rotation.x = -.85 + .07 * sn(t * 9 + 1.5); p.c.rotation.x = .06; },
    hablar: (p, t) => { p.bd.rotation.x = -.6 - .55 * ab(sn(t * 1.4)); p.bd.rotation.z = -.25 * sn(t * .9); p.bi.rotation.x = -.25 - .2 * ab(sn(t * 1.1 + 1)); },
    revisar: (p, t) => { p.bi.rotation.x = -1.0; p.bd.rotation.x = -.95 + .12 * sn(t * 3); p.c.rotation.x = .08 + .04 * sn(t * .7); },
    reparar: (p, t) => { p.bi.rotation.x = -1.1 + .3 * sn(t * 3); p.bd.rotation.x = -1.1 - .3 * sn(t * 3); },
  };
  function trabajador(tipo, x, z, ry, anim, pose, b, modo) {
    const p = md.persona(tipo, vivo); p.g.position.set(x, 0, z); p.g.rotation.y = ry; p.c.rotation.order = 'YXZ';
    if (pose === 'sentada') { md.sentar(p); p.g.position.y = .02; md.brazos(p, .7); }
    if (pose === 'piso') { md.sentar(p); p.g.position.y = -.2; }
    const ph = azar() * 6.28;
    if (anim === 'pasear') {   // camina de x,z a b, toma algo en alto, vuelve y lo deja (ciclo de 11 s)
      const [x2, z2] = b, L = Math.hypot(x2 - x, z2 - z), ida = Math.atan2(-(z2 - z), x2 - x);
      H.anim.push((t0) => { const t = (t0 + ph) % 11; let q, mov = 0, th = ida;
        if (t < 4) { q = t / 4; mov = 1; } else if (t < 5.5) q = 1; else if (t < 9.5) { q = 1 - (t - 5.5) / 4; mov = 1; th = ida + Math.PI; } else q = 0;
        const e = q * q * (3 - 2 * q); p.g.position.set(x + (x2 - x) * e, 0, z + (z2 - z) * e); p.g.rotation.y = mov ? th : ida + Math.PI / 2;
        if (mov) { md.andar(p, .8, t0); } else { p.pi.rotation.x = p.pd.rotation.x = 0; const r = t < 5.5 ? -2.3 : -1.0; p.bi.rotation.x = r + .1 * sn(t0 * 4); p.bd.rotation.x = r - .1 * sn(t0 * 4); } void L; });
    } else if (ANIM[anim]) H.anim.push((t) => ANIM[anim](p, t + ph));
    if (modo) { p.g.userData.vivo = true; modo.add(p.g); }
    return p;
  }
  // grúa detenida (cargando o en mantención): sin pallet, sin operador y sin luz de piso
  function gruaQuieta(padre, x, y, z, ry, alza = 0) { const m = md.montacargas(padre); m.g.position.set(x, y, z); m.g.rotation.y = ry; if (alza) m.levantar(alza); for (const o of [m.carga, m.spot, m.cams, m.op?.g]) o?.parent?.remove(o); return m; }

  /* ═════════ terreno, losas y piso pintado ═════════ */
  caja(140, .3, 130, 75, -1.6, 25, M.pasto, base, 0).castShadow = false;
  const losa = (r, y0, y1, m = M.losa) => { caja(r.x1 - r.x0, y1 - y0, r.z1 - r.z0, (r.x0 + r.x1) / 2, y0, (r.z0 + r.z1) / 2, m, base, 0).castShadow = false; };
  losa(P.PATIO, PY - .3, PY, M.asfalto); losa({ x0: 112.2, x1: 122, z0: -20, z1: 70 }, PY - .32, PY - .02, M.asfalto);
  const NAVE_R = { x0: P.NAVE.x0 - .125, x1: P.NAVE.x1 + .125, z0: P.NAVE.z0 - .125, z1: P.NAVE.z1 + .125 };
  losa(NAVE_R, -1.45, 0);
  const ANEXO_O = { x0: 29.4, x1: 44.875, z0: 4.875, z1: 55.125 }, ANEXO_S = { x0: 57, x1: 97, z0: 55.125, z1: 64.4 };
  losa(ANEXO_O, -1.45, 0); losa(ANEXO_S, -1.45, 0);
  { const L = Math.hypot(P.RAMPA.z1 - P.RAMPA.z0, -PY), r = new THREE.Mesh(new THREE.BoxGeometry(P.RAMPA.x1 - P.RAMPA.x0, .3, L), M.asfalto);
    r.position.set((P.RAMPA.x0 + P.RAMPA.x1) / 2, PY / 2 - .15, (P.RAMPA.z0 + P.RAMPA.z1) / 2); r.rotation.x = -Math.atan2(-PY, P.RAMPA.z1 - P.RAMPA.z0); r.receiveShadow = true; base.add(r);
    for (const x of [P.RAMPA.x0 - .1, P.RAMPA.x1 + .1]) caja(.2, .5, P.RAMPA.z1 - P.RAMPA.z0, x, PY, (P.RAMPA.z0 + P.RAMPA.z1) / 2, M.gris2, base, .02); }
  // escalera de la puerta norte con baranda
  for (let i = 0; i < 4; i++) caja(1.6, (i + 1) * .275, .37, 68, PY, 3.4 + .37 * i + .185, M.losa, base, .01);
  for (const x of [67.15, 68.85]) { k.barra(new THREE.Vector3(x, PY + 1.0, 3.45), new THREE.Vector3(x, .95, 4.8), .05, M.acero, base); caja(.05, 1.0, .05, x, PY, 3.45, M.acero, base, .01); }

  const ppm = k.movil ? 12 : 20, X0 = P.MUNDO.x0, Z0 = P.MUNDO.z0, MW = P.MUNDO.x1 - X0, MD = P.MUNDO.z1 - Z0;
  const texPiso = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const mA = new THREE.MeshStandardMaterial({ map: texPiso(pintarPiso(ppm, true)), roughness: .93 });
  const mD = new THREE.MeshStandardMaterial({ map: texPiso(pintarPiso(ppm, false)), roughness: .88, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  H.matPisoD = mD;
  function parche(r, y) {
    const g = new THREE.PlaneGeometry(r.x1 - r.x0, r.z1 - r.z0); g.rotateX(-Math.PI / 2); g.translate((r.x0 + r.x1) / 2, y, (r.z0 + r.z1) / 2);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) - X0) / MW, 1 - (pos.getZ(i) - Z0) / MD);
    const a = vivir(new THREE.Mesh(g, mA)); a.receiveShadow = true; base.add(a); H.pisoA.push(a);
    const d = vivir(new THREE.Mesh(g, mD)); d.receiveShadow = true; d.position.y = .004; d.renderOrder = 1; base.add(d); H.pisoD.push(d);
  }
  parche(NAVE_R, .002); parche(ANEXO_O, .002); parche(ANEXO_S, .002);
  parche(P.PATIO, PY + .002); parche({ x0: 112.2, x1: 122, z0: -20, z1: 70 }, PY - .018);

  /* ═════════ muros ═════════ */
  const corte = M.corte;
  function muro(w, h, d, x, y, z, mat = M.muro, padre = base) { caja(w, h, d, x, y, z, mat, padre, .02); caja(w + .01, .04, d + .01, x, y + h, z, corte, padre, .01); }
  function muroX(z, x0, x1, huecos, h, mat, padre) { let a = x0; for (const [h0, h1, al] of [...huecos].sort((p, q) => p[0] - q[0])) { if (h0 - a > .05) muro(h0 - a, h, T, (a + h0) / 2, 0, z, mat, padre); if (al < h) muro(h1 - h0, h - al, T, (h0 + h1) / 2, al, z, mat, padre); a = h1; } if (x1 - a > .05) muro(x1 - a, h, T, (a + x1) / 2, 0, z, mat, padre); }
  function muroZ(x, z0, z1, huecos, h, mat, padre) { let a = z0; for (const [h0, h1, al] of [...huecos].sort((p, q) => p[0] - q[0])) { if (h0 - a > .05) muro(T, h, h0 - a, x, 0, (a + h0) / 2, mat, padre); if (al < h) muro(T, h - al, h1 - h0, x, al, (h0 + h1) / 2, mat, padre); a = h1; } if (z1 - a > .05) muro(T, h, z1 - a, x, 0, (a + z1) / 2, mat, padre); }
  const hueco = (c, w, al) => [c - w / 2, c + w / 2, al];
  const cortina = std(0xD3D9E1);
  muroX(P.MURO_N.z, P.MURO_N.x0 - T / 2, P.MURO_N.x1 + T / 2, [...P.ANDENES.map((a) => hueco(a.x, a.w, 3.0)), hueco(P.PUERTAS.norte.x, 1, 2.2), hueco(P.PORTON_PATIO.x, P.PORTON_PATIO.w, 3.6)], P.MURO_N.alto);
  muroX(P.MURO_M.z, P.MURO_M.x0, P.MURO_M.x1, [hueco(P.PORTON_M1.x, P.PORTON_M1.w, 3.0), hueco(P.PORTON_M2.x, P.PORTON_M2.w, 3.0), hueco(P.PUERTAS.m1.x, 1, 2.2), hueco(P.PUERTAS.m2.x, 1, 2.2)], P.MURO_M.alto);
  muroZ(P.MURO_O.x, P.MURO_O.z0 - T / 2, P.MURO_O.z1 + T / 2, [hueco(P.BODEGA.porton, 3, 3.0), hueco(P.PORTON_TALLER.z, P.PORTON_TALLER.w, 3.2), hueco(P.PUERTAS.oficinas.z, 1, 2.2)], P.MURO_O.alto);
  muroZ(P.MURO_E.x, P.MURO_E.z0 - T / 2, P.MURO_E.z1 + T / 2, [], P.MURO_E.alto);
  muroX(P.MURO_S.z, P.MURO_S.x0, P.MURO_S.x1, [hueco(P.PUERTAS.sur.x, 1.2, 2.2), hueco(P.PORTON_LIMPIO.x, P.PORTON_LIMPIO.w, 3.0)], P.MURO_S.alto);
  // cortinas enrolladas sobre los portones y marcos de puertas
  for (const [x, w, z, y] of [[P.PORTON_M1.x, P.PORTON_M1.w, 25, 3.0], [P.PORTON_M2.x, P.PORTON_M2.w, 25, 3.0], [P.PORTON_PATIO.x, P.PORTON_PATIO.w, 5, 3.6], ...P.ANDENES.map((a) => [a.x, a.w, 5, 3.0])]) for (const s of z === 5 ? [1] : [-1, 1]) caja(w + .3, .36, .34, x, y - .02, z + s * .3, cortina, base, .08);
  caja(.34, .36, P.PORTON_TALLER.w + .3, 44.7, 3.18, P.PORTON_TALLER.z, cortina, base, .08); caja(.34, .36, 3.3, 44.7, 2.98, P.BODEGA.porton, cortina, base, .08);
  // andenes: sellos, topes y niveladoras
  const sello = std(0x4E5462, { roughness: .85 });
  const matNivelador = new THREE.MeshStandardMaterial({ roughness: .6, map: k.tex((c, w, h) => { c.fillStyle = '#F2C200'; c.fillRect(0, 0, w, h); c.fillStyle = '#1B1D22'; for (let i = -h; i < w + h; i += 48) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 24, 0); c.lineTo(i + 24 + h, h); c.lineTo(i + h, h); c.fill(); } }, 256, 80) });
  for (const a of P.ANDENES) {
    for (const s of [-1, 1]) caja(.18, 3.0, .4, a.x + s * 1.66, PY + .8, 4.68, sello, base, .04);
    caja(3.5, .45, .4, a.x, 2.6, 4.68, sello, base, .04);
    for (const s of [-1, 1]) caja(.3, .35, .2, a.x + s * 1.1, -.55, 4.8, M.negro, base, .04);
    { const n = caja(3.0, .06, .95, a.x, -.01, 5.5, matNivelador, base, .01); n.receiveShadow = true; }
  }

  /* ═════════ cámara de frío (muros del plano): paneles aislados, equipos de frío, cortina de lamas y luz fría ═════════ */
  const panel = std(0xEEF3F8, { roughness: .42 }), junta = std(0xC6D0DB, { roughness: .5 }), F = P.FRIO;
  muroZ(F.x0, F.z0 + T / 2, F.z1, [hueco(F.puerta.z, F.puerta.w, 2.3)], F.alto, panel);
  muroX(F.z1, F.x0 - T / 2, F.x1, [], F.alto, panel);
  for (let z = F.z0 + 1.15; z < F.z1 - .2; z += 1.15) if (Math.abs(z - F.puerta.z) > 1.2) caja(.02, F.alto - .06, .04, F.x0 - .135, .02, z, junta, base, 0);
  for (let x = F.x0 + 1.15; x < F.x1 - .2; x += 1.15) caja(.04, F.alto - .06, .02, x, .02, F.z1 + .135, junta, base, 0);
  caja(.05, .28, F.z1 - F.z0 - .3, F.x0 - .15, F.alto - .3, (F.z0 + F.z1) / 2, std(0x2F7BE8, { roughness: .4 }), base, .01);
  caja(F.x1 - F.x0 - .2, .28, .05, (F.x0 + F.x1) / 2, F.alto - .3, F.z1 + .15, std(0x2F7BE8, { roughness: .4 }), base, .01);
  caja(F.x1 - F.x0 + .2, .22, F.z1 - F.z0, (F.x0 + F.x1) / 2, F.alto, (F.z0 + F.z1) / 2, std(0xDCE3EA), base, .04);
  // equipos de frío en el techo con sus ventiladores y cañerías
  for (const z of [28.4, 33.6]) { caja(2.4, .85, 1.7, 107.0, F.alto + .22, z, std(0xE3E8EE, { roughness: .4 }), base, .08); caja(2.42, .1, 1.72, 107.0, F.alto + .22, z, M.gris2, base, .02);
    for (const dz of [-.42, .42]) { cil(.34, .04, 107.0, F.alto + 1.07, z + dz, M.tinta, base, 24); cil(.06, .06, 107.0, F.alto + 1.09, z + dz, M.gris2, base, 10); }
    const c1 = cil(.05, 2.6, 105.6, F.alto + .45, z, M.acero, base, 8); c1.rotation.z = Math.PI / 2; }
  // marco de la puerta, riel, puerta corrediera aislada y cortina de lamas de PVC
  const marco = std(0x9AA3AE, { roughness: .35, metalness: .45 });
  for (const s2 of [-1, 1]) caja(.2, 2.5, .14, F.x0 - .2, 0, F.puerta.z + s2 * (F.puerta.w / 2 + .07), marco, base, .02);
  caja(.2, .16, F.puerta.w + .3, F.x0 - .2, 2.42, F.puerta.z, marco, base, .02);
  caja(.12, .12, 4.0, F.x0 - .26, 2.5, F.puerta.z + .9, M.acero, base, .02);
  H.frio = { hoja: vivir(grupo(F.x0 - .3, 0, F.puerta.z, 0, base)) };
  caja(.12, 2.36, F.puerta.w + .1, 0, 0, 0, std(0xF4F7FA, { roughness: .35 }), H.frio.hoja, .03); caja(.13, .25, F.puerta.w + .12, 0, .12, 0, std(0xF5C400, { roughness: .4 }), H.frio.hoja, .02);
  caja(.08, .5, .06, -.09, 1.05, -.6, M.acero, H.frio.hoja, .02);
  const lama = std(0xBFE2FF, { roughness: .1, transparent: true, opacity: .45 });
  for (let i = 0; i < 7; i++) caja(.01, 2.25, .24, F.x0 + .02, .02, F.puerta.z - F.puerta.w / 2 + .14 + i * .24, lama, base, 0);
  H.frio.abrir = (q) => (H.frio.hoja.position.z = F.puerta.z + q * (F.puerta.w + .12));
  H.frio.luz = luz(0x22C55E, 0x123a20); esfera(.08, F.x0 - .22, 2.72, F.puerta.z - 1.1, H.frio.luz, base, 12);
  { const t = tex((c, w, h) => { c.fillStyle = '#0c1118'; c.fillRect(0, 0, w, h); c.fillStyle = '#5EE1FF'; c.font = `700 ${h * .62}px Poppins, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('−18 °C', w / 2, h / 2 + 2); }, 256, 96);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.62, .24), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.rotation.y = -Math.PI / 2; m.position.set(F.x0 - .14, 1.75, F.puerta.z - 1.25); base.add(m);
    caja(.04, .3, .7, F.x0 - .14, 1.6, F.puerta.z - 1.25, M.negro, base, .01); }
  // adentro: luz fría en el cielo, piso escarchado, estanterías y pallets con cajas blancas
  { const fr = new THREE.Mesh(new THREE.PlaneGeometry(F.x1 - F.x0 - .4, F.z1 - F.z0 - .4), new THREE.MeshBasicMaterial({ color: 0xBFE6FF, transparent: true, opacity: .35, depthWrite: false })); fr.rotation.x = -Math.PI / 2; fr.position.set((F.x0 + F.x1) / 2, .012, (F.z0 + F.z1) / 2); base.add(vivir(fr));
    caja(F.x1 - F.x0 - .6, .03, 1.0, (F.x0 + F.x1) / 2, F.alto - .05, 31, std(0xFFFFFF, { emissive: 0x9AD8FF, emissiveIntensity: 1.2 }), base, .01); }
  for (const x of [105.6, 108.4]) md.estanteria(base, x, 26.4, 35.6);
  // vapor frío que sale cuando se abre la puerta
  H.frio.vapor = Array.from({ length: 14 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(.35, 10, 8), new THREE.MeshBasicMaterial({ color: 0xE6F4FF, transparent: true, opacity: 0, depthWrite: false })); m.renderOrder = 5; base.add(vivir(m)); return { m, t: Math.random() }; });

  /* ═════════ pallets ═════════ */
  const film = M.film;
  function palletR(padre, x, y, z, ry = 0, alto = .8, carga = 'caja') {   // pallet simple (2 piezas) para racks y pisos
    const g = grupo(x, y, z, ry, padre); caja(1.0, .14, 1.15, 0, 0, 0, M.madera, g, .01);
    caja(.94, alto, 1.08, 0, .14, 0, carga === 'film' ? film : (azar() > .5 ? M.caja : M.caja2), g, .05); return g;
  }
  const palletVacio = (padre, x, z, ry = 0) => { const g = grupo(x, 0, z, ry, padre); caja(1.0, .14, 1.15, 0, 0, 0, M.madera, g, .01); return g; };

  /* ═════════ zona de andén: espera de pallets, oficina, pallets vacíos ═════════ */
  const E = P.ESPERA;
  // después: cada pallet en su ubicación; antes: donde quedó
  E.filas.forEach((z, i) => E.xs.forEach((x, j) => { if ((i * 7 + j * 3) % 5 < 3 && !(j === 0 && (i === 1 || i === 2))) palletR(neiss, x, 0, z, Math.PI / 2, .7 + (j % 3) * .1); }));
  for (let n = 0; n < 22; n++) { const x = 47 + azar() * 8.2, z = 6.4 + azar() * 7.8; if (Math.abs(z - 8.5) < .9 && x > 53) continue; if (Math.abs(z - 10.1) < .9 && x > 53) continue; palletR(desorden, x, 0, z, azar() * 3, .6 + azar() * .5); }
  for (const [x, z, r] of [[57.2, 6.3, .3], [58.3, 11.1, 1.2], [61.9, 7.6, .1], [57.1, 14.3, 2.1], [61.8, 20.8, .4]]) palletR(desorden, x, 0, z, r, .7);
  // ranuras que cambian (las usan las grúas): espera R2 (deja la grúa del andén) y D2 (retira la del almacén)
  H.slots.R2 = vivir(palletR(base, E.xs[0], 0, E.filas[1], Math.PI / 2, .75)); H.slots.R3 = vivir(palletR(base, E.xs[0], 0, E.filas[2], Math.PI / 2, .75));
  // oficina de andén vidriada
  { const O = P.OFICINA_ANDEN, vid = M.vidrio;
    for (const [x, z] of [[O.x0, O.z0], [O.x1, O.z0], [O.x0, O.z1], [O.x1, O.z1]]) caja(.12, 2.6, .12, x, 0, z, M.blanco, base, .02);
    caja(O.x1 - O.x0, 2.3, .05, (O.x0 + O.x1) / 2, .3, O.z0, vid, base, .01); caja(.05, 2.3, O.z1 - O.z0, O.x1, .3, (O.z0 + O.z1) / 2, vid, base, .01);
    caja(.05, 2.3, O.z1 - O.z0 - 1.2, O.x0, .3, (O.z0 + O.z1) / 2 + .6, vid, base, .01); caja(O.x1 - O.x0, .3, .08, (O.x0 + O.x1) / 2, 0, O.z0, M.blanco, base, .02);
    caja(O.x1 - O.x0 + .1, .08, O.z1 - O.z0 + .1, (O.x0 + O.x1) / 2, 2.6, (O.z0 + O.z1) / 2, M.blanco, base, .02);
    caja(2.6, .05, .8, 49.4, .75, 19.0, std(0xE9DCC3), base, .02); for (const x of [48.3, 50.5]) caja(.05, .75, .7, x, 0, 19.0, M.gris2, base, .01);
    for (const x of [48.6, 50.2]) { caja(.5, .32, .03, x, .8, 18.75, M.tinta, base, .01); }
    caja(.6, 1.9, .5, 52.4, 0, 23.6, M.gris, base, .03); caja(.6, 1.9, .5, 51.7, 0, 23.6, M.gris, base, .03);
    trabajador('oficina', 48.9, 19.75, Math.PI / 2, 'teclear', 'sentada'); trabajador('supervisor', 50.8, 21.6, Math.PI * .8, 'revisar');
  }
  // pallets vacíos: pilas ordenadas (después) o desparramadas (antes)
  for (let i = 0; i < 5; i++) m2.apilado(neiss, 55.2 + i * 1.2, 22.4, 'madera', 6 + (i % 3) * 2);
  for (let i = 0; i < 6; i++) { const g = m2.apilado(desorden, 55 + i * 1.1 + azar() * .3, 21.8 + azar() * 1.2, 'madera', 3 + Math.round(azar() * 7)); g.rotation.y = azar() * .8; }
  for (const [x, z, r] of [[59.7, 19.4, .6], [56.6, 19.8, 2.4]]) palletVacio(desorden, x, z, r);

  /* ═════════ almacén: dos bloques de racks ═════════ */
  H.pasillos = {};
  for (const [bn, b] of [['N', P.BLOQUE_N], ['S', P.BLOQUE_S]]) {
    for (const [x0, x1] of P.FILAS_RACK) {
      const f = md.filaRack(base, x0, x1, b.z0, b.z1, P.RACK.niveles, P.RACK.alto);
      for (const h of f.huecos) if (azar() > .2) palletR(base, h.x, h.y + (h.y ? .04 : 0), h.z, 0, .7 + azar() * .18, azar() > .6 ? 'film' : 'caja');
    }
    // cabeceras de rack: protectores (después)
    const zc = bn === 'N' ? b.z1 + .35 : b.z0 - .35;
    for (const [x0, x1] of P.FILAS_RACK) { const g = vivir(grupo((x0 + x1) / 2, 0, zc, bn === 'N' ? 0 : Math.PI, neiss)); md.protectorRack(g, -(x1 - x0) / 2 - .05, (x1 - x0) / 2 + .05, 0); (H.protRack ||= []).push({ g, x: (x0 + x1) / 2, z: zc, bloque: bn }); }
    // letrero de pasillo sobre una viga entre filas (después)
    P.PASILLOS_RACK.forEach((x, i) => { const z = bn === 'N' ? b.z1 - .05 : b.z0 + .05; caja(3.1, .14, .14, x, P.RACK.alto - .1, z, M.amarillo, neiss, .02);
      cartel(neiss, `${bn === 'N' ? 'A' : 'B'}${i + 1}`, x, P.RACK.alto + .05, z, bn === 'N' ? -Math.PI / 2 : Math.PI / 2, 1.1, .6); });
  }
  // etiquetas de ubicación en las vigas del primer nivel, de cara a cada pasillo (después)
  for (const b of [P.BLOQUE_N, P.BLOQUE_S]) P.PASILLOS_RACK.forEach((x, i) => { for (let j = 0; j < 4; j++) { const z = b.z0 + .7 + j * (b.z1 - b.z0 - 1.4) / 3; for (const s of [-1, 1]) md.etiqueta(neiss, `${b === P.BLOQUE_N ? 'A' : 'B'}${i + 1}-${j + 1}`, x + s * 1.47, 1.42, z, s < 0 ? Math.PI / 2 : -Math.PI / 2); } });
  // antes: montante dañado, pallet salido al pasillo, cajas caídas
  { const m = caja(.08, 4.6, .08, 85.86, 0, 9.0, std(0x8FA0B6), desorden, .01); m.rotation.z = .09; m.rotation.x = -.05;
    palletR(desorden, 86.6, 1.49, 11.6, .18, .8); for (const [x, z, r] of [[71.6, 8.4, .4], [72.3, 9.1, 1.1], [71.9, 10.3, .2], [87.6, 22.1, .8]]) caja(.46, .38, .54, x, 0, z, M.caja2, desorden, .03).rotation.y = r; }

  /* ═════════ carga de baterías ═════════ */
  const C = P.CARGA;
  C.bahias.forEach((z, i) => { md.tableroElectrico(base, 109.55, z, Math.PI); caja(.04, .04, 1.0, 109.1, .9, z + .2, M.negro, base, .005);
    if (i < 4) for (const s of [-1, 1]) md.bolardo(neiss, 104.1, z + s * 1.55); });
  for (const [i, ry] of [[1, 0], [3, 0]]) gruaQuieta(neiss, 106.6, 0, C.bahias[i], ry);
  for (const [z, ry] of [[10.2, .5], [16.8, -.35]]) gruaQuieta(desorden, 105.8, 0, z, ry);
  for (const [x, z] of [[107.4, 6.6], [108.1, 7.4], [104.8, 20.6], [105.6, 21.4]]) caja(.8, .55, .6, x, 0, z, M.negro, desorden, .04);
  for (const [x0, z0, x1, z1] of [[109.1, 12.5, 104.6, 13.8], [109.1, 19.6, 103.8, 18.2], [109.1, 8.2, 106.6, 10.4]]) k.barra(new THREE.Vector3(x0, .03, z0), new THREE.Vector3(x1, .03, z1), .04, M.negro, desorden);
  md.extintor(neiss, 109.4, 24.0, Math.PI); md.letrero(neiss, 'img/letreros/s-extintor.webp', .3, 109.0, 1.7, 24.3, Math.PI, 'poste');
  md.letrero(neiss, 'img/letreros/p-carga.webp', .42, 103.9, 1.6, 5.9, 0, 'poste');

  /* ═════════ descanso y lean corner ═════════ */
  m2.vending(base, 46.6, 26.0, -Math.PI / 2, 0xE5383B, 'BEBIDAS'); m2.vending(base, 47.6, 26.0, -Math.PI / 2, 0x056CF2, 'AGUA'); m2.vending(base, 48.6, 26.0, -Math.PI / 2, 0x2B2F36, 'CAFÉ');
  m2.casilleros(base, 45.55, 29.4, 0, 5);
  for (const [x, z] of [[50.2, 28.4], [50.2, 31.0]]) { caja(2.2, .05, .8, x, .74, z, M.blanco, base, .03); for (const dx of [-.9, .9]) caja(.06, .74, .6, x + dx, 0, z, M.gris2, base, .01); for (const s of [-1, 1]) caja(2.1, .05, .3, x, .44, z + s * .62, M.gris, base, .02); }
  trabajador('operario', 49.6, 29.02, Math.PI / 2, 'comer', 'sentada'); trabajador('operario', 50.9, 27.78, -Math.PI / 2, 'comer', 'sentada'); trabajador('oficina', 50.4, 31.62, Math.PI / 2, 'comer', 'sentada');
  md.letrero(neiss, 'img/letreros/s-botiquin.webp', .3, 52.4, 1.55, 25.15, -Math.PI / 2);
  { const Lc = P.LEAN, w = Lc.x1 - Lc.x0, d = Lc.z1 - Lc.z0, g = grupo((Lc.x0 + Lc.x1) / 2, 0, (Lc.z0 + Lc.z1) / 2, Math.PI, neiss); m2.leanCorner(g, -w / 2, w / 2, -d / 2, d / 2); }
  mesaPapeles(desorden, 57.4, 28.6, 2.0, 1.0);
  trabajador('supervisor', 55.5, 27.3, -Math.PI / 2, 'hablar'); trabajador('operario', 56.6, 29.9, Math.PI / 2, 'revisar'); trabajador('operario', 57.6, 30.1, Math.PI / 2, 'hablar'); trabajador('operario', 58.6, 29.9, Math.PI / 2, 'revisar');

  /* ═════════ kitting / supermercado ═════════ */
  // después: supermercado de flujo, estanterías con cajas organizadoras y carros de kitting en su lugar (Neisstech)
  m2.superFlujo(neiss, 70.4, 77.8, 26.2, 29.8); m2.superFlujo(neiss, 79.4, 86.8, 26.2, 29.8);
  for (const x of [89.9, 92.0, 94.1]) md.estanteria(neiss, x, 26.2, 29.4);
  for (let i = 0; i < 4; i++) { const c = md.carroKitting(neiss, i % 2 ? M.azul : M.amarillo); c.g.position.set(90.05 + i * 1.5, 0, 31.4); c.g.rotation.y = Math.PI / 2; }
  m2.info(neiss, 69.9, 31.8, Math.PI / 2);
  // antes: estanterías viejas con cajas de cartón donde cupieron y carros a mano sueltos
  for (const [x0, x1] of [[70.4, 76.2], [78.0, 83.8], [86.0, 91.4]]) estanteViejo(desorden, x0, x1, 26.5);
  for (const [x, z, r] of [[72.6, 31.9, .4], [84.2, 32.1, -.3], [93.4, 31.0, 1.2]]) { const c = eq.carroMano(desorden, 2 + Math.round(azar() * 3)); c.position.set(x, 0, z); c.rotation.y = r; }
  for (const [x, z] of [[76.1, 31.8], [76.6, 32.2], [81.6, 31.6], [88.4, 30.6], [88.9, 31.2]]) caja(.5, .4, .4, x, 0, z, M.caja, desorden, .03).rotation.y = azar();
  trabajador('operario', 71.4, 30.4, 0, 'pasear', null, [76.8, 30.4]); trabajador('operario', 80.4, 30.4, 0, 'pasear', null, [85.8, 30.4]);

  /* ═════════ punto de encuentro y gestión visual ═════════ */
  { const t = md.tablero(neiss, 81.3, .55, 38.75, -Math.PI / 2, 3.4, 1.7, (c, W, Hh) => {
      c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#056CF2'; c.fillRect(0, 0, W, Hh * .16);
      c.fillStyle = '#fff'; c.font = `700 ${Hh * .09}px Poppins, Arial`; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText('GESTIÓN VISUAL · TURNO', W * .04, Hh * .08);
      ['SEGURIDAD', 'CALIDAD', 'ENTREGA', 'PERSONAS'].forEach((n, i) => { const x = W * (.04 + i * .24); c.fillStyle = '#EEF2F7'; c.fillRect(x, Hh * .22, W * .22, Hh * .72);
        c.fillStyle = '#1b2230'; c.font = `700 ${Hh * .065}px Poppins, Arial`; c.fillText(n, x + W * .015, Hh * .28);
        for (let j = 0; j < 5; j++) { c.fillStyle = j === 2 && i === 1 ? '#F5C400' : '#22C55E'; c.beginPath(); c.arc(x + W * .03, Hh * (.4 + j * .1), Hh * .025, 0, 7); c.fill(); c.fillStyle = '#9AA3AE'; c.fillRect(x + W * .055, Hh * (.39 + j * .1), W * (.08 + (j % 3) * .03), Hh * .02); } });
    }, true);
    void t; }
  m2.cube(neiss, 84.6, 42.6); m2.info(neiss, 76.6, 38.3, 0);
  md.letrero(neiss, 'img/letreros/s-encuentro.webp', .5, 71.2, 2.0, 38.6, -Math.PI / 4, 'poste');
  trabajador('supervisor', 81.3, 40.4, Math.PI / 2, 'hablar');
  for (const [x, z, n] of [[79.8, 39.6, 3], [80.6, 39.4, 2], [82.4, 39.5, 4], [77.4, 41.6, 2]]) for (let i = 0; i < n; i++) caja(.6, .45, .5, x + (i % 2) * .1, i * .45, z, i % 2 ? M.caja : M.caja2, desorden, .03);
  palletR(desorden, 73.2, 0, 40.4, .5, .8); palletR(desorden, 74.6, 0, 41.8, 1.3, .6); mesaPapeles(desorden, 81.3, 39.6, 2.2, .9);

  /* ═════════ maquinaria ═════════ */
  m2.torno(base, 73, 47.4); m2.torno(base, 73, 51.8); m2.taladro(base, 79.4, 47.4); m2.taladro(base, 79.4, 51.8);
  { const r = m2.celdaRobot(base, 83.4, 49.6); vivir(r.base); H.robots.push(r); }
  trabajador('operario', 73.2, 48.55, Math.PI / 2, 'maquina'); trabajador('operario', 72.6, 52.95, Math.PI / 2, 'maquina'); trabajador('operario', 79.4, 48.5, Math.PI / 2, 'maquina');
  // máquinas funcionando: plato del torno que gira, carro que avanza con chispa; broca del taladro que baja; luz de estado
  for (const [x, z] of [[73, 47.4], [73, 51.8]]) {
    const plato = vivir(grupo(x - .42, 1.1, z, 0, base)), c1 = cil(.2, .14, 0, -.07, 0, M.acero, plato, 18); c1.rotation.z = Math.PI / 2; c1.position.set(.07, 0, 0); caja(.06, .1, .06, 0, .17, 0, M.tinta, plato, .01); caja(.06, .1, .06, 0, -.27, 0, M.tinta, plato, .01);
    const carro = vivir(grupo(x, .8, z + .05, 0, base)); caja(.32, .22, .42, 0, 0, 0, M.gris2, carro, .03); caja(.2, .05, .06, -.12, .24, 0, M.tinta, carro, .01);
    const chispa = luz(0xFF9A3C, 0x222222); esfera(.035, -.24, .28, 0, chispa, carro, 8);
    const st = luz(0x22C55E, 0x123a20); cil(.045, .12, x - .85, 1.42, z + .28, st, base, 10); st.emissiveIntensity = 1.8;
    H.anim.push((t) => { plato.rotation.x = t * 14; carro.position.x = x + .05 + .32 * sn(t * .45); chispa.emissiveIntensity = sn(t * 31) > .2 ? 3 : .2; });
  }
  for (const [x, z] of [[79.4, 47.4], [79.4, 51.8]]) {
    const broca = vivir(grupo(x, 1.5, z - .05, 0, base)); cil(.028, .32, 0, -.32, 0, M.acero, broca, 8); cil(.06, .06, 0, -.06, 0, M.tinta, broca, 10);
    const st = luz(0x22C55E, 0x123a20); cil(.045, .12, x + .25, 2.0, z - .05, st, base, 10); st.emissiveIntensity = 1.8;
    H.anim.push((t) => { const q = .5 + .5 * sn(t * 1.3); broca.position.y = 1.5 - .3 * q; broca.rotation.y = t * 20; });
  }
  for (const [x, z] of [[75.9, 47.0], [76.4, 50.4], [81.2, 46.2]]) { caja(.6, .9, .45, x, 0, z, std(0x5C6675), neiss, .04); caja(.62, .04, .47, x, .9, z, M.tinta, neiss, .01); }
  for (const [x, z, r] of [[75.2, 48.9, .3], [70.6, 50.0, 1.1], [77.2, 52.8, .7], [81.0, 50.8, .2], [76.0, 46.0, 1.6]]) caja(.5, .36, .42, x, 0, z, M.caja2, desorden, .03).rotation.y = r;
  for (const [x0, z0, x1, z1] of [[71.2, 46.2, 75.8, 49.4], [77.6, 53.2, 80.6, 49.4], [84.6, 47.0, 81.8, 45.4]]) k.barra(new THREE.Vector3(x0, .03, z0), new THREE.Vector3(x1, .03, z1), .04, M.negro, desorden);
  for (const [x, z] of [[74.6, 48.9], [74.2, 53.0], [78.4, 48.6]]) cil(.28, .1, x, 0, z, M.acero, desorden, 10, .02);

  /* ═════════ ensamble ═════════ */
  P.ENSAMBLE.lineas.forEach((z, li) => {
    md.cinta(base, 91.8, 104.4, z - 1.05);
    for (const x of P.ENSAMBLE.xs) { const e = md.estacion(neiss, x, z); H.andon.push(e.andon); trabajador('operario', x, z + 1.0, Math.PI / 2, 'ensamblar', null, null, neiss); }
    const MAL = li === 0 ? [[93.7, .2, .25, 1], [97.6, -.26, .55, 1], [102.1, .32, .1, 0]] : [[94.2, -.18, .4, 1], [98.8, .28, .15, 0], [102.6, -.12, .5, 1]];
    for (const [x, r, dz, conP] of MAL) { const m = md.mesaBaja(desorden, x, z + dz); m.g.rotation.y = r;
      if (conP) trabajador('operario', x - Math.sin(r) * .9, z + dz + Math.cos(r) * .9, Math.PI / 2 + r, 'ensamblar', null, null, desorden); }
  });
  { const r = m2.celdaRobot(base, 107.2, 49.4); vivir(r.base); H.robots.push(r); }
  // cajas que avanzan por las cintas de las dos líneas
  for (const z of P.ENSAMBLE.lineas) for (let i = 0; i < 7; i++) { const b = vivir(grupo(92, .84, z - 1.05, 0, base)); caja(.4, .26, .32, 0, 0, 0, i % 2 ? M.caja : M.caja2, b, .03); const ph = i / 7;
    H.anim.push((t) => { b.position.x = 92 + ((ph + t * .04) % 1) * 12.2; }); }
  for (const [x, z, r] of [[96.8, 43.6, .4], [101.6, 44.0, 1.2], [99.2, 51.6, .6], [104.6, 52.6, .1]]) caja(.6, .42, .5, x, 0, z, M.caja, desorden, .03).rotation.y = r;

  /* ═════════ producto terminado ═════════ */
  P.PT.filas.forEach((z, i) => P.PT.xs.forEach((x, j) => { if ((i * 5 + j * 2) % 4 !== 1) palletR(neiss, x, 0, z, Math.PI / 2, .9, 'film'); }));
  for (let n = 0; n < 22; n++) palletR(desorden, 47.6 + azar() * 12.4, 0, 43.8 + azar() * 10, azar() * 3, .8 + azar() * .3, 'film');
  palletR(desorden, 60.7, 0, 47.4, .4, .9, 'film');
  { const V = P.ENVOLVEDORA; cil(1.15, .12, V.x, 0, V.z, M.gris2, base, 32); caja(.3, 2.8, .3, V.x + 1.45, 0, V.z, M.gris, base, .04); caja(.8, 1.1, .6, V.x + 1.75, 0, V.z + .9, M.gris, base, .05);
    const plato = vivir(grupo(V.x, .12, V.z, 0, base)); cil(1.05, .03, 0, 0, 0, M.tinta, plato, 32);
    const pal = palletR(plato, 0, .03, 0, 0, .95, 'film'); const carro = vivir(grupo(V.x + 1.3, .3, V.z, 0, base)); caja(.2, .5, .5, 0, 0, 0, M.azul, carro, .04); cil(.06, .45, -.12, .02, 0, film, carro, 12);
    H.envolvedora = { plato, pal, carro }; trabajador('operario', V.x + 1.9, V.z - .6, Math.PI, 'maquina');
  }
  md.letrero(neiss, 'img/letreros/p-apilamiento.webp', .36, 45.27, 1.6, 53.4, 0);

  /* ═════════ anexos ═════════ */
  // oficinas (dos pisos, vidriadas)
  { const O = P.OFICINAS, cx = (O.x0 + O.x1) / 2, cz = (O.z0 + O.z1) / 2, w = O.x1 - O.x0, d = O.z1 - O.z0;
    caja(w, 3.3, d, cx, 0, cz, M.blanco, base, .06); caja(w + .2, .2, d + .2, cx, 3.3, cz, M.gris, base, .03); caja(w, 2.9, d, cx, 3.5, cz, M.blanco, base, .06); caja(w + .3, .25, d + .3, cx, 6.4, cz, corte, base, .05);
    for (const y of [.8, 4.2]) { caja(w + .04, 1.7, d - 1.2, cx, y, cz, std(0xBFD8F2, { roughness: .1 }), base, .02); caja(w - 1.2, 1.7, d + .04, cx, y, cz, std(0xBFD8F2, { roughness: .1 }), base, .02); }
    caja(3.4, .15, 2.0, cx + 1.4, 2.9, O.z0 - .9, M.blanco, base, .04); for (const s of [-1, 1]) caja(.1, 2.9, .1, cx + 1.4 + s * 1.6, 0, O.z0 - 1.8, M.gris2, base, .02);
    cartel(base, 'OFICINAS', cx, 6.7, O.z0 - .1, -Math.PI / 2, 4.2, .7, '#FFFFFF', '#1b2230');
  }
  // taller de mantención (con su portón a la calle A): grúa en revisión sobre gatas, banco, panel de herramientas y repuestos
  { const Tl = P.TALLER;
    muroZ(Tl.x0, Tl.z0, Tl.z1, [], 3.6); muroX(Tl.z0, Tl.x0, 44.875, [], 3.6); muroX(Tl.z1, Tl.x0, 44.875, [[33.4, 35.4, 2.2]], 1.1);
    gruaQuieta(base, 38.6, .28, 35, Math.PI, .5);
    for (const [dx, dz] of [[-.7, -.5], [-.7, .5], [.6, -.5], [.6, .5]]) caja(.22, .28, .22, 38.6 + dx, 0, 35 + dz, std(0xD62828, { roughness: .45 }), base, .03);
    trabajador('supervisor', 36.4, 33.2, Math.PI * .25, 'revisar'); trabajador('operario', 39.9, 36.4, Math.PI * .6, 'reparar', 'piso');
    caja(3.2, .9, .8, 33.2, 0, 28.0, std(0x5C6675), base, .03); caja(3.3, .05, .85, 33.2, .9, 28.0, std(0xE9DCC3), base, .02);
    { const panel = std(0x2F7BE8, { roughness: .5 }); caja(3.2, 1.3, .05, 33.2, 1.3, 27.15, panel, base, .01); for (let i = 0; i < 9; i++) caja(.05, .22 + (i % 3) * .08, .03, 31.8 + i * .34, 1.75, 27.2, M.tinta, base, .01); }
    trabajador('operario', 33.4, 28.9, Math.PI / 2, 'ensamblar');
    for (const z of [30.4, 33.2]) { md.estanteria(base, 31.6, z, z + 2.2); }
    md.tableroElectrico(base, 31.25, 40.2, 0); caja(.8, .55, .6, 33.8, 0, 41.8, M.negro, base, .04); caja(.8, .55, .6, 34.8, 0, 41.8, M.negro, base, .04);
    // baterías de repuesto en su base de carga, neumáticos, carro de herramientas y un tren en revisión
    for (let i = 0; i < 3; i++) { const r = cil(.32, .22, 42.6, .32 + i * .23, 41.6, M.negro, base, 18); r.rotation.x = Math.PI / 2; r.position.set(42.6, .32, 41.4 - i * .3); }
    caja(.6, .9, .45, 36.0, 0, 28.0, std(0xD62828, { roughness: .45 }), base, .04); for (let i = 0; i < 4; i++) caja(.58, .02, .43, 36.0, .2 + i * .2, 28.23, M.tinta, base, 0);
    { const t = md.tractor(base); t.op?.g.parent.remove(t.op.g); t.g.position.set(35.4, 0, 38.6); t.g.rotation.y = .4; trabajador('operario', 36.0, 39.9, Math.PI * .75, 'reparar', 'piso'); }
    cartel(base, 'TALLER DE MANTENCIÓN', 37.8, 3.65, Tl.z0 + .13, -Math.PI / 2, 5.2, .55, '#FFFFFF', '#1b2230');
    md.letrero(neiss, 'img/letreros/p-montacargas.webp', .4, 45.16, 1.7, 32.2, 0);
  }
  // bodega de insumos de embalaje (film, cajas, esquineros, pallets nuevos): abastece al paletizado por su portón
  { const B = P.BODEGA;
    muroZ(B.x0, B.z0, B.z1, [], 3.6); muroX(B.z0, B.x0, 44.875, [], 3.6); muroX(B.z1, B.x0, 44.875, [], 1.1);
    for (const x of [32.0, 34.6, 37.2]) { const f = md.filaRack(base, x - .55, x + .55, 46.2, 53.8, [0, 1.3, 2.5], 3.2);
      for (const h of f.huecos) if (azar() > .25) { const gg = grupo(h.x, h.y + (h.y ? .04 : 0), h.z, 0, base); caja(1.0, .14, 1.15, 0, 0, 0, M.madera, gg, .01);
        if (x < 33) for (let i = 0; i < 4; i++) { const r = cil(.13, .5, (i % 2 - .5) * .4, .14, (Math.floor(i / 2) - .5) * .5, M.film, gg, 14); }
        else caja(.94, .55 + azar() * .3, 1.08, 0, .14, 0, x < 36 ? M.caja : M.caja2, gg, .04); } }
    for (let i = 0; i < 4; i++) m2.apilado(base, 40.2 + (i % 2) * 1.3, 47.2 + Math.floor(i / 2) * 1.6, 'madera', 9 + i);
    const tp = md.transpaleta(base); tp.g.position.set(42.6, 0, B.porton); persona('operario', 41.6, B.porton + .2, 0, 'brazos');
    cartel(base, 'BODEGA DE INSUMOS', 37.3, 3.65, B.z0 + .13, -Math.PI / 2, 4.6, .55, '#FFFFFF', '#1b2230');
  }
  // anexo sur: pasillo desde la puerta del sendero → casino (izquierda) y camarines (derecha)
  { const S = P.CAMARINES, PS = P.PASILLO_S, CA = P.CASINO, CM = P.CAMAR;
    muroZ(S.x0, S.z0, S.z1, [], 3.0); muroZ(S.x1, S.z0, S.z1, [], 1.1); muroX(S.z1, S.x0, S.x1, [], 1.1);
    muroX(PS.z1, S.x0, S.x1, [[PS.puertas.casino - .7, PS.puertas.casino + .7, 2.2], [PS.puertas.camarines - .7, PS.puertas.camarines + .7, 2.2]], 2.4);
    muroZ(69, PS.z1, S.z1, [], 2.4);
    // casino: mesas con sillas, mesón con bandejas, ventanales
    for (const [x, z] of [[60.2, 59.2], [64.6, 59.2], [60.2, 62.0], [64.6, 62.0]]) { caja(2.6, .05, .95, x, .74, z, M.blanco, base, .03); for (const dx of [-1.1, 1.1]) caja(.06, .74, .7, x + dx, 0, z, M.gris2, base, .01);
      for (const s2 of [-1, 1]) for (const dx of [-.8, 0, .8]) { const sl = grupo(x + dx, 0, z + s2 * .78, 0, base); caja(.42, .45, .42, 0, 0, 0, std(0x2F7BE8, { roughness: .5 }), sl, .05); caja(.42, .4, .06, 0, .45, s2 * .18, std(0x2F7BE8, { roughness: .5 }), sl, .02); } }
    trabajador('operario', 59.4, 58.4, -Math.PI / 2, 'comer', 'sentada'); trabajador('oficina', 64.0, 62.8, Math.PI / 2, 'comer', 'sentada'); trabajador('operario', 65.4, 58.4, -Math.PI / 2, 'comer', 'sentada'); trabajador('operario', 61.0, 62.8, Math.PI / 2, 'comer', 'sentada');
    caja(.9, 1.0, 5.6, 67.9, 0, 60.6, M.gris, base, .04); caja(.95, .06, 5.7, 67.9, 1.0, 60.6, std(0x9AA3AE, { metalness: .5, roughness: .3 }), base, .02);
    for (let i = 0; i < 4; i++) caja(.4, .06, .3, 67.8, 1.06, 58.6 + i * 1.2, M.amarillo, base, .02);
    trabajador('oficina', 68.7, 61.2, Math.PI / 2, 'revisar'); m2.vending(base, 58.1, 63.3, 0, 0xE5383B, 'BEBIDAS'); m2.vending(base, 58.1, 62.4, 0, 0x056CF2, 'AGUA');
    // camarines: casilleros en filas, bancas y duchas
    for (const z of [58.4, 60.8]) { for (let i = 0; i < 2; i++) m2.casilleros(base, 71.2 + i * 2.6, z, Math.PI / 2, 5); caja(4.6, .45, .4, 73.0, 0, z + .9, std(0xD9B98C), base, .04); }
    for (let i = 0; i < 4; i++) { const x = 77.0 + i * .95; caja(.06, 2.1, 1.3, x - .45, 0, 62.9, std(0xDCE3EA, { roughness: .3 }), base, .01); cil(.04, .25, x, 2.0, 63.4, M.acero, base, 8); }
    caja(3.8, 2.1, .06, 78.4, 0, 62.22, std(0xBFD8F2, { roughness: .1, transparent: true, opacity: .55 }), base, .01);
    trabajador('operario', 71.6, 59.9, 0, 'pasear', null, [75.6, 59.9]); trabajador('operario', 75.2, 62.3, -Math.PI / 2, 'revisar');
    // letreros sobre las puertas del pasillo
    cartel(base, 'CASINO', PS.puertas.casino, 2.35, PS.z1 - .14, -Math.PI / 2, 2.0, .38, '#FFFFFF', '#1b2230');
    cartel(base, 'CAMARINES', PS.puertas.camarines, 2.35, PS.z1 - .14, -Math.PI / 2, 2.4, .38, '#FFFFFF', '#1b2230');
    md.letrero(neiss, 'img/letreros/s-salida.webp', .24, 68.0, 2.3, 55.47, -Math.PI / 2);
  }
  // oficina de producción levantada a lo largo de la muralla oeste de producto terminado: escritorios, sala de reunión,
  // frente vidriado, balcón y escalera que sube hacia la muralla (13-nov). Sin techo, como el resto de la maqueta.
  { const Z = P.MEZZ, E = Z.esc, y = Z.y, d = Z.z1 - Z.z0, cz = (Z.z0 + Z.z1) / 2, wO = Z.x1 - Z.x0, cxO = (Z.x0 + Z.x1) / 2;
    const acero = std(0x56606E, { roughness: .5, metalness: .3 }), rejilla = std(0x8D949E, { roughness: .45, metalness: .4 }), madera = std(0xD9C7A8, { roughness: .7 });
    // estructura: losa sobre vigas, pilares al frente
    caja(Z.balcon - Z.x0, .22, d, (Z.x0 + Z.balcon) / 2, y - .24, cz, M.gris, base, .02);
    caja(Z.balcon - Z.x0 + .02, .12, .14, (Z.x0 + Z.balcon) / 2, y - .36, Z.z0 + .07, acero, base, .01); caja(Z.balcon - Z.x0 + .02, .12, .14, (Z.x0 + Z.balcon) / 2, y - .36, Z.z1 - .07, acero, base, .01);
    for (const z of [Z.z0 + .15, cz, Z.z1 - .15]) { caja(.2, y - .24, .2, Z.balcon - .14, 0, z, acero, base, .02); caja(.2, y - .24, .2, Z.x1 - .1, 0, z, acero, base, .02); }
    // pisos: madera en la oficina, rejilla en el balcón (levemente sobre la losa: sin parpadeo)
    caja(wO - .1, .03, d - .1, cxO, y - .015, cz, madera, base, 0); caja(Z.balcon - Z.x1 - .04, .03, d - .04, (Z.x1 + Z.balcon) / 2, y - .015, cz, rejilla, base, 0);
    // muros: el de atrás sube sobre la muralla de la nave; los laterales cortados a la altura de la maqueta
    const muroO = std(0xF1F3F5, { roughness: .8 });
    caja(.14, 1.15, d, Z.x0 + .07, y + .02, cz, muroO, base, .01); caja(.16, .04, d, Z.x0 + .07, y + 1.17, cz, M.corte, base, 0);
    caja(wO, 2.4, .14, cxO, y + .02, Z.z0 + .07, muroO, base, .01); caja(wO, .04, .16, cxO, y + 2.42, Z.z0 + .07, M.corte, base, 0);
    caja(wO, 1.15, .14, cxO, y + .02, Z.z1 - .07, muroO, base, .01); caja(wO, .04, .16, cxO, y + 1.17, Z.z1 - .07, M.corte, base, 0);
    // frente vidriado con montantes y puerta al balcón
    const vidrio = std(0xCFE3F5, { roughness: .06, transparent: true, opacity: .32, depthWrite: false }), marco = std(0x3A4150, { roughness: .4, metalness: .4 });
    const [p0, p1] = Z.puerta;
    for (const [a0, a1] of [[Z.z0 + .14, p0], [p1, Z.z1 - .14]]) caja(.03, 2.3, a1 - a0, Z.x1 - .04, y + .03, (a0 + a1) / 2, vidrio, base, 0);
    for (let z = Z.z0 + .14; z <= Z.z1 - .1; z += 1.2) if (z < p0 - .1 || z > p1 + .1) caja(.06, 2.34, .06, Z.x1 - .04, y + .02, z, marco, base, .005);
    for (const z of [p0, p1]) caja(.07, 2.34, .07, Z.x1 - .04, y + .02, z, marco, base, .005);
    caja(.06, .06, d - .2, Z.x1 - .04, y + 2.34, cz, marco, base, .005); caja(.06, .06, p0 - Z.z0 - .14, Z.x1 - .04, y + .9, (Z.z0 + .14 + p0) / 2, marco, base, .005); caja(.06, .06, Z.z1 - .14 - p1, Z.x1 - .04, y + .9, (p1 + Z.z1 - .14) / 2, marco, base, .005);
    // escritorios contra la muralla, con pantalla, silla y persona
    const cubierta = std(0xFFFFFF, { roughness: .5 }), silla = std(0x2B2F36, { roughness: .6 }), pant = std(0x1b2230, { roughness: .3, emissive: 0x2F7BE8, emissiveIntensity: .35 });
    const escritorio = (x, z, ry, conPersona, tipo = 'oficina') => { const g = grupo(x, y, z, ry, base);
      caja(.75, .04, 1.4, 0, .72, 0, cubierta, g, .02); for (const dz of [-.65, .65]) caja(.7, .72, .04, 0, 0, dz, M.gris2, g, .005);
      caja(.05, .34, .55, -.25, .78, 0, pant, g, .01); caja(.18, .1, .06, -.22, .76, 0, M.tinta, g, .01); caja(.18, .02, .45, .08, .76, .1, M.gris, g, .005);
      const sl = grupo(.62, 0, 0, 0, g); cil(.22, .04, 0, .42, 0, silla, sl, 14); caja(.06, .5, .4, .2, .46, 0, silla, sl, .02); cil(.03, .4, 0, .02, 0, M.gris2, sl, 6);
      if (conPersona) trabajador(tipo, x + .58, z, Math.PI, 'teclear', 'sentada').g.position.y = y + .03; };
    [[39.6, true], [41.2, false], [43.6, true], [45.2, true], [46.8, false]].forEach(([z, per]) => escritorio(Z.x0 + .55, z, 0, per, z > 44 ? 'operario' : 'oficina'));
    // mesa de reunión junto al vidrio, con pizarra en el muro norte
    { const g = grupo(Z.x1 - 1.3, y, 47.6, 0, base); caja(1.0, .04, 1.8, 0, .72, 0, cubierta, g, .02); cil(.06, .72, 0, 0, 0, M.gris2, g, 8);
      for (const [dx, dz] of [[-.7, -.5], [-.7, .5], [.7, -.5], [.7, .5]]) { cil(.2, .04, dx, .42, dz, silla, g, 12); caja(.06, .45, .36, dx + Math.sign(dx) * .18, .45, dz, silla, g, .02); }
      trabajador('supervisor', Z.x1 - 2.02, 48.1, 0, 'hablar', 'sentada').g.position.y = y + .03;
      trabajador('oficina', Z.x1 - .58, 47.1, Math.PI, 'revisar', 'sentada').g.position.y = y + .03; }
    { const t = tex((c, W, Hh) => { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, Hh); c.strokeStyle = '#2F7BE8'; c.lineWidth = 6; c.beginPath(); c.moveTo(40, Hh - 50); for (let i = 0; i < 8; i++) c.lineTo(40 + i * (W - 80) / 7, Hh - 60 - ((i * 37) % 90) - i * 12); c.stroke(); c.fillStyle = '#1b2230'; c.font = `700 ${Hh * .12}px Poppins, Arial`; c.fillText('PRODUCCIÓN · SEMANA', 40, 60); }, 512, 256);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1.8, .9), new THREE.MeshStandardMaterial({ map: t, roughness: .6 })); m.position.set(cxO + .3, y + 1.55, Z.z0 + .15); base.add(m); }
    // archivadores y una planta
    for (let i = 0; i < 3; i++) caja(.5, 1.1, .45, Z.x0 + .4, y + .02, 48.4 - i * .5 - .05 + 0, M.gris, base, .03);
    cil(.18, .35, Z.x1 - .35, y + .02, 39.0, std(0xC9B9AC), base, 12); esfera(.35, Z.x1 - .35, y + .7, 39.0, std(0x6FA36A, { roughness: .9 }), base, 10);
    // balcón: baranda amarilla al frente y en la punta sur
    const am = std(0xF5C400, { roughness: .45 });
    for (let z = E.z1; z <= Z.z1 + .01; z += 1.5) caja(.06, 1.05, .06, Z.balcon - .05, y, Math.min(z, Z.z1 - .05), am, base, .01);
    caja(.06, .06, Z.z1 - E.z1, Z.balcon - .05, y + 1.02, (E.z1 + Z.z1) / 2, am, base, .02); caja(.05, .05, Z.z1 - E.z1, Z.balcon - .05, y + .52, (E.z1 + Z.z1) / 2, am, base, .02);
    caja(Z.balcon - Z.x1, .06, .06, (Z.x1 + Z.balcon) / 2, y + 1.02, Z.z1 - .05, am, base, .02); caja(Z.balcon - Z.x1, .05, .05, (Z.x1 + Z.balcon) / 2, y + .52, Z.z1 - .05, am, base, .02);
    caja(Z.balcon - Z.x1, .06, .06, (Z.x1 + Z.balcon) / 2, y + 1.02, Z.z0 + .05, am, base, .02);
    // escalera recta que sube hacia la muralla y llega al balcón
    const n = 13, run = (E.x1 - E.x0) / n, rise = y / n, ancho = E.z1 - E.z0;
    for (let i = 0; i < n; i++) caja(run + .03, .05, ancho - .1, E.x1 - run * (i + .5), rise * (i + 1) - .05, (E.z0 + E.z1) / 2, rejilla, base, .005);
    for (const z of [E.z0 + .04, E.z1 - .04]) { k.barra(new THREE.Vector3(E.x1, .05, z), new THREE.Vector3(E.x0, y - .05, z), .1, acero, base);
      k.barra(new THREE.Vector3(E.x1 + .05, 1.0, z), new THREE.Vector3(E.x0, y + 1.0, z), .05, am, base); caja(.05, 1.0, .05, E.x1 + .05, 0, z, am, base, .01); }
    cartel(base, 'OFICINA DE PRODUCCIÓN', Z.balcon - .02, y + 1.1, 44.2, 0, 3.0, .34, '#FFFFFF', '#1b2230');
  }

  // punto limpio (anexo sur, al final del ramal C)
  { const L = P.LIMPIO, malla = std(0xC9CFD8, { roughness: .5, transparent: true, opacity: .5 });
    for (const [x0, z0, x1, z1] of [[L.x0, L.z1, L.x1, L.z1], [L.x0, L.z0, L.x0, L.z1], [L.x1, L.z0, L.x1, L.z1]]) { const Lg = Math.hypot(x1 - x0, z1 - z0), o = caja(Lg, 1.7, .04, (x0 + x1) / 2, 0, (z0 + z1) / 2, malla, base, .005); o.rotation.y = -Math.atan2(z1 - z0, x1 - x0); }
    const colores = [[0x2F7BE8, 'img/letreros/r-papel.webp'], [0xF5C400, 'img/letreros/r-plastico.webp'], [0x22A05A, 'img/letreros/r-vidrio.webp'], [0x8A6A44, 'img/letreros/r-carton.webp'], [0x5C6675, 'img/letreros/r-basura.webp']];
    colores.forEach(([c, n], i) => { const x = 84.6 + i * 2.2; for (let j = 0; j < 2; j++) { const g = grupo(x + j * .75, 0, 61.4, 0, neiss); caja(.7, 1.2, 1.1, 0, 0, 0, std(c, { roughness: .45 }), g, .06); caja(.74, .06, 1.14, 0, 1.2, 0, std(c, { roughness: .4 }), g, .03); }
      md.letrero(neiss, n, .36, x + .38, 1.9, 62.7, -Math.PI / 2, 'poste'); });
    for (let i = 0; i < 16; i++) esfera(.3 + azar() * .18, 84.4 + azar() * 10, .25, 57.6 + azar() * 4.4, std(azar() > .5 ? 0x2B2F36 : 0x5C6675, { roughness: .35 }), desorden, 10);
    caja(2.4, 1.3, 1.4, 92.6, 0, 61.6, std(0x6B7380, { roughness: .6 }), desorden, .05); for (const [x, z] of [[89.2, 61.8], [90.3, 61.2]]) { palletVacio(desorden, x, z, azar()); caja(.8, .5, .6, x, .14, z, M.caja2, desorden, .02); }
    caja(L.x1 - L.x0, .1, 3.6, (L.x0 + L.x1) / 2, 2.8, 61.4, std(0xE6EAF0, { transparent: true, opacity: .8 }), base, .02);
    for (const x of [L.x0 + .3, L.x1 - .3]) caja(.1, 2.8, .1, x, 0, 59.8, M.gris2, base, .01);
  }

  /* ═════════ patio, estacionamiento y calle ═════════ */
  { const t1 = eq.camion(base, 0x2F6FB0); t1.g.position.set(P.ANDENES[0].x, PY, 1.35); t1.g.rotation.y = Math.PI / 2; H.T1 = t1; }
  // camión rampla en la bahía lateral, con pallets en el piso
  { const R = P.RAMPLA, g = grupo((R.x0 + R.x1) / 2, PY, R.z, 0, base);
    caja(9.2, .18, 2.5, -1.2, 1.05, 0, M.gris2, g, .03); caja(9.2, .2, 2.4, -1.2, .85, 0, M.tinta, g, .02);
    caja(2.2, 2.4, 2.4, 4.6, .6, 0, M.blanco, g, .25); caja(.06, .8, 2.0, 5.72, 1.85, 0, M.tinta, g, .02); caja(.8, .9, 2.42, 3.9, 2.95, 0, M.blanco, g, .2);
    for (const x of [-4.8, -3.4, 3.4, 5.0]) for (const z of [-1.05, 1.05]) { const r = cil(.48, .32, x, 0, z, M.negro, g, 18); r.rotation.x = Math.PI / 2; r.position.y = .48; }
    for (let i = 0; i < 5; i++) palletR(g, -5.2 + i * 1.15, 1.23, -.5, 0, .85, 'film');
    H.rampla = { g, huecos: [0, 1, 2].map((i) => palletR(vivir(grupo(0, 0, 0, 0, g)), -5.2 + i * 1.15, 1.23, .55, 0, .85, 'film')) };
  }
  P.ESTAC.x0 && [0, 1, 2, 4, 5, 7, 8].forEach((i) => { const c = [0xD9363E, 0xF2B705, 0x9AA3AE, 0x4F6D8F, 0xE9ECF0, 0x2B2F36, 0x7FA7D9][i % 7]; eq.auto(base, P.ESTAC.x0 + 1.3 + i * 2.6, -12.6, i % 2 ? Math.PI / 2 : -Math.PI / 2, c).position.y = PY; });
  // reja perimetral y árboles
  { const reja = std(0xBFC6D0, { roughness: .5, transparent: true, opacity: .55 });
    for (const [x0, z0, x1, z1] of [[44.9, -16, 112.2, -16], [44.9, -16, 44.9, 4.8]]) { const L = Math.hypot(x1 - x0, z1 - z0), o = caja(L, 1.8, .03, (x0 + x1) / 2, PY, (z0 + z1) / 2, reja, base, .005); o.rotation.y = -Math.atan2(z1 - z0, x1 - x0); o.castShadow = false;
      for (let t = 0; t <= 1.0001; t += 2.5 / L) cil(.04, 1.85, x0 + (x1 - x0) * t, PY, z0 + (z1 - z0) * t, M.gris2, base, 6); } }
  const copa = std(0xB4C9A6, { roughness: .95 }), copa2 = std(0x9DB88E, { roughness: .95 });
  for (const [x, z, s] of [[27, 8, 1.1], [26.6, 16, 1.3], [27.4, 30, 1.0], [26.8, 41, 1.2], [27.2, 52, 1.1], [40, 61, 1.2], [50, 63, 1.0], [104, 62, 1.3], [110, 60, 1.1], [124, -8, 1.2], [124, 14, 1.0], [124, 40, 1.3], [50, -18.2, 1.1], [66, -18.4, 1.0], [86, -18.2, 1.2], [104, -18.4, 1.1]]) {
    cil(.12, 1.6 * s, x, -1.3, z, M.madera, base, 8); esfera(1.2 * s, x, -1.3 + 2.2 * s, z, azar() > .5 ? copa : copa2, base, 12); }

  /* ═════════ Neisstech: tránsito (solo después) ═════════ */
  // baranda peatonal en el borde oeste del sendero (y en el este frente a los racks)
  for (const [z0, z1] of [[5.6, 14.3], [19.9, 24.7], [25.35, 32.6], [37.4, 54.6]]) eq.baranda(neiss, 67.28, z0, 67.28, z1, 1.1, 3);
  for (const [z0, z1] of [[5.6, 14.3], [19.0, 24.7]]) eq.baranda(neiss, 68.72, z0, 68.72, z1, 1.1, 3);
  eq.baranda(neiss, 53.4, 18.12, 61.1, 18.12, 1.0, 2); eq.baranda(neiss, 53.4, 19.38, 61.1, 19.38, 1.0, 2);
  // franja de topes y bolardos en las esquinas expuestas
  for (const [x, z] of [[61.0, 15.2], [61.0, 24.4], [69.0, 25.4], [69.0, 32.8], [86.0, 37.3], [90.0, 37.3], [95.8, 25.4], [103.2, 25.4], [95.8, 24.6], [61.0, 37.3], [69.0, 37.3]]) md.bolardo(neiss, x, z);

  // cruces según el estándar Gestión de Tráfico IA: puerta inteligente a cada lado; los simples con cebra de cinta y
  // sensores de montacargas (tipo A); los inteligentes con X-KUBE que proyecta la cebra o, si viene una grúa, la advertencia
  const cruce = (id) => (H.cruces[id] ||= { r: P.CRUCES[id], puertas: [], sensores: [], ampels: [], holo: null });
  const puertaC = (id, x, z, ry, ancho) => cruce(id).puertas.push(eq.puertaInteligente(neiss, x, z, ry, ancho));
  puertaC('Z1', 61.3, 19.4, Math.PI / 2, 1.3); puertaC('Z1', 67.3, 18.1, -Math.PI / 2, 1.3);
  puertaC('Z2', 67.35, 14.55, 0, 1.3); puertaC('Z2', 68.65, 18.45, Math.PI, 1.3);
  puertaC('Z3', 67.35, 32.8, 0, 1.3); puertaC('Z3', 68.65, 37.2, Math.PI, 1.3);
  puertaC('Z4', 50.55, 32.8, 0, 1.9); puertaC('Z4', 52.45, 37.2, Math.PI, 1.9);
  puertaC('Z5', 77.55, 32.8, 0, 1.9); puertaC('Z5', 79.45, 37.2, Math.PI, 1.9);
  puertaC('Z6', 95.8, 29.8, Math.PI / 2, 1.6);
  puertaC('Z7', 86.05, 42.5, Math.PI / 2, 1.4); puertaC('Z7', 89.95, 41.1, -Math.PI / 2, 1.4);
  // sensores de grúa sobre el poste de bisagra de cada puerta, mirando hacia el tránsito que se acerca
  for (const [id, x, z, dx, dz] of [['Z1', 61.3, 19.4, 0, -1], ['Z1', 67.3, 18.1, 0, 1], ['Z4', 50.55, 32.8, -1, 0], ['Z4', 52.45, 37.2, 1, 0], ['Z5', 77.55, 32.8, -1, 0], ['Z5', 79.45, 37.2, 1, 0], ['Z7', 86.05, 42.5, 0, -1], ['Z7', 89.95, 41.1, 0, 1]])
    cruce(id).sensores.push(eq.sensorGrua(neiss, x, z, cara(dx, dz)));
  { const a1 = m2.ampel(neiss, 69.0, -7.5, frente(0, -1)), a2 = m2.ampel(neiss, 66.9, -2.3, frente(0, 1)); a1.g.position.y = a2.g.position.y = PY; cruce('ZP').ampels.push(a1, a2); }
  for (const id of Object.keys(P.CRUCES)) cruce(id);
  const luces = vivir(grupo(0, 0, 0, 0, neiss));
  k.escena.updateMatrixWorld(true);
  // estructura del techo sobre la calle principal: viga con pilares en las tres murallas; de ella cuelgan los X-KUBE
  const VIGA = { x: 69.9, y: 6.3 }; H.viga = eq.vigaTecho(neiss, VIGA.x, 5.3, 54.7, VIGA.y, [5.3, 25, 54.7]); H.viga.userData.vivo = true;
  for (const [id, mx, mz, pared] of [['Z2', VIGA.x, 16.5], ['Z3', VIGA.x, 35.0], ['Z6', 102.4, 29.0, [103.37, 29.0]]]) {
    const r = P.CRUCES[id], cx = (r.x0 + r.x1) / 2, cz = (r.z0 + r.z1) / 2, kb = eq.xkube(neiss, mx, mz, pared ? 2.75 : 4.7, VIGA.y, pared);
    const w = r.x1 - r.x0, d = r.z1 - r.z0, porZ = r.paso === 'z';
    const cebra = eq.proyeccion(luces, eq.cebraTex(impar((porZ ? d : w) / .3)), porZ ? w : d, porZ ? d : w, cx, cz, porZ ? 0 : Math.PI / 2, kb.origen, 0xFFE27A);
    const tri = eq.proyeccion(luces, eq.TX.grua, 2.1, 2.1, cx, cz, porZ ? 0 : Math.PI / 2, kb.origen, 0xFFE27A, .04);
    cruce(id).holo = { kb, cebra, tri };
  }
  // copo proyectado frente a la cámara de frío cuando se abre la puerta (proyector sobre la puerta)
  { caja(.2, .1, .12, 103.27, 2.55, 31.2, M.gris2, neiss, .01); const pr = md.proyector(neiss, 103.1, 2.7, 31.2, new THREE.Vector3(101.2, 0, 32.2)); k.escena.updateMatrixWorld(true);
    H.frio.copo = { p: pr, d: eq.proyeccion(luces, eq.TX.copo, 2.3, 2.3, 101.2, 32.2, 0, pr.lente(), 0xBFE6FF) }; }

  // Safetygate frente al portón central (lado norte) y al portón este (lado sur): barra colgante a 2,85 m
  // muro a lo largo de x (z = muro): el tubo cruza el vano a 1,9 m del muro, por el lado «lado»
  function safety(id, xc, lado, x0, x1, muro = 25, ancla = 3.3) { const g = grupo(xc, 0, muro, Math.PI / 2, neiss), sg = md.safetygate(g, -lado * 1.9, x0 - xc, x1 - xc, ancla, .45, -lado * .13); vivir(sg.piv);
    H.sg[id] = { ...sg, eje: 'z', c: muro + lado * 1.9, a0: x0, a1: x1, muro, lado, z: muro + lado * 1.9, x0, x1, dintel: ancla - .3 }; }
  // muro a lo largo de z (x = muro)
  function safetyZ(id, zc, lado, z0, z1, muro, ancla) { const sg = md.safetygate(neiss, muro + lado * 1.9, z0, z1, ancla, .45, muro + lado * .13); vivir(sg.piv);
    H.sg[id] = { ...sg, eje: 'x', c: muro + lado * 1.9, a0: z0, a1: z1, muro, lado, dintel: ancla - .3 }; }
  safety('M1', P.PORTON_M1.x, -1, 61.4, 67.2); safety('M1s', P.PORTON_M1.x, 1, 61.4, 67.2);
  safety('M2', P.PORTON_M2.x, 1, 96.2, 102.8); safety('M2n', P.PORTON_M2.x, -1, 96.2, 102.8);
  safety('N3', P.PORTON_PATIO.x, 1, 96.2, 102.8, 5, 3.9); safety('N3o', P.PORTON_PATIO.x, -1, 96.2, 102.8, 5, 3.9);
  safetyZ('TA', 35, 1, 33.2, 36.8, 45, 3.5); safetyZ('TAo', 35, -1, 33.2, 36.8, 45, 3.5);
  safetyZ('BO', P.BODEGA.porton, 1, 48.3, 50.9, 45, 3.3); safetyZ('BOo', P.BODEGA.porton, -1, 48.3, 50.9, 45, 3.3);
  H.eq = eq;
  // SmartDock en los dos andenes: semáforo adentro y afuera, cuña en la rueda del remolque
  P.ANDENES.forEach((a) => {
    const sem = (x, y, z, ry) => { const s = grupo(x, y, z, ry, neiss); caja(.24, .56, .16, 0, 0, 0, M.negro, s, .06); caja(.2, .5, .08, 0, .02, -.1, M.gris2, s, .02); const r = luz(0xFF3B3B, 0x4a1515), v = luz(0x22C55E, 0x123a20); esfera(.07, 0, .42, .09, r, s, 12); esfera(.07, 0, .18, .09, v, s, 12); return { r, v, s }; };
    const dentro = sem(a.x + 1.95, 1.6, 5.2, 0), fuera = sem(a.x + 1.95, 1.25, 4.74, Math.PI); dentro.s.scale.setScalar(1.5); fuera.s.scale.setScalar(1.6);
    // riel y caja de la cuña al costado del remolque, frente a la primera rueda (se ve desde el patio)
    caja(1.5, .05, .3, a.x + 1.65, PY, 2.25, M.gris2, neiss, .01); caja(.45, .5, .5, a.x + 2.4, PY, 2.25, M.amarillo, neiss, .06); caja(.47, .1, .52, a.x + 2.4, PY + .5, 2.25, M.negro, neiss, .02);
    const c = eq.cunaSmart(neiss, a.x + 1.85, 2.25); c.g.position.y = PY;
    H.docks[a.id] = { dentro, fuera, cuna: c.g, led: c.led, x: a.x };
  });
  // radares de velocidad (calle principal hacia el sur y calle este)
  // radares en la muralla central, mirando al tránsito que viene hacia el portón
  for (const [x, z, dx, dz, carril] of [[60.0, 25.2, 0, 1, 'B'], [104.0, 24.8, 0, -1, 'D']]) { caja(.3, .3, .1, x, 2.0, z - dz * .06, M.gris2, neiss, .02); const r = md.radar(neiss, x, 1.8, z, frente(dx, dz)); H.radares.push({ r, x, z, dx, dz, carril }); }
  // calle A (hacia el oeste): radar colgado del techo antes del cruce del sendero
  { const x = 74.2, z = 33.1, r = md.radar(neiss, x, 2.6, z, frente(1, 0)); caja(.05, 3.5, .05, x, 3.05, z, M.gris2, neiss, .01); H.radares.push({ r, x, z, dx: 1, dz: 0, carril: 'A' }); }
  // pluma en el acceso de camiones
  { const p = md.pluma(neiss, 112.6, -7.4, -Math.PI / 2, 4.4); p.g.position.y = PY; vivir(p.brazo); H.pluma = p; }
  // señalética
  for (const [url, w, x, y, z, ry, s] of [
    ['img/letreros/o-casco.webp', .3, 69.2, 1.3, 5.14, -Math.PI / 2], ['img/letreros/o-chaleco.webp', .3, 70.5, 1.3, 5.14, -Math.PI / 2],
    ['img/letreros/p-peatones.webp', .32, 66.9, 1.8, 6.0, Math.PI, 'poste'], ['img/letreros/p-montacargas.webp', .36, 61.0, 2.0, 21.0, Math.PI, 'poste'],
    ['img/letreros/p-porton.webp', .34, 61.0, 2.0, 23.4, 0, 'poste'], ['img/letreros/p-peatones.webp', .32, 66.9, 1.8, 44.0, Math.PI, 'poste'],
    ['img/letreros/s-salida.webp', .24, 68.0, 2.3, 5.14, -Math.PI / 2], ['img/letreros/s-salida.webp', .24, 68.0, 2.3, 54.86, Math.PI / 2],
    ['img/letreros/s-extintor.webp', .26, 69.6, 1.55, 25.14, -Math.PI / 2], ['img/letreros/o-casco.webp', .3, 67.5, .7, -2.9, Math.PI / 2],
  ]) { const g = md.letrero(neiss, url, w, x, y, z, ry, s); if (z < 0) g.position.y = PY + y; }
  for (const [x, z] of EXT) { const fr = Math.abs(z - 25) < 1.2 ? (z < 25 ? -1 : 1) : 0; md.extintor(neiss, x, z, fr ? (fr < 0 ? -Math.PI / 2 : Math.PI / 2) : 0); }
  void MAQ;

  /* ═════════ murallas con estándar visual (después) y suciedad (antes) ═════════ */
  { const zocalo = std(0x56606E, { roughness: .7 }), linea = std(0xF5C400, { roughness: .45 }), mugre = std(0x4E463E, { roughness: 1, transparent: true, opacity: .2, depthWrite: false });
    const tramos = (a, b, huecos) => { const out = []; let x = a; for (const [h0, h1] of [...huecos].sort((p, q) => p[0] - q[0])) { if (h0 > x + .1) out.push([x, h0]); x = Math.max(x, h1); } if (b > x + .1) out.push([x, b]); return out; };
    const caras = [
      ['x', 5.137, 45.1, 109.9, [[58.4, 61.6], [62.9, 66.1], [67.4, 68.6], [95.9, 103.1]]],
      ['x', 24.863, 45.1, 109.9, [[61.2, 68.8], [95.9, 103.1], [55.4, 56.6], [93.4, 94.6]]],
      ['x', 25.137, 45.1, 103.3, [[61.2, 68.8], [95.9, 103.1], [55.4, 56.6], [93.4, 94.6]]],
      ['z', 45.137, 5.1, 54.9, [[32.9, 37.1], [19.4, 20.6]]],
    ];
    for (const [eje, f, a, b, hs] of caras) for (const [t0, t1] of tramos(a, b, hs)) {
      const L = t1 - t0, c = (t0 + t1) / 2;
      if (eje === 'x') { caja(L, 1.2, .02, c, 0, f, zocalo, neiss, 0); caja(L, .08, .025, c, 1.2, f, linea, neiss, 0); }
      else { caja(.02, 1.2, L, f, 0, c, zocalo, neiss, 0); caja(.025, .08, L, f, 1.2, c, linea, neiss, 0); }
      for (let i = 0; i < L / 3; i++) { const w = 1 + azar() * 2.4, h = .4 + azar() * 1.4, u = t0 + azar() * L; if (eje === 'x') caja(w, h, .015, u, azar() * .3, f, mugre, desorden, 0); else caja(.015, h, w, f, azar() * .3, u, mugre, desorden, 0); }
    }
    // jambas de portones con franja amarilla y negra
    const rayas = new THREE.MeshStandardMaterial({ map: tex((c, w, h) => { c.fillStyle = '#F5C400'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1F2228'; c.lineWidth = 22; for (let t = -h; t < h * 2; t += 56) { c.beginPath(); c.moveTo(0, t); c.lineTo(w, t + w); c.stroke(); } }, 64, 512), roughness: .5 });
    const jamba = (x, z, ry, alto) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(.3, alto), rayas); m.position.set(x, alto / 2, z); m.rotation.y = ry; neiss.add(m); };
    for (const [c0, w, alto] of [[P.PORTON_M1.x, P.PORTON_M1.w, 2.9], [P.PORTON_M2.x, P.PORTON_M2.w, 2.9]]) for (const s2 of [-1, 1]) { jamba(c0 + s2 * (w / 2 + .17), 24.86, Math.PI, alto); jamba(c0 + s2 * (w / 2 + .17), 25.14, 0, alto); }
    for (const [c0, w] of [[P.ANDENES[0].x, 3], [P.ANDENES[1].x, 3], [P.PORTON_PATIO.x, 7]]) for (const s2 of [-1, 1]) jamba(c0 + s2 * (w / 2 + .17), 5.14, 0, 2.9);
    // paneles de zona: mismo diseño en toda la planta, un color por tipo de zona
    for (const [t, sub, x, y, z, ry, w, col] of [
      ['RECEPCIÓN', 'Andenes 1 y 2 · pallets en espera', 51.2, 2.4, 5.14, -Math.PI / 2, 4.2, '#F5C400'],
      ['SUPERMERCADO', 'Kitting para ensamble y maquinaria', 80.6, 2.1, 25.14, -Math.PI / 2, 4.2, '#056CF2'],
      ['DESCANSO', 'Bebidas · casilleros · botiquín', 50.2, 2.1, 25.14, -Math.PI / 2, 3.4, '#2E9E5B'],
      ['PRODUCTO TERMINADO', 'Paletizado y envoltura', 45.14, 2.2, 51.4, 0, 4.4, '#F5C400'],
      ['OFICINA DE ANDÉN', 'Documentos y control de carga', 45.14, 2.2, 15.4, 0, 3.8, '#F5C400'],
      ['CÁMARA DE FRÍO', '−18 °C · ropa térmica obligatoria', 103.34, 1.95, 34.0, Math.PI, 3.2, '#056CF2'],
    ]) eq.panelZona(neiss, t, sub, x, y, z, ry, w, col);
    // mensajes de seguridad junto a las puertas
    for (const [url, x, z, ry] of [['img/letreros/p-montacargas.webp', 56.9, 25.14, -Math.PI / 2], ['img/letreros/p-montacargas.webp', 94.9, 25.14, -Math.PI / 2], ['img/letreros/p-peatones.webp', 62.8, 24.86, Math.PI / 2]])
      md.letrero(neiss, url, .32, x, 1.5, z, ry);
  }
  /* columnas: protector y esquineros (después); peladas y rayadas (antes) */
  for (const [x, z] of [[61.0, 46], [61.0, 52], [69.0, 46], [69.0, 52], [86.0, 46], [90.0, 46]]) eq.columna(base, x, z, 4.0, true, neiss);
  /* estaciones 5S de limpieza junto a la línea y a las máquinas (después) */
  eq.estacion5S(neiss, 106.4, 45.0, -Math.PI / 2, '#F5C400'); eq.estacion5S(neiss, 70.0, 44.9, Math.PI / 2, '#056CF2');
  /* espejos curvos en las esquinas ciegas (después) */
  // espejos en las cabeceras de los racks y en la muralla junto al portón (sin postes)
  eq.espejo(neiss, 69.1, 13.85, -1, .6, 2.6, false); eq.espejo(neiss, 95.3, 13.85, 1, .6, 2.6, false); eq.espejo(neiss, 60.9, 24.8, 1, -1, 2.4, false);
  /* tuberías de servicio en la muralla de producción; etiquetas de contenido y flujo (después) */
  { const et = vivir(grupo(0, 0, 0, 0, neiss)); et.userData.vivo = false;
    eq.tuberia(base, 45.4, 103.2, 25.33, 3.2, 0x2F7BE8, et, 'AIRE COMPRIMIDO'); eq.tuberia(base, 45.4, 103.2, 25.5, 3.42, 0x2E9E5B, et, 'AGUA INDUSTRIAL'); }
  /* kit de derrame en la carga de baterías (después) */
  { const g = grupo(104.0, 0, 22.6, 0, neiss); caja(.7, .8, .55, 0, 0, 0, std(0xF5C400, { roughness: .45 }), g, .06); caja(.72, .06, .57, 0, .8, 0, M.negro, g, .02); cartel(g, 'KIT DERRAME', .37, .35, 0, 0, .6, .16, '#1b1e24', '#F5C400'); }

  // antes: chofer esperando en el andén, entre la grúa y el camión; personas sin chaleco
  { const p = persona('visita', 62.3, 3.4, Math.PI / 2, null, desorden); p.g.position.y = PY; }
  persona('visita', 47.2, 13.9, -Math.PI / 3, null, desorden);

  /* ═════════ utilidades ═════════ */
  function persona(tipo, x, z, ry, pose, padre = base) {
    const p = md.persona(tipo, padre); p.g.position.set(x, 0, z); p.g.rotation.y = ry;
    if (pose === 'sentada') { md.sentar(p); p.g.position.y = .02; md.brazos(p, .7); }
    else if (pose === 'brazos') md.brazos(p, .75, .05);
    return p;
  }
  function cartel(padre, txt, x, y, z, ry, w, h, fondo = '#056CF2', tinta = '#FFFFFF', patas = false) {
    const t = tex((c, W, Hh) => { c.fillStyle = fondo; c.fillRect(0, 0, W, Hh); c.fillStyle = tinta; c.font = `800 ${Hh * .56}px Poppins, Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, W / 2, Hh / 2 + Hh * .04); }, 512, Math.max(32, Math.round(512 * h / w)));
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: .5 });
    const g = grupo(x, y, z, ry, padre), p = new THREE.Mesh(new THREE.BoxGeometry(.03, h, w), [mat, mat, M.gris, M.gris, M.gris, M.gris]); p.castShadow = true; p.position.y = h / 2; g.add(p);
    if (patas) for (const s of [-1, 1]) caja(.06, y, .06, 0, -y, s * w * .4, M.gris2, g, .01);
    return g;
  }
  // estantería vieja de ángulo con cajas de cartón donde cupieron (antes del orden)
  function estanteViejo(padre, x0, x1, z) {
    const g = grupo(0, 0, 0, 0, padre), ang = std(0x7E8792, { roughness: .6 }), L = x1 - x0;
    for (const x of [x0, x1, (x0 + x1) / 2]) for (const dz of [-.3, .3]) caja(.05, 2.1, .05, x, 0, z + dz, ang, g, .005);
    for (const y of [.15, .75, 1.35, 1.95]) { caja(L, .03, .66, (x0 + x1) / 2, y, z, ang, g, .005);
      for (let xx = x0 + .3; xx < x1 - .3; xx += .55 + azar() * .3) if (azar() > .25) { const b = caja(.4 + azar() * .3, .25 + azar() * .3, .45, xx, y + .03, z + (azar() - .5) * .15, azar() > .5 ? M.caja : M.caja2, g, .02); b.rotation.y = (azar() - .5) * .5; } }
    return g;
  }
  // mesa con papeles sueltos (antes de los tableros)
  function mesaPapeles(padre, x, z, w, d) {
    const g = grupo(x, 0, z, 0, padre); caja(w, .05, d, 0, .74, 0, std(0xE9DCC3), g, .02); for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) caja(.05, .74, .05, dx * (w / 2 - .08), 0, dz * (d / 2 - .08), M.gris2, g, .01);
    const papel = std(0xFAFAF7, { roughness: .8 }); for (let i = 0; i < 9; i++) { const h = caja(.21, .004, .3, (azar() - .5) * (w - .3), .795 + i * .002, (azar() - .5) * (d - .3), papel, g, 0); h.rotation.y = azar() * 3; }
    for (let i = 0; i < 3; i++) { const h = caja(.21, .004, .3, (azar() - .5) * 2, .005, d / 2 + .3 + azar() * .4, papel, g, 0); h.rotation.y = azar() * 3; }
    return g;
  }
  H.persona = persona; H.palletR = palletR;
  return H;
}
