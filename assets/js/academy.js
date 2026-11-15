/* ═══════════════════════════════════════════════════════════════
   BackBone Academy · comportamiento de la página
   1. Menú del celular        4. Buscador
   2. Programas (pestañas)    5. Gráfico del programa
   3. Botón Explorar
   Los gráficos están en graficos.js.
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

  /* ── 5. Gráfico del programa ─────────────────────────────── */
  var Graficos = window.BackBoneGraficos;
  var caja = $('#grafico'), control = $('#control');
  function pintar() {
    var r = Graficos.dibujar(programaActual, parseFloat(control.value));
    $('#grafico-lienzo').innerHTML = r.svg;
    $('#lectura').innerHTML = r.lectura.map(function (d) { return '<span>' + d[0] + ' = <b>' + d[1] + '</b></span>'; }).join('');
  }
  function cargarGrafico(id) {
    var hay = !!(Graficos && Graficos.hay(id));
    caja.hidden = !hay;
    if (!hay) return;
    var d = Graficos.datos(id), c = d.control;
    $('#grafico-titulo').textContent = d.titulo;
    $('#control-texto').textContent = c.texto;
    $('#explica').innerHTML = d.explica;
    control.min = c.min; control.max = c.max; control.step = c.paso; control.value = c.valor;
    pintar();
  }
  control.addEventListener('input', pintar);
  alCambiarPrograma.push(cargarGrafico);
  if (programaActual) cargarGrafico(programaActual);
})();
