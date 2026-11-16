/* Planta Neisstech v5 (11-nov-2026) · trazado.
   Calles, sendero, cruces, muros, portones y puertas salen tal cual de plano/planos/mi-planta.json (el plano que dibujó
   Max, en metros, x a la derecha y z hacia abajo). Lo marcado «inventa tú» se completó acá: cada zona con su función.
   Flujo de la planta: camión → andén → pallets en espera → almacén (racks) → kitting → máquinas / ensamble → producto
   terminado → andén de despacho. Patio y estacionamiento al norte, calle pública al este. */

export const NIVEL_PATIO = -1.1;               // el patio está 1,1 m bajo el piso de la nave (altura de andén)
export const NAVE = { x0: 45, x1: 110, z0: 5, z1: 55 };
export const MUNDO = { x0: 24, x1: 126, z0: -20, z1: 70 };

// ── tránsito (del plano de Max) ──
export const CALLES = {
  B: { x0: 61.25, x1: 68.75, z0: 5, z1: 55 },     // calle principal (7,5 m) con el sendero en su borde este
  A: { x0: 45, x1: 101, z0: 33, z1: 37 },         // calle transversal de producción (4 m)
  C: { x0: 86.25, x1: 89.75, z0: 37, z1: 55 },    // ramal de ensamble y punto limpio (3,5 m)
  D: { x0: 96, x1: 103, z0: 5, z1: 37 },          // calle este (7 m): patio, carga de baterías, cámara de frío
  E: { x0: 68.75, x1: 96, z0: 14.75, z1: 18.25 }, // calle entre los dos bloques de racks (3,5 m)
  F: { x0: 56, x1: 61.25, z0: 5, z1: 15 },        // explanada del andén (10 m)
};
// cruces inteligentes: el paso de cebra se proyecta y se apaga cuando viene una grúa (estándar Gestión de Tráfico)
export const HOLO = ['Z2', 'Z3', 'Z6'];
export const SENDERO = { x0: 67.4, x1: 68.6, c: 68, z0: 5, z1: 55 };
// pistas de circulación (derecha, como en Chile)
export const PISTA = { Bs: 63.2, Bn: 65.7, Ae: 36, Aw: 34, Ds: 98, Dn: 101, Ee: 17.3, Ew: 15.7, C: 88 };
// cruces peatonales: rectángulo y eje por el que camina la persona ('x' o 'z')
export const CRUCES = {
  Z1: { x0: 61.5, x1: 67.4, z0: 18, z1: 19.5, paso: 'x', nombre: 'Cruce a la oficina de andén' },
  Z2: { x0: 66.9, x1: 68.75, z0: 14.75, z1: 18.25, paso: 'z', nombre: 'Cruce del sendero con la calle E' },
  Z3: { x0: 66.9, x1: 68.75, z0: 33, z1: 37, paso: 'z', nombre: 'Cruce del sendero con la calle A' },
  Z4: { x0: 50.5, x1: 52.5, z0: 33, z1: 37, paso: 'z', nombre: 'Cruce al producto terminado' },
  Z5: { x0: 77.5, x1: 79.5, z0: 33, z1: 37, paso: 'z', nombre: 'Cruce al punto de encuentro' },
  Z6: { x0: 96, x1: 103, z0: 28, z1: 30, paso: 'x', nombre: 'Cruce a la cámara de frío' },
  Z7: { x0: 86.25, x1: 89.75, z0: 41, z1: 42.6, paso: 'x', nombre: 'Cruce al ensamble' },
  ZP: { x0: 67.2, x1: 68.8, z0: -7.2, z1: -2.6, paso: 'z', nombre: 'Cruce del patio' },
};

// ── muros (del plano; el oeste y el sur cierran la nave) ──
export const MURO_N = { z: 5, x0: 45, x1: 110, alto: 4.6 };
export const MURO_M = { z: 25, x0: 45, x1: 110, alto: 3.6 };
export const MURO_O = { x: 45, z0: 5, z1: 55, alto: 3.6 };
export const MURO_E = { x: 110, z0: 5, z1: 55, alto: .9 };     // corte de maqueta (de cara a la cámara)
export const MURO_S = { z: 55, x0: 45, x1: 110, alto: .9 };
export const FRIO = { x0: 103.5, x1: 110, z0: 25, z1: 37, alto: 3.0, puerta: { z: 29, w: 1.7 } };

// portones y puertas (centro y ancho del plano)
export const ANDENES = [{ id: 'N1', x: 60, w: 3 }, { id: 'N2', x: 64.5, w: 3 }];
export const PORTON_PATIO = { x: 99.5, w: 7 };                 // portón a nivel con rampa al patio
export const PORTON_M1 = { x: 65, w: 7.5 }, PORTON_M2 = { x: 99.5, w: 7 };
export const PUERTAS = { norte: { x: 68, z: 5 }, m1: { x: 56, z: 25 }, m2: { x: 94, z: 25 }, sur: { x: 68, z: 55 }, oficinas: { x: 45, z: 20 } };
export const PORTON_TALLER = { z: 35, w: 4 }, PORTON_LIMPIO = { x: 88, w: 3.5 };

// ── zonas (lo que Max dejó para inventar) ──
export const ESPERA = { x0: 46.5, x1: 55.6, z0: 6, z1: 14.6, filas: [6.9, 8.5, 10.1, 11.7, 13.3], xs: [54.8, 53.6, 52.4, 51.2, 50.0, 48.8, 47.6] };
export const OFICINA_ANDEN = { x0: 46, x1: 53, z0: 17.6, z1: 24.2 };
export const PALLETS_VACIOS = { x0: 54.4, x1: 60.6, z0: 20.6, z1: 24.2 };
export const RACK = { alto: 5.2, niveles: [0, 1.45, 2.9, 4.35] };
export const FILAS_RACK = [[69.2, 70.3], [73.3, 75.5], [78.5, 80.7], [83.7, 85.9], [88.9, 91.1], [94.1, 95.2]];
export const PASILLOS_RACK = [71.8, 77.0, 82.2, 87.4, 92.6];
export const BLOQUE_N = { z0: 5.6, z1: 13.6 }, BLOQUE_S = { z0: 19.4, z1: 24.4 };
export const CARGA = { x0: 103.4, x1: 109.6, z0: 5.6, z1: 24.4, bahias: [7.6, 11.1, 14.6, 18.1, 21.6] };
export const DESCANSO = { x0: 45.4, x1: 53.6, z0: 25.4, z1: 32.6 };
export const LEAN = { x0: 54.4, x1: 60.6, z0: 26.2, z1: 32.0 };
export const KITTING = { x0: 69.2, x1: 95.6, z0: 25.6, z1: 32.6 };
export const ENCUENTRO = { x0: 70, x1: 85.6, z0: 37.6, z1: 43.6, punto: { x0: 71, x1: 76, z0: 38.4, z1: 42.8 } };
export const MAQUINAS = { x0: 69.4, x1: 85.6, z0: 44.4, z1: 54.6 };
export const ENSAMBLE = { x0: 90.4, x1: 109.6, z0: 37.6, z1: 54.6, lineas: [41, 49], xs: [93.2, 95.6, 98.0, 100.4, 102.8] };
export const PT = { x0: 45.4, x1: 60.8, z0: 37.6, z1: 54.6, filas: [44.6, 46.4, 48.2, 50.0, 51.8, 53.6], xs: [59.6, 58.4, 57.2, 56.0, 54.8, 53.6, 52.4] };
export const ENVOLVEDORA = { x: 55.4, z: 40.6 };
// anexos
export const OFICINAS = { x0: 30, x1: 44.6, z0: 5.6, z1: 24 };
export const TALLER = { x0: 31, x1: 44.6, z0: 27, z1: 43 };
export const EXPANSION = { x0: 30, x1: 44.6, z0: 45, z1: 55 };
export const CAMARINES = { x0: 57.5, x1: 80.5, z0: 55.3, z1: 64 };
// anexo sur: un pasillo que nace en la puerta del sendero y reparte al casino y a los camarines
export const PASILLO_S = { x0: 57.5, x1: 80.5, z0: 55.3, z1: 57.2, puertas: { casino: 62.5, camarines: 74.5 } };
export const CASINO = { x0: 57.5, x1: 69, z0: 57.2, z1: 64 }, CAMAR = { x0: 69, x1: 80.5, z0: 57.2, z1: 64 };
// anexo oeste: la ex «expansión» es la bodega de insumos de embalaje (film, cajas, esquineros) que abastece al paletizado
export const BODEGA = { x0: 30, x1: 44.6, z0: 45, z1: 55, porton: 49.6 };
// oficina de supervisión levantada sobre producto terminado, con escalera
// oficina de producción levantada sobre producto terminado, a lo largo de la muralla oeste; balcón al frente y escalera
// que sube hacia la muralla (13-nov)
export const MEZZ = { x0: 45.4, x1: 49.6, z0: 38.0, z1: 49.0, y: 2.9, balcon: 50.8, puerta: [40.9, 41.9], esc: { x0: 50.8, x1: 53.6, z0: 38.0, z1: 39.1 } };
export const LIMPIO = { x0: 83, x1: 96, z0: 55.3, z1: 63 };
// patio y exterior
export const PATIO = { x0: 44.875, x1: 112.2, z0: -16, z1: 4.875 };
export const PISTA_PATIO = { z0: -7.2, z1: -2.6, c: -4.9 };
export const ESTAC = { x0: 46, x1: 69.4, z0: -15.4, z1: -8.6 };
export const CALLE_PUBLICA = { x0: 113, x1: 121, z0: -20, z1: 70, sur: 115, norte: 119 };
export const RAMPA = { x0: 96, x1: 103, z0: -1, z1: 4.875 };
export const ESCALERA = { x0: 67.2, x1: 68.8, z0: 3.4, z1: 4.875 };
export const RAMPLA = { x0: 92, x1: 104, z: -12 };              // camión rampla en la bahía de carga lateral (al norte de la pista)
export const ESPERA_CONDUCTORES = { x0: 52, x1: 55, z0: -1.8, z1: 1.2 };

// altura del suelo en x,z (personas y equipos que salen al patio)
export function suelo(x, z) {
  { const Z = MEZZ, E = Z.esc;   // oficina levantada: escalera, balcón y oficina
    if (z >= E.z0 && z <= E.z1 && x >= E.x0 && x <= E.x1) return Z.y * (E.x1 - x) / (E.x1 - E.x0);
    if (z >= Z.z0 && z <= Z.z1 && x >= Z.x0 && x < E.x0) return Z.y; }   // nadie camina bajo la losa
  if (z >= NAVE.z0 - .2) return 0;
  if (x >= RAMPA.x0 && x <= RAMPA.x1 && z >= RAMPA.z0) return NIVEL_PATIO * (NAVE.z0 - .125 - z) / (NAVE.z0 - .125 - RAMPA.z0);
  if (x >= ESCALERA.x0 - .3 && x <= ESCALERA.x1 + .3 && z >= ESCALERA.z0) return -Math.min(4, Math.floor((NAVE.z0 - .125 - z) / .37)) * .275;
  if (x < NAVE.x0 && z > NAVE.z0) return 0;
  return NIVEL_PATIO;
}

/* Puntos de interés: lo que se ve mal antes y cómo queda después. Cada uno con su toma de cámara. */
export const PUNTOS = [
  { id: 'anden', x: 62, y: 2.6, z: 6, toma: { x: 60.5, z: 4, zoom: 10, az: 156, el: 52 },
    titulo: 'Andén',
    antes: 'Pallets en el piso del andén y un camión que se puede mover mientras la grúa entra.',
    despues: 'Zonas de espera numeradas y semáforo de andén SmartDock: la grúa entra solo con el camión bloqueado.' },
  { id: 'patio', x: 68, y: 1.2, z: -5, toma: { x: 70, z: -4, zoom: 12, az: 164, el: 40 },
    titulo: 'Patio',
    antes: 'Personas cruzando entre camiones para llegar a la puerta.',
    despues: 'Sendero peatonal, paso cebra con semáforo y barrera en el acceso de camiones.' },
  { id: 'cruce', x: 68, y: 2.4, z: 16.5, toma: { x: 66.4, z: 16.8, zoom: 6.6, az: -42, el: 44 },
    titulo: 'Cruce de la calle principal',
    antes: 'Cruce ciego: el sendero no existe y las grúas giran justo donde pasan las personas.',
    despues: 'Sendero con baranda, puertas peatonales y proyección en el piso que avisa cuando viene una grúa.' },
  { id: 'racks', x: 82, y: 5.6, z: 10, toma: { x: 82, z: 13.2, zoom: 8.6, az: 14, el: 58 },
    titulo: 'Almacén',
    antes: 'Racks sin protección, un pallet salido al pasillo y ubicaciones que nadie encuentra.',
    despues: 'Protectores de rack, pasillos identificados y cada ubicación a la vista.' },
  { id: 'porton', x: 65, y: 3.8, z: 25, toma: { x: 64.6, z: 23.4, zoom: 6.4, az: -140, el: 34, y: .8 },
    titulo: 'Portón central',
    antes: 'Grúas pasando con la carga en alto: el golpe llega directo al portón.',
    despues: 'Safetygate: la barra colgante avisa antes de que la carga alcance el portón.' },
  { id: 'calle', x: 64.4, y: 2.2, z: 40, toma: { x: 64.6, z: 37.5, zoom: 9, az: 26, el: 36 },
    titulo: 'Calle principal',
    antes: 'Personas caminando por la calle de las grúas y grúas sin control de velocidad.',
    despues: 'Sendero separado con baranda y radar que muestra la velocidad a cada operador.' },
  { id: 'frio', x: 103.5, y: 3.2, z: 29, toma: { x: 101.4, z: 29.6, zoom: 6.4, az: -62, el: 38 },
    titulo: 'Cámara de frío',
    antes: 'La puerta se abre hacia la calle este sin ningún aviso para quien pasa.',
    despues: 'Paso cebra y proyección en el piso que se enciende cuando se abre la puerta.' },
  { id: 'maquinas', x: 77, y: 2.6, z: 49, toma: { x: 77.5, z: 49.5, zoom: 7.4, az: 24, el: 40 },
    titulo: 'Maquinaria',
    antes: 'Máquinas sin perímetro, cajas y cables en el piso donde trabajan las personas.',
    despues: 'Perímetros de seguridad pintados, puestos ordenados y material en su lugar.' },
  { id: 'ensamble', x: 99, y: 2.6, z: 45, toma: { x: 99.5, z: 45.5, zoom: 8.6, az: 30, el: 40 },
    titulo: 'Ensamble',
    antes: 'Mesas sin regulación ni panel: cada persona busca sus herramientas.',
    despues: 'Estaciones de trabajo con panel de herramientas, luz y señal andon en cada puesto.' },
  { id: 'carga', x: 106.5, y: 2.4, z: 15, toma: { x: 105, z: 15, zoom: 7.6, az: 62, el: 40 },
    titulo: 'Carga de baterías',
    antes: 'Grúas cargando donde quedan, con cables cruzados y sin extintor a la vista.',
    despues: 'Bahías de carga demarcadas, bolardos, señalética y extintor en su punto.' },
  { id: 'encuentro', x: 74, y: 2.4, z: 40.6, toma: { x: 76, z: 41, zoom: 6.8, az: 20, el: 40 },
    titulo: 'Punto de encuentro',
    antes: 'Sin punto de encuentro y un tablero que nadie actualiza tapado por cajas.',
    despues: 'Punto de encuentro demarcado y tablero de gestión visual para la reunión del turno.' },
];
export const TOMA_PLANTA = { x: 77, z: 31, zoom: 25, az: 24, el: 46 };   // la nave, sin el patio ni la calle (13-nov)

