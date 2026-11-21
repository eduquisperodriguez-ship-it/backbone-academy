/* ═══════════════════════════════════════════════════════════════
   BackBone Academy · vista 3D de los gráficos de los programas
   Usa Three.js 0.170 (assets/vendor/three), sin servicios externos.

   La idea: cada gráfico empieza plano, igual al 2D de graficos.js,
   y luego se levanta girando hasta mostrar su tercera dimensión.
   Así se entiende de dónde sale el 3D.

   Para añadir la vista 3D de un programa nuevo, agrega una entrada
   a ESCENAS con el mismo nombre corto del programa. Cada una tiene:
     eje        el eje que se despliega: 'y' (altura) o 'z' (fondo)
     pivote(v)  dónde está el gráfico plano sobre ese eje
     objetivo   el punto al que mira la cámara
     inicio     cámara al empezar (vista plana): theta, phi, radio
     final      cámara al terminar de girar
     explica    el texto de abajo en la vista 3D
     armar(c)   dibuja lo que no cambia y crea las etiquetas
     mover(v,c) dibuja lo que depende del control
   Los valores que se leen abajo salen de graficos.js, así que las
   dos vistas siempre muestran los mismos números.
   ═══════════════════════════════════════════════════════════════ */
import * as THREE from 'three';

const caja = document.getElementById('grafico-3d-lienzo');
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const COLOR = {
  blanco: 0xFFFFFF, acento: 0x6E78E0, vivo: 0x8F98F0, celeste: 0xC6CBF8,
  eje: 0xA9B4CC, piso: 0x1A3268
};
const DURACION = 2.4;      // segundos que tarda en levantarse
const VAIVEN = 0.3;        // cuánto se mece sola, en radianes

const v3 = (x, y, z) => new THREE.Vector3(x, y, z);
const limitar = (x, a, b) => Math.max(a, Math.min(b, x));
const suave = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const rango = (a, b, n) => Array.from({ length: n + 1 }, (_, i) => a + (b - a) * i / n);

/* Recorta un polígono [u, v] y se queda con a·u + b·v + c ≥ 0 */
function recortar(poli, a, b, c) {
  const sal = [];
  poli.forEach((p, i) => {
    const q = poli[(i + 1) % poli.length];
    const fp = a * p[0] + b * p[1] + c, fq = a * q[0] + b * q[1] + c;
    if (fp >= 0) sal.push(p);
    if ((fp >= 0) !== (fq >= 0)) {
      const t = fp / (fp - fq);
      sal.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
    }
  });
  return sal;
}

/* ── ESCENAS ─────────────────────────────────────────────────── */
const ESCENAS = {

  /* Matemática: la curva de costo es el borde de una superficie */
  mate: (() => {
    const C = (q) => q * q * q / 12 - q * q + 5 * q + 3;
    const CMg = (q) => q * q / 4 - 2 * q + 5;
    const F = (q1, q2) => C(q1) + 1.2 * q2 * q2;
    const M = (q1, q2, c) => v3((q1 - 5) * 0.42, c * 0.07 - 1.45, -q2 * 0.75);
    let eTangente;
    return {
      eje: 'z', pivote: () => 0,
      objetivo: [0, 0.2, -1.1],
      inicio: { theta: 0, phi: Math.PI / 2, radio: 8.6 },
      final: { theta: -0.8, phi: 1.12, radio: 10 },
      explica: '<b>La curva es un borde.</b> Al girar, la curva de costo resulta ser el borde de una superficie: el costo de producir dos bienes, q₁ y q₂. La recta azul es la derivada parcial: la pendiente si solo mueves q₁.',
      armar(c) {
        c.superficie(c.fijo, F, [0, 10], [0, 3], 36, M, 48, 4);
        c.tubo(c.fijo, rango(0, 10, 60).map((q) => M(q, 0, C(q))), COLOR.blanco, 0.032, { brillo: 0.35 });
        c.linea(c.fijo, [M(0, 0, 0), M(10.6, 0, 0)], COLOR.eje, 0.75);
        c.linea(c.fijo, [M(0, 0, 0), M(0, 0, 50)], COLOR.eje, 0.75);
        c.linea(c.fijo, [M(0, 0, 0), M(0, 3.4, 0)], COLOR.eje, 0.75, { desde: 0.35 });
        c.etiqueta('Cantidad q₁', M(11.4, 0, 0).add(v3(0, -0.22, 0)));
        c.etiqueta('Costo', M(0, 0, 52));
        c.etiqueta('Otro bien q₂', M(0, 3.75, 0), { desde: 0.55 });
        c.etiqueta('Costo total', M(10, 0, C(10) + 4.5));
        eTangente = c.etiqueta('Tangente', v3(0, 0, 0), { clase: 'acento' });
      },
      mover(q, c) {
        const y = C(q), m = CMg(q), a = Math.max(0, q - 2.6), b = Math.min(10, q + 2.6);
        c.tubo(c.movil, [M(a, 0, y + (a - q) * m), M(b, 0, y + (b - q) * m)], COLOR.acento, 0.038, { brillo: 0.7 });
        c.tubo(c.movil, rango(0, 3, 24).map((w) => M(q, w, F(q, w))), COLOR.celeste, 0.016, { desde: 0.3 });
        c.linea(c.movil, [M(0, 0, y), M(q, 0, y), M(q, 0, 0)], COLOR.eje, 0.8, { discontinua: true });
        c.punto(M(q, 0, y));
        eTangente.pos.copy(M(q, 0, y)).add(v3(-0.2, 0.3, 0));
      }
    };
  })(),

  /* Microeconomía: la montaña de la utilidad */
  micro: (() => {
    const U = (x, y) => Math.sqrt(Math.max(x * y, 0));
    const M = (x, y, u) => v3((x - 5) * 0.4, u * 0.24 - 1.1, (5 - y) * 0.4);
    const indiferencia = (k, h) => rango(k * k / 10, 10, 60).map((x) => M(x, k * k / x, h));
    let ePresupuesto, eOptimo;
    return {
      eje: 'y', pivote: () => -1.1,
      objetivo: [0, 0, 0],
      inicio: { theta: 0, phi: 0.06, radio: 8.8 },
      final: { theta: -0.62, phi: 1.02, radio: 10.2 },
      explica: '<b>La montaña de la utilidad.</b> Las curvas de indiferencia son curvas de nivel: puntos a la misma altura. El camino blanco cruza la montaña por encima de tu presupuesto, y el óptimo es su punto más alto.',
      armar(c) {
        c.cara(c.fijo, [M(0, 0, 0), M(10, 0, 0), M(10, 10, 0), M(0, 10, 0)], COLOR.piso, 0.55, { fondo: true });
        for (let k = 2; k < 10; k += 2) {
          c.linea(c.fijo, [M(k, 0, 0), M(k, 10, 0)], COLOR.eje, 0.12);
          c.linea(c.fijo, [M(0, k, 0), M(10, k, 0)], COLOR.eje, 0.12);
        }
        c.superficie(c.fijo, U, [0, 10], [0, 10], 40, M, 10, 5);
        [2, 3.5, 5].forEach((k) => c.tubo(c.fijo, indiferencia(k, k), COLOR.blanco, 0.012, { opacidad: 0.45 }));
        c.linea(c.fijo, [M(0, 0, 0), M(10.7, 0, 0)], COLOR.eje, 0.75);
        c.linea(c.fijo, [M(0, 0, 0), M(0, 10.7, 0)], COLOR.eje, 0.75);
        c.linea(c.fijo, [M(0, 0, 0), M(0, 0, 10.6)], COLOR.eje, 0.75, { desde: 0.35 });
        c.etiqueta('Bien x', M(11.4, 0, 0));
        c.etiqueta('Bien y', M(0, 11.3, 0));
        c.etiqueta('Utilidad', M(0, 0, 11.4), { desde: 0.55 });
        ePresupuesto = c.etiqueta('Presupuesto', v3(0, 0, 0));
        eOptimo = c.etiqueta('Óptimo', v3(0, 0, 0), { clase: 'acento' });
      },
      mover(I, c) {
        const x0 = Math.max(0, I - 10), x1 = Math.min(10, I), u = I / 2;
        const xs = rango(x0, x1, 40);
        const camino = xs.map((x) => M(x, I - x, U(x, I - x)));
        const suelo = xs.map((x) => M(x, I - x, 0));
        c.tubo(c.movil, [suelo[0], suelo[suelo.length - 1]], COLOR.blanco, 0.022);
        c.tubo(c.movil, camino, COLOR.blanco, 0.026, { brillo: 0.3 });
        c.cinta(c.movil, suelo, camino, COLOR.blanco, 0.16, { desde: 0.2 });
        c.tubo(c.movil, indiferencia(u, u), COLOR.acento, 0.03, { brillo: 0.7 });
        c.linea(c.movil, [M(0, u, 0), M(u, u, 0), M(u, 0, 0)], COLOR.eje, 0.7, { discontinua: true });
        c.linea(c.movil, [M(u, u, 0), M(u, u, u)], COLOR.eje, 0.8, { discontinua: true, desde: 0.3 });
        c.punto(M(u, u, u));
        ePresupuesto.pos.copy(M(I * 0.82, I * 0.18, 0)).add(v3(0.55, 0, 0.1));
        eOptimo.pos.copy(M(u, u, u)).add(v3(0.32, 0.22, 0));
      }
    };
  })(),

  /* Macroeconomía: un corte IS-LM por cada nivel de gasto público */
  macro: (() => {
    const IS = (Y, G) => 1 + G - 0.4 * Y;
    const LM = (Y) => 0.5 * Y - 1;
    const eqY = (G) => (2 + G) / 0.9;
    const M = (Y, G, r) => v3((Y - 4) * 0.5, r * 0.72 - 1.3, -(G - 1.5) * 0.85);
    let eIS, eLM;
    return {
      eje: 'z', pivote: (G) => -(G - 1.5) * 0.85,
      objetivo: [0, 0.15, 0],
      inicio: { theta: 0, phi: Math.PI / 2, radio: 8.6 },
      final: { theta: -0.55, phi: 1.2, radio: 10.4 },
      explica: '<b>Un corte por cada nivel de gasto.</b> El tercer eje es el gasto público G. Cada valor de G corta los planos IS y LM y deja el gráfico de siempre; la línea celeste une todos los equilibrios.',
      armar(c) {
        const cuadro = [[0, 0], [8, 0], [8, 3], [0, 3]];
        const pIS = recortar(recortar(cuadro, -0.4, 1, 1), 0.4, -1, 3);   // 0 ≤ r ≤ 4
        c.cara(c.fijo, pIS.map(([Y, G]) => M(Y, G, IS(Y, G))), COLOR.acento, 0.42, { desde: 0.1 });
        c.cara(c.fijo, [[2, 0], [8, 0], [8, 3], [2, 3]].map(([Y, G]) => M(Y, G, LM(Y))), COLOR.blanco, 0.2, { desde: 0.1 });
        c.tubo(c.fijo, rango(0, 3, 24).map((G) => M(eqY(G), G, LM(eqY(G)))), COLOR.celeste, 0.022, { brillo: 0.5, desde: 0.3 });
        c.linea(c.fijo, [M(0, 0, 0), M(8, 0, 0), M(8, 3, 0), M(0, 3, 0), M(0, 0, 0)], COLOR.eje, 0.25);
        c.linea(c.fijo, [M(0, 0, 0), M(8.6, 0, 0)], COLOR.eje, 0.75);
        c.linea(c.fijo, [M(0, 0, 0), M(0, 0, 4.4)], COLOR.eje, 0.75);
        c.linea(c.fijo, [M(0, 0, 0), M(0, 3.4, 0)], COLOR.eje, 0.75, { desde: 0.35 });
        c.etiqueta('Producción Y', M(9.4, 0, 0).add(v3(0, -0.22, 0)));
        c.etiqueta('Tasa r', M(0, 0, 4.85));
        c.etiqueta('Gasto G', M(0, 3.8, 0), { desde: 0.55 });
        eIS = c.etiqueta('IS', v3(0, 0, 0), { clase: 'acento' });
        eLM = c.etiqueta('LM', v3(0, 0, 0));
      },
      mover(G, c) {
        const ya = Math.max(0, (G - 3) / 0.4), yb = Math.min(8, (1 + G) / 0.4);
        const Y = eqY(G), r = LM(Y);
        c.linea(c.movil, [M(0, G, 0), M(8, G, 0), M(8, G, 4), M(0, G, 4), M(0, G, 0)], COLOR.blanco, 0.22, { desde: 0.25 });
        c.tubo(c.movil, [M(ya, G, IS(ya, G)), M(yb, G, IS(yb, G))], COLOR.acento, 0.036, { brillo: 0.7 });
        c.tubo(c.movil, [M(2, G, 0), M(8, G, 3)], COLOR.blanco, 0.036, { brillo: 0.35 });
        c.linea(c.movil, [M(0, G, r), M(Y, G, r), M(Y, G, 0)], COLOR.eje, 0.8, { discontinua: true });
        c.punto(M(Y, G, r));
        const yEtq = Math.min(7.2, ya + 0.5);
        eIS.pos.copy(M(yEtq, G, IS(yEtq, G))).add(v3(0, 0.26, 0));
        eLM.pos.copy(M(8, G, 3)).add(v3(0.12, 0.24, 0));
      }
    };
  })()
};

/* ── El visor ────────────────────────────────────────────────── */
function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

function crearVisor() {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const lienzo = renderer.domElement;
  lienzo.style.touchAction = 'pan-y';      // en el celular, el dedo arriba y abajo sigue moviendo la página
  lienzo.setAttribute('role', 'img');
  lienzo.setAttribute('aria-label', 'Gráfico en 3D del programa elegido. Se explica en el texto de abajo.');
  caja.appendChild(lienzo);
  const capa = document.createElement('div');
  capa.className = 'capa-etq';
  caja.appendChild(capa);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  escena.add(new THREE.HemisphereLight(0xDFE9FF, 0x0C1B3D, 1.8));
  const sol = new THREE.DirectionalLight(0xFFFFFF, 2.2); sol.position.set(4, 8, 6); escena.add(sol);
  const contra = new THREE.DirectionalLight(0x6E78E0, 1.6); contra.position.set(-6, 3, -5); escena.add(contra);
  const frontal = new THREE.DirectionalLight(0xFFFFFF, 0.8); frontal.position.set(0.3, 0.5, 1);
  camara.add(frontal); escena.add(camara);

  const mundo = new THREE.Group(), fijo = new THREE.Group(), movil = new THREE.Group();
  mundo.add(fijo, movil); escena.add(mundo);

  let esc = null, valor = 0, s = 1;
  let difusos = [], etiquetas = [], halos = [];
  const cam = { theta: 0, phi: 1, radio: 10 }, objetivo = v3(0, 0, 0);
  const intro = { activa: false, t0: null };
  let vaivenT0 = 0, arrastre = null, ultimoToque = -1e9, visible = false, corriendo = false;
  let ancho = 1, alto = 1;
  const aux = v3(0, 0, 0);

  /* Materiales que aparecen poco a poco mientras el gráfico se levanta */
  function difuso(material, base, desde, grupo) {
    material.transparent = true;
    difusos.push({ material, base, desde: desde || 0, grupo });
  }
  const grupoDe = (g) => (g === movil ? 'movil' : 'fijo');
  function solido(color, brillo) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1, emissive: color, emissiveIntensity: brillo == null ? 0.2 : brillo });
  }

  /* Las piezas que usan las escenas */
  const c = {
    fijo, movil,
    tubo(grupo, puntos, color, radio, op = {}) {
      if (puntos.length < 2) return;
      const curva = puntos.length === 2 ? new THREE.LineCurve3(puntos[0], puntos[1]) : new THREE.CatmullRomCurve3(puntos, false, 'centripetal');
      const pasos = Math.min(220, Math.max(2, puntos.length * 2));
      const mat = solido(color, op.brillo);
      if (op.opacidad != null || op.desde != null) difuso(mat, op.opacidad == null ? 1 : op.opacidad, op.desde, grupoDe(grupo));
      grupo.add(new THREE.Mesh(new THREE.TubeGeometry(curva, pasos, radio, 10, false), mat));
    },
    linea(grupo, puntos, color, opacidad, op = {}) {
      const geo = new THREE.BufferGeometry().setFromPoints(puntos);
      const mat = op.discontinua
        ? new THREE.LineDashedMaterial({ color, dashSize: 0.07, gapSize: 0.07, transparent: true, opacity: opacidad })
        : new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacidad });
      if (op.desde != null) difuso(mat, opacidad, op.desde, grupoDe(grupo));
      const l = new THREE.Line(geo, mat);
      if (op.discontinua) l.computeLineDistances();
      grupo.add(l);
    },
    cara(grupo, vertices, color, opacidad, op = {}) {
      const pos = [];
      for (let i = 1; i < vertices.length - 1; i++) {
        [vertices[0], vertices[i], vertices[i + 1]].forEach((p) => pos.push(p.x, p.y, p.z));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({ color, transparent: true, opacity: opacidad, side: THREE.DoubleSide, depthWrite: false, roughness: 0.6 });
      if (!op.fondo) difuso(mat, opacidad, op.desde, grupoDe(grupo));
      grupo.add(new THREE.Mesh(geo, mat));
    },
    /* Una cinta vertical entre dos curvas con el mismo número de puntos */
    cinta(grupo, abajo, arriba, color, opacidad, op = {}) {
      const pos = [];
      for (let i = 0; i < abajo.length - 1; i++) {
        [abajo[i], abajo[i + 1], arriba[i], abajo[i + 1], arriba[i + 1], arriba[i]].forEach((p) => pos.push(p.x, p.y, p.z));
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacidad, side: THREE.DoubleSide, depthWrite: false });
      difuso(mat, opacidad, op.desde, grupoDe(grupo));
      grupo.add(new THREE.Mesh(geo, mat));
    },
    /* Superficie h = f(a, b), coloreada por altura, con su rejilla */
    superficie(grupo, f, [a0, a1], [b0, b1], n, mapa, hMax, cada) {
      const paradas = [new THREE.Color(0x17408C), new THREE.Color(0x2F6FE0), new THREE.Color(0xAFCFFB)];
      const tono = (k) => {
        k = limitar(k, 0, 1);
        return k < 0.5 ? paradas[0].clone().lerp(paradas[1], k * 2) : paradas[1].clone().lerp(paradas[2], (k - 0.5) * 2);
      };
      const pos = [], col = [], idx = [], rej = [];
      const punto = (i, j) => {
        const a = a0 + (a1 - a0) * i / n, b = b0 + (b1 - b0) * j / n;
        return { p: mapa(a, b, f(a, b)), h: f(a, b) };
      };
      for (let j = 0; j <= n; j++) {
        for (let i = 0; i <= n; i++) {
          const { p, h } = punto(i, j), t = tono(h / hMax);
          pos.push(p.x, p.y, p.z); col.push(t.r, t.g, t.b);
        }
      }
      for (let j = 0; j < n; j++) {
        for (let i = 0; i < n; i++) {
          const q = j * (n + 1) + i;
          idx.push(q, q + 1, q + n + 1, q + 1, q + n + 2, q + n + 1);
        }
      }
      for (let k = 0; k <= n; k += cada) {
        for (let i = 0; i < n; i++) {
          [punto(i, k).p, punto(i + 1, k).p, punto(k, i).p, punto(k, i + 1).p].forEach((p) => rej.push(p.x, p.y, p.z));
        }
      }
      const geo = new THREE.BufferGeometry();
      geo.setIndex(idx);
      geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      geo.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.5, metalness: 0.05, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
      });
      difuso(mat, 0.9, 0.1, grupoDe(grupo));
      grupo.add(new THREE.Mesh(geo, mat));
      const gl = new THREE.BufferGeometry();
      gl.setAttribute('position', new THREE.Float32BufferAttribute(rej, 3));
      const ml = new THREE.LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.16 });
      difuso(ml, 0.16, 0.25, grupoDe(grupo));
      grupo.add(new THREE.LineSegments(gl, ml));
    },
    /* El punto: una esfera blanca con un halo que late */
    punto(pos) {
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.085, 28, 18), solido(0xFFFFFF, 0.55));
      e.position.copy(pos);
      movil.add(e);
      const halo = new THREE.Mesh(
        new THREE.RingGeometry(0.11, 0.15, 48),
        new THREE.MeshBasicMaterial({ color: COLOR.vivo, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })
      );
      escena.add(halo);
      halos.push({ malla: halo, local: pos.clone() });
    },
    etiqueta(texto, pos, op = {}) {
      const el = document.createElement('span');
      el.className = 'etq ' + (op.clase || '');
      el.textContent = texto;
      capa.appendChild(el);
      const e = { el, pos: pos.clone(), desde: op.desde || 0, ancla: op.ancla === 'derecha' ? '-100%, -150%' : '-50%, -50%' };
      etiquetas.push(e);
      return e;
    }
  };

  function vaciar(grupo) {
    grupo.traverse((h) => { if (h.geometry) h.geometry.dispose(); if (h.material) h.material.dispose(); });
    while (grupo.children.length) grupo.remove(grupo.children[0]);
  }
  function quitarHalos() {
    halos.forEach((h) => { escena.remove(h.malla); h.malla.geometry.dispose(); h.malla.material.dispose(); });
    halos = [];
  }

  /* El gráfico se levanta sobre su eje: s = 0 es plano, s = 1 es 3D */
  function desplegar() {
    const sc = Math.max(s, 0.0015), piv = esc.pivote(valor);
    mundo.scale.set(1, 1, 1); mundo.position.set(0, 0, 0);
    mundo.scale[esc.eje] = sc;
    mundo.position[esc.eje] = piv * (1 - sc);
    mundo.updateMatrixWorld(true);
    difusos.forEach((d) => {
      const k = d.desde >= 1 ? 1 : limitar((s - d.desde) / (1 - d.desde), 0, 1);
      d.material.opacity = d.base * k;
      d.material.visible = d.material.opacity > 0.004;
    });
  }
  function colocarCamara() {
    const sp = Math.sin(cam.phi), estrecho = ancho < 560 ? 1.3 : (ancho / alto < 1 ? 1.18 : 1), r = cam.radio * estrecho;
    camara.position.set(objetivo.x + r * sp * Math.sin(cam.theta), objetivo.y + r * Math.cos(cam.phi), objetivo.z + r * sp * Math.cos(cam.theta));
    camara.lookAt(objetivo);
    camara.updateMatrixWorld();
  }
  function rotular(t) {
    halos.forEach((h) => {
      h.malla.position.copy(h.local).applyMatrix4(mundo.matrixWorld);
      h.malla.quaternion.copy(camara.quaternion);
      const k = quieto ? 0.4 : (t * 0.8) % 1;
      h.malla.scale.setScalar(1 + k * 1.3);
      h.malla.material.opacity = 0.85 * (1 - k);
    });
    etiquetas.forEach((e) => {
      aux.copy(e.pos).applyMatrix4(mundo.matrixWorld).project(camara);
      if (!e.mitad) e.mitad = e.el.offsetWidth / 2;
      // que ninguna etiqueta se salga por los costados del panel
      const x = limitar((aux.x * 0.5 + 0.5) * ancho, e.mitad + 6, ancho - e.mitad - 6), y = (-aux.y * 0.5 + 0.5) * alto;
      e.el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) translate(' + e.ancla + ')';
      const k = e.desde ? limitar((s - e.desde) / (1 - e.desde), 0, 1) : 1;
      e.el.style.opacity = aux.z < 1 ? k : 0;
    });
  }

  function cuadro(ahora) {
    if (!visible || document.hidden || !esc) { corriendo = false; return; }
    corriendo = true;
    const t = ahora / 1000;
    if (intro.activa) {
      if (intro.t0 === null) intro.t0 = t + 0.35;       // una pausa breve para que se vea plano
      const k = limitar((t - intro.t0) / DURACION, 0, 1), e = suave(k);
      ['theta', 'phi', 'radio'].forEach((p) => { cam[p] = esc.inicio[p] + (esc.final[p] - esc.inicio[p]) * e; });
      s = suave(limitar((k - 0.1) / 0.75, 0, 1));
      if (k >= 1) { intro.activa = false; vaivenT0 = t; }
    } else if (!quieto && !arrastre && t - ultimoToque > 5) {
      // Se mece sola, despacio; después de arrastrar vuelve suave a su vaivén
      const meta = esc.final.theta + VAIVEN * Math.sin((t - vaivenT0) * 0.35);
      cam.theta += (meta - cam.theta) * 0.03;
      cam.phi += (esc.final.phi - cam.phi) * 0.02;
    }
    desplegar();
    colocarCamara();
    renderer.render(escena, camara);
    rotular(t);
    requestAnimationFrame(cuadro);
  }
  function arrancar() { if (visible && !corriendo && esc) requestAnimationFrame(cuadro); }

  function ajustar() {
    const w = caja.clientWidth, h = caja.clientHeight;
    if (!w || !h) return;
    ancho = w; alto = h;
    renderer.setSize(w, h, false);
    camara.aspect = w / h;
    camara.updateProjectionMatrix();
  }
  new ResizeObserver(() => { ajustar(); arrancar(); }).observe(caja);
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; arrancar(); }, { rootMargin: '80px' }).observe(caja);
  document.addEventListener('visibilitychange', arrancar);

  /* Girar con el mouse o el dedo */
  lienzo.addEventListener('pointerdown', (e) => {
    arrastre = { x: e.clientX, y: e.clientY };
    intro.activa = false; s = 1;
    try { lienzo.setPointerCapture(e.pointerId); } catch (err) { /* sin captura */ }
  });
  lienzo.addEventListener('pointermove', (e) => {
    if (!arrastre) return;
    const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
    arrastre = { x: e.clientX, y: e.clientY };
    cam.theta -= dx * 0.008;
    if (e.pointerType !== 'touch') cam.phi = limitar(cam.phi - dy * 0.006, 0.08, 1.52);
  });
  const soltar = () => { if (arrastre) ultimoToque = performance.now() / 1000; arrastre = null; };
  lienzo.addEventListener('pointerup', soltar);
  lienzo.addEventListener('pointercancel', soltar);

  return {
    cargar(id, v) {
      vaciar(fijo); vaciar(movil); quitarHalos();
      etiquetas.forEach((e) => e.el.remove());
      difusos = []; etiquetas = [];
      esc = ESCENAS[id];
      valor = v;
      objetivo.set(...esc.objetivo);
      esc.armar(c);
      this.mover(v);
      this.repetir();
      ajustar();
    },
    mover(v) {
      if (!esc) return;
      valor = v;
      vaciar(movil); quitarHalos();
      difusos = difusos.filter((d) => d.grupo !== 'movil');
      esc.mover(v, c);
      if (!corriendo) { desplegar(); colocarCamara(); renderer.render(escena, camara); rotular(performance.now() / 1000); }
    },
    repetir() {
      if (!esc) return;
      ultimoToque = -1e9;
      if (quieto) {
        s = 1; Object.assign(cam, esc.final); intro.activa = false;
      } else {
        s = 0; Object.assign(cam, esc.inicio); intro.activa = true; intro.t0 = null;
      }
      arrancar();
    }
  };
}

let visor = null;
const disponible = !!caja && hayWebGL();
window.BackBone3D = {
  disponible,
  hay: (id) => !!ESCENAS[id],
  explica: (id) => (ESCENAS[id] ? ESCENAS[id].explica : ''),
  cargar(id, v) {
    if (!disponible) return;
    try {
      if (!visor) visor = crearVisor();
      visor.cargar(id, v);
    } catch (e) {
      // Si algo falla, la página sigue con la vista 2D
      window.BackBone3D.disponible = false;
      document.dispatchEvent(new CustomEvent('backbone3d:falla'));
      if (window.console) console.error(e);
    }
  },
  mover(v) { if (visor) visor.mover(v); },
  repetir() { if (visor) visor.repetir(); }
};
document.dispatchEvent(new CustomEvent('backbone3d:listo'));
