# Supervisión de la IA · sitio web

Sitio del whitebook «Supervisión de la IA. Seis decisiones que un consejo no puede delegar», de David Pereira Paz. Se construye según `SPEC_supervisar-la-ia_web.md` (v1.2) y su anexo `SPEC_informe-personalizado.md`.

## Propósito

El sitio presenta el whitebook y ofrece una autoevaluación gratuita para consejos de administración (18 afirmaciones calculadas en el navegador). A cambio del correo, el lector recibe el enlace al whitebook o, si ha hecho la autoevaluación, un PDF personalizado, «Lectura del consejo», con una lectura cualitativa y una propuesta para los primeros cien días.

Las páginas son HTML5, CSS3 y JavaScript vanilla, sin cookies ni analítica. Una única función de Netlify, `/api/informe`, recalcula las puntuaciones, genera el PDF con `report/` y lo envía por correo con Brevo. No guarda respuestas ni informes.

## Vista previa local

```sh
npm ci
cp .env.example .env          # y ponga DELIVERY_MODE=download, SITE_HOST y CONTACT_EMAIL de prueba
npx netlify dev --offline --port 8888
```

Abra `http://localhost:8888/`. Con `DELIVERY_MODE=download`, la función devuelve el PDF en la respuesta y no envía ningún correo. Netlify rechaza ese modo en producción.

## Configuración

Todas las variables se definen en Netlify (Site configuration → Environment variables). En el repositorio solo está `.env.example`, con los nombres.

| Variable | Secreta | Uso |
|---|---|---|
| `BREVO_API_KEY` | sí | Clave de la API de Brevo |
| `MAIL_FROM` | no | Remitente, en el dominio del sitio (no una dirección de Gmail ni de Outlook) |
| `MAIL_FROM_NAME` | no | `David Pereira Paz` |
| `MAIL_REPLY_TO` | no | Dirección que recibe las respuestas de los lectores |
| `AUTHOR_EMAIL` | no | Dirección que recibe los avisos de cada lead |
| `CONTACT_EMAIL` | no | Contacto público, usado en el informe, los mensajes de error y las páginas legales |
| `WHITEBOOK_URL` | sí | Enlace privado al PDF del whitebook |
| `SITE_URL` | no | URL pública, sin barra final |
| `SITE_HOST` | no | Dominio, por ejemplo `supervisarlaia.es` |
| `BREVO_LIST_ID` | no | Opcional: lista de Brevo para quien acepta información ocasional |
| `DELIVERY_MODE` | no | `email` (por defecto) o `download` (solo pruebas locales) |

Los textos del informe y de los correos están en `report/content/informe.es.json`. `node report/scripts/export-review.mjs` regenera `report/CONTENIDO_informe_revision.md`, una copia legible para revisarlos.

## Despliegue

El sitio se publica en Netlify desde la rama `main` de GitHub: directorio de publicación, la raíz; funciones, `netlify/functions`; sin paso de compilación (`netlify.toml`). `.github/workflows/ci.yml` ejecuta `npm ci` y `npm test` en cada push. Los pasos que necesita una persona (dominio, Netlify, Brevo, direcciones, revisión jurídica) están en `PROGRESO.md`.

## Comprobaciones

```sh
npm test                          # 9 pruebas del motor y 17 de la función (Brevo simulado)
npm run check:html                # A-01
node scripts/ar-informe.mjs       # AR-02, AR-06, AR-07: cinco perfiles y nombres de 80 caracteres
node scripts/check.mjs            # A-03, A-04, A-07, A-08, A-10, AR-09, R-02 (con netlify dev en marcha)
BASE=http://localhost:8888 node scripts/lighthouse.mjs   # A-02, AR-08
```

`scripts/ar-informe.mjs` deja los PDF y una imagen PNG por página en `report/out/ar/` (fuera de git) para revisarlos a ojo.

## Activos sociales

Se regeneran con `node social/render.mjs` a partir de `social/manifest.json` (plantillas en `social/templates/`, salida en `social/out/` con `alt.json` y `posts.md`; el `linkedin-carousel.pdf` se genera en local y no se sube). Antes de publicar, sustituya `"url": "[__]"` en el manifiesto por la URL pública y vuelva a ejecutar el script; `assets/img/og-image.png` se actualiza automáticamente (S-14). El favicon PNG se regenera con `node scripts/favicon.mjs`.

## Fuentes

Las páginas usan Poppins (400, 600) y Lora (400–600 variable, 400 italic) en woff2 con subconjunto Latin, en `assets/fonts/` (T-05). El informe usa sus propios TTF en `report/src/fonts/`, incrustados en `report/src/fuentes.generated.mjs` (R-16). No se hace ninguna petición a Google Fonts en tiempo de ejecución.
