/* Lumina sobre la planta v5 de Neisstech (16-nov-2026, v5 de la presentación).
   La planta es la misma de la home de neisstech.com (js/planta5, copia tal cual). Encima va Lumina, en naranjo: sus cámaras
   con su cono y las detecciones en vivo (marcos, pastillas, rostros pixelados, aviso al jefe de turno).
   v5: el recorrido es GUIONADO (feedback de Max: «hay que rezar que las cosas pasen»). Cada aplicación es una historia que
   siempre ocurre igual: con las demostraciones de la home (tráfico, punto ciego, velocidad, andén) en el paso 0 pasa el
   problema y Lumina lo ve; al avanzar, Neisstech actúa. EPP, zona restringida, frío y eventos son historias propias, con la
   simulación en pausa. Todas las personas salen con el rostro pixelado.
   crear(cont) → { toma(nombre, paso), paso(n), activo(si) } */
import { montar } from '../js/planta5/vista.js?v=22';
import * as P from '../js/planta5/trazado.js';
import { THREE, clamp, lerp } from '../js/planta/nucleo.js';

const NAR = 0xEC6D27, C_NAR = '#EC6D27', C_AMB = '#F5A06A', C_ROJO = '#FF4D4F', C_VERDE = '#3DD07A', C_FRIO = '#7FC4FF';
const ANCHO = 1920, ALTO = 1080, VEL = 1.4;   // las demostraciones corren 1,4× (escenas.js)
const PT = (id) => P.PUNTOS.find((p) => p.id === id).toma;
const TP = P.TOMA_PLANTA;

/* ── encuadres (desplaza > 0 corre la planta a la derecha para dejar el texto a la izquierda) ── */
const V = {
  portada:   { ...TP, zoom: 27, desplaza: -.3 },
  plantaIzq: { ...TP, zoom: 27, desplaza: .26 },
  planta:    { ...TP, zoom: 25.5, desplaza: 0 },
  cruce:     { ...PT('cruce'), zoom: 7.4, desplaza: .3 },
  epp:       { x: 67.6, z: 8.4, zoom: 5.4, az: 18, el: 38, desplaza: .28 },
  zona:      { x: 82.0, z: 47.6, zoom: 5.8, az: 24, el: 42, desplaza: .28 },
  frio:      { ...PT('frio'), zoom: 6.6, desplaza: .28 },
  eventos:   { x: 62.0, z: 45.0, zoom: 5.6, az: 30, el: 40, desplaza: .28 },
};
/* tomas: esc = demostración guionada de la home · sola = planta en pausa con una historia propia */
const TOMAS = {
  portada:   { vista: () => V.portada, modo: () => 'despues', luz: () => 0, orbita: true },
  invisible: { vista: () => V.plantaIzq, modo: () => 'antes', luz: () => 0, gris: (p) => p < 1, casi: (p) => p >= 1 },
  evolucion: { vista: () => ({ ...V.planta, desplaza: .04 }), modo: (p) => (p <= 1 ? 'antes' : 'despues'), gris: (p) => p <= 1, luz: (p) => (p >= 3 ? 1 : 0), calor: (p) => p >= 3, anonimo: (p) => p >= 3, compacto: true },
  ve:        { esc: 'trafico', cam: 'cruce', luz: () => 1 },
  ciego:     { esc: 'zonas', cam: 'trafico', luz: () => 1 },
  velocidad: { esc: 'velocidad', cam: 'trafico', luz: () => 1, velocidad: true },
  anden:     { esc: 'smartdock', cam: 'porton', luz: () => 1 },
  epp:       { sola: 'epp', vista: () => V.epp, modo: () => 'despues', luz: () => 1 },
  zona:      { sola: 'zona', vista: () => V.zona, modo: () => 'despues', luz: () => 1 },
  frio:      { sola: 'frio', vista: () => V.frio, modo: () => 'despues', luz: () => 1 },
  eventos:   { sola: 'eventos', vista: () => V.eventos, modo: () => 'despues', luz: () => 1 },
  todo:      { vista: () => V.planta, modo: () => 'despues', luz: () => 1, compacto: true },
  trafico:   { vista: () => ({ ...PT('cruce'), zoom: 10.5, desplaza: .3 }), modo: () => 'despues', luz: () => 0, orbita: true },   // FILCE 14: gestión de tráfico, sin Lúmina
  cierre:    { vista: () => ({ ...V.planta, zoom: 27, desplaza: .38 }), modo: () => 'despues', luz: () => 1, compacto: true, orbita: true },
};
const AVISO = { 'Riesgo de atropello': 'Cruce de pasillo', 'Persona en punto ciego': 'Grúa en retroceso', 'Exceso de velocidad': 'Calle A', 'Camión en movimiento': 'Andén 2',
  'Sin casco': 'Ingreso a nave', 'Ingreso a zona restringida': 'Celda del robot', 'Puerta abierta': 'Cámara de frío', 'Persona caída': 'Producto terminado', 'Humo detectado': 'Producto terminado' };

export async function crear(cont) {
  const capa = document.createElement('div'); capa.className = 'planta3d__capa'; cont.appendChild(capa);
  const est = { toma: 'portada', cfg: TOMAS.portada, paso: 0, luz: 0, gris: 0, calor: 0, modo: 'despues', giro: 0, dirGiro: 1, t: 0, tt: 0, tok: 0, esc: null, fase: null, sola: false, aviso: { k: 0, txt: '', donde: '' }, frio: { t: 0 } };
  let listo = false, api = null;
  const alEscena = (id, f) => {
    if (!api || est.cfg.esc !== id) return; const tok = ++est.tok;
    // la historia se repite sola mientras Bastián habla: el problema (paso 0) o la solución (paso 1)
    if (f === 'antesFin') setTimeout(() => { if (tok === est.tok && est.cfg.esc === id && est.fase === 'antes') api.repetir('antes'); }, 1800);
    if (f === 'fin') setTimeout(() => { if (tok === est.tok && est.cfg.esc === id && est.fase === 'despues') api.repetir('despues'); }, 2600);
  };
  api = await montar(capa, { interactiva: false, transparente: true, modo: 'despues', alCuadro: () => listo && cuadro(), alEscena });
  const { k, H } = api, S = api.sim, md = H.md, escena = k.escena;
  const sup = document.createElement('canvas'); sup.className = 'planta3d__sup'; capa.appendChild(sup);
  const SC = 1.5; sup.width = ANCHO * SC; sup.height = ALTO * SC; const c2 = sup.getContext('2d');

  /* ══════ Cámaras de Lumina: cuerpo grafito, lente naranjo, cono de visión y la luz que cae al piso ══════ */
  const std = (c, e = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: .4, ...e });
  const cuerpoM = std(0x2B2B2A, { roughness: .35 }), lenteM = std(0x2a1406, { emissive: NAR, emissiveIntensity: .2, roughness: .2 }), anilloM = std(NAR, { roughness: .4 });
  const conoMat = () => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color(NAR) } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform float uA; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN,vV)),1.5); float a = uA * f * (0.25 + 0.75*(1.0 - vUv.y)) * 0.42; gl_FragColor = vec4(uC, a); }',
  });
  const haloTex = k.tex((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(236,109,39,.75)'); g.addColorStop(.6, 'rgba(236,109,39,.25)'); g.addColorStop(1, 'rgba(236,109,39,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 256, 256);
  const CAMS = [
    // [qué toma la enciende, posición, punto mirado, radio del cono]
    ['cruce', [70.6, 4.4, 20.2], [67.4, 0, 16.4], 3.2],
    ['epp', [71.6, 4.2, 5.35], [68.4, 0, 9.0], 2.8],
    ['asistencia', [66.2, 3.9, 4.75], [67.8, P.NIVEL_PATIO, -1.6], 3.0],
    ['zona', [86.4, 3.8, 45.0], [83.4, 0, 49.6], 2.8],
    ['frio', [103.3, 3.3, 25.6], [101.4, 0, 29.2], 2.6],
    ['trafico', [61.0, 4.2, 31.0], [64.5, 0, 38.5], 3.4],
    ['eventos', [45.3, 3.6, 41.0], [54.0, 0, 47.0], 3.4],
    ['porton', [70.5, 3.5, 25.25], [65.0, 0, 21.8], 3.0],
    ['racks', [96.4, 4.8, 15.5], [86.0, 0, 16.5], 3.0],
  ].map(([id, pos, mira, r]) => {
    const p = new THREE.Vector3(...pos), m = new THREE.Vector3(...mira);
    const g = new THREE.Group(); g.position.copy(p); escena.add(g); g.lookAt(m);
    const add = (geo, mat, x, y, z) => { const o = new THREE.Mesh(geo, mat); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
    add(new THREE.BoxGeometry(.26, .26, .62), cuerpoM, 0, 0, 0); add(new THREE.BoxGeometry(.34, .04, .7), cuerpoM, 0, .16, .05);
    add(new THREE.CylinderGeometry(.13, .13, .03, 24), anilloM, 0, 0, .315).rotation.x = Math.PI / 2;
    add(new THREE.CylinderGeometry(.085, .085, .04, 24), lenteM, 0, 0, .325).rotation.x = Math.PI / 2;
    add(new THREE.BoxGeometry(.06, .06, .5), cuerpoM, 0, .22, -.35);
    const alto = p.distanceTo(m), geo = new THREE.ConeGeometry(r, alto, 48, 1, true); geo.translate(0, -alto / 2, 0);
    const cono = new THREE.Mesh(geo, conoMat()); cono.position.copy(p); cono.lookAt(m); cono.rotateX(-Math.PI / 2); cono.renderOrder = 6; escena.add(cono);
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.6, r * 2.6), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    piso.rotation.x = -Math.PI / 2; piso.position.set(m.x, m.y + .05, m.z); piso.renderOrder = 5; escena.add(piso);
    return { id, cono, piso, m };
  });

  /* ══════ Calor de riesgo (3.0 predictiva): donde la planta se cruza ══════ */
  const N = P.NAVE, calorPts = [...Object.values(P.CRUCES).map((r) => [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 1]), [65, 24.6, 1.1], [62, 7, .9], [101.5, 29, .9], [64.5, 30, .7], [100.5, 15, .7]];
  const calorTex = k.tex((x, w, h) => { calorPts.forEach(([px, pz, f]) => { const cx = (px - N.x0) / (N.x1 - N.x0) * w, cy = (pz - N.z0) / (N.z1 - N.z0) * h, R = 70 * f + 30;
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, 'rgba(255,59,59,.9)'); g.addColorStop(.4, 'rgba(236,109,39,.55)'); g.addColorStop(1, 'rgba(236,109,39,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }); }, 1024, 788);
  const calor = new THREE.Mesh(new THREE.PlaneGeometry(N.x1 - N.x0, N.z1 - N.z0), new THREE.MeshBasicMaterial({ map: calorTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  calor.rotation.x = -Math.PI / 2; calor.position.set((N.x0 + N.x1) / 2, .07, (N.z0 + N.z1) / 2); calor.renderOrder = 4; escena.add(calor);

  /* ══════ Actores de las historias propias (solo se ven en su toma) ══════ */
  const andar = (p, v, t) => { const a = Math.sin(t * 8.2) * .55 * v; p.pi.rotation.x = a; p.pd.rotation.x = -a; p.bi.rotation.x = -a * .7; p.bd.rotation.x = a * .7; p.c.position.y = Math.abs(Math.cos(t * 8.2)) * .035 * v; };
  const rumbo = (a, b) => Math.atan2(b[0] - a[0], b[1] - a[1]) - Math.PI / 2;
  // recorre una ruta [[x,z],…] en «dur» segundos desde «t0»; devuelve [x, z, moviéndose]
  const recorrer = (per, ruta, t, t0, dur) => { const u = clamp((t - t0) / dur), seg = u * (ruta.length - 1), i = Math.min(ruta.length - 2, Math.floor(seg)), w = seg - i, a = ruta[i], b = ruta[i + 1];
    const x = lerp(a[0], b[0], w), z = lerp(a[1], b[1], w), mueve = u > 0 && u < 1; per.g.position.set(x, 0, z); if (mueve || u === 0) per.g.rotation.y = rumbo(a, b); andar(per, mueve ? 1 : 0, t); return [x, z]; };
  const nuevo = (tipo, x, z, ry = 0) => { const p = md.persona(tipo); p.g.visible = false; p.g.position.set(x, 0, z); p.g.rotation.y = ry; return p; };
  // EPP: dos operarios con casco trabajando y alguien de oficina que entra a la nave sin casco
  const EPP = { sin: nuevo('oficina', 66.4, 5.6), con: [nuevo('operario', 68.9, 9.6, 2.2), nuevo('operario', 70.2, 8.0, -.9)], ruta: [[66.2, 4.6], [66.4, 7.2], [67.0, 10.4], [67.4, 11.6]] };
  // zona restringida: la celda del robot y alguien que entra y sale
  const ZONA = { x0: 80.9, x1: 85.9, z0: 47.1, z1: 52.1 }, intruso = nuevo('operario', 78.2, 43.6), rutaZona = [[78.0, 43.4], [80.4, 45.6], [82.2, 48.2]];
  // eventos críticos: humo en un pallet de producto terminado y una persona que cae
  const humoTex = k.tex((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(45,47,52,.95)'); g.addColorStop(.5, 'rgba(60,62,68,.5)'); g.addColorStop(1, 'rgba(70,72,78,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 128, 128);
  const HUMO = [59.6, 44.6], humo = Array.from({ length: 44 }, (_, i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: humoTex, transparent: true, depthWrite: false, depthTest: false, opacity: 0 })); s.userData.f = i / 44; s.userData.a = Math.random() * 6.28; s.visible = false; escena.add(s); return s; });
  const caido = nuevo('operario', 64.6, 43.4), rutaCae = [[65.4, 42.2], [62.6, 44.6]];
  // frío: un operario que entra a buscar un pallet y deja la puerta abierta
  const friero = nuevo('operario', 100.4, 31.6), rutaFrio = [[99.0, 33.4], [102.4, 29.4]];
  const PROPIOS = [EPP.sin, ...EPP.con, intruso, caido, friero];

  /* ══════ Proyección y dibujo de la capa de Lumina ══════ */
  const B = new THREE.Box3(), vv = new THREE.Vector3(), CAB = new THREE.Vector3(), TAM = new THREE.Vector3(.36, .38, .36);
  const aPx = (v) => { vv.copy(v).project(k.camara); return [(vv.x * .5 + .5) * ANCHO, (-vv.y * .5 + .5) * ALTO, Math.abs(vv.x) < 1.05 && Math.abs(vv.y) < 1.05]; };
  function rectCaja(b) {
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (let i = 0; i < 8; i++) { const [X, Y] = aPx(vv.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z)); x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y); }
    const px = (x1 - x0) * .08, py = (y1 - y0) * .05; return [x0 + px, y0 + py, x1 - x0 - 2 * px, y1 - y0 - 2 * py];
  }
  const rr = (x, y, w, h, r) => { c2.beginPath(); c2.roundRect(x, y, w, h, r); };
  function marco(x, y, w, h, col) {
    c2.fillStyle = col + '22'; rr(x, y, w, h, 6); c2.fill();
    const L = Math.max(6, Math.min(w, h) * .26); c2.strokeStyle = col; c2.lineWidth = 2.6; c2.lineCap = 'round'; c2.beginPath();
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([a, b, sx, sy]) => { c2.moveTo(a, b + sy * L); c2.lineTo(a, b); c2.lineTo(a + sx * L, b); });
    c2.stroke();
  }
  function pildora(x, y, txt, col, grande = false) {
    const fs = grande ? 21 : 17; c2.font = `600 ${fs}px Poppins, -apple-system, sans-serif`;
    const h = grande ? 40 : 32, w = c2.measureText(txt).width + h + 8; x = clamp(x, 8, ANCHO - w - 8); y = clamp(y, 8, ALTO - h - 8);
    c2.fillStyle = 'rgba(24,24,24,.9)'; rr(x, y, w, h, h / 2); c2.fill();
    c2.fillStyle = col; c2.beginPath(); c2.arc(x + h / 2, y + h / 2, grande ? 6 : 4.5, 0, 7); c2.fill();
    c2.fillStyle = '#fff'; c2.textBaseline = 'middle'; c2.fillText(txt, x + h / 2 + 12, y + h / 2 + 1);
    return w;
  }
  const chipEn = (p, txt, col, grande, dy = -54) => { const [x, y, ok] = aPx(p); if (!ok) return; c2.font = `600 ${grande ? 21 : 17}px Poppins, sans-serif`; pildora(x - (c2.measureText(txt).width + 40) / 2, y + dy, txt, col, grande); };
  // rostro pixelado (Ley 21.719): un mosaico sobre la cabeza de cada persona, también la que maneja la grúa
  function rostro(per) {
    if (!per?.c || !per.g.visible) return; per.c.updateWorldMatrix(true, false); CAB.set(0, 1.43, 0); per.c.localToWorld(CAB);
    B.setFromCenterAndSize(CAB, TAM); const [x, y, w, h] = rectCaja(B); if (w < 2) return; const n = 4, sx = w / n, sy = h / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 150 + ((i * 7 + j * 13) % 5) * 18; c2.fillStyle = `rgb(${v},${v - 6},${v - 12})`; c2.fillRect(x + i * sx, y + j * sy, sx + .6, sy + .6); }
  }
  const dentroNave = (x, z) => x > N.x0 + .3 && x < N.x1 && z > N.z0 + .3 && z < N.z1;
  const km = (v) => Math.round(Math.abs(v) * 3.6);

  /* ══════ Ciclo: se llama después de cada render de la planta ══════ */
  let ultimo = performance.now();
  function cuadro() {
    const ahora = performance.now(), dt = Math.min(.05, (ahora - ultimo) / 1000); ultimo = ahora; est.t += dt; est.tt += dt;
    const cfg = est.cfg, p = est.paso, f = 1 - Math.exp(-dt * 2.4);
    est.luz = lerp(est.luz, cfg.luz(p), f); const luz = est.luz;
    est.gris = lerp(est.gris, cfg.gris && cfg.gris(p) ? 1 : 0, f); est.calor = lerp(est.calor, cfg.calor && cfg.calor(p) ? 1 : 0, f);
    const filtro = `grayscale(${est.gris.toFixed(2)}) contrast(${(1 - .08 * est.gris).toFixed(2)})`; if (filtro !== est.filtro) { capa.style.filter = filtro; est.filtro = filtro; }
    const meta = cfg.orbita ? est.giro + est.dirGiro * dt * 2.2 : est.giro * (1 - Math.min(1, dt * 1.5));
    if (cfg.orbita && Math.abs(meta) > 34) est.dirGiro *= -1; api.girar(meta - est.giro); est.giro = meta;
    lenteM.emissiveIntensity = .2 + 2.6 * luz;
    const camToma = cfg.cam || est.toma;
    CAMS.forEach((c) => { const foco = camToma === c.id || cfg.compacto ? 1 : .45; c.cono.material.uniforms.uA.value = luz * foco; c.piso.material.opacity = luz * .55 * foco; });
    calor.material.opacity = est.calor * (.5 + .08 * Math.sin(est.t * 1.6));
    const gente = [], vehs = [];
    historias(dt, gente);
    dibujar(luz, p, gente, vehs, dt);
  }

  /* historias propias: cada una dura un ciclo y vuelve a empezar */
  function historias(dt, gente) {
    const s = est.cfg.sola, t = est.tt;
    for (const q of PROPIOS) q.g.visible = false;
    humo.forEach((h) => (h.visible = false));
    if (s === 'epp') { const u = t % 13; EPP.sin.g.visible = true; EPP.con.forEach((q) => (q.g.visible = true));
      const [x, z] = recorrer(EPP.sin, EPP.ruta, u, .6, 6.5); gente.push({ per: EPP.sin, x, z, tipo: 'oficina' }); EPP.con.forEach((q) => gente.push({ per: q, x: q.g.position.x, z: q.g.position.z, tipo: 'operario' })); }
    if (s === 'zona') { const u = t % 12; intruso.g.visible = true; const ida = u < 6.5; const [x, z] = recorrer(intruso, ida ? rutaZona : [...rutaZona].reverse(), ida ? u : u - 6.5, ida ? .6 : 1.8, 3.6);
      gente.push({ per: intruso, x, z, tipo: 'operario', zona: x > ZONA.x0 && x < ZONA.x1 && z > ZONA.z0 && z < ZONA.z1 }); est.intruso = [x, z]; }
    if (s === 'eventos') { const u = t % 14; caido.g.visible = true; const [x, z] = recorrer(caido, rutaCae, Math.min(u, 3.2), .4, 2.8);
      const kc = clamp((u - 3.3) / .5); caido.c.rotation.z = Math.PI / 2 * kc; caido.c.position.y = .2 * kc; caido.g.position.y = 0; est.evK = kc; est.humoK = clamp((u - .8) / 2.5) * (u < 13 ? 1 : 0);
      humo.forEach((h) => { const fz = (t * .16 + h.userData.f) % 1; h.visible = true; h.position.set(HUMO[0] + Math.sin(h.userData.a + fz * 3) * .7 * fz, .8 + fz * 6, HUMO[1] + Math.cos(h.userData.a) * .5 * fz); h.scale.setScalar(1.2 + fz * 4.6); h.renderOrder = 9; h.material.opacity = est.humoK * Math.min(1, (1 - fz) * 1.6) * .95; });
      gente.push({ per: caido, x, z, tipo: kc > .6 ? 'caido' : 'operario' }); }
    else { caido.c.rotation.z = 0; caido.c.position.y = 0; }
    if (s && s !== 'frio') S.puertaFriaForzada = 0;
    if (s === 'frio') { const u = t % 14; friero.g.visible = u < 4.2 || u > 11; const ida = u < 6; const [x, z] = recorrer(friero, ida ? rutaFrio : [...rutaFrio].reverse(), ida ? u : u - 10.6, ida ? .4 : 0, 2.6);
      if (friero.g.visible) gente.push({ per: friero, x, z, tipo: 'operario' });
      S.puertaFriaForzada = u > 2.2 && u < 11.4 ? 1 : 0; est.frio.abre = u > 2.2 && u < 11.4; est.frio.t = est.frio.abre ? u - 2.2 : 0; est.frio.u = u; }
  }

  function dibujar(luz, p, gente, vehs, dt) {
    c2.setTransform(SC, 0, 0, SC, 0, 0); c2.clearRect(0, 0, ANCHO, ALTO);
    const cfg = est.cfg, compacto = !!cfg.compacto, anon = cfg.anonimo ? cfg.anonimo(p) : luz > .3, alertas = [];
    // cuasi-accidentes que nadie vio (apertura): los avisos rojos de la simulación sin Neisstech
    if (cfg.casi && cfg.casi(p)) for (const ev of S.eventos.slice(-8)) { if (ev.bien) continue; const age = S.reloj - ev.t; if (age > 4.5) continue; c2.globalAlpha = Math.min(1, (4.5 - age) / 1.2); chipEn(new THREE.Vector3(ev.x, (ev.y || 0) + 1.6, ev.z), ev.tipo === 'golpe' ? 'Golpe al portón' : ev.tipo === 'camion' ? 'Camión en movimiento' : ev.tipo === 'rack' ? 'Golpe al rack' : 'Casi accidente', C_ROJO, true, -20); c2.globalAlpha = 1; }
    if (luz < .02) { est.aviso.k = 0; return; }
    c2.globalAlpha = luz;
    // quién está en escena: la simulación, la demostración guionada o la historia propia
    if (!cfg.esc && !cfg.sola) {
      S.vehiculos.filter((a) => !a.oculto && !a.res && a.m.g.visible).forEach((a) => vehs.push({ obj: a.m.g, m: a.m, x: a.x, z: a.z, v: a.v || 0, tipo: a.tipo }));
      S.peatones.filter((q) => !q.res && q.m.g.visible).forEach((q) => gente.push({ per: q.m, x: q.x, z: q.z, tipo: q.m.tipo || q.ropa }));
    }
    const d = cfg.esc && api.ES.actual();
    if (d) {
      for (const a of Object.values(d)) { if (!a || !a.obj || a.r === undefined || !a.obj.visible) continue;
        if (a.tipo === 'grua') vehs.push({ obj: a.obj, m: a.m, x: a.x, z: a.z, v: a.v * VEL, tipo: 'grua' }); else if (a.tipo === 'persona') gente.push({ per: a.p, x: a.x, z: a.z, tipo: a.p.tipo || 'operario', susto: a.quieto }); }
      if (d.T?.g?.visible) { const g = d.T.g, z0 = est.zCam ?? g.position.z; est.zCam = g.position.z; vehs.push({ obj: g, x: g.position.x, z: g.position.z + 2, v: Math.abs(g.position.z - z0) / Math.max(dt, .001), tipo: 'camion' }); }
    }
    // zona restringida dibujada en el piso
    if (cfg.sola === 'zona') { const ent = gente.some((q) => q.zona), col = ent ? C_ROJO : C_NAR;
      const pts = [[ZONA.x0, ZONA.z0], [ZONA.x1, ZONA.z0], [ZONA.x1, ZONA.z1], [ZONA.x0, ZONA.z1]].map(([x, z]) => aPx(new THREE.Vector3(x, .02, z)));
      c2.beginPath(); pts.forEach(([x, y], i) => (i ? c2.lineTo(x, y) : c2.moveTo(x, y))); c2.closePath(); c2.fillStyle = ent ? `rgba(255,77,79,${.22 + .1 * Math.sin(est.t * 8)})` : 'rgba(236,109,39,.12)'; c2.fill(); c2.setLineDash([12, 8]); c2.strokeStyle = col; c2.lineWidth = 3; c2.stroke(); c2.setLineDash([]);
      chipEn(new THREE.Vector3(ZONA.x1, 2.6, ZONA.z0), ent ? 'Ingreso a zona restringida' : 'Zona restringida · robot', col, true); if (ent) alertas.push('Ingreso a zona restringida'); }
    // riesgo persona–vehículo: línea roja entre los dos
    const riesgo = new Set();
    for (const q of gente) for (const a of vehs) if (a.tipo !== 'camion' && Math.abs(a.v) > .4 && Math.hypot(q.x - a.x, q.z - a.z) < 3.4) { riesgo.add(q); riesgo.add(a);
      const [ax, ay] = aPx(vv.set(a.x, 1, a.z)), [bx, by] = aPx(new THREE.Vector3(q.x, 1, q.z)); c2.strokeStyle = C_ROJO; c2.lineWidth = 3; c2.setLineDash([10, 8]); c2.lineDashOffset = -est.t * 40; c2.beginPath(); c2.moveTo(ax, ay); c2.lineTo(bx, by); c2.stroke(); c2.setLineDash([]); }
    const ciego = cfg.esc === 'zonas';
    for (const a of vehs) {
      B.setFromObject(a.obj); const [x, y, w, h] = rectCaja(B); if (x > ANCHO || y > ALTO || x + w < 0 || y + h < 0) continue;
      const kmh = km(a.v), exceso = a.tipo === 'grua' && cfg.velocidad && kmh > 12, mueve = a.tipo === 'camion' && a.v > .3 && est.fase === 'antes', r = riesgo.has(a) || exceso || mueve, col = r ? C_ROJO : C_NAR;
      marco(x, y, w, h, col);
      const txt = a.tipo === 'grua' ? (exceso ? `Exceso de velocidad · ${kmh} km/h` : cfg.esc || cfg.velocidad ? `Montacargas · ${kmh} km/h` : 'Montacargas') : a.tipo === 'tren' ? 'Tren logístico' : mueve ? 'Camión en movimiento' : 'Camión';
      if (!compacto || r) pildora(x, y - 40, txt, col);
      if (exceso) alertas.push('Exceso de velocidad'); if (mueve) alertas.push('Camión en movimiento');
      if (anon && a.m?.op) rostro(a.m.op);
    }
    for (const q of gente) {
      if (!q.per?.g?.visible) continue;
      B.setFromObject(q.per.g); const [x, y, w, h] = rectCaja(B); if (x > ANCHO || y > ALTO || x + w < 0 || y + h < 0) continue;
      const sinCasco = q.tipo === 'oficina' && dentroNave(q.x, q.z), caida = q.tipo === 'caido';
      let col = C_AMB, txt = 'Persona';
      if (caida) { col = C_ROJO; txt = 'Persona caída'; }
      else if (riesgo.has(q)) { col = C_ROJO; txt = ciego ? 'Persona en punto ciego' : 'Riesgo de atropello'; }
      else if (q.zona) { col = C_ROJO; txt = 'Zona restringida'; }
      else if (sinCasco) { col = C_ROJO; txt = 'Sin casco'; }
      else if (cfg.sola === 'epp') { col = C_VERDE; txt = 'Casco ✓'; }
      marco(x, y, w, h, col);
      if (!compacto || col === C_ROJO) pildora(x, y - 40, txt, col);
      if (col === C_ROJO && txt !== 'Zona restringida') alertas.push(txt);
      if (anon) rostro(q.per);
    }
    // frío: cuánto lleva abierta la puerta
    if (cfg.sola === 'frio') { const F = est.frio, puerta = new THREE.Vector3(P.FRIO.x0 - .3, 2.9, P.FRIO.puerta.z), centro = new THREE.Vector3((P.FRIO.x0 + P.FRIO.x1) / 2, 3.6, (P.FRIO.z0 + P.FRIO.z1) / 2);
      if (F.abre) { const s = Math.floor(F.t * 20), mm = String(Math.floor(s / 60)).padStart(2, '0'), ss = String(s % 60).padStart(2, '0'), alerta = F.t > 3;
        chipEn(puerta, `${alerta ? 'Puerta abierta' : 'Abierta'} · ${mm}:${ss}`, alerta ? C_ROJO : C_AMB, true); chipEn(centro, `${Math.round(-18 + F.t * .9)} °C`, alerta ? C_ROJO : C_FRIO, true, -10);
        if (alerta) alertas.push('Puerta abierta'); }
      else if (F.u > 11.4 && F.u < 13.5) chipEn(puerta, 'Cerrada ✓', C_VERDE, true); else chipEn(centro, '−18 °C', C_FRIO, true, -10); }
    if (cfg.sola === 'eventos' && est.humoK > .3) { chipEn(new THREE.Vector3(HUMO[0], 3.6, HUMO[1]), 'Humo detectado', C_ROJO, true); alertas.unshift('Humo detectado'); }
    c2.globalAlpha = 1;
    aviso(alertas, luz, dt);
  }

  // el aviso que le llega al jefe de turno (arriba a la derecha): Lumina ve → avisa
  function aviso(alertas, luz, dt) {
    const A = est.aviso, hay = alertas.length > 0 && est.cfg.luz(est.paso) > .5 && !est.cfg.compacto;
    if (hay) { if (A.txt !== alertas[0]) { A.txt = alertas[0]; A.donde = AVISO[A.txt] || ''; A.t0 = est.t; } A.hasta = est.t + 2.6; }
    A.k = clamp(A.k + ((A.hasta || 0) > est.t ? dt * 3 : -dt * 2)); if (A.k < .01) return;
    const e = 1 - Math.pow(1 - A.k, 3), w = 470, h = 116, x = ANCHO - w - 70, y = 70 - (1 - e) * 30;
    c2.globalAlpha = e * luz; c2.fillStyle = 'rgba(255,255,255,.97)'; c2.shadowColor = 'rgba(6,26,51,.35)'; c2.shadowBlur = 40; c2.shadowOffsetY = 18; rr(x, y, w, h, 26); c2.fill(); c2.shadowColor = 'transparent';
    c2.fillStyle = C_NAR; c2.beginPath(); c2.arc(x + 46, y + 58, 22, 0, 7); c2.fill(); c2.fillStyle = '#fff'; c2.beginPath(); c2.arc(x + 46, y + 58, 9, 0, 7); c2.fill();
    const pul = ((est.t - (A.t0 || 0)) * 1.2) % 1; c2.strokeStyle = C_NAR; c2.lineWidth = 2.5; c2.globalAlpha = e * luz * (1 - pul); c2.beginPath(); c2.arc(x + 46, y + 58, 22 + pul * 18, 0, 7); c2.stroke(); c2.globalAlpha = e * luz;
    c2.textBaseline = 'alphabetic'; c2.fillStyle = '#6c6c6c'; c2.font = '600 15px Poppins, sans-serif'; c2.fillText('LUMINA · AVISO AL JEFE DE TURNO', x + 86, y + 38);
    c2.fillStyle = '#181818'; c2.font = '500 25px Poppins, sans-serif'; c2.fillText(A.txt, x + 86, y + 70);
    c2.fillStyle = '#6c6c6c'; c2.font = '400 18px Poppins, sans-serif'; c2.fillText(`${A.donde}${A.donde ? ' · ' : ''}ahora`, x + 86, y + 96);
    c2.globalAlpha = 1;
  }

  /* ══════ API para la presentación ══════ */
  function aplicar() {
    const cfg = est.cfg, p = est.paso;
    api.retener = !!cfg.esc; api.zoomEscena = cfg.esc ? 1.22 : 1;
    if (cfg.esc) {
      api.desplazaEscena = .3;
      if (est.esc !== cfg.esc) { est.tok++; api.escena(cfg.esc); est.esc = cfg.esc; est.fase = 'antes'; est.modo = 'antes'; est.sola = false; }
      const fase = p >= 1 ? 'despues' : 'antes';
      if (fase !== est.fase) { est.tok++; if (fase === 'despues') { api.despues(); est.modo = 'despues'; } else { api.escena(cfg.esc); est.modo = 'antes'; } est.fase = fase; }
      return;
    }
    api.desplazaEscena = null;
    const veniaEsc = !!est.esc, m = cfg.modo(p); est.esc = null; est.fase = null;
    if (cfg.sola) { if (!est.sola || veniaEsc || m !== est.modo) { api.quieta(m); est.modo = m; } est.sola = true; est.tt = 0; }
    else { if (est.sola || veniaEsc || m !== est.modo) { api.modo(m); est.modo = m; } est.sola = false; S.puertaFriaForzada = undefined; }
    api.ir({ ...cfg.vista(p) });
  }
  api.modo('despues'); api.ir({ ...V.portada }); listo = true;
  return {
    toma(nombre, paso = 0) { const cfg = TOMAS[nombre] || TOMAS.todo; const cambio = nombre !== est.toma || paso !== est.paso; est.toma = nombre; est.cfg = cfg; est.paso = paso; if (cambio) aplicar(); },
    paso(n) { if (n === est.paso) return; est.paso = n; aplicar(); },
    activo(si) { api.activo(si); },
    api,
  };
}
