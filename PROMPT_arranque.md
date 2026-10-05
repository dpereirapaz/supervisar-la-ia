# Prompt de arranque (pegar como primer mensaje)

Lee `CLAUDE.md`, `SPEC_supervisar-la-ia_web.md` y `SPEC_informe-personalizado.md` completos, y echa un vistazo a la carpeta `report/`. Construye todos los activos descritos siguiendo el orden de la sección 10 de la base con los pasos 6a a 6f del anexo, sin preguntarme nada.

Reparto de trabajo:
- Tú eres el orquestador. Mantén un archivo PROGRESO.md con cada paso, su estado y el commit que lo cierra.
- Delega en `designer` la maquetación, site.css, fuentes, favicon, imagen Open Graph, plantillas sociales y la revisión visual de los PDF de muestra (convertidos a PNG).
- Delega en `backend-developer` la función `netlify/functions/informe.mjs`, su carpeta `lib/`, la integración de `report/`, sus pruebas y `netlify.toml`.
- Delega en `web-developer` el HTML, el JavaScript de la autoevaluación y del envío, los formularios, `/gracias/`, `/error/`, las páginas legales, sitemap y robots.
- Antes de cada commit, ejecuta `qa` y `security-reviewer`. Si alguno falla, devuelve el trabajo al agente responsable y repite hasta que pase.
- Cuando todas las páginas y activos existan, ejecuta `copy-editor` y corrige lo que encuentre.

Decisiones:
- Lo que la especificación no fije, decídelo tú con la opción más conservadora y anótalo en DECISIONS.md. No me preguntes.
- Los huecos `[__]` se dejan como están. Al terminar, lista en PROGRESO.md todo lo que yo tengo que hacer, empezando por la sección 15 del anexo (dominio, Netlify, Brevo, direcciones, enlace del whitebook, revisión jurídica).

Entrega:
- Inicializa git si no existe, haz commits pequeños por paso y, al final, crea el repositorio remoto con `gh repo create dpereirapaz/supervisar-la-ia --public --source=. --push`. No actives GitHub Pages ni despliegues nada: el sitio se publica en Netlify cuando yo conecte el repositorio.
- Termina con un resumen de cuatro líneas: qué queda pendiente para mí, qué comprobaciones de la sección 11 (base) y AR-01 a AR-12 (anexo) han pasado, qué ha quedado en BLOCKERS.md, y cómo probar el informe en local (`netlify dev --offline` con `DELIVERY_MODE=download`).
