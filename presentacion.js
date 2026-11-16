/* Neisstech × Lumina · presentación de feria. Motor: escenario 1920×1080 escalado, láminas con pasos, malla de puntos,
   clips de video por paso, dibujos en canvas (data-vis) y la planta 3D (escena/lumina5.js).
   Notas del presentador (N) y mapa (G), ocultos por defecto. ?apertura=pregunta|historia deja una sola apertura. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const escenario = $("#escenario");
  const apertura = new URLSearchParams(location.search).get("apertura");
  if (apertura) $$("[data-opcion]").forEach((l) => { if (l.dataset.opcion !== apertura) l.remove(); });
  const lams = $$(".lam");
  let i = 0, paso = 0, tLam = 0, tPaso = 0;

  /* ── Escala ── */
  function ajustar() { const e = Math.min(innerWidth / 1920, innerHeight / 1080); escenario.style.transform = `scale(${e}) translate(-50%, -50%)`; }
  addEventListener("resize", ajustar); ajustar();

  /* ── Láminas de video: un clip por paso, con barras tipo «historias» ── */
  lams.forEach((l) => {
    const vs = $$(".clips video", l); if (!vs.length) return;
    for (let n = 1; n < vs.length; n++) l.insertAdjacentHTML("beforeend", '<i data-paso class="norma__marca" hidden></i>');
    l.insertAdjacentHTML("beforeend", `<div class="historias">${vs.map(() => "<i></i>").join("")}</div>`);
  });
  // desafíos: cada tarjeta entra desde su borde y al final viaja al centro
  $$(".reto").forEach((el) => {
    const [dx, dy] = (el.dataset.desde || "0,0").split(",").map(Number);
    el.style.setProperty("--dx", dx); el.style.setProperty("--dy", dy);
    const x = parseFloat(el.style.getPropertyValue("--x")), y = parseFloat(el.style.getPropertyValue("--y"));
    el.style.setProperty("--hx", `${960 - (x + 230)}px`); el.style.setProperty("--hy", `${470 - (y + 80)}px`);
  });
  $$(".muro img").forEach((el, n) => el.style.setProperty("--n", (n * 7) % 26));

  /* ── Planta 3D: se carga al inicio en segundo plano; solo dibuja cuando una lámina la usa ── */
  let planta = null;
  const pedirPlanta = import("./escena/lumina5.js?v=40").then((m) => m.crear($("#planta3d"))).then((p) => { planta = p; sincronizar3d(); return planta; }).catch((e) => console.error("planta 3D:", e));
  function sincronizar3d() {
    const toma = lams[i].dataset.toma;
    escenario.classList.toggle("con3d", !!toma);
    if (!planta) return;
    if (toma) { planta.toma(toma, paso); planta.activo(true); } else planta.activo(false);
  }

  /* ── Malla de puntos: la sala. La fracción encendida la define cada lámina (data-malla).
        En el tema naranjo es la malla blanca de Lumina, con una luz que la recorre (como en la one-page). ── */
  const malla = $("#malla"), mc = malla.getContext("2d"); malla.width = 1920; malla.height = 1080;
  const PASO = 48, puntos = [];
  for (let y = PASO / 2; y < 1080; y += PASO) for (let x = PASO / 2; x < 1920; x += PASO) puntos.push({ x, y, u: Math.random(), d: Math.hypot(x - 960, y - 540) / 1100, k: 0, fase: Math.random() * 6.28 });
  let fraccion = 0, tCambio = 0, centrada = false, tema = "";
  function pintarMalla(t) {
    mc.clearRect(0, 0, 1920, 1080);
    if (tema !== "naranjo") return;   // v5: sin puntos de fondo (Max: «ya no hacen sentido»); solo la malla de Lumina en el naranjo
    {
      const s = t / 1000, lx = 960 + 620 * Math.sin(s * .17), ly = 540 + 300 * Math.sin(s * .21 + 1), R = 380;
      const g = mc.createRadialGradient(lx, ly, 0, lx, ly, R * 1.8); g.addColorStop(0, "rgba(255,255,255,.16)"); g.addColorStop(1, "rgba(255,255,255,0)");
      mc.fillStyle = g; mc.fillRect(0, 0, 1920, 1080);
      for (let y = 12; y < 1080; y += 24) for (let x = 12; x < 1920; x += 24) {
        const d = Math.hypot(x - lx, y - ly) / R, k = d < 1 ? Math.pow(1 - d, 1.6) : 0;
        mc.fillStyle = `rgba(255,255,255,${.16 + .7 * k})`; mc.beginPath(); mc.arc(x, y, 1.6 + 1.8 * k, 0, 6.3); mc.fill();
      }
      return;
    }
    const oscuro = tema === "lumina", dt = (t - tCambio) / 1000;
    for (const p of puntos) {
      const meta = p.u < fraccion && dt > p.d * .9 ? 1 : (p.u < fraccion ? p.k : 0);
      p.k += (meta - p.k) * .07;
      const el = Math.hypot((p.x - 960) / 900, (p.y - 540) / 330), claro = centrada ? Math.min(1, Math.max(.06, (el - .75) * 2.2)) : 1;   // se atenúan detrás del texto
      const resp = .5 + .5 * Math.sin(t / 900 + p.fase), a = (.1 + .05 * resp + p.k * (.7 + .3 * resp)) * claro;
      mc.fillStyle = p.k > .03 ? `rgba(${oscuro ? "236,109,39" : "5,108,242"},${a})` : `rgba(${oscuro ? "255,255,255" : "24,24,24"},${(.07 + .04 * resp) * claro})`;
      mc.beginPath(); mc.arc(p.x, p.y, 2.2 + p.k * 2.6, 0, 6.3); mc.fill();
    }
  }

  /* ── Navegación ── */
  const pasosDe = (l) => $$("[data-paso]", l);
  function mostrar(n, p = 0, alFinal = false) {
    i = Math.max(0, Math.min(lams.length - 1, n)); tLam = performance.now();
    const l = lams[i], ps = pasosDe(l); paso = alFinal ? ps.length : Math.min(p, ps.length);
    lams.forEach((x, j) => x.classList.toggle("activa", j === i));
    aplicarPaso();
    fraccion = parseFloat(l.dataset.malla || "0"); tCambio = performance.now(); centrada = l.classList.contains("lam--centro");
    tema = l.dataset.tema || ""; escenario.dataset.tema = tema;
    escenario.classList.toggle("sin-firma", l.hasAttribute("data-sin-firma"));
    contar(l); contarN(l);
    $("#avance").style.width = `${((i + 1) / lams.length) * 100}%`;
    $("#notas p").textContent = l.dataset.notas || "";
    $$(".mapa__lam").forEach((b, j) => b.classList.toggle("aqui", j === i));
    sincronizar3d();
  }
  function aplicarPaso() {
    const l = lams[i]; tPaso = performance.now();
    pasosDe(l).forEach((el, j) => { el.classList.toggle("dado", j < paso); el.classList.toggle("ultimo", j === paso - 1); });
    for (let n = 1; n <= 8; n++) l.classList.toggle(`p${n}`, paso >= n);
    if (planta && l.dataset.toma) planta.paso(paso);
    sincronizarVideos();
    history.replaceState(null, "", `${location.search}#${i + 1}${paso ? "." + paso : ""}`);
  }
  function avanzar() { if (paso < pasosDe(lams[i]).length) { paso++; aplicarPaso(); } else if (i < lams.length - 1) mostrar(i + 1); }
  function volver() { if (paso > 0) { paso--; aplicarPaso(); } else if (i > 0) mostrar(i - 1, 0, true); }

  function sincronizarVideos() {
    lams.forEach((l, j) => {
      const vs = $$(".clips video", l); if (!vs.length) return;
      if (j !== i) { vs.forEach((v) => { if (!v.paused) v.pause(); }); return; }
      const k = Math.min(paso, vs.length - 1);
      vs.forEach((v, n) => {
        const on = n === k;
        if (on && !v.classList.contains("ve")) { try { v.currentTime = 0; } catch (e) {} }
        v.classList.toggle("ve", on);
        if (on) v.play().catch(() => {}); else if (!v.paused) v.pause();
      });
      const pie = $(".pie", l), txt = vs[k].dataset.pie || "";
      if (pie.textContent !== txt) { if (pie.textContent) { pie.classList.add("cambia"); setTimeout(() => { pie.textContent = txt; pie.classList.remove("cambia"); }, 320); } else pie.textContent = txt; }
      $$(".historias i", l).forEach((b, n) => { b.classList.toggle("visto", n < k); if (n !== k) b.style.setProperty("--p", 0); });
    });
  }

  /* ── Mapa de la estructura (G) ── */
  const mapa = $("#mapa");
  (() => {
    const actos = new Set(lams.map((l) => l.dataset.acto));
    let html = `<h1>Neisstech × Lumina · estructura de la presentación</h1><p>${lams.length} láminas en ${actos.size} actos. Clic para ir. → avanzar · ← volver · N notas · F pantalla completa · G o Esc cierra. Una sola apertura: agregar ?apertura=pregunta o ?apertura=historia a la dirección.</p>`, acto = "";
    lams.forEach((l, j) => {
      if (l.dataset.acto !== acto) { if (acto) html += "</div>"; acto = l.dataset.acto; html += `<h2>${acto}</h2><div class="mapa__fila">`; }
      const est = l.dataset.estado ? `<em>${l.dataset.estado}</em>` : "";
      html += `<button class="mapa__lam" data-ir="${j}"><i>${String(j + 1).padStart(2, "0")}</i><strong>${l.dataset.titulo}</strong><span>${l.dataset.notas || ""}</span>${est}</button>`;
    });
    mapa.innerHTML = html + "</div>";
    mapa.addEventListener("click", (e) => { const b = e.target.closest("[data-ir]"); if (b) { mostrar(+b.dataset.ir); mapa.classList.remove("abierto"); } });
  })();

  /* ── Teclado, clic y control remoto (los punteros mandan PageDown / PageUp) ── */
  addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === "Escape") { mapa.classList.remove("abierto"); return; }
    if (k === "g" || k === "G") { mapa.classList.toggle("abierto"); return; }
    if (mapa.classList.contains("abierto")) return;
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k)) { e.preventDefault(); avanzar(); }
    else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); volver(); }
    else if (k === "Home") mostrar(0);
    else if (k === "End") mostrar(lams.length - 1);
    else if (k === "n" || k === "N") $("#notas").classList.toggle("abierta");
    else if (k === "f" || k === "F") (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()).catch(() => {});
  });
  escenario.addEventListener("click", (e) => (e.clientX < innerWidth * .2 ? volver() : avanzar()));
  // el cursor se esconde; vuelve solo mientras se mueve el mouse
  let cursorT = 0; addEventListener("mousemove", () => { document.body.classList.add("raton"); clearTimeout(cursorT); cursorT = setTimeout(() => document.body.classList.remove("raton"), 1500); });

  /* ── Pirámide de Bird: 1 · 10 · 30 · 600 puntos, una capa por paso. El lienzo parte 120 px antes que la lámina. ── */
  const pir = $(".piramide canvas"), pc = pir && pir.getContext("2d"), PS = 23, PX0 = 450, PY0 = 30, CORRE = 120, TOTAL = 641;
  const DOTS = [];
  if (pir) {
    for (let r = 0, n = 0; n < TOTAL; r++) {
      const enFila = Math.min(r + 1, TOTAL - n);   // la última fila, incompleta, va centrada
      for (let c = 0; c < enFila; c++, n++) DOTS.push({ x: PX0 + (c - (enFila - 1) / 2) * PS, y: PY0 + r * PS * .9, n, capa: n < 1 ? 0 : n < 11 ? 1 : n < 41 ? 2 : 3, k: 0 });
    }
    $$(".capa-pir", pir.parentNode).forEach((el) => { const f = parseFloat(el.dataset.fila); el.style.top = `${PY0 + f * PS * .9 - (el.classList.contains("capa-pir--600") ? 110 : 40)}px`; el.style.left = `${PX0 - CORRE + (f / 2) * PS + 70}px`; });
  }
  let pirVisto = 0;
  function pintarPiramide() {
    const meta = [0, 1, 11, 41, TOTAL][Math.min(paso, 4)]; pirVisto += (meta - pirVisto) * .06 + Math.sign(meta - pirVisto) * .4;
    pc.clearRect(0, 0, pir.width, pir.height);
    const COL = ["229,72,77", "24,24,24", "24,24,24", "24,24,24"], R = [11, 6.5, 5.5, 4.2];
    for (const d of DOTS) {
      d.k += ((d.n < pirVisto ? 1 : 0) - d.k) * .18; if (d.k < .01) continue;
      pc.fillStyle = `rgba(${COL[d.capa]},${[1, .85, .6, .38][d.capa] * d.k})`; pc.beginPath(); pc.arc(d.x, d.y, R[d.capa] * (.4 + .6 * d.k), 0, 6.3); pc.fill();
    }
  }

  /* ── Cifras que cuentan hasta su valor ── */
  function contar(l) {
    $$("[data-contar]", l).forEach((el) => {
      const fin = parseFloat(el.dataset.contar); let t0 = performance.now() + (el.closest("[data-paso]") ? 0 : 300);
      const paso1 = (ahora) => { const pp = el.closest("[data-paso]"); if (pp && !pp.classList.contains("dado")) { t0 = ahora; if (l.classList.contains("activa")) requestAnimationFrame(paso1); return; }
        const u = Math.min(1, Math.max(0, (ahora - t0) / 1600)), e = 1 - Math.pow(1 - u, 4); el.textContent = `${Math.round(fin * e) === 0 ? "0" : "−" + Math.abs(Math.round(fin * e))} %`; if (u < 1 && l.classList.contains("activa")) requestAnimationFrame(paso1); };
      requestAnimationFrame(paso1);
    });
  }
  function contarN(l) {
    $$("[data-contar-n]", l).forEach((el) => {
      const fin = parseFloat(el.dataset.contarN), dec = +(el.dataset.dec || 0), t0 = performance.now() + 250;
      const f = (ahora) => { const u = Math.min(1, Math.max(0, (ahora - t0) / 1800)), e = 1 - Math.pow(1 - u, 4);
        el.textContent = (fin * e).toLocaleString("es-CL", { minimumFractionDigits: dec, maximumFractionDigits: dec });
        if (u < 1 && l.classList.contains("activa")) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    });
  }

  /* ── Dibujos en canvas (data-vis): solo se pintan en la lámina activa.
        v6 · un solo lenguaje (estudiado de los reels de Dan Koe): todo se dibuja con puntos y líneas finas, esferas de
        partículas que giran, rótulos diminutos en mayúsculas, un solo acento por idea (rojo riesgo, azul Neisstech,
        naranjo Lumina), sin rellenos, sin sombras, sin tarjetas. ── */
  const azar = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const AZUL = "5,108,242", CARBON = "24,24,24", ROJO = "229,72,77", NAR = "236,109,39", GRIS = "108,108,108";
  const FIB = (n) => [...Array(n)].map((_, i) => { const y = 1 - (i + .5) / n * 2, r = Math.sqrt(1 - y * y), th = i * 2.399963; return [Math.cos(th) * r, y, Math.sin(th) * r]; });
  const P90 = FIB(90), P160 = FIB(160), P420 = FIB(420), P900 = FIB(900);
  // esfera de partículas que gira: los puntos de atrás son más chicos y tenues
  function esfera(c, x, y, R, pts, giro, rgb, a = 1, dot = 2.2) {
    if (R < .5 || a < .01) return; const ca = Math.cos(giro), sa = Math.sin(giro), cb = Math.cos(.4), sb = Math.sin(.4);
    for (const [px, py, pz] of pts) { const x1 = px * ca + pz * sa, z1 = -px * sa + pz * ca, y2 = py * cb - z1 * sb, k = (py * sb + z1 * cb + 1) / 2;
      c.fillStyle = `rgba(${rgb},${a * (.18 + .82 * k)})`; c.beginPath(); c.arc(x + x1 * R, y + y2 * R, dot * (.45 + .65 * k), 0, 6.3); c.fill(); }
  }
  function rotulo(c, x, y, txt, rgb = GRIS, a = 1, tam = 17, al = "center") {
    if (a < .01) return; c.save(); c.font = `600 ${tam}px Poppins`; c.textAlign = al; c.textBaseline = "top"; try { c.letterSpacing = `${tam * .24}px`; } catch (e) {}
    c.fillStyle = `rgba(${rgb},${a})`; c.fillText(txt.toUpperCase(), x + (al === "center" ? tam * .12 : 0), y); c.restore();
  }
  const punto = (c, x, y, r, rgb, a = 1) => { c.fillStyle = `rgba(${rgb},${a})`; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.fill(); };
  const aro = (c, x, y, r, rgb, a = 1, lw = 1.6) => { c.strokeStyle = `rgba(${rgb},${a})`; c.lineWidth = lw; c.beginPath(); c.arc(x, y, r, 0, 6.3); c.stroke(); };
  const ir = (v, meta, f = .08) => v + (meta - v) * f;
  const VIS = {
    // 5 de cada 10: diez esferas de partículas (una por persona); en el paso 1 la fila de arriba se vuelve roja
    diez: (() => { const k = new Float32Array(10), q = new Float32Array(10);
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); const s = w / 5;
        for (let n = 0; n < 10; n++) { const x = s / 2 + (n % 5) * s, y = 130 + Math.floor(n / 5) * 270;
          k[n] = ir(k[n], t > n * 90 + 300 ? 1 : 0, .1); q[n] = ir(q[n], paso >= 1 && n < 5 && performance.now() - tPaso > 250 + n * 260 ? 1 : 0, .1);
          const rgb = q[n] > .5 ? ROJO : CARBON; esfera(c, x, y, 64 * (.6 + .4 * k[n]), P160, t / 1400 + n * .7, rgb, k[n], 2.3); }
        const l = Math.min(1, Math.max(0, (performance.now() - tPaso - 1500) / 600)) * (paso >= 1 ? 1 : 0);
        rotulo(c, w / 2, 222, "Con un vehículo involucrado", ROJO, l); rotulo(c, w / 2, 492, "Otras causas", GRIS, l); }; })(),
    // 23,9 días: un punto por día; la línea es el promedio del país
    calendario: (c, t, w, h) => { c.clearRect(0, 0, w, h); const cel = w / 24, f = Math.min(23.9, Math.max(0, (t - 300) / 1000 * 13));
      for (let d = 0; d < 24; d++) { const x = d * cel + cel / 2, llen = Math.min(1, Math.max(0, f - d)); aro(c, x, 96, 15, CARBON, .2); if (llen > 0) punto(c, x, 96, 15 * llen, AZUL); }
      const xp = 18.5 * cel; c.strokeStyle = `rgba(${CARBON},.5)`; c.lineWidth = 1.5; c.beginPath(); c.moveTo(xp, 52); c.lineTo(xp, 140); c.stroke();
      rotulo(c, xp, 22, "Promedio del país · 18,5", CARBON, .7, 15); rotulo(c, cel / 2, 150, "Día 1", GRIS, .8, 14); rotulo(c, 23.5 * cel, 150, "Día 24", GRIS, .8, 14); },
    // iceberg: la línea del agua; arriba una esfera chica (lo que se ve), abajo una enorme (lo que no se ve)
    iceberg: (() => { let u = 0; return (c, t, w, h) => { c.clearRect(0, 0, w, h); u = ir(u, paso >= 1 ? 1 : 0, .04); const g = t / 1600;
      c.strokeStyle = `rgba(${CARBON},.45)`; c.lineWidth = 1.6; c.beginPath(); for (let x = 0; x <= w; x += 8) { const y = 430 + Math.sin(x / 90 + t / 900) * 4; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      esfera(c, 760, 330, 74, P160, g, CARBON, 1, 2.2); rotulo(c, 760, 228, "Lo que se ve", GRIS, 1);
      esfera(c, 760, 720, 270 * (.3 + .7 * u), P900, -g * .7, AZUL, u, 2.4); rotulo(c, 760, 1004, "Lo que no se ve", AZUL, u); }; })(),
    // rotación: cada punto es una persona; aros vacíos = recién llegados, puntos azules = con experiencia (y se van)
    rotacion: (() => { const r = azar(3), P = [...Array(100)].map(() => ({ edad: r() < .16 ? .45 + r() * .5 : r() * .25, s: 1, sale: false })); let prox = 0;
      return (c, t, w) => { c.clearRect(0, 0, w, w); const s = 78, o = (w - s * 10) / 2 + s / 2;
        if (t > prox) { prox = t + 130; for (let k = 0; k < 6; k++) { const p = P[Math.floor(r() * 100)]; if (!p.sale && (p.edad > .4 || r() < .35)) { p.sale = true; break; } } }
        P.forEach((p, n) => { if (p.sale) { p.s -= .07; if (p.s <= 0) { p.sale = false; p.s = .01; p.edad = 0; } } else { p.s = Math.min(1, p.s + .05); p.edad = Math.min(1, p.edad + .0011); }
          const x = o + (n % 10) * s, y = o + Math.floor(n / 10) * s - 30; if (p.edad < .4) aro(c, x, y, 12 * p.s, CARBON, .32); else punto(c, x, y, 12 * p.s, AZUL, .4 + .6 * p.edad); });
        aro(c, o - 10, w - 42, 9, CARBON, .4); rotulo(c, o + 8, w - 50, "Recién llegados", GRIS, 1, 15, "left");
        punto(c, o + 330, w - 42, 9, AZUL); rotulo(c, o + 348, w - 50, "Con experiencia", AZUL, 1, 15, "left"); }; })(),
    // cobertura: la planta entera dibujada en puntos; solo el aro (la mirada del supervisor) la ve completa
    cobertura: (() => { const img = new Image(); img.src = "recursos/planta-cenital.jpg"; let D = null; const r = azar(11), riesgos = [...Array(9)].map(() => ({ x: 90 + r() * 920, y: 90 + r() * 680, f: r() * 6 }));
      const muestrear = (w, h) => { const o = document.createElement("canvas"), P = 15; o.width = w; o.height = h; const x = o.getContext("2d", { willReadFrequently: true }), e = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        x.drawImage(img, (w - img.naturalWidth * e) / 2, (h - img.naturalHeight * e) / 2, img.naturalWidth * e, img.naturalHeight * e); const d = x.getImageData(0, 0, w, h).data; D = [];
        for (let yy = P / 2; yy < h; yy += P) for (let xx = P / 2; xx < w; xx += P) { const i = (Math.floor(yy) * w + Math.floor(xx)) * 4, l = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255; D.push([xx, yy, 1 + 3.4 * (1 - l)]); } };
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); if (!D && img.complete && img.naturalWidth) muestrear(w, h); const s = t / 1000, lx = w / 2 + w * .33 * Math.sin(s * .45), ly = h / 2 + h * .3 * Math.sin(s * .33 + 1), R = 150;
        if (D) for (const [x, y, rr] of D) { const dentro = Math.hypot(x - lx, y - ly) < R; punto(c, x, y, rr, CARBON, dentro ? .9 : .2); }
        riesgos.forEach((q) => { const p = .5 + .5 * Math.sin(s * 2 + q.f), dentro = Math.hypot(q.x - lx, q.y - ly) < R; punto(c, q.x, q.y, dentro ? 9 : 5 + 3 * p, ROJO, dentro ? 1 : .35 + .4 * p); if (dentro) aro(c, q.x, q.y, 18, ROJO, .8); });
        aro(c, lx, ly, R, CARBON, .7, 1.6); rotulo(c, lx, ly + R + 14, "Lo que ve el supervisor", CARBON, .8, 15); }; })(),
    // cultura: un prevencionista (azul) para casi 200 personas; los pasos suman rotación, gente nueva y demarcación gastada
    cultura: (() => { const r = azar(5), C = 20, F = 10, G = [...Array(C * F)].map(() => ({ s: 1, sale: false, nuevo: r() < .3 })), PV = 87; let prox = 0;
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); const sx = w / C, sy = 56, oy = 70;
        if (paso >= 3) { c.lineWidth = 2; c.strokeStyle = `rgba(${CARBON},.3)`; for (const y of [oy - 36, oy + F * sy - 10]) for (let x = 0; x < w; x += 38) { if (Math.sin(x * 7.13 + y) > .35) continue; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18, y); c.stroke(); } }
        if (paso >= 1 && t > prox) { prox = t + 70; const q = G[Math.floor(r() * G.length)]; if (q !== G[PV] && !q.sale) q.sale = true; }
        G.forEach((q, n) => { if (q.sale) { q.s -= .09; if (q.s <= 0) { q.sale = false; q.s = .01; q.nuevo = true; } } else q.s = Math.min(1, q.s + .06);
          if (n === PV) return; const x = sx / 2 + (n % C) * sx, y = oy + Math.floor(n / C) * sy, nuevo = paso >= 2 ? q.nuevo || n % 9 !== 0 : q.nuevo;
          if (nuevo) aro(c, x, y, 7 * q.s, CARBON, .3, 1.4); else punto(c, x, y, 7 * q.s, CARBON, .75); });
        const x = sx / 2 + (PV % C) * sx, y = oy + Math.floor(PV / C) * sy, pul = (t / 1400) % 1;
        aro(c, x, y, 14 + pul * 40, AZUL, 1 - pul, 1.6); punto(c, x, y, 11, AZUL); rotulo(c, x, y + 26, "1 prevencionista", AZUL, 1, 15); }; })(),
    // balanza: Lumina (naranjo) es el pivote; seguridad (azul) pesa y la privacidad (naranjo) la equilibra
    balanza: (() => { let ang = -.12, v = 0, rb = 30; return (c, t, w, h) => { c.clearRect(0, 0, w, h); const meta = paso >= 1 ? 0 : -.12; v += (meta - ang) * .02; v *= .9; ang += v; rb = ir(rb, paso >= 1 ? 130 : 34, .06);
      const cx = w / 2, cy = 400, L = 560, dx = Math.cos(ang) * L, dy = Math.sin(ang) * L, nx = Math.sin(ang), ny = -Math.cos(ang), g = t / 1500;
      c.strokeStyle = `rgba(${CARBON},.8)`; c.lineWidth = 2.5; c.beginPath(); c.moveTo(cx - dx, cy - dy); c.lineTo(cx + dx, cy + dy); c.stroke();
      c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx - 60, cy + 150); c.lineTo(cx + 60, cy + 150); c.closePath(); c.stroke();
      esfera(c, cx, cy, 30, P90, g * 1.4, NAR, 1, 2);
      const A = [cx - dx, cy - dy], B = [cx + dx, cy + dy];
      esfera(c, A[0] + nx * 136, A[1] + ny * 136, 130, P420, g, AZUL, 1, 2.4); esfera(c, B[0] + nx * (rb + 6), B[1] + ny * (rb + 6), rb, rb < 70 ? P90 : P420, -g, NAR, paso >= 1 ? 1 : .5, 2.4);
      rotulo(c, A[0], A[1] + 26, "Seguridad", AZUL, 1, 18); rotulo(c, A[0], A[1] + 60, "DS 594 · ISO 45001 · BSI PAS 13 · OSHA 1910.178", GRIS, 1, 14);
      rotulo(c, B[0], B[1] + 26, "Privacidad", NAR, 1, 18); rotulo(c, B[0], B[1] + 60, "Ley 21.719 · Dictámenes DT · Rostros pixelados", GRIS, paso >= 1 ? 1 : .35, 14);
      rotulo(c, cx, cy + 172, "Lumina", NAR, 1, 15); }; })(),
    // el ciclo: cinco soluciones de Neisstech (azul) conectadas a Lumina (naranjo)
    ciclo: (() => { const N = [["Gestión visual", 430, 330], ["Gestión de tráfico", 1490, 330], ["Barreras y andenes", 360, 790], ["Flujo e intralogística", 1560, 790], ["IA Cam", 960, 900]]; let u = 0;
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); u = ir(u, paso >= 1 ? 1 : 0, .05); const g = t / 1500, cx = 960, cy = 560;
        N.forEach(([txt, x, y], i) => { const a = Math.min(1, Math.max(0, (t - 300 - i * 140) / 500));
          c.strokeStyle = u > .02 ? `rgba(${NAR},${.15 + .5 * u})` : `rgba(${CARBON},.12)`; c.lineWidth = 1.5; c.setLineDash([2, 10]); c.beginPath(); c.moveTo(x, y); c.lineTo(cx, cy); c.stroke(); c.setLineDash([]);
          if (u > .3) for (let k = 0; k < 3; k++) { const f = ((t / 1600) + k / 3 + i * .13) % 1; punto(c, x + (cx - x) * f, y + (cy - y) * f, 3.5, NAR, u * Math.sin(f * Math.PI)); }
          esfera(c, x, y, 52, P160, g + i, AZUL, a, 2); rotulo(c, x, y + 70, txt, CARBON, a * .85, 16); });
        esfera(c, cx, cy, 130 * u, P420, -g, NAR, u, 2.4); rotulo(c, cx, cy + 150, "Lumina", NAR, u, 18); }; })(),
  };
  function pintarVis(t) {
    $$(".vis", lams[i]).forEach((cv) => { const f = VIS[cv.dataset.vis]; if (f) f(cv.getContext("2d"), t - tLam, cv.width, cv.height); });
  }

  /* ── Bucle ── */
  function cuadro(t) {
    if (!document.hidden) {
      if (!escenario.classList.contains("con3d")) pintarMalla(t);
      if (pir && pir.closest(".lam").classList.contains("activa")) pintarPiramide();
      pintarVis(t);
      const vs = $$(".clips video.ve", lams[i]);   // barra de la historia en curso
      if (vs.length) { const v = vs[0], b = $$(".historias i", lams[i])[$$(".clips video", lams[i]).indexOf(v)]; if (b && v.duration) b.style.setProperty("--p", v.currentTime / v.duration); }
    }
    requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);

  const [h0, h1] = location.hash.slice(1).split(".");   // #7 o #7.2 (lámina.paso)
  mostrar((parseInt(h0, 10) || 1) - 1, parseInt(h1, 10) || 0);
  window.PRES = { ir: (n, p) => mostrar(n - 1, p || 0), avanzar, volver, planta: () => pedirPlanta, n: lams.length };   // para QA
})();
