/* Planta Neisstech v5 · comparador de la home (13-nov-2026, UI mínima).
   · Arriba a la izquierda: Demostraciones (por defecto) / Simulación.
   · Arriba al centro: Antes / Después, solo en Simulación.
   · Arriba a la derecha: pantalla completa. La rueda del mouse acerca y aleja; arrastrar gira.
   · Las soluciones (o las zonas, en Simulación) se eligen tocando sus puntos en el mapa o en una lista lateral chica.
   · Abajo a la izquierda, una ficha corta con el texto, el avance y anterior / siguiente / cerrar. */
const AVISO = { casi: 'Casi accidente', golpe: 'Golpe al portón', camion: 'Camión en movimiento', rack: 'Golpe al rack' };
const SVG = {
  grande: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', chico: '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  ant: '<path d="M15 6l-6 6 6 6"/>', sig: '<path d="M9 6l6 6-6 6"/>', x: '<path d="M7 7l10 10M17 7 7 17"/>',
};
const ic = (n) => `<svg viewBox="0 0 24 24" aria-hidden="true">${SVG[n]}</svg>`;

export function iniciar(cmp, vista) {
  const L = { demo: vista.escenas.map((e) => ({ ...e, x: e.barrido[0], y: 2.4, z: e.barrido[1] })), sim: vista.puntos };
  const ui = document.createElement('div'); ui.className = 'pl-ui';
  const lista = (t) => L[t].map((e, i) => `<button type="button" data-i="${i}" aria-label="${e.titulo}"><span>${e.titulo}</span></button>`).join('');
  const pines = (t) => L[t].map((e, i) => `<button type="button" class="pl-pin" data-t="${t}" data-i="${i}" aria-label="${e.titulo}"><span>${e.titulo}</span></button>`).join('');
  ui.innerHTML = `
    <div class="pl-tipo" role="group" aria-label="Qué ver">
      <button type="button" data-tipo="demo" aria-pressed="true">Demostraciones</button>
      <button type="button" data-tipo="sim" aria-pressed="false">Simulación</button>
    </div>
    <div class="pl-modo" role="group" aria-label="Estado de la planta" hidden>
      <button type="button" data-modo="antes" aria-pressed="true">Antes</button>
      <button type="button" data-modo="despues" aria-pressed="false">Después</button>
    </div>
    <button type="button" class="pl-full" aria-label="Pantalla completa">${ic('grande')}</button>
    <div class="pl-pines">${pines('sim')}</div>
    <nav class="pl-lista" aria-label="Soluciones"><div data-lista="demo">${lista('demo')}</div><div data-lista="sim" hidden>${lista('sim')}</div></nav>
    <div class="pl-avisos" aria-hidden="true"></div>
    <div class="pl-ficha" aria-live="polite">
      <p class="pl-ficha-k"></p>
      <p class="pl-ficha-p"></p>
      <div class="pl-barra" aria-hidden="true"><span class="pl-barra-a"></span><span class="pl-barra-d"></span></div>
      <div class="pl-ficha-nav">
        <button type="button" data-paso="-1" aria-label="Anterior">${ic('ant')}</button>
        <button type="button" data-paso="1" aria-label="Siguiente">${ic('sig')}</button>
        <button type="button" class="pl-cerrar" aria-label="Volver a la planta">${ic('x')}</button>
      </div>
    </div>
    <span class="pl-ayuda" aria-hidden="true">Toca un punto · arrastra para moverte</span>
    <span class="pl-zoom" aria-hidden="true"></span>`;
  cmp.append(ui);
  const $ = (s) => ui.querySelector(s), $$ = (s) => [...ui.querySelectorAll(s)], avisos = $('.pl-avisos');
  const pinEls = $$('.pl-pin');
  let tipo = 'demo', modo = 'antes', sel = { demo: -1, sim: -1 }, auto = true, quieto = 0, espera = 1.2, fase = null;

  const marcar = (lista, attr, val) => lista.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === val)));
  function pintarModo(m) { modo = m; cmp.classList.toggle('is-despues', m === 'despues'); marcar($$('[data-modo]'), 'modo', m); }
  function pintar() {
    cmp.dataset.tipo = tipo; marcar($$('[data-tipo]'), 'tipo', tipo); $('.pl-modo').hidden = tipo !== 'sim';
    $$('[data-lista]').forEach((d) => (d.hidden = d.dataset.lista !== tipo)); $('.pl-lista').setAttribute('aria-label', tipo === 'demo' ? 'Soluciones' : 'Zonas');
    const i = sel[tipo], e = L[tipo][i];
    $$(`[data-lista="${tipo}"] button`).forEach((b, j) => b.classList.toggle('is-on', j === i));
    ui.classList.toggle('is-ficha', !!e); ui.classList.toggle('is-sim', tipo === 'sim');
    if (!e) return;
    const antes = tipo === 'demo' ? fase === 'antes' : modo === 'antes';
    $('.pl-ficha-k').textContent = `${e.titulo} · ${antes ? 'Antes' : 'Con Neisstech'}`;
    $('.pl-ficha-p').textContent = antes ? e.antes : e.despues;
  }
  function tocar() { auto = false; quieto = 0; cmp.classList.add('is-touched'); }

  function jugar(i, porUsuario) {
    tipo = 'demo'; const n = L.demo.length; sel.demo = (i + n) % n; fase = 'antes';
    vista.escena(L.demo[sel.demo].id); pintarModo('antes'); pintar(); if (porUsuario) tocar();
  }
  vista.alEscena = (id, f) => { if (tipo !== 'demo') return; if (f === 'despues') { fase = 'despues'; pintarModo('despues'); } if (f === 'fin') { fase = 'despues'; espera = .5; } pintar(); };
  function simulacion(m = modo) { tipo = 'sim'; vista.detener(); fase = null; vista.modo(m); pintarModo(m); pintar(); }
  function irZona(i) { sel.sim = i; vista.ir(i >= 0 ? L.sim[i].id : null); pintar(); }
  function cerrar() { tocar(); if (tipo === 'demo') { vista.detener(); sel.demo = -1; } else sel.sim = -1; vista.ir(null); pintar(); }
  const elegir = (t, i) => { tocar(); if (t === 'demo') jugar(i, true); else { if (tipo !== 'sim') simulacion(); irZona(i); } };

  $$('[data-tipo]').forEach((b) => b.addEventListener('click', () => { tocar(); if (b.dataset.tipo === 'sim') { simulacion(); irZona(-1); } else jugar(Math.max(0, sel.demo)); }));
  $$('[data-modo]').forEach((b) => b.addEventListener('click', () => { tocar(); vista.modo(b.dataset.modo); pintarModo(b.dataset.modo); pintar(); }));
  $$('[data-lista] button').forEach((b) => b.addEventListener('click', () => elegir(b.parentElement.dataset.lista, +b.dataset.i)));
  pinEls.forEach((b) => b.addEventListener('click', () => elegir(b.dataset.t, +b.dataset.i)));
  $$('[data-paso]').forEach((b) => b.addEventListener('click', () => { const n = L[tipo].length, i = (Math.max(0, sel[tipo]) + +b.dataset.paso + n) % n; elegir(tipo, i); }));
  $('.pl-cerrar').addEventListener('click', cerrar);

  /* pantalla completa (API nativa; en iPhone, una capa fija) */
  const grande = () => document.fullscreenElement === cmp || cmp.classList.contains('is-grande');
  function pantalla() {
    if (grande()) { if (document.fullscreenElement) document.exitFullscreen?.(); cmp.classList.remove('is-grande'); document.documentElement.classList.remove('pl-bloqueo'); }
    else if (cmp.requestFullscreen && !/iPhone|iPad/.test(navigator.userAgent)) cmp.requestFullscreen().catch(() => { cmp.classList.add('is-grande'); document.documentElement.classList.add('pl-bloqueo'); });
    else { cmp.classList.add('is-grande'); document.documentElement.classList.add('pl-bloqueo'); }
    setTimeout(pintarPantalla, 60);
  }
  function pintarPantalla() { const g = grande(), b = $('.pl-full'); b.innerHTML = ic(g ? 'chico' : 'grande'); b.setAttribute('aria-label', g ? 'Salir de pantalla completa' : 'Pantalla completa'); cmp.classList.toggle('is-full', g); }
  document.addEventListener('fullscreenchange', pintarPantalla);
  $('.pl-full').addEventListener('click', () => { tocar(); pantalla(); });
  cmp.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (cmp.classList.contains('is-grande')) pantalla(); else if (sel[tipo] >= 0) cerrar(); } });

  let ult = performance.now();
  function cuadro() {
    const ahora = performance.now(), dt = Math.min(.1, (ahora - ult) / 1000); ult = ahora;
    const est = vista.estado().escena;
    if (est) { const q = Math.min(1, est.t / est.dur); $('.pl-barra-a').style.setProperty('--q', est.fase === 'antes' ? q : 1); $('.pl-barra-d').style.setProperty('--q', est.fase === 'despues' ? q : 0); }
    // en demostraciones el recorrido sigue solo, aunque se haya elegido una a mano; solo se detiene al cerrarla
    if (tipo === 'demo' && !est && (auto || sel.demo >= 0)) { espera -= dt; if (espera <= 0) { espera = 99; jugar(sel.demo + 1); } }
    else if (!auto) { quieto += dt; if (quieto > 40 && tipo === 'demo') { auto = true; espera = 1; } }
    // puntos sobre el mapa: los del modo actual, menos el elegido
    const W = cmp.clientWidth, Hh = cmp.clientHeight;
    for (const b of pinEls) { const t = b.dataset.t, i = +b.dataset.i, e = L[t][i];
      if (t !== tipo || i === sel[t]) { b.classList.add('is-fuera'); continue; }
      const [x, y, ok] = vista.proyectar(e.x, e.y, e.z), ver = ok && x > 20 && x < W - 20 && y > 70 && y < Hh - 30;
      b.classList.toggle('is-fuera', !ver); b.tabIndex = ver ? 0 : -1; if (ver) b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; }
    const ev = vista.eventos(), vivos = new Set();
    for (const e of ev) { const key = `${e.tipo}${e.t.toFixed(2)}`; vivos.add(key); let n = avisos.querySelector(`[data-k="${key}"]`);
      if (!n) { n = document.createElement('span'); n.className = 'pl-aviso' + (e.bien ? ' is-bien' : ''); n.dataset.k = key; n.textContent = e.texto || AVISO[e.tipo] || 'Riesgo'; avisos.append(n); }
      const [x, y, ok] = vista.proyectar(e.x, (e.y || 0) + 1.9, e.z); n.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`; n.style.visibility = ok ? 'visible' : 'hidden'; }
    for (const n of [...avisos.children]) if (!vivos.has(n.dataset.k)) n.remove();
  }
  cmp.addEventListener('pointerdown', (e) => { if (!e.target.closest('.pl-ficha, .pl-modo, .pl-tipo, .pl-lista, .pl-full, .pl-pin')) tocar(); });
  // aviso breve cuando alguien usa la rueda sobre la planta: la página sigue bajando
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent); let zt = 0;
  $('.pl-zoom').textContent = `${mac ? '⌘' : 'Ctrl'} + rueda para acercar`;
  vista.alRueda = () => { ui.classList.add('is-zoom'); clearTimeout(zt); zt = setTimeout(() => ui.classList.remove('is-zoom'), 1400); };
  pintar();
  return { cuadro, tocar };
}
