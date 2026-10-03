# Supervisión de la IA · sitio web

Sitio estático del whitebook «Supervisión de la IA. Seis decisiones que un consejo no puede delegar», de David Pereira Paz. Construido según `SPEC.md`.

## Propósito

Tres funciones:

1. Presentar el whitebook.
2. Ofrecer una autoevaluación gratuita para consejos de administración (18 afirmaciones, cálculo en el navegador).
3. Recoger el correo del lector a cambio del PDF o del resultado de la autoevaluación.

Sin código de servidor, sin cookies, sin analítica, sin dependencias en tiempo de ejecución. HTML5, CSS3 y JavaScript vanilla (ES2020).

## Vista previa local

No hay paso de compilación. Sirva la raíz del repositorio con cualquier servidor estático:

```sh
python3 -m http.server 8000
# o
npx serve .
```

Abra `http://localhost:8000/`.

## Configuración

### Endpoint del formulario (T-08)

Los formularios de `/whitebook/` y `/autoevaluacion/` envían un `POST` HTML plano a Formspree. El endpoint se define una sola vez por página, en el atributo `action` del `<form>`:

```html
<form action="https://formspree.io/f/[__]" method="POST">
```

Sustituya `[__]` por el identificador del formulario que le da Formspree al crearlo (plan gratuito). El campo oculto `_next` lleva la URL absoluta de `/gracias/`; cámbiela si usa dominio propio.

### Enlace privado del PDF (T-10)

El PDF no está en el repositorio ni en el sitio. Súbalo a un enlace privado (Google Drive «cualquiera con el enlace», Dropbox, etc.) y configure en Formspree la respuesta automática (**Form → Settings → Autoresponse**) con ese enlace. El mismo correo sirve para los dos formularios.

### Datos del autor

Los huecos `[__]` de las páginas legales (`privacidad/`, `cookies/`, `aviso-legal/`) y de los JSON-LD (`index.html`) deben rellenarse antes de publicar. La lista completa está en `PROGRESO.md`.

## Despliegue

**GitHub Pages (principal).** `.github/workflows/deploy.yml` publica la raíz de la rama `main`. En el repositorio: **Settings → Pages → Source: GitHub Actions**. La URL es `https://dpereirapaz.github.io/supervisar-la-ia/`.

**Netlify (alternativa).** `netlify.toml` publica la raíz y añade las cabeceras de seguridad de T-11 (GitHub Pages no admite cabeceras personalizadas).

## Comprobaciones

Las comprobaciones de aceptación están en `SPEC.md`, secciones 11 y 13.6. Las herramientas locales (html-validate, Lighthouse, Playwright) se instalan como dependencias de desarrollo:

```sh
npm install
npm run check:html      # A-01
npm run check:lighthouse # A-02
npm run render:social   # S-10, regenera social/out/
```

Los activos sociales se regeneran con `node social/render.mjs` a partir de `social/manifest.json`.

## Fuentes

Poppins (400, 600) y Lora (400–600 variable, 400 italic) están en `assets/fonts/` como woff2 con subconjunto Latin (T-05). Se obtuvieron una sola vez de Google Fonts pidiendo la hoja de estilos con un User-Agent de Chrome y descargando las URL del bloque `/* latin */`:

```sh
curl -sA "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Lora:ital,wght@0,400;0,600;1,400&display=swap"
```

El sitio no hace ninguna petición a Google Fonts en tiempo de ejecución.
