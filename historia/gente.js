/* La historia de Don Salva · personajes (16-nov-2026).
   Figuras de maqueta con cara (para los planos cercanos): frente hacia +x, apoyan en y = 0.
   Don Salva: casco blanco, chaleco naranjo de brigadista, bigote y patillas canosas.
   Alejandro: joven, casco amarillo, audífonos, chaleco amarillo. El resto del turno: variaciones. */
import { THREE } from '../js/planta/nucleo.js';

export function gente(k) {
  const { M, capsula, caja, esfera, cil, grupo, std } = k;
  const refl = std(0xE9EEF5, { roughness: .3, metalness: .2 }), ojo = std(0x23262B, { roughness: .4 }), boca = std(0xB9775E, { roughness: .7 });

  function persona(o = {}) {
    const chaleco = std(o.chaleco ?? 0xF5C400, { roughness: .55 }), pant = std(o.pantalon ?? 0x4A5568, { roughness: .8 }), piel = std(o.piel ?? 0xF1CBAA, { roughness: .7 }), manga = std(o.manga ?? 0x5B7FB0, { roughness: .7 });
    const g = grupo(0, 0, 0, 0, o.padre || k.escena), c = grupo(0, 0, 0, Math.PI / 2, g); c.scale.setScalar(o.talla ?? 1);
    const bota = std(0x3B2E26, { roughness: .75 }), suela = std(0x16181B, { roughness: .9 }), guante = std(o.guante ?? 0x8A93A0, { roughness: .8 });
    const camisa = std(o.manga ?? 0x5B7FB0, { roughness: .75 }), cinturon = std(0x1E2126, { roughness: .6 });
    // piernas: muslo y pantorrilla en una pieza, bota con suela
    const pierna = (x) => { const p = grupo(x, .7, 0, 0, c); const m = capsula(.088, .46, 0, -.3, 0, pant, p); m.scale.set(1, 1, .95); caja(.15, .11, .25, 0, -.7, .035, bota, p, .045); caja(.155, .025, .26, 0, -.71, .035, suela, p, .008); return p; };
    // brazos: manga de la camisa (o del chaleco ancho de la brigada), puño y guante
    const brazo = (x) => { const p = grupo(x, 1.28, 0, 0, c); const m = capsula(.06, .34, 0, -.22, 0, manga, p); m.scale.set(1, 1, .95); const mano = esfera(.058, 0, -.48, .005, o.guantes ? guante : piel, p, 12); mano.scale.set(.85, 1.15, 1); return p; };
    const pi = pierna(-.1), pd = pierna(.1);
    // torso con hombros (no una cápsula): camisa debajo, chaleco abierto adelante, cintas reflectantes, tirantes y cinturón
    const torso = grupo(0, 0, 0, 0, c), pz = o.panza ?? 1;
    const tronco = capsula(.19, .3, 0, 1.02, 0, camisa, torso); tronco.scale.set(1.2 * pz, 1, .82 * pz);
    const hombros = capsula(.085, .36, 0, 1.31, 0, camisa, torso); hombros.rotation.z = Math.PI / 2; hombros.scale.set(1, 1, .9);
    const abre = .36, chal = new THREE.Mesh(new THREE.CylinderGeometry(.205, .2, .5, 22, 1, true, abre, Math.PI * 2 - abre * 2), chaleco); chal.material.side = THREE.DoubleSide; chal.position.y = 1.02; chal.scale.set(1.2 * pz, 1, .84 * pz); chal.castShadow = true; torso.add(chal);
    for (const y of [-.1, .08]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(.208, .205, .045, 22, 1, true, abre, Math.PI * 2 - abre * 2), refl); f.material.side = THREE.DoubleSide; f.position.y = 1.02 + y; f.scale.set(1.2 * pz, 1, .84 * pz); torso.add(f); }
    for (const s of [-1, 1]) for (const z of [-1, 1]) { const t = caja(.06, .25, .02, s * .115, 1.16, z * .174 * pz, chaleco, torso, .006); t.rotation.x = -z * .25; const r = caja(.025, .25, .022, s * .115, 1.16, z * .177 * pz, refl, torso, .004); r.rotation.x = -z * .25; }
    const cint = cil(.2, .055, 0, .74, 0, cinturon, torso, 20); cint.scale.set(1.2 * pz, 1, .84 * pz);
    cil(.055, .09, 0, 1.36, 0, piel, torso, 12);
    const bi = brazo(-.29), bd = brazo(.29);
    // cabeza (grupo propio: se puede inclinar), con orejas y nariz
    const cab = grupo(0, 1.32, 0, 0, c); const craneo = esfera(.13, 0, .14, 0, piel, cab, 22); craneo.scale.set(.96, 1.06, 1);
    for (const s of [-1, 1]) { esfera(.016, s * .048, .155, .118, ojo, cab, 8); const or = esfera(.03, s * .128, .14, 0, piel, cab, 8); or.scale.set(.5, 1, .8); }
    caja(.03, .04, .03, 0, .105, .125, piel, cab, .01);
    caja(.05, .012, .02, 0, .072, .122, boca, cab, .004);
    if (o.casco !== null) { const cs = std(o.casco ?? 0xF6F7F8, { roughness: .35 }); const d = new THREE.Mesh(new THREE.SphereGeometry(.152, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2), cs); d.position.set(0, .18, 0); d.scale.set(1, 1.05, 1.08); d.castShadow = true; cab.add(d); const ala = cil(.172, .02, 0, .17, .03, cs, cab, 22); ala.scale.set(1, 1, 1.12); caja(.04, .03, .21, 0, .32, 0, cs, cab, .012); }
    else { const pelo = std(o.pelo ?? 0x3A2E28, { roughness: .9 }); const d = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 1.9), pelo); d.position.set(0, .15, -.012); cab.add(d); }
    if (o.bigote) { const can = std(o.bigote, { roughness: .9 }); caja(.1, .03, .035, 0, .082, .118, can, cab, .012); for (const s of [-1, 1]) caja(.02, .09, .06, s * .128, .09, .0, can, cab, .008); for (const s of [-1, 1]) caja(.045, .012, .02, s * .05, .178, .118, can, cab, .004); }
    if (o.audifonos) { const a = std(0x1E2126, { roughness: .4 }); for (const s of [-1, 1]) { const u = cil(.05, .04, 0, 0, 0, std(0xEC6D27, { roughness: .4 }), cab, 12); u.rotation.z = Math.PI / 2; u.position.set(s * .145, .13, 0); } const arco = new THREE.Mesh(new THREE.TorusGeometry(.165, .014, 6, 20, Math.PI), a); arco.position.set(0, .14, 0); cab.add(arco); }
    if (o.radio) { caja(.06, .13, .035, .1, 1.08, .19, M.negro, torso, .01); cil(.006, .1, .12, 1.21, .19, M.negro, torso, 5); }
    if (o.insignia) caja(.1, .1, .01, -.09, 1.1, .205 * pz, std(o.insignia, { roughness: .4 }), torso, .01);
    return { g, c, pi, pd, bi, bd, cab, torso, o, fase: Math.random() * 6 };
  }

  /* ── poses ── */
  const P = {
    quieto(p) { for (const m of [p.pi, p.pd, p.bi, p.bd]) m.rotation.set(0, 0, 0); p.c.position.y = 0; p.cab.rotation.set(0, 0, 0); p.torso.rotation.set(0, 0, 0); },
    andar(p, v, t) { const f = t * 8.2 + p.fase, a = Math.sin(f) * .55 * v; p.pi.rotation.x = a; p.pd.rotation.x = -a; p.bi.rotation.x = -a * .7; p.bd.rotation.x = a * .7; p.bi.rotation.z = .06; p.bd.rotation.z = -.06;
      p.c.position.y = Math.abs(Math.cos(f)) * .035 * v; p.torso.rotation.y = Math.sin(f) * .07 * v; p.torso.rotation.z = Math.cos(f) * .025 * v; p.cab.rotation.x = .03; p.cab.rotation.y = -Math.sin(f) * .05 * v; },
    chocar(p, t, lado = 1) { const s = Math.sin(t * 4 + p.fase), arr = s > .2; const b = lado > 0 ? p.bd : p.bi; b.rotation.x = arr ? -2.6 : -1.4; b.rotation.z = (arr ? -.35 : -.15) * lado; (lado > 0 ? p.bi : p.bd).rotation.set(-.25, 0, 0); p.c.position.y = Math.max(0, s) * .06; p.cab.rotation.y = .35 * lado; },
    respirar(p, t) { p.torso.rotation.x = Math.sin(t * 1.6 + p.fase) * .015; p.cab.rotation.y = Math.sin(t * .5 + p.fase) * .12; },
    hablar(p, t) { p.bd.rotation.x = -1.0 + Math.sin(t * 2.6) * .28; p.bd.rotation.z = -.25 + Math.sin(t * 1.9) * .12; p.bi.rotation.x = -.35 + Math.sin(t * 2.1 + 1) * .15; p.cab.rotation.y = Math.sin(t * .9) * .28; p.cab.rotation.x = Math.sin(t * 2.2) * .04; },
    saludar(p, t) { p.bd.rotation.x = 0; p.bd.rotation.z = -2.5 + Math.sin(t * 7) * .28; p.cab.rotation.z = Math.sin(t * 3.5) * .03; },
    celebrar(p, t) { const s = Math.sin(t * 6.5 + p.fase); p.bi.rotation.x = p.bd.rotation.x = -2.75 + s * .2; p.bi.rotation.z = .28 + s * .12; p.bd.rotation.z = -.28 - s * .12; p.c.position.y = Math.max(0, s) * .2; p.pi.rotation.x = p.pd.rotation.x = Math.max(0, -s) * .25; p.cab.rotation.x = -.18; },
    aplaudir(p, t) { const s = Math.sin(t * 13 + p.fase); p.bi.rotation.x = p.bd.rotation.x = -1.25; p.bi.rotation.z = -.2 - s * .16; p.bd.rotation.z = .2 + s * .16; p.c.position.y = Math.abs(Math.sin(t * 3 + p.fase)) * .03; },
    triste(p, t) { p.cab.rotation.x = .52 + Math.sin(t * .7 + p.fase) * .02; p.cab.rotation.y = 0; p.bi.rotation.set(-.12, 0, -.06); p.bd.rotation.set(-.12, 0, .06); p.torso.rotation.x = .07; },
    foto(p, k1 = 1) { p.bd.rotation.x = -1.5 * k1; p.bd.rotation.z = .12 * k1; p.bi.rotation.x = -1.3 * k1; p.bi.rotation.z = -.34 * k1; p.cab.rotation.x = .06 * k1; },
    celular(p, t) { p.bd.rotation.x = -1.05; p.bd.rotation.z = .22; p.cab.rotation.x = .42; p.cab.rotation.y = Math.sin(t * .4) * .05; },
    cabeza(p, t) { p.bi.rotation.set(-2.5, 0, .62); p.bd.rotation.set(-2.5, 0, -.62); p.cab.rotation.x = .5 + Math.sin(t * 1.1) * .04; p.torso.rotation.x = .22; p.c.position.y = -.05; },
    sentado(p) { p.pi.rotation.x = p.pd.rotation.x = -1.45; p.c.position.y = -.42; },
    manejar(p, t, mirar = 0) { P.sentado(p); p.bi.rotation.x = p.bd.rotation.x = -.95; p.bi.rotation.z = -.12; p.bd.rotation.z = .12; p.cab.rotation.y = mirar; p.cab.rotation.x = Math.sin(t * 5.2) * .05; },
  };
  // teléfono en la mano derecha (para la foto)
  function telefono(p) { const m = std(0x15171B, { roughness: .3 }), pant = std(0x1b2230, { emissive: 0xBFD9FF, emissiveIntensity: 0, roughness: .2 }); const g = grupo(0, -.5, .05, 0, p.bd); caja(.075, .15, .012, 0, -.04, 0, m, g, .008); const s = caja(.062, .13, .004, 0, -.03, -.008, pant, g, .004); g.rotation.x = -1.45; g.visible = false; return { g, pant }; }
  return { persona, P, telefono };
}
