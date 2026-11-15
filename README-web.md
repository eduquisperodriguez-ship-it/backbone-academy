# Web de BackBone Academy

Página principal de la academia, estilo plataforma de cursos. Es HTML, CSS y JavaScript sin dependencias ni paso de compilación: se abre con doble clic y se publica tal cual en GitHub Pages.

## Archivos

```
index.html                 La página: todo el contenido está aquí
assets/css/academy.css     Colores, tipografía y diseño
assets/js/academy.js       Menú, programas, botón Explorar y buscador
assets/js/graficos.js      Los gráficos interactivos de cada programa
assets/img/logo-academy.svg     Logo
assets/img/favicon-academy.svg  Ícono de la pestaña
```

## Cómo está en el repositorio

- `index.html` es la portada del sitio. El portafolio que antes estaba ahí ahora es `portafolio.html`.
- Las calculadoras siguen en `herramientas/` y la portada las enlaza desde ahí.
- `academia/` guarda la versión anterior de la web de la academia (la del 3D).

## Cómo añadir contenido

Cada sección de `index.html` empieza con un comentario que explica qué copiar.

- **Un programa:** copia una tarjeta `<button class="tarjeta pestana">` y una ficha `<article class="programa">`, con el mismo nombre corto en `data-programa` y en el `id`. Para su gráfico, añade una entrada con ese nombre en `assets/js/graficos.js`.
- **Una calculadora o un simulador:** copia un `<li class="tarjeta">` dentro de la sección `#practica`.
- **Una publicación:** copia un `<li class="tarjeta">` dentro de `#publicaciones`.
- **Una foto en la portada:** reemplaza el `<div class="portada-arte">` por un `<img>`.

El buscador y el pie no se tocan: el buscador lee la página y encuentra solo lo nuevo.

## Colores

Están al inicio de `academy.css`, en `:root`. Cambiar `--enfasis` y `--boton` cambia el azul de toda la web.
