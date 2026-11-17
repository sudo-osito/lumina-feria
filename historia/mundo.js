/* La historia de Don Salva · el mundo, v2 (17-nov-2026).
   El centro de distribución sale del plano que dibujó Max (neisstech-web/plano/planos/historia.json, en metros: x a la
   derecha = oriente, z hacia abajo = sur). Muros, portones, andenes, racks, calles, senderos y columnas van tal cual;
   lo marcado «inventa» se completó con sentido: línea de ensamble, comedor, camarines, taller, carga de baterías, oficina,
   sala de reunión con lean corner, patio de camiones, estacionamientos, oficina principal, parque, calle lateral y autopista.
   v2 (feedback de Max: «que se vea vivo y haga sentido»): galpón con techo de dos aguas, tragaluces, cerchas y luminarias;
   murallas completas que bajan (casa de muñecas) en las tomas aéreas; y el mundo hasta el horizonte: la autopista que
   sigue, un parque industrial con otros galpones, la ciudad al oriente y la cordillera nevada detrás, cielo con nubes.
   Es la planta del ANTES: la pintura del piso está gastada y no hay ninguna solución de seguridad.
   construir(k, md, m2, eq) → { base, vivo, techo, muros, casa(kt, km), tablero, vida(t, dt), … } */
import { THREE } from '../js/planta/nucleo.js';

const azar = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

export const ANDENES = [63.5, 68.5, 73, 77.5, 82];
export const RACKS_X = [59.05, 63.05, 67.05, 71.05, 75.05, 79.05, 83.05];
export const COLUMNAS = [[89.5, 1.5], [89.5, 5.5], [89.5, 10.5], [89.5, 15], [89.5, 19], [53.5, 4.5], [57.5, 4.5], [61.5, 4.5], [66, 4.5], [71, 4.5], [75.5, 4.5], [80, 4.5], [84, 4.5],
  [56, 8.5], [56, 14.5], [56, 20], [56, 23.5], [56, 32.5], [48.2, 8.7], [40.5, 8.5], [48.5, 20], [48.5, 23.5]];
export const ALERO = 7.6, CUMBRE = 9.6;          // altura del galpón en el alero y en la cumbrera (cumbrera en z = 20)
export const SOL = new THREE.Vector3(.5, 1.0, -.38).normalize();   // mañana de noviembre, sol ya alto: sombras cortas que no rayan el piso

export function construir(k, md, m2, eq) {
  const { M, caja, cil, esfera, grupo, std, tex, luz, barra } = k;
  const R = azar(11), V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const base = grupo(), vivo = grupo(); vivo.userData.vivo = true;
  const W = { base, vivo };
  const cache = new Map(), mat = (c, o = {}) => { const key = c + JSON.stringify(o); if (!cache.has(key)) cache.set(key, std(c, o)); return cache.get(key); };

  /* ───────── utilidades: lienzos en metros e instancias ───────── */
  function lienzo(x0, z0, w, d, px, dib) {
    const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * d / w);
    const x = c.getContext('2d'), S = px / w; x.setTransform(S, 0, 0, S, -x0 * S, -z0 * S); dib(x, S);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; return t;
  }
  function plano(t, x0, z0, w, d, y, rug = .92, capa = 0) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: t, roughness: rug, polygonOffset: true, polygonOffsetFactor: -capa, polygonOffsetUnits: -capa * 2 }));
    m.rotation.x = -Math.PI / 2; m.position.set(x0 + w / 2, y, z0 + d / 2); m.receiveShadow = true; m.userData.vivo = true; k.escena.add(m); return m;
  }
  const o3 = new THREE.Object3D(), col = new THREE.Color();
  function instancias(geo, material, lista, sombra = true) {
    const im = new THREE.InstancedMesh(geo, material, lista.length);
    lista.forEach((p, i) => { o3.position.set(p.x, p.y || 0, p.z); o3.rotation.set(0, p.ry || 0, 0); o3.scale.set(p.sx ?? p.s ?? 1, p.sy ?? p.s ?? 1, p.sz ?? p.s ?? 1); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); if (p.c != null) im.setColorAt(i, col.set(p.c)); });
    im.castShadow = sombra; im.receiveShadow = true; im.userData.vivo = true; im.frustumCulled = false; k.escena.add(im); return im;
  }

  /* ───────── cielo, nubes y luz de la mañana ───────── */
  {
    const g = new THREE.SphereGeometry(15000, 48, 24), m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { arriba: { value: new THREE.Color(0x5E97DD) }, medio: { value: new THREE.Color(0xA9C8EC) }, horizonte: { value: new THREE.Color(0xE6ECEF) }, sol: { value: SOL.clone() } },
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 arriba; uniform vec3 medio; uniform vec3 horizonte; uniform vec3 sol; varying vec3 vP;
        void main(){ float h = max(vP.y, 0.0); vec3 c = mix(horizonte, medio, smoothstep(0.0, 0.12, h)); c = mix(c, arriba, smoothstep(0.1, 0.6, h));
          float s = max(dot(normalize(vP), normalize(sol)), 0.0); c += vec3(1.0, 0.86, 0.62) * (pow(s, 9.0) * 0.32 + pow(s, 600.0) * 1.6);
          c = mix(c, horizonte * 0.97, smoothstep(0.0, -0.04, vP.y));
          gl_FragColor = vec4(c, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
    W.cielo = new THREE.Mesh(g, m); W.cielo.userData.vivo = true; W.cielo.frustumCulled = false; W.cielo.renderOrder = -10; k.escena.add(W.cielo);
    const nube = tex((c, Wd, Hh) => { for (let i = 0; i < 16; i++) { const x = Wd * (.18 + .64 * R()), y = Hh * (.4 + .3 * R()), r = Hh * (.16 + .24 * R()), gr = c.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.55, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 0, Wd, Hh); } }, 512, 256);
    W.nubes = [];
    for (let i = 0; i < 22; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: nube, fog: false, depthWrite: false, opacity: .55 + R() * .35, color: 0xFFFFFF }));
      const a = R() * Math.PI * 2, d = 2600 + R() * 5500; s.position.set(70 + Math.cos(a) * d, 500 + R() * 900, 20 + Math.sin(a) * d); const w = 900 + R() * 1500; s.scale.set(w, w * .32, 1); s.userData.vivo = true; k.escena.add(s); W.nubes.push(s); }
  }

  /* ───────── el territorio (6 × 6 km): campos, parque industrial, la ciudad y la autopista ───────── */
  const RX0 = -3000, RZ0 = -3000, RW = 6000;
  const tRegion = lienzo(RX0, RZ0, RW, RW, 4096, (c, S) => {
    c.fillStyle = '#BFD3A4'; c.fillRect(RX0, RZ0, RW, RW);
    // campos del valle (poniente y extremos): parcelas de colores, con hileras de álamos que se plantan aparte
    for (let x = RX0; x < 200; x += 120 + R() * 140) for (let z = RZ0; z < 3000; z += 90 + R() * 120) { if (x > -60 && x < 200 && z > -1200 && z < 1200) continue;
      c.fillStyle = ['#B7CF96', '#D2D7A0', '#AFC98E', '#DCCF9E', '#BDD3A0', '#C9D4A4', '#A9C48A'][Math.floor(R() * 7)]; c.fillRect(x + 3, z + 3, 114 + R() * 120, 84 + R() * 100); }
    // parque industrial (oriente de la autopista): terrenos claros y calles
    c.fillStyle = '#C9D5B4'; c.fillRect(28, -1100, 1120, 2200); c.fillStyle = '#CDD7BA'; c.fillRect(-760, -760, 700, 1500);
    c.fillStyle = '#A9AFB8'; for (const z of [-850, -560, -300, 145, 420, 700, 980]) c.fillRect(28, z - 6, 1120, 12); for (const x of [200, 470, 740, 1000]) c.fillRect(x - 6, -1100, 12, 2200);
    c.fillStyle = '#ADB3BB'; for (const z of [-420, 180, 520]) c.fillRect(-760, z - 5, 700, 10);
    // la ciudad: manzanas grises hasta la precordillera
    c.fillStyle = '#D2D3D2'; c.fillRect(1650, -3000, 1350, 6000); c.fillStyle = 'rgba(160,166,174,.5)'; for (let x = 1650; x < 3000; x += 70) c.fillRect(x, -3000, 9, 6000); for (let z = -3000; z < 3000; z += 70) c.fillRect(1650, z, 1350, 9);
    c.fillStyle = 'rgba(176,200,160,.55)'; for (let i = 0; i < 40; i++) c.fillRect(1650 + R() * 1300, -3000 + R() * 5900, 40 + R() * 80, 40 + R() * 80);   // plazas
    // ríos de asfalto: autopista (x −20…−3) y la avenida que cruza hacia la ciudad (z −380)
    c.fillStyle = '#AEB4BD'; c.fillRect(-21, RZ0, 19, RW); c.fillRect(-3000, -392, 6000, 24); c.fillStyle = '#B9BEC6'; c.fillRect(13, RZ0, 11, RW);
    c.fillStyle = 'rgba(204,214,190,1)'; c.fillRect(-2, RZ0, 15, RW);
  });
  plano(tRegion, RX0, RZ0, RW, RW, -.35, 1, 0);
  { const g = new THREE.Mesh(new THREE.PlaneGeometry(60000, 60000), new THREE.MeshStandardMaterial({ color: 0xC2D0AC, roughness: 1 })); g.rotation.x = -Math.PI / 2; g.position.y = -.9; g.userData.vivo = true; k.escena.add(g); }

  // la autopista y la calle lateral, con su demarcación (en 3D cerca, hasta 3 km)
  { const L = 6000, tA = lienzo(0, 0, 17, 40, 256, (c) => { c.fillStyle = '#8F959E'; c.fillRect(0, 0, 17, 40); c.fillStyle = 'rgba(255,255,255,.9)'; for (const x of [2.85, 5.7, 11.3, 14.15]) for (let z = 0; z < 40; z += 10) c.fillRect(x - .07, z, .14, 4.5);
      c.fillStyle = '#E9B800'; c.fillRect(.35, 0, .14, 40); c.fillRect(16.5, 0, .14, 40); c.fillStyle = '#7E838B'; c.fillRect(8.1, 0, .8, 40); });
    tA.wrapS = tA.wrapT = THREE.RepeatWrapping; tA.repeat.set(1, L / 40);
    const a = plano(tA, -20, -L / 2, 17, L, -.08, .9, 1); a.material.map = tA;
    caja(.5, .9, L, -11.5, -.2, 0, mat(0xD6D9DD), base, .05);
    const tL = lienzo(0, 0, 9, 30, 128, (c) => { c.fillStyle = '#9CA2AA'; c.fillRect(0, 0, 9, 30); c.fillStyle = 'rgba(255,255,255,.85)'; for (let z = 0; z < 30; z += 8) c.fillRect(4.43, z, .14, 4); });
    tL.wrapS = tL.wrapT = THREE.RepeatWrapping; tL.repeat.set(1, L / 30); plano(tL, 14, -L / 2, 9, L, -.08, .9, 1);
    // paso sobre nivel: la avenida que cruza la autopista hacia la ciudad
    caja(70, .9, 22, -12, 6.6, -380, mat(0xE2E3E1), base, .1); for (const s of [-1, 1]) caja(70, .9, .35, -12, 7.5, -380 + s * 10.8, mat(0xC9CDD2), base, .05);
    for (const x of [-34, -24, -12, 0, 10]) caja(1.6, 6.6, 9, x, 0, -380, mat(0xD5D7D6), base, .3);
    for (const s of [-1, 1]) { const r = caja(110, .9, 22, -12 + s * 88, 3.2, -380, mat(0xE2E3E1), base, .1); r.rotation.z = -s * .06; }
    // postes de la autopista
    const postes = []; for (let z = -1400; z < 1400; z += 45) postes.push({ x: -11.5, z, c: 0xC2C7CE });
    const pg = new THREE.CylinderGeometry(.13, .18, 11, 6); pg.translate(0, 5.5, 0); instancias(pg, mat(0xFFFFFF), postes, false);
    const bg = new THREE.BoxGeometry(9, .2, .35); bg.translate(0, 11, 0); instancias(bg, mat(0xFFFFFF), postes.map((p) => ({ ...p })), false);
  }

  /* ───────── el horizonte: precordillera y cordillera nevada al oriente, cerros al poniente ───────── */
  function cordillera(cx, largo, ancho, alto, nieve, cBase, cAlto, semilla, segs = [220, 34]) {
    // relieve con ruido de valor en varias octavas: cumbres irregulares, quebradas y lomas (nada de conos repetidos)
    const r = azar(semilla), N = 512, tabla = Float32Array.from({ length: N }, () => r());
    const ruido1 = (u) => { const i = Math.floor(u), f = u - i, a = tabla[((i % N) + N) % N], b = tabla[(((i + 1) % N) + N) % N], s2 = f * f * (3 - 2 * f); return a + (b - a) * s2; };
    const fbm = (u, oct = 5) => { let v = 0, amp = 1, tot = 0; for (let o = 0; o < oct; o++) { v += ruido1(u * Math.pow(2.1, o) + o * 17.3) * amp; tot += amp; amp *= .5; } return v / tot; };
    const g = new THREE.PlaneGeometry(ancho, largo, segs[1], segs[0]); g.rotateX(-Math.PI / 2);
    const P = g.attributes.position, C = new Float32Array(P.count * 3), A = new THREE.Color(cBase), Bc = new THREE.Color(cAlto), Nv = new THREE.Color(0xF6F9FC), t = new THREE.Color();
    for (let i = 0; i < P.count; i++) {
      const x = P.getX(i), z = P.getZ(i), u = x / (ancho / 2);
      const eje = (fbm(z / largo * 7 + 3.1, 3) - .5) * .5, d = Math.abs(u - eje), perfil = Math.pow(Math.max(0, 1 - d), 1.6);
      const cresta = Math.pow(fbm(z / largo * 9), 1.5) * 1.5, detalle = (fbm(z / largo * 40 + x / ancho * 9, 4) - .5) * .35, valle = Math.pow(fbm(x / ancho * 5 + z / largo * 22 + 9, 3), 2) * .25;
      const h = Math.max(0, alto * perfil * (.45 + cresta + detalle - valle)); P.setY(i, h);
      const kq = h / alto; t.copy(A).lerp(Bc, Math.min(1, kq * 1.2)); if (nieve && kq > nieve + detalle * .4) t.lerp(Nv, Math.min(1, (kq - nieve) * 4)); C.set([t.r, t.g, t.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.computeVertexNormals();
    const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, fog: false })); m.position.set(cx, -1, 20); m.userData.vivo = true; m.frustumCulled = false; k.escena.add(m); return m;
  }
  cordillera(11500, 40000, 7000, 1500, .58, 0xB8C5D6, 0xD3DCE8, 7, [300, 46]);   // los Andes, lejos y azulados
  cordillera(6200, 26000, 2600, 380, 0, 0xC3CDCF, 0xCFD7DB, 21, [180, 26]);      // precordillera
  cordillera(-7200, 30000, 4200, 520, 0, 0xC8D0C9, 0xD3DAD5, 33, [160, 24]);  // cordillera de la costa, al poniente
  { const g = cordillera(70, 9000, 3000, 340, 0, 0xC8D0C9, 0xD3DAD5, 45, [60, 30]); g.rotation.y = Math.PI / 2; g.position.set(1500, -1, -7600); const h = g.clone(); h.position.set(1500, -1, 7800); k.escena.add(h); }

  /* ───────── la ciudad al oriente (Santiago a la distancia) ───────── */
  {
    const lista = [], tonos = [0xE8E9EB, 0xDDE1E6, 0xF1EFEA, 0xD3D9E0, 0xE4E0D8, 0xC9D2DC];
    for (let i = 0; i < 1800; i++) { const x = 1700 + R() * 2600, z = -3200 + R() * 6400; const s = 1 - Math.min(1, Math.hypot(x - 2900, (z + 300) * .8) / 1700);
      const h = 6 + R() * 14 + Math.pow(s, 3) * R() * 80; lista.push({ x, z, sx: 18 + R() * 30, sy: h, sz: 18 + R() * 30, c: tonos[Math.floor(R() * tonos.length)] }); }
    for (let i = 0; i < 26; i++) { const a = R() * 6.28, d = R() * 300; lista.push({ x: 2950 + Math.cos(a) * d, z: -340 + Math.sin(a) * d * 1.4, sx: 30 + R() * 22, sy: 70 + R() * 70, sz: 30 + R() * 22, c: [0xBFCFE0, 0xD7DEE6, 0xA9BCD0][i % 3] }); }
    lista.push({ x: 2990, z: -360, sx: 40, sy: 190, sz: 40, c: 0xB3C4D6 });   // la torre más alta del distrito financiero
    const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, .5, 0); instancias(g, mat(0xFFFFFF, { roughness: .7 }), lista, false);
  }

  /* ───────── el parque industrial: otros centros de distribución alrededor ───────── */
  const vecinos = grupo(0, 0, 0, 0);
  {
    const muros = [0xF2F2F0, 0xE8ECF0, 0xDFE5EC, 0xEDE8E0, 0xF4F4F4, 0xE0E4E8], franjas = [0x2F6FB0, 0xC8553D, 0x2B8A66, 0x3A4150, 0xE0A93A, 0x6B7380];
    const galpon = (x0, z0, w, d, h, lado) => {
      const cm = muros[Math.floor(R() * muros.length)], cf = franjas[Math.floor(R() * franjas.length)];
      caja(w, h, d, x0 + w / 2, 0, z0 + d / 2, mat(cm, { roughness: .8 }), vecinos, .2);
      caja(w + .8, .7, d + .8, x0 + w / 2, h, z0 + d / 2, mat(0xD5D9DE, { roughness: .75 }), vecinos, .1);
      caja(w + .2, .9, d + .2, x0 + w / 2, h - 1.6, z0 + d / 2, mat(cf, { roughness: .6 }), vecinos, .05);
      for (let x = x0 + 7; x < x0 + w - 5; x += 11) caja(2, .16, d - 6, x, h + .7, z0 + d / 2, mat(0xEEF4FA, { roughness: .2 }), vecinos, .02);
      for (let i = 0; i < 2 + Math.floor(R() * 3); i++) caja(2.6, 1.4, 2.2, x0 + 6 + R() * (w - 12), h + .7, z0 + 6 + R() * (d - 12), mat(0xC9CED6), vecinos, .2);
      const n = Math.floor(w / 6), zf = lado < 0 ? z0 - .1 : z0 + d + .1;
      for (let i = 1; i < n; i += 1 + (i % 3 === 0)) caja(3.2, 3.6, .3, x0 + i * 6, 0, zf, mat(0x3A4150, { roughness: .6 }), vecinos, .05);
      // patio y camiones esperando
      const zp = lado < 0 ? z0 - 26 : z0 + d, pz = zp + 13;
      for (let i = 0; i < 2 + Math.floor(R() * 4); i++) { const x = x0 + 8 + R() * (w - 16); caja(2.5, 3.5, 12, x, 0, pz, mat(0xEEF1F4), vecinos, .1); caja(2.4, 2.6, 2.5, x, .3, pz + lado * -7.4, mat(franjas[Math.floor(R() * 6)], { roughness: .4 }), vecinos, .3); }
      return { x0, z0, w, d, lado };
    };
    const lotes = [];
    for (let bx = 210; bx < 1100; bx += 270) for (let bz = -1080; bz < 1080; bz += 280) { if (bx < 260 && bz > -160 && bz < 160) continue; lotes.push([bx + 20 + R() * 30, bz + 30 + R() * 30, 150 + R() * 70, 90 + R() * 70]); }
    for (let bx = -720; bx < -120; bx += 230) for (let bz = -700; bz < 720; bz += 240) lotes.push([bx + 20 + R() * 20, bz + 30 + R() * 25, 120 + R() * 60, 80 + R() * 60]);
    for (let bz = -1050; bz < 1050; bz += 210) { if (bz > -230 && bz < 160) continue; lotes.push([40 + R() * 20, bz + 20, 120 + R() * 30, 90 + R() * 40]); }
    for (let i = lotes.length - 1; i >= 0; i--) { const [, z, , d] = lotes[i]; if (z - 30 < -360 && z + d + 34 > -400) lotes.splice(i, 1); }
    const galpones = lotes.map(([x, z, w, d]) => galpon(x, z, w, d, 10 + R() * 5, R() < .5 ? -1 : 1));
    k.fusionar(vecinos);
    // autos en los estacionamientos de los vecinos (cajitas, de lejos se leen como autos)
    const autos = [], ac = [0xF2F2F2, 0x2B2F36, 0x8FA3BC, 0xB9C0C8, 0xC8553D, 0x2F6FB0, 0x6B7380];
    for (const [x, z, w, d] of lotes) { const fila = z + d + 30; for (let i = 0; i < w / 3.2 - 4; i++) if (R() < .7) autos.push({ x: x + 6 + i * 3.2, z: fila + (i % 2) * .3, sx: 1.8, sy: 1.4, sz: 4.3, c: ac[Math.floor(R() * ac.length)] }); }
    for (const a of autos) { a.sy = 1; a.ry = Math.PI / 2; a.sx = 1; a.sz = 1; }
    const gc = new THREE.BoxGeometry(4.2, .62, 1.75); gc.translate(0, .52, 0); instancias(gc, mat(0xFFFFFF, { roughness: .35 }), autos, false);
    const gv = new THREE.BoxGeometry(2.2, .5, 1.55); gv.translate(-.2, 1.07, 0); instancias(gv, mat(0x39424F, { roughness: .2, metalness: .3 }), autos.map((a) => ({ ...a, c: null })), false);
    const gr = new THREE.BoxGeometry(3.3, .42, 1.82); gr.translate(0, .21, 0); instancias(gr, mat(0x1E2126, { roughness: .8 }), autos.map((a) => ({ ...a, c: null })), false);
    // asfalto: estacionamiento bajo cada fila de autos y patio de camiones frente a los andenes (antes estaban sobre el pasto)
    const asf = []; for (const g of galpones) { const fila = g.z0 + g.d + 30, zz0 = g.lado < 0 ? g.z0 + g.d : g.z0 + g.d + 26; asf.push({ x: g.x0 + g.w / 2, z: (zz0 + fila + 4.5) / 2, sx: g.w, sz: fila + 4.5 - zz0 }); /* estacionamiento pegado al galpón, sin pasto entre medio */ const zp = g.lado < 0 ? g.z0 - 26 : g.z0 + g.d; asf.push({ x: g.x0 + g.w / 2, z: zp + 13, sx: g.w, sz: 26 }); }
    // accesos: cada galpón se une a la calle más cercana con un camino propio (pista lateral + conexión a la calle)
    const V = [200, 470, 740, 1000], H = [-420, 180, 520];
    for (const g of galpones) { const fila = g.z0 + g.d + 30, zp = g.lado < 0 ? g.z0 - 26 : g.z0 + g.d, za = Math.min(zp, fila - 4.5), zb = Math.max(zp + 26, fila + 4.5), xl = g.x0 - 6;
      asf.push({ x: xl, z: (za + zb) / 2, sx: 8, sz: zb - za });                                     // pista a lo largo del galpón
      asf.push({ x: (xl + g.x0 + 2) / 2, z: fila + .15, sx: g.x0 + 2 - xl, sz: 9 });                  // estacionamiento → pista
      asf.push({ x: (xl + g.x0) / 2, z: zp + 13, sx: g.x0 - xl, sz: 26 });                            // patio → pista
      if (g.x0 > 28) { const xs = g.x0 < 150 ? 23 : Math.max(...V.filter((v) => v < g.x0)) + 6, zc = zp + 13;   // a la calle del oriente / calle lateral
        asf.push({ x: (xs + xl) / 2, z: zc, sx: xl - xs + 4, sz: 9 }); }
      else { const zm = (za + zb) / 2, zs = H.reduce((m, h) => Math.abs(h - zm) < Math.abs(m - zm) ? h : m, H[0]), z1 = zs < za ? zs : zb, z2 = zs < za ? za : zs;   // parque poniente: a la calle norte o sur
        asf.push({ x: xl, z: (z1 + z2) / 2, sx: 8, sz: Math.abs(z2 - z1) + 5 }); } }
    const ga = new THREE.BoxGeometry(1, .3, 1); ga.translate(0, -.18, 0); instancias(ga, mat(0xA9AFB8, { roughness: .95 }), asf.map((a) => ({ ...a, sy: 1 })), false);
  }

  /* ───────── árboles (instanciados): redondos, álamos y pinos ───────── */
  const arboles = { redondo: [], alamo: [], pino: [] }, verdes = [0xA9C79A, 0x98BC8A, 0xB7D0A4, 0x8DB27F, 0xC2D6A9];
  const arbol = (tipo, x, z, s = 1) => arboles[tipo].push({ x, z, s: s * (.85 + R() * .3), ry: R() * 6.28, c: verdes[Math.floor(R() * verdes.length)] });

  /* ───────── el predio: patios, estacionamientos, oficina principal y parque ───────── */
  const tFuera = lienzo(24, -70, 156, 150, 4096, (c) => {
    c.fillStyle = '#C3D6AB'; c.fillRect(24, -70, 156, 150);
    for (let i = 0; i < 1600; i++) { c.fillStyle = `rgba(${R() < .5 ? '150,180,120' : '230,236,214'},${.05 + R() * .08})`; const r = .5 + R() * 3; c.beginPath(); c.arc(24 + R() * 156, -70 + R() * 150, r, 0, 7); c.fill(); }
    const asf = (x, z, w, d, cc = '#C9CDD3') => { c.fillStyle = cc; c.fillRect(x, z, w, d); };
    const linea = (x0, z0, x1, z1, w = .15, cc = 'rgba(255,255,255,.85)') => { c.strokeStyle = cc; c.lineWidth = w; c.beginPath(); c.moveTo(x0, z0); c.lineTo(x1, z1); c.stroke(); };
    // accesos desde la calle lateral: camiones por el norte, autos y personas por el poniente
    asf(23, -24, 12, 10); asf(23, 29, 12, 10); asf(29, -36, 92, 36, '#C7CBD1'); asf(40, -50, 48, 14, '#CED2D7');
    for (let x = 42; x <= 86; x += 2.8) { linea(x, -49.5, x, -44.7); linea(x, -41.3, x, -36.5); }
    for (const x of ANDENES) { linea(x - 2, -20, x - 2, -.2, .14, 'rgba(233,184,0,.75)'); linea(x + 2, -20, x + 2, -.2, .14, 'rgba(233,184,0,.75)'); }
    asf(111, -6, 22, 32, '#CED2D7'); for (let z = -4; z <= 22; z += 2.8) { linea(112, z, 117, z); linea(127, z, 132, z); }
    asf(92, 22, 37, 18, '#CED2D7'); for (let x = 94; x <= 127; x += 2.8) { linea(x, 23, x, 28); linea(x, 34, x, 39); }
    asf(35, 41, 62, 26, '#C7CBD1'); asf(84, 40, 4, 2);
    // veredas de las personas (estas sí se ven: afuera no pasan grúas)
    c.fillStyle = '#EDEEE9'; c.fillRect(24, 32.4, 11, 1.4); c.fillRect(110, 11.4, 31, 1.2); c.fillRect(134.9, 4, 1.2, 26); c.fillRect(50.9, -1.4, 1.2, 1.4); c.fillRect(110, -1.6, 24, 1.3); c.fillRect(24, -2.2, 6, 1.4);
    // parque: senderos curvos, laguna y césped cortado a franjas
    c.fillStyle = '#B7D29C'; c.fillRect(131, 23, 29, 23); for (let x = 131; x < 160; x += 2.4) { c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(x, 23, 1.2, 23); }
    c.fillStyle = '#BCD6E6'; c.beginPath(); c.ellipse(149, 34, 5.5, 3.6, .3, 0, 7); c.fill(); c.strokeStyle = '#EDEEE9'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(132, 28); c.bezierCurveTo(138, 24, 142, 41, 159, 37); c.stroke();
    // cerco del predio
    c.strokeStyle = 'rgba(90,100,110,.35)'; c.lineWidth = .12; c.strokeRect(26, -58, 136, 128);
  });
  plano(tFuera, 24, -70, 156, 150, -.12, 1, 2);
  for (let z = -1500; z < 1500; z += 13 + R() * 4) { if (Math.abs(z + 380) > 16) { arbol('alamo', -27, z, 1.05); arbol('alamo', 4 + R() * .6, z + 6, .95); } }
  for (let z = -1500; z < 1500; z += 26) if (z < -66 || z > 76) arbol('alamo', 26.5, z + R() * 4, 1);
  for (let x = 28; x < 162; x += 7 + R() * 3) { arbol('redondo', x, -61 + R(), 1.1); arbol('redondo', x, 73 + R(), 1.1); }
  for (let z = -56; z < 70; z += 7 + R() * 3) { if (z > -26 && z < -12) continue; if (z > 27 && z < 41) continue; arbol('redondo', 25 + R(), z, 1); }
  for (let z = -56; z < 70; z += 7) arbol('redondo', 164 + R(), z, 1.1);
  for (let i = 0; i < 22; i++) arbol('redondo', 132 + R() * 26, 24 + R() * 20, .9 + R() * .6);
  for (let i = 0; i < 12; i++) arbol(R() < .5 ? 'pino' : 'redondo', 132 + R() * 28, -22 + R() * 20, 1 + R() * .4);
  for (let x = 42; x <= 86; x += 11) arbol('redondo', x, -43, .8);
  for (let z = -2; z <= 22; z += 6) arbol('redondo', 122, z, .85);
  // árboles del parque industrial y del valle (hileras de álamos entre los campos)
  for (let i = 0; i < 260; i++) { const x = 30 + R() * 1100, z = -1100 + R() * 2200; if (x < 180 && z > -80 && z < 90) continue; arbol(R() < .7 ? 'redondo' : 'pino', x, z, 1.2); }
  for (let f = 0; f < 46; f++) { const vertical = R() < .5, a = vertical ? -2900 + R() * 2840 : -2900 + R() * 5800, b = -2900 + R() * 5000, L = 200 + R() * 500;
    for (let s = 0; s < L; s += 12) { const x = vertical ? a : b + s, z = vertical ? b + s : a; if (x > -70 && x < 1150 && z > -1150 && z < 1150) continue; if (x > 1150) continue; arbol('alamo', x, z, 1.15); } }
  {
    const tronco = new THREE.CylinderGeometry(.09, .16, 2.2, 6); tronco.translate(0, 1.1, 0);
    const copaR = new THREE.IcosahedronGeometry(1.7, 1); copaR.scale(1, .92, 1); copaR.translate(0, 3.2, 0);
    const copaA = new THREE.IcosahedronGeometry(1, 1); copaA.scale(1.05, 4.2, 1.05); copaA.translate(0, 5.6, 0);
    const copaP = new THREE.ConeGeometry(1.5, 5.2, 7); copaP.translate(0, 4.4, 0);
    const hoja = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: .95, flatShading: true }), madera = mat(0xA88E74, { roughness: .95 });
    for (const [tipo, copa] of [['redondo', copaR], ['alamo', copaA], ['pino', copaP]]) {
      const l = arboles[tipo]; if (!l.length) continue;
      instancias(tronco, madera, l.map((p) => ({ ...p, c: null, sy: p.s * (tipo === 'alamo' ? 1.4 : 1) })), true);
      instancias(copa, hoja, l, true);
    }
  }

  /* ───────── pisos de la nave (canvas en metros), con la pintura gastada ───────── */
  function gastada(c, x0, z0, x1, z1, w, cc, vida) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(L / .28), ux = (x1 - x0) / L, uz = (z1 - z0) / L; c.fillStyle = cc;
    for (let i = 0; i < n; i++) { if (R() > vida) continue; c.globalAlpha = .22 + R() * .6; const a = i * .28, l = .28 * (.45 + R() * .7), cx = x0 + ux * a, cz = z0 + uz * a;
      c.fillRect(cx - (uz ? w / 2 : 0), cz - (ux ? w / 2 : 0), Math.abs(ux) * l + (uz ? w : 0), Math.abs(uz) * l + (ux ? w : 0)); }
    c.globalAlpha = 1;
  }
  const calle = (c, x0, z0, x1, z1, vida = .5) => { c.fillStyle = 'rgba(96,104,118,.13)'; c.fillRect(x0, z0, x1 - x0, z1 - z0);
    if (x1 - x0 > z1 - z0) { gastada(c, x0, z0, x1, z0, .12, '#E2B100', vida); gastada(c, x0, z1, x1, z1, .12, '#E2B100', vida); } else { gastada(c, x0, z0, x0, z1, .12, '#E2B100', vida); gastada(c, x1, z0, x1, z1, .12, '#E2B100', vida); } };
  const sendero = (c, x0, z0, x1, z1, vida = .3) => { const h = x1 - x0 > z1 - z0; c.fillStyle = 'rgba(52,160,96,.085)'; c.fillRect(x0, z0, x1 - x0, z1 - z0);
    if (h) { gastada(c, x0, z0, x1, z0, .1, '#2F9E63', vida); gastada(c, x0, z1, x1, z1, .1, '#2F9E63', vida); } else { gastada(c, x0, z0, x0, z1, .1, '#2F9E63', vida); gastada(c, x1, z0, x1, z1, .1, '#2F9E63', vida); } };
  const cebra = (c, x0, z0, x1, z1, vida = .22) => { const h = x1 - x0 > z1 - z0;
    if (h) for (let x = x0 + .15; x < x1 - .3; x += .6) gastada(c, x, z0 + .08, x, z1 - .08, .3, '#F0C419', vida * 1.6);
    else for (let z = z0 + .15; z < z1 - .3; z += .6) gastada(c, x0 + .08, z, x1 - .08, z, .3, '#F0C419', vida * 1.6); };
  const tNave = lienzo(35, 0, 75, 40, 4096, (c) => {
    c.fillStyle = '#CFCCC6'; c.fillRect(35, 0, 75, 40);
    c.fillStyle = '#E3DED4'; c.fillRect(35, 7, 5, 11.5); for (let x = 35; x < 40; x += .6) for (let z = 7; z < 18.5; z += .6) if ((Math.round(x / .6) + Math.round(z / .6)) % 2) { c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, z, .6, .6); }
    c.fillStyle = '#D5DEE8'; c.fillRect(35, 18.5, 5, 11.5); c.fillStyle = '#CFCAC2'; c.fillRect(35, 30, 10, 10);
    c.fillStyle = '#DCE6F1'; c.fillRect(40.2, 22.9, 17.6, 7.1); c.fillRect(45.15, 29.9, 12.65, 2.95);
    c.fillStyle = '#D9DDD3'; c.fillRect(40.2, 8.2, 17.6, 12); c.fillStyle = '#D3D7DE'; c.fillRect(90, 0, 20, 6); c.fillStyle = '#E4E7EC'; c.fillRect(96.5, 13, 13, 6.5);
    c.strokeStyle = 'rgba(0,0,0,.045)'; c.lineWidth = .04; for (let x = 35; x <= 110; x += 6) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 40); c.stroke(); } for (let z = 0; z <= 40; z += 6) { c.beginPath(); c.moveTo(35, z); c.lineTo(110, z); c.stroke(); }
    for (let i = 0; i < 260; i++) { const x = 35 + R() * 75, z = R() * 40, r = .3 + R() * 1.6, g = c.createRadialGradient(x, z, 0, x, z, r); g.addColorStop(0, `rgba(60,55,50,${.02 + R() * .05})`); g.addColorStop(1, 'rgba(60,55,50,0)'); c.fillStyle = g; c.fillRect(x - r, z - r, r * 2, r * 2); }
    calle(c, 35, 0.15, 88, 7, .35); calle(c, 58.5, 6.25, 110, 9.75); calle(c, 84, 8, 88, 40); calle(c, 40.2, 20.25, 85, 22.75); calle(c, 35, 33.25, 85, 36.75);
    for (const x of [61, 65, 69, 73, 77, 81]) { c.fillStyle = 'rgba(96,104,118,.07)'; c.fillRect(x - 1.25, 9.75, 2.5, 23.5); }
    c.lineCap = 'round';
    for (let i = 0; i < 80; i++) { c.strokeStyle = `rgba(35,35,40,${.03 + R() * .05})`; c.lineWidth = .18 + R() * .1; const t = R(); c.beginPath();
      if (t < .3) { const z = 7 + R() * 2, x = 58 + R() * 40; c.moveTo(x, z); c.lineTo(x + 4 + R() * 12, z + (R() - .5) * .4); }
      else if (t < .55) { const x = 84.6 + R() * 2.8, z = 9 + R() * 22; c.moveTo(x, z); c.lineTo(x + (R() - .5) * .4, z + 3 + R() * 8); }
      else if (t < .8) { const z = 20.6 + R() * 1.8, x = 42 + R() * 30; c.moveTo(x, z); c.lineTo(x + 4 + R() * 10, z + (R() - .5) * .3); }
      else { const x = [61, 65, 69, 73, 77, 81][Math.floor(R() * 6)] + (R() - .5) * 1.2, z = R() < .5 ? 10 : 23; c.moveTo(x, z); c.quadraticCurveTo(x, z - 1.6, x + (R() < .5 ? -2.4 : 2.4), z - 1.9 - R() * .6); }
      c.stroke(); }
    sendero(c, 56.5, 8.9, 88.5, 10.1, .26); sendero(c, 88, 0, 89, 40, .34); sendero(c, 45, 36.9, 88.5, 38.1, .3); sendero(c, 40, 6.9, 57, 8.1, .3); sendero(c, 56.4, 7.5, 57.6, 37.5, .3); sendero(c, 50.9, 0, 52.1, 7.5, .3); sendero(c, 88.5, 11.4, 110, 12.6, .36);
    for (const x of [61, 65, 69, 73, 77, 81]) cebra(c, x - 1.25, 8.9, x + 1.25, 10.1, x === 69 ? .13 : .2);
    cebra(c, 84, 8.9, 88, 10.1); cebra(c, 56.4, 20.25, 57.6, 22.75); cebra(c, 56.4, 33.25, 57.6, 36.75); cebra(c, 84, 36.9, 88, 38.1); cebra(c, 50.9, 3, 52.1, 6.9, .16);
    c.font = '700 .9px Poppins, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
    ANDENES.forEach((x, i) => { gastada(c, x - 1.6, 2.8, x - 1.6, 6, .1, '#E2B100', .5); gastada(c, x + 1.6, 2.8, x + 1.6, 6, .1, '#E2B100', .5); gastada(c, x - 1.6, 6, x + 1.6, 6, .1, '#E2B100', .5); c.fillStyle = 'rgba(226,177,0,.4)'; c.fillText(String(i + 1), x, 5.2); });
    c.fillStyle = 'rgba(40,44,52,.2)'; c.font = '700 1.1px Poppins, Arial'; c.fillText('RECEPCIÓN', 42, 4.2); c.fillText('BATERÍAS', 100, 3.2); c.fillText('DESPACHO', 72.5, 1.2);
  });
  plano(tNave, 35, 0, 75, 40, 0, .9, 4);

  /* ───────── la nave: murallas completas (bajan en las tomas aéreas) ───────── */
  const T = .3, muros = grupo(); W.muros = muros;
  const zocalo = mat(0xC9C3BA, { roughness: .9 }), panel = mat(0xEEEFF0, { roughness: .75 }), remate = mat(0x3A4150, { roughness: .6 }), franja = mat(0x9AA4B1, { roughness: .6 });
  function tramoMuro(a, b, fijo, h0, h1, horiz) { const L = b - a; if (L < .03 || h1 - h0 < .03) return; const c = (a + b) / 2;
    const pon = (y0, y1, m) => { const hh = Math.min(h1, y1) - Math.max(h0, y0); if (hh <= .01) return; const y = Math.max(h0, y0); horiz ? caja(L, hh, T, c, y, fijo, m, muros, .015) : caja(T, hh, L, fijo, y, c, m, muros, .015); };
    pon(0, 1.2, zocalo); pon(1.2, 5.7, panel); pon(5.7, 6.0, franja); pon(6.0, ALERO - .35, panel); pon(ALERO - .35, ALERO, remate); }
  function muro(horiz, fijo, a0, a1, huecos = []) { let a = a0; for (const [h0, h1, al] of [...huecos].sort((p, q) => p[0] - q[0])) { tramoMuro(a, h0, fijo, 0, ALERO, horiz); tramoMuro(h0, h1, fijo, al, ALERO, horiz); a = h1; } tramoMuro(a, a1, fijo, 0, ALERO, horiz); }
  muro(true, 0, 34.85, 110.15, [[51, 52, 2.3], [88, 89, 2.3], ...ANDENES.map((x) => [x - 1.5, x + 1.5, 3.4])]);
  muro(false, 35, 0, 40, [[33.25, 36.75, 4.3]]);
  muro(true, 40, 34.85, 90.15, [[84, 88, 4.3], [88.1, 88.9, 2.3]]);
  muro(false, 90, 20, 40); muro(true, 20, 89.85, 110.15); muro(false, 110, 0, 20, [[6, 10, 4.3], [11.5, 12.5, 2.3]]);
  // marcos de portones, letreros de andén y la marquesina sobre los andenes
  const numero = (txt, w, h, cc = '#1b2230', fondo = '#ffffff') => new THREE.MeshBasicMaterial({ map: tex((c, Wd, Hh) => { c.fillStyle = fondo; c.fillRect(0, 0, Wd, Hh); c.fillStyle = cc; c.font = `800 ${Hh * .7}px Poppins, Arial`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, Wd / 2, Hh / 2 + Hh * .04); }, 256, Math.round(256 * h / w)), toneMapped: false });
  { const n = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.0), numero('CENTRO DE DISTRIBUCIÓN', 7.2, 1, '#ffffff', '#3A4150')); n.position.set(44, 6.6, -T / 2 - .02); n.rotation.y = Math.PI; muros.add(n); }
  k.fusionar(muros);

  /* ───────── el techo: dos aguas con tragaluces, cerchas y luminarias (se desvanece en las tomas aéreas) ───────── */
  const techo = grupo(); W.techo = techo; const mTecho = [];
  const tmat = (c, o = {}) => { const m = std(c, { transparent: true, ...o }); m.userData.op = o.opacity ?? 1; mTecho.push(m); return m; };
  const chapa = tex((c, Wd, Hh) => { c.fillStyle = '#E3E6EA'; c.fillRect(0, 0, Wd, Hh); for (let x = 0; x < Wd; x += 16) { c.fillStyle = 'rgba(120,128,140,.22)'; c.fillRect(x, 0, 3, Hh); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x + 4, 0, 2, Hh); } }, 256, 64);
  chapa.wrapS = chapa.wrapT = THREE.RepeatWrapping;
  const mChapa = tmat(0xFFFFFF, { map: chapa, roughness: .55, metalness: .25, side: THREE.DoubleSide }), mTraga = tmat(0xF2F6FB, { roughness: .35, opacity: .96, emissive: 0xEAF2FF, emissiveIntensity: .45, side: THREE.DoubleSide });
  const mAcero = tmat(0xB8C0CA, { roughness: .45, metalness: .5 }), mCanal = tmat(0x8E97A3, { roughness: .5 }), mLamp = tmat(0x2B2F36, { roughness: .5 }), mFoco = tmat(0xFFFFFF, { emissive: 0xFFF1D6, emissiveIntensity: 1.6, roughness: .3 });
  function agua(x0, x1, zA, zB, yA, yB, tragaluces) {   // un faldón: de (zA, yA) a (zB, yB), a lo largo de x
    const L = x1 - x0, largo = Math.hypot(zB - zA, yB - yA), ang = Math.atan2(yB - yA, zB - zA);
    const g = new THREE.BoxGeometry(L, .12, largo); const t = chapa.clone(); t.repeat.set(L / 4, 1); t.needsUpdate = true; const m = mChapa.clone(); m.map = t; m.userData.op = 1; mTecho.push(m);
    const o = new THREE.Mesh(g, m); o.position.set((x0 + x1) / 2, (yA + yB) / 2, (zA + zB) / 2); o.rotation.x = -ang; o.receiveShadow = true; techo.add(o);
    for (const x of tragaluces) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.2, .14, largo - 2.4), mTraga); s.position.copy(o.position); s.position.x = x; s.position.y += .09; s.rotation.x = -ang; techo.add(s); }
  }
  const TRG = []; for (let x = 39.5; x < 90; x += 7.5) TRG.push(x);
  agua(34.6, 90.4, -.45, 20, ALERO - .15, CUMBRE, TRG); agua(34.6, 90.4, 40.45, 20, ALERO - .15, CUMBRE, TRG);
  { const sh = new THREE.Shape(); sh.moveTo(-.3, 0); sh.lineTo(40.3, 0); sh.lineTo(20, CUMBRE - ALERO + .1); sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: false }), mh = tmat(0xE9EAEC, { roughness: .75 });
    for (const x of [35.15, 90.15]) { const h = new THREE.Mesh(geo, mh); h.rotation.y = -Math.PI / 2; h.position.set(x, ALERO - .2, 0); h.castShadow = true; techo.add(h); } }
  caja(55.8, .3, .5, 62.5, CUMBRE - .05, 20, mAcero, techo, .05);                           // cumbrera
  for (const z of [-.45, 40.45]) caja(55.8, .28, .3, 62.5, ALERO - .3, z, mCanal, techo, .04);   // canaletas
  // anexo oriente (baterías y oficina): techo de un agua
  agua(89.8, 110.45, 20.4, -.45, ALERO - .15, ALERO + .9, [94, 100, 106]); caja(20.6, .28, .3, 100.1, ALERO - .3, 20.4, mCanal, techo, .04);
  // cerchas cada 7,5 m: cordón inferior, cordones superiores, montantes y diagonales
  for (let x = 35.75; x < 90; x += 7.5) {
    caja(.16, .22, 40, x, ALERO - .55, 20, mAcero, techo, .02);
    for (const [za, zb] of [[0, 20], [40, 20]]) { const ya = ALERO - .3, yb = CUMBRE - .25; barra(V3(x, ya, za), V3(x, yb, zb), .16, mAcero, techo);
      for (let i = 1; i < 5; i++) { const u = i / 5, z = za + (zb - za) * u, y = ya + (yb - ya) * u; barra(V3(x, ALERO - .45, z), V3(x, y, z), .07, mAcero, techo); const u2 = (i + .5) / 5; barra(V3(x, ALERO - .45, z), V3(x, ya + (yb - ya) * u2, za + (zb - za) * u2), .06, mAcero, techo); } }
  }
  for (const z of [5, 12, 28, 35]) caja(55, .12, .12, 62.5, ALERO + (z < 20 ? z : 40 - z) / 20 * (CUMBRE - ALERO) - .45, z, mAcero, techo, .01);   // costaneras
  // luminarias de campana colgadas de las cerchas
  const lamp = (x, z, y = 6.5) => { caja(.03, ALERO - .55 - y - .4, .03, x, y + .4, z, mLamp, techo, .005); cil(.2, .3, x, y + .12, z, mLamp, techo, 12, .12); cil(.42, .14, x, y, z, mLamp, techo, 16, .22); cil(.38, .02, x, y - .01, z, mFoco, techo, 16); };
  for (let x = 39.5; x < 90; x += 7.5) for (const z of [4, 11.5, 28.5, 36]) lamp(x, z);
  for (const x of [94, 100, 106]) for (const z of [5, 14]) lamp(x, z, 5.6);
  // equipos sobre el techo: extractores y climatización (se ven desde el aire)
  W.extractores = [];
  for (const [x, z] of [[47, 9], [62, 9], [77, 9], [47, 31], [62, 31], [77, 31]]) { const y = ALERO + ((z < 20 ? z : 40 - z) / 20) * (CUMBRE - ALERO) + .05; cil(.55, .5, x, y, z, mAcero, techo, 18); const a = caja(.9, .06, .14, x, y + .52, z, mCanal, techo, .02); W.extractores.push(a); }
  for (const [x, z] of [[97, 4], [103, 8]]) caja(2.4, 1.3, 1.8, x, ALERO + .5, z, mAcero, techo, .15);
  caja(26, .25, 4.2, 72.75, 4.6, -2.1, tmat(0xDDE1E6), techo, .04); for (const x of [60, 85.5]) cil(.09, 4.6, x, 0, -4, mCanal, techo, 8);
  k.fusionar(techo);
  techo.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
  W.casa = (kt, km) => { for (const m of mTecho) { m.opacity = kt * m.userData.op; m.depthWrite = kt > .97; } techo.visible = kt > .01; muros.scale.y = 3 / ALERO + (1 - 3 / ALERO) * km; };

  /* ───────── andenes y camiones ───────── */
  const acero = mat(0x8D96A3, { roughness: .4, metalness: .5 }), goma = mat(0x1E2126, { roughness: .8 }), cortina = mat(0xE4E8ED, { roughness: .5 });
  ANDENES.forEach((x, i) => {
    caja(2.3, .05, 2.5, x, 0, 1.35, acero, base, .01); caja(2.3, .06, .3, x, 0, 2.75, mat(0xF5C400), base, .01);
    for (const s of [-1, 1]) { caja(.16, 3.5, .34, x + s * 1.6, 0, -.05, mat(0xF5C400, { roughness: .5 }), base, .03); caja(.3, .5, .2, x + s * 1.15, .5, -.3, goma, base, .04); }
    caja(3.1, .5, .16, x, 3.4, .25, cortina, base, .03);
    const n = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), numero(String(i + 1), 1, 1, '#ffffff', '#1b2230')); n.position.set(x, 4.0, -T / 2 - .03); n.rotation.y = Math.PI; base.add(n);
    const sem = grupo(x + 1.95, 0, .3, 0, base); caja(.2, .5, .12, 0, 2.2, 0, goma, sem, .04); esfera(.06, 0, 2.56, .07, luz(0xFF3B3B, 0x4a1515), sem, 10); esfera(.06, 0, 2.36, .07, luz(0x22C55E, 0x123a20), sem, 10);
  });
  W.camiones = [[63.5, 0x2F6FB0], [73, 0xB9C0C8], [82, 0x2B8A66]].map(([x, c]) => { const t = eq.camion(base, c); t.g.position.set(x, 0, -3.72); t.g.rotation.y = Math.PI / 2; return t; });
  for (const [x, z, ry, c] of [[100, -22, Math.PI, 0xC9603A], [46, -26, Math.PI / 2, 0xE9EDF2], [108, -12, Math.PI, 0x2F6FB0]]) { const t = eq.camion(base, c); t.g.position.set(x, 0, z); t.g.rotation.y = ry; }

  /* ───────── estructura: columnas ───────── */
  for (const [x, z] of COLUMNAS) eq.columna(base, x, z, ALERO - .55, false, base);

  /* ───────── racks con su carga ───────── */
  const NIV = [0, 1.7, 3.3, 4.9];
  const palletEn = (padre, x, y, z) => { const g = md.pallet(padre, R() > .62 ? 'film' : 'caja', .7 + R() * .28); g.position.set(x, y, z); g.rotation.y = (R() - .5) * .06; return g; };
  for (const x of RACKS_X) for (const [z0, z1] of [[10, 20], [23, 33]]) {
    const f = md.filaRack(base, x - .55, x + .55, z0, z1, NIV, 6.5);
    for (const h of f.huecos) {
      if (x === 71.05 && z0 === 10 && h.y === 3.3 && Math.abs(h.z - 15.6) < .7) { W.hueco = { x: h.x, y: h.y + .04, z: h.z }; continue; }
      if (R() > .2) palletEn(base, h.x, h.y + (h.y ? .04 : 0), h.z);
    }
    for (const [zz, ry] of [[z0 - .06, Math.PI], [z1 + .06, 0]]) { const l = new THREE.Mesh(new THREE.PlaneGeometry(.8, .5), numero(String.fromCharCode(65 + RACKS_X.indexOf(x)) + (z0 === 10 ? '1' : '2'), .8, .5, '#ffffff', '#056CF2')); l.position.set(x, 5.9, zz); l.rotation.y = ry; base.add(l); }
  }
  W.palletPick = md.pallet(vivo, 'caja', .9); W.palletPick.position.set(W.hueco.x, W.hueco.y, W.hueco.z);
  // el rack que Alejandro golpeó hace unos días: pie doblado, cinta de peligro y restos en el piso
  { const g = grupo(70.52, 0, 10.02, 0, vivo), nar = mat(0xD9732A, { roughness: .6 }); W.rackDanadoG = g;
    const p = caja(.11, 1.5, .11, 0, 0, 0, nar, g, .01); p.rotation.z = .2; p.rotation.x = -.12; p.position.x = -.06;
    for (const y of [.5, .95]) { const c = caja(1.25, .07, .02, .55, y, -.09, mat(0xF5C400), g, .005); c.rotation.z = (y - .7) * .16; }
    caja(.2, .03, .12, -.35, 0, -.3, nar, g, .005).rotation.y = .6; caja(.1, .02, .07, -.6, 0, -.1, M.gris2, g, .005);
    W.rackDanado = { x: 70.5, z: 10 }; }

  /* ───────── recepción y despacho (franja norte, entre los andenes y los racks) ───────── */
  ANDENES.forEach((x, i) => { const n = [3, 2, 0, 3, 1][i]; for (let j = 0; j < n; j++) palletEn(base, x - .9 + (j % 2) * 1.5, 0, 3.6 + Math.floor(j / 2) * 1.5); });
  for (let i = 0; i < 8; i++) palletEn(base, 37.4 + (i % 4) * 1.5, 0, 1.8 + Math.floor(i / 4) * 1.6);
  for (let i = 0; i < 4; i++) m2.apilado(base, 44.4 + i * 1.3, 1.6, 'madera', 4 + ((i * 3) % 5));
  { const t = md.transpaleta(base); t.g.position.set(47.6, 0, 4.6); t.g.rotation.y = .3; }
  { const g = grupo(49.8, 0, 4.4, 0, base); cil(.95, .12, 0, 0, 0, M.tinta, g, 28); caja(.3, 2.6, .3, 1.25, 0, 0, mat(0xE5383B, { roughness: .45 }), g, .05); caja(.5, .3, .2, 1.0, 1.3, 0, M.gris2, g, .03); palletEn(g, 0, .12, 0); }
  md.extintor(base, 52.6, .35, Math.PI / 2); md.extintor(base, 88.2, 6.6, 0); md.extintor(base, 58.3, 12, 0); md.extintor(base, 44.7, 32.7, 0);

  /* ───────── línea de ensamble (poniente) ───────── */
  W.cajasCinta = [];
  for (const z of [11.2, 16.6]) {
    md.cinta(base, 42, 55.2, z);
    for (const x of [44.2, 47.6, 51, 54.2]) md.estacion(base, x, z + 1.45);
    for (let i = 0; i < 7; i++) { const b = caja(.42, .3, .4, 42 + i * 1.9, .82, z, i % 3 ? M.caja : M.caja2, vivo, .03); W.cajasCinta.push(b); }
    m2.lineaTunel(base, 41.4, z - 2.4, z + .2);
  }
  W.robot = m2.celdaRobot(vivo, 52.2, 13.9);
  for (let i = 0; i < 3; i++) m2.apilado(base, 54.6 - i * 1.25, 19.4, 'gris', 2 + i);

  /* ───────── sala de reunión y descanso (aquí parte la historia) ───────── */
  // tablero «Días sin accidentes» en el muro sur de la sala, mirando al norte
  { const c = document.createElement('canvas'); c.width = 1024; c.height = 560; const x = c.getContext('2d'), t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16;
    const mt = new THREE.MeshStandardMaterial({ map: t, roughness: .5, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: .22 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.4), mt); m.rotation.y = Math.PI; m.position.set(47.5, 2.5, 32.83); vivo.add(m);
    caja(4.64, 2.64, .08, 47.5, 1.18, 32.9, M.tinta, base, .03);
    W.tablero = { mat: mt, valor: -1, pintar(v, rojo = false) {
      if (v === this.valor && rojo === this.rojo) return; this.valor = v; this.rojo = rojo;
      x.fillStyle = '#F7F8FA'; x.fillRect(0, 0, 1024, 560); x.fillStyle = rojo ? '#2B2F36' : '#1FA45A'; x.fillRect(0, 0, 1024, 132);
      x.fillStyle = '#fff'; x.font = '800 66px Poppins, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DÍAS SIN ACCIDENTES', 512, 70);
      const s = String(Math.max(0, Math.round(v))).padStart(4, '0');
      for (let i = 0; i < 4; i++) { const X = 112 + i * 206; x.fillStyle = '#1b2230'; x.beginPath(); x.roundRect(X, 166, 182, 268, 18); x.fill(); x.fillStyle = 'rgba(255,255,255,.07)'; x.fillRect(X, 166, 182, 134);
        x.fillStyle = rojo ? '#FF5A5F' : '#ffffff'; x.font = '800 228px Poppins, Arial'; x.fillText(s[i], X + 91, 310); }
      x.fillStyle = '#6c6c6c'; x.font = '600 38px Poppins, Arial'; x.fillText(rojo ? 'Último accidente: ayer' : 'Nuestra meta: que todos vuelvan a casa', 512, 498);
      t.needsUpdate = true; } };
    W.tablero.pintar(999); }
  // reloj (08:00) y pizarra de la charla, en el mismo muro
  { const m = new THREE.Mesh(new THREE.CircleGeometry(.42, 40), new THREE.MeshBasicMaterial({ toneMapped: false, map: tex((c, Wd) => { c.fillStyle = '#fff'; c.fillRect(0, 0, Wd, Wd); c.strokeStyle = '#1b2230'; c.lineWidth = 22; c.beginPath(); c.arc(Wd / 2, Wd / 2, Wd / 2 - 14, 0, 7); c.stroke();
      for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; c.lineWidth = 10; c.beginPath(); c.moveTo(Wd / 2 + Math.sin(a) * Wd * .36, Wd / 2 - Math.cos(a) * Wd * .36); c.lineTo(Wd / 2 + Math.sin(a) * Wd * .42, Wd / 2 - Math.cos(a) * Wd * .42); c.stroke(); }
      c.lineCap = 'round'; c.lineWidth = 20; c.beginPath(); c.moveTo(Wd / 2, Wd / 2); c.lineTo(Wd / 2 - Wd * .2, Wd / 2 - Wd * .115); c.stroke(); c.lineWidth = 12; c.beginPath(); c.moveTo(Wd / 2, Wd / 2); c.lineTo(Wd / 2, Wd / 2 - Wd * .34); c.stroke(); }, 256, 256) }));
    m.rotation.y = Math.PI; m.position.set(51.4, 3.1, 32.84); base.add(m);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshStandardMaterial({ roughness: .6, map: tex((c, Wd, Hh) => { c.fillStyle = '#fff'; c.fillRect(0, 0, Wd, Hh); c.fillStyle = '#056CF2'; c.fillRect(0, 0, Wd, Hh * .16); c.fillStyle = '#fff'; c.font = `800 ${Hh * .09}px Poppins, Arial`; c.fillText('CHARLA DE 5 MINUTOS', Wd * .05, Hh * .115);
      c.fillStyle = '#1b2230'; c.font = `600 ${Hh * .065}px Poppins, Arial`; ['Tema de hoy: tránsito en pasillos', 'Brigada de emergencia: Don Salva', 'Comité paritario: jueves 15:00', 'Reportar: rack C1 golpeado'].forEach((s, i) => c.fillText('•  ' + s, Wd * .05, Hh * (.32 + i * .15))); }, 768, 524) }));
    p.rotation.y = Math.PI; p.position.set(54.2, 2.1, 32.84); base.add(p); caja(2.3, 1.6, .05, 54.2, 1.3, 32.9, M.gris2, base, .02); }
  // globos y mesa con torta (solo el día de la celebración)
  W.fiesta = grupo(0, 0, 0, 0, vivo);
  { const cols = [0x056CF2, 0xF5C400, 0xFFFFFF, 0x4F95F5, 0xF5C400, 0x056CF2, 0xFFFFFF];
    W.globos = [[44.6, 32.4], [44.95, 32.5], [44.75, 32.2], [50.1, 32.45], [50.45, 32.5], [50.25, 32.2], [53.6, 32.4]].map(([x, z], i) => { const g = grupo(x, 0, z, 0, W.fiesta); const b = esfera(.19, 0, 3.1 + (i % 3) * .28, 0, std(cols[i], { roughness: .25 }), g, 18); b.scale.y = 1.18; caja(.006, 3.1 + (i % 3) * .28 - .22, .006, 0, .08, 0, std(0xD9DDE3, { roughness: .4 }), g, .001); const pe = caja(.13, .09, .13, 0, 0, 0, std(cols[i] === 0xFFFFFF ? 0x2B2F36 : cols[i], { roughness: .35 }), g, .03); pe.rotation.y = i * .7; return { g, b, f: i * 1.7 }; });
    const mesa = grupo(54.1, 0, 31.6, 0, W.fiesta); caja(1.5, .05, .8, 0, .76, 0, std(0xFFFFFF), mesa, .02); for (const [a, b] of [[-.68, -.33], [.68, -.33], [-.68, .33], [.68, .33]]) caja(.05, .76, .05, a, 0, b, M.gris2, mesa, .01);
    cil(.3, .16, 0, .81, 0, std(0xFFF7EC), mesa, 26); cil(.31, .03, 0, .88, 0, std(0x056CF2), mesa, 26); for (let i = 0; i < 5; i++) { const a = i * 1.257; cil(.012, .1, Math.sin(a) * .16, .97, Math.cos(a) * .16, std(0xF5C400), mesa, 6); }
    for (let i = 0; i < 6; i++) cil(.04, .1, -.55 + (i % 3) * .14, .81, -.2 + Math.floor(i / 3) * .16, std(0xE9EEF5), mesa, 10);
    // guirnalda sobre el tablero
    for (let i = 0; i < 15; i++) { const u = i / 14, x = 45 + u * 5, y = 3.95 - Math.sin(u * Math.PI) * .35; const b = caja(.18, .24, .01, x, y - .12, 32.78, std([0x056CF2, 0xF5C400, 0xFFFFFF][i % 3]), W.fiesta, .005); b.rotation.z = (u - .5) * .3; } }
  // mesas de descanso con bancas, junto al muro poniente
  for (const [x, z] of [[53.7, 24.9]]) { const g = grupo(x, 0, z, 0, base); caja(1.8, .06, .8, 0, .74, 0, mat(0xE9DCC3, { roughness: .7 }), g, .03); for (const s of [-1, 1]) { caja(1.8, .05, .3, 0, .44, s * .72, mat(0xD9B98C), g, .02); for (const a of [-.8, .8]) { caja(.05, .44, .05, a, 0, s * .72, M.gris2, g, .01); caja(.05, .74, .05, a, 0, s * .3, M.gris2, g, .01); } } }
  // máquinas de bebida y café contra el muro poniente, mirando hacia la sala (su frente es +x)
  m2.vending(base, 40.58, 23.7, 0, 0xE5383B, 'BEBIDAS'); m2.vending(base, 40.58, 24.6, 0, 0x2B2F36, 'CAFÉ'); m2.vending(base, 40.58, 25.5, 0, 0x056CF2, 'AGUA');
  // lean corner al oriente de la sala, junto al sendero
  { const g = grupo(41.9, 0, 28.0, -Math.PI / 2, base); m2.leanCorner(g, -1.75, 1.75, -1.35, 1.35); }
  const planta = (x, z, s = 1) => { const g = grupo(x, 0, z, 0, base); cil(.22 * s, .4 * s, 0, 0, 0, std(0xF2F0EB), g, 14, .28 * s); for (let i = 0; i < 5; i++) { const h = esfera(.2 * s, Math.sin(i * 1.3) * .14 * s, (.62 + (i % 3) * .16) * s, Math.cos(i * 1.3) * .14 * s, std(0x9CC7A0, { roughness: .9 }), g, 10); h.scale.y = 1.3; } };
  planta(55.6, 32.4, 1.2); planta(56.0, 23.6, 1.1);

  /* ───────── comedor, camarines y taller ───────── */
  const tabique = (horiz, fijo, a, b, h, hu = []) => { let p = a; for (const [h0, h1] of hu) { if (h0 > p) horiz ? caja(h0 - p, h, .15, (p + h0) / 2, 0, fijo, mat(0xE9E4DC), base, .02) : caja(.15, h, h0 - p, fijo, 0, (p + h0) / 2, mat(0xE9E4DC), base, .02); horiz ? caja(h1 - h0, h - 2.2, .15, (h0 + h1) / 2, 2.2, fijo, mat(0xE9E4DC), base, .02) : caja(.15, h - 2.2, h1 - h0, fijo, 2.2, (h0 + h1) / 2, mat(0xE9E4DC), base, .02); p = h1; } if (b > p) horiz ? caja(b - p, h, .15, (p + b) / 2, 0, fijo, mat(0xE9E4DC), base, .02) : caja(.15, h, b - p, fijo, 0, (p + b) / 2, mat(0xE9E4DC), base, .02); };
  tabique(false, 40, 7, 30, 3, [[11.6, 12.7], [23.6, 24.7]]); tabique(true, 7, 35, 40, 3); tabique(true, 18.5, 35, 40, 3); tabique(false, 45, 30, 40, 3, [[33.25, 36.75]]); tabique(true, 30, 35, 45, 3);
  tabique(false, 58, 10.5, 33, 3, [[20.25, 22.75]]); tabique(true, 33, 45, 58, 3, [[56.4, 57.6]]);
  for (const z of [9.2, 12.4, 15.6]) { const g = grupo(37.3, 0, z, 0, base); caja(1.9, .06, .9, 0, .74, 0, mat(0xFFFFFF), g, .03); caja(.08, .74, .08, 0, 0, 0, M.gris2, g, .02); for (const s of [-1, 1]) for (const a of [-.55, .55]) cil(.17, .44, a, 0, s * .78, mat(0x4F95F5, { roughness: .5 }), g, 12); }
  caja(.6, .9, 2.4, 35.5, 0, 17, mat(0xEDEAE4), base, .03); for (const z of [16.3, 17.2]) caja(.45, .3, .5, 35.5, .9, z, M.tinta, base, .04);
  for (const z of [20.2, 22.6, 26.4, 28.6]) m2.casilleros(base, 35.5, z, 0, 4); caja(.4, .45, 3, 38.4, 0, 21.5, mat(0xD9B98C), base, .04); caja(.4, .45, 3, 38.4, 0, 27.5, mat(0xD9B98C), base, .04);
  { md.estacion(base, 37, 31); const g = md.montacargas(base, { color: mat(0xD8DDE4) }); g.g.position.set(41.3, 0, 38.2); g.g.rotation.y = 2.6; g.op.g.visible = false; g.spot.visible = false; g.levantar(1.1);
    for (const [x, z, cc] of [[36, 33.2, 0x2F6FB0], [36.7, 33.1, 0x2F6FB0], [36.3, 37.1, 0xE5383B]]) cil(.29, .88, x, 0, z, mat(cc, { roughness: .4 }), base, 18);
    md.tableroElectrico(base, 35.2, 38.7, 0); md.estanteria(base, 44.3, 37.2, 39.6); }
  { const c = new THREE.Mesh(new THREE.PlaneGeometry(2.2, .42), numero('COMEDOR', 2.2, .42, '#ffffff', '#1b2230')); c.position.set(40.09, 2.6, 13.2); c.rotation.y = Math.PI / 2; base.add(c);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(2.4, .42), numero('CAMARINES', 2.4, .42, '#ffffff', '#1b2230')); d.position.set(40.09, 2.6, 25.2); d.rotation.y = Math.PI / 2; base.add(d); }

  /* ───────── carga de baterías y oficina de operaciones (anexo oriente) ───────── */
  for (let i = 0; i < 5; i++) { const x = 92.5 + i * 3.4; caja(.9, 1.5, .5, x, 0, .5, mat(0xE9EEF3), base, .04); caja(.5, .3, .04, x, .95, .77, luz(0x22C55E, 0x1a3a25), base, .01); caja(.06, .06, 1.6, x + .3, .4, 1.5, M.tinta, base, .02); }
  W.gruasEstac = [[92.5, false], [99.3, true], [102.7, false], [106.1, false]].map(([x, amarilla]) => { const g = md.montacargas(base, { color: amarilla ? mat(0xF5C400, { roughness: .45 }) : M.blanco }); g.g.position.set(x, 0, 3.2); g.g.rotation.y = -Math.PI / 2; g.op.g.visible = false; g.spot.visible = false; return g; });
  { const vid = mat(0xCFE0F2, { roughness: .1, transparent: true, opacity: .32 }), marco = mat(0x2B2F36, { roughness: .5 });
    for (const [w, d, x, z] of [[13, .08, 103, 13], [13, .08, 103, 19.5], [.08, 6.5, 96.5, 16.25], [.08, 6.5, 109.5, 16.25]]) { const v = caja(w, 2.5, d, x, .1, z, vid, base, .01); v.castShadow = false; caja(w + .06, .1, d + .06, x, 0, z, marco, base, .01); caja(w + .06, .1, d + .06, x, 2.6, z, marco, base, .01); }
    for (let i = 0; i < 4; i++) { const x = 98.4 + i * 3; caja(1.6, .05, .8, x, .74, 15, mat(0xFFFFFF), base, .02); caja(.05, .74, .7, x - .7, 0, 15, M.gris2, base, .01); caja(.05, .74, .7, x + .7, 0, 15, M.gris2, base, .01); caja(.5, .32, .03, x, .92, 14.8, M.tinta, base, .02); cil(.2, .46, x, 0, 15.75, mat(0x3A4150), base, 12);
      caja(1.6, .05, .8, x, .74, 18.2, mat(0xFFFFFF), base, .02); caja(.5, .32, .03, x, .92, 18.4, M.tinta, base, .02); cil(.2, .46, x, 0, 17.45, mat(0x3A4150), base, 12); } }
  md.barrera(base, 89.6, 11, 109.6, 11); md.barrera(base, 88, 10.6, 88, 36.2);
  for (let i = 0; i < 9; i++) m2.apilado(base, 60 + i * 1.3, 39.1, i % 4 === 3 ? 'negro' : 'madera', 5 + ((i * 7) % 9));
  for (const [x, c] of [[73.5, 0x2F6FB0], [74.3, 0xF5C400], [75.1, 0x1FA45A], [75.9, 0x6c6c6c]]) md.contenedor(base, x, 39.3, c);
  for (let i = 0; i < 5; i++) palletEn(base, 78 + i * 1.3, 0, 39);

  /* ───────── afuera, en el predio ───────── */
  // cerco perimetral con portones
  { const ma = mat(0x6B7380, { roughness: .5, metalness: .3 }), red = mat(0xB9C0C8, { roughness: .5, transparent: true, opacity: .35 });
    const cerco = (x0, z0, x1, z1) => { const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(L / 3)); for (let i = 0; i <= n; i++) cil(.04, 2.1, x0 + (x1 - x0) * i / n, 0, z0 + (z1 - z0) * i / n, ma, base, 6);
      const p = caja(L, 2, .03, (x0 + x1) / 2, .05, (z0 + z1) / 2, red, base, .005); p.rotation.y = -Math.atan2(z1 - z0, x1 - x0); p.castShadow = false; };
    cerco(26, -58, 162, -58); cerco(162, -58, 162, 70); cerco(26, 70, 162, 70); cerco(26, -58, 26, -26); cerco(26, -12, 26, 28); cerco(26, 40, 26, 70); }
  // portería y barreras de acceso
  { const g = grupo(30.5, 0, 25.6, 0, base); caja(2.6, 2.7, 2.6, 0, 0, 0, mat(0xF1F2F4), g, .08); caja(3.1, .2, 3.1, 0, 2.7, 0, M.tinta, g, .05); caja(2.0, 1.0, .06, 0, 1.2, 1.31, mat(0x9DB9D6, { roughness: .15 }), g, .02);
    for (const z of [-19, 34]) { caja(.3, 1.1, .3, 26.4, 0, z - 4, mat(0xF5C400), base, .05); const b = caja(.1, .1, 7.5, 26.4, 1.0, z, mat(0xE5383B), base, .02); b.castShadow = false; } }
  { const n = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 1.5), numero('CD LOS ANDES', 4.6, 1.5, '#ffffff', '#3A4150')); n.position.set(25.2, 1.6, 30.5); n.rotation.y = -Math.PI / 2; base.add(n); caja(.4, 2.6, 5, 25.5, 0, 30.5, mat(0xE9EAEC), base, .05); }
  { const cc = [0x2F6FB0, 0xC8553D, 0xE9EDF2, 0x2B8A66, 0xD9A441];
    for (const x of [50, 56.5, 63, 74]) { const g = grupo(x, 0, 48.5, Math.PI / 2, base); caja(11, 2.6, 2.5, 0, 1.15, 0, mat(0xEEF1F4), g, .05); caja(11, .14, 2.5, 0, 1.0, 0, M.tinta, g, .02); for (const a of [-3.6, -2.5]) for (const s of [-1.05, 1.05]) { const r = cil(.48, .3, 0, 0, 0, goma, g, 16); r.rotation.x = Math.PI / 2; r.position.set(a, .48, s); } for (const s of [-.8, .8]) caja(.1, 1, .1, 4.2, 0, s, M.tinta, g, .01); } }
  for (const [x, z] of [[40, -30], [60, -30], [80, -30], [100, -30], [124, -4], [124, 12], [110, 32], [46, 44], [70, 44], [28, 22], [140, 20], [150, 5]]) { cil(.09, 8, x, 0, z, M.gris2, base, 8); caja(1.3, .1, .3, x + .5, 8, z, M.tinta, base, .03); }
  // estacionamientos con autos
  const COL = [0xE9EDF2, 0x2B2F36, 0x8FA3BC, 0xB9C0C8, 0xC8553D, 0x2F6FB0, 0xF2F0EB, 0x6B7380];
  const estac = (x, z, ry) => { if (R() < .72) eq.auto(base, x, z, ry + (R() < .5 ? Math.PI : 0), COL[Math.floor(R() * COL.length)]); };
  for (let x = 43.4; x <= 85; x += 2.8) { estac(x, -47.4, Math.PI / 2); estac(x, -38.9, Math.PI / 2); }
  for (let z = -2.6; z <= 21; z += 2.8) { estac(114.5, z, 0); estac(129.5, z, 0); }
  for (let x = 95.4; x <= 126; x += 2.8) { estac(x, 25.5, Math.PI / 2); estac(x, 36.5, Math.PI / 2); }
  // oficina principal: dos pisos de vidrio y hormigón claro, con su techo y equipos
  { const g = grupo(146, 0, 12, 0, base), hor = mat(0xF1F2F4, { roughness: .8 }), vid = mat(0x9DB9D6, { roughness: .12, metalness: .3 });
    caja(16, 8.2, 20, 0, 0, 0, hor, g, .1); for (const y of [1.1, 4.9]) { caja(.12, 2.4, 17.6, -8.02, y, 0, vid, g, .02); caja(13.6, 2.4, .12, 0, y, 10.02, vid, g, .02); caja(13.6, 2.4, .12, 0, y, -10.02, vid, g, .02); }
    caja(17, .35, 21, 0, 8.2, 0, mat(0xDDE1E6), g, .08); caja(5, .2, 4, -9.5, 3.3, 1, mat(0xDDE1E6), g, .05); for (const z of [-.6, 2.6]) cil(.12, 3.3, -11.6, 0, z, M.gris2, g, 10);
    for (const [x, z] of [[3, 3], [-2, -5], [4, -6]]) caja(2.6, 1.3, 2.2, x, 8.55, z, mat(0xC9CED6), g, .15);
    for (const [x, z] of [[-13, -6], [-13, 7]]) { const s = cil(.06, 6, x, 0, z, M.gris2, g, 8); s; caja(.04, 1.2, 1.8, x, 4.8, z + .9, mat([0x2F6FB0, 0xF2F2F2][z > 0 ? 1 : 0]), g, .01); } }
  for (const [x, z] of [[137, 30], [140.5, 35.5], [150, 29], [155, 40]]) { const g = grupo(x, 0, z, R() * 3, base); caja(1.7, .06, .5, 0, .44, 0, mat(0xD9B98C), g, .02); caja(1.7, .4, .05, 0, .5, -.24, mat(0xD9B98C), g, .02); for (const a of [-.7, .7]) caja(.06, .44, .46, a, 0, 0, M.tinta, g, .01); }
  // tránsito que se mueve: autopista y calle lateral
  W.transito = [];
  for (let i = 0; i < 24; i++) { const pista = [-18.6, -15.7, -13, -10, -7.3, -4.4][i % 6], sur = pista < -11.5, g = eq.auto(vivo, pista, 0, sur ? -Math.PI / 2 : Math.PI / 2, COL[(i * 3) % COL.length]); W.transito.push({ g, z: -900 + R() * 1800, v: (sur ? 1 : -1) * (19 + R() * 8) }); }
  for (let i = 0; i < 6; i++) { const pista = [-15.7, -7.3][i % 2], sur = pista < -11.5, t = eq.camion(vivo, [0x2F6FB0, 0xC9603A, 0xE9EDF2][i % 3]); t.g.rotation.y = sur ? -Math.PI / 2 : Math.PI / 2; t.g.position.x = pista; W.transito.push({ g: t.g, z: -900 + R() * 1800, v: (sur ? 1 : -1) * (15 + R() * 4) }); }
  for (let i = 0; i < 3; i++) { const g = eq.auto(vivo, 16.6 + (i % 2) * 4, 0, i % 2 ? Math.PI / 2 : -Math.PI / 2, COL[i + 4]); W.transito.push({ g, z: -300 + i * 220, v: (i % 2 ? -1 : 1) * 8 }); }

  /* ───────── el rebobinado (FILCE 22): la MISMA planta, completa con Neisstech. Todo parte oculto. ─────────
     Gestión visual en toda la nave (pintura nueva), gestión de tráfico en todos los cruces (puertas inteligentes, barandas,
     protecciones, letreros) y Lúmina (cámaras con su cono en los puntos de riesgo). */
  W.mejora = {};
  { // gestión visual: toda la nave repintada
    const t = lienzo(35, 0, 75, 40, 4096, (c) => {
      const caja2 = (x0, z0, x1, z1, col, w = .13) => { c.strokeStyle = col; c.lineWidth = w; c.strokeRect(x0, z0, x1 - x0, z1 - z0); };
      const linea = (x0, z0, x1, z1, col, w = .13, dash) => { c.strokeStyle = col; c.lineWidth = w; c.setLineDash(dash || []); c.beginPath(); c.moveTo(x0, z0); c.lineTo(x1, z1); c.stroke(); c.setLineDash([]); };
      const flecha = (x, z, ang, s = 1) => { c.save(); c.translate(x, z); c.rotate(ang); c.scale(s, s); c.fillStyle = 'rgba(255,255,255,.92)'; c.beginPath(); c.moveTo(1.2, 0); c.lineTo(-.4, -.65); c.lineTo(-.4, -.25); c.lineTo(-1.6, -.25); c.lineTo(-1.6, .25); c.lineTo(-.4, .25); c.lineTo(-.4, .65); c.closePath(); c.fill(); c.restore(); };
      const AM = '#F5C400', VE = '#1FA45A', BL = '#FFFFFF';
      c.fillStyle = '#9EA3A9'; c.fillRect(35, 0, 75, 40);                                   // epóxico gris en toda la operación
      for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(255,255,255,${.015 + R() * .03})`; c.fillRect(35 + R() * 75, R() * 40, .3 + R() * 2, .02 + R() * .05); }   // brillo del epóxico
      c.fillStyle = '#E6E2DA'; c.fillRect(35, 7, 5, 23); c.fillStyle = '#D8E2EE'; c.fillRect(40.2, 22.9, 17.6, 7.1); c.fillRect(45.15, 29.9, 12.65, 2.95);
      c.fillStyle = '#C9C5BE'; c.fillRect(35, 30, 10, 10); c.fillStyle = '#E4E7EC'; c.fillRect(96.5, 13, 13, 6.5);
      c.strokeStyle = 'rgba(0,0,0,.06)'; c.lineWidth = .03; for (let x = 35; x <= 110; x += 6) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 40); c.stroke(); }   // juntas de dilatación
      // calles de grúas: bordes nítidos y flechas de sentido
      for (const [x0, z0, x1, z1] of [[35, .15, 88, 7], [58.5, 6.25, 110, 9.75], [84, 8, 88, 40], [40.2, 20.25, 85, 22.75], [35, 33.25, 85, 36.75]]) caja2(x0, z0, x1, z1, AM, .14);
      for (const x of [62, 72, 82, 96, 104]) { flecha(x, 7.3, Math.PI); flecha(x + 2, 8.7, 0); }
      for (const x of [46, 62, 74]) { flecha(x, 21.0, Math.PI, .8); flecha(x + 2, 22.0, 0, .8); flecha(x, 34.4, Math.PI, .9); flecha(x + 2, 35.6, 0, .9); }
      for (const z of [14, 28]) { flecha(85.3, z, -Math.PI / 2, .8); flecha(86.7, z + 2, Math.PI / 2, .8); }
      // pasillos de racks: bordes amarillos y PARE en cada salida
      c.font = '800 .55px Poppins, Arial'; c.textAlign = 'center'; c.textBaseline = 'middle';
      for (const x of [61, 65, 69, 73, 77, 81]) { for (const [a, b] of [[10.1, 20.25], [22.75, 33.25]]) { linea(x - 1.25, a, x - 1.25, b, AM, .1); linea(x + 1.25, a, x + 1.25, b, AM, .1); }
        c.fillStyle = BL; for (const [z, zt] of [[10.45, 11.0], [19.75, 19.2], [23.25, 23.8], [32.75, 32.2]]) { c.fillRect(x - 1.2, z - .07, 2.4, .14); c.fillText('PARE', x, zt); } }
      // senderos peatonales: verdes, con borde y pictogramas
      const sendero = (x0, z0, x1, z1) => { c.fillStyle = 'rgba(31,164,90,.62)'; c.fillRect(x0, z0, x1 - x0, z1 - z0); caja2(x0, z0, x1, z1, VE, .1);
        const h = x1 - x0 > z1 - z0, L = h ? x1 - x0 : z1 - z0; c.fillStyle = 'rgba(255,255,255,.9)'; for (let k = 2.5; k < L - 1; k += 7) { const px = h ? x0 + k : (x0 + x1) / 2, pz = h ? (z0 + z1) / 2 : z0 + k; c.beginPath(); c.arc(px, pz - .18, .12, 0, 7); c.fill(); c.fillRect(px - .07, pz - .05, .14, .36); } };
      for (const r of [[56.5, 8.9, 88.5, 10.1], [88, 0, 89, 40], [45, 36.9, 88.5, 38.1], [40, 6.9, 57, 8.1], [56.4, 7.5, 57.6, 37.5], [50.9, 0, 52.1, 7.5], [88.5, 11.4, 110, 12.6]]) sendero(...r);
      // pasos de cebra nítidos donde un sendero cruza una calle
      const cebra = (x0, z0, x1, z1) => { c.fillStyle = BL; c.fillRect(x0, z0, x1 - x0, z1 - z0); c.fillStyle = AM; const h = x1 - x0 > z1 - z0;
        if (h) for (let x = x0 + .1; x < x1 - .2; x += .5) c.fillRect(x, z0 + .08, .25, z1 - z0 - .16); else for (let z = z0 + .1; z < z1 - .2; z += .5) c.fillRect(x0 + .08, z, x1 - x0 - .16, .25); };
      for (const x of [61, 65, 69, 73, 77, 81]) cebra(x - 1.25, 8.9, x + 1.25, 10.1);
      cebra(84, 8.9, 88, 10.1); cebra(56.4, 20.25, 57.6, 22.75); cebra(56.4, 33.25, 57.6, 36.75); cebra(84, 36.9, 88, 38.1); cebra(50.9, .3, 52.1, 6.9); cebra(88, 6.25, 89, 9.75);
      // zonas demarcadas: sala de reunión, ensamble, despacho por andén, baterías, pallets vacíos
      linea(40.4, 23.1, 57.8, 23.1, '#056CF2', .12, [.6, .3]); linea(40.4, 23.1, 40.4, 29.8, '#056CF2', .12, [.6, .3]);
      caja2(40.4, 8.4, 55.8, 20.0, AM, .1);
      ANDENES.forEach((x, i) => { caja2(x - 1.6, 2.6, x + 1.6, 6.1, BL, .1); c.fillStyle = 'rgba(255,255,255,.75)'; c.font = '800 1.1px Poppins, Arial'; c.fillText(String(i + 1), x, 4.35); });
      for (let i = 0; i < 5; i++) caja2(91 + i * 3.4, .2, 94 + i * 3.4, 5.6, AM, .09);
      c.fillStyle = 'rgba(245,196,0,.22)'; c.fillRect(59.4, 38.4, 12.2, 1.4); caja2(59.4, 38.4, 71.6, 39.8, AM, .08);
      { c.fillStyle = '#1FA45A'; c.fillRect(41.2, 31.2, 3.2, 3.2); c.strokeStyle = BL; c.lineWidth = .1; c.strokeRect(41.45, 31.45, 2.7, 2.7); c.fillStyle = BL; c.font = '800 .34px Poppins, Arial'; c.fillText('PUNTO DE', 42.8, 32.2); c.fillText('ENCUENTRO', 42.8, 32.65);
        for (let i = 0; i < 3; i++) { const px = 42.1 + i * .7; c.beginPath(); c.arc(px, 33.2, .12, 0, 7); c.fill(); c.fillRect(px - .08, 33.35, .16, .4); } }
      c.fillStyle = 'rgba(255,255,255,.55)'; c.font = '700 1.1px Poppins, Arial'; c.fillText('RECEPCIÓN', 42, 4.2); c.fillText('BATERÍAS', 100, 3.2); c.fillText('DESPACHO', 72.5, 1.2); c.fillText('ENSAMBLE', 48, 19.4);
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(75, 40), new THREE.MeshStandardMaterial({ map: t, transparent: true, opacity: 0, roughness: .7, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -12, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(72.5, .012, 20); m.receiveShadow = true; m.renderOrder = 2; m.visible = false; vivo.add(m); W.mejora.pintura = m;
  }
  { // gestión visual: letreros colgantes de zona y de sendero, tableros, EPP, espejos y puntos limpios
    const g = grupo(0, 0, 0, 0, vivo); g.visible = false; W.mejora.visual = g; const piezasV = W.mejora.piezasV = [];
    const pon = (o, x, z) => { piezasV.push({ o: o.g || o, d: Math.hypot(x - 57, z - 24) }); return o; };
    for (const [txt, x, y, z, ry, w, col] of [['DESPACHO', 78.5, 4.4, 6.0, Math.PI / 2, 2.6, '#056CF2'], ['ALMACENAJE · A1–G1', 72, 4.6, 21.5, Math.PI / 2, 3.6, '#056CF2'], ['RECEPCIÓN', 43, 4.0, 5.5, Math.PI / 2, 2.4, '#056CF2'],
      ['ENSAMBLE', 48, 3.9, 20.6, Math.PI / 2, 2.4, '#056CF2'], ['BATERÍAS', 100, 4.2, 7.6, Math.PI / 2, 2.2, '#056CF2'], ['SENDERO PEATONAL', 57, 3.0, 25.5, Math.PI / 2, 2.6, '#1FA45A'], ['SENDERO PEATONAL', 62.5, 3.1, 9.5, 0, 2.6, '#1FA45A'], ['SENDERO PEATONAL', 57, 3.0, 13.0, Math.PI / 2, 2.6, '#1FA45A']])
      pon(md.colgante(g, txt, x, y, z, ry, w, .46, col), x, z);
    // tablero de gestión diaria junto al sendero (muro oriente de la sala)
    pon(md.tablero(g, 57.84, .95, 27.2, Math.PI, 2.4, 1.25, (c, Wd, Hh) => { c.fillStyle = '#fff'; c.fillRect(0, 0, Wd, Hh); c.fillStyle = '#056CF2'; c.fillRect(0, 0, Wd, Hh * .17); c.fillStyle = '#fff'; c.font = `800 ${Hh * .09}px Poppins, Arial`; c.textBaseline = 'middle'; c.fillText('GESTIÓN DIARIA · TURNO MAÑANA', Wd * .04, Hh * .09);
      ['SEGURIDAD', 'CALIDAD', 'ENTREGA', 'COSTO'].forEach((n, i) => { const x = Wd * (.04 + i * .24); c.fillStyle = ['#1FA45A', '#056CF2', '#F5C400', '#6c6c6c'][i]; c.fillRect(x, Hh * .24, Wd * .22, Hh * .1); c.fillStyle = '#fff'; c.font = `700 ${Hh * .055}px Poppins, Arial`; c.fillText(n, x + Wd * .015, Hh * .29);
        for (let k = 0; k < 15; k++) { c.fillStyle = (k * 7 + i * 3) % 11 ? '#1FA45A' : (i === 0 ? '#1FA45A' : '#F5C400'); c.fillRect(x + (k % 5) * Wd * .043, Hh * (.4 + Math.floor(k / 5) * .13), Wd * .036, Hh * .1); } });
      c.fillStyle = '#1b2230'; c.font = `600 ${Hh * .06}px Poppins, Arial`; c.fillText('Días sin accidentes: 1.000', Wd * .04, Hh * .88); }), 57.8, 27.2);
    // EPP a la entrada de la nave y señalética de puntos limpios
    for (const [url, z] of [['img/letreros/o-casco.webp', 30.9], ['img/letreros/o-chaleco.webp', 31.6]]) pon(md.letrero(g, url, .42, 57.84, 1.3, z, Math.PI, 'muro'), 57.8, z);
    for (const [url, x] of [['img/letreros/r-papel.webp', 73.5], ['img/letreros/r-plastico.webp', 74.3], ['img/letreros/r-carton.webp', 75.1], ['img/letreros/r-vidrio.webp', 75.9]]) pon(md.letrero(g, url, .34, x, 1.25, 39.83, Math.PI / 2, 'muro'), x, 39.8);
    pon(md.letrero(g, 'img/letreros/s-extintor.webp', .3, 52.3, 1.3, .17, -Math.PI / 2, 'muro'), 52.3, .2);
    // espejos convexos en las esquinas sin visión
    for (const [x, z, dx, dz] of [[83.75, 8.6, -1, 1], [58.2, 20.05, 1, 1], [58.2, 33.05, 1, 1], [85.95, 33.05, -1, 1]]) pon(eq.espejo(g, x, z, dx, dz, 2.4, true), x, z);
  }
  { // gestión de tráfico en toda la planta
    const g = grupo(0, 0, 0, 0, vivo); g.visible = false; W.mejora.trafico = g; const piezas = W.mejora.piezas = [];
    const pieza = (obj, x, z) => { piezas.push({ o: obj.g || obj, d: Math.hypot(x - 69, z - 9.5) }); return obj; };
    // barandas entre calle y sendero (bocas de pasillo abiertas) y a lo largo del sendero sur
    for (const [a, b] of [[56.8, 59.75], [62.25, 63.75], [66.25, 67.45], [70.55, 71.75], [74.25, 75.75], [78.25, 79.75], [82.25, 83.7]]) pieza(md.barrera(g, a, 8.78, b, 8.78), (a + b) / 2, 8.78);
    for (const [a, b] of [[45.3, 56.2], [57.8, 83.7]]) pieza(md.barrera(g, a, 36.82, b, 36.82), (a + b) / 2, 36.82);
    // puertas inteligentes en cada cruce del sendero con una calle (las de la boca del pasillo 69 son las que actúan en la historia)
    W.mejora.puertas = [];
    const par = (xo, xe, z0 = 8.95, z1 = 10.1) => [eq.puertaInteligente(g, xo, z0, -Math.PI / 2, z1 - z0), eq.puertaInteligente(g, xe, z1, Math.PI / 2, z1 - z0)];
    for (const x of [61, 65, 69, 73, 77, 81]) { const pp = par(x - 1.45, x + 1.45); pp.forEach((q) => pieza(q, x, 9.5)); if (x === 69) W.mejora.puertas = pp; else W.mejora.puertasResto = (W.mejora.puertasResto || []).concat(pp); }
    for (const [xo, xe, z0, z1] of [[83.85, 88.15, 8.95, 10.1], [83.85, 88.15, 36.95, 38.1]]) par(xo, xe, z0, z1).forEach((q) => { pieza(q, 86, z0); W.mejora.puertasResto.push(q); });
    W.mejora.puertasKb = []; for (const [z, ry, x] of [[20.1, Math.PI, 57.6], [22.9, 0, 56.45]]) { const q = eq.puertaInteligente(g, x, z, ry, 1.15); pieza(q, 57, z); W.mejora.puertasKb.push(q); }   // las del X-KUBE: se cierran con el aviso
    W.mejora.sensor = eq.sensorGrua(g, 67.62, 10.55, -Math.PI / 2); pieza(W.mejora.sensor, 67.6, 10.5);
    // protecciones: columnas en zonas de tránsito y cabeceras de rack
    for (const [x, z] of COLUMNAS) if (!(x < 49 && z > 8 && z < 24)) pieza(md.protectorColumna(g, x, z), x, z);
    for (const x of RACKS_X) for (const z of [20.15, 22.85, 33.15]) pieza(md.protectorRack(g, x - .5, x + .5, z), x, z);
    { const am = std(0xF5C400, { roughness: .45 }), ng = std(0x1E2126, { roughness: .6 });
      for (const x of RACKS_X) for (const z of [10.0, 20.0, 23.0, 33.0]) for (const sx of [-.55, .55]) { const q = grupo(x + sx, 0, z, 0, g); caja(.17, .62, .17, 0, 0, 0, am, q, .04); for (const y of [.12, .36]) caja(.18, .07, .18, 0, y, 0, ng, q, .01); pieza(q, x, z); } }
    // letreros en poste
    for (const [url, x, z, ry] of [['img/letreros/p-montacargas.webp', 59.6, 10.4, -Math.PI / 2], ['img/letreros/p-peatones.webp', 66.3, 8.6, Math.PI / 2], ['img/letreros/p-montacargas.webp', 75.6, 10.4, -Math.PI / 2],
      ['img/letreros/o-casco.webp', 52.6, .7, -Math.PI / 2], ['img/letreros/o-chaleco.webp', 50.3, .7, -Math.PI / 2], ['img/letreros/s-encuentro.webp', 44.2, 23.5, Math.PI / 2], ['img/letreros/p-peatones.webp', 58.4, 20.0, 0], ['img/letreros/s-salida.webp', 88.0, .8, -Math.PI / 2]])
      pieza(md.letrero(g, url, .42, x, 1.7, z, ry, 'poste'), x, z);
  }
  { // el arsenal funcionando: Safetygate, SmartDock, X-KUBE con proyecciones, estaciones 5S y tren logístico
    const g = W.mejora.trafico, A = W.mejora;
    // Safetygate frente al portón poniente: la barra colgante frena la carga alta
    A.sg = md.safetygate(g, 36.9, 33.35, 36.65, 3.3, .45, 35.15); A.piezas.push({ o: A.sg.g, d: 33 });
    // SmartDock: la cuña en la rueda de cada camión en el andén
    const amar = std(0xF5C400, { roughness: .42 }), negroD = std(0x1E2126, { roughness: .6 }), grisD = std(0xC9CED6, { roughness: .45, metalness: .3 }), cableM = std(0x23262B, { roughness: .7 });
    const formaCuna = (() => { const sh = new THREE.Shape(); sh.moveTo(-.21, 0); sh.lineTo(.22, 0); sh.quadraticCurveTo(.02, .05, -.21, .3); sh.lineTo(-.21, 0); const geo = new THREE.ExtrudeGeometry(sh, { depth: .3, bevelEnabled: true, bevelThickness: .012, bevelSize: .012, bevelSegments: 2 }); geo.translate(0, 0, -.15); geo.rotateY(-Math.PI / 2); return geo; })();
    const smartDock = (xa) => {   // xa = eje del andén; el camión retrocede hacia z = 0 y la rueda trasera queda en z ≈ −2,12
      const d = grupo(0, 0, 0, 0, g), px = xa + 1.85, pz = -.42;
      // poste de control y semáforo hacia el chofer
      caja(.12, 1.55, .12, px, 0, pz, grisD, d, .02); caja(.34, .06, .34, px, 0, pz, grisD, d, .02); caja(.3, .38, .17, px, .78, pz - .12, std(0xEEF0F3, { roughness: .4 }), d, .04);
      caja(.22, .5, .14, px, 1.5, pz - .1, negroD, d, .05); const rojo = luz(0xFF3B3B, 0x4a1515), verde = luz(0x22C55E, 0x123a20);
      esfera(.065, px, 1.86, pz - .18, rojo, d, 12); esfera(.065, px, 1.64, pz - .18, verde, d, 12); caja(.26, .04, .1, px, 2.0, pz - .2, negroD, d, .01);
      // la cuña: rampa hacia la rueda, base negra, manilla y la placa del sensor
      const cuna = grupo(px - .3, 0, pz - .55, 0, d); const cu = new THREE.Mesh(formaCuna, amar); cu.castShadow = true; cuna.add(cu);
      caja(.34, .025, .46, 0, 0, 0, negroD, cuna, .008); caja(.3, .02, .1, 0, .2, -.14, negroD, cuna, .006);
      const asa = new THREE.Mesh(new THREE.TorusGeometry(.07, .014, 6, 14, Math.PI), negroD); asa.position.set(0, .3, -.21); cuna.add(asa);
      // cable por el piso desde la base del poste a la cuña
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(.013, .013, 1, 6), cableM); d.add(cable);
      const ve = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
      const tender = () => { const a = new THREE.Vector3(px, .03, pz - .05), b = new THREE.Vector3(cuna.position.x, Math.max(.03, cuna.position.y + .05), cuna.position.z - .2); ve.subVectors(b, a); const L = ve.length(); cable.position.copy(a).addScaledVector(ve, .5); cable.scale.set(1, L, 1); cable.quaternion.setFromUnitVectors(up, ve.normalize()); };
      tender();
      const sd = { g: d, cuna, rojo, verde, tender, parque: [px - .3, pz - .55], rueda: [xa + 1.02, -2.86] };
      sd.poner = (u) => { cuna.position.set(lerp(sd.parque[0], sd.rueda[0], u), 0, lerp(sd.parque[1], sd.rueda[1], u)); tender(); };
      sd.luz = (fijo) => { rojo.emissiveIntensity = fijo ? .08 : 2.4; verde.emissiveIntensity = fijo ? 2.4 : .08; };
      sd.poner(1); sd.luz(true); return sd;
    };
    const lerp = (a, b, u) => a + (b - a) * u;
    A.cunas = [63.5, 73, 82].map((x) => { const c = smartDock(x); A.piezas.push({ o: c.g, d: Math.hypot(x - 69, 11) }); return c; });
    // X-KUBE: cruce del sendero x = 57 con la calle z = 21,5, cruce de la calle x = 86, y cambios de área (portón poniente y baterías)
    A.proy = [];
    const kb1 = eq.xkube(g, 57, 21.5, 4.7, ALERO - .55), kb2 = eq.xkube(g, 86, 9.5, 4.7, ALERO - .55);
    A.kb = [kb1, kb2];
    A.cebra1 = eq.proyeccion(g, eq.cebraTex(9), 1.15, 2.4, 57, 21.5, 0, kb1.origen, 0xFFE27A); // el aviso va APARTE de la cebra: en el sendero, frente a cada puerta (donde espera el peatón), nunca encima del cruce
    A.tri1 = eq.proyeccion(g, eq.TX.grua, 1.6, 1.6, 57, 18.35, 0, kb1.origen, 0xFFE27A, .04); A.tri1b = eq.proyeccion(g, eq.TX.grua, 1.6, 1.6, 57, 24.65, Math.PI, kb1.origen, 0xFFE27A, .04);
    A.cebra2 = eq.proyeccion(g, eq.cebraTex(9), 1.15, 3.9, 86, 9.5, Math.PI / 2, kb2.origen, 0xFFE27A);
    const kb3 = eq.xkube(g, 39.2, 35, 4.0, ALERO - .55), kb4 = eq.xkube(g, 91.6, 8, 4.0, ALERO - .55);
    A.area1 = eq.proyeccion(g, eq.TX.grua, 2.2, 2.2, 39.2, 35, Math.PI / 2, kb3.origen, 0xFFE27A, .04); A.area2 = eq.proyeccion(g, eq.TX.grua, 2.2, 2.2, 91.6, 8, -Math.PI / 2, kb4.origen, 0xFFE27A, .04);
    for (const kb of [kb1, kb2, kb3, kb4]) A.piezas.push({ o: kb.g, d: 20 });
    // orden: estaciones 5S junto al sendero y en baterías
    for (const [x, z, ry, cc] of [[58.6, 27.5, -Math.PI / 2, '#F5C400'], [88.6, 30.5, -Math.PI / 2, '#056CF2'], [108.9, 3.6, -Math.PI / 2, '#F5C400']]) A.piezas.push({ o: eq.estacion5S(g, x, z, ry, cc), d: 25 });
    // tren logístico con carros de kitting (en lugar del carro a mano): recorre la calle de producción
    const tren = grupo(0, 0, 0, 0, vivo); tren.visible = false; A.tren = { g: tren, partes: [md.tractor(tren), md.carroKitting(tren, M.azul), md.carroKitting(tren, M.amarillo), md.carroKitting(tren, M.azul)] };
  }
  { // Lúmina: cámaras en las columnas, con su cono sobre los puntos de riesgo
    const g = grupo(0, 0, 0, 0, vivo); g.visible = false; W.mejora.camara = g; const conos = W.mejora.conos = [];
    const ojoM = luz(0xEC6D27, 0x4a2a15); ojoM.emissiveIntensity = 1.4; W.mejora.ojo = ojoM;
    const conoM = new THREE.MeshBasicMaterial({ color: 0xEC6D27, transparent: true, opacity: .12, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    for (const [x, z, tx, tz] of [[71, 4.5, 68.6, 11], [84, 4.5, 86, 12], [56, 14.5, 57, 21.5], [89.5, 19, 86, 26], [56, 32.5, 61, 35], [61.5, 4.5, 61, 9.5]]) {
      const yaw = Math.atan2(tx - x, tz - z), c = grupo(x, 0, z, yaw, g);
      caja(.1, .1, .45, 0, 5.3, .3, M.tinta, c, .02); const cu = caja(.26, .24, .5, 0, 5.15, .72, std(0xF2F3F5, { roughness: .4 }), c, .06); cu.rotation.x = .45; const o = cil(.07, .04, 0, 5.03, .98, ojoM, c, 14); o.rotation.x = Math.PI / 2 + .45;
      const L = Math.hypot(tx - x, tz - z, 5), geo = new THREE.ConeGeometry(L * .42, L, 28, 1, true); geo.translate(0, -L / 2, 0);
      const cono = new THREE.Mesh(geo, conoM); cono.position.set(0, 5.05, .95); c.add(cono);   // la punta en la cámara, abriéndose hacia el punto mirado
      cono.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), new THREE.Vector3(0, -5.05, Math.hypot(tx - x, tz - z) - .95).normalize());
      conos.push(cono);
    }
    W.mejora.conoM = conoM;
  }

  k.fusionar(base);

  /* lo que se mueve solo, siempre: cinta, robot, autopista, globos, extractores y nubes */
  W.vida = (t, dt) => {
    for (const b of W.cajasCinta) { b.position.x += dt * .55; if (b.position.x > 55.3) b.position.x -= 13.3; }
    W.robot.base.rotation.y = Math.sin(t * .8) * 1.2; W.robot.b1.rotation.z = Math.sin(t * 1.3) * .25 - .1; W.robot.b2.rotation.z = Math.sin(t * 1.7 + 1) * .35; W.robot.baliza.emissiveIntensity = .6 + .6 * Math.sin(t * 5);
    for (const a of W.transito) { a.z += a.v * dt; if (a.z > 950) a.z -= 1900; if (a.z < -950) a.z += 1900; a.g.position.z = a.z; }
    for (const g of W.globos) { g.g.rotation.z = Math.sin(t * 1.1 + g.f) * .05; g.g.rotation.x = Math.cos(t * .9 + g.f) * .04; }
    for (const n of W.nubes) n.position.x += dt * 3;
  };
  return W;
}
