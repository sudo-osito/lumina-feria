/* Planta Neisstech · recorridos de las soluciones (9-nov-2026). Reemplaza las escenas sueltas (js/escenas/*):
   cada página de solución recorre SU zona de la misma planta v4 (calcada, con agentes auditados: nada atraviesa nada).
   Mismo contrato que las escenas: montar(cont, { etiqueta }) → { progreso(t), activo(bool), listo }.
   Fases = los <li class="rec-f"> de la página, en orden: 0 «antes» (sin Neisstech, alertas de casi-accidente) ·
   1 «rebobinemos» · 2…n−2 una capa cada una (se suma a las anteriores) · n−1 final (todas las capas de la solución).
   En cada capa los equipos suben desde el piso con el scroll y la cámara viaja a donde está cada uno. */
import { THREE, clamp, lerp, eio } from './nucleo.js';
import { montar as montarPlanta } from './vista.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
// toma: x, z (punto mirado), zoom (media altura visible, m), az y el (grados), y (altura del punto mirado)
const S = {
  'gestion-de-trafico': [
    { toma: { x: .4, z: 4.0, zoom: 6.6, az: 40, el: 38 } },
    { toma: { x: .4, z: 4.0, zoom: 6.6, az: 40, el: 38 } },
    { capas: ['demarcacion'], toma: { x: .8, z: 3.6, zoom: 6.2, az: 40, el: 46 } },
    { capas: ['proyLineas', 'proySenal', 'proySalidas'], toma: { x: .8, z: 5.2, zoom: 4.2, az: 40, el: 34, y: .4 }, etq: ['Sign Pro · Line Pro', V(.9, 3.3, 3.9)] },
    { capas: ['semaforo'], toma: { x: -1.6, z: 3.4, zoom: 4.6, az: 52, el: 32, y: .8 }, etq: ['X-KUBE', V(-3.7, 3.1, 1.2)] },
    { capas: ['barrSendero', 'puertas', 'sg', 'protCol'], toma: { x: -.4, z: 5.2, zoom: 4.4, az: 28, el: 26, y: 1.2 }, etq: ['Safety Gate', V(-1.0, 3.5, 5.2)] },
    { capas: ['theia'], toma: { x: -2.0, z: 1.0, zoom: 5.2, az: 48, el: 40 } },
    { toma: { x: 0, z: 2.6, zoom: 7.6, az: 40, el: 36 } },
  ],
  'barreras-y-protecciones': [
    { toma: { x: -1.2, z: -1.5, zoom: 7, az: 40, el: 38 } },
    { toma: { x: -1.2, z: -1.5, zoom: 7, az: 40, el: 38 } },
    { capas: ['barrSendero'], toma: { x: 1.6, z: -3.4, zoom: 5.4, az: 36, el: 34 }, etq: ['Barrera flexible', V(2.0, 1.25, -2.4)] },
    { capas: ['protRack'], toma: { x: -5.4, z: -2.8, zoom: 5, az: 55, el: 34 }, etq: ['Protección de racks', V(-4.35, .7, -1.8)] },
    { capas: ['protCol', 'sg'], toma: { x: -.6, z: 4.6, zoom: 5, az: 30, el: 30, y: 1 }, etq: ['Safety Gate', V(-1.0, 3.5, 5.2)] },
    { capas: ['puertas'], toma: { x: 1.0, z: 5.2, zoom: 3.8, az: 40, el: 34, y: .3 }, etq: ['Puerta peatonal', V(1.0, 1.15, 3.9)] },
    { toma: { x: -1.2, z: 1.0, zoom: 8, az: 40, el: 36 } },
  ],
  'demarcacion-de-pisos': [
    { toma: { x: 4, z: 1, zoom: 11, az: 40, el: 52 } },
    { toma: { x: 4, z: 1, zoom: 11, az: 40, el: 52 } },
    { capas: ['pisoSenderos'], toma: { x: 1.4, z: 1.5, zoom: 8, az: 40, el: 56 } },
    { capas: ['pisoCalles'], toma: { x: 12, z: 2, zoom: 16, az: 40, el: 58 } },
    { capas: ['pisoUbic'], toma: { x: -7.6, z: -12.8, zoom: 4.6, az: 40, el: 56 } },
    { capas: ['proyLineas', 'proySenal'], toma: { x: .8, z: 5.2, zoom: 4.2, az: 40, el: 34, y: .4 }, etq: ['Demarcación virtual', V(.9, 3.3, 3.9)] },
    { toma: { x: 10, z: 4, zoom: 20, az: 45, el: 42 } },
  ],
  'senalizacion-y-etiquetado': [
    { toma: { x: -1.5, z: 8.6, zoom: 6, az: 40, el: 32 } },
    { toma: { x: -1.5, z: 8.6, zoom: 6, az: 40, el: 32 } },
    { capas: ['senal'], toma: { x: 1.4, z: 9.4, zoom: 4.4, az: 52, el: 24, y: 1.2 } },
    { capas: ['colgantes'], toma: { x: -3.6, z: -2.6, zoom: 5, az: 62, el: 22, y: 2.6 }, etq: ['Pasillo 01 · 02 · 03', V(-4.55, 4.9, -1.8)] },
    { capas: ['electrico', 'tuberias'], toma: { x: .8, z: -5.4, zoom: 3.2, az: 52, el: 16, y: 2.0 }, etq: ['Contenido y sentido de flujo', V(.4, 3.3, -3.4)] },
    { capas: ['proyRec'], toma: { x: -10, z: 13.6, zoom: 4.2, az: 40, el: 40 }, etq: ['Proyección de advertencia', V(-11.6, 3.4, 13.2)] },
    { toma: { x: -4, z: 7, zoom: 9.5, az: 40, el: 36 } },
  ],
  'sistemas-de-seguridad': [
    { toma: { x: -10.2, z: 8.6, zoom: 6.2, az: 40, el: 36 } },
    { toma: { x: -10.2, z: 8.6, zoom: 6.2, az: 40, el: 36 } },
    { capas: ['smartdock'], toma: { x: 45.4, z: -21.2, zoom: 3.8, az: 140, el: 26, y: -.4 }, etq: ['SmartDock', V(45.45, -.7, -21.52)] },
    { capas: ['theia'], toma: { x: -2.0, z: 1.0, zoom: 5.2, az: 48, el: 40 } },
    { capas: ['alertaPeaton'], toma: { x: .6, z: 4.6, zoom: 5.4, az: 40, el: 42 } },
    { capas: ['radar'], toma: { x: -1.4, z: -3.4, zoom: 3.2, az: -150, el: 18, y: 2.2 }, etq: ['Radar de velocidad', V(-.6, 3.55, -2.0)] },
    { capas: ['pluma'], toma: { x: -23.4, z: -.4, zoom: 5.2, az: 40, el: 32, y: -1 }, etq: ['Barrera automática', V(-26.0, .1, -1.0)] },
    { toma: { x: -2, z: 6, zoom: 13, az: 40, el: 40 } },
  ],
  'carros-y-manipuladores': [
    { toma: { x: 22, z: 15, zoom: 7, az: 40, el: 40 } },
    { toma: { x: 22, z: 15, zoom: 7, az: 40, el: 40 } },
    { capas: ['kitting'], toma: { x: 22, z: 14, zoom: 4.4, az: 40, el: 36 }, etq: ['Carros de kitting', V(22, 1.4, 13.8)] },
    { capas: ['mesa'], toma: { x: 38.6, z: 22.6, zoom: 3.6, az: 40, el: 30, y: .5 }, etq: ['Mesa elevadora', V(38.6, 1.0, 22.6)] },
    { capas: ['vacio'], toma: { x: 37.8, z: 24, zoom: 3.8, az: 40, el: 30, y: .8 }, etq: ['Manipulador de vacío', V(37.4, 3.2, 25.2)] },
    { capas: ['milkrun'], toma: { x: 14.6, z: 2.6, zoom: 5, az: 40, el: 36 }, etq: ['Tren logístico · milk-run', V(12.5, 3.3, 2.6)] },
    { toma: { x: 26, z: 12, zoom: 15, az: 40, el: 40 } },
  ],
  'estaciones-de-trabajo': [
    { toma: { x: 36.4, z: 6.2, zoom: 4.6, az: 40, el: 32, y: .6 } },
    { toma: { x: 36.4, z: 6.2, zoom: 4.6, az: 40, el: 32, y: .6 } },
    { capas: ['estacion'], toma: { x: 34.2, z: 6.8, zoom: 3.2, az: 36, el: 28, y: .8 } },
    { capas: ['herramientas'], toma: { x: 34.2, z: 6.5, zoom: 2.6, az: 30, el: 22, y: 1.3 } },
    { capas: ['fifo'], toma: { x: 34.2, z: 5.4, zoom: 3.2, az: 52, el: 34, y: .6 } },
    { capas: ['puesto', 'indicadores'], toma: { x: 37, z: 5, zoom: 5, az: 40, el: 40, y: .4 } },
    { toma: { x: 36.4, z: 5.6, zoom: 6, az: 40, el: 34 } },
  ],
  'orden-y-almacenamiento': [
    { toma: { x: 8, z: -21.4, zoom: 5.2, az: 40, el: 40 } },
    { toma: { x: 8, z: -21.4, zoom: 5.2, az: 40, el: 40 } },
    { capas: ['estanteria'], toma: { x: 8, z: -21.4, zoom: 5.2, az: 40, el: 36, y: .6 } },
    { capas: ['cajas'], toma: { x: 4, z: -22.9, zoom: 2.4, az: 18, el: 20, y: 1.3 }, etq: ['Cajas organizadoras', V(4, 2.3, -23.8)] },
    { capas: ['identRep', 'colgantes'], toma: { x: 9, z: -20.6, zoom: 5, az: 40, el: 28, y: 1.6 } },
    { capas: ['puntoLimpio'], toma: { x: 40.4, z: 32.4, zoom: 3.6, az: 36, el: 28, y: .8 }, etq: ['Punto limpio', V(40.6, 2.3, 33.5)] },
    { toma: { x: 14, z: -18, zoom: 10, az: 40, el: 40 } },
  ],
  'tableros-y-pizarras': [
    { toma: { x: 3.2, z: -3.9, zoom: 5, az: 40, el: 36 } },
    { toma: { x: 3.2, z: -3.9, zoom: 5, az: 40, el: 36 } },
    { capas: ['standboard'], toma: { x: 2.4, z: -3.9, zoom: 2.4, az: -50, el: 48, y: 1.2 }, etq: ['Tablero de gestión diaria', V(2.6, 1.95, -3.9)] },
    { capas: ['sombras'], toma: { x: 15.2, z: 30, zoom: 2.6, az: 62, el: 20, y: 1.5 }, etq: ['Tablero de sombras', V(14.2, 2.3, 30)] },
    { capas: ['limpieza5s'], toma: { x: 27.8, z: 12, zoom: 2.4, az: 60, el: 18, y: 1.3 }, etq: ['Estación 5S de limpieza', V(27.25, 2.0, 12)] },
    { capas: ['indicadores'], toma: { x: 43.0, z: 1.9, zoom: 2.6, az: 20, el: 18, y: 1.0 }, etq: ['Pizarra de indicadores', V(43.3, 1.75, .6)] },
    { toma: { x: 20, z: 8, zoom: 19, az: 45, el: 40 } },
  ],
};
// cada solución, en el final, deja encendido además lo que la acompaña en terreno
const EXTRA_FINAL = { 'gestion-de-trafico': [], 'demarcacion-de-pisos': [] };

function solucionDe(cont) {
  const r = cont.closest('[data-recorrido]');
  if (r?.dataset.solucion) return r.dataset.solucion;
  const q = new URLSearchParams(location.search).get('nt3r') || location.pathname;
  return Object.keys(S).find((k) => q.includes(k)) || 'gestion-de-trafico';
}

export async function montar(cont, op = {}) {
  const sol = solucionDe(cont), F = S[sol];
  const rec = cont.closest('[data-recorrido]'), fasesDom = rec ? [...rec.querySelectorAll('.rec-f')] : [];
  const lim = fasesDom.length === F.length ? fasesDom.map((f) => [+f.dataset.desde, +f.dataset.hasta]) : F.map((_, i) => [i / F.length, (i + 1) / F.length]);
  const todas = [...new Set(F.flatMap((f) => f.capas || []))].concat(EXTRA_FINAL[sol] || []);
  // mobiliario que existe igual fuera de su página (estaciones, estanterías): encendido salvo en el recorrido que lo cuenta
  const base = {}; for (const c of ['estacion', 'herramientas', 'estanteria']) if (!todas.includes(c)) base[c] = 1;
  let planta = null;
  planta = await montarPlanta(cont, { vista: 'recorrido', pisoCapas: sol === 'demarcacion-de-pisos', capasIni: { ...base }, alertasIni: true, alCuadro: () => planta && etiquetar() });
  const etq = op.etiqueta;
  let T = 0, etqAct = null;

  function etiquetar() {
    if (!etq) return;
    if (!etqAct) { etq.classList.remove('on'); return; }
    const [x, y] = planta.k.proyectar(etqAct[1]);
    etq.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    if (etq.textContent !== etqAct[0]) etq.textContent = etqAct[0];
    etq.classList.add('on');
  }

  function aplicar(t) {
    T = clamp(t);
    let i = lim.findIndex(([d, h], j) => T >= d && (T < h || j === lim.length - 1)); if (i < 0) i = 0;
    const [d, h] = lim[i], u = clamp((T - d) / Math.max(1e-4, h - d)), n = F.length;
    // capas: las de fases anteriores, enteras; la de la fase actual sube con el scroll
    const niveles = { ...base };
    if (i === n - 1) for (const c of todas) niveles[c] = 1;
    else for (let j = 2; j <= i; j++) for (const c of F[j].capas || []) niveles[c] = j < i ? 1 : clamp(u / .45);
    planta.capas(niveles, i === 0);
    // cámara: de la toma anterior a la de esta fase en el primer tercio
    const a = F[Math.max(0, i - 1)].toma, b = F[i].toma, k = i === 0 ? 1 : eio(clamp(u / .35));
    const asp = cont.clientWidth / Math.max(1, cont.clientHeight);
    const toma = {}; for (const c of ['x', 'z', 'zoom', 'az', 'el', 'y']) toma[c] = lerp(a[c] ?? (c === 'y' ? 0 : 36), b[c] ?? (c === 'y' ? 0 : 36), k);
    toma.desplaza = asp > 1.1 ? .3 : 0;
    planta.toma(toma);
    etqAct = F[i].etq && (i === n - 1 || clamp(u / .45) > .85) ? F[i].etq : null;
  }
  aplicar(0);
  await planta.listo;
  return {
    listo: planta.listo,
    progreso(t) { aplicar(t); },
    activo(si) { planta.activo(si); },
    planta,
  };
}
