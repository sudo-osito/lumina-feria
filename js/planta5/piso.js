/* Planta Neisstech v5 · piso pintado (un lienzo para todo el terreno). El mismo concreto gris en los dos modos.
   antes = la demarcación básica (calles, cebras, sendero) pintada hace años y gastada por las grúas: cortada, saltada y
   casi borrada en los tramos de más tránsito, con huellas de neumáticos y manchas.
   después = la demarcación completa con cinta de alto tráfico: sendero amarillo, cebras de cinta en los cruces simples
   (los cruces inteligentes se proyectan desde el techo), ubicaciones, perímetros, bahías y rótulos de zona. (12-nov) */
import * as P from './trazado.js';

const AMA = '#F5C400', VERDE = '#2E9E5B', PISO = '#C8C4BC', PISO_D = '#53585F', CALLE = '#4E535A', BLANCO = '#FFFFFF', TINTA0 = '#4A5262', FRANJA = .3, AZUL = '#056CF2', ROJO = '#E5383B';

export function pintarPiso(ppm, antes) {
  const TINTA = antes ? TINTA0 : '#E3E6EA';   // rótulos claros sobre el piso oscuro del después
  const { x0: X0, z0: Z0 } = P.MUNDO, W = Math.round((P.MUNDO.x1 - X0) * ppm), H = Math.round((P.MUNDO.z1 - Z0) * ppm);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c = cv.getContext('2d');
  const X = (v) => (v - X0) * ppm, Z = (v) => (v - Z0) * ppm;
  const rect = (r, col, m = 0) => { c.fillStyle = col; c.fillRect(X(r.x0 - m), Z(r.z0 - m), (r.x1 - r.x0 + 2 * m) * ppm, (r.z1 - r.z0 + 2 * m) * ppm); };
  const borde = (r, col, ancho = .1, dash) => { c.save(); c.strokeStyle = col; c.lineWidth = ancho * ppm; if (dash) c.setLineDash(dash.map((d) => d * ppm)); c.strokeRect(X(r.x0) + ancho * ppm / 2, Z(r.z0) + ancho * ppm / 2, (r.x1 - r.x0 - ancho) * ppm, (r.z1 - r.z0 - ancho) * ppm); c.restore(); };
  const linea = (pts, col, ancho = .1, dash) => { c.save(); c.strokeStyle = col; c.lineWidth = ancho * ppm; c.lineCap = 'butt'; if (dash) c.setLineDash(dash.map((d) => d * ppm)); c.beginPath(); pts.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.stroke(); c.restore(); };
  const texto = (t, x, z, tam, col = TINTA, rot = 0, peso = 700) => { c.save(); c.translate(X(x), Z(z)); c.rotate(rot); c.fillStyle = col; c.font = `${peso} ${tam * ppm}px Poppins, "Helvetica Neue", Arial, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(t, 0, 0); c.restore(); };
  let sem = 11; const azar = () => ((sem = (sem * 16807) % 2147483647) / 2147483647);

  // ── terreno ──
  c.fillStyle = '#DCE4D3'; c.fillRect(0, 0, W, H);
  rect(P.PATIO, antes ? '#BFC4CB' : '#C3C8CF');
  rect(P.CALLE_PUBLICA, '#AEB3BB'); rect({ x0: 112.2, x1: 113, z0: -20, z1: 70 }, '#D9DCE0'); rect({ x0: 121, x1: 122, z0: -20, z1: 70 }, '#D9DCE0');
  linea([[117, -20], [117, 70]], '#F4F4F2', .12, [3, 3]);
  rect({ x0: P.NAVE.x0 - .125, x1: P.NAVE.x1 + .125, z0: P.NAVE.z0 - .125, z1: P.NAVE.z1 + .125 }, antes ? PISO : PISO_D);
  rect({ x0: 29.4, x1: 44.875, z0: 4.875, z1: 55.125 }, PISO); rect({ x0: 57, x1: 97, z0: 55.125, z1: 64.4 }, PISO);
  rect({ x0: 44.6, x1: 45, z0: 5, z1: 55 }, PISO);
  // pisos propios de cada anexo: casino madera clara, camarines baldosa, taller y bodega epóxico gris
  rect(P.CASINO, '#D9C7A8'); rect(P.CAMAR, '#C9D2DA'); rect(P.TALLER, '#B9BDC2'); rect(P.BODEGA, '#C2C0BA'); rect(P.LIMPIO, '#BFC4CB');
  for (let x = P.CAMAR.x0; x < P.CAMAR.x1; x += .6) linea([[x, P.CAMAR.z0], [x, P.CAMAR.z1]], 'rgba(255,255,255,.35)', .02);
  for (let z = P.CAMAR.z0; z < P.CAMAR.z1; z += .6) linea([[P.CAMAR.x0, z], [P.CAMAR.x1, z]], 'rgba(255,255,255,.35)', .02);
  rect(P.RAMPA, '#BFC4CB');

  // ── manchas del concreto (en los dos, más marcadas antes) ──
  for (let i = 0; i < (antes ? 260 : 110); i++) {
    const x = P.NAVE.x0 + azar() * 65, z = P.NAVE.z0 + azar() * 50, r = (.4 + azar() * 1.8) * ppm;
    const g = c.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), r); g.addColorStop(0, `rgba(${antes ? '70,64,58' : '20,22,26'},${antes ? .12 : .1})`); g.addColorStop(1, 'rgba(90,80,70,0)'); c.fillStyle = g; c.fillRect(X(x) - r, Z(z) - r, 2 * r, 2 * r);
  }

  const calles = Object.values(P.CALLES);
  // huellas de neumáticos sobre los recorridos de las grúas (en los dos; después más suaves: el piso se mantiene)
  c.lineCap = 'round';
  for (const [pts, n] of [[[[63.5, 5], [63.5, 55]], 7], [[[65.6, 5], [65.6, 55]], 7], [[[45, 35], [101, 35]], 6], [[[68.75, 16.5], [96, 16.5]], 5], [[[99.5, 5], [99.5, 37]], 6], [[[88, 37], [88, 55]], 3], [[[56, 10], [61.25, 10]], 5]]) {
    for (let i = 0; i < n; i++) { const o = (azar() - .5) * 1.6; linea(pts.map(([x, z]) => (pts[0][0] === pts[1][0] ? [x + o, z] : [x, z + o])), `rgba(60,58,56,${(antes ? .05 : .025) + azar() * (antes ? .06 : .025)})`, .18 + azar() * .1); }
  }
  if (antes) {
    // la misma demarcación básica, pintada sobre su propia capa y luego gastada
    const capa = document.createElement('canvas'); capa.width = W; capa.height = H; const k = capa.getContext('2d');
    const guardado = c; pintarBasica(k);
    // desgaste: saltaduras, tramos perdidos y el roce de las ruedas sobre la pintura
    k.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 5200; i++) { const x = P.NAVE.x0 + azar() * 66, z = P.NAVE.z0 + azar() * 50, r = (.04 + azar() * azar() * .5) * ppm; k.globalAlpha = .5 + azar() * .5; k.beginPath(); k.ellipse(X(x), Z(z), r, r * (.4 + azar() * .8), azar() * 3, 0, 7); k.fill(); }
    for (let i = 0; i < 70; i++) { const x = P.NAVE.x0 + azar() * 66, z = P.NAVE.z0 + azar() * 50, w = (1 + azar() * 5) * ppm, h = (1 + azar() * 4) * ppm; k.globalAlpha = .75 + azar() * .25; k.fillRect(X(x) - w / 2, Z(z) - h / 2, w, h); }
    k.lineCap = 'round';
    for (const [pts] of [[[[63.5, 5], [63.5, 55]]], [[[65.6, 5], [65.6, 55]]], [[[45, 34.2], [101, 34.2]]], [[[45, 35.9], [101, 35.9]]], [[[68.75, 16.5], [96, 16.5]]], [[[99.5, 5], [99.5, 37]]], [[[98, 5], [98, 37]]], [[[101, 5], [101, 37]]]]) for (let j = 0; j < 4; j++) {
      const o = (azar() - .5) * 2.2; k.globalAlpha = .35 + azar() * .4; k.lineWidth = (.5 + azar() * .6) * ppm; k.beginPath(); k.moveTo(X(pts[0][0] + (pts[0][0] === pts[1][0] ? o : 0)), Z(pts[0][1] + (pts[0][0] === pts[1][0] ? 0 : o))); k.lineTo(X(pts[1][0] + (pts[0][0] === pts[1][0] ? o : 0)), Z(pts[1][1] + (pts[0][0] === pts[1][0] ? 0 : o))); k.stroke(); }
    k.globalCompositeOperation = 'source-over'; k.globalAlpha = 1;
    c.globalAlpha = .78; c.drawImage(capa, 0, 0); c.globalAlpha = 1; void guardado;
    // manchas de aceite y suciedad
    for (const [x, z, r] of [[64.3, 30.4, .9], [88.6, 46.2, .7], [100.2, 12.6, .8], [59, 8.4, .6], [83.8, 50, .5], [66.4, 17.2, .55], [98.6, 35.2, .7]]) { c.fillStyle = 'rgba(40,38,40,.24)'; c.beginPath(); c.ellipse(X(x), Z(z), r * ppm, r * .62 * ppm, .5, 0, 7); c.fill(); }
    // estacionamiento: líneas casi borradas
    for (let i = 0; i <= 9; i++) linea([[P.ESTAC.x0 + i * 2.6, P.ESTAC.z0], [P.ESTAC.x0 + i * 2.6, P.ESTAC.z0 + 5.2]], 'rgba(255,255,255,.35)', .1);
    return cv;
  }
  // la demarcación vieja: bordes y centro de calles, las cebras del plano y las dos líneas del sendero
  function pintarBasica(k) {
    const r2 = (r, col, m = 0) => { k.fillStyle = col; k.fillRect(X(r.x0 - m), Z(r.z0 - m), (r.x1 - r.x0 + 2 * m) * ppm, (r.z1 - r.z0 + 2 * m) * ppm); };
    const l2 = (pts, col, ancho = .1, dash) => { k.save(); k.strokeStyle = col; k.lineWidth = ancho * ppm; if (dash) k.setLineDash(dash.map((d) => d * ppm)); k.beginPath(); pts.forEach(([x, z], i) => (i ? k.lineTo(X(x), Z(z)) : k.moveTo(X(x), Z(z)))); k.stroke(); k.restore(); };
    for (const r of calles) r2(r, '#E2B21C', .1);
    for (const r of calles) { k.clearRect(X(r.x0), Z(r.z0), (r.x1 - r.x0) * ppm, (r.z1 - r.z0) * ppm); }
    k.clearRect(X(44.6), Z(32.8), .5 * ppm, 4.4 * ppm);
    for (const [c0, tramos, eje] of SEG) for (const [a, b] of tramos) l2(eje === 'z' ? [[c0, a + .4], [c0, b - .4]] : [[a + .4, c0], [b - .4, c0]], '#E2B21C', .1, [1.2, .9]);
    l2([[P.SENDERO.x0 + .05, 5], [P.SENDERO.x0 + .05, 55]], '#E2B21C', .1); l2([[P.SENDERO.x1 - .05, 5], [P.SENDERO.x1 - .05, 55]], '#E2B21C', .1);
    for (const [id, r] of Object.entries(P.CRUCES)) { if (id === 'Z7' || id === 'ZP') continue; const largo = r.paso === 'z' ? r.z1 - r.z0 : r.x1 - r.x0, n = impar(largo / FRANJA), pa = largo / n;
      for (let i = 0; i < n; i += 2) r.paso === 'z' ? r2({ x0: r.x0 + .12, x1: r.x1 - .12, z0: r.z0 + i * pa, z1: r.z0 + (i + 1) * pa }, '#E9C02A') : r2({ x0: r.x0 + i * pa, x1: r.x0 + (i + 1) * pa, z0: r.z0 + .12, z1: r.z1 - .12 }, '#E9C02A'); }
  }

  // ════════ después ════════
  // calles: borde amarillo solo donde la calle limita con algo que no es calle
  for (const r of calles) rect(r, AMA, .1);
  rect({ x0: 44.6, x1: 45.1, z0: 32.8, z1: 37.2 }, PISO);
  for (const r of calles) rect(r, CALLE);
  // líneas centrales segmentadas (doble sentido) y flechas
  for (const [c0, tramos, eje] of SEG) for (const [a, b] of tramos) linea(eje === 'z' ? [[c0, a + .4], [c0, b - .4]] : [[a + .4, c0], [b - .4, c0]], AMA, .1, [1.2, .9]);
  const flecha = (x, z, ang) => { c.save(); c.translate(X(x), Z(z)); c.rotate(ang); c.fillStyle = 'rgba(255,255,255,.95)'; const s = ppm; c.beginPath(); c.moveTo(1.2 * s, 0); c.lineTo(.3 * s, -.55 * s); c.lineTo(.3 * s, -.2 * s); c.lineTo(-1.1 * s, -.2 * s); c.lineTo(-1.1 * s, .2 * s); c.lineTo(.3 * s, .2 * s); c.lineTo(.3 * s, .55 * s); c.closePath(); c.fill(); c.restore(); };
  for (const z of [10, 29, 46]) { flecha(P.PISTA.Bs, z, Math.PI / 2); flecha(P.PISTA.Bn, z + 3, -Math.PI / 2); }
  for (const x of [55, 74, 92]) { flecha(x, P.PISTA.Ae, 0); flecha(x + 3, P.PISTA.Aw, Math.PI); }
  for (const z of [10, 30]) { flecha(P.PISTA.Ds, z, Math.PI / 2); flecha(P.PISTA.Dn, z + 2, -Math.PI / 2); }
  for (const x of [80, 91]) { flecha(x, P.PISTA.Ee, 0); flecha(x - 4, P.PISTA.Ew, Math.PI); }
  flecha(88, 46, Math.PI / 2);
  // sendero peatonal amarillo (cinta de alto tráfico) con huellas; se corta en los cruces proyectados
  const sendero = (x0, x1, z0, z1) => { rect({ x0, x1, z0, z1 }, AMA); for (let z = z0 + 1.6; z < z1 - 1; z += 5) huellas(c, X((x0 + x1) / 2), Z(z), ppm); };
  sendero(P.SENDERO.x0, P.SENDERO.x1, 5, 14.75); sendero(P.SENDERO.x0, P.SENDERO.x1, 18.25, 33); sendero(P.SENDERO.x0, P.SENDERO.x1, 37, 55);
  // cebras de cinta en los cruces simples; los inteligentes (Z2, Z3, Z6) los proyecta el techo
  for (const id of ['Z1', 'Z4', 'Z5', 'Z7']) { const r = P.CRUCES[id]; rect(r, CALLE); cebra(r); }
  for (const id of P.HOLO) { const r = P.CRUCES[id]; rect(r, CALLE); for (const s2 of [0, 1]) { const q = r.paso === 'z' ? { x0: r.x0, x1: r.x1, z0: s2 ? r.z1 - .08 : r.z0, z1: s2 ? r.z1 : r.z0 + .08 } : { x0: s2 ? r.x1 - .08 : r.x0, x1: s2 ? r.x1 : r.x0 + .08, z0: r.z0, z1: r.z1 }; rect(q, 'rgba(40,44,52,.35)'); } }
  function cebra(r) {
    const largo = r.paso === 'z' ? r.z1 - r.z0 : r.x1 - r.x0, n = impar(largo / FRANJA), paso = largo / n;
    for (let i = 0; i < n; i += 2) {
      if (r.paso === 'z') rect({ x0: r.x0 + .12, x1: r.x1 - .12, z0: r.z0 + i * paso, z1: r.z0 + (i + 1) * paso }, AMA);
      else rect({ x0: r.x0 + i * paso, x1: r.x0 + (i + 1) * paso, z0: r.z0 + .12, z1: r.z1 - .12 }, AMA);
    }
  }
  // franjas de advertencia en los vanos de portones (amarillo y negro)
  const peligro = (r) => { c.save(); c.beginPath(); c.rect(X(r.x0), Z(r.z0), (r.x1 - r.x0) * ppm, (r.z1 - r.z0) * ppm); c.clip(); rect(r, AMA); c.strokeStyle = '#22252B'; c.lineWidth = .22 * ppm; for (let t = -40; t < 40; t += .6) { c.beginPath(); c.moveTo(X(r.x0 + t), Z(r.z0)); c.lineTo(X(r.x0 + t + (r.z1 - r.z0)), Z(r.z1)); c.stroke(); } c.restore(); };
  peligro({ x0: 61.3, x1: 67.35, z0: 24.45, z1: 25.55 }); peligro({ x0: 96.05, x1: 102.95, z0: 24.45, z1: 25.55 });
  for (const a of P.ANDENES) peligro({ x0: a.x - 1.5, x1: a.x + 1.5, z0: 5.1, z1: 5.9 });
  peligro({ x0: 96.05, x1: 102.95, z0: 5.1, z1: 5.7 });
  // explanada del andén: guías de entrada y zona de maniobra
  for (const a of P.ANDENES) { linea([[a.x - 1.4, 6], [a.x - 1.4, 9.4]], BLANCO, .08); linea([[a.x + 1.4, 6], [a.x + 1.4, 9.4]], BLANCO, .08); }
  texto('ANDÉN 1', 60, 7.4, .5, TINTA); texto('ANDÉN 2', 64.45, 7.4, .5, TINTA);

  // pallets en espera: ubicaciones numeradas
  P.ESPERA.filas.forEach((z, i) => { const rot = i < 3 ? 'R' : 'D'; P.ESPERA.xs.forEach((x, j) => { borde({ x0: x - .58, x1: x + .58, z0: z - .68, z1: z + .68 }, i < 3 ? BLANCO : AMA, .07); });
    texto(`${rot}${(i % 3) + 1}`, 46.2, z, .42, TINTA, -Math.PI / 2); });
  texto('RECEPCIÓN', 51.2, 5.75, .5, TINTA); texto('DESPACHO', 51.2, 14.25, .45, TINTA);
  // pallets vacíos y oficina
  borde(P.PALLETS_VACIOS, BLANCO, .08); texto('PALLETS VACÍOS', 57.5, 20.1, .4, TINTA);
  borde({ x0: P.OFICINA_ANDEN.x0 - .4, x1: P.OFICINA_ANDEN.x1 + .4, z0: P.OFICINA_ANDEN.z0 - .4, z1: P.OFICINA_ANDEN.z1 + .4 }, AMA, .1);
  rect({ x0: 53.4, x1: 61.4, z0: 18.25, z1: 19.25 }, AMA); huellas(c, X(57.4), Z(18.75), ppm, Math.PI / 2);
  // racks: huella blanca, pasillos con su código y franja de protección
  for (const b of [P.BLOQUE_N, P.BLOQUE_S]) for (const [a, d] of P.FILAS_RACK) borde({ x0: a - .1, x1: d + .1, z0: b.z0 - .1, z1: b.z1 + .1 }, BLANCO, .08);
  P.PASILLOS_RACK.forEach((x, i) => { texto(`A${i + 1}`, x, 14.0, .6, TINTA); texto(`B${i + 1}`, x, 19.0, .6, TINTA); });
  texto('ALMACÉN A', 82, 5.5, .5, TINTA); texto('ALMACÉN B', 82, 24.6, .45, TINTA);
  // carga de baterías: bahías azules con su símbolo
  P.CARGA.bahias.forEach((z, i) => { borde({ x0: 103.6, x1: 109.4, z0: z - 1.55, z1: z + 1.55 }, AZUL, .1); rayo(c, X(108.4), Z(z), ppm); texto(`C${i + 1}`, 104.5, z, .5, AZUL, -Math.PI / 2); });
  texto('CARGA DE BATERÍAS', 106.5, 5.0 + .55, .4, AZUL);
  rect({ x0: 103.5, x1: 104.3, z0: 23.6, z1: 24.4 }, ROJO);
  // descanso y lean corner: zona peatonal
  for (const r of [P.DESCANSO, P.LEAN]) borde(r, AMA, .1);
  texto('DESCANSO', 49.5, 32.15, .45, TINTA); texto('LEAN CORNER', 57.5, 32.45, .38, TINTA);
  // kitting
  borde(P.KITTING, BLANCO, .08); texto('SUPERMERCADO · KITTING', 82.4, 32.15, .45, TINTA);
  for (let i = 0; i < 4; i++) borde({ x0: 89.4 + i * 1.5, x1: 90.7 + i * 1.5, z0: 30.6, z1: 32.2 }, AMA, .06);
  // punto de encuentro + tablero
  const pe = P.ENCUENTRO.punto; rect(pe, VERDE); borde({ x0: pe.x0 + .2, x1: pe.x1 - .2, z0: pe.z0 + .2, z1: pe.z1 - .2 }, BLANCO, .1);
  texto('PUNTO DE', (pe.x0 + pe.x1) / 2, pe.z0 + 1.6, .62, BLANCO, 0, 800); texto('ENCUENTRO', (pe.x0 + pe.x1) / 2, pe.z0 + 2.5, .62, BLANCO, 0, 800);
  for (let i = 0; i < 4; i++) peaton(c, X(pe.x0 + 1.3 + i * .85), Z(pe.z1 - 1.0), ppm * .75, BLANCO);
  borde({ x0: 77.4, x1: 85.2, z0: 38.2, z1: 43.2 }, BLANCO, .08); texto('REUNIÓN DE TURNO', 81.3, 43.65, .38, TINTA);
  // máquinas: perímetro amarillo y negro
  const perim = (x0, z0, x1, z1) => { const r = { x0, x1, z0, z1 }; c.save(); c.beginPath(); c.rect(X(x0), Z(z0), (x1 - x0) * ppm, (z1 - z0) * ppm); c.rect(X(x0 + .22), Z(z0 + .22), (x1 - x0 - .44) * ppm, (z1 - z0 - .44) * ppm); c.clip('evenodd'); peligro(r); c.restore(); };
  for (const [x, z, w, d] of MAQ) perim(x - w / 2, z - d / 2, x + w / 2, z + d / 2);
  texto('MAQUINARIA', 77.5, 54.25, .45, TINTA);
  // ensamble: puestos y pasillo
  for (const z of P.ENSAMBLE.lineas) { borde({ x0: 91.8, x1: 104.2, z0: z - .7, z1: z + 1.55 }, BLANCO, .07); for (const x of P.ENSAMBLE.xs) borde({ x0: x - .9, x1: x + .9, z0: z + .55, z1: z + 1.5 }, AMA, .06); }
  perim(105.4, 47.4, 109, 51.4);
  texto('ENSAMBLE', 98, 54.25, .45, TINTA);
  // producto terminado
  P.PT.filas.forEach((z, i) => { P.PT.xs.forEach((x) => borde({ x0: x - .55, x1: x + .55, z0: z - .66, z1: z + .66 }, AMA, .06)); texto(`PT${i + 1}`, 51.25, z, .36, TINTA); });
  perim(P.ENVOLVEDORA.x - 1.9, P.ENVOLVEDORA.z - 1.9, P.ENVOLVEDORA.x + 1.9, P.ENVOLVEDORA.z + 1.9);
  texto('PRODUCTO TERMINADO', 53, 54.25, .45, TINTA);
  // cámara de frío: zona azul frente a la puerta (adentro) y rótulo
  texto('CÁMARA DE FRÍO', 106.8, 36.2, .38, AZUL);
  // extintores: cuadros rojos al pie
  for (const [x, z] of EXT) rect({ x0: x - .4, x1: x + .4, z0: z - .4, z1: z + .4 }, ROJO);
  // anexos
  // anexos: sendero que sigue por el pasillo sur hasta casino y camarines; accesos de taller y bodega
  rect({ x0: 67.4, x1: 68.6, z0: 55.1, z1: 56.3 }, AMA); rect({ x0: 61.8, x1: 75.2, z0: 55.7, z1: 56.5 }, AMA);
  for (const x of [62.5, 74.5]) rect({ x0: x - .6, x1: x + .6, z0: 56.5, z1: 57.4 }, AMA);
  huellas(c, X(65), Z(56.1), ppm, Math.PI / 2); huellas(c, X(71), Z(56.1), ppm, -Math.PI / 2);
  peligro({ x0: 43.6, x1: 44.8, z0: 33.05, z1: 36.95 }); peligro({ x0: 43.6, x1: 44.8, z0: 48.1, z1: 51.1 });
  peligro({ x0: 53.6, x1: 54.5, z0: 38.0, z1: 39.1 });   // pie de la escalera de la oficina
  texto('BODEGA DE INSUMOS', 38.6, 45.8, .5, TINTA0);
  texto('TALLER', 37.8, 42.3, .5, TINTA0);
  texto('CASINO', 63.4, 63.4, .55, TINTA0); texto('CAMARINES', 74.6, 63.4, .55, TINTA0); texto('PUNTO LIMPIO', 89.5, 56.4, .5, TINTA0);

  // ── patio ──
  const PP = P.PISTA_PATIO;
  linea([[69.4, PP.z0], [112.2, PP.z0]], BLANCO, .12);
  for (const [a, b] of [[45, 57.8], [69.4, 95.4], [103.6, 112.2]]) linea([[a, PP.z1], [b, PP.z1]], BLANCO, .12);
  for (const x of [52, 76, 88, 108]) flecha(x, PP.c, Math.PI);
  for (const a of P.ANDENES) { linea([[a.x - 1.5, PP.z1], [a.x - 1.5, 4.8]], AMA, .12); linea([[a.x + 1.5, PP.z1], [a.x + 1.5, 4.8]], AMA, .12); }
  for (let i = 0; i <= 9; i++) linea([[P.ESTAC.x0 + i * 2.6, P.ESTAC.z0], [P.ESTAC.x0 + i * 2.6, P.ESTAC.z0 + 5.2]], BLANCO, .1);
  linea([[P.ESTAC.x0, P.ESTAC.z0], [P.ESTAC.x1, P.ESTAC.z0]], BLANCO, .1);
  // sendero del estacionamiento a la puerta norte, con cebra en la pista de camiones
  rect({ x0: 67.4, x1: 68.6, z0: -8.6, z1: -7.2 }, AMA); rect({ x0: 67.4, x1: 68.6, z0: -2.6, z1: 3.4 }, AMA); huellas(c, X(68), Z(.4), ppm);
  rect(P.CRUCES.ZP, '#C3C8CF'); cebra(P.CRUCES.ZP);
  // espera de conductores
  rect(P.ESPERA_CONDUCTORES, 'rgba(245,196,0,.25)'); borde(P.ESPERA_CONDUCTORES, AMA, .12);
  texto('ESPERA', 53.5, -.75, .42, TINTA0); texto('CONDUCTORES', 53.5, -.1, .34, TINTA0);
  // bahía de carga lateral y bajada de la rampa
  borde({ x0: 91.6, x1: 104.8, z0: -14.2, z1: -8.8 }, AMA, .12, [.6, .4]); texto('CARGA LATERAL', 98.2, -8.25, .42, TINTA0);
  peligro({ x0: 96.05, x1: 102.95, z0: -1.6, z1: -1.0 });
  return cv;
}

const SEG = [[64.45, [[5, 14.75], [18.25, 33], [37, 55]], 'z'], [99.5, [[5, 14.75], [18.25, 33]], 'z'], [16.5, [[68.75, 96]], 'x'], [35, [[45, 61.25], [68.75, 86.25], [89.75, 96]], 'x']];
// máquinas (x, z, ancho, fondo del perímetro) y extintores (x, z): los usa también la escena
export const MAQ = [[73, 47.4, 4.2, 2.4], [73, 51.8, 4.2, 2.4], [79.4, 47.4, 2.4, 2.4], [79.4, 51.8, 2.4, 2.4], [83.4, 49.6, 4.0, 4.0]];
export const EXT = [[69.6, 25.9], [45.8, 25.9], [109.4, 24.0], [90.8, 37.9], [61.0, 37.9], [96.4, 24.4], [69.1, 54.3]];

function peaton(c, x, y, s, col = 'rgba(255,255,255,.92)') {
  c.save(); c.fillStyle = col; c.beginPath(); c.arc(x, y - s * .42, s * .13, 0, 7); c.fill();
  c.fillRect(x - s * .1, y - s * .26, s * .2, s * .38); c.lineWidth = s * .09; c.strokeStyle = col; c.lineCap = 'round';
  c.beginPath(); c.moveTo(x - s * .05, y + .1 * s); c.lineTo(x - s * .16, y + s * .42); c.moveTo(x + s * .05, y + .1 * s); c.lineTo(x + s * .16, y + s * .42); c.moveTo(x - s * .1, y - s * .2); c.lineTo(x - s * .25, y + s * .05); c.moveTo(x + s * .1, y - s * .2); c.lineTo(x + s * .25, y + s * .05); c.stroke(); c.restore();
}
function rayo(c, x, y, s) { c.save(); c.fillStyle = '#056CF2'; c.beginPath(); c.moveTo(x + s * .15, y - s * .7); c.lineTo(x - s * .35, y + s * .1); c.lineTo(x - s * .02, y + s * .1); c.lineTo(x - s * .15, y + s * .7); c.lineTo(x + s * .35, y - s * .1); c.lineTo(x + s * .02, y - s * .1); c.closePath(); c.fill(); c.restore(); }
// par de huellas negras (forma «pie» de la cinta), mirando hacia +z o girado
function huellas(c, x, y, s, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = 'rgba(30,32,36,.85)';
  for (const [dx, dy] of [[-.17, -.2], [.17, .22]]) { c.beginPath(); c.ellipse(dx * s, dy * s, .1 * s, .2 * s, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(dx * s, (dy + .27) * s, .075 * s, .07 * s, 0, 0, 7); c.fill(); }
  c.restore();
}

export const impar = (x) => { const n = Math.max(3, Math.round(x)); return n % 2 ? n : n + 1; };   // cebras: siempre franja en los dos bordes
