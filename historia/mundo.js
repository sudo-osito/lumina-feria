/* La historia de Don Salva · el mundo (16-nov-2026).
   El centro de distribución sale del plano que dibujó Max (neisstech-web/plano/planos/historia.json, en metros: x a la
   derecha, z hacia abajo). Muros, portones, andenes, racks, calles, senderos y columnas van tal cual; lo marcado «inventa»
   se completó: línea de ensamble, comedor, camarines, taller, carga de baterías, oficina, patio de camiones,
   estacionamientos, oficina principal, parque, calle lateral y autopista.
   Es la planta del ANTES: la pintura del piso está gastada y no hay ninguna solución de seguridad.
   construir(k, md, m2, eq) → { base, vivo, tablero, vida(t), palletPick, ... } */
import { THREE } from '../js/planta/nucleo.js';

const azar = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export const ANDENES = [63.5, 68.5, 73, 77.5, 82];
export const RACKS_X = [59.05, 63.05, 67.05, 71.05, 75.05, 79.05, 83.05];
export const COLUMNAS = [[89.5, 1.5], [89.5, 5.5], [89.5, 10.5], [89.5, 15], [89.5, 19], [53.5, 4.5], [57.5, 4.5], [61.5, 4.5], [66, 4.5], [71, 4.5], [75.5, 4.5], [80, 4.5], [84, 4.5],
  [56, 8.5], [56, 14.5], [56, 20], [56, 23.5], [56, 32.5], [48.2, 8.7], [40.5, 8.5], [48.5, 20], [48.5, 23.5]];

export function construir(k, md, m2, eq) {
  const { M, caja, cil, esfera, grupo, std, tex, luz } = k;
  const R = azar(11);
  const base = grupo(), vivo = grupo(); vivo.userData.vivo = true;
  const W = { base, vivo };

  /* ───────── pisos pintados (canvas en metros) ───────── */
  function lienzo(x0, z0, w, d, px, dib) {
    const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * d / w);
    const x = c.getContext('2d'), S = px / w; x.setTransform(S, 0, 0, S, -x0 * S, -z0 * S); dib(x);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    return t;
  }
  function plano(t, x0, z0, w, d, y, rug = .92) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: rug }));
    m.rotation.x = -Math.PI / 2; m.position.set(x0 + w / 2, y, z0 + d / 2); m.receiveShadow = true; m.userData.vivo = true; k.escena.add(m); return m;
  }
  // pintura gastada: un trazo recto hecho de pedacitos, con huecos
  function gastada(c, x0, z0, x1, z1, w, col, vida) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .28), ux = (x1 - x0) / L, uz = (z1 - z0) / L; c.fillStyle = col;
    for (let i = 0; i < n; i++) { if (R() > vida) continue; c.globalAlpha = .22 + R() * .6; const a = i * .28, l = .28 * (.45 + R() * .7), cx = x0 + ux * a, cz = z0 + uz * a;
      c.fillRect(cx - (uz ? w / 2 : 0), cz - (ux ? w / 2 : 0), Math.abs(ux) * l + (uz ? w : 0), Math.abs(uz) * l + (ux ? w : 0)); }
    c.globalAlpha = 1;
  }
  const calle = (c, x0, z0, x1, z1, vida = .5) => { c.fillStyle = 'rgba(96,104,118,.13)'; c.fillRect(x0, z0, x1 - x0, z1 - z0);
    if (x1 - x0 > z1 - z0) { gastada(c, x0, z0, x1, z0, .12, '#E2B100', vida); gastada(c, x0, z1, x1, z1, .12, '#E2B100', vida); } else { gastada(c, x0, z0, x0, z1, .12, '#E2B100', vida); gastada(c, x1, z0, x1, z1, .12, '#E2B100', vida); } };
  const sendero = (c, x0, z0, x1, z1, vida = .3) => { const h = x1 - x0 > z1 - z0; c.fillStyle = 'rgba(52,160,96,.085)'; c.fillRect(x0, z0, x1 - x0, z1 - z0);
    if (h) { gastada(c, x0, z0, x1, z0, .1, '#2F9E63', vida); gastada(c, x0, z1, x1, z1, .1, '#2F9E63', vida); } else { gastada(c, x0, z0, x0, z1, .1, '#2F9E63', vida); gastada(c, x1, z0, x1, z1, .1, '#2F9E63', vida); } };
  const cebra = (c, x0, z0, x1, z1, vida = .22) => { const h = x1 - x0 > z1 - z0;   // franjas a lo largo del paso
    if (h) for (let x = x0 + .15; x < x1 - .3; x += .6) gastada(c, x, z0 + .08, x, z1 - .08, .3, '#F0C419', vida * 1.6);
    else for (let z = z0 + .15; z < z1 - .3; z += .6) gastada(c, x0 + .08, z, x1 - .08, z, .3, '#F0C419', vida * 1.6); };

  const tNave = lienzo(35, 0, 75, 40, 4096, (c) => {
    c.fillStyle = '#DAD6CF'; c.fillRect(35, 0, 75, 40);
    // zonas con su piso
    c.fillStyle = '#E3DED4'; c.fillRect(35, 7, 5, 11.5); for (let x = 35; x < 40; x += .6) for (let z = 7; z < 18.5; z += .6) if ((Math.round(x / .6) + Math.round(z / .6)) % 2) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, z, .6, .6); }
    c.fillStyle = '#D5DEE8'; c.fillRect(35, 18.5, 5, 11.5);                       // camarines
    c.fillStyle = '#CFCAC2'; c.fillRect(35, 30, 10, 10);                          // taller
    c.fillStyle = '#DCE6F1'; c.fillRect(40.2, 22.9, 17.6, 9.9);                   // zona de reunión y descanso
    c.strokeStyle = 'rgba(5,108,242,.35)'; c.lineWidth = .1; c.strokeRect(40.6, 23.3, 16.8, 9.1);
    c.fillStyle = '#D9DDD3'; c.fillRect(40.2, 8.2, 17.6, 12);                     // ensamble
    c.fillStyle = '#D3D7DE'; c.fillRect(90, 0, 20, 6);                            // carga de baterías
    // losas y manchas
    c.strokeStyle = 'rgba(0,0,0,.045)'; c.lineWidth = .04; for (let x = 35; x <= 110; x += 6) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 40); c.stroke(); } for (let z = 0; z <= 40; z += 6) { c.beginPath(); c.moveTo(35, z); c.lineTo(110, z); c.stroke(); }
    for (let i = 0; i < 260; i++) { const x = 35 + R() * 75, z = R() * 40, r = .3 + R() * 1.6, g = c.createRadialGradient(x, z, 0, x, z, r); g.addColorStop(0, `rgba(60,55,50,${.02 + R() * .05})`); g.addColorStop(1, 'rgba(60,55,50,0)'); c.fillStyle = g; c.fillRect(x - r, z - r, r * 2, r * 2); }
    // calles de grúas (del plano)
    calle(c, 35, 0.15, 88, 7, .35); calle(c, 58.5, 6.25, 110, 9.75); calle(c, 84, 8, 88, 40); calle(c, 40.2, 20.25, 85, 22.75); calle(c, 35, 33.25, 85, 36.75);
    for (const x of [61, 65, 69, 73, 77, 81]) { c.fillStyle = 'rgba(96,104,118,.07)'; c.fillRect(x - 1.25, 9.75, 2.5, 23.5); }
    // huellas de neumático
    c.lineCap = 'round';
    for (let i = 0; i < 70; i++) { c.strokeStyle = `rgba(35,35,40,${.03 + R() * .05})`; c.lineWidth = .18 + R() * .1;
      const t = R(); c.beginPath();
      if (t < .3) { const z = 7 + R() * 2, x = 58 + R() * 40; c.moveTo(x, z); c.lineTo(x + 4 + R() * 12, z + (R() - .5) * .4); }
      else if (t < .55) { const x = 84.6 + R() * 2.8, z = 9 + R() * 22; c.moveTo(x, z); c.lineTo(x + (R() - .5) * .4, z + 3 + R() * 8); }
      else if (t < .8) { const z = 20.6 + R() * 1.8, x = 42 + R() * 30; c.moveTo(x, z); c.lineTo(x + 4 + R() * 10, z + (R() - .5) * .3); }
      else { const x = [61, 65, 69, 73, 77, 81][Math.floor(R() * 6)] + (R() - .5) * 1.2, z = R() < .5 ? 10 : 23; c.moveTo(x, z); c.quadraticCurveTo(x, z - 1.6, x + (R() < .5 ? -2.4 : 2.4), z - 1.9 - R() * .6); }
      c.stroke(); }
    // senderos peatonales: casi no se ven
    sendero(c, 56.5, 8.9, 88.5, 10.1, .26); sendero(c, 88, 0, 89, 40, .34); sendero(c, 45, 36.9, 88.5, 38.1, .3); sendero(c, 40, 6.9, 57, 8.1, .3); sendero(c, 56.4, 7.5, 57.6, 37.5, .3); sendero(c, 50.9, 0, 52.1, 7.5, .3); sendero(c, 88.5, 11.4, 110, 12.6, .36);
    // pasos de cebra, gastados
    for (const x of [61, 65, 69, 73, 77, 81]) cebra(c, x - 1.25, 8.9, x + 1.25, 10.1, x === 69 ? .13 : .2);
    cebra(c, 84, 8.9, 88, 10.1); cebra(c, 56.4, 20.25, 57.6, 22.75); cebra(c, 56.4, 33.25, 57.6, 36.75); cebra(c, 84, 36.9, 88, 38.1); cebra(c, 50.9, 3, 52.1, 6.9, .16);
    // carriles de preparación de despacho frente a los andenes
    c.font = '700 .9px Poppins, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
    ANDENES.forEach((x, i) => { gastada(c, x - 1.6, 2.8, x - 1.6, 6, .1, '#E2B100', .5); gastada(c, x + 1.6, 2.8, x + 1.6, 6, .1, '#E2B100', .5); gastada(c, x - 1.6, 6, x + 1.6, 6, .1, '#E2B100', .5); c.fillStyle = 'rgba(226,177,0,.4)'; c.fillText(String(i + 1), x, 5.2); });
    c.fillStyle = 'rgba(40,44,52,.2)'; c.font = '700 1.1px Poppins, Arial'; c.fillText('RECEPCIÓN', 45, 3.6); c.fillText('BATERÍAS', 100, 3);
  });
  plano(tNave, 35, 0, 75, 40, 0);

  const tFuera = lienzo(-45, -65, 240, 160, 3072, (c) => {
    c.fillStyle = '#E6E8E4'; c.fillRect(-45, -65, 240, 160);
    const pasto = (x, z, w, d) => { c.fillStyle = '#D5E2CB'; c.beginPath(); c.roundRect(x, z, w, d, 2.5); c.fill(); };
    const asf = (x, z, w, d, col = '#CDD1D7') => { c.fillStyle = col; c.fillRect(x, z, w, d); };
    const linea = (x0, z0, x1, z1, w = .18, col = 'rgba(255,255,255,.85)') => { c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x0, z0); c.lineTo(x1, z1); c.stroke(); };
    // autopista y calle lateral (oeste)
    pasto(-45, -65, 22, 160); asf(-20, -65, 17, 160, '#BFC4CC'); pasto(-3, -65, 5, 160); asf(2, -65, 3, 160, '#D9DCD6'); asf(14, -65, 9, 160, '#C6CAD1'); pasto(23, -65, 6, 160);
    for (let z = -65; z < 95; z += 7) { linea(-14.3, z, -14.3, z + 3.2); linea(-8.7, z, -8.7, z + 3.2); linea(18.5, z, 18.5, z + 2.6, .14); }
    linea(-19.6, -65, -19.6, 95, .22, '#E9B800'); linea(-3.4, -65, -3.4, 95, .22);
    // accesos y patios
    asf(23, 30, 12, 9); asf(29, -32, 90, 32, '#CFD3D9'); asf(40, -46, 46, 14, '#D4D7DC');                        // entrada, patio de camiones, estacionamiento norte
    for (let x = 42; x <= 84; x += 2.8) { linea(x, -45, x, -40.2, .12); linea(x, -37.8, x, -33, .12); }
    asf(111, -4, 20, 28, '#D4D7DC'); for (let z = -2; z <= 22; z += 2.8) { linea(112, z, 117, z, .12); linea(125, z, 130, z, .12); }       // estacionamiento oriente
    asf(92, 22, 36, 17, '#D4D7DC'); for (let x = 94; x <= 126; x += 2.8) { linea(x, 23, x, 28, .12); linea(x, 33, x, 38, .12); }            // estacionamiento sur-oriente
    asf(35, 41, 60, 24, '#CFD3D9'); asf(84, 40, 4, 30, '#C9CDD3');                                                                           // patio sur
    for (const x of ANDENES) { linea(x - 2, -18, x - 2, -.2, .14, 'rgba(233,184,0,.8)'); linea(x + 2, -18, x + 2, -.2, .14, 'rgba(233,184,0,.8)'); }
    // parque y áreas verdes
    pasto(118, 24, 0, 0); pasto(131, 23, 26, 20); pasto(131, -22, 30, 22); pasto(96, 41, 60, 30); pasto(29, 41, 5, 30); pasto(29, -60, 125, 12); pasto(120, -34, 40, 10);
    c.fillStyle = '#BFD8E6'; c.beginPath(); c.ellipse(145, 33, 5.5, 3.6, .3, 0, 7); c.fill();
    c.strokeStyle = '#EDEFEA'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(132, 28); c.bezierCurveTo(138, 24, 142, 40, 156, 36); c.stroke();
    // veredas
    c.fillStyle = '#EEF0EC'; c.fillRect(110, 11.4, 31, 1.2); c.fillRect(134.9, 4, 1.2, 26); c.fillRect(50.9, -1.2, 1.2, 1.2); c.fillRect(110, -1.5, 24, 1.3);
  });
  plano(tFuera, -45, -65, 240, 160, -.03, 1);

  /* ───────── muros ───────── */
  const T = .25, corte = std(0xC9B9AC, { roughness: .9 });
  function muroX(z, x0, x1, h, huecos = [], m = M.muro) { let a = x0; for (const [h0, h1, al = 0] of [...huecos].sort((p, q) => p[0] - q[0])) { if (h0 - a > .05) caja(h0 - a, h, T, (a + h0) / 2, 0, z, m, base, .02); if (al && al < h) caja(h1 - h0, h - al, T, (h0 + h1) / 2, al, z, m, base, .02); a = h1; } if (x1 - a > .05) caja(x1 - a, h, T, (a + x1) / 2, 0, z, m, base, .02); }
  function muroZ(x, z0, z1, h, huecos = [], m = M.muro) { let a = z0; for (const [h0, h1, al = 0] of [...huecos].sort((p, q) => p[0] - q[0])) { if (h0 - a > .05) caja(T, h, h0 - a, x, 0, (a + h0) / 2, m, base, .02); if (al && al < h) caja(T, h - al, h1 - h0, x, al, (h0 + h1) / 2, m, base, .02); a = h1; } if (z1 - a > .05) caja(T, h, z1 - a, x, 0, (a + z1) / 2, m, base, .02); }
  const ALTO = 7;
  muroX(0, 35, 110, ALTO, [[51, 52, 2.2], [88, 89, 2.2], ...ANDENES.map((x) => [x - 1.5, x + 1.5, 3.4])]);
  muroZ(35, 0, 40, ALTO, [[33.25, 36.75, 4.2]]);
  // el resto del perímetro va cortado bajo, como una maqueta abierta
  muroX(40, 35, 90, .7, [[84, 88], [88.1, 88.9]], corte); muroZ(90, 20, 40, .7, [], corte); muroX(20, 90, 110, .7, [], corte); muroZ(110, 0, 20, .7, [[6, 10], [11.5, 12.5]], corte);
  // interiores
  muroZ(40, 7, 30, 3, [[11.6, 12.7, 2.2], [23.6, 24.7, 2.2]]); muroX(7, 35, 40, 3); muroX(18.5, 35, 40, 3);
  muroZ(45, 30, 40, 3, [[33.25, 36.75]]); muroX(30, 35, 45, 3);
  muroZ(58, 10.5, 33, 3, [[20.25, 22.75]]); muroX(33, 45, 58, 3.8);
  // zócalo oscuro al pie de los muros altos
  caja(75, .25, .04, 72.5, 0, .15, M.gris2, base, .01);

  /* ───────── andenes y camiones ───────── */
  const acero = std(0x8D96A3, { roughness: .4, metalness: .5 }), goma = std(0x1E2126, { roughness: .8 }), cortina = std(0xE4E8ED, { roughness: .5 });
  const numero = (txt, w, h, col = '#1b2230', fondo = '#ffffff') => new THREE.MeshBasicMaterial({ map: tex((c, Wd, Hh) => { c.fillStyle = fondo; c.fillRect(0, 0, Wd, Hh); c.fillStyle = col; c.font = `800 ${Hh * .7}px Poppins, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, Wd / 2, Hh / 2 + Hh * .04); }, 256, Math.round(256 * h / w)), toneMapped: false });
  ANDENES.forEach((x, i) => {
    caja(2.3, .05, 2.5, x, 0, 1.35, acero, base, .01); caja(2.3, .06, .3, x, 0, 2.75, std(0xF5C400), base, .01);                 // niveladora
    for (const s of [-1, 1]) { caja(.16, 3.5, .34, x + s * 1.6, 0, 0, std(0xF5C400, { roughness: .5 }), base, .03); caja(.3, .5, .2, x + s * 1.15, .5, -.2, goma, base, .04); }
    caja(3.1, .5, .16, x, 3.4, 0, cortina, base, .03); for (let j = 0; j < 3; j++) caja(3.0, .22, .06, x, 2.72 + j * .23, -.02, cortina, base, .02);   // cortina recogida
    const n = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), numero(String(i + 1), 1, 1, '#ffffff', '#1b2230')); n.position.set(x, 4.5, T / 2 + .02); base.add(n);
    const sem = grupo(x + 1.95, 0, .22, 0, base); caja(.2, .5, .12, 0, 2.2, 0, goma, sem, .04); esfera(.06, 0, 2.56, .07, luz(0xFF3B3B, 0x4a1515), sem, 10); esfera(.06, 0, 2.36, .07, luz(0x22C55E, 0x123a20), sem, 10);
  });
  W.camiones = [[63.5, 0x2F6FB0], [73, 0xB9C0C8], [82, 0x2B8A66]].map(([x, col]) => { const c = eq.camion(base, col); c.g.position.set(x, 0, -3.72); c.g.rotation.y = Math.PI / 2; return c; });
  { const c = eq.camion(base, 0xC9603A); c.g.position.set(98, 0, -22); c.g.rotation.y = Math.PI; }

  /* ───────── estructura: columnas, vigas y luminarias ───────── */
  const viga = std(0xCBD2DB, { roughness: .6, metalness: .2 }), foco = std(0xFFFFFF, { emissive: 0xFFF2D0, emissiveIntensity: 1.1, roughness: .4 });
  for (const [x, z] of COLUMNAS) eq.columna(base, x, z, 6.4, false, base);
  const vigaX = (z, x0, x1) => { caja(x1 - x0, .3, .18, (x0 + x1) / 2, 6.4, z, viga, base, .02); for (let x = x0 + 2; x < x1; x += 5) { caja(.03, .7, .03, x, 5.7, z, M.tinta, base, .005); caja(1.1, .08, .34, x, 5.62, z, M.tinta, base, .03); caja(1.0, .03, .26, x, 5.6, z, foco, base, .01); } };
  const vigaZ = (x, z0, z1) => { caja(.18, .3, z1 - z0, x, 6.4, (z0 + z1) / 2, viga, base, .02); for (let z = z0 + 2; z < z1; z += 5) { caja(.03, .7, .03, x, 5.7, z, M.tinta, base, .005); caja(.34, .08, 1.1, x, 5.62, z, M.tinta, base, .03); caja(.26, .03, 1.0, x, 5.6, z, foco, base, .01); } };
  vigaX(4.5, 53.5, 89.5); vigaZ(89.5, 1.5, 19); vigaZ(56, 8.5, 32.5); vigaX(8.6, 40.5, 56); vigaX(20, 48.5, 56); vigaX(23.5, 48.5, 56);

  /* ───────── racks con su carga ───────── */
  const NIV = [0, 1.7, 3.3, 4.9];
  const palletEn = (padre, x, y, z) => { const g = md.pallet(padre, R() > .62 ? 'film' : 'caja', .7 + R() * .28); g.position.set(x, y, z); g.rotation.y = (R() - .5) * .06; return g; };
  for (const x of RACKS_X) for (const [z0, z1] of [[10, 20], [23, 33]]) {
    const f = md.filaRack(base, x - .55, x + .55, z0, z1, NIV, 6.5);
    for (const h of f.huecos) {
      if (x === 71.05 && z0 === 10 && h.y === 3.3 && Math.abs(h.z - 15.6) < .7) { W.hueco = { x: h.x, y: h.y + .04, z: h.z }; continue; }   // el pallet que va a buscar Alejandro
      if (R() > .2) palletEn(base, h.x, h.y + (h.y ? .04 : 0), h.z);
    }
    const l = new THREE.Mesh(new THREE.PlaneGeometry(.8, .5), numero(String.fromCharCode(65 + RACKS_X.indexOf(x)) + (z0 === 10 ? '1' : '2'), .8, .5, '#ffffff', '#056CF2')); l.position.set(x, 5.9, z0 - .06); l.rotation.y = Math.PI; base.add(l);
    const l2 = l.clone(); l2.position.z = z1 + .06; l2.rotation.y = 0; base.add(l2);
  }
  W.palletPick = md.pallet(vivo, 'caja', .9); W.palletPick.position.set(W.hueco.x, W.hueco.y, W.hueco.z);
  // el rack que Alejandro golpeó hace unos días: pie doblado, cinta de peligro y restos en el piso
  { const g = grupo(70.52, 0, 10.02, 0, base), nar = std(0xD9732A, { roughness: .6 });
    const p = caja(.11, 1.5, .11, 0, 0, 0, nar, g, .01); p.rotation.z = .2; p.rotation.x = -.12; p.position.x = -.06;
    for (const y of [.5, .95]) { const c = caja(1.25, .07, .02, .55, y, -.09, std(0xF5C400), g, .005); c.rotation.z = (y - .7) * .16; }
    caja(.2, .03, .12, -.35, 0, -.3, nar, g, .005).rotation.y = .6; caja(.1, .02, .07, -.6, 0, -.1, M.gris2, g, .005);
    W.rackDanado = { x: 70.5, z: 10 }; }

  /* ───────── despacho y recepción (franja norte) ───────── */
  ANDENES.forEach((x, i) => { const n = [3, 2, 0, 3, 1][i]; for (let j = 0; j < n; j++) palletEn(base, x - .9 + (j % 2) * 1.5, 0, 3.5 + Math.floor(j / 2) * 1.5); });
  for (let i = 0; i < 7; i++) palletEn(base, 38 + (i % 4) * 1.5, 0, 1.6 + Math.floor(i / 4) * 1.6);
  for (let i = 0; i < 4; i++) m2.apilado(base, 43.6 + i * 1.3, 5.6, 'madera', 4 + ((i * 3) % 5));
  { const t = md.transpaleta(base); t.g.position.set(47, 0, 2.2); t.g.rotation.y = .5; const t2 = md.transpaleta(base); t2.g.position.set(60.2, 0, 5.4); t2.g.rotation.y = -1.2; }
  // envolvedora de pallets
  { const g = grupo(55.2, 0, 2.2, 0, base); cil(.95, .12, 0, 0, 0, M.tinta, g, 28); caja(.3, 2.6, .3, 1.25, 0, 0, std(0xE5383B, { roughness: .45 }), g, .05); caja(.5, .3, .2, 1.0, 1.3, 0, M.gris2, g, .03); palletEn(g, 0, .12, 0); }
  md.extintor(base, 52.6, .25, Math.PI / 2); md.extintor(base, 88.2, 6.6, 0); md.extintor(base, 58.3, 12, 0); md.extintor(base, 44.7, 32.7, 0);

  /* ───────── línea de ensamble (oeste) ───────── */
  W.cajasCinta = [];
  for (const z of [11.2, 16.6]) {
    md.cinta(base, 42, 55.2, z);
    for (const x of [44.2, 47.6, 51, 54.2]) md.estacion(base, x, z + 1.45);
    for (let i = 0; i < 7; i++) { const b = caja(.42, .3, .4, 42 + i * 1.9, .82, z, i % 3 ? M.caja : M.caja2, vivo, .03); b.userData.z = z; W.cajasCinta.push(b); }
    m2.lineaTunel(base, 41.4, z - 2.4, z + .2);
  }
  W.robot = m2.celdaRobot(vivo, 52.2, 13.9);
  for (let i = 0; i < 3; i++) m2.apilado(base, 56.3 - i * 1.25, 19.3, 'gris', 2 + i);

  /* ───────── zona de reunión y descanso (aquí parte la historia) ───────── */
  // tablero «Días sin accidentes» en el muro sur de la zona, mirando al norte
  { const c = document.createElement('canvas'); c.width = 1024; c.height = 560; const x = c.getContext('2d'), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const mat = new THREE.MeshStandardMaterial({ map: t, roughness: .5, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .22 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), mat); m.rotation.y = Math.PI; m.position.set(47.5, 2.5, 32.83); vivo.add(m);
    caja(4.64, 2.64, .08, 47.5, 1.18, 32.9, M.tinta, base, .03);
    W.tablero = { mat, valor: -1, pintar(v, rojo = false) {
      if (v === this.valor && rojo === this.rojo) return; this.valor = v; this.rojo = rojo;
      x.fillStyle = '#F7F8FA'; x.fillRect(0, 0, 1024, 560); x.fillStyle = rojo ? '#2B2F36' : '#1FA45A'; x.fillRect(0, 0, 1024, 132);
      x.fillStyle = '#fff'; x.font = '800 66px Poppins, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DÍAS SIN ACCIDENTES', 512, 70);
      const s = String(Math.max(0, Math.round(v))).padStart(4, '0');
      for (let i = 0; i < 4; i++) { const X = 112 + i * 206; x.fillStyle = '#1b2230'; x.beginPath(); x.roundRect(X, 166, 182, 268, 18); x.fill(); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(X, 166, 182, 134);
        x.fillStyle = rojo ? '#FF5A5F' : '#ffffff'; x.font = '800 228px Poppins, Arial'; x.fillText(s[i], X + 91, 310); }
      x.fillStyle = '#6c6c6c'; x.font = '600 38px Poppins, Arial'; x.fillText(rojo ? 'Último accidente: ayer' : 'Nuestra meta: que todos vuelvan a casa', 512, 498);
      t.needsUpdate = true; } };
    W.tablero.pintar(999); }
  // reloj de pared (08:00) y pizarra de seguridad
  { const m = new THREE.Mesh(new THREE.CircleGeometry(.42, 40), new THREE.MeshBasicMaterial({ toneMapped: false, map: tex((c, Wd) => { c.fillStyle = '#fff'; c.fillRect(0, 0, Wd, Wd); c.strokeStyle = '#1b2230'; c.lineWidth = 22; c.beginPath(); c.arc(Wd / 2, Wd / 2, Wd / 2 - 14, 0, 7); c.stroke();
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.lineWidth = 10; c.beginPath(); c.moveTo(Wd / 2 + Math.sin(a) * Wd * .36, Wd / 2 - Math.cos(a) * Wd * .36); c.lineTo(Wd / 2 + Math.sin(a) * Wd * .42, Wd / 2 - Math.cos(a) * Wd * .42); c.stroke(); }
      c.lineCap = 'round'; c.lineWidth = 20; c.beginPath(); c.moveTo(Wd / 2, Wd / 2); c.lineTo(Wd / 2 - Wd * .2, Wd / 2 - Wd * .115); c.stroke(); c.lineWidth = 12; c.beginPath(); c.moveTo(Wd / 2, Wd / 2); c.lineTo(Wd / 2, Wd / 2 - Wd * .34); c.stroke(); }, 256, 256) }));
    m.rotation.y = Math.PI; m.position.set(51.2, 3.1, 32.84); base.add(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshStandardMaterial({ roughness: .6, map: tex((c, Wd, Hh) => { c.fillStyle = '#fff'; c.fillRect(0, 0, Wd, Hh); c.fillStyle = '#056CF2'; c.fillRect(0, 0, Wd, Hh * .16); c.fillStyle = '#fff'; c.font = `800 ${Hh * .09}px Poppins, Arial`; c.fillText('CHARLA DE 5 MINUTOS', Wd * .05, Hh * .115);
      c.fillStyle = '#1b2230'; c.font = `600 ${Hh * .065}px Poppins, Arial`; ['Tema de hoy: tránsito en pasillos', 'Brigada de emergencia: Don Salva', 'Comité paritario: jueves 15:00', 'Reportar: rack A-4 golpeado'].forEach((s, i) => c.fillText('•  ' + s, Wd * .05, Hh * (.32 + i * .15))); }, 768, 524) }));
    p.rotation.y = Math.PI; p.position.set(43.3, 2.1, 32.84); base.add(p); caja(2.3, 1.6, .05, 43.3, 1.3, 32.9, M.gris2, base, .02); }
  // globos y mesa con torta (para la celebración; se muestran solo ese día)
  W.fiesta = grupo(0, 0, 0, 0, vivo);
  { const cols = [0x056CF2, 0xF5C400, 0xFFFFFF, 0x4F95F5, 0xF5C400];
    W.globos = [[44.6, 32.4], [44.95, 32.5], [50.1, 32.45], [50.45, 32.5], [50.25, 32.2]].map(([x, z], i) => { const g = grupo(x, 0, z, 0, W.fiesta); const b = esfera(.19, 0, 3.1 + (i % 3) * .28, 0, std(cols[i], { roughness: .25 }), g, 18); b.scale.y = 1.18; caja(.008, 3.1 + (i % 3) * .28 - 1.1, .008, 0, 1.1, 0, M.gris2, g, .001); return { g, b, f: i * 1.7 }; });
    const mesa = grupo(53.2, 0, 31.3, 0, W.fiesta); caja(1.5, .05, .8, 0, .76, 0, std(0xFFFFFF), mesa, .02); for (const [a, b] of [[-.68, -.33], [.68, -.33], [-.68, .33], [.68, .33]]) caja(.05, .76, .05, a, 0, b, M.gris2, mesa, .01);
    cil(.3, .16, 0, .81, 0, std(0xFFF7EC), mesa, 26); cil(.31, .03, 0, .88, 0, std(0x056CF2), mesa, 26); for (let i = 0; i < 5; i++) { const a = i * 1.257; cil(.012, .1, Math.sin(a) * .16, .97, Math.cos(a) * .16, std(0xF5C400), mesa, 6); }
    for (let i = 0; i < 6; i++) cil(.04, .1, -.55 + (i % 3) * .14, .81, -.2 + Math.floor(i / 3) * .16, std(0xE9EEF5), mesa, 10); }
  // bancas, mesas de descanso, dispensadores y plantas
  for (const [x, z] of [[43, 25.2], [46.4, 25.2]]) { const g = grupo(x, 0, z, 0, base); caja(1.8, .06, .8, 0, .74, 0, std(0xE9DCC3, { roughness: .7 }), g, .03); for (const s of [-1, 1]) { caja(1.8, .05, .3, 0, .44, s * .72, std(0xD9B98C), g, .02); for (const a of [-.8, .8]) { caja(.05, .44, .05, a, 0, s * .72, M.gris2, g, .01); caja(.05, .74, .05, a, 0, s * .3, M.gris2, g, .01); } } }
  m2.vending(base, 40.75, 27.6, Math.PI / 2, 0xE5383B, 'BEBIDAS'); m2.vending(base, 40.75, 28.6, Math.PI / 2, 0x2B2F36, 'CAFÉ');
  const planta = (x, z, s = 1) => { const g = grupo(x, 0, z, 0, base); cil(.22 * s, .4 * s, 0, 0, 0, std(0xF2F0EB), g, 14, .28 * s); for (let i = 0; i < 5; i++) { const h = esfera(.2 * s, Math.sin(i * 1.3) * .14 * s, (.62 + (i % 3) * .16) * s, Math.cos(i * 1.3) * .14 * s, std(0x9CC7A0, { roughness: .9 }), g, 10); h.scale.y = 1.3; } };
  planta(40.8, 23.5, 1.2); planta(57.2, 32.3, 1.2); planta(40.8, 32.3, 1.1);
  m2.casilleros(base, 55.6, 32.55, Math.PI / 2, 4);

  /* ───────── comedor, camarines y taller ───────── */
  for (const z of [9.2, 12.4, 15.6]) { const g = grupo(37.3, 0, z, 0, base); caja(1.9, .06, .9, 0, .74, 0, std(0xFFFFFF), g, .03); caja(.08, .74, .08, 0, 0, 0, M.gris2, g, .02); for (const s of [-1, 1]) for (const a of [-.55, .55]) cil(.17, .44, a, 0, s * .78, std(0x4F95F5, { roughness: .5 }), g, 12); }
  caja(.6, .9, 2.4, 35.5, 0, 17, std(0xEDEAE4), base, .03); for (const z of [16.3, 17.2]) caja(.45, .3, .5, 35.5, .9, z, M.tinta, base, .04);
  for (const z of [20.2, 22.6, 26.4, 28.6]) m2.casilleros(base, 35.5, z, 0, 4); caja(.4, .45, 3, 38.4, 0, 21.5, std(0xD9B98C), base, .04); caja(.4, .45, 3, 38.4, 0, 27.5, std(0xD9B98C), base, .04);
  { md.estacion(base, 37, 31); const g = md.montacargas(base, { color: std(0xD8DDE4) }); g.g.position.set(41.3, 0, 38.2); g.g.rotation.y = 2.6; g.op.g.visible = false; g.spot.visible = false; g.levantar(1.1);
    for (let i = 0; i < 3; i++) { const r = cil(.3, .2, 36.2, .0 + i * .21, 38.6, goma, base, 18); r.rotation.y = i; } for (const [x, z, c] of [[36, 33.2, 0x2F6FB0], [36.7, 33.1, 0x2F6FB0], [36.3, 37.1, 0xE5383B]]) cil(.29, .88, x, 0, z, std(c, { roughness: .4 }), base, 18);
    md.tableroElectrico(base, 35.2, 35, 0); md.estanteria(base, 44.3, 37.2, 39.6); }

  /* ───────── carga de baterías, oficina y franja sur ───────── */
  for (let i = 0; i < 5; i++) { const x = 92.5 + i * 3.4; caja(.9, 1.5, .5, x, 0, .5, std(0xE9EEF3), base, .04); caja(.5, .3, .04, x, .95, .77, luz(0x22C55E, 0x1a3a25), base, .01); caja(.06, .06, 1.6, x + .3, .4, 1.5, M.tinta, base, .02); }
  W.gruasEstac = [94.2, 101, 104.4].map((x, i) => { const g = md.montacargas(base, { color: i === 1 ? std(0xF5C400, { roughness: .45 }) : M.blanco }); g.g.position.set(x, 0, 3.1); g.g.rotation.y = -Math.PI / 2; g.op.g.visible = false; g.spot.visible = false; return g; });
  { const vid = std(0xCFE0F2, { roughness: .1, transparent: true, opacity: .32 }), marco = std(0x2B2F36, { roughness: .5 });
    for (const [w, d, x, z] of [[13, .08, 103, 13], [13, .08, 103, 19.5], [.08, 6.5, 96.5, 16.25], [.08, 6.5, 109.5, 16.25]]) { const v = caja(w, 2.5, d, x, .1, z, vid, base, .01); v.castShadow = false; caja(w + .06, .1, d + .06, x, 0, z, marco, base, .01); caja(w + .06, .1, d + .06, x, 2.6, z, marco, base, .01); }
    for (let i = 0; i < 4; i++) { const x = 98.4 + i * 3; caja(1.6, .05, .8, x, .74, 15, std(0xFFFFFF), base, .02); caja(.05, .74, .7, x - .7, 0, 15, M.gris2, base, .01); caja(.05, .74, .7, x + .7, 0, 15, M.gris2, base, .01); caja(.5, .32, .03, x, .92, 14.8, M.tinta, base, .02); cil(.2, .46, x, 0, 15.75, std(0x3A4150), base, 12);
      caja(1.6, .05, .8, x, .74, 18.2, std(0xFFFFFF), base, .02); caja(.5, .32, .03, x, .92, 18.4, M.tinta, base, .02); cil(.2, .46, x, 0, 17.45, std(0x3A4150), base, 12); } }
  md.barrera(base, 89.6, 11, 109.6, 11); md.barrera(base, 88, 10.6, 88, 36.2);
  for (let i = 0; i < 9; i++) m2.apilado(base, 60 + i * 1.3, 39.1, i % 4 === 3 ? 'negro' : 'madera', 5 + ((i * 7) % 9));
  for (const [x, c] of [[73.5, 0x2F6FB0], [74.3, 0xF5C400], [75.1, 0x1FA45A], [75.9, 0x6c6c6c]]) md.contenedor(base, x, 39.3, c);
  for (let i = 0; i < 5; i++) palletEn(base, 78 + i * 1.3, 0, 39);

  /* ───────── afuera ───────── */
  const hoja = [std(0xC6DDBB, { roughness: 1 }), std(0xB4D1A8, { roughness: 1 }), std(0xD3E5C6, { roughness: 1 })];
  const arbol = (x, z, s = 1) => { const g = grupo(x, 0, z, R() * 6, base); cil(.13 * s, 1.5 * s, 0, 0, 0, std(0xB99A7A, { roughness: .9 }), g, 8, .09 * s); esfera(1.15 * s, 0, 2.5 * s, 0, hoja[Math.floor(R() * 3)], g, 12); esfera(.8 * s, .55 * s, 3.2 * s, .2 * s, hoja[Math.floor(R() * 3)], g, 10); esfera(.7 * s, -.5 * s, 2.9 * s, -.3 * s, hoja[Math.floor(R() * 3)], g, 10); };
  for (let i = 0; i < 16; i++) arbol(132 + R() * 23, 24 + R() * 17, .8 + R() * .6);
  for (let i = 0; i < 9; i++) arbol(132 + R() * 26, -21 + R() * 18, .8 + R() * .5);
  for (let z = -60; z < 92; z += 9) { arbol(25.5 + R(), z + R() * 3, .9 + R() * .4); arbol(-1 + R() * .6, z + 4 + R() * 3, .7 + R() * .3); }
  for (let x = 32; x < 150; x += 8) arbol(x + R() * 3, -55 + R() * 5, .9 + R() * .5);
  for (let x = 98; x < 152; x += 6.5) arbol(x + R() * 3, 46 + R() * 20, .9 + R() * .6);
  for (const [x, z] of [[137, 30], [140.5, 35.5], [150, 29]]) { const g = grupo(x, 0, z, R() * 3, base); caja(1.7, .06, .5, 0, .44, 0, std(0xD9B98C), g, .02); caja(1.7, .4, .05, 0, .5, -.24, std(0xD9B98C), g, .02); for (const a of [-.7, .7]) caja(.06, .44, .46, a, 0, 0, M.tinta, g, .01); }
  const COL = [0xE9EDF2, 0x2B2F36, 0x8FA3BC, 0xB9C0C8, 0xC8553D, 0x2F6FB0, 0xF2F0EB, 0x6B7380];
  const estac = (x, z, ry) => { if (R() < .68) eq.auto(base, x, z, ry + (R() < .5 ? Math.PI : 0), COL[Math.floor(R() * COL.length)]); };
  for (let x = 43.4; x <= 84; x += 2.8) { estac(x, -42.6, Math.PI / 2); estac(x, -35.4, Math.PI / 2); }
  for (let z = -.6; z <= 21; z += 2.8) { estac(114.5, z, 0); estac(127.5, z, 0); }
  for (let x = 95.4; x <= 126; x += 2.8) { estac(x, 25.5, Math.PI / 2); estac(x, 35.5, Math.PI / 2); }
  // oficina principal: dos pisos de vidrio y hormigón claro
  { const g = grupo(145, 0, 12, 0, base), hor = std(0xF1F2F4, { roughness: .8 }), vid = std(0x9DB9D6, { roughness: .12, metalness: .3 });
    caja(16, 8.2, 20, 0, 0, 0, hor, g, .1); for (const y of [1.1, 4.9]) { caja(.12, 2.4, 17.6, -8.02, y, 0, vid, g, .02); caja(13.6, 2.4, .12, 0, y, 10.02, vid, g, .02); caja(13.6, 2.4, .12, 0, y, -10.02, vid, g, .02); }
    caja(17, .35, 21, 0, 8.2, 0, std(0xDDE1E6), g, .08); caja(5, .2, 4, -9.5, 3.3, 1, std(0xDDE1E6), g, .05); for (const z of [-.6, 2.6]) cil(.12, 3.3, -11.6, 0, z, M.gris2, g, 10);
    caja(.3, 1.5, 4.6, -8.2, 8.55, -5, std(0x056CF2, { roughness: .4 }), g, .05); caja(3, 1.2, 3, 3, 8.55, 3, M.gris2, g, .08); }
  // portería de acceso, silos, contenedores y ramplas en el patio sur
  { const g = grupo(30.5, 0, 31, 0, base); caja(2.6, 2.7, 2.6, 0, 0, 0, std(0xF1F2F4), g, .08); caja(2.9, .2, 2.9, 0, 2.7, 0, M.tinta, g, .05); caja(2.0, 1.0, .06, 0, 1.2, 1.31, std(0x9DB9D6, { roughness: .15 }), g, .02);
    const b = caja(6.5, .12, .12, 3.4, 1.05, 3.2, std(0xE5383B), base, .03); b.position.set(27.6, 1.05, 34.6); cil(.14, 1.1, 24.4, 0, 34.6, std(0xF5C400), base, 12); }
  for (const [x, z] of [[30.2, 9], [30.2, 14.4]]) { cil(2.1, 8.5, x, 1.2, z, std(0xE9EEF3, { roughness: .5, metalness: .2 }), base, 28); cil(2.1, 1.4, x, 9.7, z, std(0xDDE3EA), base, 28, .2); for (const [a, b] of [[1.5, 1.5], [-1.5, 1.5], [1.5, -1.5], [-1.5, -1.5]]) caja(.16, 1.3, .16, x + a, 0, z + b, M.tinta, base, .02); }
  { const cc = [0x2F6FB0, 0xC8553D, 0xE9EDF2, 0x2B8A66, 0xD9A441];
    for (let i = 0; i < 7; i++) { const x = 39 + (i % 4) * 6.6, z = 58 + Math.floor(i / 4) * 3.2; caja(6.1, 2.6, 2.44, x, 0, z, std(cc[i % 5], { roughness: .6 }), base, .04); if (i % 3 === 0) caja(6.1, 2.6, 2.44, x + .3, 2.6, z, std(cc[(i + 2) % 5], { roughness: .6 }), base, .04); }
    for (const x of [50, 56.5, 63, 74]) { const g = grupo(x, 0, 48.5, Math.PI / 2, base); caja(11, 2.6, 2.5, 0, 1.15, 0, std(0xEEF1F4), g, .05); caja(11, .14, 2.5, 0, 1.0, 0, M.tinta, g, .02); for (const a of [-3.6, -2.5]) for (const s of [-1.05, 1.05]) { const r = cil(.48, .3, 0, 0, 0, goma, g, 16); r.rotation.x = Math.PI / 2; r.position.set(a, .48, s); } for (const s of [-.8, .8]) caja(.1, 1, .1, 4.2, 0, s, M.tinta, g, .01); } }
  // postes de luz
  for (const [x, z] of [[40, -24], [60, -24], [80, -24], [100, -24], [122, -3], [122, 12], [108, 31], [46, 44], [70, 44], [28, 24]]) { cil(.09, 7.5, x, 0, z, M.gris2, base, 8); caja(1.3, .1, .3, x + .5, 7.5, z, M.tinta, base, .03); }
  // autos de la autopista y la calle lateral (se mueven)
  W.transito = [];
  for (let i = 0; i < 9; i++) { const pista = [-17.2, -11.5, -6][i % 3], sur = i % 3 !== 2, g = eq.auto(vivo, pista, 0, sur ? -Math.PI / 2 : Math.PI / 2, COL[(i * 3) % COL.length]); W.transito.push({ g, z: -60 + R() * 150, v: (sur ? 1 : -1) * (15 + R() * 8) }); }
  for (let i = 0; i < 2; i++) { const g = eq.auto(vivo, 16.4 + i * 4.2, 0, i ? Math.PI / 2 : -Math.PI / 2, COL[i + 4]); W.transito.push({ g, z: -30 + i * 60, v: (i ? -1 : 1) * 7 }); }

  k.fusionar(base);

  /* lo que se mueve solo, siempre: cinta, robot, autopista, globos */
  W.vida = (t, dt) => {
    for (const b of W.cajasCinta) { b.position.x += dt * .55; if (b.position.x > 55.3) b.position.x -= 13.3; }
    W.robot.base.rotation.y = Math.sin(t * .8) * 1.2; W.robot.b1.rotation.z = Math.sin(t * 1.3) * .25 - .1; W.robot.b2.rotation.z = Math.sin(t * 1.7 + 1) * .35; W.robot.baliza.emissiveIntensity = .6 + .6 * Math.sin(t * 5);
    for (const a of W.transito) { a.z += a.v * dt; if (a.z > 92) a.z -= 155; if (a.z < -63) a.z += 155; a.g.position.z = a.z; }
    for (const g of W.globos) { g.g.rotation.z = Math.sin(t * 1.1 + g.f) * .05; g.g.rotation.x = Math.cos(t * .9 + g.f) * .04; }
  };
  return W;
}
