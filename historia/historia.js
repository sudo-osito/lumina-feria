/* La historia de Don Salva (16-nov-2026) · apertura de la presentación, contada en 3D sobre la planta del plano de Max.
   Cámara de cine (perspectiva), una toma por paso de lámina, todo guionado: siempre pasa lo mismo.
   Escenas: salva → charla (999 → 1000, celebración) → vuelven → ale → rapido (corre, saca el pallet) → espalda →
   cruce (la foto, el retroceso, corte a negro, el casco en el piso) → despues (el contador vuelve a cero).
   Nada explícito: el golpe no se ve. crear(cont) → { ir(escena, paso), activo(si) } */
import { nucleo, THREE, clamp, lerp } from '../js/planta/nucleo.js';
import { modelos } from '../js/planta/modelos.js';
import { modelos2 } from '../js/planta/modelos2.js';
import { equipos } from '../js/planta5/equipos.js';
import { construir } from './mundo.js?v=1';
import { gente } from './gente.js?v=1';

const PI = Math.PI, H = PI / 2;
const suave = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const sale = (x) => 1 - Math.pow(1 - clamp(x), 3);
const entra = (x) => Math.pow(clamp(x), 2.4);
const tr = (t, a, b) => clamp((t - a) / (b - a));
const rumbo = (dx, dz) => Math.atan2(-dz, dx);                     // frente +x → hacia (dx, dz)
const lerpAng = (a, b, u) => a + (((b - a + PI * 3) % (PI * 2)) - PI) * u;

function ruta(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return { pts, L, largo: L.at(-1) }; }
function en(r, d, R = 1.3) {   // punto y rumbo a la distancia d, con el giro suavizado en las esquinas
  d = clamp(d, 0, r.largo); let i = 1; while (i < r.L.length - 1 && r.L[i] < d) i++;
  const a = r.pts[i - 1], b = r.pts[i], u = (d - r.L[i - 1]) / (r.L[i] - r.L[i - 1] || 1); let ry = rumbo(b[0] - a[0], b[1] - a[1]);
  if (i < r.pts.length - 1 && r.L[i] - d < R) { const c = r.pts[i + 1]; ry = lerpAng(ry, rumbo(c[0] - b[0], c[1] - b[1]), .5 * (1 - (r.L[i] - d) / R)); }
  else if (i > 1 && d - r.L[i - 1] < R) { const z = r.pts[i - 2]; ry = lerpAng(rumbo(a[0] - z[0], a[1] - z[1]), ry, .5 + .5 * (d - r.L[i - 1]) / R); }
  return { x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, ry };
}
const pon = (o, x, z, ry) => { o.position.x = x; o.position.z = z; if (ry !== undefined) o.rotation.y = ry; };
// cámara por claves: [t, px,py,pz, mx,my,mz, fov, 'c'?]  ('c' = corte seco al llegar a esa clave)
function claves(K) { return (t) => { let i = 0; while (i < K.length - 1 && K[i + 1][0] <= t) i++; const a = K[i], b = K[i + 1]; if (!b || b[8] === 'c') return { p: a.slice(1, 4), m: a.slice(4, 7), f: a[7], id: i };
  const u = suave(tr(t, a[0], b[0])); return { p: [1, 2, 3].map((j) => lerp(a[j], b[j], u)), m: [4, 5, 6].map((j) => lerp(a[j], b[j], u)), f: lerp(a[7], b[7], u), id: i }; }; }

const AMB = {
  dia:   { sol: 0xFFF1DC, isol: 2.15, hemi: 1.18, fondo: 0xEEF1F5, filtro: 'saturate(1.1) contrast(1.04)', vin: .16 },
  tenso: { sol: 0xFFE9CF, isol: 2.0, hemi: 1.0, fondo: 0xE6E9EE, filtro: 'saturate(.95) contrast(1.1)', vin: .42 },
  frio:  { sol: 0xDCE6F5, isol: 1.15, hemi: .82, fondo: 0xD9DEE5, filtro: 'saturate(.34) contrast(1.08) brightness(.9)', vin: .62 },
};

export async function crear(cont) {
  const capa = document.createElement('div'); capa.className = 'historia3d__capa'; cont.appendChild(capa);
  const k = nucleo(capa, {}); const md = modelos(k), m2 = modelos2(k, md), eq = equipos(k, md);
  const W = construir(k, md, m2, eq), G = gente(k), P = G.P, vivo = W.vivo;
  const { caja, cil, esfera, grupo, std } = k;
  const cam = new THREE.PerspectiveCamera(36, 16 / 9, .25, 700);
  const hemi = k.escena.children.find((o) => o.isHemisphereLight), DIR = new THREE.Vector3(-.62, .78, .5).normalize();
  k.escena.background = new THREE.Color(AMB.dia.fondo); k.escena.fog = new THREE.Fog(AMB.dia.fondo, 140, 520);
  const fx = { negro: 0, flash: 0, vel: 0 };
  const el = (c) => { const d = document.createElement('i'); d.className = c; cont.appendChild(d); return d; };
  const eVin = el('h-vin'), eVel = el('h-vel'), eFlash = el('h-flash'), eNegro = el('h-negro');

  /* ───────── reparto ───────── */
  const salva = G.persona({ padre: vivo, chaleco: 0xF2741F, casco: 0xF6F7F8, bigote: 0xAEB5BE, panza: 1.14, radio: true, insignia: 0xE5383B, manga: 0x47648F, piel: 0xE8BE9C });
  const fono = G.telefono(salva);
  const ale = G.persona({ padre: vivo, chaleco: 0xF5C400, casco: 0xF5C400, audifonos: true, manga: 0x2B2F36, pantalon: 0x39424F, talla: .97 });
  const grua = md.montacargas(vivo, { color: std(0xF5C400, { roughness: .42 }) }); grua.op.g.visible = false; grua.spot.visible = false; grua.cams.visible = false;
  const aleS = G.persona({ padre: grua.cuerpo, chaleco: 0xF5C400, casco: 0xF5C400, audifonos: true, manga: 0x2B2F36, pantalon: 0x39424F, talla: .97 }); aleS.g.position.set(-.38, .3, 0);
  const VEST = [0xF5C400, 0xF5C400, 0xC7E03A, 0xF5C400, 0xF2741F, 0xC7E03A, 0xF5C400, 0xF5C400, 0xC7E03A, 0xF5C400], CASCO = [0xF6F7F8, 0x056CF2, 0xF5C400, 0xF6F7F8, 0xF6F7F8, 0x056CF2, 0xF5C400, 0xF6F7F8, 0x1FA45A, 0xF5C400],
    PIEL = [0xF1CBAA, 0xD9A982, 0xF1CBAA, 0xC68F6B, 0xF1CBAA, 0xE8BE9C, 0xD9A982, 0xF1CBAA, 0xE8BE9C, 0xC68F6B];
  const turno = VEST.map((v, i) => G.persona({ padre: vivo, chaleco: v, casco: CASCO[i], piel: PIEL[i], talla: .94 + (i * 37 % 10) / 100, panza: i % 4 === 1 ? 1.1 : 1, manga: i % 3 ? 0x5B7FB0 : 0x6B7380 }));
  const fondo = [0, 1].map((i) => { const g = md.montacargas(vivo, { color: i ? std(0xE9EDF2) : std(0xF5C400, { roughness: .45 }) }); g.spot.visible = false; g.cams.visible = false; if (i === 0) g.carga.visible = true; g.levantar(.25); return g; });
  // utilería: el casco y el teléfono en el piso, y el recuerdo del día siguiente
  const casco = grupo(0, 0, 0, 0, vivo); { const cs = std(0xF6F7F8, { roughness: .35 }); const d = new THREE.Mesh(new THREE.SphereGeometry(.152, 22, 11, 0, PI * 2, 0, H), cs); d.castShadow = true; d.position.y = .0; casco.add(d); cil(.176, .02, 0, 0, .025, cs, casco, 22); caja(.04, .03, .2, 0, .135, 0, cs, casco, .012); }
  const fonoPiso = grupo(0, 0, 0, 0, vivo); caja(.075, .012, .15, 0, 0, 0, std(0x15171B, { roughness: .3 }), fonoPiso, .005); const pantPiso = std(0x1b2230, { emissive: 0xCFE2FF, emissiveIntensity: 1.6 }); caja(.062, .004, .13, 0, .012, 0, pantPiso, fonoPiso, .003);
  const recuerdo = grupo(47.5, 0, 31.3, 0, vivo); { caja(.7, .8, .7, 0, 0, 0, std(0xFFFFFF), recuerdo, .03); const c2 = casco.clone(); c2.position.set(0, .82, 0); c2.rotation.y = PI; recuerdo.add(c2);
    cil(.035, .16, .25, .8, .2, std(0xFFF7EC), recuerdo, 10); const llama = std(0xFFE2A0, { emissive: 0xFFB13B, emissiveIntensity: 2.2 }); const ll = esfera(.022, .25, .985, .2, llama, recuerdo, 8); ll.scale.y = 1.8; recuerdo.userData.llama = llama;
    for (let i = 0; i < 7; i++) { const a = i * .9; esfera(.04, -.2 + Math.sin(a) * .09, .86 + (i % 2) * .03, -.18 + Math.cos(a) * .09, std(0xFFFFFF, { roughness: .8 }), recuerdo, 8); } cil(.012, .2, -.2, .66, -.18, std(0x7FB48A), recuerdo, 6); }
  // papel picado
  const NC = 340, conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(.075, .13), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), NC), cf = [], mt = new THREE.Object3D();
  { const cols = [0x056CF2, 0xF5C400, 0xFFFFFF, 0x4F95F5, 0x1FA45A, 0xEC6D27]; for (let i = 0; i < NC; i++) { conf.setColorAt(i, new THREE.Color(cols[i % cols.length])); cf.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: Math.random() * 6, w: 3 + Math.random() * 9, on: false }); } conf.frustumCulled = false; conf.visible = false; conf.userData.vivo = true; k.escena.add(conf); }
  function lanzar() { conf.visible = true; cf.forEach((c, i) => { const lado = i % 2 ? 1 : -1; c.p.set(47.5 + lado * 2.5 + (Math.random() - .5) * .6, 3.6 + Math.random() * .5, 32.3); c.v.set(-lado * (1.2 + Math.random() * 3.2), 3 + Math.random() * 4.5, -(1.2 + Math.random() * 4.5)); c.on = true; }); }
  function confeti(dt, t) { if (!conf.visible) return; for (let i = 0; i < NC; i++) { const c = cf[i]; if (c.on) { c.v.y -= 6.2 * dt; c.v.multiplyScalar(1 - 1.5 * dt); c.p.addScaledVector(c.v, dt); c.p.x += Math.sin(t * 2 + c.r) * dt * .5; if (c.p.y < .02) { c.p.y = .02; c.on = false; } } mt.position.copy(c.p); mt.rotation.set(c.on ? t * c.w + c.r : H, c.r, c.on ? t * c.w * .7 : 0); mt.updateMatrix(); conf.setMatrixAt(i, mt.matrix); } conf.instanceMatrix.needsUpdate = true; }

  /* ───────── lugares y rutas ───────── */
  const S0 = [47.5, 31.3];
  const LUGAR = turno.map((_, i) => { const a = (-66 + i * 14.6) * PI / 180, r = i % 2 ? 4.6 : 3.4; return [S0[0] + r * Math.sin(a), S0[1] - r * Math.cos(a)]; });
  // antes de la charla: en grupos, conversando, sin tapar a Don Salva
  const ANTES = [[43.6, 27.2, .4], [44.7, 27.9, 2.6], [43.9, 28.6, -1.2], [52.6, 30.6, 2.2], [53.3, 29.7, -2.4], [42.2, 30.9, .2], [43.2, 31.4, 2.8], [54.6, 27.4, 1.9], [55.3, 28.3, -2.2], [51.9, 29.5, .3]];
  const PUESTO = [[47.6, 18.8, H], [51, 13.4, H], [54.2, 18.8, H], [65, 27, 0], [68.5, 5.2, PI], [77.9, 5, 0], [54.4, 3.9, H], [99, 12, 0], [73.6, 13.4, 0], [93.4, 2.4, H]];
  const N57 = [[57, 26.5], [57, 9.5]];
  const VUELTA = [
    [[50, 22.6], [47.6, 18.8]], [[52, 22], [51.6, 20.6], [51, 13.4]], [[54.2, 22], [54.2, 18.8]], [[57, 26.5], [57, 21.5], [65, 21.5], [65, 27]],
    [...N57, [66, 9.5], [68.5, 5.2]], [...N57, [75.6, 9.5], [77.9, 5]], [[57, 26.5], [57, 7.5], [54.4, 3.9]], [...N57, [88.5, 9.5], [88.5, 12], [99, 12]],
    [...N57, [73, 9.5], [73.6, 13.4]], [...N57, [88.5, 9.5], [88.5, 4], [93.4, 2.4]],
  ].map((r, i) => ruta([LUGAR[i], ...r]));
  const R_SALVA = ruta([S0, [57, 27], [57, 9.5], [66, 9.5]]), R_ALE = ruta([[55.2, 25], [57, 21.5], [84.6, 21.5], [86.2, 27.4]]);
  const R_RAPIDO = ruta([[87, 29], [86.2, 21.5], [69, 21.5], [69, 15.4]]), R_VUELTA = ruta([[61, 7.4], [85.2, 7.4], [85.2, 35], [61, 35], [61, 7.4]]);
  const R_CRUCE = ruta([[65.2, 9.5], [69.55, 9.5]]);
  const MIRA_RACK = rumbo(70.7 - 69.55, 10.25 - 9.5);

  /* ───────── estado base de cada toma ───────── */
  function base() {
    fx.negro = 0; fx.flash = 0; fx.vel = 0; est.amb = 'dia';
    turno.forEach((p, i) => { P.quieto(p); p.g.visible = true; pon(p.g, ...PUESTO[i]); });
    P.quieto(salva); salva.g.visible = true; pon(salva.g, S0[0], S0[1], H); fono.g.visible = false; fono.pant.emissiveIntensity = 0;
    P.quieto(ale); ale.g.visible = false; P.quieto(aleS); aleS.g.visible = true;
    grua.g.visible = true; pon(grua.g, 87, 29, H); grua.g.position.y = 0; grua.levantar(.12); grua.carga.visible = false; grua.balMat.emissiveIntensity = 0; grua.carga.rotation.set(0, 0, 0);
    W.palletPick.visible = true; W.fiesta.visible = false; recuerdo.visible = false; casco.visible = false; fonoPiso.visible = false; conf.visible = false;
    W.tablero.pintar(999); W.tablero.mat.emissiveIntensity = .22;
    est.fondo = 'ronda'; est.chase = null;
  }
  const reunidos = (flojo = 0) => turno.forEach((p, i) => pon(p.g, LUGAR[i][0], LUGAR[i][1], rumbo(S0[0] - LUGAR[i][0], S0[1] - LUGAR[i][1]) + flojo * Math.sin(i * 2.7) * .9));
  const trabajar = (t) => turno.forEach((p, i) => { P.respirar(p, t); p.bi.rotation.x = -.55 + Math.sin(t * 1.4 + i) * .2; p.bd.rotation.x = -.6 + Math.cos(t * 1.7 + i) * .22; });
  function ronda(t) {   // dos grúas dando la vuelta; o estacionadas lejos cuando la historia las necesita fuera
    fondo.forEach((g, i) => {
      if (est.fondo === 'ronda') { const q = en(R_VUELTA, (t * 2.3 + i * 51 + 8) % R_VUELTA.largo, 2); pon(g.g, q.x, q.z, q.ry); g.balMat.emissiveIntensity = .5 + .5 * Math.sin(t * 6 + i); }
      else { i ? pon(g.g, 101.5, 7.6, 0) : pon(g.g, 79.5, 35, PI); g.balMat.emissiveIntensity = 0; }
    });
  }
  const baliza = (t, on = true) => (grua.balMat.emissiveIntensity = on ? (Math.sin(t * 9) > 0 ? 2.2 : .15) : 0);

  /* ───────── guion: una toma por paso ───────── */
  const E = {};
  E.salva = [{   // «Este es Don Salva»: del predio completo a su retrato
    ini() { ANTES.forEach(([x, z, ry], i) => pon(turno[i].g, x, z, ry)); W.fiesta.visible = true; pon(salva.g, 47.9, 29.6, rumbo(50.5 - 47.9, 26.4 - 29.6)); pon(grua.g, 87, 29, H); ale.g.visible = true; aleS.g.visible = false; pon(ale.g, 55.2, 25, .3); },
    cam: claves([[0, 152, 60, 108, 78, 0, 14, 36], [3.4, 104, 33, 68, 64, 0, 20, 36], [7.2, 53, 3.6, 23, 48.2, 1.3, 29.8, 33], [9.6, 50.5, 1.62, 26.4, 48.5, 1.08, 30.05, 27], [40, 49.9, 1.6, 26.2, 48.5, 1.08, 30.05, 26]]),
    corte: true,
    tick(t) { turno.forEach((p, i) => (i % 3 ? P.respirar(p, t) : P.hablar(p, t + i))); P.celular(ale, t); P.respirar(salva, t); if (t > 8 && t < 11.2) P.saludar(salva, t); else { salva.bd.rotation.z *= .9; } salva.cab.rotation.y = 0; },
  }];
  E.charla = [{   // 08:00 · la charla de seguridad
    ini() { reunidos(); W.fiesta.visible = true; ale.g.visible = true; aleS.g.visible = false; pon(ale.g, 55.2, 25, .3); },
    cam: claves([[0, 52.4, 2.5, 23.6, 47.4, 1.45, 31.2, 34], [26, 43.4, 2.3, 24.6, 47.6, 1.45, 31.2, 34]]),
    tick(t) { P.hablar(salva, t); turno.forEach((p, i) => { P.respirar(p, t); p.cab.rotation.x = Math.max(0, Math.sin(t * 1.3 + i * 2)) * .12; }); P.celular(ale, t); },
  }, {            // 999 → 1000: celebran
    ini() { E.charla[0].ini(); est.lanzo = false; },
    cam: claves([[0, 48.7, 2.15, 27.5, 47.5, 2.5, 32.8, 30], [2.4, 48.5, 2.2, 27.9, 47.5, 2.5, 32.8, 28], [6, 53.4, 3.5, 24, 47.3, 1.35, 30.4, 38], [30, 44.2, 3.2, 23.6, 47.3, 1.35, 30.4, 38]]),
    tick(t) {
      const ya = t > 1.1; W.tablero.pintar(ya ? 1000 : 999); W.tablero.mat.emissiveIntensity = .22 + (ya ? .9 * Math.exp(-(t - 1.1) * 1.4) : 0);
      if (ya && !est.lanzo) { est.lanzo = true; lanzar(); }
      if (!ya) { P.hablar(salva, t); turno.forEach((p) => P.respirar(p, t)); }
      else { (t < 7 ? P.celebrar : P.aplaudir)(salva, t); turno.forEach((p, i) => ((t + i * .13) % 5 < 3.2 && t < 12 ? P.celebrar : P.aplaudir)(p, t)); }
      P.celular(ale, t); if (ya && t < 3.4) { ale.cab.rotation.x = .1; ale.cab.rotation.y = 1.5; }
    },
  }];
  E.vuelven = [{  // cada uno vuelve a su puesto, por senderos que casi no se ven
    ini() { ale.g.visible = true; aleS.g.visible = false; },
    cam: claves([[0, 50.5, 5.6, 32, 57, .9, 23.5, 42], [16, 51, 4.8, 23.5, 57.3, .9, 14, 42], [40, 51.4, 4.6, 21, 57.4, .9, 11.5, 42]]),
    tick(t) { caminan(t, 5); },
  }, {
    ini() { ale.g.visible = false; turno.forEach((p, i) => pon(p.g, ...PUESTO[i])); est.fondo = 'paso'; },
    cam: claves([[0, 69.9, .42, 8.35, 61, 1.0, 9.75, 27], [9, 69.4, .5, 8.3, 61, 1.0, 9.75, 27]]),
    tick(t) {
      trabajar(t); const d = Math.min(R_SALVA.largo, 27.6 + t * 1.3), q = en(R_SALVA, d); pon(salva.g, q.x, q.z, q.ry); d < R_SALVA.largo ? P.andar(salva, 1, t) : (P.quieto(salva), P.respirar(salva, t));
      // una grúa le pasa por el lado, por la calle que comparte borde con el sendero
      const x = 52 + t * 4.4; pon(fondo[0].g, Math.min(x, 100), 7.7, 0); fondo[0].balMat.emissiveIntensity = .5 + .5 * Math.sin(t * 6); pon(fondo[1].g, 101.5, 35, PI);
    },
  }];
  function caminan(t, ventaja) {
    turno.forEach((p, i) => { const r = VUELTA[i], d = ventaja * (.55 + (i % 4) * .15) + t * 1.35; if (d < r.largo) { const q = en(r, d, .7); pon(p.g, q.x, q.z, q.ry); P.andar(p, 1, t); } else { pon(p.g, ...PUESTO[i]); P.quieto(p); P.respirar(p, t); p.bi.rotation.x = p.bd.rotation.x = -.55; } });
    const ds = ventaja + t * 1.3, qs = en(R_SALVA, ds); pon(salva.g, qs.x, qs.z, qs.ry); ds < R_SALVA.largo ? P.andar(salva, 1, t) : P.quieto(salva);
    const da = ventaja * 1.5 + t * 1.5, qa = en(R_ALE, da); pon(ale.g, qa.x, qa.z, qa.ry); if (da < R_ALE.largo) { P.andar(ale, 1, t); ale.bd.rotation.x = -1.05; ale.cab.rotation.x = .4; } else { ale.g.visible = false; aleS.g.visible = true; }
  }
  E.ale = [{      // «Este es Alejandro»
    ini() { pon(salva.g, 66, 9.5, 0); },
    cam: claves([[0, 80, 6, 20, 87, 1.2, 29, 34], [3.6, 84.3, 1.72, 27.7, 87.2, 1.32, 29.75, 26], [40, 84.6, 1.7, 27.5, 87.2, 1.32, 29.75, 25]]),
    tick(t) { trabajar(t); P.respirar(salva, t); P.sentado(aleS); aleS.bd.rotation.x = -.95; aleS.bd.rotation.z = .12; aleS.bi.rotation.x = -.35; aleS.cab.rotation.x = .06 + Math.sin(t * 5.2) * .07; aleS.cab.rotation.y = .75 * suave(tr(t, 3, 4.4)) + Math.sin(t * .6) * .06; aleS.cab.rotation.z = Math.sin(t * 2.6) * .06; },
  }];
  E.rapido = [{   // sin cinturón, a toda velocidad por el pasillo central
    ini() { pon(salva.g, 66, 9.5, 0); est.fondo = 'fuera'; est.chase = null; },
    cam(t) {
      const q = est.q, ax = Math.cos(q.ry), az = -Math.sin(q.ry), meta = { p: [q.x - ax * 6.2 + az * 1.2, 2.5, q.z - az * 6.2 - ax * 1.2], m: [q.x + ax * 3, 1.3, q.z + az * 3] };
      if (!est.chase) est.chase = meta; else for (const kk of ['p', 'm']) for (let j = 0; j < 3; j++) est.chase[kk][j] += (meta[kk][j] - est.chase[kk][j]) * (kk === 'p' ? .055 : .12);
      return { p: [...est.chase.p], m: [...est.chase.m], f: 46 - 8 * tr(t, 6.6, 9) };
    },
    tick(t) {
      trabajar(t); P.respirar(salva, t);
      const u = tr(t, .5, 7.2), d = R_RAPIDO.largo * (u < .12 ? entra(u / .12) * .06 : .06 + .94 * sale((u - .12) / .88) ), q = en(R_RAPIDO, d, 2.4); est.q = q;
      const v = u > 0 && u < 1 ? 1 : 0; pon(grua.g, q.x, q.z, q.ry); grua.g.position.y = v * Math.abs(Math.sin(t * 31)) * .012; fx.vel = tr(t, 1, 1.8) * (1 - tr(t, 5.4, 6.6));
      P.manejar(aleS, t, 0); aleS.cab.rotation.x = Math.sin(t * 5.2) * .09; baliza(t, false);
    },
  }, {            // hoy quiere irse temprano: saca el pallet a la rápida
    ini() { pon(salva.g, 66, 9.5, 0); est.fondo = 'fuera'; },
    cam: claves([[0, 68.05, 3.3, 20.2, 69.9, 2.7, 15.3, 42], [6.4, 68.1, 2.5, 19.6, 69.8, 2.1, 15.3, 40], [30, 68.1, 2.4, 19.4, 69.8, 2.0, 15.3, 40]]),
    tick(t) { trabajar(t); P.respirar(salva, t); sacar(t); },
  }];
  function sacar(t) {   // gira al rack, sube, toma, baja de golpe y gira hacia el sur
    const g = grua; let ry = H, x = 68.95, m = .12, con = false;
    ry = lerp(H, 0, suave(tr(t, .2, 1.1))); m = lerp(.12, 3.22, suave(tr(t, 1.0, 2.3))); x = lerp(68.95, 69.5, suave(tr(t, 2.3, 2.9)));
    if (t > 2.9) { con = true; m += .1 * suave(tr(t, 2.9, 3.1)); x = lerp(69.5, 68.95, suave(tr(t, 3.1, 3.8))); }
    if (t > 3.8) { const u = tr(t, 3.8, 4.5); m = lerp(3.32, 1.15, entra(u)) + (u >= 1 ? Math.exp(-(t - 4.5) * 5) * Math.sin((t - 4.5) * 22) * .07 : 0); }
    if (t > 4.5) ry = lerp(0, -H, suave(tr(t, 4.6, 5.8)));
    pon(g.g, x, 15.4, ry); g.levantar(m); g.carga.visible = con; W.palletPick.visible = !con; g.carga.rotation.z = con ? Math.exp(-Math.max(0, t - 4.5) * 3) * Math.sin(t * 20) * .03 * (t > 3.1 ? 1 : 0) : 0;
    P.manejar(aleS, t, 0); baliza(t, t > .2);
  }
  const cargado = (z) => { pon(grua.g, 69, z, -H); grua.levantar(1.15); grua.carga.visible = true; W.palletPick.visible = false; };
  E.espalda = [{  // la carga no lo deja ver: retrocede
    ini() { pon(salva.g, 66, 9.5, 0); est.fondo = 'fuera'; },
    corte: true,
    cam(t) {
      if (t < 4.6) { const z = grua.g.position.z; return { p: [69 + Math.sin(t * .8) * .02, 1.74, z - .52], m: [69, 1.5, z + 3], f: 50 }; }
      const u = suave(tr(t, 4.6, 14)); return { p: [70.05 - u * .25, 1.05, 7.9], m: [69, 1.35, 13.2], f: 30 - u * 3 };
    },
    tick(t) {
      trabajar(t); P.respirar(salva, t); const z = 15.4 - 1.9 * suave(tr(t, 1.6, 9)); cargado(z); grua.g.position.y = Math.abs(Math.sin(t * 27)) * .006;
      P.manejar(aleS, t, lerp(0, .9, suave(tr(t, 2.4, 3.4)))); baliza(t);
    },
  }];
  function salvaFoto(t) {   // llega al paso de cebra, mira el rack golpeado y saca la foto
    const d = Math.min(R_CRUCE.largo, t * 1.3), q = en(R_CRUCE, d);
    if (d < R_CRUCE.largo) { pon(salva.g, q.x, q.z, q.ry); P.andar(salva, 1, t); return; }
    const u = suave(tr(t, 3.4, 4.3)); pon(salva.g, 69.55, 9.5, lerpAng(0, MIRA_RACK, u)); P.quieto(salva); fono.g.visible = t > 4.3; P.foto(salva, suave(tr(t, 4.3, 5.1)));
    const f = t - 6; fono.pant.emissiveIntensity = t > 5 ? 1.2 : 0; if (f > 0 && f < .12) fx.flash = .85; else fx.flash *= .8;
  }
  E.cruce = [{    // Don Salva en el paso de cebra, con la grúa atrás
    ini() { est.fondo = 'fuera'; cargado(13.5); },
    cam: claves([[0, 71.6, 1.75, 5.7, 68.6, 1.3, 9.6, 31], [7, 71.25, 1.7, 6.1, 69.4, 1.38, 9.6, 26], [40, 71.1, 1.68, 6.2, 69.4, 1.38, 9.6, 25]]),
    tick(t) { trabajar(t); salvaFoto(t); cargado(13.5 - .5 * suave(tr(t, 5, 16))); P.manejar(aleS, t, .9); baliza(t); },
  }, {            // el retroceso · corte a negro · lo que queda
    ini() { est.fondo = 'fuera'; est.amb = 'tenso'; },
    corte: true,
    cam(t) {
      if (t < 3.5) { const u = entra(tr(t, 0, 3.5)); return { p: [69.3, 15.5 - u * 5.5, 7.6 + u * 1.2], m: [69.3, 0, 10.6], f: 30 }; }
      const u = suave(tr(t, 5.2, 22)); return { p: [72.6 - u * .5, .42 + u * .05, 6.8 + u * .3], m: [69.85, .82, 9.3], f: 31 };
    },
    tick(t) {
      trabajar(t);
      if (t < 3.5) {   // cámara lenta al acercarse
        pon(salva.g, 69.55, 9.5, MIRA_RACK); P.quieto(salva); fono.g.visible = true; P.foto(salva, 1); fono.pant.emissiveIntensity = 1.2; salva.cab.rotation.y = -1.1 * suave(tr(t, 2.9, 3.4));
        cargado(13.0 - 2.15 * Math.pow(tr(t, 0, 3.5), 1.6)); P.manejar(aleS, t, .9); baliza(t); est.amb = 'tenso'; fx.negro = 0; return;
      }
      // después del corte
      est.amb = 'frio'; fx.negro = t < 5.6 ? 1 : 1 - suave(tr(t, 5.6, 8.6));
      salva.g.visible = false; cargado(11.7); grua.carga.rotation.z = .05; baliza(t);
      aleS.g.visible = false; ale.g.visible = true; pon(ale.g, 68.5, 10.1, rumbo(1.8, -1.35)); P.quieto(ale); P.cabeza(ale, t);
      casco.visible = true; const a = Math.exp(-Math.max(0, t - 5.6) * .45); casco.position.set(70.3, .012, 8.75); casco.rotation.set(.16 + Math.sin(t * 3.1) * .3 * a, .9, -.2 + Math.cos(t * 3.1) * .22 * a);
      fonoPiso.visible = true; fonoPiso.position.set(70.95, .004, 8.35); fonoPiso.rotation.y = .7; pantPiso.emissiveIntensity = 1.2 + .5 * Math.sin(t * 2);
    },
  }];
  E.despues = [{  // al día siguiente
    ini() { est.amb = 'frio'; est.fondo = 'fuera'; reunidos(); salva.g.visible = false; recuerdo.visible = true; W.tablero.pintar(1000); grua.g.visible = false; },
    cam: claves([[0, 53.2, 3.3, 23.2, 47.5, 1.0, 31.2, 34], [30, 49.6, 2.9, 24.6, 47.5, 1.0, 31.2, 31]]),
    tick(t) { turno.forEach((p) => P.triste(p, t)); recuerdo.userData.llama.emissiveIntensity = 1.8 + Math.sin(t * 11) * .5 + Math.sin(t * 5.3) * .4; },
  }, {            // el contador vuelve a cero
    ini() { E.despues[0].ini(); },
    cam: claves([[0, 48.6, 2.2, 27.3, 47.5, 2.5, 32.8, 30], [12, 48.1, 2.3, 28.5, 47.5, 2.5, 32.8, 27]]),
    tick(t) { E.despues[0].tick(t); const u = tr(t, 1.3, 3.9); if (u >= 1) W.tablero.pintar(0, true); else W.tablero.pintar(Math.round(1000 * (1 - suave(u)))); W.tablero.mat.emissiveIntensity = .22 + (u >= 1 ? .5 * Math.exp(-(t - 3.9) * 1.2) : 0); },
  }];

  /* ───────── motor ───────── */
  const est = { esc: 'salva', paso: 0, clip: E.salva[0], t: 0, amb: 'dia', de: null, activo: false, fondo: 'ronda', q: { x: 87, z: 29, ry: H } };
  const ahora = { p: [152, 60, 108], m: [78, 0, 14], f: 36 }, luzAmb = { ...AMB.dia, sol: new THREE.Color(AMB.dia.sol), fondo: new THREE.Color(AMB.dia.fondo) }, cTmp = new THREE.Color();
  let filtro = '';
  function entrar(nombre, paso) {
    const lista = E[nombre]; if (!lista) return; const clip = lista[Math.min(paso, lista.length - 1)];
    if (clip === est.clip && est.t > 0) return;
    est.de = clip.corte ? null : { p: [...ahora.p], m: [...ahora.m], f: ahora.f }; est.esc = nombre; est.paso = paso; est.clip = clip; est.t = 0; base(); clip.ini();
    if (clip.corte && est.activo) { fx.negro = 1; est.aclara = true; } else est.aclara = false;
  }
  let tPrev = 0, reloj = 0;
  function cuadro(ms) {
    if (!est.activo) return; requestAnimationFrame(cuadro);
    const dt = Math.min(.05, (ms - tPrev) / 1000 || 0); tPrev = ms; est.t += dt; reloj += dt; const t = est.t, clip = est.clip;
    ronda(reloj); clip.tick(t, dt); W.vida(reloj, dt); confeti(dt, reloj);
    if (est.aclara && t < 1.2) fx.negro = 1 - suave(tr(t, .05, 1.1));
    // cámara: la toma, con la entrada mezclada desde la toma anterior y un pulso de mano muy leve
    const c = typeof clip.cam === 'function' ? clip.cam(t) : clip.cam, u = est.de ? suave(tr(t, 0, 1.5)) : 1;
    for (let j = 0; j < 3; j++) { ahora.p[j] = est.de ? lerp(est.de.p[j], c.p[j], u) : c.p[j]; ahora.m[j] = est.de ? lerp(est.de.m[j], c.m[j], u) : c.m[j]; } ahora.f = est.de ? lerp(est.de.f, c.f, u) : c.f;
    const dist = Math.hypot(ahora.p[0] - ahora.m[0], ahora.p[1] - ahora.m[1], ahora.p[2] - ahora.m[2]), pul = Math.min(.05, dist * .0022);
    cam.position.set(ahora.p[0] + Math.sin(reloj * .53) * pul, ahora.p[1] + Math.sin(reloj * .71 + 1) * pul * .7, ahora.p[2] + Math.cos(reloj * .47) * pul); cam.lookAt(ahora.m[0], ahora.m[1], ahora.m[2]);
    if (cam.fov !== ahora.f) { cam.fov = ahora.f; cam.updateProjectionMatrix(); }
    // luz y ambiente
    const A = AMB[est.amb], kk = .05; luzAmb.isol += (A.isol - luzAmb.isol) * kk; luzAmb.hemi += (A.hemi - luzAmb.hemi) * kk; luzAmb.vin += (A.vin - luzAmb.vin) * kk; luzAmb.sol.lerp(cTmp.set(A.sol), kk); luzAmb.fondo.lerp(cTmp.set(A.fondo), kk);
    k.sol.intensity = luzAmb.isol; k.sol.color.copy(luzAmb.sol); if (hemi) hemi.intensity = luzAmb.hemi; k.escena.background.copy(luzAmb.fondo); k.escena.fog.color.copy(luzAmb.fondo);
    const r = clamp(dist * .95, 9, 85); k.sol.target.position.set(ahora.m[0], 0, ahora.m[2]); k.sol.position.set(ahora.m[0] + DIR.x * 90, DIR.y * 90, ahora.m[2] + DIR.z * 90);
    Object.assign(k.sol.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 220 }); k.sol.shadow.camera.updateProjectionMatrix();
    if (A.filtro !== filtro) { filtro = A.filtro; k.lienzo.style.filter = filtro; }
    eVin.style.opacity = luzAmb.vin.toFixed(3); eNegro.style.opacity = fx.negro.toFixed(3); eFlash.style.opacity = fx.flash.toFixed(3); eVel.style.opacity = fx.vel.toFixed(3);
    k.render.render(k.escena, cam);
  }
  k.medir(); base(); est.clip.ini(); est.t = 0;
  // un cuadro de calentamiento para compilar materiales y sombras sin tirón al entrar
  cam.position.set(152, 60, 108); cam.lookAt(78, 0, 14); try { k.render.compile(k.escena, cam); } catch (e) {}
  return {
    ir(nombre, paso = 0) { entrar(nombre, paso); },
    activo(si) { if (si === est.activo) return; est.activo = si; if (si) { k.medir(); cam.aspect = k.W / k.H; cam.updateProjectionMatrix(); tPrev = performance.now(); requestAnimationFrame(cuadro); } },
    reiniciar() { est.t = 0; base(); est.clip.ini(); },
    est, W, k, cam,
  };
}
