# Specification addendum: personalized PDF report "Lectura del consejo"

Document type: Build specification (addendum to `SPEC_supervisar-la-ia_web.md`)
Language of this document: ASD-STE100 Simplified Technical English (Issue 8)
Language of all published content: Spanish (es-ES)
Target reader: Claude Code (build agent)
Author: David Pereira Paz
Version: 1.0, 2026-10-05
Applies to: base specification version 1.2

---

## 0. How to read this addendum

- This addendum and the base specification form one specification. If they disagree, **this addendum wins**. Section 4 lists every changed requirement.
- Requirement identifiers: `R-` (report requirement), `AR-` (acceptance check for the report). Base identifiers (`F-`, `T-`, `D-`, `C-`, `A-`, `S-`) keep their meaning unless Section 4 changes them.
- The words **must**, **should** and **can** have the same meaning as in the base specification.
- Do not change the Spanish text in `report/content/informe.es.json`. The author owns it. If a text looks wrong, write the problem in `BLOCKERS.md` and continue.
- Do not invent facts, scores, rules, thresholds or text. If a rule is not in this addendum or in the reference code, stop that step and write a `BLOCKERS.md` entry.
- A **reference implementation** is in the folder `report/` (Section 16). It is tested and it works. **Copy it and adapt it. Do not rewrite it from the beginning.**

---

## 1. Purpose

When a reader finishes the self-assessment and asks for the result, the site sends **one e-mail** with:

1. A PDF named "Lectura del consejo". It contains a qualitative reading of where the company is in the six decisions, and a proposal for the first 100 days of the board.
2. The link to the whitebook (PDF, never a Word file).

The author receives a second e-mail with the lead and the scores.

The reader who uses the whitebook form (not the self-assessment) receives only the whitebook link, through the same endpoint.

---

## 2. Decisions already taken (do not reopen)

| Id | Decision | Reason |
|---|---|---|
| D-R1 | The report is built from rules and from fixed text. No AI model runs at request time. No data goes to an AI service. | The result is the same for the same answers. The text is in the voice of the author. No cost per report. No extra data processor. |
| D-R2 | The server calculates all scores again from the 18 answers. It never trusts totals sent by the browser. | A reader can change any browser value. |
| D-R3 | The server stores nothing: no database, no files, no answers. | Data minimization. Simple privacy text. |
| D-R4 | Hosting: **Netlify** serves the site and runs one function. The repository stays on **GitHub**. The site and the function share one origin. | Server code is now needed. GitHub Pages cannot run it. The PDF needs about 300 ms of CPU, and the free plan of Cloudflare Workers allows 10 ms. |
| D-R5 | E-mail is sent with the **Brevo** transactional API, behind a small adapter (`mailer`). | Brevo is an EU company, it accepts PDF attachments, and a free plan exists. The adapter allows a change of provider. |
| D-R6 | One endpoint, `POST /api/informe`, serves both forms. Formspree and Web3Forms are **removed**. | One channel, one privacy text, no third-party form service. |
| D-R7 | The interpretation of the score (state words, global reading, 100-day proposal) appears **only in the PDF**. The on-screen result keeps the rule of C-09: no ranking, no benchmark, no percentile, no traffic light. The PDF also shows no comparison with other companies and no traffic light. | Decision of the author. The reading is a deliverable, not a public score. |
| D-R8 | The PDF contains no price and no offer of a fixed service. It has one closing line that invites the reader to write to the author. | Rule of the base specification (Section 1). |

---

## 3. Architecture and data flow

```
Browser (static pages)                    Netlify
------------------------                  -------------------------------------------
/autoevaluacion/                          /netlify/functions/informe.mjs   (path /api/informe)
  - 18 radios r1..r18                       1  validate method, size, fields
  - live score (JS, local only)             2  honeypot check (silent success)
  - form: correo, nombre,                   3  rate limit (IP, e-mail hash)
    organizacion, consents                  4  recompute scores        -> report/src/engine.mjs
  - POST (fetch, or plain POST)  ------->   5  build PDF              -> report/src/render-pdf.mjs
                                            6  send e-mail to reader   -> mailer (Brevo)
/whitebook/                                 7  send e-mail to author   -> mailer (Brevo)
  - same form, origen=whitebook             8  if "info" consent: add contact to Brevo list
                                            9  answer: JSON {ok:true}  or  303 to /gracias/
```

---

## 4. Changes to the base specification

Apply every change in this table. Where the table gives new text, the new text replaces the old text.

| Base item | Change |
|---|---|
| Header, version | Set the version to `1.2, 2026-10-05 (adds personalized PDF report; hosting on Netlify)`. Add the line `Addendum: SPEC_informe-personalizado.md`. |
| §1, point 3 | Replace with: `Collects the e-mail address of the reader (a lead) in exchange for the whitebook link or for a personalized PDF reading of the self-assessment result.` |
| §2.1 | Add: `Serverless function that builds and sends the PDF report. Error page. Report content and generator (folder report/).` |
| §3, author row | Replace "Success" with: `Each lead arrives by e-mail with the total score, the six group scores and the global reading.` |
| §4 site map | Add `/error/  Error page (noindex)`. |
| §5.3 C-09, last bullet | Replace with: `A form (see F-05) with the title and text of C-10.` |
| §5.3 C-09, last paragraph | Add at the end: `This rule applies to the page. The PDF report follows D-R7.` |
| §5.5 `/gracias/` text | Replace with: `Revise su correo en los próximos minutos. Si ha pedido el resultado de la autoevaluación, el PDF va adjunto. Si no lo encuentra, mire en la carpeta de correo no deseado.` |
| §5.6 legal pages | Add the content of Section 10 of this addendum. |
| F-01 | Replace the second sentence with: `With JavaScript disabled, the form must still submit as a plain HTML POST to /api/informe, and the reader must still reach /gracias/.` |
| F-03 | Keep. Add: `The browser sends the 18 answers only when the reader presses the submit button.` |
| F-05 | Replace with Section 5.1 of this addendum (R-01). |
| F-06 | Replace with: `On submit, the form must send the data to /api/informe (R-02, R-03).` |
| F-07 | Replace with: `The whitebook PDF must not be in the repository or at a public URL of the site. The e-mail contains a private link (environment variable WHITEBOOK_URL).` |
| T-02 | Add the folders and files of Section 12. |
| T-04 | The limit becomes 12 KB (the file also contains the submit code). |
| T-07 | Replace with: `Hosting: Netlify. The site is built from the main branch of the GitHub repository. Publish directory: the repository root. No build step. Functions directory: netlify/functions. GitHub Pages is not used.` |
| T-08 | Replace with: `Form handling: the function /api/informe (Section 6). Do not use Formspree or Web3Forms.` |
| T-09 | Keep, with the honeypot name `_gotcha`. Add: `The function also limits the rate (R-12).` |
| T-10 | Replace with: `The e-mail contains the whitebook link from WHITEBOOK_URL. The repository must not contain the whitebook PDF.` |
| T-11 | Headers now apply (Netlify supports them). Replace the CSP with: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'`. Keep the other two headers. Add `Permissions-Policy: camera=(), microphone=(), geolocation=()`. |
| A-04 | Replace with: `Submit the self-assessment form with 18 answers in the local test mode (DELIVERY_MODE=download). Confirm the response is a PDF (AR-03).` |
| A-05 | Replace with: `Submit the whitebook form in the production-like mode. Confirm the reader receives an e-mail with the whitebook link and no attachment. The author does this check (Section 15).` |
| A-06 | Keep. The folder `report/out/` must be in `.gitignore`. |
| A-10 | Replace with: `Confirm that no request goes to a third-party domain, on page load and on submit. All requests go to the site origin.` |
| M-01 | Replace with: `The author measures three numbers each month from the notification e-mails: leads from /whitebook/; leads from /autoevaluacion/ with the average total score; leads with the optional consent.` |
| §12 open items | Replace with Section 15 of this addendum. |
| §10 build steps | Add the steps 6a to 6f of Section 13 after step 6. |
| T-05 (fonts) | Keep. The report uses its own TTF files (R-16). |

### 4.1 New copy for the pages (final Spanish text)

**C-10 Result form on `/autoevaluacion/`**

- Title: `Reciba su lectura del consejo`
- Text: `Le enviamos por correo un PDF con una lectura cualitativa de su resultado y una propuesta para los primeros cien días del consejo, más el enlace al whitebook.`
- Name field label: `Nombre (opcional)`
- Organization field label: `Organización (opcional)`
- Consent (required): `He leído la política de privacidad y acepto que se traten mis respuestas para elaborar y enviarme el informe.`
- Consent (optional, unchecked): `Acepto recibir, ocasionalmente, información sobre sesiones y publicaciones del autor.`
- Note under the form: `Sus respuestas se usan para elaborar el informe. El autor recibe su correo, la puntuación total y la puntuación de cada decisión. Las respuestas individuales no se guardan.`
- Button: `Recibir mi lectura en PDF`

**C-11 Whitebook form**: keep C-04 and the text of §5.4. The consent text stays: `He leído la política de privacidad y acepto recibir el material solicitado.` Add the optional name and organization fields with the labels above.

**C-12 Error page `/error/`**

- H1: `No hemos podido procesar su solicitud`
- Text: `Vuelva a la autoevaluación e inténtelo de nuevo. Si el problema continúa, escriba a [correo de contacto].`
- Link: `Volver a la autoevaluación` → `/autoevaluacion/`
- The page has `<meta name="robots" content="noindex">` and is not in `sitemap.xml`.

**Status and error messages in the page** come from `report/content/informe.es.json`, key `mensajes`.

---

## 5. Functional requirements

### 5.1 Form

**R-01** The lead form has these fields. On `/autoevaluacion/`, the 18 radio inputs are **inside the same `<form>`**.

| Field name | Type | Required | Note |
|---|---|---|---|
| `correo` | email | yes | Maximum 254 characters |
| `nombre` | text | no | Maximum 80 characters |
| `organizacion` | text | no | Maximum 80 characters |
| `consentimiento` | checkbox | yes | Text of C-10 or C-11 |
| `info` | checkbox | no | Unchecked by default |
| `origen` | hidden | yes | `autoevaluacion` or `whitebook` |
| `_gotcha` | text | no | Honeypot (T-09). Hidden with CSS. Must stay empty |
| `r1` to `r18` | radio (0, 1, 2, 3) | yes, only when `origen` is `autoevaluacion` | One radio group per statement. Mark each group `required` |

Remove the hidden fields `puntuacion_total`, `puntuacion_grupos` and `fecha` of the base F-05. The server calculates them.

**R-02** With JavaScript, the page script must:
1. Stop the default submit.
2. Disable the button and show the message `enviando` in an element with `aria-live="polite"`.
3. Send `fetch("/api/informe", { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } })`.
4. On `{ "ok": true }`: go to `/gracias/`.
5. On an error: enable the button and show the error message of Section 6.4 in the same `aria-live` element.
6. Clear the saved answers in `localStorage` only after success.

**R-03** Without JavaScript, the browser sends a plain form POST. The server answers with `303` to `/gracias/` (success) or to `/error/` (failure).

### 5.2 Function

**R-04** The function file is `netlify/functions/informe.mjs`. Its public path is `/api/informe`. It accepts only `POST`. Any other method returns `405`.

**R-05** Steps of the function, in this sequence:

1. Reject a body larger than 8 KB with `413`.
2. Read the fields. Accept `application/x-www-form-urlencoded` and `multipart/form-data`. Reject other types with `415`.
3. If `_gotcha` is not empty: answer as a success (same response as step 12) and stop. Send nothing. Do not tell the sender.
4. Validate (Section 6.2). On failure, answer `400` or `422`.
5. Apply the rate limit (R-12). On failure, answer `429`.
6. If `origen` is `autoevaluacion`: call `analizar(respuestas, contenido)` from `report/src/engine.mjs`.
7. If `origen` is `autoevaluacion`: call `renderizarInforme(...)` from `report/src/render-pdf.mjs`.
8. If `DELIVERY_MODE` is `download`: answer with the PDF (R-14) and stop.
9. Send the e-mail to the reader (Section 9). If it fails, answer `502` and stop.
10. Send the notification to the author (Section 9). If it fails, write a log line without personal data and continue.
11. If `info` is checked and `BREVO_LIST_ID` is set: add the contact to the Brevo list. If it fails, write a log line and continue.
12. Answer: `200` with `{"ok":true}` when the `Accept` header contains `application/json`. Otherwise answer `303` to `/gracias/`.

**R-06** The function must finish in less than 8 seconds. Time limit for each call to Brevo: 4 seconds. Retry once on a `5xx` answer.

**R-07** Do not use any AI service, analytics service or other third-party service. The only external host the function calls is `api.brevo.com`.

### 5.3 Rules of the reading

**R-08** The engine of `report/src/engine.mjs` is the reference for all rules. Do not change a threshold. The rules are:

- Each statement scores 0 to 3. Each decision has 3 statements: decision 1 = statements 1 to 3, decision 2 = 4 to 6, decision 3 = 7 to 9, decision 4 = 10 to 12, decision 5 = 13 to 15, decision 6 = 16 to 18.
- Decision score = sum of its 3 statements (0 to 9). Total = sum of the six (0 to 54).
- State of a decision: `por_decidir` for 0 to 2 points; `a_medias` for 3 to 6; `decidida` for 7 to 9.
- Global reading, tested in this sequence (D = decisions 1, 2, 4; E = decisions 3, 5, 6; each 0 to 27):
  1. `base_solida` if total ≥ 40 and no decision is `por_decidir`.
  2. `punto_de_partida` if total ≤ 12.
  3. `actividad_por_delante` if E − D ≥ 6.
  4. `intencion_por_delante` if D − E ≥ 6.
  5. `avance_desigual` in all other cases.
- Priorities for the 100 days: the decisions that are not `decidida`, sorted by state (`por_decidir` first), then by score (lowest first), then by the order 2, 1, 4, 3, 5, 6. Keep the first 3.
- If all six decisions are `decidida`: no priorities. The plan uses the `mantener` text of the 3 lowest decisions.
- Answers to contrast: the rules `I1` to `I6` in the JSON file. Show at most 3, in the order of the file.

**R-09** The Spanish text for every state, archetype, statement, plan and message is in `report/content/informe.es.json`. The generator must read all text from that file. No Spanish sentence may be written in the code, except the short labels that already exist in `render-pdf.mjs`.

**R-10** The function must validate that the JSON file is complete at start-up (the test of AR-01 does this). A missing key must stop the build.

### 5.4 Abuse control

**R-11** Honeypot: see R-05, step 3.

**R-12** Rate limit. Limits: 5 requests per IP address per hour; 3 requests per e-mail address per 24 hours. Use the rate-limit feature of Netlify Functions if the plan offers it. If not, use Netlify Blobs. Store only the SHA-256 hash of the IP address and of the e-mail address, with a counter and an expiry time. Never store the raw value. Write the choice in `DECISIONS.md`.

**R-13** Input cleaning: remove control characters and line breaks from `nombre` and `organizacion`. Keep only characters that the report fonts can draw (use `limpiarTexto` from `render-pdf.mjs`). Escape `&`, `<`, `>`, `"` and `'` in every value that goes into an HTML e-mail body.

**R-14** Mode `download` (for local tests only): the function answers `200` with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="lectura-del-consejo.pdf"`. It sends no e-mail. If the environment variable `CONTEXT` is `production`, the function must refuse this mode and answer `503`.

---

## 6. API contract

### 6.1 Request

`POST /api/informe`, with the fields of R-01.

### 6.2 Validation

| Check | Failure answer |
|---|---|
| `origen` is `autoevaluacion` or `whitebook` | `400` |
| `correo` has the form `local@domain.tld`, at most 254 characters | `400`, code `correo_invalido` |
| `consentimiento` is present | `400` |
| If `origen` is `autoevaluacion`: `r1` to `r18` are all integers from 0 to 3 | `422`, code `faltan_afirmaciones`, with the list of missing numbers |
| `nombre` and `organizacion` are at most 80 characters after cleaning | cut the value; do not fail |

### 6.3 Success answer

- Header `Accept` contains `application/json`: `200`, body `{"ok":true}`.
- Other cases: `303`, header `Location: /gracias/`.

### 6.4 Error answers

Body: `{"ok":false,"codigo":"<code>","mensaje":"<Spanish text>"}`. The text comes from the key `mensajes` of the JSON file. For a plain POST (no JSON), answer `303` to `/error/`.

| Status | Code | Message key |
|---|---|---|
| 400 | `correo_invalido` | `correo_invalido` |
| 400 | `solicitud_invalida` | `error_generico` |
| 413, 415 | `solicitud_invalida` | `error_generico` |
| 422 | `faltan_afirmaciones` | `faltan_afirmaciones` |
| 429 | `demasiadas_solicitudes` | `demasiadas_solicitudes` |
| 502 | `envio_fallido` | `error_generico` |
| 500 | `error_interno` | `error_generico` |

Replace `{contacto}` with `CONTACT_EMAIL`.

---

## 7. PDF report: content and sequence

The generator is `report/src/render-pdf.mjs`. The PDF has these parts in this sequence. The layout in the reference code is the visual target.

| Part | Content | Source |
|---|---|---|
| Cover | Kicker, title, subtitle, "Preparado para" (name and organization, only if given), date, author and site | `portada` |
| How to read | Explanation and limits | `como_leer` |
| Global reading | Archetype title and text, box "Lo primero que haría", most advanced and most behind decisions, decisions at zero, count of statements scored 1 | `lectura_global` |
| Map | Six rows: number, title, bar, `n / 9`, state word. Total `N de 54` | `mapa`, `estados` |
| Answers to contrast | Up to 3 sentences, only if a rule applies | `incoherencias` |
| Decision by decision | For each decision: number, title, bar, score and state; the board question; the text of the state; what to check (the `si0` and `si1` texts of statements scored 0 and 1); a note for statements scored 2 | `decisiones`, `afirmaciones`, `comprobar` |
| First 100 days | Intro; priorities; three meeting cards (base agenda, what the result adds, "El consejo sale con"); proposed text of the first assignment; what the board should not do; after the 100 days | `cien_dias` |
| Answers | Table of the 18 statements with the score; scale; rule for the states | `registro`, `escala`, `regla_estados` |
| Closing | Limits, repeat after one year, invitation to write to `CONTACT_EMAIL` | `cierre` |

**R-15** Page and file rules:

- Page size A4 portrait.
- Between 8 and 12 pages. File size less than 300 KB.
- Text must be selectable. Spanish accents and the characters « » · — must display correctly.
- No placeholder (`{`, `undefined`, `null`, `NaN`, `[__]`) may appear in the text of the PDF. The one allowed exception: `[fecha]` in the proposed assignment text. It is a blank for the board to fill.
- Document metadata: Title `Supervisión de la IA · Lectura del consejo`; Author `David Pereira Paz`; Language `es-ES`. Do not put the name or the e-mail of the reader in the metadata.
- The PDF carries no tracking, no external link, no JavaScript.

**R-16** Fonts: Poppins 400 and 600; Lora 400, 400 italic and 600. The files are TTF, Latin subset, in `report/src/fonts/`. The generated module `report/src/fuentes.generated.mjs` holds them as base64 (script `report/scripts/embed-fonts.mjs`). Reason: TTF files avoid a slow decompression step (the WOFF files took 1.5 s of CPU; the TTF files take 0.3 s), and base64 modules need no file path in the function.

**R-17** Design tokens are the tokens of D-01. The PDF uses `--signal` only for kickers, numerals, bars, list markers and rules. No gradient, no shadow, no photograph, no icon.

**R-18** Layout robustness. The generator must not draw text outside the page margins for any name up to 80 characters or any organization up to 80 characters. Test AR-07 checks this.

---

## 8. E-mail

**R-19** Provider: Brevo, endpoint `POST https://api.brevo.com/v3/smtp/email`, header `api-key` from `BREVO_API_KEY`. Put the calls in `netlify/functions/lib/mailer.mjs` with one function: `enviarCorreo({ para, asunto, texto, html, adjuntos, responderA })`. Do not call Brevo from any other file.

**R-20** E-mail to the reader (`origen` = `autoevaluacion`):

- From: `MAIL_FROM_NAME <MAIL_FROM>`. The address `MAIL_FROM` is on the domain of the site. Reply-To: `MAIL_REPLY_TO`.
- Subject, greeting, body, signature and footer: `correo.usuario` in the JSON file. Replace `{nombre}`, `{enlace_whitebook}` (from `WHITEBOOK_URL`), `{sitio}` (from `SITE_HOST`), `{url_privacidad}` (`SITE_URL` + `/privacidad/`) and `{contacto}`.
- Attachment: the PDF, with the name `correo.usuario.nombre_adjunto`; `{fecha_iso}` is the date in the Europe/Madrid time zone.
- Provide a plain-text part and an HTML part. HTML: one column, maximum width 600 px, system fonts, inline styles, no images, no tracking pixel, no tracked links. Turn off click and open tracking in Brevo if the account setting allows it.

**R-21** E-mail to the reader (`origen` = `whitebook`): as R-20, with the keys `correo.whitebook`; no attachment; `{url_autoevaluacion}` is `SITE_URL` + `/autoevaluacion/`.

**R-22** E-mail to the author: to `AUTHOR_EMAIL`. Keys `correo.autor` (self-assessment) or `correo.autor_whitebook`. Fill the fields:

- `{grupos}`: the six decision scores as `n/9`, separated by ` · `, in the order of the decisions.
- `{arquetipo}`: the title of the global reading.
- `{por_decidir}`: the numbers of the decisions in state `por_decidir`, or `ninguna`.
- `{marketing}`: `sí` or `no`.
- `{organizacion_corta}`: ` · ` plus the organization if given; otherwise empty.
- Do not attach the PDF. Do not include the 18 individual answers.

**R-23** Deliverability. The sender domain must have SPF, DKIM and DMARC records as Brevo gives them. The author does this (Section 15). Without these records the e-mail can go to spam. Until the domain is ready, use `DELIVERY_MODE=download` only for tests. **Do not use a free-mail address (Gmail, Outlook) as `MAIL_FROM`.**

**R-24** If `info` is checked and `BREVO_LIST_ID` is set: `POST https://api.brevo.com/v3/contacts` with `{ email, attributes: { FIRSTNAME: nombre }, listIds: [BREVO_LIST_ID], updateEnabled: true }`. Do this only when the consent is given.

---

## 9. Logging

**R-25** The function must not write to any log: the e-mail address, the name, the organization, the answers, the IP address or the PDF. Log only: UTC time, `origen`, HTTP status, a short error code, duration in ms. Test AR-05 checks this.

---

## 10. Privacy and legal content

The author is the data controller. The text of the legal pages must match how the system works. The author must have a lawyer review the legal pages before launch. **Claude Code is not a lawyer: write the text below as a draft and mark the page with `[__] Revisión jurídica pendiente`.**

Add to the privacy policy (Spanish, final wording for the draft):

- Data processed: e-mail address; name and organization if given; the 18 answers, only to prepare the report; the date of the request.
- Purpose and legal basis: prepare and send the requested report or whitebook (consent); if the optional box is checked, send occasional information about the author's activity (consent).
- What the author keeps: the notification e-mail, with the e-mail address, the optional data, the total score and the six decision scores. The 18 individual answers are not stored by the site.
- Processors: Netlify (hosting and execution of the function) and Brevo (sending of e-mail). Add their names, their country and the transfer mechanism. `[__]` for the author and the lawyer to confirm.
- Retention: `[__] meses` (the author decides; suggested 12 months from the request).
- Rights: access, rectification, erasure, restriction, portability and objection (GDPR articles 15 to 22). Contact: `CONTACT_EMAIL`. Right to complain to the Agencia Española de Protección de Datos.
- No cookies. No analytics.

Also update the cookie page: it says that the site uses no cookies. The browser stores the saved answers in `localStorage` (F-04); say so in one sentence.

---

## 11. Configuration

All values are Netlify environment variables. Do not write a value in the repository. Write the names and the purpose in `README.md` and in a file `.env.example` (names only, with empty values).

| Name | Secret | Meaning |
|---|---|---|
| `BREVO_API_KEY` | yes | Brevo API key |
| `MAIL_FROM` | no | Sender address on the site domain, for example `informes@<domain>` |
| `MAIL_FROM_NAME` | no | `David Pereira Paz` |
| `MAIL_REPLY_TO` | no | Address that receives the replies of readers |
| `AUTHOR_EMAIL` | no | Address that receives the lead notifications |
| `CONTACT_EMAIL` | no | Public contact address, used in the report and the legal pages |
| `WHITEBOOK_URL` | yes | Private link of the whitebook PDF |
| `SITE_URL` | no | Final public URL of the site, without a final slash |
| `SITE_HOST` | no | Host name of the site, for example `supervisarlaia.es` |
| `BREVO_LIST_ID` | no | Optional. Brevo list for readers who gave the optional consent |
| `DELIVERY_MODE` | no | `email` (default) or `download` (local tests only, R-14) |

If a required variable is missing in mode `email`, the function must answer `500` with the code `error_interno` and write the name of the missing variable (not its value) to the log.

---

## 12. Repository additions

```
/
  netlify/functions/
    informe.mjs                    (R-04, R-05)
    lib/validate.mjs
    lib/ratelimit.mjs
    lib/mailer.mjs                 (R-19)
    lib/respuesta.mjs              (JSON and redirect answers)
  report/                          (copy of the reference implementation, Section 16)
    content/informe.es.json
    src/engine.mjs
    src/render-pdf.mjs
    src/fuentes.mjs
    src/fuentes.generated.mjs
    src/fonts/*.ttf
    scripts/*.mjs
    test/perfiles.json
    out/                           (in .gitignore)
  error/index.html
  .env.example
  .gitignore                       (add report/out/ and node_modules/)
  package.json                     (dependencies pdf-lib and @pdf-lib/fontkit; script "test")
  .github/workflows/ci.yml         (runs `npm ci` and `npm test` on each push)
```

Remove `.github/workflows/deploy.yml` (GitHub Pages). Keep `netlify.toml` and add:

```
[build]
  publish = "."
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
[[redirects]]
  from = "/api/informe"
  to = "/.netlify/functions/informe"
  status = 200
```

Set the security headers of T-11 for `/*`. Set `Cache-Control: no-store` for `/api/*`.

The function imports `report/content/informe.es.json` with a static import, so the bundler includes it.

---

## 13. Build steps

Do these steps after step 6 of the base specification, in this sequence. Then continue with step 7.

- **6a** Copy the folder `report/` from the author's package into the repository. Run `npm ci` (or `npm install`) and `npm test`. All tests must pass before you continue. Add `report/out/` to `.gitignore`.
- **6b** Write `netlify/functions/informe.mjs` and the files in `lib/` (R-04 to R-14, R-19 to R-25). Write unit tests for `validate.mjs`, `ratelimit.mjs` and `informe.mjs`, with a mocked `fetch` for Brevo. Add them to `npm test`.
- **6c** Update `/autoevaluacion/` and `/whitebook/` (forms of R-01, copy of Section 4.1) and the page script (R-02). Create `/error/`. Update `/gracias/`.
- **6d** Update the legal pages (Section 10) and `netlify.toml` (Section 12). Remove all references to Formspree and Web3Forms in the code, the README and the CSP.
- **6e** Run the function locally with `netlify dev` and `DELIVERY_MODE=download`. Generate a PDF for each of the five profiles in `report/test/perfiles.json` with `curl`. Convert each PDF to PNG (`pdftoppm -r 70`) and look at every page. Fix any text outside the margins, overlap or empty page.
- **6f** Run the checks AR-01 to AR-12. Fix all failures.

---

## 14. Acceptance checks

**AR-01** `npm test` passes. It includes the nine tests of the reference code and the new tests of step 6b.

**AR-02** Generate the PDF for the five profiles of `report/test/perfiles.json`. For each file: A4, 8 to 12 pages, less than 300 KB (R-15). Look at all pages as PNG. No text outside the margins. No overlap. No page with only one or two lines, except the last page.

**AR-03** With `DELIVERY_MODE=download`, send these requests with `curl` and confirm the answers:

| Request | Expected |
|---|---|
| Valid, 18 answers | `200`, `application/pdf`, the file starts with `%PDF-` |
| 17 answers | `422`, code `faltan_afirmaciones` |
| Answer value `4` | `422` |
| `correo` = `no-es-un-correo` | `400`, code `correo_invalido` |
| `consentimiento` missing | `400` |
| `_gotcha` = `x` | `200` (success answer), no PDF, no e-mail |
| Body of 20 KB | `413` |
| `GET` | `405` |
| Same IP, sixth request in one hour | `429` |
| `CONTEXT=production` with `DELIVERY_MODE=download` | `503` |

**AR-04** Plain POST without JavaScript (use `curl` without the `Accept` header): success gives `303` to `/gracias/`; failure gives `303` to `/error/`.

**AR-05** Run the function with fake data (for example `nombre` = `Zzyzx Qwerty`). Capture all log output. Confirm that it does not contain `Zzyzx`, the fake e-mail address, `@`, or any of the 18 answers.

**AR-06** Extract the text of each test PDF with `pdftotext -layout`. Confirm: no `�`, no `undefined`, no `NaN`, no `{`, no `[__]`. The string `[fecha]` is allowed once. Confirm that the words «Decidida», «A medias» and «Por decidir» appear and that the accented letters are correct.

**AR-07** Generate the PDF with a name of 80 characters and an organization of 80 characters (wide letters such as `WWWW`). Confirm that the cover text stays inside the page.

**AR-08** Run Lighthouse on `/` and `/autoevaluacion/` (A-02). The scores must stay at the same level. The script of the self-assessment is 12 KB or less.

**AR-09** With the network tab open on `/autoevaluacion/`, answer all statements and submit (in a test environment). Confirm that the only requests go to the site origin (A-10).

**AR-10** Confirm that `git ls-files` shows no `.pdf` file and no `.env` file (A-06).

**AR-11** Confirm that the response headers of `/` contain the CSP of T-11 and that `/api/informe` answers with `Cache-Control: no-store`.

**AR-12** Confirm that the files `.github/workflows/deploy.yml`, and any mention of `formspree` or `web3forms`, no longer exist in the repository.

**AR-13** *(The author does this, in production.)* Fill the self-assessment with a personal e-mail address. Confirm: the PDF arrives attached; the whitebook link opens; in Gmail, "Show original" shows `SPF: PASS`, `DKIM: PASS` and `DMARC: PASS`; the author receives the notification; the e-mail is not in spam.

---

## 15. Open items for the author

These steps need a person. Claude Code must not try to do them.

- `[__]` **Domain.** Buy a domain, point it to Netlify, and enable HTTPS. The domain is needed for e-mail (R-23). Write the final URL in `SITE_URL` and `SITE_HOST`.
- `[__]` **Netlify account.** Create the site from the GitHub repository. Set the environment variables of Section 11.
- `[__]` **Brevo account.** Create the account. Authenticate the domain (SPF, DKIM, DMARC). Create the API key and put it in `BREVO_API_KEY`. Check the limits and the branding of the free plan. Optional: create a list for `BREVO_LIST_ID`.
- `[__]` **Addresses.** `MAIL_FROM`, `MAIL_REPLY_TO`, `AUTHOR_EMAIL`, `CONTACT_EMAIL`.
- `[__]` **Whitebook link.** A private link to the PDF, in `WHITEBOOK_URL`.
- `[__]` **Legal review.** Review the legal pages: processors, transfers, retention period, and the data controller details (name, tax ID, address).
- `[__]` **Conflict rule.** The notification contains the organization. Before the author replies to a lead, he applies his rule: no personal services to companies where SEIDOR has business.
- The open items of base Section 12 that remain: publication date, `author.jpg`, social assets URL.

---

## 16. Reference implementation (folder `report/`)

| File | Purpose |
|---|---|
| `content/informe.es.json` | All Spanish text and the data of the rules. The author edits this file. |
| `src/engine.mjs` | Pure functions: validate, score, states, global reading, priorities, answers to contrast. No network, no disk. |
| `src/render-pdf.mjs` | Builds the PDF with `pdf-lib` and `@pdf-lib/fontkit`. Also `limpiarTexto`, `fechaLarga`, `fechaISO`. |
| `src/fuentes.mjs`, `src/fuentes.generated.mjs`, `src/fonts/*.ttf` | The five fonts. |
| `scripts/make-samples.mjs` | Writes the sample PDFs to `out/`. |
| `scripts/test-engine.mjs` | Tests (`npm test`). |
| `scripts/export-review.mjs` | Writes `CONTENIDO_informe_revision.md`, a readable copy of all text for the author. |
| `scripts/embed-fonts.mjs` | Rebuilds `fuentes.generated.mjs` from the TTF files. |
| `scripts/bench.mjs` | Measures the CPU time of one report (expected: 0.2 to 0.5 s after the first run). |
| `test/perfiles.json` | Five test profiles, one for each global reading. |

Rules for changes to the reference code:

- Do not change the engine thresholds (R-08).
- You can change `render-pdf.mjs` to fix a layout defect. After each change, run `npm test` and look at the five sample PDFs.
- If the first call of the function is slower than 8 seconds, write a `BLOCKERS.md` entry. Do not remove a font.

End of addendum.
