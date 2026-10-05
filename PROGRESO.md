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
| 11 | Comprobaciones 11 y 13.6, commit y push | hecho | 2f95844 |

## Versión 1.2 y anexo del informe personalizado (2026-10-05)

El sitio ya estaba construido con la v1.1, así que se aplican los pasos 6a a 6f del anexo y se rehacen los pasos 9 y 11. Los subagentes no se usan: en esta máquina se bloquean (ver DECISIONS.md), y el orquestador hace el trabajo y las revisiones de `qa`, `security-reviewer` y `copy-editor`.

| Paso | Descripción | Estado | Commit |
|---|---|---|---|
| 6a | `report/` integrado; `npm test` con las 9 pruebas de referencia | hecho | f4d1910 |
| 6b | Función `/api/informe`, `lib/` y 17 pruebas con Brevo simulado | hecho | 343d4dd |
| 6c | Formularios R-01, copy C-10/C-11, script R-02, `/error/`, `/gracias/` | hecho | 64e34c4 |
| 6d | Páginas legales (sección 10), `netlify.toml`, `.env.example`, sin Formspree | hecho | ea7551b |
| 6e | Cinco perfiles generados con la función, revisados como PNG; corrección de portada (R-18) | hecho | 4475d24 |
| 9 | `ci.yml`; eliminado `deploy.yml` | hecho | 0d4736f |
| 6f / 11 | Comprobaciones AR-01 a AR-12 y sección 11 | hecho | 0cca197 |

## Comprobaciones (2026-10-05, en local con `netlify dev --offline` y `DELIVERY_MODE=download`)

| Id | Resultado | Evidencia |
|---|---|---|
| A-01 | PASA | `npm run check:html`: 0 errores en 9 páginas |
| A-02 / AR-08 | PASA | Lighthouse móvil: `/` y `/autoevaluacion/` 99/100/100/100; `autoevaluacion.js` 3,7 KB (≤ 12 KB) |
| A-03 / AR-04 | PASA | Sin JS: landing completa; whitebook → `303 /gracias/`; fallo → `303 /error/`; autoevaluación → PDF (modo download) |
| A-04 / AR-03 | PASA | `curl`: 200 PDF; 17 respuestas 422; valor 4 → 422; correo inválido 400; sin consentimiento 400; `_gotcha` 200 sin PDF; 20 KB 413; GET 405; sexta petición 429; producción + download 503 (prueba unitaria) |
| A-05 | PENDIENTE | Lo hace el autor en producción (AR-13) |
| A-06 / AR-10 | PASA | `git ls-files`: ningún `.pdf` ni `.env` |
| A-07 | PASA | 0 px de desbordamiento a 360, 768 y 1440 px en 5 páginas |
| A-08 | PASA | Autoevaluación y formulario completados solo con teclado |
| A-09 | PASA | Sin `lorem` ni `TODO`; `[__]` en páginas legales, `datePublished` y plantillas sociales (pendientes del autor) |
| A-10 / AR-09 | PASA | 0 peticiones a terceros al cargar 5 páginas y al enviar la autoevaluación |
| AR-01 | PASA | `npm test`: 9 pruebas de referencia + 17 de la función |
| AR-02 | PASA | 5 perfiles + nombres largos: 9 a 11 páginas A4, 45–49 KB, sin páginas casi vacías; PNG revisados |
| AR-05 | PASA | Registros sin nombre, correo, `@`, IP ni respuestas (prueba unitaria y log de `netlify dev`) |
| AR-06 | PASA | Sin `\uFFFD`, `undefined`, `NaN`, `{`, `[__]`, `null`; `[fecha]` una vez; los tres estados y las tildes presentes |
| AR-07 | PASA | Nombre y organización de 80 caracteres dentro de la página (tras corregir `render-pdf.mjs`) |
| AR-11 | PASA | `netlify dev`: CSP de T-11, `nosniff`, `Referrer-Policy`, `Permissions-Policy`; `/api/informe` con `Cache-Control: no-store` |
| AR-12 | PASA | Sin `deploy.yml` ni menciones de Formspree o Web3Forms en código, configuración, README ni CSP |
| AR-13 | PENDIENTE | Lo hace el autor en producción |
| R-15 | PASA | Metadatos: título, autor y `es-ES`; sin datos del lector |

## Pendiente del autor

### Estado de producción (2026-10-05, noche)

- Netlify: proyecto `supervisarlaia` creado desde GitHub y publicado en `https://supervisarlaia.netlify.app` (páginas, cabeceras de T-11 y función comprobadas). Variables definidas: `MAIL_FROM_NAME`, `CONTACT_EMAIL`, `SITE_URL`, `SITE_HOST`, `AUTHOR_EMAIL`, `MAIL_REPLY_TO`, `BREVO_API_KEY` y `WHITEBOOK_URL` (estas dos, solo en Production y como secretas). Falta `MAIL_FROM`.
- Dominio: `supervisarlaia.es` añadido en Netlify con DNS externa. En DonDominio: ANAME de la raíz → `supervisarlaia.netlify.app`, CNAME `www` → `supervisarlaia.netlify.app`, y los cuatro registros de Brevo (TXT `brevo-code`, CNAME `brevo1._domainkey` y `brevo2._domainkey`, TXT `_dmarc` con `p=none`). **Pendiente:** nic.es aún no publica el `.es` (NXDOMAIN); hasta entonces no resuelve nada.
- Whitebook: `Supervision_de_la_IA_v1.0.pdf` (fuera de git) subido a Drive y enlazado en `WHITEBOOK_URL`.
- Siguientes pasos cuando resuelva la DNS: verificar el dominio en Netlify (HTTPS) y en Brevo; añadir `supervisarlaia.com` como alias; crear en Brevo el remitente (por ejemplo `informes@supervisarlaia.es`) y ponerlo en `MAIL_FROM`; volver a desplegar; prueba AR-13 y A-05; desactivar GitHub Pages.

### Anexo, sección 15 (antes de publicar)

1. **Dominio.** Registrados `supervisarlaia.es` (principal) y `supervisarlaia.com` (2026-10-05). Las URL del sitio, `sitemap.xml`, `robots.txt` y los activos sociales ya usan `https://supervisarlaia.es/`. Falta apuntarlos a Netlify, activar HTTPS, configurar `supervisarlaia.com` como alias que redirige al `.es`, y poner `SITE_URL=https://supervisarlaia.es` y `SITE_HOST=supervisarlaia.es`.
2. **Netlify.** Crear el sitio desde el repositorio `dpereirapaz/supervisar-la-ia` y definir las variables de entorno de la sección 11 (ver README). Comprobar que Netlify Blobs está disponible (límite de solicitudes, R-12).
3. **Brevo.** Crear la cuenta, autenticar el dominio (SPF, DKIM, DMARC), crear la clave de API (`BREVO_API_KEY`), desactivar el seguimiento de aperturas y clics y revisar límites y marca del plan gratuito. Opcional: lista para `BREVO_LIST_ID`.
4. **Direcciones.** `CONTACT_EMAIL` = `dpereirapaz@gmail.com` (fijado por el autor el 2026-10-05; ya está en `/error/`, en el mensaje de error del formulario y en las páginas legales). Faltan `MAIL_FROM` (en el dominio del sitio, no Gmail ni Outlook, R-23), `MAIL_REPLY_TO` y `AUTHOR_EMAIL`.
5. **Enlace del whitebook.** Enlace privado al PDF definitivo (no al .docx) en `WHITEBOOK_URL`.
6. **Revisión jurídica.** Privacidad, cookies y aviso legal están marcados `[__] Revisión jurídica pendiente`: encargados (Netlify, Brevo), transferencias, plazo de conservación (`[__] meses`) y datos del responsable (nombre, NIF, dirección, correo, fecha de actualización).
7. **Regla de conflicto.** Antes de responder a un lead, aplicar la regla de no prestar servicios personales a empresas donde SEIDOR tenga negocio (el aviso incluye la organización).
8. **Prueba en producción (AR-13 y A-05).** Hacer la autoevaluación y pedir el whitebook con un correo personal; comprobar el adjunto, el enlace, `SPF/DKIM/DMARC: PASS`, el aviso al autor y que no llega a spam.
9. **GitHub Pages.** Cuando Netlify funcione, desactivar Pages en el repositorio (Settings → Pages) para retirar la versión antigua con Formspree.

### Otros pendientes

11. Fecha de publicación del whitebook en el JSON-LD de `index.html` (`datePublished`).
13. Opcional: `assets/img/author.jpg` (800 × 800).
14. Validar la relación entre el plan de cien días del informe y las afirmaciones: ahora la fija `report/content/informe.es.json` (`decisiones[].plan`), que es texto del autor.
