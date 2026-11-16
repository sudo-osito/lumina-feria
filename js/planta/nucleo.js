/* Planta Neisstech · núcleo (8-nov-2026). Render, luz, materiales, primitivas, texturas, fusión de lo estático y cámara.
   Lenguaje: maqueta blanca y gris tipo clay; el amarillo, el azul y la luz son lo que pone Neisstech. 1 unidad = 1 m. */
import * as THREE from '../../vendor/three/three.module.min.js';
export { THREE };

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a, b, k) => a + (b - a) * k;
export const suave = (x) => x * x * (3 - 2 * x);
export const eio = (x) => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const tramo = (t, a, b) => clamp((t - a) / (b - a));
export const C = {
  fondo: 0xF3F4F6, piso: 0xD8D4CD, losa: 0xCFC6BD, muro: 0xE9DED4, corte: 0xC9B9AC, blanco: 0xF6F7F8, gris: 0xD5DAE1, gris2: 0xBFC6D0,
  tinta: 0x3A4150, caja: 0xEFE9DF, caja2: 0xE4DDD0, film: 0xF4F6F8, amarillo: 0xF5C400, negro: 0x2B2F36, azul: 0x056CF2,
  piel: 0xF1CBAA, pantalon: 0x4A5568, rojo: 0xFF4D4D, verde: 0x22C55E, naranjo: 0xFF8A1F, madera: 0xD9B98C, asfalto: 0xC9CED6,
};

export function nucleo(cont, op = {}) {
  const movil = (cont.clientWidth || innerWidth) < 760;
  const lienzo = document.createElement('canvas'); lienzo.className = 'rec-lienzo'; lienzo.setAttribute('aria-hidden', 'true'); cont.prepend(lienzo);
  const render = new THREE.WebGLRenderer({ canvas: lienzo, antialias: true, alpha: !!op.transparente, powerPreference: 'high-performance', preserveDrawingBuffer: !!op.captura });
  render.setClearColor(C.fondo, op.transparente ? 0 : 1);   // transparente: la escena se apoya sobre el fondo de la página
  render.setPixelRatio(Math.min(movil ? 2 : 1.75, devicePixelRatio || 1));
  render.shadowMap.enabled = true; render.shadowMap.type = THREE.PCFSoftShadowMap;
  render.outputColorSpace = THREE.SRGBColorSpace; render.toneMapping = THREE.ACESFilmicToneMapping; render.toneMappingExposure = 1.0;
  const escena = new THREE.Scene();
  const camara = new THREE.OrthographicCamera(-10, 10, 10, -10, .1, 600);

  const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .78, metalness: 0, ...extra });
  const M = {
    piso: std(C.piso, { roughness: .95 }), losa: std(C.losa, { roughness: .95 }), muro: std(C.muro, { roughness: .92 }), corte: std(C.corte, { roughness: .9 }),
    blanco: std(C.blanco), gris: std(C.gris), gris2: std(C.gris2), tinta: std(C.tinta, { roughness: .55 }), acero: std(0x9AA3AE, { roughness: .38, metalness: .5 }),
    caja: std(C.caja), caja2: std(C.caja2), film: std(C.film, { roughness: .35 }), madera: std(C.madera, { roughness: .85 }),
    amarillo: std(C.amarillo, { roughness: .45 }), negro: std(C.negro, { roughness: .6 }), azul: std(C.azul, { roughness: .42 }), azulClaro: std(0x4F95F5, { roughness: .45 }),
    rojo: std(0xE5383B, { roughness: .45 }), verde: std(0x1FA45A, { roughness: .5 }), naranjo: std(C.naranjo, { roughness: .5 }),
    piel: std(C.piel), pantalon: std(C.pantalon), camisa: std(0x7FA7D9), vidrio: std(0xCFE0F2, { roughness: .12, transparent: true, opacity: .5 }),
    asfalto: std(C.asfalto, { roughness: .97 }), pasto: std(0xDDE6D6, { roughness: 1 }),
  };
  // luces que cambian (cada una con su propio material emisivo)
  const luz = (color, base = 0x333333) => std(base, { emissive: color, emissiveIntensity: 0, roughness: .3 });

  const cache = new Map();
  function rbox(w, h, d, r = .05) {
    const k = [w, h, d, r].map((v) => v.toFixed(3)).join(':');
    if (cache.has(k)) return cache.get(k);
    let g;
    r = Math.min(r, w / 2 - .001, d / 2 - .001, h / 2 - .001);
    if (r < .012) { g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); }
    else {
      const s = new THREE.Shape(), x0 = -w / 2 + r, z0 = -d / 2 + r, ww = w - 2 * r, dd = d - 2 * r;
      s.moveTo(x0, z0 - r); s.absarc(x0, z0, r, Math.PI, Math.PI * 1.5); s.lineTo(x0 + ww, z0 - r); s.absarc(x0 + ww, z0, r, Math.PI * 1.5, Math.PI * 2);
      s.lineTo(x0 + ww + r, z0 + dd); s.absarc(x0 + ww, z0 + dd, r, 0, Math.PI / 2); s.lineTo(x0, z0 + dd + r); s.absarc(x0, z0 + dd, r, Math.PI / 2, Math.PI);
      const b = Math.min(r, h / 2 - .001);
      g = new THREE.ExtrudeGeometry(s, { depth: Math.max(.001, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: 0, bevelSegments: 2, curveSegments: 3 });
      g.rotateX(-Math.PI / 2); g.translate(0, b, 0); g.computeVertexNormals();
    }
    cache.set(k, g); return g;
  }
  function malla(geo, m, x, y, z, padre = escena, sombra = true) { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = sombra; o.receiveShadow = true; padre.add(o); return o; }
  const caja = (w, h, d, x, y, z, m = M.blanco, p = escena, r = .04) => malla(rbox(w, h, d, r), m, x, y, z, p);
  const cgeo = new Map();
  const cil = (r, h, x, y, z, m = M.blanco, p = escena, seg = 16, r2) => { const k = `${r}:${r2 ?? r}:${h}:${seg}`; if (!cgeo.has(k)) { const g = new THREE.CylinderGeometry(r2 ?? r, r, h, seg); g.translate(0, h / 2, 0); cgeo.set(k, g); } return malla(cgeo.get(k), m, x, y, z, p); };
  const capsula = (r, l, x, y, z, m, p = escena) => malla(new THREE.CapsuleGeometry(r, l, 4, 10), m, x, y, z, p);
  const esfera = (r, x, y, z, m, p = escena, seg = 16) => malla(new THREE.SphereGeometry(r, seg, Math.round(seg * .66)), m, x, y, z, p);
  function barra(a, b, grosor, m, p = escena) {
    const d = new THREE.Vector3().subVectors(b, a), L = d.length();
    const o = malla(new THREE.BoxGeometry(L, grosor, grosor), m, 0, 0, 0, p);
    o.position.copy(a).add(b).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), d.clone().normalize()); return o;
  }
  const grupo = (x = 0, y = 0, z = 0, ry = 0, padre = escena) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; padre.add(g); return g; };

  // luz: cielo + sol con sombra que sigue al encuadre
  escena.add(new THREE.HemisphereLight(0xffffff, 0xd6dce5, 1.3));
  const sol = new THREE.DirectionalLight(0xffffff, 1.85); sol.castShadow = true;
  const SM = movil ? 2048 : 4096; sol.shadow.mapSize.set(SM, SM);
  sol.shadow.bias = -.0005; sol.shadow.normalBias = .03; sol.shadow.radius = 4; escena.add(sol, sol.target);
  const relleno = new THREE.DirectionalLight(0xe6eeff, .42); relleno.position.set(30, 18, -10); escena.add(relleno);
  const DIR_SOL = new THREE.Vector3(-.42, 1, .55).normalize();
  function sombraEn(x, z, radio) {
    sol.target.position.set(x, 0, z); sol.position.set(x + DIR_SOL.x * 60, DIR_SOL.y * 60, z + DIR_SOL.z * 60);
    const r = Math.max(8, radio); Object.assign(sol.shadow.camera, { left: -r, right: r, top: r, bottom: -r, near: 1, far: 140 }); sol.shadow.camera.updateProjectionMatrix();
  }

  // texturas
  const cargador = new THREE.TextureLoader(), imagenes = new Map(), pendientes = [];
  function imagen(url) {
    if (imagenes.has(url)) return imagenes.get(url);
    let fin; pendientes.push(new Promise((r) => (fin = r)));
    const t = cargador.load(url, () => fin(), undefined, () => fin());
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; imagenes.set(url, t); return t;
  }
  function tex(dib, w = 512, h = 512) { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); dib(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }

  /* Fusión: junta las mallas estáticas de un grupo en una malla por material (menos llamadas de dibujo). */
  function fusionar(raiz) {
    raiz.updateMatrixWorld(true); const inv = raiz.matrixWorld.clone().invert(), rel = new THREE.Matrix4();
    const por = new Map(), quitar = [];
    raiz.traverse((o) => {
      if (!o.isMesh || Array.isArray(o.material) || o.userData.vivo) return;
      let p = o.parent, vivo = false; while (p && p !== raiz) { if (p.userData.vivo) vivo = true; p = p.parent; } if (vivo) return;
      const k = o.material.uuid + (o.castShadow ? 's' : 'n'); if (!por.has(k)) por.set(k, { m: o.material, sombra: o.castShadow, l: [] });
      por.get(k).l.push(o); quitar.push(o);
    });
    const nm = new THREE.Matrix3();
    for (const { m, sombra, l } of por.values()) {
      let n = 0; const geos = l.map((o) => { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry; n += g.attributes.position.count; return [g, new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)]; });
      const P = new Float32Array(n * 3), N = new Float32Array(n * 3), U = new Float32Array(n * 2); let i = 0;
      const v = new THREE.Vector3();
      for (const [g, mw] of geos) {
        nm.getNormalMatrix(mw); const pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv;
        for (let j = 0; j < pa.count; j++, i++) {
          v.fromBufferAttribute(pa, j).applyMatrix4(mw); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
          if (na) { v.fromBufferAttribute(na, j).applyMatrix3(nm).normalize(); N[i * 3] = v.x; N[i * 3 + 1] = v.y; N[i * 3 + 2] = v.z; }
          if (ua) { U[i * 2] = ua.getX(j); U[i * 2 + 1] = ua.getY(j); }
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('uv', new THREE.BufferAttribute(U, 2));
      g.computeBoundingSphere();
      const o = new THREE.Mesh(g, m); o.castShadow = sombra; o.receiveShadow = true; o.matrixAutoUpdate = false; raiz.add(o);
    }
    quitar.forEach((o) => o.parent.remove(o));
    return raiz;
  }

  // cámara isométrica (ortográfica): x,z = punto mirado; zoom = media altura visible; az/el en grados
  let W = 1, H = 1;
  function medir() { W = cont.clientWidth || innerWidth; H = cont.clientHeight || innerHeight; render.setSize(W, H, false); }
  function fijar(v) {
    const asp = W / H; let zoom = v.zoom; if (asp < 1) zoom *= Math.min(2.2, .8 / asp);
    const hw = zoom * asp, d = v.desplaza || 0, az = v.az * Math.PI / 180, el = (v.el ?? 36) * Math.PI / 180, y = v.y || 0;
    Object.assign(camara, { left: -hw * (1 + d), right: hw * (1 - d), top: zoom, bottom: -zoom }); camara.updateProjectionMatrix();
    camara.position.set(v.x + Math.sin(az) * Math.cos(el) * 120, y + Math.sin(el) * 120, v.z + Math.cos(az) * Math.cos(el) * 120); camara.lookAt(v.x, y, v.z);
    sombraEn(v.x, v.z, zoom * Math.max(1, asp) * 1.25);
  }
  const proyectar = (p) => { const q = p.clone().project(camara); return [(q.x * .5 + .5) * W, (-q.y * .5 + .5) * H]; };

  return {
    THREE, render, escena, camara, sol, M, std, luz, rbox, malla, caja, cil, capsula, esfera, barra, grupo, tex, imagen, pendientes, fusionar,
    medir, fijar, proyectar, movil, lienzo, get W() { return W; }, get H() { return H; },
  };
}
