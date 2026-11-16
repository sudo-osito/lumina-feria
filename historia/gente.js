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
    const pierna = (x) => { const p = grupo(x, .66, 0, 0, c); capsula(.085, .44, 0, -.3, 0, pant, p); caja(.15, .08, .26, 0, -.66, .04, M.negro, p, .03); return p; };
    const brazo = (x) => { const p = grupo(x, 1.22, 0, 0, c); capsula(.062, .36, 0, -.22, 0, manga, p); esfera(.06, 0, -.47, 0, piel, p, 10); return p; };
    const pi = pierna(-.1), pd = pierna(.1);
    const torso = grupo(0, 0, 0, 0, c), pz = o.panza ?? 1; const t = capsula(.2, .32, 0, 1.0, 0, chaleco, torso); t.scale.set(pz, 1, pz * 1.04);
    for (const y of [.86, 1.02]) { const f = cil(.205 * pz, .035, 0, y, 0, refl, torso, 18); f.castShadow = false; }
    const bi = brazo(-.27), bd = brazo(.27);
    // cabeza (grupo propio: se puede inclinar)
    const cab = grupo(0, 1.3, 0, 0, c); esfera(.132, 0, .13, 0, piel, cab, 20);
    for (const s of [-1, 1]) esfera(.016, s * .05, .15, .12, ojo, cab, 8);
    caja(.05, .012, .02, 0, .068, .122, boca, cab, .004);
    if (o.casco !== null) { const cs = std(o.casco ?? 0xF6F7F8, { roughness: .35 }); const d = new THREE.Mesh(new THREE.SphereGeometry(.152, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2), cs); d.position.set(0, .17, 0); d.castShadow = true; cab.add(d); cil(.176, .02, 0, .16, .025, cs, cab, 20); caja(.04, .03, .2, 0, .3, 0, cs, cab, .012); }
    else { const pelo = std(o.pelo ?? 0x3A2E28, { roughness: .9 }); const d = new THREE.Mesh(new THREE.SphereGeometry(.14, 16, 8, 0, Math.PI * 2, 0, Math.PI / 1.9), pelo); d.position.set(0, .14, -.012); cab.add(d); }
    if (o.bigote) { const can = std(o.bigote, { roughness: .9 }); caja(.1, .03, .035, 0, .082, .118, can, cab, .012); for (const s of [-1, 1]) caja(.02, .09, .06, s * .128, .09, .0, can, cab, .008); for (const s of [-1, 1]) caja(.045, .012, .02, s * .05, .178, .118, can, cab, .004); }
    if (o.audifonos) { const a = std(0x1E2126, { roughness: .4 }); for (const s of [-1, 1]) { const u = cil(.05, .04, 0, 0, 0, std(0xEC6D27, { roughness: .4 }), cab, 12); u.rotation.z = Math.PI / 2; u.position.set(s * .145, .13, 0); } const arco = new THREE.Mesh(new THREE.TorusGeometry(.165, .014, 6, 20, Math.PI), a); arco.position.set(0, .14, 0); cab.add(arco); }
    if (o.radio) { caja(.06, .13, .035, .1, 1.08, .19, M.negro, torso, .01); cil(.006, .1, .12, 1.21, .19, M.negro, torso, 5); }
    if (o.insignia) caja(.1, .1, .01, -.09, 1.1, .205 * pz, std(o.insignia, { roughness: .4 }), torso, .01);
    return { g, c, pi, pd, bi, bd, cab, torso, o, fase: Math.random() * 6 };
  }

  /* ── poses ── */
  const P = {
    quieto(p) { for (const m of [p.pi, p.pd, p.bi, p.bd]) m.rotation.set(0, 0, 0); p.c.position.y = 0; p.cab.rotation.set(0, 0, 0); p.torso.rotation.set(0, 0, 0); },
    andar(p, v, t) { const a = Math.sin(t * 8.2 + p.fase) * .55 * v; p.pi.rotation.x = a; p.pd.rotation.x = -a; p.bi.rotation.x = -a * .7; p.bd.rotation.x = a * .7; p.bi.rotation.z = p.bd.rotation.z = 0; p.c.position.y = Math.abs(Math.cos(t * 8.2 + p.fase)) * .035 * v; p.cab.rotation.x = 0; },
    respirar(p, t) { p.torso.rotation.x = Math.sin(t * 1.6 + p.fase) * .015; p.cab.rotation.y = Math.sin(t * .5 + p.fase) * .12; },
    hablar(p, t) { p.bd.rotation.x = -1.0 + Math.sin(t * 2.6) * .28; p.bd.rotation.z = -.25 + Math.sin(t * 1.9) * .12; p.bi.rotation.x = -.35 + Math.sin(t * 2.1 + 1) * .15; p.cab.rotation.y = Math.sin(t * .9) * .28; p.cab.rotation.x = Math.sin(t * 2.2) * .04; },
    saludar(p, t) { p.bd.rotation.x = 0; p.bd.rotation.z = -2.5 + Math.sin(t * 7) * .28; p.cab.rotation.z = Math.sin(t * 3.5) * .03; },
    celebrar(p, t) { const s = Math.sin(t * 6.5 + p.fase); p.bi.rotation.x = p.bd.rotation.x = -2.75 + s * .2; p.bi.rotation.z = .28 + s * .12; p.bd.rotation.z = -.28 - s * .12; p.c.position.y = Math.max(0, s) * .2; p.pi.rotation.x = p.pd.rotation.x = Math.max(0, -s) * .25; p.cab.rotation.x = -.18; },
    aplaudir(p, t) { const s = Math.sin(t * 13 + p.fase); p.bi.rotation.x = p.bd.rotation.x = -1.25; p.bi.rotation.z = -.2 - s * .16; p.bd.rotation.z = .2 + s * .16; p.c.position.y = Math.abs(Math.sin(t * 3 + p.fase)) * .03; },
    triste(p, t) { p.cab.rotation.x = .52 + Math.sin(t * .7 + p.fase) * .02; p.cab.rotation.y = 0; p.bi.rotation.set(-.12, 0, -.06); p.bd.rotation.set(-.12, 0, .06); p.torso.rotation.x = .07; },
    foto(p, k1 = 1) { p.bd.rotation.x = -1.5 * k1; p.bd.rotation.z = .12 * k1; p.bi.rotation.x = -1.3 * k1; p.bi.rotation.z = -.34 * k1; p.cab.rotation.x = .06 * k1; },
    celular(p, t) { p.bd.rotation.x = -1.05; p.bd.rotation.z = .22; p.cab.rotation.x = .42; p.cab.rotation.y = Math.sin(t * .4) * .05; },
    cabeza(p, t) { p.bi.rotation.set(-2.85, 0, -.5); p.bd.rotation.set(-2.85, 0, .5); p.cab.rotation.x = .3 + Math.sin(t * 1.1) * .04; p.torso.rotation.x = .1; },
    sentado(p) { p.pi.rotation.x = p.pd.rotation.x = -1.45; p.c.position.y = -.42; },
    manejar(p, t, mirar = 0) { P.sentado(p); p.bi.rotation.x = p.bd.rotation.x = -.95; p.bi.rotation.z = -.12; p.bd.rotation.z = .12; p.cab.rotation.y = mirar; p.cab.rotation.x = Math.sin(t * 5.2) * .05; },
  };
  // teléfono en la mano derecha (para la foto)
  function telefono(p) { const m = std(0x15171B, { roughness: .3 }), pant = std(0x1b2230, { emissive: 0xBFD9FF, emissiveIntensity: 0, roughness: .2 }); const g = grupo(0, -.5, .05, 0, p.bd); caja(.075, .15, .012, 0, -.04, 0, m, g, .008); const s = caja(.062, .13, .004, 0, -.03, -.008, pant, g, .004); g.rotation.x = -1.45; g.visible = false; return { g, pant }; }
  return { persona, P, telefono };
}
