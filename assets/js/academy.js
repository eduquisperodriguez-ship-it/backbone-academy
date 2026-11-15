/* ═══════════════════════════════════════════════════════════════
   BackBone Academy · comportamiento de la página
   1. Menú del celular        4. Buscador
   2. Programas (pestañas)    5. Gráfico del programa (3D y 2D)
   3. Botón Explorar          6. Portada que se inclina
   Los gráficos están en graficos.js (2D) y graficos3d.js (3D).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── 1. Menú del celular ─────────────────────────────────── */
  var botonMenu = $('.abrir-menu'), menuMovil = $('#menu-movil');
  function menu(abrir) {
    menuMovil.classList.toggle('abierto', abrir);
    botonMenu.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    botonMenu.setAttribute('aria-label', abrir ? 'Cerrar el menú' : 'Abrir el menú');
  }
  botonMenu.addEventListener('click', function () { menu(!menuMovil.classList.contains('abierto')); });
  $$('a', menuMovil).forEach(function (a) { a.addEventListener('click', function () { menu(false); }); });

  /* ── 2. Programas ────────────────────────────────────────────
     Cada tarjeta .pestana abre la ficha .programa del mismo
     data-programa. */
  var pestanas = $$('.pestana');
  var alCambiarPrograma = [];
  var programaActual = pestanas.length ? pestanas[0].dataset.programa : null;

  function elegirPrograma(id, opciones) {
    opciones = opciones || {};
    if (!$('#programa-' + id)) return;
    programaActual = id;
    pestanas.forEach(function (p) {
      var activa = p.dataset.programa === id;
      p.setAttribute('aria-selected', activa ? 'true' : 'false');
      p.tabIndex = activa ? 0 : -1;
      if (activa && opciones.foco) p.focus();
    });
    $$('.programa').forEach(function (a) { a.hidden = a.id !== 'programa-' + id; });
    alCambiarPrograma.forEach(function (fn) { fn(id); });
    if (opciones.ir) $('#ficha').scrollIntoView();
  }
  pestanas.forEach(function (p, i) {
    p.addEventListener('click', function () { elegirPrograma(p.dataset.programa, { ir: true }); });
    p.addEventListener('keydown', function (e) {
      var paso = (e.key === 'ArrowRight' || e.key === 'ArrowDown') ? 1 : (e.key === 'ArrowLeft' || e.key === 'ArrowUp') ? -1 : 0;
      if (!paso) return;
      e.preventDefault();
      elegirPrograma(pestanas[(i + paso + pestanas.length) % pestanas.length].dataset.programa, { foco: true });
    });
  });
  // Botones fuera de las tarjetas que llevan a un programa (Explorar y pie)
  $$('[data-programa]').forEach(function (b) {
    if (b.classList.contains('pestana')) return;
    b.addEventListener('click', function () { elegirPrograma(b.dataset.programa, { ir: true }); });
  });

  /* ── 3. Botón Explorar ───────────────────────────────────── */
  var botonExplorar = $('.explorar-boton'), panelExplorar = $('#explorar-panel');
  function explorar(abrir) {
    panelExplorar.hidden = !abrir;
    botonExplorar.setAttribute('aria-expanded', abrir ? 'true' : 'false');
  }
  botonExplorar.addEventListener('click', function () { explorar(panelExplorar.hidden); });
  panelExplorar.addEventListener('click', function (e) { if (e.target.closest('a, button')) explorar(false); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.explorar')) explorar(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') explorar(false); });

  /* ── 4. Buscador ─────────────────────────────────────────────
     El índice se arma leyendo la página: programas, sus temas,
     herramientas y publicaciones. Lo que añadas en esas secciones
     aparece en el buscador sin tocar este archivo. */
  var llano = function (s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); };
  var INDICE = [];
  $$('.programa').forEach(function (a) {
    var id = a.id.replace('programa-', ''), nombre = $('h3', a).textContent;
    INDICE.push({ tipo: 'Programa', titulo: nombre, detalle: $('.programa-resumen', a).textContent, programa: id });
    $$('.aprenderas li', a).forEach(function (li) {
      INDICE.push({ tipo: 'Tema', titulo: li.textContent, detalle: 'Parte de ' + nombre, programa: id });
    });
  });
  $$('#practica .tarjeta').forEach(function (c) {
    INDICE.push({ tipo: 'Calculadora', titulo: $('h3', c).textContent, detalle: $('.tarjeta-texto', c).textContent, url: $('a', c).href });
  });
  $$('#publicaciones .tarjeta').forEach(function (c) {
    INDICE.push({ tipo: 'Publicación', titulo: $('h3', c).textContent, detalle: $('.tarjeta-texto', c).textContent, ancla: '#publicaciones' });
  });
  INDICE.forEach(function (e) { e.texto = llano(e.tipo + ' ' + e.titulo + ' ' + e.detalle); });

  var campo = $('#buscar'), lista = $('#resultados');
  function cerrarResultados() { lista.hidden = true; lista.textContent = ''; }
  function buscar() {
    var palabras = llano(campo.value).split(/\s+/).filter(Boolean);
    lista.textContent = '';
    if (!palabras.length) { lista.hidden = true; return; }
    var hallados = INDICE.filter(function (e) { return palabras.every(function (p) { return e.texto.indexOf(p) !== -1; }); }).slice(0, 8);
    if (!hallados.length) {
      var vacio = document.createElement('li');
      vacio.className = 'resultados-vacio';
      vacio.textContent = 'No encontramos “' + campo.value.trim() + '”. Prueba con micro, derivadas o monopolio.';
      lista.appendChild(vacio);
    }
    hallados.forEach(function (e) {
      var li = document.createElement('li'), a = document.createElement('a');
      var tipo = document.createElement('span'), titulo = document.createElement('strong'), detalle = document.createElement('small');
      tipo.className = 'resultado-tipo'; tipo.textContent = e.tipo;
      titulo.textContent = e.titulo; detalle.textContent = e.detalle;
      a.appendChild(tipo); a.appendChild(titulo); a.appendChild(detalle);
      if (e.url) { a.href = e.url; a.target = '_blank'; a.rel = 'noopener'; }
      else { a.href = e.programa ? '#ficha' : e.ancla; }
      a.addEventListener('click', function (ev) {
        if (e.programa) { ev.preventDefault(); elegirPrograma(e.programa, { ir: true }); }
        campo.value = ''; cerrarResultados();
      });
      li.appendChild(a); lista.appendChild(li);
    });
    lista.hidden = false;
  }
  function irAlPrimero() { var primero = $('a', lista); if (primero) primero.click(); else campo.focus(); }
  campo.addEventListener('input', buscar);
  campo.addEventListener('focus', buscar);
  campo.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { campo.value = ''; cerrarResultados(); }
    if (e.key === 'Enter') irAlPrimero();
  });
  $('#buscar-ir').addEventListener('click', irAlPrimero);
  document.addEventListener('click', function (e) { if (!e.target.closest('.buscador')) cerrarResultados(); });

  /* ── 5. Gráfico del programa ────────────────────────────────
     Dos vistas: 3D (graficos3d.js, si el navegador puede) y 2D
     (graficos.js). Los valores de abajo siempre salen de graficos.js,
     así las dos vistas muestran los mismos números. */
  var Graficos = window.BackBoneGraficos;
  var caja = $('#grafico'), control = $('#control');
  var lienzo2d = $('#grafico-lienzo'), caja3d = $('#grafico-3d'), vistas = $('.vistas');
  var vista = '3d';
  function tres() {
    var t = window.BackBone3D;
    return vista === '3d' && t && t.disponible && t.hay(programaActual) ? t : null;
  }
  function pintar() {
    var valor = parseFloat(control.value), r = Graficos.dibujar(programaActual, valor), t = tres();
    if (t) t.mover(valor); else lienzo2d.innerHTML = r.svg;
    $('#lectura').innerHTML = r.lectura.map(function (d) { return '<span>' + d[0] + ' = <b>' + d[1] + '</b></span>'; }).join('');
  }
  function cargarGrafico(id, mantenerValor) {
    var hay = !!(Graficos && Graficos.hay(id));
    caja.hidden = !hay;
    if (!hay) return;
    var d = Graficos.datos(id), c = d.control, t = tres();
    var valor = mantenerValor ? parseFloat(control.value) : c.valor;
    $('#grafico-titulo').textContent = d.titulo;
    $('#control-texto').textContent = c.texto;
    control.min = c.min; control.max = c.max; control.step = c.paso; control.value = valor;
    lienzo2d.hidden = !!t;
    caja3d.hidden = !t;
    $('#explica').innerHTML = t ? t.explica(id) : d.explica;
    if (t) t.cargar(id, parseFloat(control.value));
    pintar();
  }
  function elegirVista(v) {
    vista = v;
    $$('.vista').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.vista === v ? 'true' : 'false'); });
    cargarGrafico(programaActual, true);
  }
  $$('.vista').forEach(function (b) { b.addEventListener('click', function () { elegirVista(b.dataset.vista); }); });
  $('#repetir').addEventListener('click', function () { if (window.BackBone3D) window.BackBone3D.repetir(); });
  // graficos3d.js carga después; cuando avisa, la vista 3D pasa a ser la principal
  function con3D() {
    if (!window.BackBone3D || !window.BackBone3D.disponible) return;
    vistas.hidden = false;
    cargarGrafico(programaActual, true);
  }
  document.addEventListener('backbone3d:listo', con3D);
  document.addEventListener('backbone3d:falla', function () { vistas.hidden = true; vista = '2d'; cargarGrafico(programaActual, true); });
  control.addEventListener('input', pintar);
  alCambiarPrograma.push(function (id) { cargarGrafico(id); });
  if (programaActual) cargarGrafico(programaActual);
  con3D();

  /* ── 6. Portada que se inclina con el mouse ────────────────── */
  var arte = $('.portada-arte'), portada = $('.portada');
  var conMovimiento = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(pointer: fine)').matches;
  if (arte && conMovimiento) {
    portada.addEventListener('pointermove', function (e) {
      var r = arte.getBoundingClientRect();
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      arte.style.transform = 'perspective(1000px) rotateY(' + (dx * 12).toFixed(2) + 'deg) rotateX(' + (-dy * 9).toFixed(2) + 'deg)';
    });
    portada.addEventListener('pointerleave', function () { arte.style.transform = ''; });
  }
})();
