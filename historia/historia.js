/* La historia de Don Salva, v2 (17-nov-2026) · apertura de la presentación, contada en 3D sobre la planta del plano de Max.
   Cámara de cine (perspectiva), una toma por paso de lámina, todo guionado: siempre pasa lo mismo.
   v2 (feedback de Max): se parte con el predio completo hasta el horizonte y se ESPERA a Bastián; techo y murallas
   (casa de muñecas: el techo se va y las murallas bajan cuando la cámara mira desde el aire, y vuelven cuando entra);
   cada persona camina por los senderos hasta su puesto real; Alejandro toma su grúa en la carga de baterías; después
   del atropello, negro y «Al día siguiente».
   Escenas: salva (predio → Don Salva) · charla (999 → 1.000) · vuelven · ale · rapido (pasillo → pallet) · espalda ·
   cruce (la foto → el retroceso → lo que queda) · despues (negro → la charla → el contador en cero).
   crear(cont) → { ir(escena, paso), activo(si) } */
import { nucleo, THREE, clamp, lerp } from '../js/planta/nucleo.js';
import { modelos } from '../js/planta/modelos.js';
import { modelos2 } from '../js/planta/modelos2.js';
import { equipos } from '../js/planta5/equipos.js';
import { construir, SOL, ALERO } from './mundo.js?v=14';
import { gente } from './gente.js?v=6';

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
const distA = (r, x, z) => { let mejor = 0, dm = 1e9; for (let d = 0; d <= r.largo; d += .1) { const q = en(r, d); const dd = Math.hypot(q.x - x, q.z - z); if (dd < dm) { dm = dd; mejor = d; } } return mejor; };
const pon = (o, x, z, ry) => { o.position.x = x; o.position.z = z; if (ry !== undefined) o.rotation.y = ry; };
// cámara por claves: [t, px,py,pz, mx,my,mz, fov]
function claves(K) { return (t) => { let i = 0; while (i < K.length - 1 && K[i + 1][0] <= t) i++; const a = K[i], b = K[i + 1]; if (!b) return { p: a.slice(1, 4), m: a.slice(4, 7), f: a[7] };
  const u = suave(tr(t, a[0], b[0])); return { p: [1, 2, 3].map((j) => lerp(a[j], b[j], u)), m: [4, 5, 6].map((j) => lerp(a[j], b[j], u)), f: lerp(a[7], b[7], u) }; }; }

const AMB = {
  dia:   { isol: 2.3, hemi: 1.05, sol: 0xFFE6C4, niebla: 0xE6ECEF, filtro: 'saturate(1.08) contrast(1.04)', vin: .14 },
  tenso: { isol: 2.1, hemi: .95, sol: 0xFFE2BE, niebla: 0xE6E9EC, filtro: 'saturate(.92) contrast(1.1)', vin: .42 },
  frio:  { isol: 1.2, hemi: .8, sol: 0xDCE6F5, niebla: 0xD9DEE5, filtro: 'saturate(.32) contrast(1.08) brightness(.9)', vin: .62 },
};
const DENTRO = (x, z) => (x > 35.2 && x < 89.8 && z > .2 && z < 39.8) || (x > 89.8 && x < 109.8 && z > .2 && z < 19.8);

export async function crear(cont) {
  const capa = document.createElement('div'); capa.className = 'historia3d__capa'; cont.appendChild(capa);
  const k = nucleo(capa, {}); const md = modelos(k), m2 = modelos2(k, md), eq = equipos(k, md);
  k.render.toneMappingExposure = 1.05;
  const W = construir(k, md, m2, eq), G = gente(k), P = G.P, vivo = W.vivo;
  k.render.localClippingEnabled = true; const CLIP = new THREE.Plane(new THREE.Vector3(0, 0, 1), 100); W.mejora.pintura.material.clippingPlanes = [CLIP];
  const { caja, cil, esfera, grupo, std } = k;
  const cam = new THREE.PerspectiveCamera(36, 16 / 9, .3, 30000);
  const hemi = k.escena.children.find((o) => o.isHemisphereLight); if (hemi) { hemi.color.set(0xDDE9F7); hemi.groundColor.set(0xD8CFC2); }
  k.escena.background = new THREE.Color(AMB.dia.niebla); k.escena.fog = new THREE.Fog(AMB.dia.niebla, 320, 5200);
  const fx = { negro: 0, flash: 0, vel: 0, rew: 0 };
  const el = (c) => { const d = document.createElement('i'); d.className = c; cont.appendChild(d); return d; };
  const eVin = el('h-vin'), eVel = el('h-vel'), eFlash = el('h-flash'), eNegro = el('h-negro'), eRew = el('h-rew');
  eRew.innerHTML = '<b>◀◀</b><span>Rebobinando</span>';
  const lu = document.createElement('canvas'); lu.className = 'h-lumina'; lu.width = 1920; lu.height = 1080; cont.appendChild(lu); const lc = lu.getContext('2d');

  /* ───────── reparto ───────── */
  const salva = G.persona({ padre: vivo, chaleco: 0xF2741F, casco: 0xF6F7F8, bigote: 0xAEB5BE, panza: 1.14, radio: true, insignia: 0xE5383B, manga: 0x47648F, piel: 0xE8BE9C });
  const fono = G.telefono(salva);
  const ale = G.persona({ padre: vivo, chaleco: 0xF5C400, casco: 0xF5C400, audifonos: true, manga: 0x2B2F36, pantalon: 0x39424F, talla: .97 });
  const fonoAle = G.telefono(ale); fonoAle.g.visible = true; fonoAle.pant.emissiveIntensity = 1;
  const grua = md.montacargas(vivo, { color: std(0xF5C400, { roughness: .42 }) }); grua.op.g.visible = false; grua.spot.visible = false; grua.cams.visible = false;
  const aleS = G.persona({ padre: grua.cuerpo, chaleco: 0xF5C400, casco: 0xF5C400, audifonos: true, manga: 0x2B2F36, pantalon: 0x39424F, talla: .97 }); aleS.g.position.set(-.38, .3, 0);
  const VEST = [0xF5C400, 0xF5C400, 0xC7E03A, 0xF5C400, 0xF2741F, 0xC7E03A, 0xF5C400, 0xF5C400, 0xC7E03A, 0xF5C400], CASCO = [0xF6F7F8, 0x056CF2, 0xF5C400, 0xF6F7F8, 0xF6F7F8, 0x056CF2, 0xF5C400, 0xF6F7F8, 0x1FA45A, 0xF5C400],
    PIEL = [0xF1CBAA, 0xD9A982, 0xF1CBAA, 0xC68F6B, 0xF1CBAA, 0xE8BE9C, 0xD9A982, 0xF1CBAA, 0xE8BE9C, 0xC68F6B];
  const turno = VEST.map((v, i) => G.persona({ padre: vivo, chaleco: v, casco: CASCO[i], piel: PIEL[i], talla: .94 + (i * 37 % 10) / 100, panza: i % 4 === 1 ? 1.1 : 1, manga: i % 3 ? 0x5B7FB0 : 0x6B7380 }));
  const jefe = G.persona({ padre: vivo, chaleco: 0x2F6FB0, casco: 0xF6F7F8, manga: 0x1B2230, pantalon: 0x2B2F36, piel: 0xD9A982, talla: 1.02 }); const fonoJ = G.telefono(jefe);
  const fondo = [0, 1].map((i) => { const g = md.montacargas(vivo, { color: i ? std(0xE9EDF2) : std(0xF5C400, { roughness: .45 }) }); g.spot.visible = false; g.cams.visible = false; g.carga.visible = true; g.levantar(.25); return g; });
  // utilería: el casco y el teléfono en el piso, y el recuerdo del día siguiente
  const casco = grupo(0, 0, 0, 0, vivo); { const cs = std(0xF6F7F8, { roughness: .35 }); const d = new THREE.Mesh(new THREE.SphereGeometry(.152, 22, 11, 0, PI * 2, 0, H), cs); d.castShadow = true; casco.add(d); cil(.176, .02, 0, 0, .025, cs, casco, 22); caja(.04, .03, .2, 0, .135, 0, cs, casco, .012); }
  const fonoPiso = grupo(0, 0, 0, 0, vivo); caja(.075, .012, .15, 0, 0, 0, std(0x15171B, { roughness: .3 }), fonoPiso, .005); const pantPiso = std(0x1b2230, { emissive: 0xCFE2FF, emissiveIntensity: 1.6 }); caja(.062, .004, .13, 0, .012, 0, pantPiso, fonoPiso, .003);
  const recuerdo = grupo(47.5, 0, 31.4, 0, vivo); { caja(.7, .8, .7, 0, 0, 0, std(0xFFFFFF), recuerdo, .03); const c2 = casco.clone(); c2.position.set(0, .82, 0); c2.rotation.y = PI; recuerdo.add(c2);
    cil(.035, .16, .25, .8, .2, std(0xFFF7EC), recuerdo, 10); const llama = std(0xFFE2A0, { emissive: 0xFFB13B, emissiveIntensity: 2.2 }); const ll = esfera(.022, .25, .985, .2, llama, recuerdo, 8); ll.scale.y = 1.8; recuerdo.userData.llama = llama;
    for (let i = 0; i < 7; i++) { const a = i * .9; esfera(.04, -.2 + Math.sin(a) * .09, .86 + (i % 2) * .03, -.18 + Math.cos(a) * .09, std(0xFFFFFF, { roughness: .8 }), recuerdo, 8); } cil(.012, .2, -.2, .66, -.18, std(0x7FB48A), recuerdo, 6); }
  // papel picado
  const NC = 380, conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(.075, .13), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, toneMapped: false }), NC), cf = [], mt = new THREE.Object3D();
  { const cols = [0x056CF2, 0xF5C400, 0xFFFFFF, 0x4F95F5, 0x1FA45A, 0xEC6D27]; for (let i = 0; i < NC; i++) { conf.setColorAt(i, new THREE.Color(cols[i % cols.length])); cf.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: Math.random() * 6, w: 3 + Math.random() * 9, on: false }); } conf.frustumCulled = false; conf.visible = false; conf.userData.vivo = true; k.escena.add(conf); }
  function lanzar() { conf.visible = true; cf.forEach((c, i) => { const lado = i % 2 ? 1 : -1; c.p.set(47.5 + lado * 2.5 + (Math.random() - .5) * .6, 3.6 + Math.random() * .5, 32.3); c.v.set(-lado * (1.2 + Math.random() * 3.2), 3 + Math.random() * 4.5, -(1.2 + Math.random() * 4.5)); c.on = true; }); }
  function confeti(dt, t) { if (!conf.visible) return; for (let i = 0; i < NC; i++) { const c = cf[i]; if (c.on) { c.v.y -= 6.2 * dt; c.v.multiplyScalar(1 - 1.5 * dt); c.p.addScaledVector(c.v, dt); c.p.x += Math.sin(t * 2 + c.r) * dt * .5; if (c.p.y < .02) { c.p.y = .02; c.on = false; } } mt.position.copy(c.p); mt.rotation.set(c.on ? t * c.w + c.r : H, c.r, c.on ? t * c.w * .7 : 0); mt.updateMatrix(); conf.setMatrixAt(i, mt.matrix); } conf.instanceMatrix.needsUpdate = true; }

  /* ───────── lugares y caminos (todos por los senderos del plano) ───────── */
  const S0 = [47.5, 31.4];
  const LUGAR = turno.map((_, i) => { const a = (-66 + i * 14.6) * PI / 180, r = i % 2 ? 4.6 : 3.4; return [S0[0] + r * Math.sin(a), S0[1] - r * Math.cos(a)]; });
  // antes de la charla: conversan en grupos, dejando libre el pasillo por donde entra la cámara (x 45,5–49)
  const GRUPOS = [[[51.6, 27.2], [52.7, 27.8], [51.9, 28.7]], [[53.3, 30.8], [54.2, 30.1]], [[52.4, 24.4], [54.5, 24.2]], [[44.3, 28.4], [44.9, 27.5], [45.7, 31.9]]];
  const ANTES = GRUPOS.flatMap((g) => { const cx = g.reduce((a, q) => a + q[0], 0) / g.length, cz = g.reduce((a, q) => a + q[1], 0) / g.length; return g.map(([x, z]) => [x, z, rumbo(cx - x, cz - z)]); });
  // puestos de trabajo (x, z, rumbo)
  const PUESTO = [[47.6, 18.85, H], [51, 13.45, H], [54.2, 18.85, H], [65, 27, 0], [68.5, 5.6, H], [77.9, 5.6, H], [54.4, 3.9, H], [95.9, 12.1, 0], [73, 13.4, 0], [94.2, 6.2, H]];
  const SALIDA = (i) => [[i % 2 ? 49.6 : 49.8, 30.0], [56.95 - (i % 3) * .2, 30.0]];   // de la ronda al sendero (x = 57)
  const NORTE = (z) => [[56.95, z]];
  const SENDERO_9 = [[56.95, 9.55]];
  const RUTAS = [
    [...NORTE(19.55), [47.6, 19.55], [47.6, 18.85]],
    [...NORTE(14.0), [51, 14.0], [51, 13.45]],
    [...NORTE(19.55), [54.2, 19.55], [54.2, 18.85]],
    [...NORTE(21.5), [65, 21.5], [65, 27]],
    [...SENDERO_9, [68.5, 9.55], [68.5, 5.6]],
    [...SENDERO_9, [77.9, 9.55], [77.9, 5.6]],
    [...NORTE(7.5), [54.4, 7.5], [54.4, 3.9]],
    [...SENDERO_9, [88.5, 9.55], [88.5, 12.05], [95.9, 12.05]],
    [...SENDERO_9, [73, 9.55], [73, 13.4]],
    [...SENDERO_9, [88.5, 9.55], [88.5, 6.2], [94.2, 6.2]],
  ];
  const VUELTA = RUTAS.map((r, i) => ruta([LUGAR[i], ...SALIDA(i), ...r]));
  const R_SALVA = ruta([S0, [49.8, 30.6], [56.85, 30.6], [56.85, 9.45], [69.55, 9.45]]), D_64 = distA(R_SALVA, 64, 9.45), D_65 = distA(R_SALVA, 65.2, 9.45);
  const ALE0 = [56.1, 27.7];
  const R_ALE = ruta([ALE0, [56.95, 27.7], [56.95, 9.6], [88.5, 9.6], [88.5, 4.9], [94.9, 4.9]]);
  const R_RAPIDO = ruta([[95.9, 3.2], [95.9, 7.9], [69, 7.9], [69, 15.4]]), R_VUELTA = ruta([[61, 7.4], [85.2, 7.4], [85.2, 35], [61, 35], [61, 7.4]]);
  const R_CRUCE = ruta([[65.2, 9.45], [69.55, 9.45]]);
  const MIRA_RACK = rumbo(70.7 - 69.55, 10.25 - 9.45);

  /* ───────── estado base de cada toma ───────── */
  function base() {
    fx.negro = 0; fx.flash = 0; fx.vel = 0; est.amb = 'dia';
    turno.forEach((p, i) => { P.quieto(p); p.g.visible = true; pon(p.g, ...PUESTO[i]); });
    P.quieto(salva); salva.g.visible = true; pon(salva.g, S0[0], S0[1], H); fono.g.visible = false; fono.pant.emissiveIntensity = 0;
    P.quieto(ale); ale.g.visible = false; P.quieto(aleS); aleS.g.visible = true; fonoAle.g.visible = true; P.quieto(jefe); jefe.g.visible = false; fonoJ.g.visible = false; fonoJ.pant.emissiveIntensity = 0;
    grua.g.visible = true; pon(grua.g, 95.9, 3.2, -H); grua.g.position.y = 0; grua.levantar(.12); grua.carga.visible = false; grua.balMat.emissiveIntensity = 0; grua.carga.rotation.set(0, 0, 0);
    W.palletPick.visible = true; W.fiesta.visible = false; recuerdo.visible = false; casco.visible = false; fonoPiso.visible = false; conf.visible = false;
    W.tablero.pintar(999); W.tablero.mat.emissiveIntensity = .22;
    est.fondo = 'ronda'; est.chase = null;
    // el rebobinado: todo lo de Neisstech parte oculto
    const Mj = W.mejora; Mj.pintura.visible = false; Mj.pintura.material.opacity = 0; Mj.trafico.visible = false; Mj.camara.visible = false; Mj.pk = 1;
    Mj.puertas.forEach((q) => { q.abrir(1); q.rojo.emissiveIntensity = .05; q.verde.emissiveIntensity = 2.4; }); est.lumina = null; fx.rew = 0;
    Mj.visual.visible = false; for (const p of Mj.piezasV) p.o.scale.setScalar(1); W.rackDanadoG.visible = true; Mj.cunas.forEach((c) => { c.poner(1); c.luz(true); }); CLIP.constant = 100;
    Mj.tren.g.visible = false; Mj.conoM.opacity = 0; Mj.sg.piv.rotation.z = 0; for (const p of Mj.piezas) p.o.scale.y = 1; for (const k of ['cebra1', 'tri1', 'tri1b', 'cebra2', 'area1', 'area2']) Mj[k].pintar(0, 0); Mj.kq = 1; (Mj.puertasKb || []).forEach((q) => q.abrir(1)); fondo[0].levantar(.12); fondo[0].carga.visible = false;
  }
  const enRonda = (flojo = 0) => turno.forEach((p, i) => pon(p.g, LUGAR[i][0], LUGAR[i][1], rumbo(S0[0] - LUGAR[i][0], S0[1] - LUGAR[i][1]) + flojo * Math.sin(i * 2.7) * .9));
  const trabajar = (t) => turno.forEach((p, i) => { P.respirar(p, t); p.bi.rotation.x = -.55 + Math.sin(t * 1.4 + i) * .2; p.bd.rotation.x = -.6 + Math.cos(t * 1.7 + i) * .22; });
  function ronda(t) {   // dos grúas haciendo su ronda por las calles; o estacionadas lejos cuando la historia las necesita fuera
    fondo.forEach((g, i) => {
      if (est.fondo === 'ronda') { const q = en(R_VUELTA, (t * 2.3 + i * 51 + 8) % R_VUELTA.largo, 2); pon(g.g, q.x, q.z, q.ry); g.balMat.emissiveIntensity = .5 + .5 * Math.sin(t * 6 + i); }
      else if (est.fondo === 'fuera') { i ? pon(g.g, 102.7, 15.2, H) : pon(g.g, 79.5, 35, PI); g.balMat.emissiveIntensity = 0; }
    });
  }
  const baliza = (t, on = true) => (grua.balMat.emissiveIntensity = on ? (Math.sin(t * 9) > 0 ? 2.2 : .15) : 0);
  function aleCelular(t) { P.celular(ale, t); fonoAle.g.visible = true; }

  /* ───────── guion: una toma por paso ───────── */
  const E = {};
  const CP = [72, 16];   // centro del predio
  E.salva = [{   // el predio completo hasta el horizonte · se queda aquí hasta que Bastián avance
    casa: 1,
    ini() { ANTES.forEach(([x, z, ry], i) => pon(turno[i].g, x, z, ry)); W.fiesta.visible = true; pon(salva.g, 48.2, 29.7, rumbo(47.1 - 48.2, 26.1 - 29.7)); ale.g.visible = true; aleS.g.visible = false; pon(ale.g, ...ALE0, rumbo(-1, .4)); },
    cam(t) {
      const a = (158 + 7 * Math.sin(t * .035)) * PI / 180, r = 165 - 12 * suave(tr(t, 0, 16)), y = 50 - 4 * suave(tr(t, 0, 16));
      const p = [CP[0] + Math.cos(a) * r, y, CP[1] + Math.sin(a) * r], dx = CP[0] - p[0], dz = CP[1] - p[2], dh = Math.hypot(dx, dz);
      return { p, m: [p[0] + dx / dh * 420, y - Math.tan(10.5 * PI / 180) * 420, p[2] + dz / dh * 420], f: 36 };
    },
    tick(t) { turno.forEach((p, i) => (i % 3 ? P.respirar(p, t) : P.hablar(p, t + i))); aleCelular(t); P.respirar(salva, t); },
  }, {            // bajamos: el techo se va, las murallas bajan y lo encontramos a él
    casa: 0,
    ini() { E.salva[0].ini(); },
    trans: 'mezcla',
    cam: claves([[0, -40, 52, 66, 60, 0, 20, 36], [3.0, 18, 40, -2, 48, 0, 26, 38], [5.6, 44, 10, 17.5, 47.8, .6, 28.6, 40], [7.8, 46.7, 2.6, 24.4, 48.6, 1.3, 29.5, 32], [9.6, 46.75, 1.66, 25.2, 49.0, 1.35, 29.4, 31], [40, 46.95, 1.64, 25.6, 49.0, 1.35, 29.4, 30]]),
    tick(t) { turno.forEach((p, i) => (i % 3 ? P.respirar(p, t) : P.hablar(p, t + i))); aleCelular(t); P.respirar(salva, t); if (t > 8.4 && t < 11.6) P.saludar(salva, t); else { salva.bd.rotation.z *= .9; salva.bd.rotation.x *= .9; } salva.cab.rotation.y = 0; },
  }];
  E.charla = [{   // 08:00 · la charla de seguridad
    ini() { enRonda(); W.fiesta.visible = true; ale.g.visible = true; aleS.g.visible = false; pon(ale.g, ...ALE0, rumbo(-1, .4)); },
    cam: claves([[0, 46.2, 3.0, 24.5, 47.5, 1.5, 31.4, 34], [26, 48.8, 2.85, 25.1, 47.5, 1.5, 31.4, 32]]),
    tick(t) { P.hablar(salva, t); turno.forEach((p, i) => { P.respirar(p, t); p.cab.rotation.x = Math.max(0, Math.sin(t * 1.3 + i * 2)) * .12; if (i === 4 && t % 7 > 4.5) P.saludar(p, t); }); aleCelular(t); },
  }, {            // 999 → 1.000: celebran
    trans: 'mezcla',
    ini() { E.charla[0].ini(); est.lanzo = false; },
    cam: claves([[0, 48.7, 2.15, 27.5, 47.5, 2.5, 32.8, 30], [2.4, 48.5, 2.2, 27.9, 47.5, 2.5, 32.8, 28], [6, 49.6, 3.5, 24.2, 47.3, 1.35, 30.4, 38], [30, 44.6, 3.2, 24.4, 47.3, 1.35, 30.4, 38]]),
    tick(t) {
      const ya = t > 1.1; W.tablero.pintar(ya ? 1000 : 999); W.tablero.mat.emissiveIntensity = .22 + (ya ? .9 * Math.exp(-(t - 1.1) * 1.4) : 0);
      if (ya && !est.lanzo) { est.lanzo = true; lanzar(); }
      if (!ya) { P.hablar(salva, t); turno.forEach((p) => P.respirar(p, t)); }
      else { (t < 7 ? P.celebrar : P.aplaudir)(salva, t); turno.forEach((p, i) => { const f = (t + i * .37) % 6; (t < 3.5 || f < 2.2 ? P.celebrar : f < 4 ? P.aplaudir : P.chocar)(p, t, i % 2 ? 1 : -1); }); }
      aleCelular(t); if (ya && t < 3.4) { ale.cab.rotation.x = .1; ale.cab.rotation.y = 1.3; }
    },
  }];
  E.vuelven = [{  // cada uno vuelve a su puesto, en fila por el sendero
    casa: 0,
    ini() { ale.g.visible = true; aleS.g.visible = false; est.sigue = null; },
    cam: claves([[0, 54.0, 1.7, 21.4, 55.6, 1.05, 29.0, 44], [7, 54.1, 1.7, 21.3, 56.9, 1.1, 25.5, 44], [15, 54.2, 1.72, 21.2, 57.4, 1.1, 15.5, 44], [40, 54.2, 1.72, 21.2, 57.4, 1.1, 15.0, 44]]),   // desde la calle, a la altura de los ojos: salen de la sala y pasan por el sendero
    tick(t) { caminan(t, 2); },
  }, {            // Don Salva por el sendero que casi no se ve; una grúa le pasa al lado
    ini() { ale.g.visible = false; turno.forEach((p, i) => pon(p.g, ...PUESTO[i])); est.fondo = 'paso'; },
    cam: claves([[0, 70.1, .5, 8.95, 61, 1.0, 9.45, 27], [9, 69.8, .55, 8.95, 61, 1.0, 9.45, 27]]),
    tick(t) {
      trabajar(t); const d = Math.min(D_64, D_64 - 4.6 + t * 1.15), q = en(R_SALVA, d); pon(salva.g, q.x, q.z, q.ry);
      if (d < D_64) P.andar(salva, 1, t); else { P.quieto(salva); P.respirar(salva, t); salva.cab.rotation.y = .5 * Math.sin((t - 4) * .7); }
      const x = 50 + t * 4.4; pon(fondo[0].g, Math.min(x, 100), 7.1, 0); fondo[0].balMat.emissiveIntensity = .5 + .5 * Math.sin(t * 6); pon(fondo[1].g, 102.7, 15.2, H);
    },
  }];
  function caminan(t, ventaja) {
    turno.forEach((p, i) => { const r = VUELTA[i], d = Math.max(0, (t + ventaja) * 1.3 - i * 1.15); if (d <= 0) { p.caminando = false; pon(p.g, LUGAR[i][0], LUGAR[i][1], rumbo(S0[0] - LUGAR[i][0], S0[1] - LUGAR[i][1])); P.quieto(p); P.respirar(p, t); return; }
      p.caminando = d < r.largo; if (d < r.largo) { const q = en(r, d, .7); pon(p.g, q.x, q.z, q.ry); P.andar(p, 1, t); } else { pon(p.g, ...PUESTO[i]); P.quieto(p); P.respirar(p, t); p.bi.rotation.x = p.bd.rotation.x = -.55; } });
    const ds = Math.max(0, (t + ventaja) * 1.25 - 12.5), qs = en(R_SALVA, ds); pon(salva.g, qs.x, qs.z, qs.ry); ds > 0 && ds < R_SALVA.largo ? P.andar(salva, 1, t) : P.respirar(salva, t);
    const da = Math.max(0, (t + ventaja) * 1.45 - 3), qa = en(R_ALE, da, .7); pon(ale.g, qa.x, qa.z, qa.ry);
    if (da > 0 && da < R_ALE.largo) { P.andar(ale, 1, t); ale.bd.rotation.x = -1.05; ale.cab.rotation.x = .4; } else if (da >= R_ALE.largo) { ale.g.visible = false; aleS.g.visible = true; } else aleCelular(t);
  }
  E.ale = [{      // «Este es Alejandro»: en su grúa, en la carga de baterías
    ini() { pon(salva.g, 65.2, 9.45, 0); est.fondo = 'ronda'; },
    cam: claves([[0, 89.5, 6.5, 9.5, 95.9, 1.2, 3.2, 36], [4, 93.75, 1.5, 3.55, 95.9, 1.32, 2.85, 27], [40, 93.85, 1.48, 3.45, 95.9, 1.32, 2.85, 26]]),
    tick(t) { trabajar(t); P.respirar(salva, t); P.sentado(aleS); aleS.bd.rotation.x = -.95; aleS.bd.rotation.z = .12; aleS.bi.rotation.x = -.35; aleS.cab.rotation.x = .06 + Math.sin(t * 5.2) * .07; aleS.cab.rotation.y = -.7 * suave(tr(t, 3, 4.4)) + Math.sin(t * .6) * .06; },
  }];
  E.rapido = [{   // sin cinturón, a toda velocidad por el pasillo central; entra al pasillo del rack
    ini() { est.fondo = 'fuera'; est.chase = null; est.q = { x: 95.9, z: 3.2, ry: -H }; },
    cam(t) {
      const q = est.q, giro = q.z > 8.6;
      const meta = q.x > 91.5 && !giro ? { p: [88.6, 1.9, 6.2], m: [94.6, 1.0, 6.6] } : giro ? { p: [69.3, 2.25, 5.5], m: [69, 1.0, q.z + 2.5] } : { p: [q.x - 6.6, 1.95, 6.1], m: [q.x + .2, 1.05, 7.9] };
      if (!est.chase) est.chase = meta; else for (const kk of ['p', 'm']) for (let j = 0; j < 3; j++) est.chase[kk][j] += (meta[kk][j] - est.chase[kk][j]) * (kk === 'p' ? .16 : .2);
      return { p: [...est.chase.p], m: [...est.chase.m], f: 44 };
    },
    tick(t) {
      trabajar(t);
      const ds = Math.min(D_65, D_65 - 3.2 + t * .6), qs = en(R_SALVA, ds); pon(salva.g, qs.x, qs.z, qs.ry); ds < D_65 ? P.andar(salva, .7, t) : (P.quieto(salva), P.respirar(salva, t));
      if (t > 3.6 && t < 6) salva.cab.rotation.y = -1.0 * suave(tr(t, 3.6, 4.2)) * (1 - suave(tr(t, 5.2, 6)));
      const u = tr(t, .5, 7.2), d = R_RAPIDO.largo * (u < .12 ? entra(u / .12) * .06 : .06 + .94 * sale((u - .12) / .88)), q = en(R_RAPIDO, d, 2.4); est.q = q;
      const v = u > 0 && u < 1 ? 1 : 0; pon(grua.g, q.x, q.z, q.ry); grua.g.position.y = v * Math.abs(Math.sin(t * 31)) * .012; fx.vel = tr(t, 1.6, 2.4) * (1 - tr(t, 5.4, 6.6));
      P.manejar(aleS, t, 0); aleS.cab.rotation.x = Math.sin(t * 5.2) * .09; baliza(t, false);
    },
  }, {            // hoy quiere irse temprano: saca el pallet a la rápida
    ini() { pon(salva.g, 65.2, 9.45, 0); est.fondo = 'fuera'; },
    cam: claves([[0, 68.1, 3.0, 21.8, 70.4, 2.4, 15.2, 42], [6.4, 68.2, 2.7, 21.4, 70.0, 1.9, 15.4, 42], [30, 68.2, 2.6, 21.2, 70.0, 1.8, 15.4, 42]]),
    tick(t) { trabajar(t); P.respirar(salva, t); salva.cab.rotation.y = -.15; sacar(t); },
  }];
  function sacar(t) {   // gira hacia el rack, sube, toma, baja de golpe y gira hacia el sur para salir de espalda
    const g = grua; let ry = lerp(-H, 0, suave(tr(t, .2, 1.1))), m = lerp(.12, 3.22, suave(tr(t, 1.0, 2.3))), x = lerp(68.95, 69.5, suave(tr(t, 2.3, 2.9))), con = false;
    if (t > 2.9) { con = true; m += .1 * suave(tr(t, 2.9, 3.1)); x = lerp(69.5, 68.5, suave(tr(t, 3.1, 3.8))); }   // sale entero del rack antes de bajar
    if (t > 3.8) { const u = tr(t, 3.8, 4.5); m = lerp(3.32, 1.15, entra(u)) + (u >= 1 ? Math.exp(-(t - 4.5) * 5) * Math.sin((t - 4.5) * 22) * .07 : 0); }
    if (t > 4.5) { ry = lerp(0, -H, suave(tr(t, 4.6, 5.8))); x = lerp(68.5, 68.95, suave(tr(t, 4.6, 5.8))); }
    pon(g.g, x, 15.4, ry); g.levantar(m); g.carga.visible = con; W.palletPick.visible = !con; g.carga.rotation.z = con ? Math.exp(-Math.max(0, t - 4.5) * 3) * Math.sin(t * 20) * .03 * (t > 3.1 ? 1 : 0) : 0;
    P.manejar(aleS, t, 0); baliza(t, t > .2);
  }
  const cargado = (z) => { pon(grua.g, 69, z, -H); grua.levantar(1.15); grua.carga.visible = true; W.palletPick.visible = false; };
  E.espalda = [{  // la carga no lo deja ver: retrocede
    ini() { pon(salva.g, 65.2, 9.45, 0); est.fondo = 'fuera'; },
    corte: true,
    cam(t) {
      if (t < 4.6) { const z = grua.g.position.z; return { p: [69 + Math.sin(t * .8) * .02, 1.74, z - .52], m: [69, 1.5, z + 3], f: 50 }; }
      const u = suave(tr(t, 4.6, 14)); return { p: [70.05 - u * .25, 1.05, 7.9], m: [69, 1.35, 13.2], f: 30 - u * 3 };
    },
    tick(t) {
      trabajar(t); P.respirar(salva, t); salva.cab.rotation.y = -.15; const z = 15.4 - 1.9 * suave(tr(t, 1.6, 9)); cargado(z); grua.g.position.y = Math.abs(Math.sin(t * 27)) * .006;
      P.manejar(aleS, t, lerp(0, .9, suave(tr(t, 2.4, 3.4)))); baliza(t);
    },
  }];
  function salvaFoto(t) {   // llega al paso de cebra, mira el rack golpeado y saca la foto
    const d = Math.min(R_CRUCE.largo, t * 1.3), q = en(R_CRUCE, d);
    if (d < R_CRUCE.largo) { pon(salva.g, q.x, q.z, q.ry); P.andar(salva, 1, t); return; }
    const u = suave(tr(t, 3.4, 4.3)); pon(salva.g, 69.55, 9.45, lerpAng(0, MIRA_RACK, u)); P.quieto(salva); fono.g.visible = t > 4.3; P.foto(salva, suave(tr(t, 4.3, 5.1)));
    const f = t - 6; fono.pant.emissiveIntensity = t > 5 ? 1.2 : 0; if (f > 0 && f < .12) fx.flash = .85; else fx.flash *= .8;
  }
  E.cruce = [{    // Don Salva en el paso de cebra, con la grúa atrás
    ini() { est.fondo = 'fuera'; cargado(13.5); grua.g.visible = false; },   // la grúa aparece recién cuando retrocede (toma siguiente)
    cam: claves([[0, 71.6, 1.75, 5.7, 68.6, 1.3, 9.6, 31], [7, 71.25, 1.7, 6.1, 69.4, 1.38, 9.6, 26], [40, 71.1, 1.68, 6.2, 69.4, 1.38, 9.6, 25]]),
    tick(t) { trabajar(t); salvaFoto(t); cargado(13.5 - .5 * suave(tr(t, 5, 16))); P.manejar(aleS, t, .9); baliza(t); },
  }, {            // el retroceso (desde arriba, lento) · corte a negro · lo que queda
    ini() { est.fondo = 'fuera'; est.amb = 'tenso'; },
    corte: true, casa: 0,
    cam(t) {
      if (t < 3.5) { const u = entra(tr(t, 0, 3.5)); return { p: [69.3, 24 - u * 8, 7.6 + u * 1.2], m: [69.3, 0, 10.6], f: 30 }; }
      const u = suave(tr(t, 5.2, 22)); return { p: [72.5 - u * .5, .4 + u * .05, 6.9 + u * .3], m: [70.15, .55, 8.95], f: 31 };
    },
    tick(t) {
      trabajar(t);
      if (t < 3.5) {
        pon(salva.g, 69.55, 9.45, MIRA_RACK); P.quieto(salva); fono.g.visible = true; P.foto(salva, 1); fono.pant.emissiveIntensity = 1.2; salva.cab.rotation.y = -1.1 * suave(tr(t, 2.9, 3.4));
        cargado(13.0 - 2.15 * Math.pow(tr(t, 0, 3.5), 1.6)); P.manejar(aleS, t, .9); baliza(t); est.amb = 'tenso'; fx.negro = 0; return;
      }
      est.amb = 'frio'; fx.negro = 1; return;   // negro: «¿Qué creen que pasó?» (la lámina pone la pregunta). No se muestra el desenlace.
      salva.g.visible = false; cargado(11.7); grua.carga.rotation.z = .05; baliza(t);
      aleS.g.visible = false; ale.g.visible = true; fonoAle.g.visible = false; pon(ale.g, 68.5, 10.1, rumbo(1.8, -1.35)); P.quieto(ale); P.cabeza(ale, t);
      casco.visible = true; const a = Math.exp(-Math.max(0, t - 5.6) * .45); casco.position.set(70.3, .012, 8.75); casco.rotation.set(.16 + Math.sin(t * 3.1) * .3 * a, .9, -.2 + Math.cos(t * 3.1) * .22 * a);
      fonoPiso.visible = true; fonoPiso.position.set(70.95, .004, 8.35); fonoPiso.rotation.y = .7; pantPiso.emissiveIntensity = 1.2 + .5 * Math.sin(t * 2);
    },
  }];
  E.despues = [{  // negro: «Al día siguiente»
    trans: 'mezcla',
    ini() { est.amb = 'frio'; est.fondo = 'fuera'; enRonda(); salva.g.visible = false; recuerdo.visible = true; W.tablero.pintar(1000); grua.g.visible = false; },
    cam: claves([[0, 44.5, 2.4, 26.2, 48.2, 1.05, 31.4, 34]]),
    tick(t) { fx.negro = Math.max(fx.negro, suave(tr(t, 0, .9))); turno.forEach((p) => P.triste(p, t)); },
  }, {            // la charla ya no fue la misma
    ini() { E.despues[0].ini(); },
    corte: true,
    cam: claves([[0, 44.5, 2.4, 26.2, 48.2, 1.05, 31.4, 34], [30, 46.4, 2.3, 25.2, 48.0, 1.05, 31.4, 31]]),
    tick(t) { turno.forEach((p) => P.triste(p, t)); recuerdo.userData.llama.emissiveIntensity = 1.8 + Math.sin(t * 11) * .5 + Math.sin(t * 5.3) * .4; },
  }, {            // el contador vuelve a cero
    trans: 'mezcla',
    ini() { E.despues[0].ini(); },
    cam: claves([[0, 48.6, 2.2, 27.3, 47.5, 2.5, 32.8, 30], [12, 48.1, 2.3, 28.5, 47.5, 2.5, 32.8, 27]]),
    tick(t) { E.despues[1].tick(t); const u = tr(t, 1.3, 3.9); if (u >= 1) W.tablero.pintar(0, true); else W.tablero.pintar(Math.round(1000 * (1 - suave(u)))); W.tablero.mat.emissiveIntensity = .22 + (u >= 1 ? .5 * Math.exp(-(t - 3.9) * 1.2) : 0); },
  }];

  /* ───────── FILCE 22 · volvamos a la historia: se rebobina y la misma mañana ocurre con Neisstech ─────────
     0 rebobinar · 1 gestión visual · 2 gestión de tráfico · 3 Lúmina (cada capa: primero un cambio concreto a ras de piso,
     después el cruce de Don Salva) · 4 el arsenal funcionando (SmartDock, Safetygate, X-KUBE con tren logístico, la planta
     entera con Lúmina) · 5 al día siguiente (1.001 días) */
  const Mj = W.mejora, R_S2 = ruta([[61.6, 9.45], [69.55, 9.45]]);
  function puertas(cerradas) { Mj.pk += ((cerradas ? 0 : 1) - Mj.pk) * .09; Mj.puertas.forEach((q) => { q.abrir(suave(Mj.pk)); q.rojo.emissiveIntensity = cerradas ? 2.6 : .05; q.verde.emissiveIntensity = cerradas ? .05 : 2.4; });
    Mj.sensor.led.emissiveIntensity = cerradas ? (Math.sin(reloj * 10) > 0 ? 2.6 : .3) : .6; }
  function puertasResto() { (Mj.puertasResto || []).forEach((q) => { q.abrir(1); q.rojo.emissiveIntensity = .05; q.verde.emissiveIntensity = 2.4; }); }
  function pintura(t, t0 = 0, dur = 1.6) { Mj.pintura.visible = true; Mj.pintura.material.opacity = suave(tr(t, t0, t0 + dur)); CLIP.constant = 100; }
  function revelar(t, t0, t1, z0 = 31.5, z1 = 6) { Mj.pintura.visible = true; Mj.pintura.material.opacity = 1; const u = tr(t, t0, t1); CLIP.constant = u >= 1 ? 100 : -lerp(z0, z1, suave(u)); }   // el piso se pinta de cerca hacia lejos
  function visualArriba(t, t0 = 0) { Mj.visual.visible = true; for (const p of Mj.piezasV) p.o.scale.setScalar(Math.max(.001, suave(tr(t, t0 + p.d * .05, t0 + .6 + p.d * .05)))); }
  function visualListo() { Mj.visual.visible = true; for (const p of Mj.piezasV) p.o.scale.setScalar(1); }
  function traficoArriba(t, t0 = 0) { Mj.trafico.visible = true; for (const p of Mj.piezas) p.o.scale.y = Math.max(.01, suave(tr(t, t0 + p.d * .028, t0 + .7 + p.d * .028))); }
  function traficoListo() { Mj.trafico.visible = true; for (const p of Mj.piezas) p.o.scale.y = 1; }
  function proyecciones(t, alerta1 = false) { Mj.cebra1.pintar(1, reloj); Mj.tri1.pintar(alerta1 ? 1 : 0, reloj); Mj.tri1b.pintar(alerta1 ? 1 : 0, reloj);
    Mj.kq = (Mj.kq ?? 1) + ((alerta1 ? 0 : 1) - (Mj.kq ?? 1)) * .09; (Mj.puertasKb || []).forEach((q) => { q.abrir(suave(Mj.kq)); q.rojo.emissiveIntensity = alerta1 ? 2.6 : .05; q.verde.emissiveIntensity = alerta1 ? .05 : 2.4; }); Mj.cebra2.pintar(1, reloj); Mj.area1.pintar(1, reloj); Mj.area2.pintar(1, reloj);
    Mj.kb[0].ojo.emissiveIntensity = alerta1 ? (Math.sin(reloj * 8) > 0 ? 2.8 : .6) : .15; for (const kb of Mj.kb) kb.lente.emissiveIntensity = 2.2; }
  function luminaArriba(t, t0 = 0) { Mj.camara.visible = true; Mj.conoM.opacity = .13 * suave(tr(t, t0, t0 + 1.2)); Mj.ojo.emissiveIntensity = 1 + .6 * Math.sin(reloj * 4); }
  function salvaHasta(t, xMax, vel = 1.15, t0 = .6) {   // camina por el sendero hasta xMax (si hay que esperar, espera ahí)
    const meta = distA(R_S2, xMax, 9.45), d = Math.min(meta, Math.max(0, (t - t0) * vel)), q = en(R_S2, d); pon(salva.g, q.x, q.z, 0);
    if (d < meta) P.andar(salva, 1, t); else { P.quieto(salva); P.respirar(salva, t); }
    return d >= meta;
  }
  function retrocede(t, t0, t1, z0 = 15.4, z1 = 7.4) { const u = suave(tr(t, t0, t1)); cargado(z0 + (z1 - z0) * u); P.manejar(aleS, t, .9); baliza(t, u > 0 && u < 1); return grua.g.position.z; }
  function tren(x, ry = PI) {   // tren logístico: tractor adelante y tres carros detrás (frente +x local)
    Mj.tren.g.visible = true; const ax = Math.cos(ry), az = -Math.sin(ry);
    Mj.tren.partes.forEach((p, i) => { const d = i === 0 ? 0 : .65 + 1.3 * i; pon(p.g, x - ax * d, 21.0 - az * d, ry); });
    Mj.tren.partes[0].balMat.emissiveIntensity = .6 + .6 * Math.sin(reloj * 6);
  }
  const dip = (t, ...cs) => Math.max(0, ...cs.map((c) => 1 - Math.abs(t - c) / .3));
  const CAM_CRUCE = [68.0, 9.0, 1.6, 70.6, .2, 9.6, 44];   // desde la calle, alta, mirando el cruce y la boca del pasillo (sin racks en medio)
  const CORTE = 5.4;
  const dos = (a, b) => { const ca = claves(a), cb = claves(b); return (t) => (t < CORTE ? ca(t) : cb(t - CORTE)); };   // un detalle concreto; corte; el cruce de Don Salva
  const CAM_SENDERO = [[0, 57.0, 1.72, 31.4, 57.0, .55, 15.5, 42], [CORTE, 57.0, 1.72, 30.3, 57.0, .6, 15.0, 42]];      // por el sendero que antes casi no se veía
  const CAM_BARANDA = [[0, 58.4, 1.62, 9.5, 76, .7, 9.6, 40], [CORTE, 59.6, 1.62, 9.5, 76, .7, 9.6, 40]];               // a lo largo del sendero de los pasillos
  const CAM_LUMINA = [[0, 74.2, 4.3, 7.4, 70.4, 3.6, 6.6, 42], [CORTE, 73.9, 4.25, 7.6, 70.4, 3.4, 6.8, 38]];          // la cámara de Lúmina en la columna, mirando el cruce
  const camCCTV = claves([[0, 71.0, 5.0, 5.35, 67.6, .5, 10.9, 52], [30, 71.0, 5.0, 5.35, 67.7, .5, 11.0, 50]]);
  E.rewind = [{   // ◀◀ se rebobina desde lo que quedó
    corte: true, casa: 0,
    ini() { est.fondo = 'fuera'; est.amb = 'frio'; },
    cam: claves([[0, 68.4, 5.6, 3.4, 70.2, .4, 9.8, 42], [3.3, ...CAM_CRUCE]]),   // desde la calle, sin pasar junto a las columnas
    tick(t) {
      trabajar(t); const u = tr(t, .15, 3.2); fx.rew = t < 3.4 ? 1 : Math.max(0, 1 - (t - 3.4) * 2); est.amb = u < .25 ? 'frio' : 'dia';
      const vuelto = true;   // parte del instante previo: nunca se muestra el desenlace
      casco.visible = !vuelto; fonoPiso.visible = !vuelto; casco.position.set(70.3, .012, 8.75); fonoPiso.position.set(70.95, .004, 8.35);
      ale.g.visible = !vuelto; if (!vuelto) { pon(ale.g, 68.5, 10.1, rumbo(1.8, -1.35)); P.cabeza(ale, t); } aleS.g.visible = vuelto; P.manejar(aleS, t, .9);
      cargado(11.7 + 3.7 * sale(u)); baliza(t);
      salva.g.visible = vuelto; const x = 69.55 - 7.9 * sale(tr(u, .3, 1)); pon(salva.g, x, 9.45, 0); if (u > .3 && u < 1) { P.andar(salva, 1, -t * 1.4); } else { P.quieto(salva); P.foto(salva, u < .3 ? 1 : 0); }
      fono.g.visible = vuelto && u < .3;
    },
  }, {            // gestión visual: el sendero de Don Salva aparece pintado bajo sus pies (y toda la nave con él); en el cruce, la grúa se detiene en el PARE
    casa: 0,
    ini() { est.fondo = 'ronda'; cargado(15.4); W.rackDanadoG.visible = false; },
    cam: dos(CAM_SENDERO, [[0, ...CAM_CRUCE], [25, 67.2, 8.7, 2.0, 70.5, .2, 9.6, 43]]),
    tick(t) {
      trabajar(t); revelar(t, .5, 4.6); visualArriba(t, 1.2); fx.negro = dip(t, CORTE);
      if (t < CORTE) { const z = 26.6 - Math.max(0, t - .3) * 1.0; pon(salva.g, 56.95, z, H); P.andar(salva, 1, t); }
      else { est.fondo = 'fuera'; salvaHasta(t, 66.6, 1.1, 5.9); }
      const z = retrocede(t, 6.2, 10.8, 15.4, 11.85); if (z <= 11.9) grua.balMat.emissiveIntensity = .4;
    },
  }, {            // gestión de tráfico: a lo largo del sendero se levantan barandas, puertas y protecciones de rack; en el cruce, el sensor ve la grúa y las puertas se cierran
    casa: 0,
    ini() { est.fondo = 'fuera'; cargado(15.4); pintura(99); visualListo(); Mj.pk = 1; W.rackDanadoG.visible = false; },
    cam: dos(CAM_BARANDA, [[0, ...CAM_CRUCE], [25, 66.6, 8.5, 2.4, 70.4, .2, 9.8, 43]]),
    tick(t) {
      trabajar(t); pintura(99); visualListo(); traficoArriba(t, .3); puertasResto(); proyecciones(t); fx.negro = dip(t, CORTE); if (t < CORTE) { pon(salva.g, 56.95, 12, H); P.respirar(salva, t); return; }
      const z = retrocede(t, 6.0, 12.4, 15.4, 7.4), viene = z < 14.4 && z > 7.8, libre = t > 13.2; puertas(viene || (!libre && t > 6.2));
      if (!libre) salvaHasta(t, 67.0, 1.1, 5.4); else { const d = Math.min(R_S2.largo, distA(R_S2, 67, 9.45) + (t - 13.2) * 1.15), q = en(R_S2, d); pon(salva.g, q.x, q.z, 0); d < R_S2.largo ? P.andar(salva, 1, t) : (P.quieto(salva), P.respirar(salva, t)); }
    },
  }, {            // Lúmina: las cámaras sobre toda la planta; luego, desde la cámara del cruce, ve el riesgo y activa la respuesta
    ini() { est.fondo = 'fuera'; cargado(15.4); pintura(99); visualListo(); traficoListo(); Mj.pk = 1; est.lumina = { alerta: 0, evento: 0, desde: CORTE }; W.rackDanadoG.visible = false; },
    casa: 0,
    cam: (() => { const a = claves(CAM_LUMINA); return (t) => (t < CORTE ? a(t) : camCCTV(t - CORTE)); })(),
    tick(t) {
      trabajar(t); pintura(99); visualListo(); traficoListo(); puertasResto(); proyecciones(t); luminaArriba(t, .3); fx.negro = dip(t, CORTE);
      const L = est.lumina, z = retrocede(t, 7.2, 10.4, 15.4, 12.0); salvaHasta(t, 66.9, 1.1, 6.0);
      const riesgo = t > 8.5; if (riesgo && !L.alerta) L.alerta = t; if (L.alerta && !L.evento && t > L.alerta + 2.2) L.evento = t;
      puertas(riesgo); if (riesgo) grua.balMat.emissiveIntensity = Math.sin(reloj * 12) > 0 ? 2.6 : .1;
    },
  }, {            // el arsenal funcionando: SmartDock · Safetygate · X-KUBE con el tren logístico · la planta completa con Lúmina
    casa: (t) => (t < 17 ? 1 : 0),
    ini() { est.fondo = 'arsenal'; pon(fondo[1].g, 102.7, 15.2, H); pintura(99); visualListo(); traficoListo(); grua.g.visible = false; salva.g.visible = false; Mj.pk = 1; est.lumina = null; fondo[0].levantar(2.2); fondo[0].carga.visible = true; W.rackDanadoG.visible = false; Mj.cunas[1].poner(0); Mj.cunas[1].luz(false); },
    cam(t) {
      if (t < 5.5) return claves([[0, 78.4, 2.3, -7.4, 74.4, .55, -1.9, 40], [5.5, 78.0, 2.15, -7.0, 74.4, .55, -1.9, 38]])(t);
      if (t < 11.5) return claves([[0, 45.5, 3.8, 30.6, 38.6, 1.5, 35.6, 42], [6, 45.0, 3.6, 30.9, 38.6, 1.5, 35.6, 41]])(t - 5.5);
      if (t < 17) return claves([[0, 50.4, 4.6, 22.6, 61.0, .2, 20.0, 46], [5.5, 50.9, 4.4, 22.4, 61.0, .2, 20.0, 45]])(t - 11.5);
      const a = (200 + (t - 17) * 1.6) * PI / 180; return { p: [72 + Math.cos(a) * 62, 44, 18 + Math.sin(a) * 62], m: [72, 0, 17], f: 40 };
    },
    tick(t) {
      trabajar(t); pintura(99); visualListo(); traficoListo(); puertasResto(); puertas(false); luminaArriba(t, 16.5); fx.negro = dip(t, 5.5, 11.5, 17);
      // SmartDock: el operador toma la cuña junto al poste, la deja frente a la rueda y el semáforo del chofer pasa de rojo a verde
      { const sd = Mj.cunas[1], op = turno[1];
        if (t < 5.6) {   // toma la cuña junto al poste, la lleva a la cintura y la deja frente a la rueda: se inclina poco y desde la cadera
          const u = suave(tr(t, 1.0, 3.0)), lleva = suave(tr(t, .7, 1.0)) * (1 - suave(tr(t, 3.05, 3.5))), baja = Math.max(1 - Math.abs(t - .6) / .45, 1 - Math.abs(t - 3.3) / .5, 0), kb = suave(baja);
          sd.poner(u); sd.cuna.position.y = .5 * lleva; sd.tender(); sd.luz(t > 3.9);
          const c = sd.cuna.position, atras = suave(tr(t, 4.0, 4.9)), fx = -.48, fz = -.88, d = .55 + .45 * atras;
          pon(op.g, c.x - fx * d, c.z - fz * d, rumbo(fx, fz)); P.quieto(op);
          if ((u > 0 && u < 1) || (atras > 0 && atras < 1)) P.andar(op, .7, t);
          if (lleva > .02 || kb > .02) { op.bi.rotation.x = op.bd.rotation.x = -.62 * lleva - .28 * kb; op.bi.rotation.z = .1; op.bd.rotation.z = -.1; }
          op.torso.rotation.x = .42 * kb; op.cab.rotation.x = .18 * kb;
        } else if (op.g.position.z < 0) { P.quieto(op); pon(op.g, ...PUESTO[1]); sd.poner(1); sd.luz(true); } }
      // Safetygate: una grúa con la carga alta va hacia el portón; la barra la frena y avisa
      const u2 = t - 5.5, g0 = fondo[0], toca = u2 > 3.0;
      if (u2 > -1 && u2 < 7) { const x = toca ? lerp(38.86, 39.4, suave(tr(u2, 3.6, 4.6))) : lerp(46.5, 38.86, sale(tr(u2, .2, 3.0))); pon(g0.g, x, 35, PI); g0.levantar(toca ? lerp(2.2, .9, suave(tr(u2, 4.4, 5.6))) : 2.2); g0.carga.visible = true; g0.balMat.emissiveIntensity = .5 + .5 * Math.sin(reloj * 6); }
      else pon(g0.g, 79.5, 35, PI);
      const golpe = toca ? Math.exp(-(u2 - 3.0) * 1.6) : 0; Mj.sg.piv.rotation.z = -.42 * golpe * Math.cos((u2 - 3.0) * 5); Mj.sg.balizas.forEach((m) => (m.emissiveIntensity = toca && u2 < 9 ? (Math.sin(reloj * 14) > 0 ? 3 : .2) : .12));
      // X-KUBE: el tren logístico pasa por el cruce; la cebra se apaga y aparece el aviso; el operario espera y cruza
      const u3 = t - 11.5, xt = 66.5 - Math.max(0, u3) * 2.4; tren(t < 11.5 ? 70 : t < 17 ? xt : 84 - ((t - 17) * 2.2) % 44, PI);
      const ocupado = t >= 11.5 && t < 17 && xt < 61.5 && xt + 4.6 > 55.5; proyecciones(t, ocupado);
      const op = turno[0], zEsp = 19.55; if (t >= 11.5 && t < 17) { const zq = Math.min(ocupado || xt > 61.5 ? zEsp : 24, 14 + u3 * 1.25); const libre = !ocupado && xt <= 55.5; const z = libre ? Math.min(25, zEsp + (u3 - 4.6) * 1.25) : Math.min(zq, zEsp); pon(op.g, 57, Math.max(14, z), -H); (z < 24.9 && !(ocupado && z >= zEsp - .01)) ? P.andar(op, 1, t) : (P.quieto(op), P.respirar(op, t)); }
      if (t >= 17) { est.fondo = 'ronda'; est.lumina = est.lumina || { modo: 'resumen' }; }
    },
  }, {            // al día siguiente: 1.001 días sin accidentes
    corte: true,
    ini() { enRonda(); W.fiesta.visible = false; ale.g.visible = true; aleS.g.visible = false; fonoAle.g.visible = false; pon(ale.g, 52.2, 28.0, rumbo(S0[0] - 52.2, S0[1] - 28.0)); W.tablero.pintar(1001); grua.g.visible = false; W.rackDanadoG.visible = false; pintura(99); visualListo(); traficoListo(); },
    cam: claves([[0, 45.2, 3.3, 24.6, 47.8, 1.55, 31.3, 33], [26, 49.4, 3.2, 24.3, 47.8, 1.55, 31.3, 33]]),
    tick(t) { P.hablar(salva, t); turno.forEach((p, i) => { P.respirar(p, t); p.cab.rotation.x = Math.max(0, Math.sin(t * 1.3 + i * 2)) * .12; }); P.respirar(ale, t); W.tablero.mat.emissiveIntensity = .22 + .5 * Math.exp(-t * 1.2); },
  }];

  /* «Cómo funciona el sistema» (lámina de Lúmina), en la misma planta con todo lo de Neisstech: ve · actúa · avisa · se corrige */
  function sisIni() { est.fondo = 'fuera'; cargado(15.4); pintura(99); visualListo(); traficoListo(); Mj.pk = 1; W.rackDanadoG.visible = false; }
  function sisBase(t) { trabajar(t); pintura(99); visualListo(); traficoListo(); puertasResto(); proyecciones(t); luminaArriba(t, 0); }
  const camSis = claves([[0, 71.6, 6.1, 4.2, 67.9, .1, 11.6, 54], [30, 71.6, 6.1, 4.2, 68.0, .1, 11.7, 52]]);   // la cámara del cruce, más abierta: lo de arriba no choca con el título
  const CAM_JEFE = [[0, 53.0, 1.72, 24.1, 56.3, 1.42, 26.1, 34], [9, 53.3, 1.7, 24.4, 56.3, 1.42, 26.1, 32]];
  const CAM_TERRENO = [[0, 65.0, 1.8, 4.4, 66.8, 1.15, 9.6, 42], [12, 65.6, 1.75, 4.8, 66.8, 1.15, 9.6, 39]];   // desde la calle norte, de frente al cruce
  // el atajo de Don Salva: deja el sendero y cruza el pasillo de la grúa por la zona de racks (no por el cruce)
  const ATAJO = ruta([[63.6, 9.45], [68.2, 9.45], [68.45, 10.4], [68.45, 11.7]]);   // del sendero al pasillo 69, a pie, entre los racks
  function sisAtajo(t, t0 = .2, vel = 1.0, dMax = 1e9) { const d = Math.min(ATAJO.largo, dMax, Math.max(0, (t - t0) * vel)), q = en(ATAJO, d); pon(salva.g, q.x, q.z, q.ry ?? 0);
    if (d < Math.min(ATAJO.largo, dMax)) P.andar(salva, 1, t); else { P.quieto(salva); P.respirar(salva, t); } return d; }
  E.sistema = [{   // 01 · ve: la cámara del cruce detecta a la persona y a la grúa que retrocede
    casa: 0, trans: 'seco',
    ini() { sisIni(); est.lumina = { alerta: 0, evento: 0, desde: 0 }; },
    cam: camCCTV,
    tick(t) { sisBase(t); puertas(false); sisAtajo(t, .3, .95); retrocede(t, .8, 9.5, 15.6, 13.9); },
  }, {            // 02 · actúa: riesgo → el cruce se cierra, baliza y aviso a la grúa, que frena; el evento queda registrado
    casa: 0, trans: 'seco',
    ini() { sisIni(); cargado(13.9); est.lumina = { alerta: 0, evento: 0, desde: 0 }; },
    cam: camCCTV,
    tick(t) { sisBase(t); const L = est.lumina; if (t > .5 && !L.alerta) L.alerta = t; if (t > 3.4 && !L.evento) L.evento = t; puertas(false);
      sisAtajo(t, -1e3); salva.cab.rotation.x = -.12 * suave(tr(t, .4, 1)); salva.bi.rotation.x = -.5 * suave(tr(t, .6, 1.2));   // ya en el pasillo: ve la grúa y se frena
      const u = suave(tr(t, 0, 1.0)); cargado(13.9 - .3 * u); P.manejar(aleS, t, .9); grua.balMat.emissiveIntensity = Math.sin(reloj * 12) > 0 ? 2.6 : .1; },
  }, {            // 03 · avisa: al jefe de planta le llega el aviso al celular, esté donde esté
    casa: 1, trans: 'seco',
    ini() { sisIni(); cargado(12.4); jefe.g.visible = true; pon(jefe.g, 56.25, 26.15, rumbo(-1, -.62)); fonoJ.g.visible = true; est.lumina = { modo: 'aviso', t0: .9 }; },
    cam: claves(CAM_JEFE),
    tick(t) { sisBase(t); P.quieto(jefe); P.respirar(jefe, t); const k = suave(tr(t, .5, 1.3)); jefe.bd.rotation.x = -1.05 * k; jefe.bd.rotation.z = .22 * k; jefe.cab.rotation.x = .42 * k;
      fonoJ.pant.emissiveIntensity = t > .9 ? (t < 2.4 && Math.sin(t * 14) < 0 ? .3 : 1.3) : 0; },
  }, {            // 04 · se corrige: el jefe va al cruce con el video en la mano y lo revisa con el equipo; el cruce vuelve a abrir
    casa: 0, trans: 'seco',
    ini() { sisIni(); cargado(13.6); jefe.g.visible = true; fonoJ.g.visible = true; fonoJ.pant.emissiveIntensity = 1.1; pon(salva.g, 67.0, 9.45, rumbo(-1, .05)); est.lumina = { modo: 'terreno', t0: 4.6 }; },
    cam: claves(CAM_TERRENO),
    tick(t) { sisBase(t); P.manejar(aleS, t, .9); grua.balMat.emissiveIntensity = 0;
      const u = Math.min(1, t / 3.6), x = 62.4 + (66.2 - 62.4) * u; pon(jefe.g, x, 9.7, u < 1 ? 0 : rumbo(1, -.05));
      if (u < 1) { P.andar(jefe, 1, t); P.celular(jefe, t); } else { P.quieto(jefe); P.hablar(jefe, t); jefe.bi.rotation.x = -1.05; jefe.bi.rotation.z = .2; }
      P.quieto(salva); P.respirar(salva, t); if (t > 4) { salva.cab.rotation.x = .08; salva.cab.rotation.y = Math.sin(t * .8) * .1; }
      if (u >= 1 && t > 5.5) { jefe.bd.rotation.set(-1.45, 0, -.15); }   // le muestra el camino: por el sendero y el cruce
      puertas(false); },
  }];

  /* Lúmina sobre la imagen: marcos con esquinas, rostros pixelados, la línea del riesgo y el aviso; o, desde el aire, el resumen de la planta */
  const V3 = new THREE.Vector3();
  function proyectar(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y, z] of pts) { V3.set(x, y, z).project(cam); const sx = (V3.x + 1) / 2 * 1920, sy = (1 - V3.y) / 2 * 1080; x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx); y1 = Math.max(y1, sy); } return [x0, y0, x1, y1]; }
  const cajaMundo = (x, z, r, h, y = 0) => { const p = []; for (const a of [-r, r]) for (const b of [-r, r]) for (const yy of [y, y + h]) p.push([x + a, yy, z + b]); return proyectar(p); };
  function marco(c, [x0, y0, x1, y1], col, txt) { const L = Math.min(28, (x1 - x0) / 3, (y1 - y0) / 3); c.strokeStyle = col; c.lineWidth = 3;
    for (const [px, py, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { c.beginPath(); c.moveTo(px, py + dy * L); c.lineTo(px, py); c.lineTo(px + dx * L, py); c.stroke(); }
    c.fillStyle = 'rgba(236,109,39,.07)'; c.fillRect(x0, y0, x1 - x0, y1 - y0);
    const ly = Math.max(y0 - 46, est.esc === 'sistema' ? 150 : -1e9);   // en «cómo funciona» la etiqueta nunca sube hasta el título
    c.font = '600 21px Poppins, Arial'; const w = c.measureText(txt).width + 44; c.fillStyle = 'rgba(24,24,24,.86)'; c.beginPath(); c.roundRect(x0, ly, w, 36, 18); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(x0 + 18, ly + 18, 6, 0, 7); c.fill(); c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText(txt, x0 + 32, ly + 19); }
  function etiqueta(c, x, y, z, txt, col = '#EC6D27') { V3.set(x, y, z).project(cam); if (V3.z > 1) return; const sx = (V3.x + 1) / 2 * 1920, sy = (1 - V3.y) / 2 * 1080;
    c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(sx, sy, 9, 0, 7); c.stroke(); c.fillStyle = col; c.beginPath(); c.arc(sx, sy, 3.5, 0, 7); c.fill();
    c.font = '600 18px Poppins, Arial'; const w = c.measureText(txt).width + 34; c.fillStyle = 'rgba(24,24,24,.82)'; c.beginPath(); c.roundRect(sx + 14, sy - 44, w, 30, 15); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(sx + 29, sy - 29, 5, 0, 7); c.fill(); c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText(txt, sx + 42, sy - 28); }
  const VQ = new THREE.Vector3(), VR = new THREE.Vector3();
  function tapar(p) {   // la cara: frente de la cabeza (z+ del grupo cab), tapada entera aunque la cámara la vea desde arriba
    p.cab.updateWorldMatrix(true, false); VQ.set(0, .105, .1); p.cab.localToWorld(VQ); VR.copy(VQ); VR.y += .15; VQ.project(cam); VR.project(cam); if (VQ.z > 1) return;
    const sx = (VQ.x + 1) / 2 * 1920, sy = (1 - VQ.y) / 2 * 1080, h = Math.abs(sy - (1 - VR.y) / 2 * 1080); pixel(lc, sx, sy, Math.max(6, h / 1.5)); }
  function pixel(c, x, y, s = 7) { const tonos = ['#c9a58a', '#b38e75', '#d8b89f', '#a07c66']; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = tonos[(i * 3 + j * 5) % 4]; c.fillRect(x - 2 * s + i * s, y - 2 * s + j * s, s, s); } }
  function dibujarLumina(t) {
    lc.clearRect(0, 0, 1920, 1080); const L = est.lumina; if (!L || (L.desde && t < L.desde)) return;
    cam.updateMatrixWorld(); const NAR = '#EC6D27';
    if (L.modo === 'resumen') {   // desde el aire: lo que Lúmina está viendo en toda la planta
      const tp = Mj.tren.partes[0].g.position; etiqueta(lc, tp.x, 2.2, tp.z, 'Tren logístico · en ruta');
      fondo.forEach((g, i) => { const p = g.g.position; etiqueta(lc, p.x, 2.6, p.z, i ? 'Grúa · en ruta' : 'Grúa · carga baja'); });
      [turno[3], turno[5], turno[8]].forEach((p) => etiqueta(lc, p.g.position.x, 1.9, p.g.position.z, 'Persona · EPP ok', '#3DD07A'));
      etiqueta(lc, 69, .4, 9.5, 'Cruce C1 · libre', '#3DD07A'); etiqueta(lc, 73, 1.5, -1.4, 'Andén 3 · camión fijo', '#3DD07A');
      const X = 1340, Y = 110; lc.fillStyle = 'rgba(255,255,255,.97)'; lc.beginPath(); lc.roundRect(X, Y, 500, 110, 22); lc.fill();
      lc.fillStyle = NAR; lc.beginPath(); lc.arc(X + 50, Y + 55, 24, 0, 7); lc.fill(); lc.fillStyle = '#fff'; lc.beginPath(); lc.arc(X + 50, Y + 55, 9, 0, 7); lc.fill();
      lc.fillStyle = '#6c6c6c'; lc.font = '600 16px Poppins, Arial'; lc.textBaseline = 'middle'; lc.fillText('LÚMINA · TURNO MAÑANA', X + 94, Y + 36); lc.fillStyle = '#181818'; lc.font = '600 28px Poppins, Arial'; lc.fillText('Planta sin alertas', X + 94, Y + 72);
      return;
    }
    if (L.modo === 'aviso') {   // el celular del jefe de planta
      const k = suave(tr(t, L.t0, L.t0 + .7)), X = 1300 + (1 - k) * 160, Y = 120, W = 420, Hh = 820; lc.globalAlpha = k;
      lc.fillStyle = '#111317'; lc.beginPath(); lc.roundRect(X, Y, W, Hh, 64); lc.fill(); lc.fillStyle = '#F5F6F8'; lc.beginPath(); lc.roundRect(X + 14, Y + 14, W - 28, Hh - 28, 52); lc.fill();
      lc.fillStyle = '#111317'; lc.beginPath(); lc.roundRect(X + W / 2 - 62, Y + 30, 124, 34, 17); lc.fill();
      lc.fillStyle = '#181818'; lc.font = '600 76px Poppins, Arial'; lc.textAlign = 'center'; lc.textBaseline = 'alphabetic'; lc.fillText('08:47', X + W / 2, Y + 200); lc.font = '500 20px Poppins, Arial'; lc.fillStyle = '#6c6c6c'; lc.fillText('martes 17 de noviembre', X + W / 2, Y + 236); lc.textAlign = 'left';
      const n = suave(tr(t, L.t0 + .5, L.t0 + 1.1)), NY = Y + 290 + (1 - n) * -40; lc.globalAlpha = k * n;
      lc.fillStyle = '#fff'; lc.beginPath(); lc.roundRect(X + 34, NY, W - 68, 330, 28); lc.fill(); lc.strokeStyle = 'rgba(236,109,39,.55)'; lc.lineWidth = 2.5; lc.stroke();
      lc.fillStyle = NAR; lc.beginPath(); lc.arc(X + 72, NY + 44, 18, 0, 7); lc.fill(); lc.fillStyle = '#fff'; lc.beginPath(); lc.arc(X + 72, NY + 44, 7, 0, 7); lc.fill();
      lc.fillStyle = '#6c6c6c'; lc.font = '600 15px Poppins, Arial'; lc.textBaseline = 'middle'; lc.fillText('LÚMINA · ahora', X + 102, NY + 44);
      lc.fillStyle = '#E5484D'; lc.font = '600 28px Poppins, Arial'; lc.fillText('Riesgo de atropello', X + 58, NY + 98);
      lc.fillStyle = '#181818'; lc.font = '500 19px Poppins, Arial'; lc.fillText('Peatón fuera del sendero, cruzando', X + 58, NY + 134); lc.fillText('en zona de racks · pasillo 69.', X + 58, NY + 160);
      lc.fillStyle = '#2A2F36'; lc.beginPath(); lc.roundRect(X + 58, NY + 188, W - 116, 112, 16); lc.fill(); lc.fillStyle = '#fff'; lc.beginPath(); lc.moveTo(X + W / 2 - 14, NY + 226); lc.lineTo(X + W / 2 + 18, NY + 244); lc.lineTo(X + W / 2 - 14, NY + 262); lc.fill();
      lc.fillStyle = 'rgba(255,255,255,.85)'; lc.font = '500 15px Poppins, Arial'; lc.fillText('Video del evento · 0:12', X + 74, NY + 284);
      const b2 = suave(tr(t, L.t0 + 1.4, L.t0 + 2)); lc.globalAlpha = k * b2; lc.fillStyle = '#056CF2'; lc.beginPath(); lc.roundRect(X + 34, NY + 350, W - 68, 70, 35); lc.fill(); lc.fillStyle = '#fff'; lc.font = '600 22px Poppins, Arial'; lc.textAlign = 'center'; lc.fillText('Ir al pasillo 69', X + W / 2, NY + 386); lc.textAlign = 'left';
      lc.globalAlpha = 1; return;
    }
    if (L.modo === 'terreno') {   // en el cruce: el video en la mano y el evento cerrado
      const k = suave(tr(t, L.t0, L.t0 + .6)), X = 1340, Y = 230; if (k <= 0) return; lc.globalAlpha = k;
      lc.fillStyle = 'rgba(255,255,255,.97)'; lc.beginPath(); lc.roundRect(X, Y, 500, 132, 22); lc.fill();
      lc.fillStyle = '#1F9D5A'; lc.beginPath(); lc.arc(X + 52, Y + 66, 26, 0, 7); lc.fill(); lc.strokeStyle = '#fff'; lc.lineWidth = 5; lc.beginPath(); lc.moveTo(X + 40, Y + 66); lc.lineTo(X + 49, Y + 76); lc.lineTo(X + 65, Y + 56); lc.stroke();
      lc.fillStyle = '#6c6c6c'; lc.font = '600 17px Poppins, Arial'; lc.textBaseline = 'middle'; lc.fillText('LÚMINA · PASILLO 69', X + 98, Y + 36); lc.fillStyle = '#181818'; lc.font = '600 30px Poppins, Arial'; lc.fillText('Retroalimentado en terreno', X + 98, Y + 72);
      lc.fillStyle = '#6c6c6c'; lc.font = '500 19px Poppins, Arial'; lc.fillText('El evento queda para el análisis', X + 98, Y + 106); lc.globalAlpha = 1; return;
    }
    // marco de cámara (CCTV) · en «cómo funciona» todo baja, para no chocar con el título
    const oy = est.esc === 'sistema' ? 120 : 0;
    lc.fillStyle = 'rgba(255,255,255,.92)'; lc.font = '600 22px Poppins, Arial'; lc.textBaseline = 'middle'; lc.fillText('CAM 04 · CRUCE C1', 1150, 60 + oy);
    if (Math.sin(reloj * 5) > -.2) { lc.fillStyle = '#FF3B3B'; lc.beginPath(); lc.arc(1130, 60 + oy, 8, 0, 7); lc.fill(); }
    const seg = 47 * 60 + 12 + Math.floor(t), hh = `08:${String(Math.floor(seg / 60) % 60).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`; lc.fillText(hh, 1400, 60 + oy);
    const bs = salva.g.position, bg = grua.g.position;
    const rS = cajaMundo(bs.x, bs.z, .35, 1.8), rG = cajaMundo(bg.x, bg.z, 1.25, 2.3);
    marco(lc, rS, NAR, est.esc === 'sistema' ? 'Persona · fuera del sendero' : 'Persona'); marco(lc, rG, NAR, 'Grúa · en retroceso');
    tapar(salva); tapar(aleS);
    if (L.alerta) { const a = Math.min(1, (t - L.alerta) * 3); lc.globalAlpha = a; lc.setLineDash([10, 10]); lc.strokeStyle = '#FF4D4F'; lc.lineWidth = 3; lc.beginPath(); lc.moveTo((rS[0] + rS[2]) / 2, rS[3]); lc.lineTo((rG[0] + rG[2]) / 2, rG[3]); lc.stroke(); lc.setLineDash([]);
      const X = 1340, Y = 110 + oy; lc.fillStyle = 'rgba(255,255,255,.97)'; lc.beginPath(); lc.roundRect(X, Y, 500, 132, 22); lc.fill();
      lc.fillStyle = NAR; lc.beginPath(); lc.arc(X + 52, Y + 66, 26, 0, 7); lc.fill(); lc.fillStyle = '#fff'; lc.beginPath(); lc.arc(X + 52, Y + 66, 10, 0, 7); lc.fill();
      lc.fillStyle = '#6c6c6c'; lc.font = '600 17px Poppins, Arial'; lc.fillText('LÚMINA · AVISO AL JEFE DE TURNO', X + 98, Y + 36);
      lc.fillStyle = '#181818'; lc.font = '600 30px Poppins, Arial'; lc.fillText('Riesgo de atropello', X + 98, Y + 72); lc.fillStyle = '#6c6c6c'; lc.font = '500 19px Poppins, Arial'; lc.fillText(est.esc === 'sistema' ? 'Cruza en zona de racks · avisa a la grúa' : 'Cruce C1 · cierra el cruce y avisa a la grúa', X + 98, Y + 106);
      lc.globalAlpha = 1; }
    if (L.evento) { const a = Math.min(1, (t - L.evento) * 3), X = 1340, Y = 262 + oy; lc.globalAlpha = a; lc.fillStyle = 'rgba(24,24,24,.86)'; lc.beginPath(); lc.roundRect(X, Y, 500, 64, 32); lc.fill();
      lc.fillStyle = '#3DD07A'; lc.beginPath(); lc.arc(X + 34, Y + 32, 8, 0, 7); lc.fill(); lc.fillStyle = '#fff'; lc.font = '500 21px Poppins, Arial'; lc.fillText('Evento registrado para el análisis', X + 56, Y + 33); lc.globalAlpha = 1; }
  }

  /* ───────── motor ───────── */
  const est = { esc: 'salva', paso: 0, clip: E.salva[0], t: 0, amb: 'dia', de: null, activo: false, fondo: 'ronda', q: { x: 95.9, z: 3.2, ry: -H }, casa: 1 };
  const ahora = { p: [-81, 50, 78], m: [300, -28, -60], f: 36 }, luzAmb = { ...AMB.dia, sol: new THREE.Color(AMB.dia.sol), niebla: new THREE.Color(AMB.dia.niebla) }, cTmp = new THREE.Color();
  let filtro = '';
  function entrar(nombre, paso) {
    const lista = E[nombre]; if (!lista) return; const clip = lista[Math.min(paso, lista.length - 1)];
    if (clip === est.clip && est.t > 0) return;
    const modo = clip.trans || (clip.corte ? 'negro' : 'corte');
    est.de = modo === 'mezcla' ? { p: [...ahora.p], m: [...ahora.m], f: ahora.f } : null; est.esc = nombre; est.paso = paso; est.clip = clip; est.t = 0; base(); clip.ini();
    if (modo === 'seco') { fx.negro = 0; est.aclara = 0; }   // corte limpio, sin pasar por negro («cómo funciona»)
    else if (modo !== 'mezcla' && est.activo) { fx.negro = 1; est.aclara = modo === 'negro' ? 1.1 : .45; } else est.aclara = 0;
  }
  let tPrev = 0, reloj = 0;
  function cuadro(ms) {
    if (!est.activo) return; requestAnimationFrame(cuadro);
    const dt = Math.min(.05, (ms - tPrev) / 1000 || 0); tPrev = ms; est.t += dt; reloj += dt; const t = est.t, clip = est.clip;
    ronda(reloj); clip.tick(t, dt); W.vida(reloj, dt); confeti(dt, reloj);
    if (est.aclara && t < est.aclara + .1) fx.negro = 1 - suave(tr(t, .02, est.aclara));
    const c = typeof clip.cam === 'function' ? clip.cam(t) : clip.cam, u = est.de ? suave(tr(t, 0, 1.6)) : 1;
    for (let j = 0; j < 3; j++) { ahora.p[j] = est.de ? lerp(est.de.p[j], c.p[j], u) : c.p[j]; ahora.m[j] = est.de ? lerp(est.de.m[j], c.m[j], u) : c.m[j]; } ahora.f = est.de ? lerp(est.de.f, c.f, u) : c.f;
    const dist = Math.hypot(ahora.p[0] - ahora.m[0], ahora.p[1] - ahora.m[1], ahora.p[2] - ahora.m[2]), pul = Math.min(.05, dist * .0022);
    cam.position.set(ahora.p[0] + Math.sin(reloj * .53) * pul, ahora.p[1] + Math.sin(reloj * .71 + 1) * pul * .7, ahora.p[2] + Math.cos(reloj * .47) * pul); cam.lookAt(ahora.m[0], ahora.m[1], ahora.m[2]);
    const nr = clamp(Math.min(dist * .04, cam.position.y * .3), .1, 15);   // plano cercano según la distancia: desde el aire, más precisión de profundidad (sin parpadeo de superficies)
    if (cam.fov !== ahora.f || Math.abs(cam.near - nr) > .02) { cam.fov = ahora.f; cam.near = nr; cam.updateProjectionMatrix(); }
    // casa de muñecas: adentro y abajo, techo y murallas; desde el aire, lo que pida la toma
    const meta = DENTRO(cam.position.x, cam.position.z) && cam.position.y < ALERO - .4 ? 1 : (typeof clip.casa === 'function' ? clip.casa(est.t) : clip.casa ?? 0);
    if ((est.t < .06 && !est.de) || fx.negro > .6) est.casa = meta; else est.casa += (meta - est.casa) * Math.min(1, dt * 2.6); W.casa(suave(est.casa), suave(est.casa));
    W.cielo.position.copy(cam.position);
    // luz y ambiente
    const A = AMB[est.amb], kk = Math.min(1, dt * 3); luzAmb.isol += (A.isol - luzAmb.isol) * kk; luzAmb.hemi += (A.hemi - luzAmb.hemi) * kk; luzAmb.vin += (A.vin - luzAmb.vin) * kk; luzAmb.sol.lerp(cTmp.set(A.sol), kk); luzAmb.niebla.lerp(cTmp.set(A.niebla), kk);
    k.sol.intensity = luzAmb.isol; k.sol.color.copy(luzAmb.sol); if (hemi) hemi.intensity = luzAmb.hemi * (1 + .45 * est.casa); k.escena.background.copy(luzAmb.niebla); k.escena.fog.color.copy(luzAmb.niebla);
    const lejos = Math.hypot(cam.position.x - ahora.m[0], cam.position.z - ahora.m[2]), foco = lejos > 150 ? CP : [ahora.m[0], ahora.m[2]];
    const r = lejos > 150 ? 118 : clamp(dist * .95, 9, 85); k.sol.target.position.set(foco[0], 0, foco[1]); k.sol.position.set(foco[0] + SOL.x * 160, SOL.y * 160, foco[1] + SOL.z * 160);
    Object.assign(k.sol.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 420 }); k.sol.shadow.camera.updateProjectionMatrix(); k.sol.shadow.normalBias = .02 + r * .0035; k.sol.shadow.bias = -.0003 - r * .000004;
    if (A.filtro !== filtro) { filtro = A.filtro; k.lienzo.style.filter = filtro; }
    eRew.style.opacity = fx.rew.toFixed(3); if (est.lumina || est.luminaPintada) { dibujarLumina(t); est.luminaPintada = !!est.lumina; }
    eVin.style.opacity = luzAmb.vin.toFixed(3); eNegro.style.opacity = fx.negro.toFixed(3); eFlash.style.opacity = fx.flash.toFixed(3); eVel.style.opacity = fx.vel.toFixed(3);
    k.render.render(k.escena, cam);
  }
  k.medir(); base(); est.clip.ini(); est.t = 0;
  cam.position.set(...ahora.p); cam.lookAt(...ahora.m); try { k.render.compile(k.escena, cam); } catch (e) {}
  return {
    ir(nombre, paso = 0) { entrar(nombre, paso); },
    activo(si) { if (si === est.activo) return; est.activo = si; if (si) { k.medir(); cam.aspect = k.W / k.H; cam.updateProjectionMatrix(); tPrev = performance.now(); requestAnimationFrame(cuadro); } },
    reiniciar() { est.t = 0; base(); est.clip.ini(); },
    est, W, k, cam,
  };
}
