/* ═══════════════════════════════════════════════════════════════
   BackBone Academy · gráficos de los programas
   Un gráfico 2D por programa, de los que salen en la pizarra.

   Para añadir el gráfico de un programa nuevo, agrega una entrada
   a GRAFICOS con el mismo nombre corto del programa (el de su
   data-programa). Cada entrada tiene:
     titulo    lo que dice arriba del gráfico
     control   el deslizador: texto, mínimo, máximo, paso y valor inicial
     explica   la explicación de abajo (se permite <b>)
     ejes      nombres y máximos de los ejes
     dibujar(valor, g)   dibuja con las piezas de g y devuelve la
                         lectura: [[nombre, valor], …]
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var ANCHO = 560, ALTO = 390, M = { izq: 56, der: 22, arr: 30, aba: 50 };
  var coma = function (n, d) { return n.toFixed(d == null ? 2 : d).replace('.', ',').replace('-', '−'); };

  /* Las piezas de dibujo: reciben coordenadas del problema, no píxeles */
  function lienzo(ejes) {
    var px = function (x) { return M.izq + x / ejes.xMax * (ANCHO - M.izq - M.der); };
    var py = function (y) { return ALTO - M.aba - y / ejes.yMax * (ALTO - M.arr - M.aba); };
    var t = [];
    var n = function (v) { return v.toFixed(1); };
    var g = {
      trazo: function (puntos, clase) {
        t.push('<path class="' + clase + '" clip-path="url(#g-marco)" d="M' + puntos.map(function (p) { return n(px(p[0])) + ' ' + n(py(p[1])); }).join('L') + '"/>');
      },
      curva: function (f, a, b, clase) {
        var puntos = [];
        for (var i = 0; i <= 80; i++) { var x = a + (b - a) * i / 80; puntos.push([x, f(x)]); }
        g.trazo(puntos, clase);
      },
      guias: function (x, y) {
        t.push('<path class="g-guia" d="M' + n(px(0)) + ' ' + n(py(y)) + 'H' + n(px(x)) + 'V' + n(py(0)) + '"/>');
      },
      punto: function (x, y) {
        t.push('<circle class="g-punto" cx="' + n(px(x)) + '" cy="' + n(py(y)) + '" r="7"/>');
      },
      texto: function (x, y, s, clase, dx, dy, ancla) {
        t.push('<text class="g-texto ' + (clase || '') + '" x="' + n(px(x) + (dx || 0)) + '" y="' + n(py(y) + (dy || 0)) + '" text-anchor="' + (ancla || 'start') + '">' + s + '</text>');
      },
      svg: function () {
        var x0 = px(0), y0 = py(0), marcas = '';
        [0.5, 1].forEach(function (k) {
          marcas += '<text class="g-marca" x="' + n(px(ejes.xMax * k)) + '" y="' + n(y0 + 20) + '" text-anchor="middle">' + coma(ejes.xMax * k, 0) + '</text>';
          marcas += '<text class="g-marca" x="' + n(x0 - 10) + '" y="' + n(py(ejes.yMax * k) + 5) + '" text-anchor="end">' + coma(ejes.yMax * k, 0) + '</text>';
        });
        return '<svg viewBox="0 0 ' + ANCHO + ' ' + ALTO + '" role="img" aria-label="' + ejes.descripcion + '">' +
          '<defs><clipPath id="g-marco"><rect x="' + n(x0) + '" y="' + n(py(ejes.yMax)) + '" width="' + n(px(ejes.xMax) - x0) + '" height="' + n(y0 - py(ejes.yMax)) + '"/></clipPath></defs>' +
          '<path class="g-eje" d="M' + n(x0) + ' ' + n(py(ejes.yMax)) + 'V' + n(y0) + 'H' + n(px(ejes.xMax)) + '"/>' + marcas +
          '<text class="g-nombre" x="' + n(px(ejes.xMax)) + '" y="' + n(y0 + 42) + '" text-anchor="end">' + ejes.x + '</text>' +
          '<text class="g-nombre" x="' + n(x0 - 44) + '" y="' + n(py(ejes.yMax) - 12) + '">' + ejes.y + '</text>' +
          t.join('') + '</svg>';
      }
    };
    return g;
  }

  var GRAFICOS = {

    /* Matemática: la derivada como costo marginal */
    mate: {
      titulo: 'La derivada como costo marginal',
      control: { texto: 'Cambia la cantidad producida', min: 1, max: 9, paso: 0.1, valor: 6.5 },
      explica: '<b>La derivada es una pendiente.</b> La recta azul toca la curva de costo total en un solo punto. Su pendiente es el costo marginal: lo que cuesta producir una unidad más desde ahí.',
      ejes: { x: 'Cantidad (q)', y: 'Costo total', xMax: 10, yMax: 40, descripcion: 'Curva de costo total con su recta tangente en la cantidad elegida.' },
      dibujar: function (q, g) {
        var C = function (x) { return x * x * x / 12 - x * x + 5 * x + 3; };
        var CMg = q * q / 4 - 2 * q + 5, c = C(q);
        g.curva(C, 0, 10, 'g-linea');
        g.guias(q, c);
        g.trazo([[q - 3, c - 3 * CMg], [q + 3, c + 3 * CMg]], 'g-linea g-acento');
        g.punto(q, c);
        g.texto(9.9, C(9.9), 'Costo total', '', 0, -14, 'end');
        g.texto(q, c, 'Tangente', 'g-acento', -12, -14, 'end');
        return [['q', coma(q, 1)], ['Costo', coma(c, 1)], ['Costo marginal', coma(CMg)]];
      }
    },

    /* Microeconomía: recta de presupuesto y curva de indiferencia */
    micro: {
      titulo: 'La elección del consumidor',
      control: { texto: 'Sube o baja el ingreso', min: 4, max: 10, paso: 0.1, valor: 6 },
      explica: '<b>Lo mejor que puedes comprar.</b> La recta es tu presupuesto: todo lo que alcanzas con tu ingreso. El óptimo está donde esa recta toca la curva de indiferencia más alta, la azul.',
      ejes: { x: 'Bien x', y: 'Bien y', xMax: 10, yMax: 10, descripcion: 'Recta de presupuesto tangente a una curva de indiferencia en el punto óptimo.' },
      dibujar: function (I, g) {
        // U = √(x·y), con precios iguales a 1: el óptimo reparte el ingreso por mitades
        var x = I / 2, u = x;
        [2, 3.5, 5].forEach(function (k) { g.curva(function (v) { return k * k / v; }, 0.25, 10, 'g-linea g-tenue'); });
        g.trazo([[0, I], [I, 0]], 'g-linea');
        g.curva(function (v) { return u * u / v; }, 0.25, 10, 'g-linea g-acento');
        g.guias(x, x);
        g.punto(x, x);
        g.texto(I * 0.8, I * 0.2, 'Presupuesto', '', 12, -6);
        g.texto(x, x, 'Óptimo', 'g-acento', 12, -10);
        return [['x', coma(x)], ['y', coma(x)], ['Utilidad', coma(u)]];
      }
    },

    /* Macroeconomía: IS-LM y un aumento del gasto público */
    macro: {
      titulo: 'El modelo IS-LM',
      control: { texto: 'Aumenta el gasto público (G)', min: 0, max: 3, paso: 0.05, valor: 1 },
      explica: '<b>Política fiscal.</b> Más gasto público mueve la IS hacia la derecha: sube la producción y también la tasa de interés. La línea punteada es la IS del inicio, para comparar.',
      ejes: { x: 'Producción (Y)', y: 'Tasa de interés (r)', xMax: 8, yMax: 4, descripcion: 'Curvas IS y LM con su punto de equilibrio.' },
      dibujar: function (G, g) {
        // Ejemplo ilustrativo. IS: r = 1 + G − 0,4·Y    LM: r = 0,5·Y − 1
        var IS = function (Gx) { return function (Y) { return 1 + Gx - 0.4 * Y; }; };
        var LM = function (Y) { return 0.5 * Y - 1; };
        var Y = (2 + G) / 0.9, r = LM(Y);
        if (Math.abs(G - 1) > 0.04) g.curva(IS(1), 0, 8, 'g-linea g-tenue g-punteada');
        g.curva(LM, 0, 8, 'g-linea');
        g.curva(IS(G), 0, 8, 'g-linea g-acento');
        g.guias(Y, r);
        g.punto(Y, r);
        g.texto(7.9, LM(7.9), 'LM', '', -4, 22, 'end');
        var yIS = Math.min(7.6, (1 + G - 0.25) / 0.4);
        g.texto(yIS, IS(G)(yIS), 'IS', 'g-acento', 10, -4);
        return [['G', coma(G)], ['Y', coma(Y)], ['r', coma(r)]];
      }
    }
  };

  window.BackBoneGraficos = {
    hay: function (id) { return !!GRAFICOS[id]; },
    datos: function (id) { return GRAFICOS[id]; },
    dibujar: function (id, valor) {
      var G = GRAFICOS[id], g = lienzo(G.ejes);
      var lectura = G.dibujar(valor, g);
      return { svg: g.svg(), lectura: lectura };
    }
  };
})();
