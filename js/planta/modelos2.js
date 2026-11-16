/* Planta Neisstech · modelos de la planta de referencia (8-nov-2026): auto, AGV, cámara fría, celda robot, taladro, torno,
   lean factory corner, vending, casilleros, cube, supermercado con pantalla, línea con túnel, semáforo peatonal, apilados. */
import { THREE } from './nucleo.js';

export function modelos2(k, md) {
  const { M, caja, cil, esfera, grupo, std, luz, tex } = k;
  const pant = (dib, w, h) => new THREE.MeshBasicMaterial({ map: tex(dib, 512, Math.round(512 * h / w)), toneMapped: false });
  const plano = (mat, w, h, x, y, z, ry, padre) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; padre.add(m); return m; };

  function auto(padre, x, z, ry, color) {
    const g = grupo(x, 0, z, ry, padre), c = std(color, { roughness: .35 });
    caja(4.2, .6, 1.8, 0, .28, 0, c, g, .25); caja(2.3, .55, 1.6, -.2, .86, 0, c, g, .22); caja(2.2, .45, 1.62, -.2, .9, 0, M.vidrio, g, .15);
    for (const [dx, dz] of [[1.3, .82], [1.3, -.82], [-1.3, .82], [-1.3, -.82]]) { const r = cil(.32, .22, dx, 0, dz, M.negro, g, 16); r.rotation.x = Math.PI / 2; r.position.y = .32; }
    return g;
  }
  // AGV: robot bajo con baliza y antena; lleva una caja en el lomo (carga visible o no)
  function agv(padre) {
    const g = grupo(0, 0, 0, 0, padre); caja(1.0, .28, .7, 0, .06, 0, std(0xF2B705, { roughness: .4 }), g, .1); caja(1.02, .04, .72, 0, .06, 0, M.negro, g, .02);
    for (const [dx, dz] of [[.36, .3], [.36, -.3], [-.36, .3], [-.36, -.3]]) { const r = cil(.07, .05, dx, 0, dz, M.negro, g, 10); r.rotation.x = Math.PI / 2; r.position.y = .07; }
    cil(.012, .5, -.3, .34, 0, M.tinta, g, 6); const bal = luz(0x3B8BFF, 0x1a2a55); esfera(.05, -.3, .86, 0, bal, g, 10);
    const lidar = cil(.08, .06, .38, .34, 0, M.negro, g, 12);
    const carga = caja(.46, .28, .5, .05, .36, 0, M.azul, g, .05); carga.visible = false;
    return { g, bal, carga };
  }
  // cámara fría: volumen techado, ventana, puerta corredera con luz y display
  function camaraFria(padre, x0, x1, z0, z1, puerta) {
    const g = grupo(0, 0, 0, 0, padre), pan = std(0xE9EEF3, { roughness: .6 }), alto = 3.0;
    caja(x1 - x0, alto, .2, (x0 + x1) / 2, 0, z0 + .1, pan, g, .03); caja(.2, alto, z1 - z0, x0 + .1, 0, (z0 + z1) / 2, pan, g, .03); caja(.2, alto, z1 - z0, x1 - .1, 0, (z0 + z1) / 2, pan, g, .03);
    const a = puerta - .9, b = puerta + .9;
    caja(a - x0, alto, .22, (x0 + a) / 2, 0, z1 - .11, pan, g, .03); caja(x1 - b, alto, .22, (b + x1) / 2, 0, z1 - .11, pan, g, .03); caja(1.8, alto - 2.3, .22, puerta, 2.3, z1 - .11, pan, g, .03);
    caja(x1 - x0, .2, z1 - z0, (x0 + x1) / 2, alto, (z0 + z1) / 2, std(0xDCE3EA), g, .05);
    caja(2.4, 1.0, .05, x0 + 2.4, 1.1, z1 + .02, std(0xBFD8F2, { roughness: .1, transparent: true, opacity: .75 }), g, .01);
    caja(.6, .3, .08, b + .6, 2.1, z1 + .04, M.negro, g, .02); const disp = luz(0x22C55E, 0x123a20); caja(.5, .2, .02, b + .6, 2.15, z1 + .09, disp, g, .005); disp.emissiveIntensity = 1.4;
    const hoja = grupo(puerta, 0, z1 + .16, 0, padre); hoja.userData.vivo = true; caja(1.8, 2.3, .1, 0, 0, 0, std(0xD5DEE8, { roughness: .4 }), hoja, .03); caja(.08, .5, .06, .6, 1.0, .06, M.acero, hoja, .02);
    caja(3.8, .14, .14, puerta + .9, 2.38, z1 + .16, M.acero, g, .02);
    const luzP = luz(0x22C55E, 0x123a20); esfera(.07, b + .25, 2.55, z1 + .1, luzP, g, 10);
    return { g, hoja, luzP, abrir: (q) => (hoja.position.x = puerta + q * 1.75) };
  }
  // celda robot: reja perimetral + brazo de 3 ejes sobre pedestal + mesa
  function celdaRobot(padre, x, z) {
    const g = grupo(x, 0, z, 0, padre), rej = std(0xC9CFD8, { roughness: .5, transparent: true, opacity: .55 });
    for (const [dx, dz, w, d] of [[0, -1.6, 3.2, .04], [0, 1.6, 3.2, .04], [-1.6, 0, .04, 3.2], [1.6, 0, .04, 3.2]]) { caja(w, 1.8, d, dx, 0, dz, rej, g, .005); }
    for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) caja(.06, 1.85, .06, dx, 0, dz, M.amarillo, g, .01);
    caja(.9, .75, .9, .5, 0, .3, M.gris, g, .04); cil(.25, .5, -.5, 0, -.3, M.tinta, g, 16);
    const base = grupo(-.5, .5, -.3, 0, g), b1 = grupo(0, .2, 0, 0, base); cil(.16, .2, 0, 0, 0, M.blanco, base, 14);
    caja(.16, .9, .16, 0, 0, 0, M.blanco, b1, .05); const b2 = grupo(0, .9, 0, 0, b1); caja(.8, .12, .12, .4, -.06, 0, M.blanco, b2, .04); caja(.1, .2, .1, .8, -.25, 0, M.tinta, b2, .02);
    const baliza = luz(0xF5C400, 0x4a3a10); cil(.05, .14, 1.4, 1.85, -1.4, baliza, g, 10);
    return { g, base, b1, b2, baliza };
  }
  function taladro(padre, x, z) { const g = grupo(x, 0, z, 0, padre); caja(.7, .1, .6, 0, 0, 0, M.gris2, g, .03); cil(.07, 1.7, 0, 0, -.2, M.gris, g, 12); caja(.5, .06, .5, 0, .8, .05, M.gris, g, .03); caja(.4, .5, .5, 0, 1.5, -.05, M.gris, g, .08); cil(.12, .2, 0, 2.0, -.05, M.gris, g, 14); cil(.02, .25, 0, 1.25, .1, M.tinta, g, 6); return g; }
  function torno(padre, x, z) { const g = grupo(x, 0, z, 0, padre); caja(2.4, .8, .7, 0, 0, 0, M.gris, g, .05); caja(.7, .6, .7, -.85, .8, 0, M.gris2, g, .06); caja(.4, .3, .5, .7, .8, 0, M.gris2, g, .05); const e = cil(.05, 1.3, -.4, .95, 0, M.acero, g, 10); e.rotation.z = Math.PI / 2; e.position.set(.2, .95, 0); caja(1.0, .7, .3, 0, 1.0, -.42, M.vidrio, g, .02); return g; }
  // lean factory corner: pórtico con letrero en las vigas y pantalla digital
  function leanCorner(padre, x0, x1, z0, z1) {
    const g = grupo(0, 0, 0, 0, padre), w = x1 - x0, d = z1 - z0, h = 2.7;
    for (const [px, pz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]]) caja(.3, h, .3, px, 0, pz, M.blanco, g, .04);
    const letr = pant((c, W, H) => { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.fillStyle = '#1b2230'; c.font = `700 ${H * .5}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LEAN FACTORY CORNER', W / 2, H / 2 + 2); c.fillStyle = '#056CF2'; c.fillRect(0, H - 6, W, 6); }, w, .4);
    for (const [cx, cz, L, ry] of [[(x0 + x1) / 2, z1, w, 0], [(x0 + x1) / 2, z0, w, Math.PI], [x1, (z0 + z1) / 2, d, Math.PI / 2], [x0, (z0 + z1) / 2, d, -Math.PI / 2]]) { const v = caja(ry % Math.PI === 0 ? L + .3 : .3, .44, ry % Math.PI === 0 ? .3 : L + .3, cx, h, cz, M.blanco, g, .03); plano(letr, Math.min(L, 4.2), .36, cx + Math.sin(ry) * .16, h + .22, cz + Math.cos(ry) * .16, ry, g); }
    const pan = pant((c, W, H) => { c.fillStyle = '#0d1b33'; c.fillRect(0, 0, W, H); const col = ['#22C55E', '#F5C400', '#056CF2', '#22C55E', '#E5383B', '#22C55E']; for (let i = 0; i < 18; i++) { c.fillStyle = col[i % 6]; c.globalAlpha = .85; c.fillRect(14 + (i % 6) * (W - 28) / 6, 30 + Math.floor(i / 6) * (H - 50) / 3, (W - 28) / 6 - 8, (H - 50) / 3 - 10); } c.globalAlpha = 1; c.fillStyle = '#fff'; c.font = `600 ${H * .08}px Poppins`; c.fillText('DIGITALES SHOPFLOOR', 14, 22); }, 2.4, 1.3);
    caja(2.6, 1.5, .1, (x0 + x1) / 2, .9, z1 - .2, M.tinta, g, .03); plano(pan, 2.4, 1.3, (x0 + x1) / 2, 1.65, z1 - .26, Math.PI, g);
    for (const s of [-1, 1]) caja(.06, .9, .06, (x0 + x1) / 2 + s * 1.0, 0, z1 - .2, M.gris2, g, .01);
    return g;
  }
  function vending(padre, x, z, ry, color, txt) { const g = grupo(x, 0, z, ry, padre); caja(.8, 1.9, .8, 0, 0, 0, std(color, { roughness: .4 }), g, .05); const p = pant((c, W, H) => { c.fillStyle = '#1b2230'; c.fillRect(0, 0, W, H); c.fillStyle = '#F5C400'; c.font = `800 ${H * .12}px Poppins`; c.textAlign = 'center'; c.fillText(txt, W / 2, H * .16); for (let i = 0; i < 12; i++) { c.fillStyle = ['#E5383B', '#22C55E', '#056CF2', '#F5C400'][i % 4]; c.fillRect(W * (.12 + (i % 3) * .27), H * (.3 + Math.floor(i / 3) * .15), W * .18, H * .1); } }, .6, 1.2); plano(p, .6, 1.2, .41, 1.1, 0, Math.PI / 2, g); return g; }
  function casilleros(padre, x, z, ry, n = 3) { const g = grupo(x, 0, z, ry, padre); for (let i = 0; i < n; i++) { caja(.48, 1.9, .5, 0, 0, (i - (n - 1) / 2) * .5, i % 2 ? std(0x4F95F5) : std(0x2F7BE8), g, .02); caja(.02, .12, .04, .25, 1.1, (i - (n - 1) / 2) * .5 + .15, M.gris2, g, .005); } return g; }
  // cube: pilar informativo con hojas en sus caras
  function cube(padre, x, z) { const g = grupo(x, 0, z, 0, padre); caja(.7, 2.5, .7, 0, 0, 0, std(0xEDEAE4), g, .05); caja(.74, .3, .74, 0, 2.5, 0, std(0xDCD7CE), g, .04);
    const hoja = pant((c, W, H) => { c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.fillStyle = '#9aa3ae'; for (let i = 0; i < 9; i++) c.fillRect(W * .1, H * (.12 + i * .09), W * (.5 + (i % 3) * .12), H * .03); c.fillStyle = '#056CF2'; c.fillRect(W * .1, H * .04, W * .4, H * .05); }, .5, .7);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; plano(hoja, .5, .7, Math.sin(a) * .356, 1.5, Math.cos(a) * .356, a, g); plano(hoja, .5, .7, Math.sin(a) * .356, .7, Math.cos(a) * .356, a, g); }
    return g; }
  // supermercado de flujo: carriles inclinados con cajas, marco y pantalla arriba
  function superFlujo(padre, x0, x1, z0, z1) {
    const g = grupo(0, 0, 0, 0, padre), w = x1 - x0, cajas = [];
    for (const px of [x0, x1]) for (const pz of [z0 + .3, z1 - .3]) caja(.06, 2.6, .06, px, 0, pz, M.gris2, g, .01);
    caja(w, .06, .06, (x0 + x1) / 2, 2.6, z0 + .3, M.gris2, g, .01); caja(w, .06, .06, (x0 + x1) / 2, 2.6, z1 - .3, M.gris2, g, .01);
    for (let i = 0; i < 9; i++) { const cx = x0 + .35 + i * (w - .7) / 8; for (const [y0, y1] of [[1.0, .7], [.45, .2]]) { const o = caja(.5, .04, z1 - z0 - .6, cx, (y0 + y1) / 2, (z0 + z1) / 2, M.gris, g, .01); o.rotation.x = Math.atan2(y0 - y1, z1 - z0 - .6);
      for (let j = 0; j < 4; j++) { const t = (j + .5) / 4, b = caja(.42, .26, .5, cx, y0 + (y1 - y0) * t + .03, z0 + .3 + (z1 - z0 - .6) * t, md.BIN[(i + j) % 2 ? 0 : 1], g, .05); b.rotation.x = o.rotation.x; cajas.push(b); } } }
    const pan = pant((c, W, H) => { c.fillStyle = '#0d1b33'; c.fillRect(0, 0, W, H); for (let i = 0; i < 9; i++) { c.fillStyle = i % 4 === 2 ? '#F5C400' : '#22C55E'; c.fillRect(10 + i * (W - 20) / 9, H * .25, (W - 20) / 9 - 6, H * .6); } c.fillStyle = '#fff'; c.font = `600 ${H * .16}px Poppins`; c.fillText('SUPERMERCADO', 10, H * .18); }, 2.6, 1.0);
    caja(2.8, 1.1, .08, (x0 + x1) / 2, 2.0, z1 - .2, M.tinta, g, .02); plano(pan, 2.6, 1.0, (x0 + x1) / 2, 2.55, z1 - .15, 0, g);
    return { g, cajas };
  }
  // línea con túnel (a lo largo de z) y cinta de rodillos
  function lineaTunel(padre, x, z0, z1) {
    const g = grupo(0, 0, 0, 0, padre); caja(1.2, .8, z1 - z0, x, 0, (z0 + z1) / 2, M.gris, g, .04); caja(1.0, .04, z1 - z0, x, .8, (z0 + z1) / 2, M.tinta, g, .01);
    caja(1.8, 1.6, 1.8, x, 0, z0 + 1.2, M.gris2, g, .12); caja(1.3, .9, .1, x, .82, z0 + 2.12, M.tinta, g, .02); cil(.45, .5, x, 1.6, z0 + 1.2, M.gris, g, 18);
    caja(.5, .4, .06, x - .91, 1.0, z0 + 1.6, std(0xFFFFFF), g, .01);
    for (let i = 0; i < 5; i++) caja(.36, .24, .3, x + (i % 2 ? .1 : -.1), .84, z0 + 3.2 + i * .75, M.azul, g, .04);
    caja(.04, 1.3, .04, x - .55, .8, z1 - .3, M.gris2, g, .01); caja(.04, 1.3, .04, x + .55, .8, z1 - .3, M.gris2, g, .01);
    return g;
  }
  // semáforo peatonal en poste con botón (Ampel) e información
  function ampel(padre, x, z, ry) { const g = grupo(x, 0, z, ry, padre); cil(.04, 2.3, 0, 0, 0, M.gris2, g, 10); caja(.22, .52, .18, 0, 2.0, .02, M.negro, g, .05);
    const r = luz(0xFF3B3B, 0x4a1515), v = luz(0x22C55E, 0x123a20); esfera(.06, 0, 2.38, .12, r, g, 10); esfera(.06, 0, 2.16, .12, v, g, 10);
    caja(.1, .14, .06, 0, 1.0, .06, M.amarillo, g, .02); const boton = luz(0x3B8BFF, 0x1a2a55); esfera(.025, 0, 1.08, .1, boton, g, 8); return { g, r, v, boton }; }
  function info(padre, x, z, ry) { const g = grupo(x, 0, z, ry, padre); cil(.03, 1.6, 0, 0, 0, M.gris2, g, 8); const p = pant((c, W, H) => { c.fillStyle = '#F5C400'; c.fillRect(0, 0, W, H); c.fillStyle = '#1b2230'; c.beginPath(); c.arc(W / 2, H / 2, W * .36, 0, 7); c.lineWidth = W * .08; c.strokeStyle = '#1b2230'; c.stroke(); c.font = `800 ${H * .5}px Poppins`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('i', W / 2, H / 2 + 4); }, .3, .3); plano(p, .3, .3, 0, 1.6, .03, 0, g); return g; }
  // apilados de recepción
  function apilado(padre, x, z, tipo, n) { const g = grupo(x, 0, z, 0, padre); for (let i = 0; i < n; i++) { if (tipo === 'negro') caja(1.0, .15, 1.2, 0, i * .16, 0, std(0x1f2329), g, .02); else if (tipo === 'madera') caja(1.0, .14, 1.2, 0, i * .15, 0, M.madera, g, .01); else caja(1.0, .55, 1.2, 0, i * .56, 0, std(0xBFC6D0, { roughness: .4 }), g, .03); } return g; }
  function aire(padre, x, z) { const g = grupo(x, 0, z, 0, padre); caja(1.2, .9, 1.0, 0, 0, 0, std(0xE8E4DE), g, .06); cil(.35, .04, 0, .9, 0, M.gris2, g, 18); return g; }
  return { auto, agv, camaraFria, celdaRobot, taladro, torno, leanCorner, vending, casilleros, cube, superFlujo, lineaTunel, ampel, info, apilado, aire };
}
