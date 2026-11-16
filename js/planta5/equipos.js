/* Planta Neisstech v5 · equipos según el estándar de Neisstech (12-nov-2026).
   Gestión de Tráfico IA (Dispositivos 13, 15, 17, 18, 19): puerta inteligente (postes negros, hoja amarilla, luz en el
   poste), baranda de polímero (postes negros, rieles amarillos), sensor de montacargas, gestor X-KUBE y holograma del
   paso de cebra / advertencia de grúa. También: espejo curvo, estación 5S de limpieza, columna con protector,
   paneles de zona para las murallas y tubería con su etiqueta. Cada modelo apoya en y = 0. */
import { THREE } from '../planta/nucleo.js';

let mdRef = null;
export function equipos(k, md) {
  mdRef = md;
  const { M, caja, cil, esfera, std, grupo, luz, tex } = k;
  const negro = std(0x1E2126, { roughness: .5 }), poste = std(0x22252B, { roughness: .45 }), amar = std(0xF5C400, { roughness: .4 });

  /* puerta inteligente: dos postes negros y una hoja amarilla que gira 90° sobre el poste de la bisagra.
     Se ubica con el origen en la bisagra; la hoja cubre +x local (ancho) y abre hacia +z local. */
  function puertaInteligente(padre, x, z, ry, ancho = 1.2) {
    const g = grupo(x, 0, z, ry, padre);
    for (const px of [0, ancho]) { cil(.065, 1.15, px, 0, 0, poste, g, 14); cil(.11, .03, px, 0, 0, negro, g, 16); cil(.07, .05, px, 1.15, 0, negro, g, 14); }
    const rojo = luz(0xFF3B3B, 0x4a1515), verde = luz(0x22C55E, 0x123a20);
    esfera(.055, 0, 1.24, 0, rojo, g, 12).scale.y = .7; esfera(.055, ancho, 1.24, 0, verde, g, 12).scale.y = .7;
    const hoja = grupo(.08, 0, 0, 0, g); hoja.userData.vivo = true;
    const L = ancho - .16;
    for (const y of [.32, .98]) caja(L, .06, .05, L / 2, y, 0, amar, hoja, .02);
    for (const xx of [.03, L - .03]) caja(.06, .72, .05, xx, .29, 0, amar, hoja, .02);
    caja(.09, .14, .07, L - .02, .58, .0, negro, hoja, .02);       // cerradura electromagnética
    return { g, hoja, rojo, verde, abrir: (q) => (hoja.rotation.y = -q * Math.PI / 2), k: 0 };
  }

  /* baranda de polímero: postes negros cada ~1,5 m y 2 o 3 rieles amarillos */
  function baranda(padre, x0, z0, x1, z1, alto = 1.1, rieles = 2) {
    const g = grupo(0, 0, 0, 0, padre), L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 1.5)), ry = -Math.atan2(z1 - z0, x1 - x0);
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; cil(.13, .03, x, 0, z, negro, g, 14); cil(.075, alto, x, .03, z, poste, g, 14); cil(.08, .05, x, alto, z, negro, g, 14); }
    for (let r = 0; r < rieles; r++) { const y = alto * (rieles === 3 ? [.3, .6, .88][r] : [.45, .85][r]); const o = caja(L, .1, .1, (x0 + x1) / 2, y - .05, (z0 + z1) / 2, amar, g, .05); o.rotation.y = ry; }
    return g;
  }

  /* sensor de montacargas (radar con visera), sobre un poste; mira hacia +x local */
  // sin poste propio: va sobre el poste de la puerta inteligente, en un muro o en una estructura (13-nov)
  function sensorGrua(padre, x, z, ry, alto = 1.24) {
    const g = grupo(x, 0, z, ry, padre);
    caja(.08, .12, .1, .02, alto - .06, 0, negro, g, .02);
    const c = grupo(.1, alto - .05, 0, 0, g); c.rotation.z = -.35; caja(.26, .14, .22, .06, -.07, 0, std(0x4C535C, { roughness: .5 }), c, .04); caja(.3, .03, .26, .08, .07, 0, std(0x4C535C), c, .01);
    const led = luz(0x3B8BFF, 0x1a2a55); esfera(.025, .2, -.02, .08, led, c, 8);
    return { g, led };
  }

  /* gestor de tráfico X-KUBE: cubo gris con franja azul, ojos rojos y lentes de proyección abajo; cuelga de un brazo */
  // X-KUBE colgado de la estructura del techo (viga a la altura «techo») o de un muro con un brazo corto (pared = [px, pz])
  function xkube(padre, x, z, alto, techo, pared) {
    const g = grupo(x, 0, z, 0, padre);
    if (pared) { const [px, pz] = pared, L = Math.hypot(px - x, pz - z); const br = caja(L, .1, .1, (px - x) / 2, alto + .02, (pz - z) / 2, M.gris2, g, .02); br.rotation.y = -Math.atan2(pz - z, px - x);
      caja(.08, .3, .3, px - x - Math.sign(px - x) * .04, alto - .14, pz - z, M.gris2, g, .02); }
    else { cil(.025, techo - alto, 0, alto, 0, M.gris2, g, 8); caja(.3, .05, .3, 0, techo - .05, 0, M.gris2, g, .01); }
    const cubo = grupo(0, alto, 0, 0, g); const cuerpo = std(0xC9CDD3, { roughness: .35, metalness: .3 });
    caja(.46, .42, .46, 0, -.42, 0, cuerpo, cubo, .07); caja(.48, .44, .1, 0, -.43, 0, std(0x056CF2, { roughness: .4 }), cubo, .03);
    const ojo = luz(0xFF3B3B, 0x4a1515); for (const s of [-1, 1]) { const e = cil(.07, .02, s * .14, -.2, .235, ojo, cubo, 16); e.rotation.x = Math.PI / 2; }
    const lente = luz(0xFFF4C2, 0x555544); for (const [dx, dz] of [[-.12, -.12], [.12, .12], [-.12, .12], [.12, -.12]]) { cil(.05, .12, dx, -.54, dz, M.negro, cubo, 12); cil(.035, .01, dx, -.545, dz, lente, cubo, 12); }
    caja(.06, .25, .06, 0, -.02, 0, M.gris2, cubo, .01);
    k.escena.updateMatrixWorld(true);
    const p = new THREE.Vector3(); cubo.getWorldPosition(p); p.y -= .55;
    return { g, ojo, lente, origen: p };
  }

  /* holograma en el piso: textura con brillo aditivo, líneas de barrido y parpadeo al encender */
  const holoMat = (t, color = 0xFFFFFF) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -4,
    uniforms: { map: { value: t }, uA: { value: 0 }, uT: { value: 0 }, uC: { value: new THREE.Color(color) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform sampler2D map; uniform float uA; uniform float uT; uniform vec3 uC; varying vec2 vUv;
      void main(){ vec4 c = texture2D(map, vUv); float barrido = .82 + .18 * sin(vUv.y * 90. - uT * 7.); float brillo = .9 + .1 * sin(uT * 31.);
        gl_FragColor = vec4(c.rgb * uC * barrido * brillo * uA * 1.55, c.a * uA); }` });
  const conoMat = (color) => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: { uA: { value: 0 }, uC: { value: new THREE.Color(color) } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }',
    fragmentShader: 'uniform float uA; uniform vec3 uC; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(vN,vV)),1.4); float a = uA * f * (0.2 + 0.8*(1.0 - vUv.y)) * 0.22; gl_FragColor = vec4(uC * a, a); }' });
  /* una proyección: plano en el piso + haz de luz desde el lente. pintar(q) 0..1 con parpadeo de encendido */
  function proyeccion(padre, t, w, d, x, z, ry, desde, color = 0xFFFFFF, y = .035) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), holoMat(t, color)); m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, y, z); m.renderOrder = 6; padre.add(m);
    let c = null;
    if (desde) { const hasta = new THREE.Vector3(x, y, z), alto = desde.distanceTo(hasta), g = new THREE.ConeGeometry(Math.max(w, d) * .55, alto, 40, 1, true); g.translate(0, -alto / 2, 0);
      c = new THREE.Mesh(g, conoMat(color)); c.position.copy(desde); c.lookAt(hasta); c.rotateX(-Math.PI / 2); c.renderOrder = 7; padre.add(c); }
    let q0 = 0, tEnc = -9;
    return { m, pintar(q, t) { if (q > .5 && q0 <= .5) tEnc = t; q0 = q; const parpadeo = t - tEnc < .35 ? (Math.sin((t - tEnc) * 70) > 0 ? 1 : .25) : 1;
      const a = q * parpadeo; m.material.uniforms.uA.value = a; m.material.uniforms.uT.value = t; m.visible = a > .01; if (c) { c.material.uniforms.uA.value = a; c.visible = a > .01; } } };
  }
  // texturas de los gobos del estándar (1: cebra amarilla, 3: advertencia de grúa)
  const TX = {
    grua: tex((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,214,40,.5)'); g.addColorStop(1, 'rgba(255,214,40,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.lineJoin = 'round'; x.fillStyle = '#FFD21F'; x.strokeStyle = '#1b1e24'; x.lineWidth = 18; x.beginPath(); x.moveTo(w / 2, 70); x.lineTo(w - 70, h - 100); x.lineTo(70, h - 100); x.closePath(); x.fill(); x.stroke();
      grua(x, w / 2 - 6, h / 2 + 52, 150, '#1b1e24'); }),
    copo: tex((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(120,200,255,.55)'); g.addColorStop(1, 'rgba(120,200,255,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#BFE6FF'; x.lineWidth = 26; x.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(w / 2 + Math.cos(a) * 180, h / 2 + Math.sin(a) * 180); x.stroke(); for (const s of [-1, 1]) { x.beginPath(); x.moveTo(w / 2 + Math.cos(a) * 105, h / 2 + Math.sin(a) * 105); x.lineTo(w / 2 + Math.cos(a) * 105 + Math.cos(a + s * .8) * 60, h / 2 + Math.sin(a) * 105 + Math.sin(a + s * .8) * 60); x.stroke(); } } }),
    zonas: tex((x, w, h) => { const cx = w / 2, cy = h / 2; for (const [r, c] of [[250, 'rgba(34,197,94,.55)'], [165, 'rgba(245,196,0,.7)'], [90, 'rgba(255,59,59,.8)']]) { x.strokeStyle = c; x.lineWidth = 16; x.beginPath(); x.arc(cx, cy, r - 10, 0, 7); x.stroke(); x.fillStyle = c.replace(/[\d.]+\)$/, '.12)'); x.beginPath(); x.arc(cx, cy, r - 10, 0, 7); x.fill(); } }, 512, 512),
  };
  // cebra proyectada con n franjas (las mismas medidas que la cinta: ~30 cm)
  const cebraTex = (n) => tex((x, w, h) => { x.clearRect(0, 0, w, h); x.fillStyle = '#FFD21F'; for (let i = 0; i < n; i++) if (i % 2 === 0) x.fillRect(10, (i / n) * h + 3, w - 20, h / n - 6); }, 256, 512);
  function grua(x, cx, cy, s, color) {
    x.fillStyle = color; x.strokeStyle = color; x.lineWidth = s * .09; x.lineCap = 'round';
    x.fillRect(cx - s * .55, cy - s * .05, s * .75, s * .38); x.fillRect(cx - s * .55, cy - s * .38, s * .1, s * .36);
    x.beginPath(); x.moveTo(cx - s * .5, cy - s * .38); x.lineTo(cx - s * .05, cy - s * .38); x.lineTo(cx + .02 * s, cy - s * .05); x.stroke();
    x.fillRect(cx + s * .25, cy - s * .55, s * .07, s * .9); x.fillRect(cx + s * .25, cy + s * .28, s * .4, s * .07);
    for (const dx of [-.38, .08]) { x.beginPath(); x.arc(cx + s * dx, cy + s * .38, s * .12, 0, Math.PI * 2); x.fill(); }
  }

  /* viga de techo (perfil I) a lo largo de z con sus pilares de acero en las murallas: de aquí cuelgan los equipos */
  function vigaTecho(padre, x, z0, z1, y, pilares) {
    const g = grupo(0, 0, 0, 0, padre), acero = std(0xA9B1BC, { roughness: .45, metalness: .45 }), L = z1 - z0, cz = (z0 + z1) / 2;
    caja(.22, .04, L, x, y + .3, cz, acero, g, 0); caja(.22, .04, L, x, y, cz, acero, g, 0); caja(.05, .26, L, x, y + .04, cz, acero, g, 0);
    for (const z of pilares) { caja(.3, y + .34, .3, x, 0, z, acero, g, .02); caja(.42, .04, .42, x, 0, z, acero, g, 0); }
    return g;
  }
  /* espejo curvo interior en poste (o muro): domo que mira hacia (dx, dz) */
  function espejo(padre, x, z, dx, dz, alto = 2.4, conPoste = true) {
    const g = grupo(x, 0, z, Math.atan2(dx, dz), padre);
    if (conPoste) cil(.04, alto, 0, 0, 0, M.gris2, g, 8); else caja(.12, .12, .2, 0, alto, -.08, M.gris2, g, .02);   // soporte al muro o al rack
    const aro = new THREE.Mesh(new THREE.TorusGeometry(.42, .04, 8, 32), std(0xF5C400, { roughness: .4 })); aro.position.set(0, alto, .08); g.add(aro);
    const domo = new THREE.Mesh(new THREE.SphereGeometry(.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 3.2), std(0xE8EEF4, { roughness: .05, metalness: .9 })); domo.rotation.x = Math.PI / 2; domo.position.set(0, alto, .02); domo.scale.set(1, .5, 1); g.add(domo);
    return g;
  }

  /* estación 5S de limpieza: tablero con siluetas y utensilios colgados por color de zona, sobre patas; mira a +z local */
  function estacion5S(padre, x, z, ry, color = '#F5C400') {
    const g = grupo(x, 0, z, ry, padre), W = 1.6, Hh = 1.7;
    for (const s of [-1, 1]) { caja(.05, Hh + .35, .05, s * (W / 2 - .04), 0, -.02, M.gris2, g, .01); caja(.06, .03, .45, s * (W / 2 - .04), 0, .1, M.gris2, g, .01); }
    const t = tex((c, w, h) => { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, w, h); c.fillStyle = color; c.fillRect(0, 0, w, h * .12); c.fillStyle = '#1b1e24'; c.font = `700 ${h * .06}px Poppins, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ESTACIÓN DE LIMPIEZA', w / 2, h * .06);
      c.strokeStyle = '#C3C8CF'; c.lineWidth = 3; c.setLineDash([6, 5]); for (const [px, l] of [[.14, .8], [.32, .8], [.5, .76], [.68, .6], [.86, .5]]) { c.strokeRect(w * px - w * .04, h * .16, w * .08, h * l); }
      c.setLineDash([]); c.fillStyle = '#1b1e24'; c.font = `600 ${h * .035}px Poppins, Arial`; ['ESCOBA', 'ESCOBILLÓN', 'MOPA', 'PALA', 'PAÑOS'].forEach((n, i) => c.fillText(n, w * [.14, .32, .5, .68, .86][i], h * .985)); }, 512, 544);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, .04), [M.gris, M.gris, M.gris, M.gris, new THREE.MeshStandardMaterial({ map: t, roughness: .6 }), M.gris]); panel.position.set(0, .35 + Hh / 2, 0); panel.castShadow = true; g.add(panel);
    const col = std(new THREE.Color(color).getHex(), { roughness: .45 }), mango = std(0x9AA3AE, { roughness: .4, metalness: .4 });
    // escoba, escobillón, mopa (palos con cabezal), pala y paños
    [-.58, -.29, 0].forEach((px, i) => { cil(.018, 1.25, px, .55, .06, mango, g, 6); caja(i === 2 ? .2 : .32, .12, .08, px, .45, .07, col, g, .03); });
    caja(.22, .26, .05, .29, 1.15, .06, col, g, .02); cil(.016, .3, .29, 1.28, .06, mango, g, 6);
    for (let i = 0; i < 3; i++) caja(.16, .2, .03, .5 + i * .07, 1.35 - i * .02, .06 + i * .01, col, g, .01);
    return g;
  }

  /* columna estructural (0,4 × 0,4) con protector amarillo/negro opcional */
  function columna(padre, x, z, alto, protegida, padreProt) {
    caja(.4, alto, .4, x, 0, z, M.muro, padre, .03); caja(.42, .04, .42, x, alto, z, M.corte, padre, .01);
    if (protegida) { const g = grupo(x, 0, z, 0, padreProt); caja(.62, 1.2, .62, 0, 0, 0, std(0xF5C400, { roughness: .5 }), g, .12); for (const y of [.2, .55, .9]) caja(.64, .1, .64, 0, y, 0, negro, g, .05); }
  }

  /* panel de zona para la muralla: franja de color con el nombre y un pictograma; mira hacia +x local */
  function panelZona(padre, txt, sub, x, y, z, ry, w = 4, color = '#056CF2') {
    const h = w * .28, t = tex((c, W, Hh) => { c.fillStyle = '#FFFFFF'; c.fillRect(0, 0, W, Hh); c.fillStyle = color; c.fillRect(0, 0, Hh * .9, Hh); c.fillRect(0, Hh * .86, W, Hh * .14);
      c.fillStyle = '#FFFFFF'; c.font = `800 ${Hh * .5}px Poppins, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt.slice(0, 1), Hh * .45, Hh * .45);
      c.fillStyle = '#1b1e24'; c.textAlign = 'left'; c.font = `800 ${Hh * .3}px Poppins, Arial`; c.fillText(txt, Hh * 1.05, Hh * .36); if (sub) { c.fillStyle = '#5B6472'; c.font = `600 ${Hh * .15}px Poppins, Arial`; c.fillText(sub, Hh * 1.05, Hh * .66); } }, 1024, Math.round(1024 * h / w));
    const g = grupo(x, y, z, ry, padre), m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: t, roughness: .55 }));
    m.rotation.y = Math.PI / 2; m.position.x = .02; g.add(m); return g;
  }
  /* tubería a lo largo de un muro con etiquetas de contenido y flecha de flujo (las etiquetas van en otro grupo) */
  function tuberia(padre, x0, x1, z, y, color, etiquetas, nombre, colorTxt = '#FFFFFF') {
    const largo = x1 - x0, t = cil(.07, largo, x0, y, z, std(color, { roughness: .45, metalness: .2 }), padre, 12); t.rotation.z = -Math.PI / 2;
    for (let xx = x0 + .5; xx < x1; xx += 3) caja(.06, .12, .12, xx, y - .12, z + (z > 25 ? -.05 : .05), M.gris2, padre, .01);
    if (!etiquetas) return;
    const et = tex((c, W, Hh) => { c.fillStyle = '#1b1e24'; c.fillRect(0, 0, W, Hh); c.fillStyle = colorTxt; c.font = `700 ${Hh * .55}px Poppins, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(nombre + '  ➜', W / 2, Hh / 2 + 2); }, 512, 64);
    const mat = new THREE.MeshBasicMaterial({ map: et, toneMapped: false });
    for (let xx = x0 + 2; xx < x1 - 1; xx += 7) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.075, .075, .55, 16, 1, true, -Math.PI * .5, Math.PI), mat); m.rotation.z = Math.PI / 2; m.rotation.y = z > 25 ? Math.PI : 0; m.position.set(xx, y, z); etiquetas.add(m); }
  }

  /* carro a mano (plataforma con manilla) con cajas de cartón: lo que hay antes del tren logístico; frente +x */
  function carroMano(padre, cajas = 3) {
    const g = grupo(0, 0, 0, 0, padre); caja(1.1, .06, .62, 0, .16, 0, std(0x6B7380, { roughness: .5 }), g, .02);
    for (const [x, z] of [[-.45, -.25], [-.45, .25], [.45, -.25], [.45, .25]]) { const r = cil(.07, .05, x, 0, z, M.negro, g, 10); r.rotation.x = Math.PI / 2; r.position.y = .07; }
    caja(.04, .85, .5, -.55, .2, 0, std(0x6B7380), g, .01); caja(.05, .05, .55, -.6, 1.02, 0, M.negro, g, .02);
    for (let i = 0; i < cajas; i++) caja(.42, .3, .5, -.22 + (i % 2) * .44, .22 + Math.floor(i / 2) * .3, (i % 3 - 1) * .02, i % 2 ? M.caja2 : M.caja, g, .03);
    return g;
  }

  /* auto (frente +x): carrocería redondeada, cabina con vidrios, ruedas a ambos lados, focos */
  function auto(padre, x, z, ry, color) {
    const g = grupo(x, 0, z, ry, padre), c = std(color, { roughness: .32, metalness: .15 }), vid = std(0x26303C, { roughness: .08, metalness: .3 }), goma = std(0x1A1C20, { roughness: .8 }), llanta = std(0xB9C0C8, { roughness: .3, metalness: .6 });
    caja(4.3, .5, 1.76, 0, .3, 0, c, g, .24); caja(4.36, .16, 1.8, 0, .26, 0, std(0x2B2F36, { roughness: .6 }), g, .06);
    caja(2.3, .52, 1.6, -.3, .76, 0, c, g, .22); caja(2.36, .36, 1.64, -.3, .84, 0, vid, g, .14); caja(1.9, .08, 1.52, -.35, 1.24, 0, c, g, .04);
    for (const [dx, dz] of [[1.38, .79], [1.38, -.79], [-1.35, .79], [-1.35, -.79]]) { const r = cil(.34, .26, dx, .34, dz, goma, g, 18); r.rotation.x = Math.PI / 2; r.position.set(dx, .34, dz); const h = cil(.18, .27, dx, .34, dz, llanta, g, 12); h.rotation.x = Math.PI / 2; h.position.set(dx, .34, dz); }
    const foco = std(0xFFFFFF, { emissive: 0xFFF6DA, emissiveIntensity: .6 }), roja = std(0xD62828, { emissive: 0xFF2020, emissiveIntensity: .4 });
    for (const s2 of [-1, 1]) { caja(.05, .12, .34, 2.15, .55, s2 * .6, foco, g, .02); caja(.05, .12, .34, -2.15, .55, s2 * .6, roja, g, .02); }
    return g;
  }
  /* camión con remolque (frente +x = cabina; origen = centro del remolque, como md.camion) */
  function camion(padre, color = 0x1F5FD6) {
    const g = grupo(0, 0, 0, 0, padre), panel = std(0xF2F4F6, { roughness: .45 }), costilla = std(0xC9CFD8, { roughness: .4 }), oscuro = std(0x2B2F36, { roughness: .6 });
    const pint = std(color, { roughness: .3, metalness: .15 }), vid = std(0x26303C, { roughness: .08, metalness: .3 }), goma = std(0x1A1C20, { roughness: .8 }), llanta = std(0xB9C0C8, { roughness: .3, metalness: .6 });
    // remolque: piso, laterales con costillas, frente; techo aparte (las demos lo ocultan para ver adentro)
    caja(7.0, .12, 2.45, 0, 1.0, 0, oscuro, g, .02); caja(7.0, .1, 2.42, 0, 1.08, 0, std(0x9AA3AE), g, .01);
    for (const s2 of [-1, 1]) { caja(7.0, 2.5, .05, 0, 1.18, s2 * 1.2, panel, g, .01); for (let x = -3.4; x <= 3.4; x += .85) caja(.06, 2.5, .07, x, 1.18, s2 * 1.21, costilla, g, .005); caja(7.02, .12, .08, 0, 1.18, s2 * 1.22, std(0xF5C400), g, .01); }
    caja(.06, 2.5, 2.45, 3.47, 1.18, 0, panel, g, .01);
    const techo = caja(7.0, .08, 2.45, 0, 3.68, 0, panel, g, .02);
    for (const s2 of [-1, 1]) caja(.08, 2.6, .1, -3.5, 1.08, s2 * 1.17, oscuro, g, .02);
    caja(.12, .2, 2.3, -3.48, .74, 0, oscuro, g, .02);   // parachoques trasero
    const rueda = (x, z, r = .48) => { const w = cil(r, .32, 0, 0, 0, goma, g, 20); w.rotation.x = Math.PI / 2; w.position.set(x, r, z); const h = cil(r * .55, .33, 0, 0, 0, llanta, g, 12); h.rotation.x = Math.PI / 2; h.position.set(x, r, z); };
    for (const x of [-2.75, -1.6]) for (const z of [-1.02, -.68, .68, 1.02]) rueda(x, z);
    // cabina tractora: chasis, cabina con parabrisas, alerón, estanques, espejos
    caja(3.0, .3, 1.2, 4.3, .55, 0, oscuro, g, .03);
    caja(2.1, 2.1, 2.4, 4.9, .82, 0, pint, g, .22); caja(.06, .85, 2.1, 5.96, 1.95, 0, vid, g, .02); for (const s2 of [-1, 1]) caja(.9, .6, .05, 5.25, 2.0, s2 * 1.21, vid, g, .01);
    const al = caja(1.3, .55, 2.3, 4.6, 2.92, 0, pint, g, .2); al.rotation.z = .12;
    caja(.12, .4, 2.3, 6.0, .58, 0, std(0x9AA3AE, { metalness: .5, roughness: .3 }), g, .04); caja(.06, .5, 1.6, 5.98, 1.05, 0, oscuro, g, .02);
    for (const s2 of [-1, 1]) { const t = cil(.26, 1.0, 0, 0, 0, std(0xC9CFD8, { metalness: .6, roughness: .3 }), g, 14); t.rotation.z = Math.PI / 2; t.position.set(3.6, .6, s2 * .95); caja(.06, .06, .5, 5.7, 2.2, s2 * 1.38, oscuro, g, .01); caja(.08, .36, .2, 5.7, 1.9, s2 * 1.62, oscuro, g, .03); }
    for (const z of [-.9, .9]) { rueda(5.2, z, .5); rueda(3.95, z, .5); }
    const foco = std(0xFFFFFF, { emissive: 0xFFF6DA, emissiveIntensity: .6 }); for (const s2 of [-1, 1]) caja(.05, .16, .34, 6.03, .95, s2 * .85, foco, g, .02);
    return { g, techo, largo: 9.4 };
  }
  /* SmartDock: la cuña sale de su caja al costado del remolque y se mete delante de la rueda (eje a lo largo de x) */
  function cunaSmart(padre, x, z) {
    const g = grupo(x, 0, z, 0, padre); g.userData.vivo = true; const amar = std(0xF5C400, { roughness: .4 });
    // cuña: rampa que mira hacia la rueda (+z), con franjas negras
    const sh = new THREE.Shape(); sh.moveTo(-.3, 0); sh.lineTo(.3, 0); sh.lineTo(-.3, .5); sh.lineTo(-.3, 0);
    const geo = new THREE.ExtrudeGeometry(sh, { depth: .5, bevelEnabled: false }); geo.translate(0, 0, -.25); geo.rotateY(-Math.PI / 2);
    const cu = new THREE.Mesh(geo, amar); cu.castShadow = true; g.add(cu);
    caja(.52, .04, .62, 0, 0, 0, negro, g, .01);
    caja(.8, .1, .14, .52, .08, 0, negro, g, .02);   // brazo hacia la caja del riel
    const led = luz(0x22C55E, 0x123a20); esfera(.08, 0, .62, -.22, led, g, 10);
    return { g, led };
  }
  return { auto, camion, cunaSmart, vigaTecho, cebraTex, puertaInteligente, baranda, sensorGrua, xkube, proyeccion, TX, espejo, estacion5S, columna, panelZona, tuberia, carroMano, holoMat };
}
