# Progreso de construcción (SPEC.md, sección 10)

Los subagentes `qa`, `security-reviewer`, `designer` y `web-developer` se bloquearon sin producir salida (ver DECISIONS.md). Por instrucción del autor, el orquestador construyó los pasos 2 a 11 y ejecutó él mismo las comprobaciones de `qa`, `security-reviewer` y `copy-editor` antes de cada commit; la evidencia está en `scripts/check.mjs`, `scripts/lighthouse.mjs` y en esta tabla.

| Paso | Descripción | Estado | Commit |
|---|---|---|---|
| 1 | Estructura T-02 y README | hecho | ce1abe9 |
| 2 | Fuentes woff2 y `@font-face` | hecho | 7b6583f |
| 3 | `site.css` (D-01 a D-04, T-16) | hecho | 025f51f |
| 4 | Landing (C-01 a C-06, T-14, T-15) | hecho | d670c20 |
| 5 | Autoevaluación y `autoevaluacion.js` (F-01, F-03, F-04) | hecho | cba4ead |
| 6 | Whitebook, gracias y páginas legales | hecho | 3dcc36d |
| 7 | Favicon y Open Graph | hecho | e273539 |
| 8 | `sitemap.xml`, `robots.txt`, `404.html` | hecho | 0dc16c2 |
| 9 | `deploy.yml` y `netlify.toml` | hecho | d7a7504 |
| 10 | Plantillas sociales y render (sección 13) | hecho | 1fe467b |
| 11 | Comprobaciones 11 y 13.6, commit y push | hecho | (este commit) |

## Comprobaciones de la sección 11 (ejecutadas el 2026-10-03 en local)

| Id | Resultado | Evidencia |
|---|---|---|
| A-01 | PASA | `npm run check:html`: 0 errores en las 8 páginas (html-validate) |
| A-02 | PASA | `npm run check:lighthouse` (móvil): `/` 99/100/100/100, `/autoevaluacion/` 99/100/100/100 |
| A-03 | PASA | `scripts/check.mjs`: landing completa sin JS; formulario enviado sin JS y redirigido a `/gracias/` (POST interceptado) |
| A-04 | PASA en local | `scripts/check.mjs`: el POST lleva `origen`, `puntuacion_total`, `puntuacion_grupos`, `fecha` y `a1`…`a18`. Pendiente de repetir contra Formspree real cuando exista el endpoint |
| A-05 | PENDIENTE | Requiere cuenta de Formspree, endpoint y respuesta automática con el enlace del PDF |
| A-06 | PASA | `find -iname '*.pdf'`: solo `social/out/linkedin-carousel.pdf` (activo social, no el whitebook) |
| A-07 | PASA | `scripts/check.mjs`: 0 px de desbordamiento a 360, 768 y 1440 px en 4 páginas |
| A-08 | PASA | `scripts/check.mjs`: autoevaluación completada y formulario rellenado solo con teclado |
| A-09 | PASA | Sin `lorem` ni `TODO`; `[__]` solo en páginas legales, `datePublished`, `action` de los formularios y URL de los activos sociales |
| A-10 | PASA | `scripts/check.mjs`: 0 peticiones a terceros al cargar `/`, `/autoevaluacion/`, `/whitebook/` |
| S-11 | PASA | Revisión visual de los PNG; afirmaciones a 92/80 px legibles al 25 % |
| S-12 | PASA | Márgenes de 80 px (96 px en 1600/1584/1500 de ancho, > 6 %); cabeceras dentro de la franja central del 70 % |
| S-13 | PASA | `linkedin-carousel.pdf`: 7 páginas 1080 × 1350 en secuencia |
| S-14 | PASA | `cmp assets/img/og-image.png social/out/linkedin-link-cover.png`: idénticos |
| S-15 | PASA | `alt.json`: 22 entradas, todas ≤ 120 caracteres, una por PNG |
| Copy | PASA | Los 72 literales de la sección 5 y los 14 de 13.5 aparecen tal cual en las páginas y activos |
| Seguridad | PASA | Sin .pdf/.docx/.env/credenciales en git; honeypot `_gotcha` oculto por CSS; privacidad obligatoria, comunicaciones opcional y desmarcada; CSP exacta en `netlify.toml`; `robots.txt` excluye `/gracias/`; solo LinkedIn abre en nueva pestaña con `rel="noopener"` |

## Pendiente del autor antes de publicar

1. **Formspree**: endpoint `https://formspree.io/f/xyekygrz` conectado en los dos formularios (2026-10-05). Falta confirmar el formulario desde el correo de activación de Formspree.
2. **Respuesta automática**: en Formspree (Settings → Autoresponse) incluir el enlace privado del PDF (Drive/Dropbox). El PDF no debe subirse al repositorio.
3. **Datos legales** en `privacidad/`, `cookies/` y `aviso-legal/`: nombre completo, NIF, dirección postal, correo de contacto (aparece dos veces en privacidad: responsable y ejercicio de derechos) y fecha de última actualización.
4. **Fecha de publicación** del whitebook en el JSON-LD `Book` de `index.html` (`datePublished`).
5. **URL de los activos sociales**: sustituir `"url": "[__]"` en todas las entradas de `social/manifest.json` (y en los JSON de `social/templates/*.html` si se editan a mano) y ejecutar `node social/render.mjs`. Esto regenera también `assets/img/og-image.png`.
6. **Opcional**: `assets/img/author.jpg` (800 × 800). Si se añade, incorporar la imagen en la sección «Sobre el autor» y renderizar la plantilla `author.html` (fijando antes la cita del whitebook, que SPEC.md no concreta).
7. **Opcional**: dominio propio. Si se configura, cambiar la URL en `canonical`/Open Graph/`sitemap.xml`/`_next`, el prefijo `/supervisar-la-ia/` de `404.html` y la ruta de `robots.txt`.
8. **Cabeceras de perfil** (L4, X3): el texto va a 56/64 px en lugar de 72 px para caber en la franja segura; subir los tamaños en `social/manifest.json` si se acorta el copy.
