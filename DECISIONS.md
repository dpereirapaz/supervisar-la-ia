# Decisiones no fijadas por SPEC.md

Cada entrada: fecha, decisión, motivo. Criterio: la opción más conservadora.

- **2026-10-03** · El fichero `SPEC_supervisar-la-ia_web.md` se renombra a `SPEC.md`. Motivo: CLAUDE.md y los subagentes lo citan como `SPEC.md`.
- **2026-10-03** · `Supervision_de_la_IA_borrador_v0.95.docx` y las muestras `muestra_*.png` quedan fuera del repositorio (`.gitignore`). Motivo: el whitebook no debe estar en el sitio ni en el historial (F-07, T-10, CLAUDE.md); las muestras son material de referencia del autor.
- **2026-10-03** · Servicio de formularios: Formspree (plan gratuito), honeypot `_gotcha`. Motivo: T-08 admite Formspree o Web3Forms; Formspree es el primero citado y su redirección `_next` y la respuesta automática están documentadas sin JavaScript.
- **2026-10-03** · URL pública del sitio: `https://dpereirapaz.github.io/supervisar-la-ia/` (T-07, sin dominio propio). Se usa en `canonical`, Open Graph, `sitemap.xml` y `_next`. Motivo: el usuario de GitHub autenticado es `dpereirapaz` y el repositorio pedido es `supervisar-la-ia`. Los enlaces internos son relativos.
- **2026-10-03** · La URL de los activos sociales (S-02) se deja como `[__]` en `social/manifest.json`, tal como pide el autor. Motivo: la sección 12 la lista como dato pendiente del autor. Hay que rellenarla y ejecutar `node social/render.mjs` antes de publicar.
- **2026-10-03** · Lora se guarda como fuente variable (`lora-regular.woff2`, `lora-italic.woff2`, rango `font-weight: 400 600`) en lugar de instancias estáticas 400/600. Motivo: Google Fonts sirve el subconjunto Latin de Lora como un único woff2 variable por estilo; dividirlo exigiría instalar fonttools (CLAUDE.md pide no instalar herramientas globales) y no reduce el peso (37 KB).
- **2026-10-03** · Los subagentes `qa`, `security-reviewer` y `designer` se quedaron bloqueados sin producir salida (7 h, 7 h y 8 min). Por instrucción del autor, el orquestador asume las comprobaciones y el trabajo de diseño cuando un agente no avanza, y lo deja anotado en PROGRESO.md.
