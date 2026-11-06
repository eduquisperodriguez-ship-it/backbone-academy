# BackBone Academy

Portafolio de **BackBone Academy**, antes Quantum Economics & Analytics: tutorías de economía y matemática en Trujillo, Perú.

**Sitio:** https://eduquisperodriguez-ship-it.github.io/backbone-academy/

| Página | Ruta |
|---|---|
| Portafolio | [`/`](https://eduquisperodriguez-ship-it.github.io/backbone-academy/) |
| Web de la academia | [`/academia/`](https://eduquisperodriguez-ship-it.github.io/backbone-academy/academia/) |
| Monopolio y discriminación de precios | [`/herramientas/monopolio/`](https://eduquisperodriguez-ship-it.github.io/backbone-academy/herramientas/monopolio/) |
| Monopolio de tercer grado con plantas | [`/herramientas/monopolio-tercer-grado/`](https://eduquisperodriguez-ship-it.github.io/backbone-academy/herramientas/monopolio-tercer-grado/) |
| Duopolio y teoría de juegos | [`/herramientas/duopolio/`](https://eduquisperodriguez-ship-it.github.io/backbone-academy/herramientas/duopolio/) |
| Oligopolio: Cournot, Bertrand y Stackelberg | [`/herramientas/oligopolios/`](https://eduquisperodriguez-ship-it.github.io/backbone-academy/herramientas/oligopolios/) |
| Web de Quantum, primera versión (archivo) | [`/archivo/quantum-v1/`](https://eduquisperodriguez-ship-it.github.io/backbone-academy/archivo/quantum-v1/) |
| Web de Quantum, segunda versión (archivo) | [`/archivo/quantum-v2/`](https://eduquisperodriguez-ship-it.github.io/backbone-academy/archivo/quantum-v2/) |

## Cómo está armado

Es un sitio estático: HTML, CSS y JavaScript sin compilar. Se puede abrir en Visual Studio Code y ver con la extensión *Live Server*, o con `python3 -m http.server` desde esta carpeta.

```
index.html                 portafolio
academia/                  web de tutorías con la marca BackBone
herramientas/              las cuatro calculadoras
archivo/                   las dos webs de Quantum, sin cambios de diseño
assets/css/backbone.css    colores, tipografía y piezas comunes
assets/css/herramientas.css  capa de marca para las calculadoras
assets/css/fuentes.css     Schibsted Grotesk, Instrument Sans e Instrument Serif (servidas desde el sitio)
assets/img/                logo, favicon y capturas
assets/vendor/             Chart.js 4.4.1 y qrcode 1.4.4
```

## Marca

Tomada del manual de marca del 7 de octubre de 2026.

| Color | HEX | Uso |
|---|---|---|
| Medianoche | `#0D1220` | fondo principal |
| Azul profundo | `#16213A` | fondo alterno |
| Azul pizarra | `#18233A` | texto sobre claro |
| Azul acero | `#5A7BB0` | acento, arcos de la B |
| Azul niebla | `#AEBFDB` | cursiva sobre oscuro |
| Piedra clara | `#E7E3DA` | fondo claro |
| Marfil | `#F3F1EB` | texto sobre oscuro |
| Gris pizarra | `#6B7385` | texto secundario |

El logo es una B hecha con tres vértebras de 30 × 36 (radio 9) y dos arcos, sobre una retícula de 100 × 120 con separación de 6: `assets/img/backbone-b.svg`.

## Cambios en las calculadoras

- **Monopolio:** el primer grado llamaba a `generateUniversalChart`, que no existía; el gráfico nunca aparecía y las fórmulas quedaban sin formato. Ahora la función está escrita y dibuja demanda, IMg, CMg y el óptimo.
- **Tercer grado:** si una planta tenía costo marginal inicial de 0, la tabla de tramos la trataba como si no existiera. Además, ahora avisa cuando una casilla no tiene un número.
- **Duopolio:** los pagos del árbol salían con todos los decimales; ahora se redondean a dos. Mensaje de error más claro si no carga Python.
- **Todas:** se quitó `polyfill.io` (dominio comprometido en 2024), Chart.js quedó fijado en la versión 4.4.1 y se agregó la barra de BackBone con regreso al portafolio.

## Redes

- Instagram: [@backbone.academy](https://www.instagram.com/backbone.academy/)
- TikTok: [@quantum.cls](https://www.tiktok.com/@quantum.cls)
- WhatsApp: [967 077 156](https://wa.me/51967077156)
