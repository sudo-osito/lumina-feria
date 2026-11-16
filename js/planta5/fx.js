/* Planta Neisstech v5 · kit visual de las demostraciones (14-nov-2026). Lo usan las demostraciones de la home
   (escenas.js) y las escenas de cada página de solución (js/escenas). Brillo sobre el equipo que actúa, aro que late en
   el piso, recorrido dibujado con rayas que avanzan, abanico de punto ciego, destello del golpe, enlace de detección y
   estelas de velocidad. altura(x, z) = nivel del piso en ese punto. */
import { THREE, clamp } from '../planta/nucleo.js';
import { ruta } from '../planta/mapa.js';

export const ROJO = 0xFF3B3B, AMAR = 0xFFC83D, AZUL = 0x2F86FF, VERDE = 0x2ED47A, OSC = 0x1B1D22;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function crearFx(k, altura = () => 0) {
  const brilloTex = k.tex((c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.25, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }, 128, 128);
  // brillo sobre un equipo o una persona (se ve a través de todo)
  function brillo(g, color, tam = 1.4) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: brilloTex, color, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    s.renderOrder = 20; s.visible = false; g.add(s);
    const o = { s, at(x, y, z) { s.position.set(x, y, z); return o; }, pintar(q, t, pulso = 1) { s.visible = q > .01; if (!s.visible) return; s.material.opacity = q * (.75 + .25 * Math.sin(t * 6) * pulso); s.scale.setScalar(tam * (1 + .18 * Math.sin(t * 6) * pulso)); } };
    return o;
  }
  // aro en el piso que late
  function aro(g, color, r = 1) {
    const mk = () => { const m = new THREE.Mesh(new THREE.RingGeometry(r * .78, r, 56), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, side: THREE.DoubleSide })); m.rotation.x = -Math.PI / 2; m.renderOrder = 9; m.visible = false; g.add(m); return m; };
    const m = mk(), m2 = mk();
    const o = { at(x, z, y) { const yy = (y ?? altura(x, z)) + .06; m.position.set(x, yy, z); m2.position.set(x, yy + .002, z); return o; },
      color(c) { m.material.color.setHex(c); m2.material.color.setHex(c); return o; },
      pintar(q, t) { m.visible = m2.visible = q > .01; if (!m.visible) return; const p = (t * 1.1) % 1; m.material.opacity = q * .95; m2.scale.setScalar(1 + p * 1.1); m2.material.opacity = q * (1 - p) * .8; } };
    return o;
  }
  // recorrido dibujado en el piso: rayas que avanzan; se revela hasta q (0..1) y puede empezar en «desde»
  function trazo(g, color, ancho = .2) {
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, uniforms: { uC: { value: new THREE.Color(color) }, uQ: { value: 0 }, uD: { value: 0 }, uA: { value: 0 }, uT: { value: 0 }, uL: { value: 1 }, uRaya: { value: 1 } },
      vertexShader: 'attribute float dist; varying float vD; void main(){ vD = dist; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 uC; uniform float uQ, uD, uA, uT, uL, uRaya; varying float vD; void main(){ if (vD > uQ*uL || vD < uD*uL) discard; float r = mix(1., step(.42, fract(vD*1.5 - uT*1.6)), uRaya); gl_FragColor = vec4(uC, uA*(.3 + .7*r)); }' });
    const m = new THREE.Mesh(new THREE.BufferGeometry(), mat); m.renderOrder = 8; m.frustumCulled = false; m.visible = false; g.add(m);
    const o = { set(pts, radio = .8, raya = 1) { const r = ruta(pts, radio), n = Math.max(2, Math.ceil(r.largo / .12)), pos = [], dist = [], idx = [];
        for (let i = 0; i <= n; i++) { const s = r.largo * i / n, q = r.en(s), y = altura(q.x, q.z) + .045; pos.push(q.x - q.dz * ancho / 2, y, q.z + q.dx * ancho / 2, q.x + q.dz * ancho / 2, y, q.z - q.dx * ancho / 2); dist.push(s, s); if (i) idx.push(2 * i - 2, 2 * i - 1, 2 * i, 2 * i - 1, 2 * i + 1, 2 * i); }
        const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('dist', new THREE.Float32BufferAttribute(dist, 1)); geo.setIndex(idx);
        m.geometry.dispose(); m.geometry = geo; mat.uniforms.uL.value = r.largo; mat.uniforms.uRaya.value = raya; return o; },
      color(c) { mat.uniforms.uC.value.setHex(c); return o; },
      pintar(q, a, t, desde = 0) { m.visible = a > .01 && q > desde; mat.uniforms.uQ.value = q; mat.uniforms.uD.value = desde; mat.uniforms.uA.value = a; mat.uniforms.uT.value = t; } };
    return o;
  }
  // abanico en el piso (punto ciego)
  function abanico(g, color, ang, largo) {
    const geo = new THREE.CircleGeometry(largo, 32, -ang / 2, ang); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, uniforms: { uC: { value: new THREE.Color(color) }, uA: { value: 0 }, uL: { value: largo } },
      vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader: 'uniform vec3 uC; uniform float uA, uL; varying vec3 vP; void main(){ float d = length(vP.xz)/uL; gl_FragColor = vec4(uC, uA * (1. - d) * .8); }' });
    const m = new THREE.Mesh(geo, mat); m.renderOrder = 8; m.visible = false; g.add(m);
    const o = { at(x, z, th, y = .05) { m.position.set(x, y, z); m.rotation.y = th; return o; }, pintar(q) { m.visible = q > .01; mat.uniforms.uA.value = q; } };
    return o;
  }
  // destello de un golpe o de un casi accidente
  function destello(g) { const b = brillo(g, ROJO, 1); let t0 = -9;
    return { disparar(x, y, z, c, t) { b.at(x, y, z); b.s.material.color.setHex(c); t0 = t; },
      pintar(t) { const u = t - t0; if (u < 0 || u > .9) { b.s.visible = false; return; } b.s.visible = true; b.s.material.opacity = 1 - u / .9; b.s.scale.setScalar(1.5 + u * 7); } }; }
  // enlace de detección (del sensor al equipo detectado)
  function enlace(g, color) { const m = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1, 8, 1, true), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    m.renderOrder = 19; m.visible = false; g.add(m); const dir = V(0, 0, 0), arriba = V(0, 1, 0);
    return { pintar(q, a, b, t) { m.visible = q > .01; if (!m.visible) return; dir.subVectors(b, a); const L = dir.length(); m.scale.set(1, L, 1); m.position.copy(a).addScaledVector(dir, .5); m.quaternion.setFromUnitVectors(arriba, dir.normalize()); m.material.opacity = q * (.55 + .45 * Math.sin(t * 14)); } }; }
  // estelas de velocidad detrás de una grúa
  function estelas(a) { const g = k.grupo(0, 0, 0, 0, a.obj), mat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
    const l = [[.5, -.45], [1.0, .45], [1.6, 0], [.3, .2]].map(([y, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(1, .04, .04), mat); m.position.set(-1.2, y, z); g.add(m); return m; });
    return { pintar(v) { const q = clamp((v - 2.2) / 1.6); mat.opacity = q * .7; l.forEach((m, i) => { const L = .4 + q * (1.6 + i * .4); m.scale.x = L; m.position.x = -1.25 - L / 2; m.visible = q > .02; }); } }; }

  return { brillo, aro, trazo, abanico, destello, enlace, estelas };
}
