/* Planta Neisstech · mapa v2 (8-nov-2026), calcado de la planta isométrica de referencia que mandó Max.
   Cámara desde +x +z: arriba-izquierda = −x (estacionamiento, recepción), arriba-derecha = −z (expedición, cámara fría),
   abajo-izquierda = +z (lean corner, vending), abajo-derecha = +x (taladro, torno, supermercado).
   Banda alta (x −20…−4): recepción (z 6.5…20) · racks 01-02-03 (z −12…6.5) · expedición (z −22…−12), unidas por un pasillo
   de grúas a lo largo de W1. W1 (x = −4) separa la banda alta del hall de producción (x −4…22). */
// ═══ v4 (8-nov): calcado de la vista superior rectificada de la referencia (calco/calles.json, +0.6 en x) y extendido ═══
export const NAVE = { x0: -11.9, x1: 44, z0: -24, z1: 34, alto: 3.6 };
export const W1 = { x: 0, d1: [3.0, 7.4], ventana: [-3.4, -.4], d2: [-11.6, -8.6], altoPorton: 3.0 };
export const W2 = { z: 3.0, x1: -4.0 };       // racks | recepción (abierto entre x −4 y W1)
export const W3 = { z: -14.6, x1: -4.0 };     // expedición | racks 2
export const PASILLO_G = { x0: -4.0, x1: 0, c: -2.0 };
export const SENDERO_A = { x0: -1.3, x1: -.15, c: -.75 };
export const SENDERO_H = { x0: .15, x1: 1.85, c: 1.0, barrera: 2.0 };
export const RACK = { x0: -11.4, x1: -4.8, alto: 3.3, niveles: [0, 1.12, 2.12] };
export const FILAS = [[2.0, 3.0], [-2.8, -.8], [-7.6, -5.6], [-11.4, -10.4]];
export const PASILLOS = [[-.8, 2.0, '01'], [-5.6, -2.8, '02'], [-10.4, -7.6, '03']];
export const pasillo = (n) => { const p = PASILLOS.find((q) => q[2] === n) || PASILLOS[0]; return { z0: p[0], z1: p[1], c: (p[0] + p[1]) / 2 }; };
export const RACK2 = { x0: -11.4, x1: -4.8, filas: [[-23.6, -22.6], [-19.8, -17.8], [-16.0, -15.0]] };
export const ANDEN = { x: -11.9, z: 8.5, ancho: 3.2 };
export const ANDEN2 = { x: -11.9, z: 26.0, ancho: 3.2 };
export const PUERTA_REC = { x: -11.9, z: 14.0 };
export const PALLETS_VACIOS = { x0: -8.6, x1: -4.3, z0: 3.4, z1: 6.0 };
export const CEBRA_REC = { x: -.75, z0: 6.3, z1: 10.7, ancho: 1.3 };
export const CEBRA_REC2 = { x: -9.6, z0: 6.3, z1: 10.7, ancho: 1.3 };
export const EXPED = { spots: [[-9.6, -12.6], [-9.6, -13.9], [-7.8, -12.6], [-7.8, -13.9], [-6.0, -12.6], [-6.0, -13.9]] };
export const CARGA = { x0: -10.8, x1: -5.0, z0: 29.0, z1: 33.2 };          // carga de baterías de grúas
export const HALL_MAT = { spots: [[7.0, 5.2], [7.0, 5.2]] };
export const STANDBOARD = { x: 2.6, z: -3.9 };
export const MAQUINA = { x: 5.6, z0: -3.6, z1: 2.4 };
export const CUBES = [[7.6, -4.6], [8.4, 18.6], [28.3, 16.0]];
export const CAMARA_FRIA = { x0: .2, x1: 10.8, z0: -16.0, z1: -10.3, puerta: 5.4 };
export const ROBOT = { x: 14.4, z: -7.6 }, ROBOT2 = { x: 19.6, z: -7.6 };
export const SUPER = { x0: 11.3, x1: 17.6, z0: -.6, z1: 5.9 };            // milk-run AGV (pórtico, lámparas, pantalla, carros, 001–009)
export const TALADRO = { x: 21.8, z: .6 }, TORNO = { x: 22.4, z: 4.6 }, FRESA = { x: 24.8, z: 1.6 };
export const LEAN = { x0: 1.4, x1: 6.6, z0: 11.6, z1: 16.2 };
export const VENDING = { x: 3.6, z: 21.4 };
export const OFICINAS = { x0: .6, x1: 14.0, z0: 25.6, z1: 33.6 };
export const TALLER = { x0: 15.0, x1: 26.0, z0: 25.6, z1: 33.6 };
export const REPUESTOS = { x0: .6, x1: 26.0, z0: -23.6, z1: -19.8 };
export const PT = { x0: 30.2, x1: 43.6, z0: -23.6, z1: -6.4, docks: [-20.4, -15.4, -10.4] };
export const ENSAMBLE = { x0: 30.2, x1: 43.6, z0: -2.4, z1: 13.6, estaciones: [32.0, 34.2, 36.4, 38.6, 40.8], zMesa: 6.6 };
export const PALETIZADO = { x0: 30.2, x1: 43.6, z0: 17.6, z1: 33.6, mesa: [38.6, 22.6], columna: [37.4, 25.2] };
export const KITTING = { x0: 13.4, x1: 25.8, z0: 11.8, z1: 21.6 };
export const COLUMNAS = [[-8.4, 3.0], [-8.4, -14.6], [8.4, -12.0], [27.0, -12.0], [27.0, 12.0], [8.4, 24.0], [27.0, 24.0]];
// calles (rectángulos de tránsito, bordes amarillos) y circuito AGV
export const CALLES = [
  { n: 'S1', x0: 8.4, x1: 10.7, z0: -19.4, z1: 10.9 }, { n: 'S1b', x0: 9.8, x1: 12.7, z0: 10.9, z1: 25.4 },
  { n: 'S2', x0: 0, x1: 8.4, z0: 5.6, z1: 10.9 }, { n: 'S2b', x0: 10.7, x1: 30.2, z0: 6.7, z1: 11.2 },
  { n: 'S3', x0: 10.7, x1: 30.2, z0: -3.7, z1: -1.45 }, { n: 'S4', x0: 0, x1: 8.4, z0: -10.3, z1: -5.8 },
  { n: 'S5', x0: 26.6, x1: 30.2, z0: -24, z1: 34 }, { n: 'S6', x0: 30.2, x1: 44, z0: -6.4, z1: -2.4 },
  { n: 'S7', x0: 30.2, x1: 44, z0: 13.6, z1: 17.6 }, { n: 'S8', x0: 0, x1: 26.6, z0: 22.0, z1: 25.6 },
  { n: 'S9', x0: 0, x1: 26.6, z0: -19.8, z1: -16.0 }, { n: 'R1', x0: -11.9, x1: 0, z0: 6.3, z1: 10.7 }, { n: 'PG', x0: -4.0, x1: 0, z0: -24, z1: 24 },
];
export const AGV = [[9.55, -2.6], [28.4, -2.6], [28.4, 9.0], [9.55, 9.0]];
export const CEBRA_H1 = { z: -8.0, x0: 4.8, x1: 6.0 };                 // hacia la cámara fría
export const CEBRA_H2 = { x: 9.7, z0: -.95, z1: .2 };                   // cruce de S1 junto al milk-run
export const CEBRA_H3 = { x: 10.9, z0: 14.0, z1: 14.7 };
export const PUERTA_P = [8.0, 9.2];
export const ESTAC = { x0: -26, x1: -12.15, z0: -24, z1: 34 };

/* Rutas: polilíneas con esquinas redondeadas, muestreadas cada ~5 cm. */
export function ruta(puntos, radio = 1.1) {
  const P = puntos.map(([x, z]) => ({ x, z })), out = [];
  for (let i = 0; i < P.length; i++) {
    const p = P[i];
    if (i === 0 || i === P.length - 1) { out.push(p); continue; }
    const a = P[i - 1], b = P[i + 1];
    const la = Math.hypot(p.x - a.x, p.z - a.z), lb = Math.hypot(b.x - p.x, b.z - p.z);
    const r = Math.min(radio, la * .5, lb * .5);
    const ua = { x: (p.x - a.x) / la, z: (p.z - a.z) / la }, ub = { x: (b.x - p.x) / lb, z: (b.z - p.z) / lb };
    const s = { x: p.x - ua.x * r, z: p.z - ua.z * r }, e = { x: p.x + ub.x * r, z: p.z + ub.z * r };
    for (let k = 0; k <= 10; k++) { const t = k / 10, u = 1 - t; out.push({ x: u * u * s.x + 2 * u * t * p.x + t * t * e.x, z: u * u * s.z + 2 * u * t * p.z + t * t * e.z }); }
  }
  const L = [0]; for (let i = 1; i < out.length; i++) L.push(L[i - 1] + Math.hypot(out[i].x - out[i - 1].x, out[i].z - out[i - 1].z));
  const largo = L[L.length - 1], n = Math.max(2, Math.ceil(largo / .05)), xs = new Float32Array(n + 1), zs = new Float32Array(n + 1);
  let j = 0;
  for (let i = 0; i <= n; i++) {
    const s = (largo * i) / n; while (j < L.length - 2 && L[j + 1] < s) j++;
    const k = L[j + 1] > L[j] ? (s - L[j]) / (L[j + 1] - L[j]) : 0;
    xs[i] = out[j].x + (out[j + 1].x - out[j].x) * k; zs[i] = out[j].z + (out[j + 1].z - out[j].z) * k;
  }
  const paso = largo / n;
  function en(s) {
    s = Math.max(0, Math.min(largo, s)); const f = s / paso, i = Math.min(n - 1, Math.floor(f)), k = f - i;
    const x = xs[i] + (xs[i + 1] - xs[i]) * k, z = zs[i] + (zs[i + 1] - zs[i]) * k;
    const i0 = Math.max(0, i - 3), i1 = Math.min(n, i + 4), dx = xs[i1] - xs[i0], dz = zs[i1] - zs[i0], l = Math.hypot(dx, dz) || 1;
    return { x, z, dx: dx / l, dz: dz / l };
  }
  function cerca(x, z) { let best = 1e9, bi = 0; for (let i = 0; i <= n; i += 2) { const d = (xs[i] - x) ** 2 + (zs[i] - z) ** 2; if (d < best) { best = d; bi = i; } } return { s: bi * paso, d: Math.sqrt(best) }; }
  return { largo, en, cerca, puntos };
}
export const rumbo = (dx, dz) => Math.atan2(-dz, dx);
