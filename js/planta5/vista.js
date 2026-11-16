/* Planta Neisstech v5 · vista (12-nov-2026). montar(cont, op) → { listo, activo(bool), modo(m), ir(id|toma),
   escena(id), detener(), escenas, proyectar(x,y,z), eventos(), estado() }.
   El cambio de modo ya no funde: la demarcación se «aplica» desde un punto hacia afuera (barrido) y los equipos
   Neisstech crecen detrás; al volver al antes, el barrido se recoge. Las mini escenas (escenas.js) usan el mismo
   mecanismo: muestran el problema, barren hacia el después y muestran la solución funcionando. */
import { THREE, nucleo, clamp, lerp, eio, suave } from '../planta/nucleo.js';
import { construir } from './escena.js';
import { crearSim } from './sim.js';
import { crearEscenas } from './escenas.js?v=22';
import * as P from './trazado.js';

export async function montar(cont, op = {}) {
  // el piso se pinta con Poppins: esperar la fuente (máx. 1,5 s) para que los rótulos no salgan en Arial
  try { await Promise.race([document.fonts.load('600 40px Poppins'), new Promise((r) => setTimeout(r, 1500))]); } catch { /* sin fuentes */ }
  const k = nucleo(cont, op), H = construir(k);
  for (const g of [H.base, H.neiss, H.desorden]) k.fusionar(g);
  const S = crearSim(k, H), ES = crearEscenas(k, H, S);

  /* ── barrido de la demarcación: el piso del después aparece dentro de un círculo que crece ── */
  const uBarrido = { uCentro: { value: new THREE.Vector2(P.TOMA_PLANTA.x, P.TOMA_PLANTA.z) }, uRadio: { value: 0 } };
  H.matPisoD.transparent = true; H.matPisoD.opacity = 1;
  H.matPisoD.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uBarrido);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vPisoXZ;').replace('#include <project_vertex>', '#include <project_vertex>\nvPisoXZ = (modelMatrix * vec4(transformed, 1.0)).xz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vPisoXZ; uniform vec2 uCentro; uniform float uRadio;')
      .replace('#include <dithering_fragment>', '#include <dithering_fragment>\nfloat dB = distance(vPisoXZ, uCentro); gl_FragColor.a *= 1.0 - smoothstep(uRadio - 2.5, uRadio, dB);\nfloat borde = smoothstep(uRadio - 2.5, uRadio - 1.2, dB) * (1.0 - smoothstep(uRadio - 1.2, uRadio, dB)); gl_FragColor.rgb += vec3(.35, .28, 0.) * borde * step(.5, uRadio) * step(uRadio, 150.);');
  };
  H.matPisoD.needsUpdate = true;
  const RMAX = 160;

  /* ── anillos de los avisos: rojos (antes) y azules (después) ── */
  const alertas = k.grupo(); alertas.userData.vivo = true;
  const anillos = Array.from({ length: 8 }, () => { const m = new THREE.Mesh(new THREE.RingGeometry(.6, .8, 48), new THREE.MeshBasicMaterial({ color: 0xFF3B3B, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.renderOrder = 8; alertas.add(m); return m; });
  function pintarAlertas() {
    anillos.forEach((m, i) => { const e = S.eventos[S.eventos.length - 1 - i]; m.visible = !!e; if (!e) return;
      const t = S.reloj - e.t, p = (t * 1.4) % 1; m.material.color.setHex(e.bien ? 0x2F86FF : 0xFF3B3B);
      m.position.set(e.x, (e.y > 2 ? 0 : P.suelo(e.x, e.z)) + .06, e.z); m.scale.setScalar((e.tipo === 'casi' ? 1 : 1.4) * (1 + p * 1.6)); m.material.opacity = Math.max(0, 1 - t / 3.2) * (1 - p) * .95; });
  }

  /* ── equipos Neisstech según el estado de la simulación (o de la escena que corre) ── */
  let plumaK = 0; const andonT = H.andon.map((_, i) => ({ t: 3 + i * 1.7, s: 'v' }));
  function pintarEquipos(dt) {
    const t = S.reloj, des = S.modo === 'despues';
    for (const [id, c] of Object.entries(H.cruces)) { const s = S.cruces[id]; if (!s) continue; const rojo = s.kVeh > .5;
      for (const p of c.puertas) { p.k = clamp((p.k ?? 0) + (rojo ? -dt * 2.4 : dt * 1.5)); p.abrir(eio(p.k)); p.rojo.emissiveIntensity = rojo ? 2.6 : .05; p.verde.emissiveIntensity = rojo ? .05 : 2.4; }
      for (const a of c.ampels) { a.r.emissiveIntensity = rojo ? 2.4 : .05; a.v.emissiveIntensity = rojo ? .05 : 2.2; }
      for (const se of c.sensores) se.led.emissiveIntensity = s.vehCerca ? (Math.sin(t * 10) > 0 ? 2.6 : .3) : .6;
      if (c.holo) { const q = suave(clamp(s.kVeh)); c.holo.cebra.pintar(des ? 1 - q : 0, t); c.holo.tri.pintar(des ? q : 0, t);
        c.holo.kb.ojo.emissiveIntensity = rojo ? (Math.sin(t * 8) > 0 ? 2.8 : .6) : .15; c.holo.kb.lente.emissiveIntensity = des ? 2.2 : 0; } }
    for (const [id, g] of Object.entries(H.sg)) { const s = S.sg[id]; g.piv.rotation.z = s.ang; const fl = s.alarma && Math.sin(t * 18) > 0; g.balizas.forEach((m) => (m.emissiveIntensity = s.alarma ? .2 + 3.4 * fl : .12)); }
    const dock = S.dockForzado ?? S.dockN2;
    for (const [id, d] of Object.entries(H.docks)) { const ok = id === 'N1' || dock === 'atracado';
      d.dentro.v.emissiveIntensity = ok ? 2.4 : .05; d.dentro.r.emissiveIntensity = ok ? .05 : 2.4; d.fuera.r.emissiveIntensity = ok ? 2.4 : .05; d.fuera.v.emissiveIntensity = ok ? .05 : 2.4;
      d.k = clamp((d.k ?? 1) + (ok ? dt * 1.4 : -dt)); d.cuna.position.x = lerp(d.x + 1.85, d.x + 1.0, eio(d.k)); if (d.led) { d.led.emissive.setHex(d.k > .95 ? 0x22C55E : 0xFF3B3B); d.led.emissiveIntensity = 2.2; } }
    for (const r of H.radares) r.r.mostrar(S.radar[r.carril] ?? null, 10);
    { const t2 = S.vehiculos[0], cerca = !t2.oculto && !t2.res && Math.hypot(t2.x - 112.6, t2.z + 4.9) < 13; plumaK = clamp(plumaK + (cerca ? dt * 1.2 : -dt * .8)); H.pluma.brazo.rotation.z = eio(plumaK) * Math.PI * .47; H.pluma.bal.emissiveIntensity = cerca ? (Math.sin(t * 9) > 0 ? 2.4 : .3) : .2; }
    // cámara de frío: puerta, baliza, advertencia proyectada y vapor frío que sale
    const q = eio(S.puertaFria); H.frio.abrir(q); H.frio.luz.emissiveIntensity = q > .05 ? (Math.sin(t * 8) > 0 ? 2.6 : .4) : .6;
    H.frio.luz.emissive.setHex(q > .05 ? 0xFF8A1F : 0x22C55E); H.frio.copo.d.pintar(des ? q : 0, t); H.frio.copo.p.vidrio.emissiveIntensity = des ? 2.2 * q : 0;
    for (const v of H.frio.vapor) { v.t = (v.t + dt * .45) % 1; const u = v.t; v.m.position.set(P.FRIO.x0 - .3 - u * 2.2, .3 + u * 1.3 + Math.sin(u * 6 + v.m.id) * .15, P.FRIO.puerta.z + (v.m.id % 5 - 2) * .25 + u * .3); v.m.scale.setScalar(.5 + u * 1.6); v.m.material.opacity = q * .38 * Math.sin(u * Math.PI); v.m.visible = q > .02; }
    H.andon.forEach((a, i) => { const e = andonT[i]; e.t -= dt; if (e.t < 0) { e.s = Math.random() < .18 ? 'a' : 'v'; e.t = e.s === 'a' ? 4 : 6 + Math.random() * 10; } a.v.emissiveIntensity = e.s === 'v' ? 2.0 : .05; a.a.emissiveIntensity = e.s === 'a' ? (Math.sin(t * 6) > 0 ? 2.4 : .6) : .05; a.r.emissiveIntensity = .05; });
    H.robots.forEach((r, i) => { const u = t * .9 + i * 1.7, s = (Math.sin(u) + 1) / 2; r.base.rotation.y = lerp(-.7, 1.1, suave(s)); r.b1.rotation.z = -.3 - .2 * Math.sin(u * 2); r.b2.rotation.z = .5 + .3 * Math.sin(u * 2 + 1); r.baliza.emissiveIntensity = Math.sin(u * 6) > 0 ? 2 : .3; });
    for (const f of H.anim) f(t);
    { const E = H.envolvedora, gira = E.pal.visible && !S.env.listo; if (gira) E.plato.rotation.y += dt * 2.4; E.carro.position.y = gira ? .3 + (Math.sin(t * 1.3) + 1) * .5 : .3; }
  }

  /* ── modo: barrido de la demarcación + equipos que crecen ── */
  let modoAct = op.modo || 'antes', kD = modoAct === 'despues' ? 1 : 0, velB = 1 / 2.2;
  const crece = (g, q) => { g.visible = q > .004; g.scale.y = Math.max(.001, eio(clamp(q))); };
  function aplicar() { uBarrido.uRadio.value = eio(kD) * RMAX; H.pisoD.forEach((m) => (m.visible = kD > .002)); crece(H.neiss, clamp(kD * 2.2 - .25)); crece(H.desorden, clamp(1 - kD * 2.5)); }
  function ponerModo(m, centro, dur = 2.2) {
    if (m === modoAct) return; modoAct = m; velB = 1 / dur;
    if (centro) uBarrido.uCentro.value.set(centro[0], centro[1]); else uBarrido.uCentro.value.set(toma.x + panX, toma.z + panZ);
    if (S.pausada) { S.modo = m; S.pausar(true); } else S.reiniciar(m);   // en las demostraciones la simulación no se reinicia
  }

  /* ── cámara: planta completa, una toma o la de una escena; arrastrar gira, ctrl/⌘ + rueda acerca ── */
  let zoomVis = 20;
  const TP = P.TOMA_PLANTA; let toma = { y: 0, ...TP }, desde = { ...toma }, hacia = { ...toma }, kT = 1, giro = 0, acerca = 1, vaiven = 0, enPunto = false;
  S.reiniciar(modoAct); if (op.demo !== false) S.pausar(true); aplicar();
  let panX = 0, panZ = 0;
  function ir(dest) { const pt = typeof dest === 'string' ? P.PUNTOS.find((p) => p.id === dest)?.toma : dest; enPunto = !!pt; toma = { ...toma, x: toma.x + panX, z: toma.z + panZ }; panX = panZ = 0; desde = { ...toma }; hacia = { y: 0, ...(pt || TP) }; kT = 0; }
  const el = k.lienzo; let x0 = null;
  if (op.interactiva !== false) {
    el.style.touchAction = 'pan-y'; el.style.pointerEvents = 'auto';
    // arrastrar = desplazarse por la planta; la rotación queda fija (solo el vaivén suave)
    let y0 = null;
    el.addEventListener('pointerdown', (e) => { x0 = e.clientX; y0 = e.clientY; op.alTocar?.(); });
    addEventListener('pointerup', () => (x0 = null)); addEventListener('pointercancel', () => (x0 = null));
    addEventListener('pointermove', (e) => { if (x0 == null) return; const dx = e.clientX - x0, dy = e.clientY - y0; x0 = e.clientX; y0 = e.clientY;
      const u = 2 * zoomVis / Math.max(1, k.H), a = (toma.az) * Math.PI / 180, se = Math.sin((toma.el ?? 40) * Math.PI / 180);
      panX += (-Math.cos(a) * dx - Math.sin(a) * dy / se) * u; panZ += (Math.sin(a) * dx - Math.cos(a) * dy / se) * u;
      const cx = toma.x + panX, cz = toma.z + panZ; panX += clamp(cx, 40, 112) - cx; panZ += clamp(cz, 0, 62) - cz; });
    // la rueda sola desplaza la página; ⌘/Ctrl + rueda (o el pellizco del trackpad) acerca y aleja. En pantalla completa,
    // la rueda sola acerca (13-nov: Max quedaba atrapado en la planta al hacer scroll)
    el.addEventListener('wheel', (e) => { const full = !!document.fullscreenElement || cont.closest('.cmp')?.classList.contains('is-grande');
      if (!full && !e.ctrlKey && !e.metaKey) { (op.alRueda || api?.alRueda)?.(); return; }
      e.preventDefault(); acerca = clamp(acerca * (1 + e.deltaY * (e.ctrlKey && !full ? .01 : .0015)), .45, 1.6); op.alTocar?.(); }, { passive: false });
  }
  function camara(dt) {
    // demostraciones: la cámara sigue suave la toma que pide la escena
    const te = seguir && ES.toma(); if (te) { const f = 1 - Math.exp(-dt * 2.8); for (const c of ['x', 'z', 'zoom', 'az', 'el', 'y']) { const m = c === 'zoom' && te.zoom ? te.zoom * (api?.zoomEscena ?? 1) : te[c]; toma[c] = lerp(toma[c] ?? m ?? 0, m ?? (c === 'y' ? 0 : toma[c]), f); }
      if (api?.desplazaEscena != null) { toma.desplaza = lerp(toma.desplaza ?? 0, api.desplazaEscena, f); } }
    else if (kT < 1) { kT = Math.min(1, kT + dt / 1.9); const e = eio(kT); toma = Object.fromEntries(Object.keys(hacia).map((c) => [c, lerp(desde[c] ?? hacia[c], hacia[c], e)])); }
    vaiven += dt;
    const asp = k.W / Math.max(1, k.H), az = toma.az + giro + Math.sin(vaiven * .25) * 1.4;
    let zoom = toma.zoom * acerca, x = toma.x + panX, z = toma.z + panZ;
    if (asp < 1.4) zoom *= Math.min(2, (enPunto ? 1.1 : 1.32) / asp);
    if (asp < 1 && enPunto) { const d = .2 * zoom / Math.sin((toma.el ?? 40) * Math.PI / 180); x += Math.sin(az * Math.PI / 180) * d; z += Math.cos(az * Math.PI / 180) * d; }
    const sac = ES.E.sacudida; if (sac > .01) { x += (Math.random() - .5) * sac * .5; z += (Math.random() - .5) * sac * .5; }
    zoomVis = zoom; k.fijar({ ...toma, x, z, az, zoom });
  }

  /* ── escenas ── */
  let escAct = null, api = null, seguir = false; const avisa = (id, f) => (op.alEscena || api?.alEscena)?.(id, f);
  function escena(id) { const d = ES.lista.find((q) => q.id === id); if (!d) return; escAct = id; if (!S.pausada) S.pausar(true); ponerModo('antes', d.barrido, 1.2); ES.iniciar(id, 'antes'); seguir = true; enPunto = true; toma = { ...toma, x: toma.x + panX, z: toma.z + panZ }; panX = panZ = 0; kT = 1; avisa(id, 'antes'); }
  function detener() { ES.detener(); escAct = null; seguir = false; }

  /* ── ciclo ── */
  const velo = document.createElement('div'); velo.style.cssText = 'position:absolute;inset:0;pointer-events:none;opacity:0;transition:none'; cont.append(velo);
  let fq = 0, fx = -1, fy = 0, frr = 400; const vq = new THREE.Vector3();
  function pintarVelo(dt) { const fo = ES.foco(); fq += ((fo ? 1 : 0) - fq) * Math.min(1, dt * 2.5);
    if (fo) { vq.set(fo.x, fo.y || 0, fo.z).project(k.camara); const px = (vq.x * .5 + .5) * k.W, py = (-vq.y * .5 + .5) * k.H, rp = fo.r * k.H / (2 * zoomVis) * (k.W / k.H < 1 ? .6 : 1);
      const e = fx < 0 ? 1 : Math.min(1, dt * 4); fx = lerp(fx < 0 ? px : fx, px, e); fy = lerp(fy, py, e); frr = lerp(frr, rp, e); }
    velo.style.opacity = fq.toFixed(3); if (fq > .01) velo.style.background = `radial-gradient(circle ${Math.round(frr)}px at ${Math.round(fx)}px ${Math.round(fy)}px, rgba(10,14,22,0) 62%, rgba(10,14,22,${S.modo === 'antes' ? .34 : .46}) 100%)`; }
  let activo = true, raf = 0, ultimo = performance.now();
  k.medir();
  function cuadro(ahora) {
    const dt = Math.min(.05, (ahora - ultimo) / 1000); ultimo = ahora;
    const obj = modoAct === 'despues' ? 1 : 0; if (kD !== obj) { kD = obj > kD ? Math.min(1, kD + dt * velB) : Math.max(0, kD - dt * velB * 1.6); aplicar(); }
    const dE = dt * ES.escala(dt);   // cámara lenta en el momento clave de una demostración
    S.paso(dE);
    const r = ES.paso(dE);
    if (r === 'fase' && api.retener) { ES.congelar(); avisa(escAct, 'antesFin'); }   // la presentación decide cuándo pasa al después
    else if (r === 'fase') { const d = ES.lista.find((q) => q.id === escAct); ponerModo('despues', d.barrido, 2.0); ES.fase('despues'); avisa(escAct, 'despues'); }
    else if (r === 'fin') { const id = escAct; if (!api.retener) escAct = null; avisa(id, 'fin'); }
    pintarEquipos(dE); pintarAlertas(); camara(dt); pintarVelo(dt);
    k.render.render(k.escena, k.camara);
    op.alCuadro?.();
  }
  const bucle = (t) => { if (!activo) { raf = 0; return; } raf = requestAnimationFrame(bucle); cuadro(t); };
  new ResizeObserver(() => { k.medir(); if (!raf) cuadro(performance.now()); }).observe(cont);
  cuadro(performance.now());
  const v3 = new THREE.Vector3();
  return api = {
    listo: Promise.all(k.pendientes), puntos: P.PUNTOS, escenas: ES.lista, sim: S, H, k, ES,
    activo(si) { activo = si; if (si && !raf) { ultimo = performance.now(); raf = requestAnimationFrame(bucle); } },
    // simulación: deja de estar en pausa y parte con la conducta de ese modo
    modo(m) { detener(); if (S.pausada) { S.pausada = false; S.modo = modoAct; } const antes = modoAct; ponerModo(m); if (antes === m) S.reiniciar(m); S.pausar(false); },
    ir(dest) { if (escAct && S.pausada === false) detener(); ir(dest); },
    escena, detener,
    // presentación: pasa la escena actual al después (con el barrido) o la repite desde una fase
    despues() { if (!escAct) return; const d = ES.lista.find((q) => q.id === escAct); ponerModo('despues', d.barrido, 2.0); ES.fase('despues'); avisa(escAct, 'despues'); },
    repetir(f) { if (escAct) ES.fase(f); },
    // planta sin simulación (solo lo que la presentación pone en escena), en el modo pedido
    quieta(m) { detener(); escAct = null; if (!S.pausada) S.pausar(true); ponerModo(m); },
    // navegación simple: acercar/alejar con botones y volver a la vista inicial
    acercar(f) { acerca = clamp(acerca * f, .45, 1.6); },
    restablecer() { acerca = 1; giro = 0; },
    girar(g) { giro = clamp(giro + g, -75, 75); },
    estado: () => ({ modo: modoAct, escena: ES.activa() }),
    proyectar(x, y, z) { v3.set(x, y, z).project(k.camara); return [(v3.x * .5 + .5) * k.W, (-v3.y * .5 + .5) * k.H, Math.abs(v3.x) < 1.02 && Math.abs(v3.y) < 1.02]; },
    eventos: () => S.eventos.filter((e) => (S.modo === 'antes' ? !e.bien : !!e.bien)),
  };
}
