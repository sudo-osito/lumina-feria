/* Planta Neisstech · modelos (8-nov-2026). Cada modelo tiene su frente hacia +x local, apoya en y = 0 y devuelve lo
   que se anima. Medidas reales aproximadas (m). Lo amarillo, azul y luminoso es Neisstech; lo blanco/gris es la planta. */
import { THREE } from './nucleo.js';

export function modelos(k) {
  const { M, caja, cil, capsula, esfera, malla, barra, grupo, luz, std, tex, imagen } = k;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  /* ── personas ── (frente +x) ropa: 'operario' | 'oficina' | 'supervisor' */
  const ROPA = {
    operario: { torso: M.amarillo, casco: M.blanco }, supervisor: { torso: std(0xFF8A1F, { roughness: .5 }), casco: M.azul },
    oficina: { torso: M.camisa, casco: null }, visita: { torso: M.gris, casco: M.blanco },
  };
  const franjaRef = std(0xE9EEF5, { roughness: .3, metalness: .2 });
  function persona(tipo = 'operario', padre = k.escena) {
    const r = ROPA[tipo], g = grupo(0, 0, 0, 0, padre), c = grupo(0, 0, 0, Math.PI / 2, g);
    const pierna = (x) => { const p = grupo(x, .66, 0, 0, c); capsula(.085, .44, 0, -.3, 0, M.pantalon, p); caja(.15, .08, .26, 0, -.66, .04, M.negro, p, .03); return p; };
    const brazo = (x) => { const p = grupo(x, 1.2, 0, 0, c); capsula(.062, .36, 0, -.22, 0, r.torso, p); esfera(.06, 0, -.47, 0, M.piel, p, 10); return p; };
    const pi = pierna(-.1), pd = pierna(.1);
    capsula(.2, .32, 0, 1.0, 0, r.torso, c);
    if (r.torso === M.amarillo || tipo === 'supervisor') for (const y of [.86, 1.02]) { const o = cil(.205, .035, 0, y, 0, franjaRef, c, 18); o.castShadow = false; }
    esfera(.13, 0, 1.43, 0, M.piel, c);
    if (r.casco) { malla(new THREE.SphereGeometry(.15, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), r.casco, 0, 1.47, 0, c); cil(.175, .02, 0, 1.46, .02, r.casco, c, 16); }
    else malla(new THREE.SphereGeometry(.135, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2), M.tinta, 0, 1.45, -.01, c);
    const bi = brazo(-.27), bd = brazo(.27);
    return { g, c, pi, pd, bi, bd, tipo };
  }
  function andar(p, v, t) { const a = Math.sin(t * 8.2) * .55 * v; p.pi.rotation.x = a; p.pd.rotation.x = -a; p.bi.rotation.x = -a * .7; p.bd.rotation.x = a * .7; p.c.position.y = Math.abs(Math.cos(t * 8.2)) * .035 * v; }
  // brazos hacia adelante (empujar un carro / guiar una carga): ang = cuánto suben (rad), abre = separación
  function brazos(p, ang, abre = 0) { p.bi.rotation.x = p.bd.rotation.x = -ang; p.bi.rotation.z = abre; p.bd.rotation.z = -abre; }
  function sentar(p) { p.pi.rotation.x = p.pd.rotation.x = -1.45; p.c.position.y = -.42; }

  /* ── pallet con carga (1.0 × 1.15) ── */
  function pallet(padre, carga = 'caja', alto = .75) {
    const g = grupo(0, 0, 0, 0, padre);
    for (const z of [-.47, 0, .47]) caja(1.0, .1, .14, 0, 0, z, M.madera, g, .01);
    for (const x of [-.44, -.15, .15, .44]) caja(.12, .03, 1.12, x, .1, 0, M.madera, g, .005);
    if (carga === 'caja') { caja(.46, alto * .5, .54, -.24, .13, -.28, M.caja, g, .03); caja(.46, alto * .5, .54, .24, .13, -.28, M.caja2, g, .03); caja(.46, alto * .5, .54, -.24, .13, .28, M.caja2, g, .03); caja(.46, alto * .5, .54, .24, .13, .28, M.caja, g, .03);
      caja(.94, alto * .5, 1.1, 0, .13 + alto * .5, 0, M.caja, g, .04); }
    else if (carga === 'film') caja(.96, alto, 1.1, 0, .13, 0, M.film, g, .06);
    return g;
  }

  /* ── montacargas contrapesado (frente +x: horquillas). Largo 2.25, ancho 1.1. ── */
  function montacargas(padre = k.escena, op = {}) {
    const g = grupo(0, 0, 0, 0, padre), cuerpo = grupo(0, 0, 0, 0, g);
    const pintura = op.color ?? M.blanco;
    caja(1.5, .62, 1.06, -.3, .2, 0, pintura, cuerpo, .14);                         // chasis
    caja(.6, .9, 1.08, -.84, .2, 0, M.tinta, cuerpo, .16);                           // contrapeso
    caja(.46, .14, .52, -.36, .82, 0, M.negro, cuerpo, .06); caja(.1, .42, .5, -.6, .9, 0, M.negro, cuerpo, .04);   // asiento
    for (const [x, z] of [[-.78, -.47], [-.78, .47], [.32, -.47], [.32, .47]]) caja(.06, 1.22, .06, x, .82, z, M.tinta, cuerpo, .02);
    caja(1.18, .06, 1.02, -.23, 2.03, 0, pintura, cuerpo, .03);                      // techo de protección
    for (const [x, z] of [[-.68, -.55], [-.68, .55], [.38, -.55], [.38, .55]]) { const r = cil(.24, .2, x, 0, z, M.negro, cuerpo, 18); r.rotation.x = Math.PI / 2; r.position.y = .24; }
    caja(.12, .5, .1, .05, .82, .18, M.tinta, cuerpo, .03);                          // volante
    // operador sentado
    const op1 = persona(op.ropa || 'operario', cuerpo); op1.g.position.set(-.38, .3, 0); sentar(op1); brazos(op1, .9, 0);
    // mástil exterior + interior + carro
    for (const z of [-.3, .3]) caja(.09, 2.0, .09, .82, .18, z, M.acero, cuerpo, .02);
    caja(.09, .08, .7, .82, 2.1, 0, M.acero, cuerpo, .02);
    const interior = grupo(.86, 0, 0, 0, g); for (const z of [-.22, .22]) caja(.07, 1.9, .07, 0, .26, z, M.gris2, interior, .02); caja(.07, .07, .5, 0, 2.12, 0, M.gris2, interior, .02);
    const carro = grupo(.9, .1, 0, 0, g);
    caja(.06, .5, .9, 0, 0, 0, M.tinta, carro, .02);
    for (const z of [-.36, 0, .36]) caja(.04, .55, .04, .01, .5, z, M.tinta, carro, .01); caja(.05, .05, .9, .01, 1.03, 0, M.tinta, carro, .01);
    for (const z of [-.26, .26]) caja(1.05, .045, .11, .52, 0, z, M.acero, carro, .015);
    const carga = pallet(carro); carga.position.set(.56, .045, 0); carga.visible = false;
    const balMat = luz(0xFF8A1F, 0x6b3a10); cil(.07, .12, -.6, 2.06, 0, balMat, cuerpo, 12);
    // luz azul de advertencia proyectada al piso, adelante
    const spot = new THREE.Mesh(new THREE.CircleGeometry(.32, 28), new THREE.MeshBasicMaterial({ color: 0x3B8BFF, transparent: true, opacity: .55, depthWrite: false, toneMapped: false }));
    spot.rotation.x = -Math.PI / 2; spot.position.set(3.4, .016, 0); spot.renderOrder = 3; g.add(spot);
    // THEIA CAM 360: cámaras en las 4 esquinas del techo
    const cams = grupo(0, 0, 0, 0, g); for (const [x, z] of [[.33, .5], [.33, -.5], [-.8, .5], [-.8, -.5]]) { caja(.1, .07, .1, x, 2.06, z, M.negro, cams, .02); esfera(.03, x + Math.sign(x + .2) * .05, 2.1, z, M.azul, cams, 8); }
    let alza = 0;
    // mástil telescópico: el interior sube a la mitad de la velocidad del carro y nunca se despega del exterior (13-nov)
    const levantar = (m) => { alza = m; carro.position.y = .1 + m; interior.position.y = Math.min(1.7, Math.max(0, m * .55)); };
    // altura máxima de lo que va adelante (mástil / carga) y su frente, en coordenadas locales
    const techo = () => Math.max(2.14 + Math.min(1.7, Math.max(0, alza * .55)), carga.visible ? .1 + alza + .045 + .13 + .75 : 0);
    const frente = () => (carga.visible ? .9 + .56 + .5 : 1.45);
    return { g, cuerpo, carro, interior, carga, balMat, spot, cams, levantar, techo, frente, op: op1 };
  }

  /* ── tren logístico: tractor + carros de kitting (cada pieza en su propio grupo) ── */
  function tractor(padre = k.escena) {
    const g = grupo(0, 0, 0, 0, padre);
    caja(1.3, .55, .82, 0, .14, 0, M.azul, g, .14); caja(.5, .32, .7, .38, .69, 0, M.blanco, g, .1);
    for (const [x, z] of [[-.4, -.38], [-.4, .38], [.42, -.38], [.42, .38]]) { const r = cil(.16, .16, x, 0, z, M.negro, g, 14); r.rotation.x = Math.PI / 2; r.position.y = .16; }
    const p = persona('operario', g); p.g.position.set(-.22, .25, 0); sentar(p); brazos(p, .8);
    const balMat = luz(0xFF8A1F, 0x6b3a10); cil(.05, .12, -.55, .69, 0, balMat, g, 10); cil(.012, .5, -.55, .2, 0, M.tinta, g, 6);
    caja(.3, .06, .08, -.8, .2, 0, M.tinta, g, .02);
    return { g, balMat, largo: 1.3, op: p };
  }
  const BIN = [M.azul, M.azulClaro, M.amarillo, M.rojo];
  function carroKitting(padre = k.escena, color = M.azul) {
    const g = grupo(0, 0, 0, 0, padre), bins = [];
    for (const y of [.28, .72]) { caja(1.15, .04, .66, 0, y, 0, M.gris, g, .02); for (const x of [-.36, 0, .36]) bins.push(caja(.3, .22, .5, x, y + .04, 0, color, g, .05)); }
    for (const [x, z] of [[-.55, -.3], [.55, -.3], [-.55, .3], [.55, .3]]) { caja(.04, .95, .04, x, .08, z, M.gris2, g, .015); const r = cil(.07, .06, x, 0, z, M.negro, g, 10); r.rotation.x = Math.PI / 2; r.position.y = .07; }
    caja(.04, .04, .6, -.62, 1.02, 0, M.gris2, g, .01); for (const z of [-.28, .28]) caja(.1, .04, .04, -.58, 1.02, z, M.gris2, g, .01);   // manilla atrás (−x)
    caja(.36, .05, .06, .74, .2, 0, M.tinta, g, .02);                                // lanza de enganche adelante
    return { g, bins, largo: 1.25 };
  }

  /* ── camión (frente +x = cabina). Largo total 9.4: remolque 7 + cabina 2.4. Origen = centro del remolque. ── */
  function camion(padre = k.escena) {
    const g = grupo(0, 0, 0, 0, padre);
    const panel = std(0xDDE3EA);   // remolque hueco: piso, techo, laterales y frente (la grúa entra por atrás)
    caja(7.0, .1, 2.45, 0, 1.08, 0, M.gris2, g, .02); caja(7.0, .1, 2.45, 0, 3.6, 0, panel, g, .03);
    for (const s of [-1, 1]) caja(7.0, 2.42, .06, 0, 1.18, s * 1.195, panel, g, .02);
    caja(.06, 2.42, 2.45, 3.47, 1.18, 0, panel, g, .02); caja(7.05, .12, 2.5, 0, .96, 0, M.tinta, g, .03);
    for (const s of [-1, 1]) caja(.08, 2.6, .1, -3.5, 1.08, s * 1.2, M.tinta, g, .02);
    caja(2.2, 2.35, 2.4, 4.75, .62, 0, M.azul, g, .25); caja(.06, .8, 2.0, 5.86, 1.85, 0, M.tinta, g, .02); caja(.8, .9, 2.42, 4.0, 2.95, 0, M.azul, g, .2);
    const ruedas = []; for (const x of [-2.9, -1.3, 3.4, 5.0]) for (const z of [-1.08, 1.08]) { const r = cil(.48, .32, x, 0, z, M.negro, g, 18); r.rotation.x = Math.PI / 2; r.position.y = .48; ruedas.push(r); }
    const p = persona('oficina', g); p.g.position.set(4.9, 1.1, -.45); sentar(p); brazos(p, .9);
    return { g, ruedas, largo: 9.4 };
  }

  /* ═════════════ Neisstech: gestión de tráfico ═════════════ */
  // base de montaje colgada de una viga de techo; los proyectores cuelgan de la base y apuntan a un punto del piso
  const vigaM = std(0xC5CCD6, { roughness: .6, metalness: .2 });
  function viga(x0, z0, x1, z1, y = 6.2) { const g = grupo(0, 0, 0, 0); const L = Math.hypot(x1 - x0, z1 - z0); const o = caja(L, .3, .16, (x0 + x1) / 2, y, (z0 + z1) / 2, vigaM, g, .01); o.rotation.y = -Math.atan2(z1 - z0, x1 - x0); return g; }
  function proyector(padre, x, y, z, apunta, color = M.azul) {
    const g = grupo(x, y, z, 0, padre);
    const cuerpo = new THREE.Group(); g.add(cuerpo);
    caja(.42, .26, .3, -.05, -.13, 0, color, cuerpo, .07); for (let i = 0; i < 5; i++) caja(.03, .05, .28, -.2 + i * .06, .13, 0, M.gris2, cuerpo, .01);
    const lente = cil(.08, .08, .2, -.04, 0, M.negro, cuerpo, 16); lente.rotation.z = -Math.PI / 2; lente.position.set(.2, 0, 0);
    const vidrio = luz(0xFFF4C2, 0x777766); const v = cil(.06, .01, .29, -.03, 0, vidrio, cuerpo, 16); v.rotation.z = -Math.PI / 2; v.position.set(.285, 0, 0);
    caja(.05, .22, .05, -.05, 0, 0, M.tinta, g, .01);       // horquilla
    // orientar: el lente (+x local del cuerpo) mira al punto del piso
    if (apunta) { const w = new THREE.Vector3(); g.updateMatrixWorld(true); g.getWorldPosition(w); const d = apunta.clone().sub(w);
      cuerpo.rotation.order = 'YZX'; cuerpo.rotation.set(0, Math.atan2(-d.z, d.x), Math.atan2(d.y, Math.hypot(d.x, d.z))); }
    return { g, vidrio, lente: () => { const w = new THREE.Vector3(.33, -.03, 0); cuerpo.localToWorld(w); return w; } };
  }
  function base(padre, x, z, y = 6.05, largo = .9) { const g = grupo(x, y, z, 0, padre); caja(largo, .06, .3, 0, 0, 0, M.tinta, g, .01); cil(.022, 7.4 - y, 0, .06, 0, M.gris2, g, 8); return g; }

  // X-KUBE / gestor de tráfico colgado: caras con luz roja/verde hacia cada vía
  function gestor(padre, x, y, z, caras) {
    const g = grupo(x, y, z, 0, padre); cil(.03, 7.4 - y, 0, 0, 0, M.gris2, g, 8);
    caja(.56, .5, .56, 0, -.5, 0, M.blanco, g, .14); caja(.6, .08, .6, 0, -.52, 0, M.azul, g, .03);
    const luces = caras.map((ang) => { const f = grupo(0, -.25, 0, ang, g); caja(.04, .34, .2, .29, -.17, 0, M.negro, f, .02);
      const r = luz(0xFF3B3B, 0x4a1515), v = luz(0x22C55E, 0x123a20); const lr = esfera(.06, .31, .06, 0, r, f, 12), lv = esfera(.06, .31, -.08, 0, v, f, 12); return { r, v }; });
    return { g, luces };
  }
  // sensor de montacargas: caja con domo en ménsula (discrimina equipos de personas)
  function sensor(padre, x, y, z, ry) {
    const g = grupo(x, y, z, ry, padre); caja(.12, .04, .04, -.06, 0, 0, M.tinta, g, .01);
    caja(.12, .14, .14, .02, -.07, 0, M.blanco, g, .03); const led = luz(0x3B8BFF, 0x1a2a55); esfera(.035, .09, 0, 0, led, g, 10);
    return { g, led };
  }
  // puerta peatonal automatizada: poste con semáforo y botón + hoja tubular amarilla (bisagra en el origen, hoja hacia +x)
  function puerta(padre, x, z, ry, ancho = .85) {
    const g = grupo(x, 0, z, ry, padre);
    caja(.14, 1.25, .14, 0, 0, 0, M.amarillo, g, .04); caja(.2, .02, .2, 0, 0, 0, M.negro, g, .01);
    caja(.16, .34, .14, 0, 1.25, 0, M.negro, g, .04);
    const r = luz(0xFF3B3B, 0x4a1515), v = luz(0x22C55E, 0x123a20); esfera(.05, 0, 1.5, .08, r, g, 10); esfera(.05, 0, 1.36, .08, v, g, 10);
    caja(.09, .12, .05, 0, .98, .09, M.blanco, g, .02); const boton = luz(0x3B8BFF, 0x1a2a55); cil(.025, .02, 0, 1.03, .12, boton, g, 10).rotation.x = Math.PI / 2;
    // dos hojas que se abren hacia el lado −z local (hacia dentro del cruce): izquierda con bisagra en x≈0, derecha en x≈ancho
    const L = ancho / 2 - .12;
    const hoja = (x0, s) => { const h = grupo(x0, 0, 0, 0, g); for (const y of [.25, .62, .98]) caja(L, .045, .045, s * L / 2, y, 0, M.amarillo, h, .02);
      caja(.05, .85, .05, s * (L - .03), .2, 0, M.amarillo, h, .02); caja(.05, .85, .05, s * .03, .2, 0, M.amarillo, h, .02); return h; };
    const hi = hoja(.1, 1), hd = hoja(ancho + .02, -1);
    caja(.12, 1.25, .12, ancho + .12, 0, 0, M.amarillo, g, .04); caja(.2, .02, .2, ancho + .12, 0, 0, M.negro, g, .01);
    caja(.1, .12, .06, ancho / 2, .62, -.04, M.tinta, g, .02);   // electroimán
    const abrir = (k, dir = 1) => { hi.rotation.y = dir * k * Math.PI / 2; hd.rotation.y = -dir * k * Math.PI / 2; };
    return { g, hi, hd, r, v, boton, abrir, ancho };
  }
  // barrera peatonal de polímero: postes cada ~1.4 m y dos rieles
  function barrera(padre, x0, z0, x1, z1, alto = 1.1, rieles = 2) {
    const g = grupo(0, 0, 0, 0, padre), L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.4)), ry = -Math.atan2(z1 - z0, x1 - x0);
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; cil(.12, .025, x, 0, z, M.negro, g, 14); cil(.065, alto, x, .025, z, M.amarillo, g, 14); cil(.072, .05, x, alto * .82, z, M.negro, g, 14); }
    for (let r = 0; r < rieles; r++) { const y = rieles === 1 ? alto * .7 : alto * (.45 + .45 * r / (rieles - 1)); const o = caja(L, .08, .08, (x0 + x1) / 2, y - .04, (z0 + z1) / 2, M.amarillo, g, .04); o.rotation.y = ry; }
    return g;
  }
  function protectorColumna(padre, x, z, lado = .36) {
    const g = grupo(x, 0, z, 0, padre); caja(lado + .2, 1.2, lado + .2, 0, 0, 0, M.amarillo, g, .1);
    for (const y of [.2, .55, .9]) caja(lado + .22, .1, lado + .22, 0, y, 0, M.negro, g, .04); return g;
  }
  function protectorRack(padre, x0, x1, z) {   // cabecera de rack: barrera baja en U frente al pasillo principal
    const g = grupo(0, 0, 0, 0, padre); for (const x of [x0, x1]) { cil(.1, .02, x, 0, z, M.negro, g, 12); cil(.06, .5, x, 0, z, M.amarillo, g, 12); }
    caja(x1 - x0, .14, .1, (x0 + x1) / 2, .3, z, M.amarillo, g, .05); for (const x of [x0 + .2, x1 - .2]) caja(.24, .38, .2, x, 0, z - .28, M.amarillo, g, .07); return g;
  }
  const bolardo = (padre, x, z) => { const g = grupo(x, 0, z, 0, padre); cil(.1, .9, 0, 0, 0, M.amarillo, g, 14); cil(.105, .06, 0, .7, 0, M.negro, g, 14); cil(.15, .02, 0, 0, 0, M.negro, g, 14); return g; };

  // Safety Gate: tubo de PVC amarillo colgado de dos cables frente al portón, balizas enjauladas en los extremos
  function safetygate(padre, x, z0, z1, yAncla, colgado, pared) {
    const g = grupo(x, yAncla, (z0 + z1) / 2, 0, padre), largo = z1 - z0;
    for (const s of [-1, 1]) { const zz = s * largo * .34; caja(Math.abs(x - pared), .06, .06, (pared - x) / 2, -.03, zz, M.acero, g, .015); caja(.04, .2, .12, pared - x + .02, -.1, zz, M.acero, g, .01); }
    const piv = grupo(0, 0, 0, 0, g);
    for (const s of [-1, 1]) cil(.007, colgado - .07, 0, -colgado + .05, s * largo * .34, M.acero, piv, 6);
    const tubo = grupo(0, -colgado, 0, 0, piv);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, largo, 28), std(0xF5C400, { roughness: .32 })); c.rotation.x = Math.PI / 2; c.castShadow = true; tubo.add(c);
    for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.TorusGeometry(.03, .008, 8, 14), M.acero); a.position.set(0, .1, s * largo * .34); tubo.add(a); }
    const balizas = [];
    for (const s of [-1, 1]) {
      const e = grupo(0, 0, s * largo / 2, 0, tubo); e.rotation.x = s > 0 ? Math.PI / 2 : -Math.PI / 2;
      cil(.088, .07, 0, 0, 0, M.negro, e, 20); const l = luz(0xFF2A2A, 0x7A1414); cil(.07, .1, 0, .07, 0, l, e, 20); esfera(.068, 0, .17, 0, l, e, 14); balizas.push(l);
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .78; cil(.005, .18, Math.cos(a) * .088, .06, Math.sin(a) * .088, M.acero, e, 5); }
    }
    return { g, piv, tubo, balizas, y: yAncla - colgado, radio: .075 };
  }
  // SmartDock: cuña en la rueda del remolque + semáforo interior y exterior
  function smartdock(padre, x, z) {
    const g = grupo(x, 0, z, 0, padre);
    const semaforo = (gx, gz, ry) => { const s = grupo(gx, 0, gz, ry, g); caja(.24, .56, .16, 0, 1.6, 0, M.negro, s, .06); caja(.04, .2, .04, 0, 1.4, -.05, M.tinta, s, .01);
      const r = luz(0xFF3B3B, 0x4a1515), v = luz(0x22C55E, 0x123a20); esfera(.07, .09, 1.98, 0, r, s, 12); esfera(.07, .09, 1.76, 0, v, s, 12); return { r, v }; };
    const dentro = semaforo(-.25, 1.75, Math.PI), fuera = semaforo(.25, -1.75, 0);
    const cuna = grupo(.9, 0, -1.6, 0, g); caja(.55, .32, .3, 0, 0, 0, M.amarillo, cuna, .08); caja(.57, .05, .34, 0, 0, 0, M.negro, cuna, .02);
    const riel = caja(5, .05, .16, 2.7, 0, -1.6, M.gris2, g, .01);
    return { g, cuna, dentro, fuera };
  }
  // letrero de velocidad (radar): pantalla que muestra la velocidad del equipo que se acerca
  function radar(padre, x, y, z, ry) {
    const g = grupo(x, y, z, ry, padre); caja(.7, .82, .1, 0, 0, 0, M.negro, g, .06); caja(.2, .12, .14, 0, .82, .02, M.gris, g, .04);
    const c = document.createElement('canvas'); c.width = c.height = 256; const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.6, .6), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); m.position.set(0, .42, .051); g.add(m);
    let ult = null;
    function mostrar(v, limite = 10) { const key = v == null ? 'x' : Math.round(v); if (key === ult) return; ult = key; const x = c.getContext('2d'); x.fillStyle = '#121418'; x.fillRect(0, 0, 256, 256);
      if (v != null) { const col = v > limite ? '#FF4D4D' : '#22C55E'; x.strokeStyle = col; x.lineWidth = 14; x.beginPath(); x.arc(128, 110, 92, 0, Math.PI * 2); x.stroke(); x.fillStyle = col; x.font = '800 104px Poppins, Arial, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(String(Math.round(v)), 128, 112); x.font = '700 30px Poppins, Arial'; x.fillText('km/h', 128, 228); }
      t.needsUpdate = true; }
    mostrar(null); return { g, mostrar };
  }
  // barrera vehicular automática (pluma)
  function pluma(padre, x, z, ry, largo = 4) {
    const g = grupo(x, 0, z, ry, padre); caja(.36, 1.0, .36, 0, 0, 0, std(0xE9ECF0), g, .07); caja(.4, .06, .4, 0, 1.0, 0, M.gris2, g, .02);
    const bal = luz(0xFF8A1F, 0x6b3a10); cil(.06, .12, 0, 1.06, 0, bal, g, 12);
    const brazo = grupo(0, .9, 0, 0, g);
    const rb = tex((x, w, h) => { for (let i = 0; i < 10; i++) { x.fillStyle = i % 2 ? '#FFFFFF' : '#E5383B'; x.fillRect((i * w) / 10, 0, w / 10 + 1, h); } }, 512, 32);
    const b = new THREE.Mesh(new THREE.BoxGeometry(largo, .09, .06), new THREE.MeshStandardMaterial({ map: rb, roughness: .4 })); b.position.set(largo / 2 + .15, 0, 0); b.castShadow = true; brazo.add(b);
    const lector = grupo(-.9, 0, 0, 0, g); cil(.04, 1.2, 0, 0, 0, M.gris2, lector, 8); caja(.22, .3, .1, 0, 1.2, 0, M.negro, lector, .04);
    return { g, brazo, bal };
  }

  /* ═════════════ señalética (imágenes reales del catálogo) ═════════════ */
  const ALTO = 1.48;
  // soporte: 'muro' (placa con separadores), 'colgado' (dos caras, cables), 'poste' (solo exterior)
  function letrero(padre, url, w, x, y, z, ry = 0, soporte = 'muro') {
    const g = grupo(x, y, z, ry, padre), h = w * ALTO, cara = new THREE.MeshStandardMaterial({ map: imagen(url), roughness: .45 });
    const placa = new THREE.Mesh(new THREE.BoxGeometry(.016, h, w), [cara, soporte === 'colgado' ? cara : M.gris, M.gris, M.gris, M.gris, M.gris]); placa.position.set(.012, h / 2, 0); placa.castShadow = true; g.add(placa);
    if (soporte === 'colgado') { placa.material = [cara, cara, M.gris, M.gris, M.gris, M.gris]; for (const s of [-1, 1]) cil(.005, 1.0, .012, h, s * w * .35, M.gris2, g, 5); }
    if (soporte === 'poste') { cil(.03, y, -.03, -y, 0, M.gris2, g, 10); cil(.16, .04, -.03, -y, 0, M.gris2, g, 16); }
    return g;
  }
  // letrero colgante de pasillo (texto, dos caras)
  function colgante(padre, txt, x, y, z, ry, w = 1.2, h = .5, fondo = '#056CF2') {
    const t = tex((c, W, H) => { c.fillStyle = fondo; c.fillRect(0, 0, W, H); c.fillStyle = '#fff'; c.font = `800 ${H * .58}px Poppins, Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, W / 2, H / 2 + H * .04); }, 512, Math.round(512 * h / w));
    const cara = new THREE.MeshStandardMaterial({ map: t, roughness: .5 });
    const g = grupo(x, y, z, ry, padre); const p = new THREE.Mesh(new THREE.BoxGeometry(.02, h, w), [cara, cara, M.gris, M.gris, M.gris, M.gris]); p.castShadow = true; g.add(p);
    for (const s of [-1, 1]) cil(.006, 7.4 - y - h / 2, 0, h / 2, s * w * .38, M.gris2, g, 5);
    return g;
  }
  // etiqueta de ubicación en la viga del rack
  const etiquetaTex = new Map();
  function etiqueta(padre, txt, x, y, z, ry) {
    if (!etiquetaTex.has(txt)) etiquetaTex.set(txt, new THREE.MeshBasicMaterial({ map: tex((c, W, H) => { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.fillStyle = '#056CF2'; c.fillRect(0, 0, H, H); c.fillStyle = '#fff'; c.font = `800 ${H * .6}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt[0], H / 2, H / 2 + 2); c.fillStyle = '#1b2230'; c.fillText(txt.slice(1), (W + H) / 2, H / 2 + 2); }, 256, 64), toneMapped: false }));
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.36, .09), etiquetaTex.get(txt)); m.position.set(x, y, z); m.rotation.y = ry; padre.add(m); return m;
  }

  /* ═════════════ almacenamiento y producción ═════════════ */
  const montante = std(0x8FA0B6, { roughness: .5, metalness: .25 }), larguero = std(0xF08A24, { roughness: .5 });
  // fila de racks selectivos a lo largo de z: [x0,x1] ancho de la fila, z0..z1 largo; devuelve los huecos (para pallets)
  function filaRack(padre, x0, x1, z0, z1, niveles, alto) {
    const g = grupo(0, 0, 0, 0, padre), doble = x1 - x0 > 1.5, prof = doble ? (x1 - x0 - .2) / 2 : x1 - x0;
    const caras = doble ? [[x0, x0 + prof], [x1 - prof, x1]] : [[x0, x1]];
    const vanos = Math.round((z1 - z0) / 2.5), largo = (z1 - z0) / vanos, huecos = [];
    for (const [a, b] of caras) {
      for (let i = 0; i <= vanos; i++) { const z = z0 + i * largo; for (const x of [a + .04, b - .04]) caja(.08, alto, .08, x, 0, z, montante, g, .01);
        for (let j = 0; j < 4; j++) barra(V(a + .04, .3 + j * .75, z), V(b - .04, .65 + j * .75, z), .03, montante, g); }
      for (const y of niveles.slice(1)) for (const x of [a + .04, b - .04]) caja(.08, .12, z1 - z0, x, y - .12, (z0 + z1) / 2, larguero, g, .01);
      for (const y of niveles) for (let i = 0; i < vanos; i++) for (let s = 0; s < 2; s++) huecos.push({ x: (a + b) / 2, y, z: z0 + i * largo + largo * (s ? .74 : .26), lado: a === x0 ? -1 : 1, fila: [a, b] });
    }
    return { g, huecos };
  }
  // estantería liviana del supermercado (a lo largo de z) con cajas organizadoras de colores
  function estanteria(padre, x, z0, z1) {
    const g = grupo(0, 0, 0, 0, padre), L = z1 - z0;
    for (const z of [z0, z1]) for (const dx of [-.5, .5]) caja(.05, 2.0, .05, x + dx, 0, z, M.gris2, g, .01);
    for (const y of [.2, .7, 1.2, 1.7]) { caja(1.06, .04, L + .05, x, y, (z0 + z1) / 2, M.gris, g, .01);
      for (let i = 0; i < Math.floor(L / .42); i++) for (const dx of [-.26, .26]) caja(.4, .26, .36, x + dx, y + .04, z0 + .25 + i * .42, BIN[(i + Math.round(y * 3)) % 4], g, .05); }
    return g;
  }
  // rack FIFO de flujo: dos niveles inclinados (carga por el lado del tren, retiro por el operador)
  function fifo(padre, x, z, ancho = 1.4) {
    const g = grupo(x, 0, z, 0, padre), cajas = [];
    for (const dx of [-ancho / 2, ancho / 2]) for (const dz of [-.42, .42]) caja(.05, dz < 0 ? 1.45 : 1.2, .05, dx, 0, dz, M.gris2, g, .01);
    for (const [y0, y1] of [[1.15, .9], [.62, .42]]) { const o = caja(ancho, .04, .95, 0, (y0 + y1) / 2, 0, M.amarillo, g, .01); o.rotation.x = -Math.atan2(y0 - y1, .9);
      for (let i = 0; i < 3; i++) { const t = (i + .5) / 3, b = caja(.4, .22, .3, (i - 1) * .44, y0 + (y1 - y0) * t + .03, -.4 + .8 * t, M.azul, g, .05); b.rotation.x = o.rotation.x; cajas.push(b); } }
    return { g, cajas };
  }
  // estación de trabajo modular (frente = −z: el operador está en +z mirando a −z)
  // extra: grupo donde van panel portaherramientas y luz (capa propia en los recorridos); por defecto, la misma estación
  function estacion(padre, x, z, extra) {
    const g = grupo(x, 0, z, 0, padre), e = extra ? grupo(x, 0, z, 0, extra) : g;
    for (const dx of [-.78, .78]) for (const dz of [-.36, .36]) caja(.05, .85, .05, dx, 0, dz, M.gris2, g, .01);
    caja(1.7, .05, .8, 0, .85, 0, std(0xE9DCC3, { roughness: .7 }), g, .02);
    caja(1.6, .18, .7, 0, .52, -.02, M.gris, g, .02);                                // cajonera
    for (const dx of [-.78, .78]) caja(.05, 1.25, .05, dx, .9, -.36, M.gris2, e, .01);
    caja(1.6, .7, .03, 0, 1.0, -.37, std(0xDCE3EC), e, .01);                       // panel portaherramientas
    for (let i = 0; i < 6; i++) caja(.05, .22 + (i % 3) * .06, .02, -.6 + i * .24, 1.2, -.34, M.tinta, e, .01);
    caja(1.6, .05, .14, 0, 2.12, -.3, M.blanco, e, .02); const led = luz(0xFFF6DA, 0x999999); caja(1.4, .02, .08, 0, 2.1, -.3, led, e, .01); led.emissiveIntensity = 1.2;
    // torre andon
    const andon = grupo(.78, 2.15, -.36, 0, e); cil(.015, .1, 0, 0, 0, M.tinta, andon, 6);
    const L = [luz(0xFF3B3B, 0x4a1515), luz(0xF5C400, 0x4a3a10), luz(0x22C55E, 0x123a20)]; L.forEach((m, i) => cil(.05, .09, 0, .1 + (2 - i) * .095, 0, m, andon, 12));
    return { g, andon: { r: L[0], a: L[1], v: L[2] } };
  }
  // «antes» de la estación: mesa baja sin regulación, sin panel ni luz (obliga a trabajar agachado)
  function mesaBaja(padre, x, z) {
    const g = grupo(x, 0, z, 0, padre), madera = std(0xB89A74, { roughness: .85 });
    for (const dx of [-.74, .74]) for (const dz of [-.32, .32]) caja(.06, .62, .06, dx, 0, dz, M.gris2, g, .01);
    caja(1.6, .05, .76, 0, .62, 0, madera, g, .01);
    for (let i = 0; i < 4; i++) caja(.2 + (i % 2) * .1, .12, .18, -.5 + i * .32, .67, (i % 2 ? .12 : -.14), std([0xC9A36B, 0x8C99A8, 0xC9A36B, 0x6F7F91][i]), g, .02);
    return { g };
  }
  // panel de cajas organizadoras (PP) en muro: 4 filas × 6 cajas de colores
  function panelCajas(padre, x, y, z, ry) {
    const g = grupo(x, y, z, ry, padre); caja(1.9, 1.3, .05, 0, 0, 0, std(0xE6EAF0), g, .02);
    const col = [0x1E6FE0, 0xF5C400, 0xE5383B, 0x1FA45A];
    for (let f = 0; f < 4; f++) for (let i = 0; i < 6; i++) { const m = std(col[f]); caja(.24, .22, .2, -.75 + i * .3, .1 + f * .3, .12, m, g, .03); caja(.2, .05, .01, -.75 + i * .3, .22 + f * .3, .225, M.blanco, g, .005); }
    return g;
  }
  // cinta de rodillos a lo largo de x
  function cinta(padre, x0, x1, z, y = .78) {
    const g = grupo(0, 0, 0, 0, padre);
    for (let x = x0; x <= x1; x += 1.6) for (const dz of [-.3, .3]) caja(.05, y, .05, x, 0, z + dz, M.gris2, g, .01);
    for (const dz of [-.33, .33]) caja(x1 - x0, .1, .04, (x0 + x1) / 2, y - .02, z + dz, M.gris, g, .01);
    caja(x1 - x0, .03, .6, (x0 + x1) / 2, y + .02, z, M.tinta, g, .01);
    return g;
  }
  // mesa elevadora de tijera: top a altura h
  function mesaElevadora(padre, x, z) {   // en U: las horquillas de la transpaleta pasan por el centro
    const g = grupo(x, 0, z, 0, padre); for (const s of [-1, 1]) caja(1.3, .07, .17, 0, 0, s * .56, M.amarillo, g, .02);
    const top = grupo(0, .7, 0, 0, g); for (const s of [-1, 1]) caja(1.3, .08, .2, 0, 0, s * .55, M.amarillo, top, .03); caja(.12, .08, 1.3, -.59, 0, 0, M.amarillo, top, .02);
    const tij = []; for (const s of [-1, 1]) { const a = caja(1.3, .05, .05, 0, 0, s * .56, M.tinta, g, .01), b = caja(1.3, .05, .05, 0, 0, s * .6, M.tinta, g, .01); tij.push(a, b); }
    const pal = pallet(top, 'nada'); pal.position.y = .08;
    function alto(h) { top.position.y = h; const ang = Math.asin(Math.min(.98, Math.max(0, h - .1) / 1.25)); tij.forEach((o, i) => { o.position.y = .05 + (h - .05) / 2 - .025; o.position.x = 0; o.rotation.z = i % 2 ? ang : -ang; }); }
    alto(.7); return { g, top, pal, alto };
  }
  // manipulador de vacío: columna + pluma giratoria + tubo de elevación + cabezal con manilla
  function manipulador(padre, x, z) {
    const g = grupo(x, 0, z, 0, padre); cil(.13, 3.3, 0, 0, 0, M.amarillo, g, 16); cil(.3, .05, 0, 0, 0, M.tinta, g, 18);
    const giro = grupo(0, 3.2, 0, 0, g); caja(3.4, .16, .14, 1.6, 0, 0, M.amarillo, giro, .03); caja(.4, .3, .3, 0, -.1, 0, M.blanco, giro, .06);
    const trolley = grupo(2.2, 0, 0, 0, giro); caja(.24, .12, .22, 0, -.12, 0, M.tinta, trolley, .03);
    const tubo = new THREE.Mesh(new THREE.CylinderGeometry(.1, .1, 1, 14), std(0x3A4150, { roughness: .4 })); tubo.castShadow = true; trolley.add(tubo);
    const cabeza = grupo(0, 0, 0, 0, trolley); caja(.5, .08, .4, 0, 0, 0, M.tinta, cabeza, .03);
    caja(.05, .05, .42, 0, .2, -.27, M.tinta, cabeza, .01); caja(.4, .05, .05, 0, .2, -.48, M.amarillo, cabeza, .02);   // manilla hacia el operador (−z)
    const caja1 = caja(.46, .36, .54, 0, -.37, 0, M.caja, cabeza, .03); caja1.visible = false;
    // poner(ang, alcance, y): ang = giro de la pluma, alcance = posición del carro en la pluma, y = altura del cabezal
    // la cabeza contrarresta el giro de la pluma: la manilla siempre mira al operador (−z del mundo)
    function poner(ang, alcance, y) { giro.rotation.y = ang; cabeza.rotation.y = -ang; trolley.position.x = alcance; const L = Math.max(.2, 3.08 - y); tubo.scale.y = L; tubo.position.y = -.12 - L / 2; cabeza.position.y = -.12 - L; }
    poner(0, 2.2, 1.3); return { g, giro, trolley, cabeza, caja: caja1, poner };
  }
  // transpaleta manual (frente +x = puntas de las horquillas; manilla atrás)
  function transpaleta(padre = k.escena) {
    const g = grupo(0, 0, 0, 0, padre); const horq = grupo(0, 0, 0, 0, g);
    for (const z of [-.34, .34]) caja(1.15, .07, .16, .1, .02, z, M.rojo, horq, .02);
    caja(.3, .4, .7, -.55, .02, 0, M.rojo, horq, .05); const rueda = cil(.1, .1, -.62, 0, 0, M.negro, g, 12); rueda.rotation.x = Math.PI / 2; rueda.position.y = .1;
    const tim = grupo(-.62, .4, 0, 0, horq); caja(.05, .9, .05, -.15, 0, 0, M.tinta, tim, .01).rotation.z = .35; caja(.06, .06, .34, -.47, .82, 0, M.tinta, tim, .02);
    const carga = grupo(.1, .09, 0, 0, horq);
    return { g, horq, carga, tim };
  }
  // contenedor de reciclaje con tapa del color de su residuo
  function contenedor(padre, x, z, color) { const g = grupo(x, 0, z, 0, padre); caja(.6, .9, .56, 0, 0, 0, std(color, { roughness: .45 }), g, .06); caja(.64, .06, .6, 0, .9, 0, std(color, { roughness: .4 }), g, .03); return g; }
  // tablero (pizarra) de pared o con patas; dib(ctx, w, h) dibuja la cara
  function tablero(padre, x, y, z, ry, w, h, dib, patas = false) {
    const g = grupo(x, 0, z, ry, padre); caja(.04, h + .06, w + .06, 0, y - .03, 0, M.gris2, g, .01);
    const t = tex(dib, 512, Math.round(512 * h / w)); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: .6 })); m.rotation.y = Math.PI / 2; m.position.set(.025, y + h / 2, 0); g.add(m);
    if (patas) for (const s of [-1, 1]) { caja(.05, y, .05, 0, 0, s * (w / 2 - .05), M.gris2, g, .01); caja(.5, .04, .06, 0, 0, s * (w / 2 - .05), M.gris2, g, .01); }
    return { g, t };
  }
  const extintor = (padre, x, z, ry) => { const g = grupo(x, 0, z, ry, padre); const r = std(0xD62828, { roughness: .35 }); cil(.08, .48, .1, .55, 0, r, g, 14); cil(.035, .07, .1, 1.03, 0, M.negro, g, 10); caja(.04, .1, .14, .02, .95, 0, M.negro, g, .01); return g; };
  const tableroElectrico = (padre, x, z, ry) => { const g = grupo(x, 0, z, ry, padre); caja(.3, 1.6, 1.0, .15, .2, 0, std(0xCDD3DB, { roughness: .5 }), g, .03); caja(.32, .2, 1.02, .15, 0, 0, M.tinta, g, .02); caja(.02, .1, .1, .31, 1.2, .3, M.negro, g, .01); return g; };

  return { persona, andar, brazos, sentar, pallet, montacargas, tractor, carroKitting, camion, viga, proyector, base, gestor, sensor, puerta, barrera, protectorColumna, protectorRack, bolardo,
    safetygate, smartdock, radar, pluma, letrero, colgante, etiqueta, filaRack, estanteria, fifo, estacion, mesaBaja, panelCajas, cinta, mesaElevadora, manipulador, contenedor, transpaleta, tablero, extintor, tableroElectrico, BIN };
}
