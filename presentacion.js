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
  const pedirHistoria = import("./historia/historia.js?v=21").then((m) => m.crear($("#historia3d"))).then((h) => { historia = h; sincronizar3d(); return h; }).catch((e) => console.error("historia 3D:", e));
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
  // Lúmina: las láminas data-lu muestran la one-page de Lúmina tal cual (un solo iframe en modo lámina); cada avance la mueve como el scroll
  const LU_URL = /^(127\.0\.0\.1|localhost)$/.test(location.hostname) ? "http://127.0.0.1:4412/?lamina" : "https://sudo-osito.github.io/lumina-onepage/?lamina";
  let luAntes = null, luMsj = null;
  function luMover(l) {
    const fr = document.getElementById("luweb"); if (!fr) return;
    if (!fr.getAttribute("src") && lams.slice(Math.max(0, i - 3), i + 3).some((x) => x.dataset.lu)) fr.src = LU_URL;   // se carga un par de láminas antes
    const id = l.dataset.lu; escenario.classList.toggle("conlu", !!id); if (!id) { luAntes = null; return; }
    const us = (l.dataset.luU || "").split(",").filter(Boolean).map(Number), u = us.length ? us[Math.min(paso, us.length - 1)] : null;
    luMsj = { lamina: id, u, salto: luAntes !== id }; luAntes = id;
    try { fr.contentWindow.postMessage(luMsj, "*"); } catch (e) {}
  }
  addEventListener("message", (e) => { if (e.data && e.data.luminaLista && luMsj) { const fr = document.getElementById("luweb"); fr.contentWindow.postMessage({ ...luMsj, salto: true }, "*"); } });
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
    // videos: se cargan los de esta lámina y los de la siguiente (no todos a la vez: en la feria la red manda)
    for (const l2 of [lams[i], lams[i + 1]]) if (l2) $$(".clips video", l2).forEach((v) => { if (v.preload !== "auto") { v.preload = "auto"; try { v.load(); } catch (e) {} } });
    sincronizar3d();
  }
  function aplicarPaso() {
    const l = lams[i]; tPaso = performance.now();
    luMover(l);
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
      if (pie && pie.textContent !== txt) { if (pie.textContent) { pie.classList.add("cambia"); setTimeout(() => { pie.textContent = txt; pie.classList.remove("cambia"); }, 320); } else pie.textContent = txt; }
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
  // una persona y una grúa horquilla dibujadas solo con puntos (para los dibujos chicos)
  function persona(c, x, y, k, rgb, a, pixel) {
    const hy = y - 64 * k, hr = 19 * k;
    if (pixel) { const tonos = ["168,150,138", "140,124,114", "190,172,160", "120,108,100"], q = 9.5 * k; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { c.fillStyle = `rgba(${tonos[(i * 3 + j * 5) % 4]},${a + .3})`; c.fillRect(x - 2 * q + i * q, hy - 2 * q + j * q, q - 1, q - 1); } }
    else for (let i = -3; i <= 3; i++) for (let j = -3; j <= 3; j++) { const dx = i * 6.4 * k, dy = j * 6.4 * k; if (dx * dx + dy * dy <= hr * hr) punto(c, x + dx, hy + dy, 2.5 * k, rgb, a); }
    for (let r = 0; r < 9; r++) { const yy = y - 36 * k + r * 8.4 * k, wd = (24 - r * .9) * k; for (let xx = -wd; xx <= wd + .1; xx += 8.4 * k) punto(c, x + xx, yy, 2.5 * k, rgb, a); }
    for (const sx of [-9, 9]) for (let r = 0; r < 7; r++) punto(c, x + sx * k, y + 42 * k + r * 8.4 * k, 2.5 * k, rgb, a);
  }
  function grua(c, x, y, rgb, a) {
    for (let i = 0; i < 9; i++) for (let j = 0; j < 6; j++) { const borde = i === 0 || i === 8 || j === 0 || j === 5; punto(c, x - 62 + i * 9, y - 36 + j * 9, borde ? 2.8 : 2.2, rgb, a * (borde ? 1 : .35)); }
    for (let yy = y - 92; yy <= y + 10; yy += 9) { punto(c, x + 20, yy, 2.8, rgb, a); punto(c, x + 29, yy, 2.8, rgb, a); }
    for (let xx = x + 38; xx <= x + 80; xx += 9) punto(c, xx, y + 12, 2.8, rgb, a);
    for (let xx = x - 52; xx <= x + 4; xx += 9) punto(c, xx, y - 80, 2.6, rgb, a); for (let yy = y - 71; yy < y - 36; yy += 9) { punto(c, x - 52, yy, 2.4, rgb, a); punto(c, x + 4, yy, 2.4, rgb, a); }
    for (const wx of [x - 44, x + 2]) aro(c, wx, y + 30, 13, rgb, a, 3);
  }
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
    // 09 · 10 · 13 · 16 · los tres pilares como torres de partículas que giran; data-pilar enciende uno (0 = los tres)
    pilares: (() => { const L = [["Personas y prácticas", "Gestión visual", "Capacitación · procedimientos · inducción", AZUL], ["Ingeniería", "Gestión de tráfico", "Intervenir el entorno y las tareas", AZUL], ["Analítica y respuesta", "Lúmina", "Datos · medidas · respuestas", NAR]];
      const FIL = 19, ANG = 28;
      return (c, t, w, h, cv) => { c.clearRect(0, 0, w, h); const sel = +(cv.dataset.pilar || 0), s = t / 1000, X = [w * .2, w * .5, w * .8], base = 470, alto = 380, R = 96;
        // el suelo común: una línea de puntos que une las tres capas
        for (let x = X[0] - 200; x <= X[2] + 200; x += 16) punto(c, x, base + 40, 2.2, CARBON, .28);
        L.forEach(([capa, sol, det, rgb], k) => { const on = sel === 0 || sel === k + 1, foco = sel === k + 1, a = on ? 1 : .3, entra = Math.min(1, Math.max(0, (t - 200 - k * 200) / 1100)), x0 = X[k], col = on ? rgb : CARBON;
          for (let j = 0; j < 44; j++) { const th = j / 44 * 6.283 + s * .25 * (k % 2 ? -1 : 1), z = Math.sin(th); punto(c, x0 + Math.cos(th) * R * 1.75, base + 14 + z * R * .34, 1.6 + 1.4 * (z + 1) / 2, col, a * (.2 + .35 * (z + 1) / 2)); }
          const giro = s * (foco ? .8 : .3) + k * 2;
          for (let row = 0; row < FIL; row++) { let fy = row / (FIL - 1); if (foco) fy = ((row + s * 1.4) % FIL) / (FIL - 1); if (fy > entra) continue;
            const yy = base - fy * alto, fade = foco ? Math.min(1, (1 - fy) * 4) * Math.min(1, fy * 8 + .2) : 1;
            for (let j = 0; j < ANG; j++) { const th = j / ANG * 6.283 + giro + row * .19, z = Math.sin(th), d = (z + 1) / 2;
              punto(c, x0 + Math.cos(th) * R, yy + z * R * .3, (foco ? 3.1 : 2.6) * (.45 + .7 * d), col, a * fade * (.15 + .85 * d)); } }
          if (foco) esfera(c, x0, base - alto - 46, 30, P160, s * .9, rgb, Math.min(1, entra * 1.3), 1.7);
          rotulo(c, x0, base + 72, capa, on ? rgb : GRIS, on ? 1 : .45, 17);
          c.save(); c.font = `500 ${foco ? 54 : 44}px Poppins`; c.textAlign = "center"; c.textBaseline = "top"; c.fillStyle = `rgba(${on ? (k === 2 ? NAR : CARBON) : CARBON},${on ? 1 : .3})`; c.fillText(sol, x0, base + 108); c.restore();
          c.save(); c.font = "400 22px Poppins"; c.textAlign = "center"; c.textBaseline = "top"; c.fillStyle = `rgba(${GRIS},${on ? .95 : .35})`; c.fillText(det, x0, base + 178); c.restore(); }); }; })(),
    // 19 · infraestructura: cámaras → procesamiento → respuesta y dashboard
    infra: (() => { const N = [["Cámaras", "Existentes o nuevas, según compatibilidad", 290, 360, CARBON], ["Procesamiento de imágenes", "Detecta eventos de riesgo", 860, 360, NAR], ["Dispositivos de respuesta", "Semáforos · puertas · balizas · avisos", 1460, 190, AZUL], ["Dashboard", "Eventos, horarios y tendencias", 1460, 560, NAR]];
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); const g = t / 1500;
        [[0, 1], [1, 2], [1, 3]].forEach(([a, b], k) => { const A = N[a], B = N[b], al = Math.min(1, Math.max(0, (t - 600 - k * 250) / 600));
          c.strokeStyle = `rgba(${CARBON},${.25 * al})`; c.lineWidth = 1.6; c.setLineDash([2, 10]); c.beginPath(); c.moveTo(A[2] + 110, A[3]); c.lineTo(B[2] - 110, B[3]); c.stroke(); c.setLineDash([]);
          for (let j = 0; j < 7; j++) { const f = ((t / 2200) + j / 7 + k * .2) % 1; punto(c, A[2] + 110 + (B[2] - 110 - A[2] - 110) * f, A[3] + (B[3] - A[3]) * f, 3 + 2.5 * Math.sin(f * Math.PI), B[4], al * Math.sin(f * Math.PI)); } });
        N.forEach(([tit, sub, x, y, rgb], k) => { const a = Math.min(1, Math.max(0, (t - 150 - k * 200) / 600)); esfera(c, x, y, 96, P900, g + k, rgb, a, 1.9); aro(c, x, y, 118 + 4 * Math.sin(t / 700 + k), rgb, .18 * a, 1.4);
          rotulo(c, x, y - 160, "0" + (k + 1), rgb, a * .9, 15); rotulo(c, x, y + 128, tit, rgb === CARBON ? CARBON : rgb, a, 20); c.save(); c.font = "400 25px Poppins"; c.textAlign = "center"; c.textBaseline = "top"; c.fillStyle = `rgba(${GRIS},${a})`; c.fillText(sub, x, y + 164); c.restore(); }); }; })(),
    // 20 · analítica (ilustrativa, sin datos reales): dónde, a qué hora y con qué frecuencia se repiten los eventos
    analitica: (() => { const r = azar(21), focos = [[150, 150, 1], [330, 300, .7], [420, 120, .45]], pts = [...Array(140)].map(() => { const f = focos[Math.floor(r() * 3)]; return [f[0] + (r() - .5) * 120 * f[2], f[1] + (r() - .5) * 100 * f[2], f[2]]; });
      const hora = [...Array(24)].map((_, hh) => Math.round(1 + 6 * Math.exp(-((hh - 8.5) ** 2) / 3) + 4 * Math.exp(-((hh - 17) ** 2) / 4) + r() * 1.2)), dias = [...Array(35)].map((_, d) => (d % 7 === 0 || d % 7 === 4) && r() < .85 ? 1 : r() < .12 ? .5 : 0);
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); const a = (k) => Math.min(1, Math.max(0, (t - 200 - k * 300) / 700));
        // dónde
        c.save(); c.translate(0, 40); c.strokeStyle = `rgba(${CARBON},${.3 * a(0)})`; c.setLineDash([2, 8]); c.lineWidth = 1.6; c.strokeRect(20, 20, 500, 380); c.setLineDash([]);
        for (let k = 0; k < 6; k++) for (let y = 70; y < 360; y += 12) if (y < 190 || y > 230) punto(c, 90 + k * 70, y, 1.6, CARBON, .22 * a(0));
        pts.forEach(([x, y, k], n) => { if (n / pts.length < a(0)) punto(c, x, y, 3 + 2 * k, NAR, .25 + .55 * k); }); rotulo(c, 270, 444, "Dónde se repite", NAR, a(0), 16); c.restore();
        // cuándo
        c.save(); c.translate(600, 40); hora.forEach((v, hh) => { for (let j = 0; j < v; j++) if (j / 8 < a(1)) punto(c, 20 + hh * 20.5, 390 - j * 26, 6, hh >= 7 && hh <= 9 || hh >= 16 && hh <= 18 ? NAR : CARBON, hh >= 7 && hh <= 9 || hh >= 16 && hh <= 18 ? .9 : .3); });
        [0, 6, 12, 18].forEach((hh) => { c.font = "500 15px Poppins"; c.textAlign = "center"; c.fillStyle = `rgba(${GRIS},${.8 * a(1)})`; c.fillText(String(hh).padStart(2, "0") + ":00", 20 + hh * 20.5, 412); });
        rotulo(c, 250, 444, "A qué hora", NAR, a(1), 16); c.restore();
        // cada cuánto
        c.save(); c.translate(1180, 40); dias.forEach((v, d) => { const x = 40 + (d % 7) * 66, y = 60 + Math.floor(d / 7) * 72; if (v && a(2) > d / 35) punto(c, x, y, 13 * (v > .6 ? 1 : .6), NAR, v > .6 ? .9 : .4); else aro(c, x, y, 13, CARBON, .2 * a(2), 1.4); });
        "LMMJVSD".split("").forEach((d, k) => { c.font = "600 15px Poppins"; c.textAlign = "center"; c.fillStyle = `rgba(${GRIS},${.8 * a(2)})`; c.fillText(d, 40 + k * 66, 22); });
        rotulo(c, 240, 444, "Con qué frecuencia", NAR, a(2), 16); c.restore(); }; })(),
    // 04 · accidentabilidad 2024 (SUSESO): industria manufacturera y transporte en columnas de 8 puntos (un punto = 0,1 por cada 100 personas), la línea del promedio (2,5)
    //      y el número grande: 3 de cada 100. AVANZAR → la torta de puntos con la forma del accidente (143.199 accidentes del trabajo 2024).
    accid: (() => { const C = [["Industria manufacturera", 3.5], ["Transporte", 3.1, 1]], cl = (v) => Math.min(1, Math.max(0, v));
      const F = [["Caídas de personas", .345, AZUL, 1], ["Golpes por o contra objetos", .072, AZUL, .72], ["Atrapamientos o amputaciones", .047, AZUL, .52], ["Accidentes con vehículos", .047, AZUL, .36], ["Otras formas", .489, CARBON, .14]];
      const anillo = []; for (let r = 150; r <= 262; r += 16) { const n = Math.round(2 * Math.PI * r / 17); for (let k = 0; k < n; k++) anillo.push([r, k / n]); }
      let u = 0; return (c, t, w, h) => { c.clearRect(0, 0, w, h); u = ir(u, paso >= 1 ? 1 : 0, .07); const v = 1 - u, ahora = performance.now() - tPaso;
        if (v > .01) {   // columnas
          const s = 34, base = 520, xs = [250, 600];
          rotulo(c, 0, 4, "Accidentes con días perdidos por cada 100 personas · un punto = 0,1", GRIS, v * cl(t / 800), 15, "left");
          const yp = base - 25 / 8 * s; c.strokeStyle = `rgba(${CARBON},${.45 * v})`; c.lineWidth = 2; c.setLineDash([3, 8]); c.beginPath(); c.moveTo(40, yp); c.lineTo(780, yp); c.stroke(); c.setLineDash([]);
          c.save(); c.font = "600 22px Poppins"; c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = `rgba(${CARBON},${.8 * v * cl((t - 900) / 500)})`; c.fillText("Promedio del país · 2,5", 796, yp); c.restore();
          C.forEach(([nom, val, top], j) => { const n = Math.round(val * 10), rgb = top ? AZUL : CARBON, cx = xs[j];
            for (let i = 0; i < n; i++) { const k = cl((t - 250 - j * 300 - i * 20) / 260); if (k <= 0) break; punto(c, cx + ((i % 8) - 3.5) * s, base - s / 2 - Math.floor(i / 8) * s, 10.5 * (.4 + .6 * k), rgb, v * k * (top ? 1 : .5)); }
            c.save(); c.textAlign = "center"; c.font = `${top ? 600 : 500} ${top ? 54 : 44}px Poppins`; c.fillStyle = `rgba(${rgb},${v * cl((t - 450 - j * 300 - n * 20) / 400)})`; c.fillText(String(val).replace(".", ","), cx, base - Math.ceil(n / 8) * s - 24);
            c.font = `${top ? 600 : 400} 24px Poppins`; c.textBaseline = "top"; c.fillStyle = `rgba(${rgb},${v * (top ? 1 : .75)})`; c.fillText(nom, cx, base + 22); c.restore(); });
          // el número grande
          const k = cl((t - 1500) / 700) * v; c.save(); c.textAlign = "left"; c.fillStyle = `rgba(${AZUL},${k})`; c.font = "600 250px Poppins"; c.textBaseline = "alphabetic"; c.fillText("3", 1110, 330);
          c.font = "500 64px Poppins"; c.fillText("de cada 100", 1272, 322); c.fillStyle = `rgba(${CARBON},${k * .85})`; c.font = "400 34px Poppins";
          c.fillText("personas en transporte tuvieron", 1116, 400); c.fillText("un accidente con días perdidos", 1116, 446); c.fillText("en un año.", 1116, 492); c.restore();
        }
        if (u > .01) {   // la torta de puntos
          const cx = 420, cy = 330, sw = cl((ahora - 200) / 1600);
          rotulo(c, 0, 4, "Forma del accidente · accidentes del trabajo 2024", GRIS, u, 15, "left");
          for (const [r, f] of anillo) { if (f > sw) continue; let a0 = 0, seg = F[F.length - 1]; for (const x of F) { if (f < a0 + x[1]) { seg = x; break; } a0 += x[1]; }
            const th = -Math.PI / 2 + f * 2 * Math.PI; punto(c, cx + Math.cos(th) * r, cy + Math.sin(th) * r, 5.2, seg[2], u * seg[3]); }
          c.save(); c.textAlign = "center"; c.fillStyle = `rgba(${CARBON},${u})`; c.font = "600 52px Poppins"; c.fillText("143.199", cx, cy + 6); c.font = "400 22px Poppins"; c.fillStyle = `rgba(${GRIS},${u})`; c.fillText("accidentes del trabajo", cx, cy + 40); c.restore();
          const k = cl((ahora - 1200) / 600) * u; c.save(); c.textAlign = "left"; c.fillStyle = `rgba(${AZUL},${k})`; c.font = "600 150px Poppins"; c.fillText("1 de cada 2", 820, 210);
          c.fillStyle = `rgba(${CARBON},${k * .85})`; c.font = "400 30px Poppins"; c.fillText("accidentes fue una caída, un golpe,", 826, 268); c.fillText("un atrapamiento o un accidente con vehículos.", 826, 308);
          F.forEach(([nom, p, rgb, a], i) => { const y = 390 + i * 46, kk = cl((ahora - 1600 - i * 150) / 400) * u; punto(c, 838, y - 8, 10, rgb, a * kk); c.font = `${i < 4 ? 500 : 400} 26px Poppins`; c.fillStyle = `rgba(${CARBON},${kk * (i < 4 ? .9 : .55)})`; c.fillText(nom, 866, y); c.textAlign = "right"; c.fillText(`${Math.round(p * 100)} %`, 1500, y); c.textAlign = "left"; });
          c.restore(); }
      }; })(),
    // 05 · un día cualquiera de 2024: cerca de 390 accidentes del trabajo (un punto = una persona); 4 de ellos, graves
    dia: (() => { const N = 390, C = 26, k = new Float32Array(N), az = new Float32Array(N), rj = new Float32Array(N), graves = [57, 140, 233, 318];
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); const s = 31, ox = (w - (C - 1) * s) / 2, oy = 70, ahora = performance.now() - tPaso;
        rotulo(c, w / 2, 26, paso >= 1 ? "Un día cualquiera · un punto = una persona" : "2024 · accidentes en la industria", GRIS, Math.min(1, t / 800), 15);
        for (let n = 0; n < N; n++) { const x = ox + (n % C) * s, y = oy + Math.floor(n / C) * s;
          k[n] = ir(k[n], t > 200 + n * 4 ? 1 : 0, .12); az[n] = ir(az[n], paso >= 1 && ahora > n * 3 ? 1 : 0, .1); const g = graves.includes(n); rj[n] = ir(rj[n], paso >= 2 && g ? 1 : 0, .1);
          const rgb = rj[n] > .5 ? ROJO : az[n] > .5 ? AZUL : CARBON, a = (paso >= 2 ? (g ? 1 : .18) : az[n] > .5 ? .9 : .45) * k[n];
          punto(c, x, y, (6.4 + (g ? 6 * rj[n] : 0)) * (.5 + .5 * k[n]), rgb, a); if (rj[n] > .5) aro(c, x, y, 18 + 4 * Math.sin(t / 260), ROJO, .35 * rj[n], 2); } }; })(),
    // 06 · iceberg ordenado: arriba lo que se ve (esfera chica); bajo la línea, lo que no se ve (esfera grande)
    iceberg2: (() => { let u = 0; return (c, t, w, h) => { c.clearRect(0, 0, w, h); u = ir(u, paso >= 1 ? 1 : 0, .04); const g = t / 1600, yw = 520, cx = w / 2;
      c.strokeStyle = `rgba(${AZUL},.45)`; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= w; x += 8) { const y = yw + Math.sin(x / 110 + t / 900) * 5; x ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke();
      esfera(c, cx, 345, 100, P160, g, AZUL, 1, 2.6);
      esfera(c, cx, 800, 235 * (.3 + .7 * u), P900, -g * .7, ROJO, u, 2.4); }; })(),
    // 08 · 10 · 12 · la pirámide de controles: partículas que suben por la pirámide (de lo menos a lo más efectivo); la franja del pilar activo brilla. Cuenta los porcentajes.
    embudo: (() => { const r = azar(31), P = [...Array(260)].map(() => ({ x: r(), y: r(), v: .4 + r() * .8, z: r() })); let on = [0, 0, 0], cuenta = 0;
      return (c, t, w, h, cv) => { c.clearRect(0, 0, w, h); const lam = cv.closest(".lam"), n = +lam.dataset.pilar, act = n === 0 ? (paso >= 1 ? 1 : 0) : n, cx = 390 + 410, bandas = [[0, 190], [204, 394], [408, 598]];
        const ancho = (y) => 280 + (y / 598) * 540;   // pirámide: ancho a la altura y (280 arriba, 820 abajo)
        const COL = [AZUL, AZUL, AZUL];   // franja 0 = Lúmina (arriba), 1 = tráfico, 2 = gestión visual (abajo)
        const activo = (b) => act === 0 || (act === 1 && b === 2) || (act === 2 && b === 1) || (act === 3 && b === 0);
        for (let b = 0; b < 3; b++) on[b] = ir(on[b], activo(b) ? 1 : 0, .06);
        for (const p of P) { p.y -= p.v * .0016 * (1 + p.z); if (p.y < 0) { p.y = 1; p.x = r(); } const y = p.y * 598, b = y < 197 ? 0 : y < 401 ? 1 : 2, W = ancho(y) - 30, x = cx + (p.x - .5) * W;
          const a = (.12 + .55 * on[b]) * (.4 + .6 * p.z), rr = (1.6 + 2.6 * p.z) * (.7 + .5 * on[b]); punto(c, x, y, rr, COL[b], a); }
        for (let b = 0; b < 3; b++) { if (on[b] < .02) continue; const [y0, y1] = bandas[b], wt = ancho(y0), wb = ancho(y1); c.strokeStyle = `rgba(${COL[b]},${.5 * on[b]})`; c.lineWidth = 3; c.beginPath(); c.moveTo(cx - wt / 2, y0); c.lineTo(cx + wt / 2, y0); c.lineTo(cx + wb / 2, y1); c.lineTo(cx - wb / 2, y1); c.closePath(); c.stroke(); }
        // los porcentajes cuentan hasta su valor la primera vez
        cuenta = Math.min(1.6, cuenta + .012); lam.querySelectorAll(".emb__pct[data-v]").forEach((el) => { const v = +el.dataset.v, f = +el.closest(".emb__f").className.match(/--(\d)/)[1], q = Math.min(1, Math.max(0, cuenta - (f - 1) * .3)), e = 1 - Math.pow(1 - q, 3); el.firstChild.nodeValue = String(Math.round(v * e)); });
      }; })(),
    // 17 · analítica (ilustrativa): dónde · a qué hora · con qué frecuencia · qué decidir
    a1: (() => { const r = azar(5), F = [[150, 110], [380, 180], [300, 80]], pts = [...Array(90)].map(() => { const f = F[Math.floor(r() * 3)]; return [f[0] + (r() - .5) * 70, f[1] + (r() - .5) * 50, r()]; });
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); for (let x = 60; x < w - 40; x += 60) for (let y = 30; y < h - 30; y += 12) punto(c, x, y, 1.4, CARBON, .2);
        pts.forEach(([x, y, k], i) => { const a = Math.min(1, Math.max(0, (t - i * 18) / 400)); punto(c, x, y, 4 + 1.4 * Math.sin(t / 400 + k * 6), NAR, a * (.45 + .45 * k)); }); }; })(),
    a2: (c, t, w, h) => { c.clearRect(0, 0, w, h); const H = [1, 1, 1, 0, 0, 1, 2, 6, 8, 5, 3, 2, 2, 2, 3, 6, 7, 5, 3, 2, 1, 1, 1, 1], s = (w - 80) / 23;
      H.forEach((v, i) => { for (let k = 0; k < v; k++) { const a = Math.min(1, Math.max(0, (t - i * 40 - k * 60) / 300)); punto(c, 40 + i * s, h - 50 - k * 22, 6.5, v >= 5 ? NAR : CARBON, a * (v >= 5 ? 1 : .35)); } });
      ["00", "06", "12", "18"].forEach((l, i) => rotulo(c, 40 + i * 6 * s, h - 16, l, GRIS, .8, 14)); },
    a3: (c, t, w, h) => { c.clearRect(0, 0, w, h); const D = "LMMJVSD", S = [[1, 0, 1, 0, 1, 0, 0], [1, 0, 0, 1, 1, 0, 0], [0, 0, 1, 0, 1, 0, 0], [0, 0, 0, 0, 1, 0, 0]], sx = (w - 120) / 6;
      [...D].forEach((d, i) => rotulo(c, 60 + i * sx, 24, d, GRIS, .8, 14));
      S.forEach((fila, k) => { rotulo(c, 20, 66 + k * 56, `S${k + 1}`, GRIS, .6, 12, "left"); fila.forEach((v, i) => { const x = 60 + i * sx, y = 62 + k * 56, a = Math.min(1, Math.max(0, (t - (k * 7 + i) * 50) / 300)); v ? punto(c, x, y, 13, NAR, a) : aro(c, x, y, 12, CARBON, .25 * a, 1.5); }); }); },
    a4: (c, t, w, h) => { c.clearRect(0, 0, w, h); const u = (t / 1000) % 7, cx = 290, cy = 150, puesto = Math.min(1, Math.max(0, (u - 2.2) / .8)), baja = Math.min(1, Math.max(0, (u - 3.4) / 1.6));
      for (let x = 60; x < w - 40; x += 60) for (let y = 30; y < h - 30; y += 12) punto(c, x, y, 1.4, CARBON, .2);
      const r = azar(9); for (let i = 0; i < 40; i++) { const x = cx + (r() - .5) * 120, y = cy + (r() - .5) * 80, a = Math.min(1, u / 1.4) * (1 - .85 * baja * (i % 5 ? 1 : .4)); punto(c, x, y, 4.2, NAR, a * .8); }
      if (puesto > 0) { c.save(); c.globalAlpha = puesto; c.fillStyle = `rgba(${AZUL},.9)`; for (let k = 0; k < 6; k++) c.fillRect(cx - 70 + k * 25, cy - 30, 12, 60); c.restore();
        rotulo(c, cx, cy + 62, "Nuevo cruce", AZUL, puesto, 15); } },
    // 08 · jerarquía de controles: cinco bandas de puntos, de la más efectiva (arriba) a la menos; la ingeniería, encendida
    jerarquia: (() => { const N = ["Eliminación", "Sustitución", "Controles de ingeniería", "Controles administrativos", "EPP"];
      return (c, t, w, h) => { c.clearRect(0, 0, w, h); const ahora = performance.now() - tPaso, cx = w / 2 + 40, H = 92, G = 16, y0 = 70;
        rotulo(c, 30, 14, "Jerarquía de controles", GRIS, Math.min(1, ahora / 600), 15, "left");
        // flecha de efectividad, a la izquierda
        for (let y = y0 + 10; y < y0 + 5 * (H + G) - 20; y += 14) punto(c, 40, y, 2.2, CARBON, .3); c.fillStyle = `rgba(${CARBON},.45)`; c.beginPath(); c.moveTo(40, y0 - 8); c.lineTo(32, y0 + 8); c.lineTo(48, y0 + 8); c.fill();
        c.save(); c.translate(70, y0 + 2.5 * (H + G)); c.rotate(-Math.PI / 2); c.font = "500 15px Poppins"; c.textAlign = "center"; c.fillStyle = `rgba(${GRIS},.85)`; try { c.letterSpacing = "3px"; } catch (e) {} c.fillText("MÁS EFECTIVO", 0, 0); c.restore();
        N.forEach((nom, k) => { const e = Math.min(1, Math.max(0, (ahora - 150 - k * 160) / 500)), ing = k === 2, W = 600 - k * 92, y = y0 + k * (H + G), rgb = ing ? AZUL : CARBON, a = e * (ing ? 1 : .55);
          const puls = ing ? 1 + .25 * Math.max(0, Math.sin(t / 380)) : 1;
          for (let x = cx - W / 2; x <= cx + W / 2 + .1; x += 15) { punto(c, x, y, (ing ? 3.2 : 2.5) * puls, rgb, a); punto(c, x, y + H, (ing ? 3.2 : 2.5) * puls, rgb, a); }
          for (let yy = y + 15; yy < y + H - 6; yy += 15) { punto(c, cx - W / 2, yy, ing ? 3.2 : 2.5, rgb, a); punto(c, cx + W / 2, yy, ing ? 3.2 : 2.5, rgb, a); }
          c.save(); c.font = `${ing ? 600 : 400} ${ing ? 32 : 28}px Poppins`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = `rgba(${rgb},${e * (ing ? 1 : .8)})`; c.fillText(nom, cx, y + H / 2 + 1); c.restore(); });
      }; })(),
    // 21 · uso responsable: cuidar (no vigilar) · el foco es el riesgo (rostros pixelados) · datos protegidos
    u1: (c, t, w, h) => { c.clearRect(0, 0, w, h); const s = t / 1000, cx = w / 2, cy = h / 2 + 6;
      persona(c, cx, cy + 4, 1.15, AZUL, 1);
      for (let j = 0; j < 46; j++) { const th = j / 46 * 6.283 + s * .5, z = Math.sin(th); punto(c, cx + Math.cos(th) * 150, cy + 18 + z * 36, 2.2 + 1.6 * (z + 1) / 2, AZUL, .25 + .55 * (z + 1) / 2); }
      for (let j = 0; j < 30; j++) { const th = j / 30 * 6.283 - s * .35; punto(c, cx + Math.cos(th) * 205, cy + 18 + Math.sin(th) * 52, 1.8, CARBON, .18); } },
    u2: (c, t, w, h) => { c.clearRect(0, 0, w, h); const s = t / 1000, px = 150, gx = 375, y = h / 2 + 10;
      persona(c, px, y, 1.05, CARBON, .55, true);
      grua(c, gx, y + 18, NAR, 1);
      const L = 22, x0 = gx - 92, y0 = y - 92, x1 = gx + 92, y1 = y + 78; c.strokeStyle = `rgba(${NAR},${.75 + .25 * Math.sin(s * 3)})`; c.lineWidth = 3;
      for (const [qx, qy, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { c.beginPath(); c.moveTo(qx, qy + dy * L); c.lineTo(qx, qy); c.lineTo(qx + dx * L, qy); c.stroke(); }
      rotulo(c, gx, y0 - 30, "Riesgo", NAR, 1, 14); rotulo(c, px, y0 - 30, "Persona", GRIS, .8, 14);
      c.setLineDash([2, 9]); c.strokeStyle = `rgba(${CARBON},.3)`; c.lineWidth = 1.6; c.beginPath(); c.moveTo(px + 50, y + 10); c.lineTo(x0 - 12, y + 10); c.stroke(); c.setLineDash([]); },
    u3: (c, t, w, h) => { c.clearRect(0, 0, w, h); const s = t / 1000, cx = w / 2, cy = h / 2 + 30;
      for (let j = 0; j <= 20; j++) { const th = Math.PI + j / 20 * Math.PI; punto(c, cx + Math.cos(th) * 62, cy - 70 + Math.sin(th) * 66, 3.2, CARBON, .55); }
      for (const sx of [-62, 62]) for (let yy = cy - 70; yy < cy - 50; yy += 10) punto(c, cx + sx, yy, 3.2, CARBON, .55);
      for (let x = cx - 104; x <= cx + 104; x += 13) { punto(c, x, cy - 50, 3, CARBON, .55); punto(c, x, cy + 96, 3, CARBON, .55); }
      for (let y = cy - 37; y < cy + 96; y += 13) { punto(c, cx - 104, y, 3, CARBON, .55); punto(c, cx + 104, y, 3, CARBON, .55); }
      esfera(c, cx, cy + 23, 54, P420, s * .6, AZUL, 1, 1.9); },
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

  /* ── 18 · Lúmina sobre la grabación real: zonas, grúas, camiones y personas (casco, chaleco, zona) con alertas.
        Las trayectorias salen de un detector offline (YOLO-World) sobre el mismo video, revisadas a mano
        (recursos/clips/pucargo-lumina.json, 4 cuadros por segundo); aquí solo se dibujan sincronizadas con el video. ── */
  (() => {
    const lam = $(".lam--pucargo"), v = lam && $("video", lam), cv = lam && $(".lu-capa", lam); if (!cv) return;
    const c = cv.getContext("2d"), px = document.createElement("canvas"); px.width = px.height = 5; const pc = px.getContext("2d");
    let D = null; fetch("recursos/clips/pucargo-lumina.json?v=4").then((r) => r.json()).then((j) => (D = j)).catch(() => {});
    const NAR = "236,109,39", ROJ = "255,77,79", VER = "61,208,122", AMA = "245,180,0", BLA = "255,255,255";
    const dentro = (x, y, p) => { let d = false; for (let i = 0, j = p.length - 1; i < p.length; j = i++) { const [xi, yi] = p[i], [xj, yj] = p[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d; } return d; };
    const en = (tr, f) => { const k = f - tr.t0; if (k < 0 || k > tr.b.length - 1) return null; const i = Math.floor(k), u = k - i, a = tr.b[i], b = tr.b[Math.min(i + 1, tr.b.length - 1)]; return a.map((x, j) => x + (b[j] - x) * u); };
    const rr = (x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
    function esquinas(x0, y0, x1, y1, col, a = 1, lw = 3) { const L = Math.max(8, Math.min(26, (x1 - x0) / 3, (y1 - y0) / 3)); c.strokeStyle = `rgba(${col},${a})`; c.lineWidth = lw;
      for (const [x, y, dx, dy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) { c.beginPath(); c.moveTo(x, y + dy * L); c.lineTo(x, y); c.lineTo(x + dx * L, y); c.stroke(); }
      c.fillStyle = `rgba(${col},${.07 * a})`; c.fillRect(x0, y0, x1 - x0, y1 - y0); }
    function pill(x, y, txt, col, tam = 17, fondo = "rgba(18,20,24,.84)") { c.font = `600 ${tam}px Poppins, Arial`; const w = c.measureText(txt).width + tam * 2.2, h = tam * 1.75;
      c.fillStyle = fondo; rr(x, y - h, w, h, h / 2); c.fill(); c.fillStyle = `rgb(${col})`; c.beginPath(); c.arc(x + tam * .8, y - h / 2, tam * .28, 0, 7); c.fill();
      c.fillStyle = "#fff"; c.textBaseline = "middle"; c.fillText(txt, x + tam * 1.4, y - h / 2 + 1); return w; }
    // cubitos de atributos: chaleco, casco y zona (verde = cumple, rojo = falta)
    function cubo(x, y, tipo, ok) { const S = 34, col = ok ? VER : ROJ; c.fillStyle = "rgba(18,20,24,.86)"; rr(x, y, S, S, 9); c.fill(); c.strokeStyle = `rgba(${col},.95)`; c.lineWidth = 2; rr(x + 1, y + 1, S - 2, S - 2, 8); c.stroke();
      c.fillStyle = `rgb(${col})`; c.strokeStyle = `rgb(${col})`; c.lineWidth = 2.2; const m = x + S / 2;
      if (tipo === "chaleco") { c.beginPath(); c.moveTo(m - 9, y + 9); c.lineTo(m - 3, y + 7); c.lineTo(m, y + 13); c.lineTo(m + 3, y + 7); c.lineTo(m + 9, y + 9); c.lineTo(m + 9, y + 27); c.lineTo(m - 9, y + 27); c.closePath(); c.fill(); c.fillStyle = "rgba(18,20,24,.86)"; c.fillRect(m - 9, y + 18, 18, 2.5); }
      else { c.beginPath(); c.arc(m, y + 22, 10, Math.PI, 0); c.fill(); c.fillRect(m - 13, y + 21, 26, 3.5); }
      if (!ok) { c.strokeStyle = "#fff"; c.lineWidth = 2.4; c.beginPath(); c.moveTo(x + S - 11, y + 5); c.lineTo(x + S - 4, y + 12); c.moveTo(x + S - 4, y + 5); c.lineTo(x + S - 11, y + 12); c.stroke(); } }
    let eventos = [], estados = new Map(), vistos = new Set(), zest = new Map(), ultT = 0, total = 0;
    const evento = (txt, col) => { eventos.unshift({ txt, col, t: performance.now() }); eventos = eventos.slice(0, 4); total++; };
    function cuadro() {
      requestAnimationFrame(cuadro);
      if (!lam.classList.contains("activa") || !D) return;
      c.clearRect(0, 0, 1920, 1080);
      const t = v.currentTime || 0; if (t < ultT - .5) { eventos = []; estados.clear(); vistos.clear(); zest.clear(); total = 0; } ultT = t; const f = t * D.fps, ahora = performance.now();
      const s = Math.max(1920 / D.ancho, 1080 / D.alto), ox = (1920 - D.ancho * s) / 2, oy = (1080 - D.alto * s) / 2, X = (n) => ox + n * D.ancho * s, Y = (n) => oy + n * D.alto * s;
      // grúas y personas de este instante
      const gr = [], ps = []; D.gruas.forEach((tr, i) => { const b = en(tr, f); if (b) gr.push([b, i]); }); D.personas.forEach((tr, i) => { const b = en(tr, f); if (b) ps.push([b, tr, i]); });
      const pie = (b) => [(b[0] + b[2]) / 2, b[3]];
      // dos zonas de trabajo, una a cada lado del pasillo peatonal: con una persona adentro, la zona se cierra a las grúas (roja);
      // vacía, verde; con una grúa operando, naranja; grúa y persona a la vez, alarma
      const TXT = { libre: "libre", grua: "grúa operando", persona: "persona adentro · cerrada a grúas", alarma: "ALARMA · grúa con persona" };
      for (const z of D.zonas) {
        const pz = ps.some(([b]) => dentro(...pie(b), z.p)), gz = gr.some(([b]) => dentro(...pie(b), z.p)), est = pz && gz ? "alarma" : pz ? "persona" : gz ? "grua" : "libre";
        const prev = zest.get(z.id); if (prev !== est) { zest.set(z.id, est); if (prev !== undefined) { if (est === "alarma") evento(`Alarma · grúa en ${z.nombre} con persona`, ROJ); else if (est === "persona") evento(`${z.nombre} · cerrada a grúas`, ROJ); else if (est === "libre") evento(`${z.nombre} · libre`, VER); } }
        const col = est === "libre" ? VER : est === "grua" ? NAR : ROJ, k = est === "alarma" ? (Math.sin(ahora / 110) > 0 ? 1 : .35) : 1;
        c.beginPath(); z.p.forEach(([a, b], i) => (i ? c.lineTo(X(a), Y(b)) : c.moveTo(X(a), Y(b)))); c.closePath();
        c.fillStyle = `rgba(${col},${(est === "libre" ? .13 : .26) * k})`; c.fill(); c.setLineDash([16, 10]); c.lineDashOffset = -t * 22; c.strokeStyle = `rgba(${col},.95)`; c.lineWidth = 4; c.stroke(); c.setLineDash([]);
        const cx = z.p.reduce((m, q) => m + q[0], 0) / z.p.length, cy = z.p.reduce((m, q) => m + q[1], 0) / z.p.length, txt = `${z.nombre} · ${TXT[est]}`; c.font = "600 18px Poppins, Arial";
        pill(X(cx) - c.measureText(txt).width / 2 - 20, Y(cy) + 18, txt, est === "libre" ? VER : est === "grua" ? NAR : BLA, 18, est === "libre" || est === "grua" ? undefined : `rgba(${ROJ},.94)`); }
      // camiones en el andén y grúas en movimiento (con su rastro)
      // solo lo que importa: lo que entra a las zonas (Bastián: «enfocarse solo en lo bueno»; lo de afuera no se sigue bien)
      gr.forEach(([b, i]) => { const z = D.zonas.find((q) => dentro(...pie(b), q.p)); if (!z) return; const x0 = X(b[0]), y0 = Y(b[1]), x1 = X(b[2]), y1 = Y(b[3]);
        esquinas(x0, y0, x1, y1, NAR, 1, 3.5); pill(x0, y0 - 8, `Grúa en ${z.nombre}`, NAR, 16); });
      // personas: rostro pixelado, atributos y riesgo con las grúas cercanas
      ps.forEach(([b, tr, i]) => {
        const id = `P-${String(i + 1).padStart(2, "0")}`, pp = pie(b), zona = D.zonas.find((z) => dentro(...pp, z.p)); if (!zona) return;
        let riesgo = null; if (tr.cerca) for (const [g] of gr) { const dx = Math.max(g[0] - pp[0], 0, pp[0] - g[2]) * D.ancho, dy = Math.max(g[1] - pp[1], 0, pp[1] - g[3]) * D.alto; if (Math.hypot(dx, dy) < 110) riesgo = g; }
        const est = riesgo ? "riesgo" : zona ? "zona" : "ok";
        if (estados.get(i) !== est) { estados.set(i, est); if (est === "riesgo") evento(`Riesgo de atropello · ${id}`, ROJ); }
        const col = est === "riesgo" ? ROJ : est === "zona" ? AMA : BLA, x0 = X(b[0]), y0 = Y(b[1]), x1 = X(b[2]), y1 = Y(b[3]);
        if (tr.cerca) { // rostro pixelado: la persona no es el foco
          const hx = b[0] * D.ancho + (b[2] - b[0]) * D.ancho * .22, hw = (b[2] - b[0]) * D.ancho * .56, hy = b[1] * D.alto, hh = (b[3] - b[1]) * D.alto * .17;
          try { pc.drawImage(v, hx, hy, hw, hh, 0, 0, 5, 5); c.imageSmoothingEnabled = false; c.drawImage(px, 0, 0, 5, 5, X(hx / D.ancho), Y(hy / D.alto), hw * s, hh * s); c.imageSmoothingEnabled = true; } catch (e) {} }
        esquinas(x0, y0, x1, y1, col, est === "ok" ? .85 : 1, tr.cerca ? 3 : 2);
        if (riesgo) { c.setLineDash([9, 7]); c.strokeStyle = `rgba(${ROJ},.95)`; c.lineWidth = 3; c.beginPath(); c.moveTo(X(pp[0]), Y(pp[1])); c.lineTo(X((riesgo[0] + riesgo[2]) / 2), Y(riesgo[3])); c.stroke(); c.setLineDash([]); }
        pill(x0, y0 - 8, est === "riesgo" ? `Riesgo de atropello · ${id}` : `Persona en ${zona.nombre}`, est === "riesgo" ? BLA : AMA, 15, est === "riesgo" ? `rgba(${ROJ},.92)` : undefined); });
      // panel de Lúmina: lo que ve ahora la cámara y los últimos eventos
      const PX = 64, PY = 86, PW = 470; c.fillStyle = "rgba(255,255,255,.96)"; rr(PX, PY, PW, 168, 24); c.fill();
      c.fillStyle = `rgb(${NAR})`; c.beginPath(); c.arc(PX + 34, PY + 36, 9, 0, 7); c.fill(); c.fillStyle = "#6c6c6c"; c.font = "600 15px Poppins, Arial"; c.textBaseline = "middle"; c.fillText("LÚMINA · CAM 1D · PUERTA DE DESPACHO", PX + 54, PY + 37);
      if (Math.sin(ahora / 300) > -.3) { c.fillStyle = "#FF3B3B"; c.beginPath(); c.arc(PX + PW - 64, PY + 37, 5, 0, 7); c.fill(); } c.fillStyle = "#181818"; c.font = "600 13px Poppins, Arial"; c.fillText("EN VIVO", PX + PW - 54, PY + 38);
      D.zonas.forEach((z, k) => { const est = zest.get(z.id) || "libre", col = est === "libre" ? VER : est === "grua" ? NAR : ROJ, y = PY + 84 + k * 46;
        c.fillStyle = `rgb(${col})`; c.beginPath(); c.arc(PX + 38, y, 8, 0, 7); c.fill(); c.fillStyle = "#181818"; c.font = "600 22px Poppins, Arial"; c.fillText(z.nombre, PX + 58, y + 1);
        c.fillStyle = "#6c6c6c"; c.font = "500 18px Poppins, Arial"; c.fillText({ libre: "libre", grua: "grúa operando", persona: "persona · cerrada a grúas", alarma: "ALARMA" }[est], PX + 170, y + 1); });
      eventos.forEach((e, k) => { const a = Math.min(1, (ahora - e.t) / 300) * (k === 3 ? .55 : 1); c.globalAlpha = a; pill(PX, PY + 168 + 8 + (k + 1) * 42, e.txt, e.col, 16); c.globalAlpha = 1; });
    }
    requestAnimationFrame(cuadro);
  })();

  window.PRES = { ir: (n, p) => mostrar(n - 1, p || 0), avanzar, volver, planta: () => pedirPlanta, historia: () => pedirHistoria, n: lams.length };   // para QA
})();
