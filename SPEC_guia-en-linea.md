# Anexo: guía en línea y posicionamiento en buscadores generativos (GEO)

Versión 1.0 · 2026-10-08 · Amplía `SPEC_supervisar-la-ia_web.md` (v1.2) y `SPEC_informe-personalizado.md`. Si este anexo choca con ellos, manda este anexo solo en lo que trata; en todo lo demás siguen mandando los otros dos.

## 1. Objetivo

Que los asistentes de IA (ChatGPT, Perplexity, Gemini, Copilot, Claude) y los resúmenes de IA de los buscadores encuentren, entiendan y citen el contenido del whitebook cuando un consejero pregunte por el gobierno o la supervisión de la IA en un consejo de administración, sobre todo en España.

Hoy no pueden: el sitio público tiene unas 650 palabras, y las 8.800 del whitebook solo están en un PDF al que se llega por correo. Un asistente no rellena formularios.

## 2. Decisión de fondo

- **G-01.** El texto del whitebook se publica en abierto, en HTML, capítulo a capítulo, en `/guia/`.
- **G-02.** El PDF sigue pidiendo el correo (`/whitebook/`), igual que el informe personalizado (`/autoevaluacion/`). La guía en línea no los sustituye: el PDF es la versión para leer de una vez o imprimir, y la autoevaluación es lo que justifica dejar el correo.
- **G-03.** El sitio sigue siendo divulgativo (aviso legal, DECISIONS.md 2026-10-06). La guía no incluye ofertas de servicios.

## 3. Fuente del texto

- **G-04.** La fuente única es la última edición aceptada del whitebook en Word (hoy `Supervision_de_la_IA_v1.1_aceptada.docx`, fuera de git). El texto se publica literal: no se resume, no se reescribe y no se añaden frases al cuerpo de los capítulos.
- **G-05.** Las páginas se generan con `scripts/generar-guia.py` a partir de ese archivo. Cada nueva edición del whitebook se publica volviendo a ejecutar el script; nadie edita a mano el HTML generado.
- **G-06.** Se omiten, y se anotan en BLOCKERS.md, los fragmentos que el documento tiene incompletos o sin función. No se completan con texto del constructor.
- **G-07.** El anexo D (autoevaluación) no se duplica: la guía enlaza a `/autoevaluacion/`.
- **G-08.** El texto nuevo que no viene del whitebook (navegación, títulos de página, migas, rótulos) se limita a lo imprescindible, cumple `GUIA_ESTILO_texto_natural.md` y se anota en DECISIONS.md para que lo revise el autor.

## 4. Mapa de páginas

| URL | Contenido |
|---|---|
| `/guia/` | Portada de la guía: título, «Antes de empezar», «En una página» con sus dos recuadros, índice por partes y enlaces al PDF y a la autoevaluación |
| `/guia/<capitulo>/` | Un capítulo por página (1 a 12) |
| `/guia/veinte-preguntas-para-el-consejo/` | Anexo A |
| `/guia/frases-que-deberian-hacer-saltar-las-alarmas/` | Anexo B |
| `/guia/calendario-del-reglamento-europeo/` | Anexo C |
| `/guia/fuentes/` | Fuentes |
| `/autor/` | Sobre el autor, con la biografía completa del whitebook |

- **G-09.** El *slug* de cada página es su título en minúsculas, sin tildes ni signos, con guiones. Si el título cambia en una edición nueva, la URL antigua redirige a la nueva con 301 en `netlify.toml`.
- **G-10.** Dentro de cada página, los epígrafes (`h2`, `h3`) llevan un `id` estable para enlazar a ellos (por ejemplo, cada una de las seis decisiones).

## 5. Plantilla de página

- **G-11.** Misma cabecera, pie, tipografía y colores que el resto del sitio (sección 8 de la base). Sin JavaScript, sin imágenes, sin peticiones a terceros (A-10).
- **G-12.** Orden: migas (Guía › Capítulo N) · rótulo («Capítulo N» o «Anexo X») · `h1` · entradilla del capítulo como primer párrafo · firma («David Pereira Paz · Primera edición, octubre de 2026») · cuerpo · navegación anterior/siguiente · bloque final con la autoevaluación (copy de C-06 de la portada, sin cambios).
- **G-13.** La entradilla del whitebook abre la página y es la `meta description`. Es la frase que un asistente puede citar sin más contexto.
- **G-14.** Elementos del Word y su HTML:
  - Título 2 y 3 → `h2` y `h3`.
  - Recuadros sombreados → `aside` con su título.
  - Tablas con cabecera → `table` con `thead`; en móvil, desplazamiento horizontal dentro de su contenedor, nunca de la página (A-07).
  - Tablas de cifras (por ejemplo, «280 veces») → bloque de cifras con su explicación.
  - Frases destacadas → párrafo destacado.
  - Notas en gris → párrafo de nota.
  - Listas numeradas → `ol`, conservando la numeración del documento (el anexo A va del 1 al 20).
- **G-15.** Las páginas de división («Primera parte», etc.) no son páginas propias: agrupan el índice de `/guia/`.

## 6. Datos estructurados (JSON-LD)

- **G-16.** Cada capítulo y anexo: `Article` con `headline`, `description` (la entradilla), `author` (enlace a `/autor/`), `datePublished` (`2026-10`, primera edición), `inLanguage` (`es-ES`), `isPartOf` (el `Book`) y `mainEntityOfPage`; y `BreadcrumbList`.
- **G-17.** `/guia/`: `Book` con `name`, `author`, `bookEdition`, `datePublished`, `inLanguage` y `hasPart` con los capítulos en orden.
- **G-18.** `/autor/`: `Person` con `name`, `jobTitle`, `worksFor`, `alumniOf`, `memberOf`, `knowsAbout` y `sameAs` (solo perfiles comprobados; hoy, LinkedIn). Solo datos que ya están en la biografía del whitebook.
- **G-19.** Portada: el `Book` existente pasa a `datePublished: "2026-10"` (la edición dice «octubre de 2026»), y se añade `WebSite`.

## 7. Descubrimiento

- **G-20.** `sitemap.xml` incluye todas las páginas nuevas con `lastmod`.
- **G-21.** `/llms.txt` en la raíz, con el formato propuesto en llmstxt.org: título, resumen de una línea y lista de páginas con su entradilla. Se genera con el mismo script.
- **G-22.** `robots.txt` no bloquea a ningún rastreador de IA. Se mantiene `Allow: /`.
- **G-23.** La navegación principal de todas las páginas añade «Guía», entre «Autoevaluación» y «Whitebook».
- **G-24.** `/whitebook/` añade una línea que remite a la guía en línea. La portada enlaza cada una de las seis decisiones a su epígrafe en `/guia/las-seis-decisiones/`.

## 8. Fuera del sitio (tareas del autor, sin código)

- **G-25.** Dar de alta el dominio en Google Search Console y en Bing Webmaster Tools, y enviar el `sitemap.xml`. La búsqueda de ChatGPT y la de Copilot se apoyan en Bing.
- **G-26.** Menciones en medios y foros de consejeros (Expansión, Cinco Días, revista *Consejeros*, IC-A, APD, escuelas de negocio), LinkedIn y vídeo con transcripción, siempre con enlace a la página del capítulo que corresponda.
- **G-27.** Seguimiento mensual con las preguntas del apéndice: anotar en una hoja, por asistente, si cita el sitio y en qué posición.

## 9. Pasos de construcción

1. Este anexo.
2. `scripts/generar-guia.py` y estilos de la guía en `site.css`.
3. Páginas generadas: `/guia/`, capítulos, anexos A a C, fuentes y `/autor/`.
4. Navegación, enlaces desde la portada y `/whitebook/`, JSON-LD de la portada, `sitemap.xml` y `llms.txt`.
5. Comprobaciones de la sección 10 y un único despliegue (cada despliegue consume créditos de Netlify; DECISIONS.md 2026-10-06).

## 10. Comprobaciones

| Id | Comprobación |
|---|---|
| GA-01 | `html-validate` sin errores en todas las páginas nuevas |
| GA-02 | Ninguna página desborda en horizontal a 360, 768 y 1440 px |
| GA-03 | Cero peticiones a terceros al cargar cualquier página de la guía |
| GA-04 | El texto de cada capítulo coincide con el del Word, salvo los fragmentos omitidos de G-06 (comprobación automática por párrafos) |
| GA-05 | Todos los enlaces internos responden 200; cada capítulo enlaza al anterior y al siguiente |
| GA-06 | JSON-LD válido (se analiza como JSON y lleva los campos de G-16 a G-19) |
| GA-07 | `sitemap.xml` y `llms.txt` listan exactamente las páginas publicadas |
| GA-08 | Sin `[__]`, `lorem`, `TODO`, `undefined` ni `NaN` en las páginas nuevas |
| GA-09 | Lighthouse móvil ≥ 95 en rendimiento, accesibilidad, buenas prácticas y SEO en `/guia/` y en un capítulo |
| GA-10 | El texto nuevo de G-08 pasa `lint_estilo.py` sin hallazgos de gravedad 3 |

## Apéndice. Preguntas de seguimiento (G-27)

Hacerlas cada mes, en una sesión nueva, en ChatGPT, Perplexity, Gemini, Copilot y en Google (resumen de IA):

1. ¿Qué debe exigir un consejo de administración a la dirección sobre inteligencia artificial?
2. ¿Cómo supervisa un consejo de administración la IA?
3. ¿Qué decisiones sobre IA no puede delegar un consejo?
4. ¿Qué preguntas debe hacer un consejero sobre IA a la dirección?
5. ¿Qué obligaciones tiene el consejo de administración con el Reglamento europeo de IA?
6. Calendario de aplicación del Reglamento europeo de IA tras el Ómnibus Digital.
7. ¿Qué es el Ómnibus Digital y cómo cambia el Reglamento de IA?
8. ¿Cómo medir el retorno de la IA en una empresa? ¿Qué indicadores debe ver el consejo?
9. ¿Por qué sube el coste de la IA si los precios por consulta bajan?
10. ¿Cuánta autonomía dar a un agente de IA en una empresa?
11. ¿Modelo de IA abierto o de pago? ¿Instalarlo en casa da soberanía?
12. ¿Qué riesgos de ciberseguridad tiene la IA generativa para una empresa?
13. ¿Cómo afecta la IA al modelo de negocio de una consultora o de un intermediario?
14. ¿Cuál es el papel del consejo en la gobernanza de la IA según la Ley de Sociedades de Capital?
15. Autoevaluación de madurez en IA para consejos de administración.
16. ¿Qué hacer en los primeros cien días de supervisión de la IA desde el consejo?
17. Libro o guía sobre IA para consejeros en español.
18. ¿Qué frases de la dirección sobre IA deberían preocupar a un consejero?
19. ¿Cuándo usar aprendizaje automático clásico en lugar de IA generativa?
20. Supervisión de la IA, David Pereira Paz.
