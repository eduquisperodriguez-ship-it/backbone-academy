/* BackBone Academy: escenas 3D de la web de la academia.
   Logo vertebral en el inicio y un gráfico interactivo por curso.
   Usa Three.js 0.170 (assets/vendor/three), sin servicios externos. */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/CSS2DRenderer.js';
import { RoundedBoxGeometry } from 'three/addons/RoundedBoxGeometry.js';

const COLOR = {
  medianoche: 0x0D1220, profundo: 0x16213A, pizarra: 0x18233A,
  acero: 0x5A7BB0, aceroVivo: 0x7D9CCF, niebla: 0xAEBFDB, marfil: 0xF3F1EB,
  fondoSuperficie: 0x2B3E66,
};
const sinMovimiento = matchMedia('(prefers-reduced-motion: reduce)').matches;
const coma = (n, d = 2) => n.toFixed(d).replace('.', ',');

function hayWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

/* ── Visor: escena, cámara, luces, controles y bucle que solo corre si se ve ── */
function crearVisor(contenedor, { posicion, objetivo = [0, 0, 0], fov = 32, orbitar = true, autoGiro = true }) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.localClippingEnabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  contenedor.appendChild(renderer.domElement);

  const etiquetas = new CSS2DRenderer();
  etiquetas.domElement.className = 'capa-etiquetas';
  contenedor.appendChild(etiquetas.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  camara.position.set(...posicion);

  escena.add(new THREE.HemisphereLight(COLOR.marfil, COLOR.pizarra, 1.5));
  const clave = new THREE.DirectionalLight(COLOR.marfil, 2.1);
  clave.position.set(6, 10, 7);
  escena.add(clave);
  const contra = new THREE.DirectionalLight(COLOR.aceroVivo, 1.2);
  contra.position.set(-7, 4, -6);
  escena.add(contra);

  let controles = null;
  if (orbitar) {
    controles = new OrbitControls(camara, renderer.domElement);
    controles.target.set(...objetivo);
    controles.enableZoom = false;
    controles.enablePan = false;
    controles.enableDamping = true;
    controles.dampingFactor = 0.08;
    controles.minPolarAngle = 0.25;
    controles.maxPolarAngle = Math.PI / 2.05;
    controles.autoRotate = autoGiro && !sinMovimiento;
    controles.autoRotateSpeed = 0.7;
    controles.addEventListener('start', () => { controles.autoRotate = false; });
    // En celulares, el dedo arriba/abajo sigue desplazando la página
    renderer.domElement.style.touchAction = 'pan-y';
    controles.update();
  } else {
    camara.lookAt(...objetivo);
  }

  const alCuadro = [];
  let visible = false, corriendo = false, reloj = new THREE.Clock();

  function ajustar() {
    const w = contenedor.clientWidth, h = contenedor.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    etiquetas.setSize(w, h);
    camara.aspect = w / h;
    camara.zoom = orbitar && camara.aspect < 1.2 ? 0.84 : 1;   // en pantallas angostas se aleja un poco
    camara.updateProjectionMatrix();
    dibujar();
  }
  function dibujar() {
    renderer.render(escena, camara);
    etiquetas.render(escena, camara);
  }
  function bucle() {
    if (!visible) { corriendo = false; return; }
    corriendo = true;
    const t = reloj.getElapsedTime();
    alCuadro.forEach(fn => fn(t));
    if (controles) controles.update();
    dibujar();
    requestAnimationFrame(bucle);
  }
  new ResizeObserver(ajustar).observe(contenedor);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !corriendo) requestAnimationFrame(bucle);
  }, { rootMargin: '120px' }).observe(contenedor);
  ajustar();

  return { escena, camara, renderer, controles, alCuadro, dibujar };
}

/* ── Piezas reutilizables ───────────────────────────────── */
function etiqueta(texto, pos, clase = '') {
  const div = document.createElement('div');
  div.className = 'etq3d ' + clase;
  div.textContent = texto;
  const obj = new CSS2DObject(div);
  obj.position.set(...pos);
  return obj;
}

function tubo(puntos, color, radio = 0.03, opacidad = 1) {
  const curva = new THREE.CatmullRomCurve3(puntos.map(p => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curva, Math.max(16, puntos.length * 2), radio, 8, false);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.1, transparent: opacidad < 1, opacity: opacidad });
  return new THREE.Mesh(geo, mat);
}

function esfera(color, radio = 0.09) {
  return new THREE.Mesh(
    new THREE.SphereGeometry(radio, 24, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.3, metalness: 0.1, emissive: color, emissiveIntensity: 0.25 })
  );
}

function lineas(segmentos, color, opacidad) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(segmentos, 3));
  return new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: opacidad }));
}

/* Ejes desde un origen con flecha y nombre */
function ejes(grupo, origen, largos, nombres) {
  const [ox, oy, oz] = origen;
  const dirs = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  dirs.forEach((d, i) => {
    const L = largos[i];
    const fin = [ox + d[0] * L, oy + d[1] * L, oz + d[2] * L];
    grupo.add(tubo([origen, fin], COLOR.marfil, 0.012, 0.85));
    const cono = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.14, 16), new THREE.MeshStandardMaterial({ color: COLOR.marfil }));
    cono.position.set(...fin);
    cono.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(...d));
    grupo.add(cono);
    const extra = 0.24;
    grupo.add(etiqueta(nombres[i], [fin[0] + d[0] * extra, fin[1] + d[1] * extra, fin[2] + d[2] * extra], 'eje'));
  });
}

/* Cuadrícula del piso en el plano y = altura */
function piso(grupo, x0, x1, z0, z1, pasos, altura = 0) {
  const s = [];
  for (let i = 0; i <= pasos; i++) {
    const x = x0 + (x1 - x0) * i / pasos, z = z0 + (z1 - z0) * i / pasos;
    s.push(x, altura, z0, x, altura, z1, x0, altura, z, x1, altura, z);
  }
  grupo.add(lineas(s, COLOR.niebla, 0.12));
}

/* Superficie y = f(x, z) con color por altura y malla fina encima */
function superficie(f, [x0, x1], [z0, z1], n, [ymin, ymax], opacidad = 0.94) {
  const geo = new THREE.PlaneGeometry(1, 1, n, n);
  const pos = geo.attributes.position;
  const colores = [];
  const c0 = new THREE.Color(COLOR.fondoSuperficie), c1 = new THREE.Color(COLOR.aceroVivo), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i) + 0.5, v = pos.getY(i) + 0.5;
    const x = x0 + (x1 - x0) * u, z = z0 + (z1 - z0) * v;
    const y = f(x, z);
    pos.setXYZ(i, x, y, z);
    c.lerpColors(c0, c1, THREE.MathUtils.clamp((y - ymin) / (ymax - ymin), 0, 1));
    colores.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3));
  geo.computeVertexNormals();
  const malla = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, side: THREE.DoubleSide, roughness: 0.55, metalness: 0.05,
    transparent: opacidad < 1, opacity: opacidad, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  }));
  // malla de alambre cada pocas filas, para leer la forma
  const s = [], k = 8;
  for (let a = 0; a <= k; a++) {
    for (let b = 0; b < n; b++) {
      const xa = x0 + (x1 - x0) * a / k;
      const za = z0 + (z1 - z0) * b / n, zb = z0 + (z1 - z0) * (b + 1) / n;
      s.push(xa, f(xa, za), za, xa, f(xa, zb), zb);
      const zc = z0 + (z1 - z0) * a / k;
      const xb = x0 + (x1 - x0) * b / n, xc = x0 + (x1 - x0) * (b + 1) / n;
      s.push(xb, f(xb, zc), zc, xc, f(xc, zc), zc);
    }
  }
  const alambre = lineas(s, COLOR.marfil, 0.16);
  const grupo = new THREE.Group();
  grupo.add(malla, alambre);
  return grupo;
}

function limpiar(obj) {
  obj.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    if (o.element && o.element.remove) o.element.remove();
  });
  if (obj.parent) obj.parent.remove(obj);
}

/* ── Logo B vertebral en 3D (inicio) ────────────────────── */
function logoVertebral(contenedor) {
  const v = crearVisor(contenedor, { posicion: [0, 0.3, 13.6], fov: 30, orbitar: false });
  const frente = new THREE.DirectionalLight(COLOR.marfil, 1.5);
  frente.position.set(1, 2, 12);
  v.escena.add(frente);
  const S = 1 / 22;                                  // 1 unidad del manual = S unidades 3D
  const grupo = new THREE.Group();
  v.escena.add(grupo);

  const prof = 24;
  const matHueso = new THREE.MeshStandardMaterial({ color: COLOR.marfil, roughness: 0.42, metalness: 0.02 });
  const matArco = new THREE.MeshStandardMaterial({ color: COLOR.acero, roughness: 0.32, metalness: 0.18 });

  // vértebras de 30 × 36 con radio 9, separadas por 6 (retícula 100 × 120)
  const vertebras = [0, 42, 84].map((y, i) => {
    const m = new THREE.Mesh(new RoundedBoxGeometry(30 * S, 36 * S, prof * S, 6, 8 * S), matHueso);
    m.userData.base = new THREE.Vector3((15 - 50) * S, (60 - (y + 18)) * S, 0);
    m.position.copy(m.userData.base);
    grupo.add(m);
    return m;
  });

  // arcos: el trazo del manual, extruido
  const arco = (y0, ancho) => {
    const r = 28.5, ri = 13.5, cx = 36 + ancho - r;
    const sh = new THREE.Shape();
    const Y = y => 60 - y, X = x => x - 50;      // retícula → centro, y hacia arriba
    sh.moveTo(X(36), Y(y0));
    sh.lineTo(X(cx), Y(y0));
    sh.absarc(X(cx), Y(y0 + r), r, Math.PI / 2, -Math.PI / 2, true);
    sh.lineTo(X(36), Y(y0 + 57));
    sh.lineTo(X(36), Y(y0 + 42));
    sh.lineTo(X(cx), Y(y0 + 42));
    sh.absarc(X(cx), Y(y0 + r), ri, -Math.PI / 2, Math.PI / 2, false);
    sh.lineTo(X(36), Y(y0 + 15));
    sh.closePath();
    const geo = new THREE.ExtrudeGeometry(sh, { depth: prof - 4, bevelEnabled: true, bevelThickness: 2, bevelSize: 1.6, bevelSegments: 4, curveSegments: 48 });
    geo.translate(0, 0, -(prof - 4) / 2);
    geo.scale(S, S, S);
    const m = new THREE.Mesh(geo, matArco);
    grupo.add(m);
    return m;
  };
  const arcos = [arco(0, 61.5 - 36 + 28.5), arco(63, 71.5 - 36 + 28.5)];

  // armado al cargar: las vértebras bajan de una en una, luego aparecen los arcos
  const inicio = performance.now();
  const llegada = [0.45, 0.25, 0.05];               // la de abajo primero
  vertebras.forEach(m => { m.position.y += 2.2; m.scale.setScalar(0.001); });
  arcos.forEach(m => { m.scale.set(0.001, 1, 1); });
  const suave = t => 1 - Math.pow(1 - THREE.MathUtils.clamp(t, 0, 1), 3);

  let mx = 0, my = 0, tx = 0, ty = 0;
  window.addEventListener('pointermove', e => {
    tx = (e.clientX / window.innerWidth - 0.5) * 2;
    ty = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  v.alCuadro.push(t => {
    const s = sinMovimiento ? 99 : (performance.now() - inicio) / 1000;
    vertebras.forEach((m, i) => {
      const k = suave((s - llegada[i]) / 0.7);
      m.position.y = m.userData.base.y + (1 - k) * 2.2;
      m.scale.setScalar(Math.max(k, 0.001));
    });
    arcos.forEach((m, i) => { m.scale.x = Math.max(suave((s - 1.05 - i * 0.2) / 0.6), 0.001); });
    mx += (tx - mx) * 0.05; my += (ty - my) * 0.05;
    const vaiven = sinMovimiento ? 0 : Math.sin(t * 0.45) * 0.32;
    grupo.rotation.y = -0.42 + vaiven + mx * 0.35;
    grupo.rotation.x = 0.08 + my * 0.16;
  });
  v.dibujar();
}

/* ── Matemática: superficie, plano tangente y derivadas parciales ── */
function graficoMate(contenedor, control, lectura) {
  const v = crearVisor(contenedor, { posicion: [7.6, 5.6, 8.8], objetivo: [0, -0.2, 0] });
  const f = (x, z) => (x * x - z * z) / 2;          // silla de montar: f(x, y) = (x² − y²)/2
  const fijo = new THREE.Group(); v.escena.add(fijo);
  fijo.add(superficie(f, [-2, 2], [-2, 2], 48, [-2, 2], 0.9));
  ejes(fijo, [-2.2, -2.2, -2.2], [4.6, 4.6, 4.6], ['x', 'f(x, y)', 'y']);
  piso(fijo, -2.2, 2.2, -2.2, 2.2, 8, -2.2);

  const y0 = 0.9;
  let dinamico = null;
  function actualizar() {
    const x0 = parseFloat(control.value);
    if (dinamico) limpiar(dinamico);
    dinamico = new THREE.Group(); v.escena.add(dinamico);
    const z = f(x0, y0);
    // traza en x (y fijo) y traza en y (x fijo): el ceteris paribus
    const trazaX = [], trazaY = [];
    for (let i = 0; i <= 40; i++) {
      const s = -2 + 4 * i / 40;
      trazaX.push([s, f(s, y0) + 0.01, y0]);
      trazaY.push([x0, f(x0, s) + 0.01, s]);
    }
    dinamico.add(tubo(trazaX, COLOR.aceroVivo, 0.028));
    dinamico.add(tubo(trazaY, COLOR.marfil, 0.028));
    // plano tangente: z = f(x0,y0) + fx (x − x0) + fy (y − y0)
    const fx = x0, fy = -y0, h = 0.85;
    const pts = [[-h, -h], [h, -h], [h, h], [-h, h]].map(([a, b]) => new THREE.Vector3(x0 + a, z + fx * a + fy * b, y0 + b));
    const geo = new THREE.BufferGeometry().setFromPoints([pts[0], pts[1], pts[2], pts[0], pts[2], pts[3]]);
    geo.computeVertexNormals();
    dinamico.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: COLOR.marfil, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })));
    dinamico.add(lineas([...pts, pts[0]].flatMap((p, i, a) => i < 4 ? [p.x, p.y, p.z, a[i + 1].x, a[i + 1].y, a[i + 1].z] : []), COLOR.marfil, 0.6));
    const p = esfera(COLOR.marfil, 0.085); p.position.set(x0, z, y0); dinamico.add(p);
    dinamico.add(etiqueta('∂f/∂x', [x0 + 1.25, z + fx * 1.25 + 0.15, y0], 'acero'));
    lectura.innerHTML = `<em>x₀</em> = ${coma(x0)}&nbsp; <em>∂f/∂x</em> = ${coma(fx)}&nbsp; <em>∂f/∂y</em> = ${coma(fy)}`;
    v.dibujar();
  }
  control.addEventListener('input', actualizar);
  actualizar();
}

/* ── Microeconomía: utilidad Cobb-Douglas, curvas de indiferencia y presupuesto ── */
function graficoMicro(contenedor, control, lectura) {
  const v = crearVisor(contenedor, { posicion: [-4.2, 6.0, -8.6], objetivo: [2, 1.0, 2] });
  const a = 0.6, s = 0.4, alto = 0.34;              // U = x^0,6 · y^0,4; 10 unidades = 4 en 3D
  const U = (x, y) => Math.pow(Math.max(x, 0), a) * Math.pow(Math.max(y, 0), 1 - a);
  const f = (X, Z) => U(X / s, Z / s) * alto;
  const fijo = new THREE.Group(); v.escena.add(fijo);
  fijo.add(superficie(f, [0, 4], [0, 4], 50, [0, 10 * alto], 0.9));
  ejes(fijo, [0, 0, 0], [4.5, 3.9, 4.5], ['x', 'U', 'y']);
  piso(fijo, 0, 4, 0, 4, 10);

  // curvas de indiferencia: sobre la superficie y su sombra en el piso
  const curvaU = (k) => {
    const xmin = Math.pow(Math.pow(k, 1 / (1 - a)) / 10, (1 - a) / a);
    const pts = [];
    for (let i = 0; i <= 50; i++) {
      const x = xmin + (10 - xmin) * Math.pow(i / 50, 1.6);
      const y = Math.pow(k / Math.pow(x, a), 1 / (1 - a));
      if (y <= 10.0001) pts.push([x * s, k * alto, Math.min(y, 10) * s]);
    }
    return pts;
  };
  [2, 4, 6, 8].forEach(k => {
    const pts = curvaU(k);
    fijo.add(tubo(pts.map(([x, y, z]) => [x, y + 0.01, z]), COLOR.niebla, 0.012, 0.75));
    fijo.add(tubo(pts.map(([x, , z]) => [x, 0.005, z]), COLOR.niebla, 0.008, 0.35));
  });

  let dinamico = null;
  function actualizar() {
    const I = parseFloat(control.value);              // precios px = py = 1
    if (dinamico) limpiar(dinamico);
    dinamico = new THREE.Group(); v.escena.add(dinamico);
    const xa = Math.max(0, I - 10), xb = Math.min(10, I);
    // plano vertical del presupuesto x + y = I
    const H = 3.6;
    const A = new THREE.Vector3(xa * s, 0, (I - xa) * s), B = new THREE.Vector3(xb * s, 0, (I - xb) * s);
    const geo = new THREE.BufferGeometry().setFromPoints([A, B, B.clone().setY(H), A, B.clone().setY(H), A.clone().setY(H)]);
    geo.computeVertexNormals();
    dinamico.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: COLOR.marfil, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false })));
    dinamico.add(tubo([[A.x, 0.01, A.z], [B.x, 0.01, B.z]], COLOR.marfil, 0.02));
    // utilidad a lo largo del presupuesto
    const sobre = [];
    for (let i = 0; i <= 40; i++) { const x = xa + (xb - xa) * i / 40; sobre.push([x * s, U(x, I - x) * alto + 0.015, (I - x) * s]); }
    dinamico.add(tubo(sobre, COLOR.aceroVivo, 0.026));
    // óptimo: x* = 0,6 I, y* = 0,4 I
    const xs = a * I, ys = (1 - a) * I, us = U(xs, ys);
    dinamico.add(tubo(curvaU(us).map(([x, y, z]) => [x, y + 0.02, z]), COLOR.marfil, 0.02));
    const p = esfera(COLOR.marfil, 0.09); p.position.set(xs * s, us * alto + 0.02, ys * s); dinamico.add(p);
    const q = esfera(COLOR.aceroVivo, 0.06); q.position.set(xs * s, 0.01, ys * s); dinamico.add(q);
    dinamico.add(tubo([[xs * s, 0, ys * s], [xs * s, us * alto, ys * s]], COLOR.marfil, 0.008, 0.6));
    dinamico.add(etiqueta('óptimo', [xs * s, us * alto + 0.35, ys * s]));
    lectura.innerHTML = `<em>x*</em> = ${coma(xs, 1)}&nbsp; <em>y*</em> = ${coma(ys, 1)}&nbsp; <em>U*</em> = ${coma(us)}`;
    v.dibujar();
  }
  control.addEventListener('input', actualizar);
  actualizar();
}

/* ── Macroeconomía: IS-LM con el gasto público como tercer eje ── */
function graficoMacro(contenedor, control, lectura) {
  const v = crearVisor(contenedor, { posicion: [9.6, 5.4, 7.8], objetivo: [2, 1.25, 2] });
  const sY = 0.4, sG = 0.4, sR = 0.33, rMax = 8.5;
  const IS = (Y, G) => 1.5 + 0.6 * G - 0.55 * Y;    // r que equilibra el mercado de bienes
  const LM = (Y) => 0.9 * Y - 2.5;                  // r que equilibra el mercado de dinero
  const fijo = new THREE.Group(); v.escena.add(fijo);
  const corte = [new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Plane(new THREE.Vector3(0, -1, 0), rMax * sR)];

  const plano = (fn, color, opacidad) => {
    const geo = new THREE.PlaneGeometry(1, 1, 20, 20);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const Y = (pos.getX(i) + 0.5) * 10, G = (pos.getY(i) + 0.5) * 10;
      pos.setXYZ(i, Y * sY, fn(Y, G) * sR, G * sG);
    }
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacidad, side: THREE.DoubleSide, depthWrite: false, clippingPlanes: corte }));
  };
  fijo.add(plano((Y, G) => IS(Y, G), COLOR.acero, 0.5));
  fijo.add(plano((Y) => LM(Y), COLOR.niebla, 0.3));
  ejes(fijo, [0, 0, 0], [4.5, rMax * sR + 0.3, 4.5], ['Y', 'r', 'G']);
  piso(fijo, 0, 4, 0, 4, 10);
  // camino del equilibrio cuando cambia G
  const camino = [];
  for (let i = 0; i <= 30; i++) { const G = 0.5 + 9.5 * i / 30, Y = (4 + 0.6 * G) / 1.45; camino.push([Y * sY, LM(Y) * sR + 0.01, G * sG]); }
  fijo.add(tubo(camino, COLOR.niebla, 0.018, 0.9));
  fijo.add(etiqueta('IS', [0.15, IS(0.4, 10) * sR, 10 * sG + 0.1], 'acero'));
  fijo.add(etiqueta('LM', [10 * sY + 0.1, rMax * sR - 0.1, 0.2]));

  let dinamico = null;
  function actualizar() {
    const G = parseFloat(control.value);
    if (dinamico) limpiar(dinamico);
    dinamico = new THREE.Group(); v.escena.add(dinamico);
    const corteIS = [], corteLM = [];
    for (let i = 0; i <= 20; i++) {
      const Y = 10 * i / 20;
      const ri = IS(Y, G), rl = LM(Y);
      if (ri >= 0 && ri <= rMax) corteIS.push([Y * sY, ri * sR, G * sG]);
      if (rl >= 0 && rl <= rMax) corteLM.push([Y * sY, rl * sR, G * sG]);
    }
    if (corteIS.length > 1) dinamico.add(tubo([corteIS[0], corteIS[corteIS.length - 1]], COLOR.aceroVivo, 0.03));
    if (corteLM.length > 1) dinamico.add(tubo([corteLM[0], corteLM[corteLM.length - 1]], COLOR.marfil, 0.03));
    const Ye = (4 + 0.6 * G) / 1.45, re = LM(Ye);
    const p = esfera(COLOR.marfil, 0.09); p.position.set(Ye * sY, re * sR, G * sG); dinamico.add(p);
    dinamico.add(tubo([[Ye * sY, 0, G * sG], [Ye * sY, re * sR, G * sG]], COLOR.marfil, 0.008, 0.6));
    dinamico.add(etiqueta('E', [Ye * sY + 0.12, re * sR + 0.3, G * sG]));
    lectura.innerHTML = `<em>G</em> = ${coma(G, 1)}&nbsp; <em>Y*</em> = ${coma(Ye)}&nbsp; <em>r*</em> = ${coma(re)} %`;
    v.dibujar();
  }
  control.addEventListener('input', actualizar);
  actualizar();
}

/* ── Arranque ───────────────────────────────────────────── */
const $ = id => document.getElementById(id);
if (!hayWebGL()) {
  document.documentElement.classList.add('sin-3d');
} else {
  document.documentElement.classList.add('con-3d');
  try { logoVertebral($('logo-3d')); } catch (e) { console.error(e); }
  const graficos = [
    ['g-mate', 'c-mate', 'l-mate', graficoMate],
    ['g-micro', 'c-micro', 'l-micro', graficoMicro],
    ['g-macro', 'c-macro', 'l-macro', graficoMacro],
  ];
  graficos.forEach(([g, c, l, fn]) => {
    try { fn($(g), $(c), $(l)); } catch (e) { console.error(e); $(g).closest('.fig3d').classList.add('fallo'); }
  });
}
