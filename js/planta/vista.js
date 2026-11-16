/* Planta Neisstech · vista (8-nov-2026). montar(cont, op) → { activo(bool), ir(nombre), comparar(f|null), listo }
   op.vista: 'completa' (recorrido por la planta) · op.comparar: muestra «antes | después» con un divisor (0..1). */
import { THREE, nucleo, clamp, lerp, eio, suave } from './nucleo.js';
import { construir } from './construir.js';
import { crearSim } from './sim.js';
import * as P from './mapa.js';
import { pintarPiso } from './piso.js';

export const TOMAS = {
  planta: { x: 15, z: 4, zoom: 23, az: 45, el: 31 },
  trafico: { x: .8, z: 5.2, zoom: 4.4, az: 40, el: 40 },
  safetygate: { x: .2, z: 5.2, zoom: 3.8, az: 20, el: 26, y: 1.4 },
  recepcion: { x: -11.5, z: 8.5, zoom: 6.6, az: -40, el: 36 },
  racks: { x: -5, z: -5, zoom: 9, az: 40, el: 46 },
  hall: { x: 12, z: 2, zoom: 11, az: 45, el: 38 },
  fria: { x: 5.4, z: -8.5, zoom: 5.2, az: 30, el: 36, y: .8 },
  agv: { x: 16, z: 3, zoom: 8, az: 40, el: 44 },
  lean: { x: 4, z: 14, zoom: 4.8, az: 30, el: 32, y: .9 },
};
const RECORRIDO = ['planta', 'trafico', 'safetygate', 'racks', 'recepcion', 'hall', 'fria', 'agv', 'lean'];

export async function montar(cont, op = {}) {
  const k = nucleo(cont, op), { M } = k;
  const H = construir(k);
  // fusionar lo estático (menos llamadas de dibujo); lo que se anima queda fuera

  for (const g of [H.grupos.base, H.grupos.desorden]) k.fusionar(g);
  for (const c of Object.values(H.capas)) k.fusionar(c.g);      // cada capa por separado: se enciende sola en los recorridos
  // piso por capas (solo en los recorridos que lo piden): senderos · pasillos y zonas · ubicaciones
  const pisoCapas = op.pisoCapas ? ['senderos', 'calles', 'ubic'].map((n, i) => { const m = H.piso(pintarPiso(H.ppm, false, new Set([n]))); m.renderOrder = 1.1 + i * .1; return m; }) : null;
  if (pisoCapas) H.pisoD.visible = false;
  const simD = crearSim(k, H, 'despues');
  const simA = null;   // una sola simulación: «antes» y «después» muestran el mismo instante

  /* ── proyecciones (luz en el piso) ── */
  const proy = k.grupo(); proy.userData.vivo = true;
  const tx = (dib, w = 512, h = 512) => k.tex(dib, w, h);
  const halo = (x, w, h, c) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, c); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); };
  function dibGrua(x, cx, cy, s, color) {
    x.fillStyle = color; x.strokeStyle = color; x.lineWidth = s * .09; x.lineCap = 'round';
    x.fillRect(cx - s * .55, cy - s * .05, s * .75, s * .38); x.fillRect(cx - s * .55, cy - s * .38, s * .1, s * .36);
    x.beginPath(); x.moveTo(cx - s * .5, cy - s * .38); x.lineTo(cx - s * .05, cy - s * .38); x.lineTo(cx + .02 * s, cy - s * .05); x.stroke();
    x.fillRect(cx + s * .25, cy - s * .55, s * .07, s * .9); x.fillRect(cx + s * .25, cy + s * .28, s * .4, s * .07);
    for (const dx of [-.38, .08]) { x.beginPath(); x.arc(cx + s * dx, cy + s * .38, s * .12, 0, Math.PI * 2); x.fill(); }
  }
  const T = {
    riesgo: tx((x, w, h) => { halo(x, w, h, 'rgba(255,200,40,.35)'); x.lineJoin = 'round'; x.strokeStyle = '#FFD21F'; x.lineWidth = 30; x.beginPath(); x.moveTo(w / 2, 70); x.lineTo(w - 64, h - 96); x.lineTo(64, h - 96); x.closePath(); x.stroke(); dibGrua(x, w / 2 - 10, h / 2 + 50, 145, '#FFD21F'); }),
    linea: tx((x, w, h) => { const g = x.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,214,40,0)'); g.addColorStop(.38, 'rgba(255,214,40,.35)'); g.addColorStop(.47, 'rgba(255,230,90,1)'); g.addColorStop(.53, 'rgba(255,230,90,1)'); g.addColorStop(.62, 'rgba(255,214,40,.35)'); g.addColorStop(1, 'rgba(255,214,40,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 64, 8),
  };
  const conoMat = (color) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color(color) } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform float uA; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN,vV)),1.6); float a = uA * f * (0.25 + 0.75*(1.0 - vUv.y)) * 0.3; gl_FragColor = vec4(uC, a); }' });
  function haz(desde, hasta, radio, color = 0xFFF1B0) { const alto = desde.distanceTo(hasta), g = new THREE.ConeGeometry(radio, alto, 36, 1, true); g.translate(0, -alto / 2, 0); const m = new THREE.Mesh(g, conoMat(color)); m.position.copy(desde); m.lookAt(hasta); m.rotateX(-Math.PI / 2); m.renderOrder = 4; proy.add(m); return m; }
  function abanico(desde, a, b) { const g = new THREE.BufferGeometry().setFromPoints([desde, a, b]); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xFFE27A, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, toneMapped: false })); m.renderOrder = 4; proy.add(m); return m; }
  function calco(t, w, d, x, z, ry = 0) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, .02, z); m.renderOrder = 3; proy.add(m); return m; }
  // línea proyectada de x0,z0 a x1,z1, con su abanico desde el lente
  function lineaP(proyector, x0, z0, x1, z1) {
    const L = Math.hypot(x1 - x0, z1 - z0), m = calco(T.linea, L, .34, (x0 + x1) / 2, (z0 + z1) / 2, Math.atan2(-(z1 - z0), x1 - x0));
    m.material.map = T.linea; const ab = abanico(proyector.lente(), new THREE.Vector3(x0, .02, z0), new THREE.Vector3(x1, .02, z1));
    return { pintar(k) { m.material.opacity = k; ab.material.opacity = .06 * k; proyector.vidrio.emissiveIntensity = 2.2 * k; m.visible = ab.visible = k > .01; } };
  }
  function pictoP(proyector, x, z, tam = 1.15, ry = 0) {
    const m = calco(T.riesgo, tam, tam, x, z, ry), h = haz(proyector.lente(), new THREE.Vector3(x, 0, z), tam * .5);
    return { pintar(k) { m.material.opacity = k; m.scale.setScalar(.9 + .1 * k); h.material.uniforms.uA.value = k; proyector.vidrio.emissiveIntensity = 2.2 * k; m.visible = h.visible = k > .01; } };
  }
  k.escena.updateMatrixWorld(true);
  T.prohibido = tx((x, w, h) => { halo(x, w, h, 'rgba(255,60,60,.3)'); x.strokeStyle = '#FF3B3B'; x.lineWidth = 34; x.beginPath(); x.arc(w / 2, h / 2, 170, 0, 7); x.stroke(); dibGrua(x, w / 2 - 6, h / 2 + 10, 150, '#FF5A5A'); x.beginPath(); x.moveTo(w / 2 - 120, h / 2 - 120); x.lineTo(w / 2 + 120, h / 2 + 120); x.stroke(); });
  T.copo = tx((x, w, h) => { halo(x, w, h, 'rgba(120,190,255,.4)'); x.strokeStyle = '#8FD0FF'; x.lineWidth = 22; x.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(w / 2 + Math.cos(a) * 170, h / 2 + Math.sin(a) * 170); x.stroke(); for (const s of [-1, 1]) { x.beginPath(); x.moveTo(w / 2 + Math.cos(a) * 100, h / 2 + Math.sin(a) * 100); x.lineTo(w / 2 + Math.cos(a) * 100 + Math.cos(a + s * .8) * 55, h / 2 + Math.sin(a) * 100 + Math.sin(a + s * .8) * 55); x.stroke(); } } });
  function pictoT(proyector, t, x, z, tam, ry = 0) { const p = pictoP(proyector, x, z, tam, ry); const m = proy.children[proy.children.length - 2]; m.material.map = t; return p; }
  const D1 = H.cruces.D1, SH = P.SENDERO_H;
  const luces = {
    D1: { lineas: [lineaP(D1.lineas[0], SH.x0 + .05, D1.rect.z0, SH.x0 + .05, D1.rect.z1), lineaP(D1.lineas[1], SH.x1 - .05, D1.rect.z0, SH.x1 - .05, D1.rect.z1)], senal: pictoP(D1.senal, SH.c, D1.cz, 1.1, Math.PI / 2) },
    salidas: H.salidas.map((s) => ({ ...s, pi: pictoP(s.proy, P.PASILLO_G.x0 + .9, s.p.c, 1.0, Math.PI / 2) })),
    rec: pictoT(H.proyRec, T.prohibido, P.NAVE.x0 + 1.4, P.PUERTA_REC.z, 1.1, Math.PI / 2),
    fria: pictoT(H.proyFria, T.copo, P.CAMARA_FRIA.puerta, P.CAMARA_FRIA.z1 + 1.5, 1.2, 0),
  };
  // alertas (antes): anillo rojo que late
  const alertas = k.grupo(); alertas.userData.vivo = true;
  const anillos = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(.55, .72, 48), new THREE.MeshBasicMaterial({ color: 0xFF3B3B, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.y = .04; m.renderOrder = 5; alertas.add(m); return m; });
  // ondas de la alarma del Safety Gate
  const ondas = [0, 1].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(.16, .2, 40), new THREE.MeshBasicMaterial({ color: 0xFF3B3B, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); m.rotation.y = Math.PI / 2; proy.add(m); return m; });

  /* ── pintar el estado de la simulación «después» en los equipos ── */
  function pintarEquipos(S) {
    const c = S.cruces.D1;
    luces.D1.lineas.forEach((l) => l.pintar(c.k.lineas * lv('proyLineas'))); luces.D1.senal.pintar(c.k.senal * lv('proySenal'));
    H.balizaInterior.r.emissiveIntensity = S.cruces.I.turno === 'cruza' ? 2.4 : .05; H.balizaInterior.v.emissiveIntensity = S.cruces.I.turno === 'cruza' ? .05 : 2.4;
    for (const s of luces.salidas) { const sale = S.vehiculos.some((v) => !v.agv && v.z > s.p.z0 && v.z < s.p.z1 && v.x > -16 && v.x < -9.6 && v.v > .15 && (v.rev ? -v.mx : v.mx) > .3); s.k = clamp((s.k || 0) + (sale ? .08 : -.05)); s.pi.pintar(s.k * lv('proySalidas')); }
    luces.rec.pintar(.9 * lv('proyRec'));
    luces.fria.pintar(eio(S.puertaFria || 0) * lv('proyFria')); H.fria.abrir(eio(S.puertaFria || 0)); H.fria.luzP.emissiveIntensity = (S.puertaFria || 0) > .05 ? (Math.sin(S.reloj * 8) > 0 ? 2.4 : .4) : .6;
    // D2 y cámara fría: semáforos peatonales en verde (sin equipos en este tramo)
    for (const a of [...H.cruces.D2.ampel, ...H.cruces.H1.ampel]) { a.v.emissiveIntensity = 2.0; a.r.emissiveIntensity = .05; }
    H.sg.piv.rotation.z = S.sg.ang || 0; H.sg2.balizas.forEach((m) => (m.emissiveIntensity = .12));
    if (H.lamparas) { const t = S.reloj; H.lamparas.forEach((l, i) => { const verde = Math.sin(t * .35 + i * 1.7) > .2; l.emissive.setHex(verde ? 0x22C55E : 0xFF3B3B); l.emissiveIntensity = 2.2; }); }
    if (H.robot2) { const t = S.reloj * .8 + 1.5, q = (Math.sin(t) + 1) / 2; H.robot2.base.rotation.y = lerp(-.8, 1.0, suave(q)); H.robot2.b2.rotation.z = .4 + .3 * Math.sin(t * 2); }
    const al = S.sg.alarma, fl = al && Math.sin(S.reloj * 18) > 0 ? 1 : 0; H.sg.balizas.forEach((m) => (m.emissiveIntensity = al ? .2 + 3.2 * fl : .12));
    ondas.forEach((o, i) => { const p = (S.reloj * 1.5 + i * .5) % 1; o.visible = al && lv('sg') > .5; if (!al) return; const w = new THREE.Vector3(0, 0, (i ? 1 : -1) * 1.8); H.sg.tubo.localToWorld(w); o.position.copy(w); o.scale.setScalar(1 + p * 3); o.material.opacity = (1 - p) * .55; });
    const d = S.dock; H.dock.dentro.v.emissiveIntensity = d.listo ? 2.4 : .05; H.dock.dentro.r.emissiveIntensity = d.listo ? .05 : 2.4; H.dock.fuera.r.emissiveIntensity = d.listo ? 2.4 : .05; H.dock.fuera.v.emissiveIntensity = d.listo ? .05 : 2.4;
    // pluma del patio: se abre cuando un camión se acerca al acceso
    if (H.pluma) { // ciclo de 14 s: el auto llega, se detiene ante la pluma, el lector lo reconoce, la pluma sube, pasa y baja
      const t = S.reloj % 14, a = H.autoPluma; let z, abre;
      if (t < 4) { z = lerp(4.6, 2.2, eio(t / 4)); abre = false; } else if (t < 5.4) { z = 2.2; abre = t > 4.6; } else if (t < 10) { z = lerp(2.2, -9, eio((t - 5.4) / 4.6)); abre = z > -4.2; } else { z = -9; abre = false; }
      a.position.z = z; a.visible = t < 10.6;
      plumaK = clamp(plumaK + (abre ? .03 : -.022)); H.pluma.brazo.rotation.z = eio(plumaK) * Math.PI * .47; H.pluma.bal.emissiveIntensity = abre ? (Math.sin(S.reloj * 9) > 0 ? 2.4 : .3) : .2; }
    // radar: velocidad de la grúa que sube por la pista NB hacia la recepción
    let v = null; for (const a of S.vehiculos) if (!a.camion && !a.agv && a.x > P.PASILLO_G.x0 && a.x < P.PASILLO_G.x1 && a.z > -14 && a.z < -2.5 && a.mz > .5 && a.v > .2) v = Math.max(v || 0, a.v * 3.6);
    if (v != null) { radarV = v; radarT = S.reloj; } H.radar.mostrar(S.reloj - radarT < 3 ? radarV : null, 10);
    // robot: pick & place
    { const t = S.reloj * .9, q = (Math.sin(t) + 1) / 2; H.robot.base.rotation.y = lerp(-.6, 1.2, suave(q)); H.robot.b1.rotation.z = -.3 - .4 * Math.sin(t * 2) * .5; H.robot.b2.rotation.z = .5 + .3 * Math.sin(t * 2 + 1); H.robot.baliza.emissiveIntensity = Math.sin(t * 6) > 0 ? 2 : .3; }
    for (const a of S.vehiculos) { if (a.m.balMat) a.m.balMat.emissiveIntensity = a.v > .05 ? (Math.sin(S.reloj * 9 + a.x) > 0 ? 2.4 : .3) : .25; if (a.m.bal) a.m.bal.emissiveIntensity = a.v > .05 ? 2.2 : .6; }
  }
  let plumaK = 0, radarV = null, radarT = -9;
  // alerta de peatón (después): anillo ámbar alrededor de la persona cuando una grúa en movimiento está a menos de 3 m
  const tags = [0, 1, 2, 3].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(.42, .52, 40), new THREE.MeshBasicMaterial({ color: 0xFFB020, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); m.rotation.x = -Math.PI / 2; m.position.y = .05; m.renderOrder = 5; proy.add(m); return m; });
  function pintarTags(S) {
    const k = lv('alertaPeaton'), cerca = k < .01 ? [] : S.peatones.filter((p) => p.g.visible && S.vehiculos.some((v) => !v.camion && !v.agv && v.v > .15 && Math.hypot(v.x - p.x, v.z - p.z) < 4.5));
    tags.forEach((m, i) => { const p = cerca[i]; m.visible = !!p; if (!p) return; const q = (S.reloj * 1.6 + i * .3) % 1; m.position.set(p.x, .05, p.z); m.scale.setScalar(1 + q * .9); m.material.opacity = (1 - q) * .9 * k; });
  }
  let ultRiesgo = -9; const alertasA = [];
  function pintarAntes(S) {
    // sin Neisstech, cada vez que un equipo pasa a menos de 2,6 m de una persona es un casi-accidente
    for (const r of S.riesgos) if (S.reloj - ultRiesgo > .8 && !alertasA.some((a) => Math.hypot(a.x - r.x, a.z - r.z) < 3 && S.reloj - a.t < 2.6)) { alertasA.push({ ...r, t: S.reloj }); ultRiesgo = S.reloj; }
    while (alertasA.length && S.reloj - alertasA[0].t > 2.6) alertasA.shift();
    anillos.forEach((m, i) => { const a = alertasA[i]; m.visible = !!a; if (!a) return; const t = (S.reloj - a.t), p = (t * 1.4) % 1; m.position.set(a.x, .04, a.z); m.scale.setScalar((a.fuerte ? 1.6 : 1) * (1 + p * 1.4)); m.material.opacity = (1 - t / 2.6) * (1 - p) * .9; });
  }

  /* ── cámara ── */
  let toma = { ...TOMAS[op.toma || 'planta'] }, desde = { ...toma }, hacia = { ...toma }, kTrans = 1, giro = 0, acerca = 1;
  const auto = op.vista === 'completa' && !op.quieta; let iTour = 0, tTour = 0, manual = 0;
  function ir(nombre, inst) { const t = TOMAS[nombre]; if (!t) return; desde = { ...toma }; hacia = { ...t }; kTrans = inst ? 1 : 0; if (inst) toma = { ...t }; }
  function cam(dt) {
    if (kTrans < 1) { kTrans = Math.min(1, kTrans + dt / 2.6); const e = eio(kTrans); toma = Object.fromEntries(Object.keys(hacia).map((c) => [c, lerp(desde[c] ?? (c === 'y' ? 0 : 38), hacia[c], e)])); }
    if (auto && manual <= 0) { tTour += dt; if (tTour > (iTour === 0 ? 7 : 9)) { tTour = 0; iTour = (iTour + 1) % RECORRIDO.length; ir(RECORRIDO[iTour]); } }
    manual -= dt;
    k.fijar({ ...toma, az: toma.az + giro, zoom: toma.zoom * acerca });
  }
  // arrastrar para girar · rueda para acercar
  { let x0 = null; const el = k.lienzo;
    if (op.interactiva) {
      el.style.touchAction = 'pan-y';
      el.addEventListener('pointerdown', (e) => { if (e.target.closest?.('[data-divisor]')) return; x0 = e.clientX; manual = 20; });
      addEventListener('pointerup', () => (x0 = null));
      addEventListener('pointermove', (e) => { if (x0 == null) return; giro = clamp(giro + (e.clientX - x0) * .18, -60, 60); x0 = e.clientX; });
      el.addEventListener('wheel', (e) => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); acerca = clamp(acerca * (1 + e.deltaY * .0015), .45, 1.6); manual = 20; }, { passive: false });
    } }

  /* ── ciclo ── */
  const G = H.grupos;
  // niveles de capa 0..1: sin recorrido, todo encendido en «después» y apagado en «antes»; con recorrido, los fija op.capas
  let enAntes = false, niveles = op.capasIni ?? null, verAlertas = op.alertasIni ?? null;
  const lv = (n) => (niveles ? (niveles[n] ?? 0) : enAntes ? 0 : 1);
  const crece = (g, q) => { g.visible = q > .004; g.scale.y = Math.max(.001, eio(clamp(q))); };
  function aplicarCapas() {
    for (const [n, c] of Object.entries(H.capas)) {
      const q = n.endsWith('Antes') ? 1 - lv(n.slice(0, -5)) : lv(n);
      crece(c.g, q); if (c.v) crece(c.v, q);
    }
    for (const a of simD.vehiculos) if (a.m.cams) { const on = lv('theia') > .5; a.m.cams.visible = on; a.m.spot.visible = on; }
    if (pisoCapas) { const q = ['pisoSenderos', 'pisoCalles', 'pisoUbic'].map(lv); pisoCapas.forEach((m, i) => { m.material.opacity = q[i]; m.visible = q[i] > .01; }); H.pisoA.visible = true; H.pisoA.material.opacity = 1 - Math.max(...q); }
    else { const q = lv('demarcacion'); H.pisoD.visible = q > .01; H.pisoD.material.opacity = q; H.pisoA.visible = q < .99; H.pisoA.material.opacity = 1 - q; }
  }
  function modo(m) {
    enAntes = m !== 'd';
    G.neiss.visible = G.vivo.visible = true; proy.visible = !enAntes;
    G.desorden.visible = alertas.visible = verAlertas ?? enAntes;
    aplicarCapas();
  }
  let activo = true, raf = 0, ultimo = performance.now(), divisor = op.comparar ?? null;
  k.medir();
  // calentar la simulación para que la planta ya esté «andando» al aparecer
  for (let i = 0; i < 20 * 12; i++) simD.paso(1 / 20);
  function cuadro(ahora) {
    const dt = Math.min(.05, (ahora - ultimo) / 1000); ultimo = ahora;
    simD.paso(dt); pintarEquipos(simD); pintarAntes(simD); pintarTags(simD);
    cam(dt);
    const R = k.render;
    if (divisor != null) {
      const W = k.W, Hh = k.H, cx = Math.round(W * divisor);
      R.setScissorTest(true);
      modo('a'); R.setScissor(0, 0, cx, Hh); R.render(k.escena, k.camara);
      modo('d'); R.setScissor(cx, 0, W - cx, Hh); R.render(k.escena, k.camara);
      R.setScissorTest(false);
    } else { modo('d'); R.render(k.escena, k.camara); }
    if (op.alCuadro) op.alCuadro(toma, kTrans);
  }
  const bucle = (t) => { if (!activo) { raf = 0; return; } raf = requestAnimationFrame(bucle); cuadro(t); };
  new ResizeObserver(() => { k.medir(); if (!raf) cuadro(performance.now()); }).observe(cont);
  cuadro(performance.now());
  return {
    listo: Promise.all(k.pendientes),
    activo(si) { activo = si; if (si && !raf) { ultimo = performance.now(); raf = requestAnimationFrame(bucle); } },
    ir(n) { manual = 30; ir(n); iTour = Math.max(0, RECORRIDO.indexOf(n)); tTour = 0; },
    comparar(f) { divisor = f; },
    // recorridos: niveles de capa (objeto nombre → 0..1), alertas de «antes» y toma de cámara fijados desde fuera
    capas(obj, alertasAntes) { niveles = obj; verAlertas = alertasAntes; },
    toma(t) { toma = { ...toma, ...t }; desde = hacia = { ...toma }; kTrans = 1; manual = 1e9; },
    tomas: RECORRIDO,
    sim: simD, simA, H, k,
  };
}
