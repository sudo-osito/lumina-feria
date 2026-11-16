/* Planta Neisstech · construcción v4 (8-nov-2026). Calcada de la vista superior rectificada de la referencia de Max
   (calco/calles.json) y extendida: red de calles + bloques; cada bloque con los objetos de la referencia y lo que sigue fuera del recorte.
   Grupos: base (planta) · neiss (Neisstech fijo, solo «después») · vivo (piezas que se mueven) · desorden (solo «antes»).
   H.obst: rectángulos sólidos que nada que se mueva puede tocar (los revisa la auditoría). */
import { THREE } from './nucleo.js';
import { modelos } from './modelos.js';
import { modelos2 } from './modelos2.js';
import { pintarPiso } from './piso.js';
import * as P from './mapa.js';

export function construir(k) {
  const { M, caja, std, grupo, cil } = k, md = modelos(k), m2 = modelos2(k, md);
  const base = grupo(), neiss = grupo(), vivo = grupo(), desorden = grupo(); vivo.userData.vivo = true;
  const H = { md, m2, obst: [] };
  // capas: cada producto Neisstech en su propio grupo (fijo bajo neiss, animado bajo vivo) para encenderlo por separado en los recorridos
  H.capas = {}; const capa = (n, enVivo) => { const c = (H.capas[n] ||= { g: grupo(0, 0, 0, 0, neiss), v: null }); if (!enVivo) return c.g; return (c.v ||= grupo(0, 0, 0, 0, vivo)); };
  const C = (n) => capa(n), CV = (n) => capa(n, true);
  const ob = (x0, z0, x1, z1, tag = '') => H.obst.push({ x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), tag });
  const { NAVE, W1 } = P, A = NAVE.alto, T = .25, PATIO = -1.2;
  const cx = (NAVE.x0 + NAVE.x1) / 2, cz = (NAVE.z0 + NAVE.z1) / 2, AN = NAVE.x1 - NAVE.x0, LA = NAVE.z1 - NAVE.z0;
  let sem = 5; const azar = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);

  /* ═════════ volumen, patios y piso ═════════ */
  caja(AN + .6, 1.5, LA + .6, cx, -1.54, cz, M.losa, base, .2).castShadow = false;
  caja(14.6, .4, LA + 30, -19.2, PATIO - .4, cz, M.asfalto, base, .15).castShadow = false;
  caja(14, .4, 30, 51.2, PATIO - .4, -12, M.asfalto, base, .15).castShadow = false;
  caja(AN + 60, .3, LA + 60, cx, PATIO - .9, cz, M.pasto, base, .1).castShadow = false;
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(AN, LA), M.piso); suelo.rotation.x = -Math.PI / 2; suelo.position.set(cx, 0, cz); suelo.receiveShadow = true; base.add(suelo);
  const piso = (cv) => { const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; const o = new THREE.Mesh(new THREE.PlaneGeometry(AN, LA), new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: .9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })); o.rotation.x = -Math.PI / 2; o.position.set(cx, .012, cz); o.receiveShadow = true; o.renderOrder = 1; k.escena.add(o); return o; };
  const ppm = k.movil ? 22 : 40; H.pisoD = piso(pintarPiso(ppm, false)); H.pisoA = piso(pintarPiso(ppm, true)); H.piso = piso; H.ppm = ppm;
  { const lm = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); for (let i = 0; i < 9; i++) { const o = new THREE.Mesh(new THREE.PlaneGeometry(5, .1), lm); o.rotation.x = -Math.PI / 2; o.position.set(-21, PATIO + .005, -22 + i * 2.6); base.add(o); }
    [[-21, -20.7, 0xD9363E], [-21, -15.5, 0xF2B705], [-21, -12.9, 0x9AA3AE], [-21, -7.7, 0x4F6D8F]].forEach(([x, z, c]) => (m2.auto(base, x, z, 0, c).position.y = PATIO)); }

  const corte = (w, d, x, z, y) => caja(w, .04, d, x, y, z, M.corte, base, .01);
  const muro = (w, h, d, x, y, z) => { caja(w, h, d, x, y, z, M.muro, base, .03); corte(w + .01, d + .01, x, z, y + h); if (y < .5) ob(x - w / 2, z - d / 2, x + w / 2, z + d / 2, 'muro'); };
  function muroZ(x, z0, z1, huecos, h = A) { let a = z0; for (const [h0, h1, al] of huecos.sort((p, q) => p[0] - q[0])) { if (h0 - a > .05) muro(T, h, h0 - a, x, 0, (a + h0) / 2); if (al < h) muro(T, h - al, h1 - h0, x, al, (h0 + h1) / 2); a = h1; } if (z1 - a > .05) muro(T, h, z1 - a, x, 0, (a + z1) / 2); }
  function muroX(z, x0, x1, huecos, h = A) { let a = x0; for (const [h0, h1, al] of huecos.sort((p, q) => p[0] - q[0])) { if (h0 - a > .05) muro(h0 - a, h, T, (a + h0) / 2, 0, z); if (al < h) muro(h1 - h0, h - al, T, (h0 + h1) / 2, al, z); a = h1; } if (x1 - a > .05) muro(x1 - a, h, T, (a + x1) / 2, 0, z); }
  const sello = std(0x5A6170, { roughness: .8 }), cortina = std(0xD3D9E1);
  function anden(xMuro, z, lado, abierto = true) {
    for (const zz of [z - 1.7, z + 1.7]) caja(.3, 2.9, .14, xMuro + lado * .3, PATIO + .3, zz, sello, base, .04);
    caja(.3, .4, 3.6, xMuro + lado * .3, 2.6, z, sello, base, .04);
    caja(1.2, .05, 2.4, xMuro - lado * .6, -.03, z, M.gris2, base, .01);
    if (!abierto) caja(.08, 3.0, 3.2, xMuro - lado * .05, 0, z, cortina, base, .02); else caja(.35, .36, 3.4, xMuro - lado * .1, 3.0, z, cortina, base, .08);
  }
  muroX(NAVE.z0 - T / 2, NAVE.x0 - T, NAVE.x1 + T, []);
  muroZ(NAVE.x0 - T / 2, NAVE.z0 - T, NAVE.z1 + T, [[P.ANDEN.z - 1.6, P.ANDEN.z + 1.6, 3.1], [P.ANDEN2.z - 1.6, P.ANDEN2.z + 1.6, 3.1], [P.PUERTA_REC.z - .55, P.PUERTA_REC.z + .55, 2.15]]);
  anden(NAVE.x0 - T / 2, P.ANDEN.z, -1); anden(NAVE.x0 - T / 2, P.ANDEN2.z, -1, false);
  muroX(NAVE.z1 + T / 2, NAVE.x0 - T, NAVE.x1 + T, [], .5);
  muroZ(NAVE.x1 + T / 2, NAVE.z0, NAVE.z1, P.PT.docks.map((d) => [d - 1.6, d + 1.6, .5]), .5);
  P.PT.docks.forEach((d, i) => anden(NAVE.x1 + T / 2, d, 1, i !== 2));
  { const r = new THREE.Mesh(new THREE.PlaneGeometry(3.4, .5), new THREE.MeshBasicMaterial({ map: k.tex((c, W, Hh) => { c.fillStyle = '#F2EAE2'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#2B2F36'; c.font = `700 ${Hh * .6}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('RECEPCIÓN', W / 2, Hh / 2 + 2); }, 512, 76), toneMapped: false })); r.rotation.y = Math.PI / 2; r.position.set(NAVE.x0 + .01, 3.3, P.ANDEN.z + 3.4); base.add(r); }
  muroZ(W1.x, NAVE.z0, NAVE.z1, [[W1.d1[0], W1.d1[1], W1.altoPorton], [W1.d2[0], W1.d2[1], W1.altoPorton], [P.PUERTA_P[0], P.PUERTA_P[1], 2.15]]);
  for (const [a, b] of [W1.d1, W1.d2]) caja(.4, .36, b - a + .2, W1.x - .2, W1.altoPorton - .02, (a + b) / 2, cortina, base, .08);
  { const [v0, v1] = W1.ventana; caja(.05, 1.4, v1 - v0, W1.x + .14, 1.0, (v0 + v1) / 2, M.vidrio, base, .01); }
  muroX(P.W2.z, NAVE.x0, P.W2.x1, []); muroX(P.W3.z, NAVE.x0, P.W3.x1, []);
  for (const [x, z] of P.COLUMNAS) { caja(.36, A, .36, x, 0, z, M.muro, base, .04); corte(.37, .37, x, z, A); ob(x - .4, z - .4, x + .4, z + .4, 'columna'); }

  /* ═════════ banda alta ═════════ */
  H.huecos = [];
  function filas(lista, x0, x1, oper) {
    for (const [z0, z1] of lista) {
      const g = grupo(0, 0, 0, Math.PI / 2, base), f = md.filaRack(g, -z1, -z0, x0, x1, P.RACK.niveles, P.RACK.alto);
      for (const h of f.huecos) { const wz0 = -h.fila[1], wz1 = -h.fila[0], pas = P.PASILLOS.find((q) => Math.abs(wz1 - q[0]) < .05 || Math.abs(wz0 - q[1]) < .05);
        const hu = { x: h.z, y: h.y, z: -h.x, cara: [wz0, wz1], pasillo: oper && pas ? pas[2] : null, norte: pas ? Math.abs(wz0 - pas[1]) < .05 : false };
        hu.oper = !!hu.pasillo && hu.x > -10.4; H.huecos.push(hu);
        if (!hu.oper && azar() > .2) { const p = md.pallet(base, azar() < .3 ? 'film' : 'caja', .55 + azar() * .3); p.position.set(hu.x, hu.y, hu.z); p.rotation.y = Math.PI / 2; } }
      ob(x0 - .1, z0 - .05, x1 + .1, z1 + .05, 'rack');
      const pg = grupo(x1 + .45, 0, (z0 + z1) / 2, Math.PI / 2, C('protRack')); md.protectorRack(pg, -(z1 - z0) / 2 - .05, (z1 - z0) / 2 + .05, 0); ob(x1 + .1, z0 - .1, x1 + .82, z1 + .1, 'protector');
    }
  }
  filas(P.FILAS, P.RACK.x0, P.RACK.x1, true); filas(P.RACK2.filas, P.RACK2.x0, P.RACK2.x1, false);
  for (const [z0, z1, n] of P.PASILLOS) { md.colgante(C('colgantes'), n, P.RACK.x1 + .25, 4.45, (z0 + z1) / 2, 0, .9, .5); md.letrero(C('senal'), 'img/letreros/p-peatones.webp', .3, P.RACK.x1 + .3, 1.4, z0 + .25, 0); }
  for (const [n, z] of [['04', -21.2], ['05', -17.0]]) md.colgante(C('colgantes'), n, P.RACK2.x1 + .25, 4.45, z, 0, .9, .5);
  { const z = P.PALLETS_VACIOS; m2.apilado(base, z.x0 + .8, (z.z0 + z.z1) / 2, 'negro', 9); m2.apilado(base, z.x0 + 2.0, (z.z0 + z.z1) / 2, 'madera', 7); m2.apilado(base, z.x0 + 3.2, (z.z0 + z.z1) / 2, 'caja', 2); ob(z.x0 + .2, z.z0 + .6, z.x0 + 3.8, z.z1 - .6, 'apilado'); }
  for (let i = 0; i < 3; i++) { const c = md.carroKitting(base, md.BIN[0]); c.g.position.set(-10.2 + i * 1.6, 0, 12.6); ob(-10.85 + i * 1.6, 12.25, -9.55 + i * 1.6, 12.95, 'carro'); }
  for (const [x, z] of [[-9.4, 16.4], [-7.8, 16.4], [-6.2, 16.4], [-9.4, 18.2], [-7.8, 18.2]]) { const p = md.pallet(base, azar() < .5 ? 'caja' : 'film', .5 + azar() * .3); p.position.set(x, 0, z); ob(x - .55, z - .6, x + .55, z + .6, 'pallet'); }
  { const c = P.CARGA; for (let i = 0; i < 3; i++) { const x = c.x0 + .8 + i * 2.1; caja(.6, 1.1, .4, x, 0, c.z1 + .5, M.gris, base, .05); caja(.5, .3, .05, x, .7, c.z1 + .28, M.azul, base, .02); }
    for (let i = 0; i < 2; i++) { const g = md.montacargas(base); g.g.position.set(c.x0 + .8 + i * 2.1, 0, c.z0 + 1.8); g.g.rotation.y = -Math.PI / 2; g.levantar(0); ob(c.x0 + .2 + i * 2.1, c.z0 + .4, c.x0 + 1.4 + i * 2.1, c.z0 + 3.2, 'grua'); } }
  md.letrero(C('senal'), 'img/letreros/o-casco.webp', .3, NAVE.x0 + .02, 1.25, P.PUERTA_REC.z - 1.1, 0);
  md.letrero(C('senal'), 'img/letreros/o-chaleco.webp', .3, NAVE.x0 + .02, 1.25, P.PUERTA_REC.z - 1.6, 0);
  md.letrero(C('senal'), 'img/letreros/s-salida.webp', .24, NAVE.x0 + .02, 2.25, P.PUERTA_REC.z, 0).scale.set(1, .62, 1);
  md.letrero(C('senal'), 'img/letreros/p-carga.webp', .3, NAVE.x0 + .02, 1.4, P.ANDEN.z + 2.1, 0);
  md.letrero(C('senal'), 'img/letreros/p-apilamiento.webp', .28, P.PALLETS_VACIOS.x0 + 2.5, 1.4, P.W2.z + .14, Math.PI / 2);
  for (const zz of [P.ANDEN.z - 2.0, P.ANDEN.z + 2.0]) { md.bolardo(C('protCol'), NAVE.x0 + .35, zz); ob(NAVE.x0 + .2, zz - .15, NAVE.x0 + .5, zz + .15); }
  md.letrero(C('senal'), 'img/letreros/s-encuentro.webp', .45, -23.5, 1.8, 30, Math.PI / 2, 'poste').position.y = PATIO + 1.8;

  /* ═════════ hall ═════════ */
  m2.lineaTunel(base, P.MAQUINA.x, P.MAQUINA.z0, P.MAQUINA.z1); ob(P.MAQUINA.x - .95, P.MAQUINA.z0 - .2, P.MAQUINA.x + .95, P.MAQUINA.z1 + .1, 'maquina');
  md.tablero(C('standboard'), P.STANDBOARD.x, .6, P.STANDBOARD.z, Math.PI, 1.8, 1.1, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#056CF2'; x.fillRect(0, 0, w, h * .14); x.fillStyle = '#fff'; x.font = `700 ${h * .08}px Poppins`; x.fillText('STANDBOARD · GESTIÓN DIARIA', w * .04, h * .1); const c = ['#22C55E', '#22C55E', '#F5C400', '#22C55E', '#E5383B']; for (let i = 0; i < 5; i++) { x.fillStyle = '#EEF2F7'; x.fillRect(w * (.03 + i * .195), h * .2, w * .18, h * .74); x.fillStyle = c[i]; x.beginPath(); x.arc(w * (.12 + i * .195), h * .3, h * .05, 0, 7); x.fill(); } }, true);
  ob(P.STANDBOARD.x - .15, P.STANDBOARD.z - 1.0, P.STANDBOARD.x + .4, P.STANDBOARD.z + 1.0, 'tablero');
  md.estanteria(base, 3.0, -1.6, .4); ob(2.45, -1.65, 3.55, .45, 'estante');
  for (const [x, z] of [[3.6, 3.8], [5.0, 3.8]]) { const p = md.pallet(base, 'caja', .6 + azar() * .2); p.position.set(x, 0, z); ob(x - .55, z - .6, x + .55, z + .6, 'pallet'); }
  for (const [x, z] of P.CUBES) { m2.cube(base, x, z); ob(x - .4, z - .4, x + .4, z + .4, 'cube'); }
  { const c = P.CAMARA_FRIA; H.fria = m2.camaraFria(base, c.x0, c.x1, c.z0, c.z1, c.puerta); H.fria.hoja.parent.remove(H.fria.hoja); vivo.add(H.fria.hoja);
    for (const ax of [c.x0 + 2, c.x0 + 4.4, c.x0 + 6.8]) m2.aire(base, ax, c.z0 + 2.4).position.y = 3.2;
    ob(c.x0, c.z0, c.x0 + .2, c.z1, 'fria'); ob(c.x1 - .2, c.z0, c.x1, c.z1, 'fria'); ob(c.x0, c.z1 - .22, c.puerta - .9, c.z1, 'fria'); ob(c.puerta + .9, c.z1 - .22, c.x1, c.z1, 'fria');
    const carro = md.carroKitting(base, md.BIN[0]); carro.g.position.set(8.2, 0, -9.2); ob(7.55, -9.55, 8.85, -8.85, 'carro'); }
  H.robot = m2.celdaRobot(base, P.ROBOT.x, P.ROBOT.z); H.robot.base.userData.vivo = true; ob(P.ROBOT.x - 1.65, P.ROBOT.z - 1.65, P.ROBOT.x + 1.65, P.ROBOT.z + 1.65, 'robot');
  H.robot2 = m2.celdaRobot(base, P.ROBOT2.x, P.ROBOT2.z); H.robot2.base.userData.vivo = true; ob(P.ROBOT2.x - 1.65, P.ROBOT2.z - 1.65, P.ROBOT2.x + 1.65, P.ROBOT2.z + 1.65, 'robot');
  m2.torno(base, 23.6, -12.6); ob(22.35, -13.05, 24.85, -12.15, 'maquina');
  // milk-run AGV como en la referencia: pórtico tubular con lámparas, pantalla, carros con cajas en carriles, ubicaciones 001–009
  { const s = P.SUPER, g = grupo(0, 0, 0, 0, C('milkrun')), tubo = M.acero, n = 9, paso = (s.z1 - s.z0 - .6) / (n - 1);
    for (const [px, pz] of [[s.x0 + .3, s.z0 + .2], [s.x1 - 1.6, s.z0 + .2], [s.x0 + .3, s.z1 - .2], [s.x1 - 1.6, s.z1 - .2]]) cil(.05, 3.0, px, 0, pz, tubo, g, 10);
    caja(s.x1 - s.x0 - 1.9, .08, .08, (s.x0 + s.x1 - 1.3) / 2, 3.0, s.z0 + .2, tubo, g, .02); caja(s.x1 - s.x0 - 1.9, .08, .08, (s.x0 + s.x1 - 1.3) / 2, 3.0, s.z1 - .2, tubo, g, .02);
    caja(.08, .08, s.z1 - s.z0 - .4, s.x0 + .3, 3.0, (s.z0 + s.z1) / 2, tubo, g, .02); caja(.08, .08, s.z1 - s.z0 - .4, s.x1 - 1.6, 3.0, (s.z0 + s.z1) / 2, tubo, g, .02);
    H.lamparas = []; for (let i = 0; i < n; i++) { const z = s.z0 + .3 + i * paso; cil(.015, .2, s.x0 + .3, 3.0, z, tubo, g, 6); const l = k.luz(0xFF3B3B, 0x4a1515); k.esfera(.08, s.x0 + .3, 3.28, z, l, g, 12); H.lamparas.push(l); }
    const pan = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ map: k.tex((c, W, Hh) => { c.fillStyle = '#0d1b33'; c.fillRect(0, 0, W, Hh); const col = ['#22C55E', '#F5C400', '#056CF2', '#22C55E', '#E5383B']; for (let i = 0; i < 15; i++) { c.fillStyle = col[i % 5]; c.globalAlpha = .85; c.fillRect(14 + (i % 5) * (W - 28) / 5, 26 + Math.floor(i / 5) * (Hh - 40) / 3, (W - 28) / 5 - 8, (Hh - 40) / 3 - 8); } c.globalAlpha = 1; c.fillStyle = '#fff'; c.font = `600 ${Hh * .09}px Poppins`; c.fillText('MILK-RUN · ESTADO DE CARROS', 14, 20); }, 512, 256), toneMapped: false }));
    caja(2.6, 1.4, .08, s.x0 + 1.9, 1.6, (s.z0 + s.z1) / 2, M.tinta, g, .02).rotation.y = Math.PI / 2; pan.rotation.y = -Math.PI / 2; pan.position.set(s.x0 + 1.84, 2.3, (s.z0 + s.z1) / 2); g.add(pan);
    H.carrosMR = []; for (let i = 0; i < n; i++) { const z = s.z0 + .3 + i * paso; if (i % 3 === 1) continue; const c = md.carroKitting(g, md.BIN[0]); c.g.position.set(s.x0 + 4.2 + (i % 2) * 1.3, 0, z); H.carrosMR.push(c); }
    for (let i = 0; i < n; i++) caja(.24, .06, .7, s.x1 - 1.8, .04, s.z0 + .3 + i * paso, M.gris2, g, .01);
    ob(s.x0, s.z0, s.x1 - 1.4, s.z1, 'milkrun'); }
  m2.taladro(base, P.TALADRO.x, P.TALADRO.z); ob(P.TALADRO.x - .4, P.TALADRO.z - .4, P.TALADRO.x + .4, P.TALADRO.z + .4, 'taladro');
  m2.torno(base, P.TORNO.x, P.TORNO.z); ob(P.TORNO.x - 1.25, P.TORNO.z - .45, P.TORNO.x + 1.25, P.TORNO.z + .45, 'torno');
  m2.taladro(base, P.FRESA.x, P.FRESA.z); ob(P.FRESA.x - .4, P.FRESA.z - .4, P.FRESA.x + .4, P.FRESA.z + .4, 'fresa');
  m2.leanCorner(C('lean'), P.LEAN.x0, P.LEAN.x1, P.LEAN.z0, P.LEAN.z1); for (const [px, pz] of [[P.LEAN.x0, P.LEAN.z0], [P.LEAN.x1, P.LEAN.z0], [P.LEAN.x0, P.LEAN.z1], [P.LEAN.x1, P.LEAN.z1]]) ob(px - .2, pz - .2, px + .2, pz + .2, 'lean');
  ob((P.LEAN.x0 + P.LEAN.x1) / 2 - 1.3, P.LEAN.z1 - .3, (P.LEAN.x0 + P.LEAN.x1) / 2 + 1.3, P.LEAN.z1 - .1, 'pantalla');
  m2.vending(base, P.VENDING.x, P.VENDING.z, Math.PI / 2, 0xB0573A, 'COFFEE'); m2.vending(base, P.VENDING.x + .9, P.VENDING.z, Math.PI / 2, 0xE0662E, 'SNACKS'); m2.casilleros(base, P.VENDING.x + 2.8, P.VENDING.z, Math.PI / 2, 4);
  ob(P.VENDING.x - .45, P.VENDING.z - .45, P.VENDING.x + 3.85, P.VENDING.z + .45, 'vending');
  { const kk = P.KITTING; for (const x of [kk.x0 + 1.2, kk.x0 + 3.6]) { md.estanteria(base, x, kk.z0 + 1.0, kk.z0 + 6.0); ob(x - .55, kk.z0 + .95, x + .55, kk.z0 + 6.05, 'estante'); }
    for (let i = 0; i < 5; i++) { const c = md.carroKitting(C('kitting'), md.BIN[i % 4]); c.g.position.set(kk.x0 + 6.6 + i * 1.5, 0, kk.z0 + 2.0); c.g.rotation.y = Math.PI / 2; ob(kk.x0 + 6.25 + i * 1.5, kk.z0 + 1.35, kk.x0 + 6.95 + i * 1.5, kk.z0 + 2.65, 'carro'); }
    md.estacion(base, kk.x0 + 8.6, kk.z0 + 6.6); ob(kk.x0 + 7.75, kk.z0 + 6.2, kk.x0 + 9.45, kk.z0 + 7.0, 'mesa'); }
  { const o = P.OFICINAS, h = 2.6; muroX(o.z0, o.x0, o.x1, [[3.0, 4.1, 2.1], [10.0, 11.1, 2.1]], h); muroZ(o.x1, o.z0, o.z1, [], h); caja(4, 1.2, .05, 7.0, .9, o.z0 - .02, M.vidrio, base, .01);
    muroZ(7.2, o.z0, o.z1, [[27.0, 28.1, 2.1]], h);
    for (const [x, z] of [[2.4, 28.2], [2.4, 31.2], [5.2, 28.2], [5.2, 31.2]]) { caja(1.4, .05, .7, x, .74, z, M.blanco, base, .02); for (const dx of [-.62, .62]) caja(.05, .74, .6, x + dx, 0, z, M.gris2, base, .01); caja(.5, .32, .03, x, .78, z - .25, M.tinta, base, .01); }
    for (const z of [28.4, 31.4]) { caja(3.6, .05, .9, 10.6, .74, z, M.madera, base, .02); for (const dx of [-1.6, 1.6]) caja(.06, .74, .8, 10.6 + dx, 0, z, M.gris2, base, .01); } }
  { const t = P.TALLER; caja(.8, .9, 3, P.OFICINAS.x1 + .55, 0, 30.0, M.gris, base, .04); md.tablero(C('sombras'), P.OFICINAS.x1 + .14, .95, 30.0, 0, 2.6, 1.2, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#056CF2'; x.fillRect(0, 0, w, h * .14); x.fillStyle = '#fff'; x.font = `700 ${h * .08}px Poppins`; x.fillText('TABLERO DE SOMBRAS · TALLER', w * .04, h * .1); x.fillStyle = '#1b2230'; for (let i = 0; i < 8; i++) x.fillRect(w * (.06 + i * .11), h * .25, w * .04, h * (.4 + (i % 3) * .1)); });
    ob(P.OFICINAS.x1 + .1, 28.45, P.OFICINAS.x1 + 1.0, 31.55, 'taller'); const g = md.montacargas(base); g.g.position.set(t.x0 + 6.5, 0, t.z0 + 3.5); g.levantar(.4); ob(t.x0 + 5.1, t.z0 + 2.9, t.x0 + 8.0, t.z0 + 4.1, 'grua'); }
  { const r = P.REPUESTOS; for (let i = 0; i < 6; i++) { const x = r.x0 + 1.4 + i * 4.0; md.estanteria(C('estanteria'), x, r.z0 + .3, r.z1 - .4); ob(x - .55, r.z0 + .25, x + .55, r.z1 - .35, 'estante');
      if (i < 5) md.colgante(C('identRep'), 'R' + (i + 1), x + 2.0, 3.2, (r.z0 + r.z1) / 2, Math.PI / 2, .8, .4);
      // antes: cajas en el piso del pasillo (sin estantería)
      if (i < 5) for (let j = 0; j < 3; j++) { const p = md.pallet(C('estanteriaAntes'), 'caja', .35 + azar() * .3); p.position.set(x + 1.3 + (j % 2) * .9, 0, r.z0 + .9 + j * 1.1); p.rotation.y = azar() * .6; } }
    md.panelCajas(C('cajas'), r.x0 + 3.4, .9, NAVE.z0 + .16, 0); }
  { const pt = P.PT; for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) { if (azar() < .2) continue; const x = pt.x0 + 1.6 + i * 1.5, z = pt.z0 + 2 + f * 3.4; const p = md.pallet(base, azar() < .5 ? 'film' : 'caja', .7); p.position.set(x, 0, z); }
    for (let f = 0; f < 4; f++) ob(pt.x0 + 1.0, pt.z0 + 1.4 + f * 3.4, pt.x0 + 10.2, pt.z0 + 2.6 + f * 3.4, 'pt'); }
  for (const d of P.PT.docks.slice(0, 2)) { const c = md.camion(base); c.g.position.set(NAVE.x1 + .25 + 3.52, PATIO, d); }
  const estandar = k.tex((c, W, Hh) => { c.fillStyle = '#fff'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#056CF2'; c.fillRect(0, 0, W, Hh * .2); c.fillStyle = '#fff'; c.font = `700 ${Hh * .12}px Poppins`; c.fillText('ESTÁNDAR DEL PUESTO', W * .05, Hh * .14);
    c.fillStyle = '#1b2230'; for (let i = 0; i < 4; i++) { c.fillRect(W * .05, Hh * (.3 + i * .17), W * .22, Hh * .12); c.fillStyle = '#8A94A3'; c.fillRect(W * .32, Hh * (.33 + i * .17), W * .6, Hh * .03); c.fillRect(W * .32, Hh * (.38 + i * .17), W * .45, Hh * .03); c.fillStyle = '#1b2230'; } }, 256, 180);
  { const e = P.ENSAMBLE; H.estaciones = e.estaciones.map((x) => { const s = md.estacion(C('estacion'), x, e.zMesa, C('herramientas')); md.mesaBaja(C('estacionAntes'), x, e.zMesa); const f = md.fifo(C('fifo'), x, e.zMesa - 1.9, 1.4); f.g.userData.vivo = true; ob(x - .85, e.zMesa - .45, x + .85, e.zMesa + .45, 'estacion'); ob(x - .72, e.zMesa - 2.35, x + .72, e.zMesa - 1.45, 'fifo'); return { x, ...s, fifo: f, cajas: f.cajas }; });
    md.tablero(C('indicadores'), e.x1 - .3, .5, e.z0 + 3, -Math.PI / 2, 2.2, 1.1, (x, w, h) => { x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.fillStyle = '#056CF2'; x.fillRect(0, 0, w, h * .14); x.fillStyle = '#fff'; x.font = `700 ${h * .08}px Poppins`; x.fillText('GESTIÓN DIARIA · ENSAMBLE', w * .04, h * .1); const v = [.5, .62, .58, .7, .74, .8, .78, .86]; v.forEach((q, i) => { x.fillStyle = q > .7 ? '#22C55E' : '#F5C400'; x.fillRect(w * (.08 + i * .108), h * (.92 - q * .6), w * .07, h * q * .6); }); }, true);
    ob(e.x1 - .55, e.z0 + 1.8, e.x1 - .05, e.z0 + 4.2, 'tablero');
    // gestión visual del puesto: área demarcada en azul y el estándar del puesto a la vista
    for (const x of e.estaciones) { const g = grupo(x, 0, e.zMesa, 0, C('puesto')), az = std(0x1E6FE0, { roughness: .6 });
      for (const [w, d, px, pz] of [[1.9, .06, 0, -.55], [1.9, .06, 0, 1.4], [.06, 1.95, -.95, .43], [.06, 1.95, .95, .43]]) caja(w, .012, d, px, .004, pz, az, g, .002);
      const hoja = new THREE.Mesh(new THREE.PlaneGeometry(.42, .3), new THREE.MeshBasicMaterial({ map: estandar, toneMapped: false })); hoja.position.set(-.55, 1.62, -.345); g.add(hoja); }
    md.letrero(C('limpieza5s'), 'img/letreros/t-limpieza-a.webp', .55, 27.2, 1.0, 12.0, 0).scale.set(1, .92, 1); }
  { const pz = P.PALETIZADO; H.mesa = md.mesaElevadora(C('mesa'), pz.mesa[0], pz.mesa[1]); H.mesa.g.userData.vivo = true; ob(pz.mesa[0] - .7, pz.mesa[1] - .7, pz.mesa[0] + .7, pz.mesa[1] + .7, 'mesa');
    H.vacio = md.manipulador(C('vacio'), pz.columna[0], pz.columna[1]); H.vacio.g.userData.vivo = true; ob(pz.columna[0] - .3, pz.columna[1] - .3, pz.columna[0] + .3, pz.columna[1] + .3, 'columna');
    md.cinta(base, pz.x0 + 1.0, pz.mesa[0] - 1.6, pz.mesa[1]); ob(pz.x0 + 1.0, pz.mesa[1] - .35, pz.mesa[0] - 1.6, pz.mesa[1] + .35, 'cinta');
    const cols = [[0x2B2F36, 'r-basura'], [0x1E6FE0, 'r-papel'], [0xF5C400, 'r-plastico'], [0x1FA45A, 'r-vidrio'], [0x1E6FE0, 'r-carton']];
    caja(5.2, 2.0, .06, pz.x1 - 3.0, 0, pz.z1 - .1, std(0xE9F3EC), C('puntoLimpio'), .02);
    cols.forEach(([c, img], i) => { const x = pz.x1 - 5.2 + i * 1.1; md.contenedor(C('puntoLimpio'), x, pz.z1 - .5, c); md.letrero(C('puntoLimpio'), `img/letreros/${img}.webp`, .3, x, 1.05, pz.z1 - .08, -Math.PI / 2); });
    md.letrero(C('puntoLimpio'), 'img/letreros/r-zona.webp', .36, pz.x1 - 6.0, 1.3, pz.z1 - .08, -Math.PI / 2); ob(pz.x1 - 5.6, pz.z1 - .85, pz.x1 - .4, pz.z1, 'punto limpio'); }

  /* ═════════ Neisstech: barreras, protecciones, señalética, gestión de tráfico ═════════ */
  const SH = P.SENDERO_H;
  const barr = (x0, z0, x1, z1, al, ri) => { md.barrera(C('barrSendero'), x0, z0, x1, z1, al, ri); ob(x0 - .14, z0 - .14, x1 + .14, z1 + .14, 'barrera'); };
  barr(SH.barrera, -10.0, SH.barrera, P.STANDBOARD.z - 2.6); barr(SH.barrera, P.STANDBOARD.z + 1.2, SH.barrera, 3.3);
  for (const [x, z] of P.COLUMNAS) { md.protectorColumna(C('protCol'), x, z); const s = x < -5 ? 1 : -1; md.extintor(C('senal'), x + s * .22, z, s > 0 ? 0 : Math.PI); md.letrero(C('senal'), 'img/letreros/s-extintor.webp', .2, x + s * .2, 1.45, z, s > 0 ? 0 : Math.PI); }
  md.letrero(C('senal'), 'img/letreros/p-montacargas.webp', .3, W1.x + .14, 1.2, W1.d1[1] + .2, 0);
  md.letrero(C('senal'), 'img/letreros/p-porton.webp', .3, W1.x - .14, 1.3, W1.d1[1] + .25, Math.PI);
  md.letrero(C('senal'), 'img/letreros/s-salida.webp', .24, W1.x + .14, 2.2, (P.PUERTA_P[0] + P.PUERTA_P[1]) / 2, 0).scale.set(1, .62, 1);
  md.letrero(C('senal'), 'img/letreros/s-botiquin.webp', .26, W1.x + .14, 1.3, 12.6, 0); caja(.14, .36, .4, W1.x + .2, .82, 12.6, std(0x1FA45A), C('senal'), .03);
  md.tableroElectrico(C('electrico'), W1.x + .13, -7.0, 0); md.letrero(C('electrico'), 'img/letreros/p-tablero.webp', .2, W1.x + .14, 2.05, -7.75, 0); ob(W1.x, -7.55, W1.x + .5, -6.45, 'tablero');
  { const tubo = (y, x, col, txt, z0, z1) => { const g = C('tuberias'), L = z1 - z0, m = std(col, { roughness: .4 }), t = grupo(x, y, (z0 + z1) / 2, 0, g); t.rotation.x = Math.PI / 2; cil(.06, L, 0, -L / 2, 0, m, t, 14);
      for (let z = z0 + .4; z < z1; z += 2.2) caja(W1.x + .13 - x + .02, .04, .05, (x + W1.x + .13) / 2, y - .02, z, M.gris2, g, .01);
      const et = k.tex((c, W, Hh) => { c.fillStyle = '#fff'; c.fillRect(0, 0, W, Hh); c.fillStyle = '#' + col.toString(16).padStart(6, '0'); c.fillRect(0, 0, Hh * 1.1, Hh); c.fillStyle = '#1b2230'; c.font = `700 ${Hh * .5}px Poppins`; c.textBaseline = 'middle'; c.fillText(txt, Hh * 1.3, Hh * .53);
        c.beginPath(); c.moveTo(W - Hh * .9, Hh * .2); c.lineTo(W - Hh * .25, Hh * .5); c.lineTo(W - Hh * .9, Hh * .8); c.closePath(); c.fill(); }, 512, 64);
      for (let z = z0 + 1.6; z < z1 - .6; z += 3.4) { const e = new THREE.Mesh(new THREE.PlaneGeometry(.9, .11), new THREE.MeshBasicMaterial({ map: et, toneMapped: false })); e.rotation.y = Math.PI / 2; e.position.set(x + .065, y, z); g.add(e); } };
    tubo(3.05, W1.x + .32, 0x1E6FE0, 'AIRE COMPRIMIDO', -10.2, 2.6); tubo(2.8, W1.x + .32, 0x1FA45A, 'AGUA INDUSTRIAL', -10.2, 2.6); }
  // radar de velocidad en el pasillo de grúas, de frente al tránsito que sube (+z), con ménsula al muro W1
  H.radar = md.radar(C('radar'), W1.x - .6, 2.55, -2.0, Math.PI); caja(.5, .06, .06, W1.x - .38, 3.0, -1.96, M.tinta, C('radar'), .01);
  const soporte = (x, z, y, nx, nz, L = .5, padre = vivo) => { caja(Math.abs(nx) * L + .06, .06, Math.abs(nz) * L + .06, x + nx * L / 2, y, z + nz * L / 2, M.tinta, padre, .01); return grupo(x + nx * L, y - .02, z + nz * L, 0, padre); };
  H.cruces = {};
  { const z0 = 3.9, z1 = 6.5, an = SH.x1 - SH.x0 + .2, czz = (z0 + z1) / 2;
    const b1 = soporte(W1.x + .13, czz - 1.3, 3.35, 1, 0, .9, CV('proyLineas')), b2 = soporte(W1.x + .13, z1 + 1.9, 3.35, 1, 0, .7, CV('proySenal'));
    const lineas = [-1, 1].map((s) => md.proyector(b1, 0, -.1, s * .35, new THREE.Vector3(s < 0 ? SH.x0 + .05 : SH.x1 - .05, 0, czz)));
    const senal = md.proyector(b2, 0, -.1, 0, new THREE.Vector3(SH.c, 0, czz));
    const sensores = [[W1.x + .14, 2.7, W1.d1[0] - .35, 0], [W1.x + .14, 2.7, W1.d1[1] + .3, 0], [W1.x - .14, 2.7, W1.d1[0] - .35, Math.PI], [W1.x - .14, 2.7, W1.d1[1] + .3, Math.PI]].map(([x, y, z, r]) => md.sensor(CV('semaforo'), x, y, z, r));
    const puertas = [md.puerta(CV('puertas'), SH.x0 - .1, z0, 0, an), md.puerta(CV('puertas'), SH.x0 - .1, z1, 0, an)]; puertas[0].dir = -1; puertas[1].dir = 1;
    H.cruces.D1 = { lineas, senal, sensores, puertas, rect: { x0: SH.x0 - .1, x1: SH.x1 + .1, z0, z1 }, cz: czz }; }
  H.cruces.D2 = { ampel: [m2.ampel(C('semaforo'), SH.x1 + .25, W1.d2[1] + .35, -Math.PI / 2)] };
  H.cruces.H1 = { ampel: [m2.ampel(C('semaforo'), P.CEBRA_H1.x0 - .4, P.CEBRA_H1.z + 1.4, Math.PI / 2)] };
  for (const [x, z] of [[P.CEBRA_H2.x - 1.4, P.CEBRA_H2.z0 - .4], [P.CEBRA_H3.x - 1.6, P.CEBRA_H3.z0 - .3], [P.CEBRA_H1.x1 + .4, P.CEBRA_H1.z - 1.2]]) m2.info(C('senal'), x, z, 0);
  H.sg = md.safetygate(CV('sg'), W1.x - 1.0, W1.d1[0] - .1, W1.d1[1] + .1, 3.42, .82, W1.x - .13);
  H.sg2 = md.safetygate(CV('sg'), W1.x + 1.0, W1.d1[0] - .1, W1.d1[1] + .1, 3.42, .82, W1.x + .13);
  H.gestor = md.gestor(CV('semaforo'), P.PASILLO_G.x0 + .3, 3.0, 1.2, [0, Math.PI / 2, Math.PI, -Math.PI / 2]); H.gestor.flujos = ['cruza', 'pasillo', 'cruza', 'pasillo'];
  { const b = grupo(NAVE.x0 + .14, 1.8, P.PUERTA_REC.z - 3.2, 0, C('semaforo')); caja(.1, .3, .18, 0, 0, 0, M.negro, b, .03); const r = k.luz(0xFF3B3B, 0x4a1515), v = k.luz(0x22C55E, 0x123a20); k.esfera(.05, .06, .22, 0, r, b, 10); k.esfera(.05, .06, .08, 0, v, b, 10); H.balizaInterior = { r, v }; }
  H.salidas = ['01', '02'].map((n) => { const p = P.pasillo(n), b = soporte(W1.x - .13, p.c, 3.35, -1, 0, .7, CV('proySalidas')); return { n, p, proy: md.proyector(b, 0, -.1, 0, new THREE.Vector3(P.PASILLO_G.x0 + .9, 0, p.c)) }; });
  { const b = soporte(NAVE.x0 + .13, P.PUERTA_REC.z - .8, 3.35, 1, 0, .6, CV('proyRec')); H.proyRec = md.proyector(b, 0, -.1, 0, new THREE.Vector3(NAVE.x0 + 1.4, 0, P.PUERTA_REC.z)); }
  { const c = P.CAMARA_FRIA, b = soporte(c.puerta - 1.4, c.z1 + .02, 2.95, 0, 1, .5, CV('proyFria')); H.proyFria = md.proyector(b, 0, -.1, 0, new THREE.Vector3(c.puerta, 0, c.z1 + 1.5)); }
  { const d = P.ANDEN.z, x = NAVE.x0 - T;
    const semf = (gx, gy, gz, ry) => { const s = grupo(gx, gy, gz, ry, CV('smartdock')); caja(.24, .56, .14, 0, 0, 0, M.negro, s, .06); const r = k.luz(0xFF3B3B, 0x4a1515), v = k.luz(0x22C55E, 0x123a20); k.esfera(.07, .08, .4, 0, r, s, 12); k.esfera(.07, .08, .17, 0, v, s, 12); return { r, v }; };
    H.dock = { dentro: semf(NAVE.x0 + .14, 1.7, d - 2.0, 0), fuera: semf(x - .55, PATIO + 1.9, d + 2.2, Math.PI) };
    caja(3.4, .05, .14, x - 1.9, PATIO, d + 1.75, M.gris2, C('smartdock'), .01);
    H.dock.cuna = grupo(x - .5, PATIO, d + 1.75, 0, CV('smartdock')); caja(.32, .3, .3, 0, 0, 0, M.amarillo, H.dock.cuna, .08); caja(.34, .05, .34, 0, 0, 0, M.negro, H.dock.cuna, .02); }

  /* ═════════ antes: desorden en rincones sin tránsito ═════════ */
  for (const [x, z] of [[-10.6, 21.0], [-6.0, 21.6], [24.6, 18.6], [22.0, 20.6], [42.6, -1.0], [16.4, -17.6]]) { const p = md.pallet(desorden, azar() < .5 ? 'caja' : 'film', .5 + azar() * .4); p.position.set(x, 0, z); p.rotation.y = azar() * .5; }

  { const d = P.PT.docks[0], xm = NAVE.x1 + T / 2;
    const semf = (gx, gy, gz, ry, verde) => { const s = grupo(gx, gy, gz, ry, C('smartdock')); caja(.24, .56, .14, 0, 0, 0, M.negro, s, .06); const r = k.luz(0xFF3B3B, 0x4a1515), v = k.luz(0x22C55E, 0x123a20); k.esfera(.07, .08, .4, 0, r, s, 12); k.esfera(.07, .08, .17, 0, v, s, 12); r.emissiveIntensity = verde ? .05 : 2.4; v.emissiveIntensity = verde ? 2.4 : .05; };
    semf(xm - .3, 1.7, d - 2.0, Math.PI, true); semf(xm + .55, PATIO + 1.9, d - 2.2, 0, false);
    const cu = grupo(xm + 1.45, PATIO, d - 1.12, 0, C('smartdock')); caja(.32, .3, .3, 0, 0, 0, M.amarillo, cu, .08); caja(.34, .05, .34, 0, 0, 0, M.negro, cu, .02); }
  // barrera vehicular automática en el acceso del patio de camiones (se abre cuando llega o sale un camión)
  // en el acceso al estacionamiento, con un auto que llega, espera, pasa y se va (se anima solo cuando la capa está encendida)
  H.pluma = md.pluma(CV('pluma'), -26.0, -1.0, 0, 4.3); H.pluma.g.position.y = PATIO;
  H.autoPluma = m2.auto(CV('pluma'), -23.6, 4.6, Math.PI / 2, 0x3D7BD9); H.autoPluma.position.y = PATIO;
  H.grupos = { base, neiss, vivo, desorden }; H.NIVEL_PATIO = PATIO;
  return H;
}
