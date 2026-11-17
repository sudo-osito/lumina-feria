/* Neisstech · FILCE 2026. Motor: escenario 1920×1080 escalado, láminas con pasos, clips de video por paso, dibujos en
   canvas (data-vis), la planta 3D de Neisstech (escena/lumina5.js) y la historia de Don Salva (historia/historia.js).
   Las láminas con data-guion (02 y 22) recorren varias tomas de la historia, una por paso.
   Notas del presentador (N) y mapa (G), ocultos por defecto. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const escenario = $("#escenario");
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
  // láminas con guion: un paso por toma de la historia (marcadores ocultos para contar los pasos)
  lams.forEach((l) => { if (!l.dataset.guion) return; l._guion = JSON.parse(l.dataset.guion); for (let n = 1; n < l._guion.length; n++) l.insertAdjacentHTML("beforeend", '<i data-paso class="norma__marca" hidden></i>'); });
  const tomaHist = (l, p) => (l._guion ? l._guion[Math.min(p, l._guion.length - 1)] : [l.dataset.escena, p]);
  // video que todavía no llega (Pucargo): la lámina muestra el aviso en vez de un cuadro negro
  $$(".clips video").forEach((v) => v.addEventListener("error", () => v.closest(".lam").classList.add("sin-video")));
  /* ── Planta 3D: se carga al inicio en segundo plano; solo dibuja cuando una lámina la usa ── */
  let planta = null;
  const pedirPlanta = import("./escena/lumina5.js?v=42").then((m) => m.crear($("#planta3d"))).then((p) => { planta = p; sincronizar3d(); return planta; }).catch((e) => console.error("planta 3D:", e));
  // La historia de Don Salva: otra escena 3D, con cámara de cine (historia/historia.js); una toma por paso
  let historia = null;
  const pedirHistoria = import("./historia/historia.js?v=6").then((m) => m.crear($("#historia3d"))).then((h) => { historia = h; sincronizar3d(); return h; }).catch((e) => console.error("historia 3D:", e));
  function sincronizar3d() {
    const esc = lams[i].dataset.escena;
    escenario.classList.toggle("conhistoria", !!esc);
    if (historia) { if (esc) { historia.ir(...tomaHist(lams[i], paso)); historia.activo(true); } else historia.activo(false); }
    const toma = lams[i].dataset.toma;
    escenario.classList.toggle("con3d", !!toma);
    if (!planta) return;
    if (toma) { planta.toma(toma, paso); planta.activo(true); } else planta.activo(false);
  }

  let tema = "";
  /* ── Navegación ── */
  const pasosDe = (l) => $$("[data-paso]", l);
  function mostrar(n, p = 0, alFinal = false) {
    i = Math.max(0, Math.min(lams.length - 1, n)); tLam = performance.now();
    const l = lams[i], ps = pasosDe(l); paso = alFinal ? ps.length : Math.min(p, ps.length);
    lams.forEach((x, j) => x.classList.toggle("activa", j === i));
    aplicarPaso();
    tema = l.dataset.tema || ""; escenario.dataset.tema = tema;
    escenario.classList.toggle("sin-firma", l.hasAttribute("data-sin-firma"));
    contar(l); contarN(l);
    $("#avance").style.width = `${((i + 1) / lams.length) * 100}%`;
    $("#numero").innerHTML = `<b>${String(i + 1).padStart(2, "0")}</b> / ${lams.length}`;

    $$(".mapa__lam").forEach((b, j) => b.classList.toggle("aqui", j === i));
    sincronizar3d();
  }
  function aplicarPaso() {
    const l = lams[i]; tPaso = performance.now();
    pasosDe(l).forEach((el, j) => { el.classList.toggle("dado", j < paso); el.classList.toggle("ultimo", j === paso - 1); });
    for (let n = 1; n <= 8; n++) l.classList.toggle(`p${n}`, paso >= n);
    if (planta && l.dataset.toma) planta.paso(paso);
    if (historia && l.dataset.escena) historia.ir(...tomaHist(l, paso));
    // guion: se ve solo el texto del paso actual; algunos pasos van en negro (data-guion[2])
    const g = l._guion && l._guion[paso], oscuro = l.classList.contains("lam--video") || tema === "naranjo" || (g && g[2]);
    if (l._guion) { $$("[data-h]", l).forEach((el) => el.classList.toggle("ve", +el.dataset.h === paso)); l.classList.toggle("oscura", !!(g && g[2])); }
    escenario.classList.toggle("fondo-oscuro", !!oscuro);
    const nota = l._guion && $(`[data-h="${paso}"]`, l); $("#notas p").textContent = (nota && nota.dataset.n) || l.dataset.notas || "";
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
    // 05 · 154 personas fallecidas: 76 con vehículo (azul) y 15 de ellas dentro de la faena (rojo)
    fatales: (() => { const N = 154, k = new Float32Array(N), q = new Float32Array(N), rr = new Float32Array(N);
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); const C = 14, s = 56, ox = (w - (C - 1) * s) / 2, oy = 40, ahora = performance.now() - tPaso;
        for (let n = 0; n < N; n++) { const x = ox + (n % C) * s, y = oy + Math.floor(n / C) * s * .92;
          k[n] = ir(k[n], t > n * 9 + 200 ? 1 : 0, .12); q[n] = ir(q[n], paso >= 1 && n < 76 && (paso > 1 || ahora > n * 14) ? 1 : 0, .1); rr[n] = ir(rr[n], paso >= 2 && n < 15 && ahora > 200 + n * 60 ? 1 : 0, .1);
          const rgb = rr[n] > .5 ? ROJO : q[n] > .5 ? AZUL : CARBON, a = (rr[n] > .5 || q[n] > .5 ? 1 : paso >= 1 ? .22 : .7) * k[n];
          punto(c, x, y, 12 * (.5 + .5 * k[n]) * (rr[n] > .5 ? 1.15 : 1), rgb, a); } }; })(),
    // 06 · iceberg: la línea del agua; arriba una esfera chica (lo que se ve), abajo una enorme (lo que no se ve)
    iceberg: (() => { let u = 0; return (c, t, w, h) => { c.clearRect(0, 0, w, h); u = ir(u, paso >= 1 ? 1 : 0, .04); const g = t / 1600;
      c.strokeStyle = `rgba(${CARBON},.45)`; c.lineWidth = 1.6; c.beginPath(); for (let x = 0; x <= w; x += 8) { const y = 430 + Math.sin(x / 90 + t / 900) * 4; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      esfera(c, 760, 330, 74, P160, g, CARBON, 1, 2.2);
      esfera(c, 760, 720, 270 * (.3 + .7 * u), P900, -g * .7, AZUL, u, 2.4); }; })(),
    // 07 · los cuatro desafíos, cada uno con su dibujo chico
    d1: (c, t, w, h) => { c.clearRect(0, 0, w, h); const s = t / 1000, px = w * (.5 + .42 * Math.sin(s * .9)), fy = h * (.5 + .4 * Math.sin(s * .7 + 1.3)), fx = w * .5;
      for (let x = 20; x < w; x += 22) punto(c, x, h / 2, 2.6, CARBON, .2); for (let y = 14; y < h; y += 22) punto(c, fx, y, 2.6, CARBON, .2);
      for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) punto(c, fx - 30 + a * 20, fy - 20 + b * 20, 7.5, CARBON, .85);
      const cerca = Math.hypot(px - fx, h / 2 - fy) < 90; punto(c, px, h / 2, 13, cerca ? ROJO : AZUL); if (cerca) aro(c, (px + fx) / 2, (h / 2 + fy) / 2, 70, ROJO, .8, 2.4); },
    d2: (c, t, w, h) => { c.clearRect(0, 0, w, h); const s = t / 1000, lx = w / 2 + w * .32 * Math.sin(s * .6), ly = h / 2 + h * .25 * Math.sin(s * .45 + 1), R = 70;
      for (let y = 30; y < h; y += 30) for (let x = 30; x < w; x += 30) punto(c, x, y, 3.2, CARBON, Math.hypot(x - lx, y - ly) < R ? .9 : .16);
      [[90, 70], [470, 90], [140, 240], [400, 230]].forEach(([x, y], n) => { const dentro = Math.hypot(x - lx, y - ly) < R; punto(c, x, y, 7, ROJO, dentro ? 1 : .3 + .3 * Math.sin(s * 3 + n)); });
      aro(c, lx, ly, R, AZUL, .8, 2); },
    d3: (c, t, w, h) => { c.clearRect(0, 0, w, h); const s = t / 1000, y = h / 2;
      const forma = (n, x, sz, a) => { c.strokeStyle = `rgba(${CARBON},${a})`; c.lineWidth = 3; c.beginPath();
        if (n === 0) { c.moveTo(x, y - sz); c.lineTo(x + sz, y + sz * .8); c.lineTo(x - sz, y + sz * .8); c.closePath(); }
        else if (n === 1) c.arc(x, y, sz, 0, 6.3); else if (n === 2) { c.moveTo(x, y - sz); c.lineTo(x + sz, y); c.lineTo(x, y + sz); c.lineTo(x - sz, y); c.closePath(); } else c.rect(x - sz, y - sz * .75, sz * 2, sz * 1.5); c.stroke(); };
      [0, 1, 2, 3, 0].forEach((n, i) => forma(n, 70 + i * 105, 26 + 10 * Math.sin(s + i * 1.7) + (i % 2) * 8, .35 + .4 * (i % 3) / 2)); },
    d4: (() => { const r = azar(9), P = [...Array(72)].map(() => ({ s: 1, sale: false, nuevo: r() < .5 })); let prox = 0;
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); if (t > prox) { prox = t + 140; const p = P[Math.floor(r() * P.length)]; if (!p.sale) p.sale = true; }
        P.forEach((p, n) => { if (p.sale) { p.s -= .08; if (p.s <= 0) { p.sale = false; p.s = .01; p.nuevo = true; } } else p.s = Math.min(1, p.s + .05);
          const x = 40 + (n % 12) * 44, y = 40 + Math.floor(n / 12) * 44; if (p.nuevo) aro(c, x, y, 9 * p.s, CARBON, .35, 1.6); else punto(c, x, y, 9 * p.s, AZUL, .9); }); }; })(),
    // 09 · 10 · 13 · 16 · los tres pilares; data-pilar destaca uno (0 = los tres)
    pilares: (() => { const L = [["Personas y prácticas", "Gestión visual", "Capacitación · procedimientos · inducción", AZUL], ["Ingeniería", "Gestión de tráfico", "Intervenir el entorno y las tareas", AZUL], ["Analítica y respuesta", "Lúmina", "Datos · medidas · respuestas", NAR]];
      return (c, t, w, h, cv) => { c.clearRect(0, 0, w, h); const sel = +(cv.dataset.pilar || 0), s = t / 1000, X = [w * .22, w * .5, w * .78], top = 90, base = 470;
        for (let x = X[0] - 260; x <= X[2] + 260; x += 18) { punto(c, x, top - 26, 2.6, CARBON, .45); punto(c, x, top - 6, 2.6, CARBON, .3); punto(c, x, base + 18, 2.6, CARBON, .45); punto(c, x, base + 38, 2.6, CARBON, .3); }
        L.forEach(([capa, sol, det, rgb], k) => { const on = sel === 0 || sel === k + 1, x0 = X[k], a = on ? 1 : .18, entra = Math.min(1, Math.max(0, (t - 200 - k * 180) / 900));
          for (let col = -3; col <= 3; col++) for (let row = 0; row < 14; row++) { const y = base - row * 26, vis = row / 14 < entra; if (!vis) continue;
            const puls = on && sel ? .6 + .4 * Math.sin(s * 2.4 - row * .35 + col) : 1; punto(c, x0 + col * 22, y, (col === -3 || col === 3 ? 3.8 : 3.1) * (on && sel ? 1.12 : 1), on ? rgb : CARBON, a * (.55 + .45 * puls)); }
          rotulo(c, x0, base + 66, capa, on ? rgb : GRIS, on ? 1 : .45, 17);
          c.save(); c.font = `500 ${sel === k + 1 ? 52 : 44}px Poppins`; c.textAlign = "center"; c.textBaseline = "top"; c.fillStyle = `rgba(${on ? (k === 2 ? NAR : CARBON) : CARBON},${on ? 1 : .3})`; c.fillText(sol, x0, base + 104); c.restore();
          c.save(); c.font = "400 22px Poppins"; c.textAlign = "center"; c.textBaseline = "top"; c.fillStyle = `rgba(${GRIS},${on ? .95 : .35})`; c.fillText(det, x0, base + 176); c.restore(); }); }; })(),
    // 19 · infraestructura: cámaras → procesamiento → respuesta y dashboard
    infra: (() => { const N = [["Cámaras", "Existentes o nuevas, según compatibilidad", 300, 300, CARBON], ["Procesamiento de imágenes", "Detecta eventos de riesgo", 860, 300, NAR], ["Dispositivos de respuesta", "Semáforos · puertas · balizas · avisos", 1480, 130, AZUL], ["Dashboard", "Eventos, horarios y tendencias", 1480, 440, NAR]];
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); const g = t / 1500;
        [[0, 1], [1, 2], [1, 3]].forEach(([a, b], k) => { const A = N[a], B = N[b], al = Math.min(1, Math.max(0, (t - 600 - k * 250) / 600));
          c.strokeStyle = `rgba(${CARBON},${.25 * al})`; c.lineWidth = 1.6; c.setLineDash([2, 10]); c.beginPath(); c.moveTo(A[2] + 90, A[3]); c.lineTo(B[2] - 90, B[3]); c.stroke(); c.setLineDash([]);
          for (let j = 0; j < 3; j++) { const f = ((t / 1800) + j / 3 + k * .2) % 1; punto(c, A[2] + 90 + (B[2] - 90 - A[2] - 90) * f, A[3] + (B[3] - A[3]) * f, 4, B[4], al * Math.sin(f * Math.PI)); } });
        N.forEach(([tit, sub, x, y, rgb], k) => { const a = Math.min(1, Math.max(0, (t - 150 - k * 200) / 600)); esfera(c, x, y, 84, P420, g + k, rgb, a, 2.2);
          rotulo(c, x, y + 106, tit, rgb === CARBON ? CARBON : rgb, a, 20); c.save(); c.font = "400 25px Poppins"; c.textAlign = "center"; c.textBaseline = "top"; c.fillStyle = `rgba(${GRIS},${a})`; c.fillText(sub, x, y + 142); c.restore(); }); }; })(),
    // 20 · analítica (ilustrativa, sin datos reales): dónde, a qué hora y con qué frecuencia se repiten los eventos
    analitica: (() => { const r = azar(21), focos = [[150, 150, 1], [330, 300, .7], [420, 120, .45]], pts = [...Array(140)].map(() => { const f = focos[Math.floor(r() * 3)]; return [f[0] + (r() - .5) * 120 * f[2], f[1] + (r() - .5) * 100 * f[2], f[2]]; });
      const hora = [...Array(24)].map((_, hh) => Math.round(1 + 6 * Math.exp(-((hh - 8.5) ** 2) / 3) + 4 * Math.exp(-((hh - 17) ** 2) / 4) + r() * 1.2)), dias = [...Array(35)].map((_, d) => (d % 7 === 0 || d % 7 === 4) && r() < .85 ? 1 : r() < .12 ? .5 : 0);
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); const a = (k) => Math.min(1, Math.max(0, (t - 200 - k * 300) / 700));
        // dónde
        c.save(); c.translate(0, 40); c.strokeStyle = `rgba(${CARBON},${.3 * a(0)})`; c.setLineDash([2, 8]); c.lineWidth = 1.6; c.strokeRect(20, 20, 500, 380); c.setLineDash([]);
        pts.forEach(([x, y, k], n) => { if (n / pts.length < a(0)) punto(c, x, y, 3 + 2 * k, NAR, .25 + .55 * k); }); rotulo(c, 270, 420, "Dónde se repite", NAR, a(0), 16); c.restore();
        // cuándo
        c.save(); c.translate(600, 40); hora.forEach((v, hh) => { for (let j = 0; j < v; j++) if (j / 8 < a(1)) punto(c, 20 + hh * 20.5, 390 - j * 26, 6, hh >= 7 && hh <= 9 || hh >= 16 && hh <= 18 ? NAR : CARBON, hh >= 7 && hh <= 9 || hh >= 16 && hh <= 18 ? .9 : .3); });
        rotulo(c, 250, 420, "A qué hora", NAR, a(1), 16); c.restore();
        // cada cuánto
        c.save(); c.translate(1180, 40); dias.forEach((v, d) => { const x = 40 + (d % 7) * 66, y = 60 + Math.floor(d / 7) * 72; if (v && a(2) > d / 35) punto(c, x, y, 13 * (v > .6 ? 1 : .6), NAR, v > .6 ? .9 : .4); else aro(c, x, y, 13, CARBON, .2 * a(2), 1.4); });
        rotulo(c, 240, 420, "Con qué frecuencia", NAR, a(2), 16); c.restore(); }; })(),
  };
  function pintarVis(t) {
    $$(".vis", lams[i]).forEach((cv) => { const f = VIS[cv.dataset.vis]; if (f) f(cv.getContext("2d"), t - tLam, cv.width, cv.height, cv); });
  }

  /* ── Bucle ── */
  function cuadro(t) {
    if (!document.hidden) {
      pintarVis(t);
      const vs = $$(".clips video.ve", lams[i]);   // barra de la historia en curso
      if (vs.length) { const v = vs[0], b = $$(".historias i", lams[i])[$$(".clips video", lams[i]).indexOf(v)]; if (b && v.duration) b.style.setProperty("--p", v.currentTime / v.duration); }
    }
    requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);

  const [h0, h1] = location.hash.slice(1).split(".");   // #7 o #7.2 (lámina.paso)
  mostrar((parseInt(h0, 10) || 1) - 1, parseInt(h1, 10) || 0);
  window.PRES = { ir: (n, p) => mostrar(n - 1, p || 0), avanzar, volver, planta: () => pedirPlanta, historia: () => pedirHistoria, n: lams.length };   // para QA
})();
