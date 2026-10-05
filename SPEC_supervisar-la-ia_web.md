# Specification: Web assets for "Supervisión de la IA"

Document type: Build specification
Language of this document: ASD-STE100 Simplified Technical English (Issue 8)
Language of all published content: Spanish (es-ES)
Target reader: Claude Code (build agent)
Author: David Pereira Paz
Version: 1.2, 2026-10-05 (adds the personalized PDF report; hosting moves to Netlify)
Addendum: `SPEC_informe-personalizado.md` (read it together with this file; it wins if the two disagree)
Copy changes authorized by the author on 2026-10-03 are applied to Sections 5 and 13.5 (see DECISIONS.md).

---

## 0. How to read this specification

- Each requirement has an identifier: `F-` (functional), `T-` (technical), `D-` (design), `C-` (content), `A-` (acceptance).
- The word **must** gives a mandatory requirement. The word **should** gives a recommended requirement. The word **can** gives an option.
- Do the steps in Section 10 in the given sequence. Do not start a step before the previous step is complete.
- Do not add a feature that is not in this specification. If a requirement is not clear, stop and ask the author.
- Do not invent facts, names, quotations, testimonials or statistics. Use only the content in Section 5 and in the source files that the author supplies.
- Version 1.2 adds a server-side function. The addendum `SPEC_informe-personalizado.md` defines it. Where this file and the addendum disagree, the addendum wins. The requirements that version 1.2 changed are marked `(v1.2)`.

---

## 1. Purpose

Build a small public website that does these three things:

1. Shows what the whitebook "Supervisión de la IA. Seis decisiones que un consejo no puede delegar" is.
2. Gives the reader a free self-assessment tool for boards.
3. Collects the e-mail address of the reader (a lead) in exchange for the whitebook link or for a personalized PDF reading of the self-assessment result. (v1.2)

The website is a static site with one serverless function (`/api/informe`) that builds and sends the PDF report. It runs on Netlify. The code is in a GitHub repository. (v1.2)

The author uses the leads to offer board sessions, board assessments and annual advisory. The website does not sell these services directly. The website must not show prices.

---

## 2. Scope

### 2.1 In scope

- Landing page (home).
- Self-assessment page (interactive, client-side only).
- Download page for the whitebook (gated by e-mail).
- Legal pages: privacy, cookies, legal notice.
- Thank-you page.
- An e-mail capture form that posts to the site's own function `/api/informe`. (v1.2)
- A serverless function that builds the personalized PDF report and sends it by e-mail, with the report content and generator in the folder `report/` (see addendum). (v1.2)
- An error page `/error/`. (v1.2)
- Open Graph and social metadata.
- Deployment configuration for Netlify, built from the GitHub repository. (v1.2)
- A README with build, test and deploy instructions.
- A set of visual assets for LinkedIn and X (Twitter) to announce the whitebook and the self-assessment (Section 13).

### 2.2 Out of scope

- A blog or newsletter engine. Links to external newsletter are permitted.
- Payments.
- User accounts, login or sessions.
- A content management system.
- Analytics that set cookies without consent.
- Chatbots or AI assistants on the page.

---

## 3. Users and goals

| User | Goal | Success |
|---|---|---|
| Board member or company secretary | Know in 60 seconds if the whitebook is useful | Downloads the PDF |
| CEO or general manager | Get a quick diagnosis of the board's AI supervision | Completes the self-assessment and leaves an e-mail |
| Reviewer sent by a colleague | Read a short, credible page | Shares the link |
| The author | Receive leads with context | Each lead arrives by e-mail with the total score, the six group scores and the global reading (v1.2) |

---

## 4. Site map

```
/                      Landing page
/autoevaluacion/       Self-assessment (18 statements)
/whitebook/            Download page (e-mail gate)
/gracias/              Thank-you page after form submission
/error/                Error page (noindex, not in the sitemap) (v1.2)
/privacidad/           Privacy policy
/cookies/              Cookie policy
/aviso-legal/          Legal notice
/404.html              Not found
```

Each page is one `index.html` file in its folder. Do not use query strings for navigation.

---

## 5. Content

All content below is final copy in Spanish. Use it as given. Do not translate it. Do not change the tone. Where the text shows `[__]`, the author must supply the value before deployment.

### 5.1 Global

- Site name: `Supervisión de la IA`
- Author line: `David Pereira Paz`
- Tagline (meta description): `Seis decisiones que un consejo de administración no puede delegar. Guía breve y autoevaluación gratuita para consejeros.`
- Footer text: `© 2026 David Pereira Paz. Las opiniones son del autor y no representan a ninguna organización con la que colabora.`
- Footer links: `Privacidad · Cookies · Aviso legal · LinkedIn`
- LinkedIn URL: `https://www.linkedin.com/in/dpereirapaz/`

### 5.2 Landing page (`/`)

**C-01 Hero**

- Kicker: `Guía breve para consejeros`
- Title (H1): `Supervisar la IA sin ser técnico`
- Subtitle: `Seis decisiones que un consejo de administración no puede delegar. Una hora de lectura y criterio suficiente para preguntar, exigir y decidir.`
- Primary button: `Descargar el whitebook` → `/whitebook/`
- Secondary button: `Hacer la autoevaluación` → `/autoevaluacion/`

**C-02 The six decisions (section)**

Section title: `Las seis decisiones`

Six cards, in this sequence. Each card has a number, a title and one sentence.

1. `Por dónde empezar` — `Elegir los usos por valor, riesgo y viabilidad. Tan importante como lo que se aprueba es lo que se descarta.`
2. `Cómo gobernarla` — `Que alguien con nombre pueda detener un sistema mañana, y que toda la organización sepa quién es.`
3. `Cómo pasar de las pruebas a los resultados` — `Cada piloto nace con una fecha para ampliarse o cerrarse.`
4. `Cómo medir` — `Un dato de valor llega al consejo, y alguien responde de él.`
5. `Sobre qué tecnología construir` — `Cambiar de proveedor es una decisión de gestión, no una reconstrucción.`
6. `Cómo implicar a las personas` — `El uso sobrevive a la salida de quien lo impulsó.`

**C-03 One question (statement section)**

Text: `¿Puede la dirección decirnos qué no va a hacer este año con la IA, quién tiene autoridad para frenar un proyecto y qué dato nos va a traer, y cuándo?`

**C-04 What the whitebook contains**

Section title: `Qué contiene`

List:
- `Doce capítulos y cuatro anexos. Unas 55 páginas.`
- `Qué ha cambiado de verdad, y qué parte es ruido.`
- `Cuánta autonomía dar a la máquina y qué control exige cada grado.`
- `Por qué la factura sube cuando los precios bajan.`
- `El impacto de la IA en el modelo de negocio, con un ejemplo con números.`
- `Las tres próximas reuniones del consejo: qué pedir, qué aprobar y qué recibir en cien días.`
- `Veinte preguntas para una sesión de consejo y una autoevaluación de dieciocho afirmaciones.`

**C-05 Author**

Section title: `Sobre el autor`

Text: `David Pereira Paz es ingeniero de Telecomunicación y ha cursado programas de alta dirección y para consejeros en IESE y ESADE. Dirige el área global de Datos e Inteligencia Artificial de una consultora tecnológica internacional, es profesor en ISDI y The Valley, miembro del consejo asesor del Observatorio de Ética en Inteligencia Artificial de Cataluña y miembro fundador del consejo editorial de la revista AI and Ethics (Springer Nature). Este material nace de sus sesiones con directivos. Las opiniones son exclusivamente suyas.`

Note to builder: do not add a photograph unless the author supplies the file `author.jpg`.

**C-06 Closing call to action**

Title: `Empiece por la autoevaluación`
Text: `Dieciocho afirmaciones, cinco minutos. El resultado le dice qué decisiones puntúan cero.`
Button: `Hacer la autoevaluación` → `/autoevaluacion/`

### 5.3 Self-assessment page (`/autoevaluacion/`)

**C-07 Intro**

- H1: `Autoevaluación del consejo`
- Text: `Dieciocho afirmaciones, tres por decisión. Puntúe cada una de 0 a 3. No se envía nada hasta que usted lo decida.`
- Scale legend: `0 · No es cierto` / `1 · Cierto en parte, sin documentar` / `2 · Cierto y documentado` / `3 · Cierto, documentado y revisado en el último año`

**C-08 Statements**

Six groups. Each group has a title and three statements. Each statement has a radio control with values 0, 1, 2, 3.

Group 1 `Por dónde empezar`
1. `Existe una lista priorizada de usos de IA, con el valor, el riesgo y la viabilidad de cada uno.`
2. `La dirección ha dejado por escrito qué no va a hacer este año con la IA, y por qué.`
3. `El consejo ha discutido el impacto de la IA en el modelo de negocio de la compañía, con un análisis de mercado delante.`

Group 2 `Cómo gobernarla`
4. `Hay un inventario completo de los sistemas de IA en uso, incluidos los que la plantilla utiliza por su cuenta.`
5. `Una persona concreta puede detener cualquier sistema de IA, y toda la organización sabe quién es.`
6. `Los sistemas que intervienen en decisiones sobre personas están identificados y clasificados por riesgo.`

Group 3 `Cómo pasar de las pruebas a los resultados`
7. `Cada piloto abierto tiene una fecha acordada para ampliarse o cerrarse.`
8. `Antes de empezar cada piloto se acuerda el criterio de valor con el que se evaluará.`
9. `Existe una forma estable de llevar un sistema a producción, con responsables definidos.`

Group 4 `Cómo medir`
10. `Hay un punto de partida registrado antes de empezar cada iniciativa.`
11. `Al consejo llega un dato de valor con alguien que responde de él.`
12. `Ningún indicador de uso se ha convertido en objetivo.`

Group 5 `Sobre qué tecnología construir`
13. `Cambiar de proveedor de modelos no obligaría a rehacer los sistemas.`
14. `Existe una batería de casos reales que se repite antes de cada cambio de modelo.`
15. `En los procesos más delicados hay un umbral de confianza y una vía para pasar el caso a una persona.`

Group 6 `Cómo implicar a las personas`
16. `El uso de la IA no depende de dos o tres personas concretas.`
17. `Las medidas de alfabetización en IA están documentadas y se pueden acreditar.`
18. `Hay un plan para formar a los expertos del futuro si dejan de entrar perfiles júnior.`

**C-09 Result**

The result area shows:
- Total score as `N / 54`.
- Six bars, one per group, each with the group score as `n / 9`.
- One line of text: `Decisiones que puntúan cero: ` followed by the group titles whose score is 0, or `ninguna`.
- One fixed sentence: `Una puntuación baja es el punto de partida que tienen hoy casi todas las empresas.`
- A form (see F-05) with the title, text and button of C-10 (addendum, Section 4.1). (v1.2)

The result area must not show a ranking, a benchmark, a percentile, a traffic light, or an interpretation by score band. This is a deliberate decision of the author. The rule applies to the page. The PDF report that the reader can request follows decision D-R7 of the addendum. (v1.2)

### 5.4 Whitebook download page (`/whitebook/`)

- H1: `Descargar el whitebook`
- Text: `Déjenos su correo y recibirá el enlace de descarga. Un correo, sin secuencias automáticas. Puede darse de baja en cualquier momento.`
- Form (see F-05, with `origen` = `whitebook`; copy in addendum C-11). Button: `Recibir el whitebook`.
- Below the form: the list C-04 again (same component).

### 5.5 Thank-you page (`/gracias/`)

- H1: `Gracias`
- Text: `Revise su correo en los próximos minutos. Si ha pedido el resultado de la autoevaluación, el PDF va adjunto. Si no lo encuentra, mire en la carpeta de correo no deseado.` (v1.2)
- Link: `Volver al inicio` → `/`

### 5.6 Legal pages

Use standard Spanish templates for a personal professional website. The data controller is the author. The author must supply: full name, tax ID, postal address, contact e-mail. Mark these as `[__]` in the template. State clearly: the data collected is the e-mail address, the optional name and organization, and the 18 self-assessment answers (used only to build the report, not stored); the author receives the total score and the six group scores; the data is used to send the requested material and, if the user gives consent, occasional information about the author's activity; the data processors are named in Section 10 of the addendum (v1.2). Include the rights of access, rectification and erasure (GDPR articles 15 to 22) and a contact e-mail to exercise them. Follow Section 10 of the addendum for the full content and mark the pages for legal review. (v1.2)

---

## 6. Functional requirements

**F-01** The site must work with JavaScript disabled, except the live score calculation on the self-assessment page. With JavaScript disabled, the form must still submit as a plain HTML POST to `/api/informe`, and the reader must still reach `/gracias/`. (v1.2)

**F-02** Every page must load in less than 2 seconds on a 4G connection. Measure with Lighthouse. Target: performance score 95 or more, accessibility 100, best practices 100, SEO 100.

**F-03** The self-assessment must calculate the score in the browser. It must not send any data until the user presses the submit button. The browser then sends the 18 answers; the server calculates all scores again. (v1.2)

**F-04** The self-assessment must store the answers in `localStorage` so a user who returns to the page sees the previous answers. Provide a `Borrar respuestas` link that clears them.

**F-05** The lead form has the fields of requirement R-01 of the addendum: `correo`, `nombre` (optional), `organizacion` (optional), `consentimiento`, `info` (optional), the hidden `origen`, the honeypot `_gotcha`, and, on the self-assessment page, the 18 radio groups `r1` to `r18` inside the same form. The hidden fields `puntuacion_total`, `puntuacion_grupos` and `fecha` no longer exist. (v1.2)

**F-06** On submit, the form must send the data to `/api/informe` (addendum R-02 and R-03) and the reader must reach `/gracias/`. (v1.2)

**F-07** The whitebook PDF must not be in the repository or at a public, guessable URL of the site. The e-mail contains a private link that the author sets in the environment variable `WHITEBOOK_URL`. (v1.2)

**F-08** The site must show a cookie notice only if the site sets non-essential cookies. The reference build sets no cookies. In that case, the cookie page must say so and no banner is shown.

**F-09** All external links must open in the same tab, except the LinkedIn link, which opens in a new tab with `rel="noopener"`.

**F-10** The site must have a `sitemap.xml` and a `robots.txt` that permits indexing of all pages except `/gracias/`.

---

## 7. Technical requirements

**T-01** Stack: plain HTML5, CSS3 and vanilla JavaScript (ES2020). No framework. No build step is mandatory. A build step with a static generator is permitted only if the output is plain files and the generator is documented in the README.

**T-02** Repository structure:

```
/
  index.html
  autoevaluacion/index.html
  whitebook/index.html
  gracias/index.html
  privacidad/index.html
  cookies/index.html
  aviso-legal/index.html
  404.html
  assets/css/site.css
  assets/js/autoevaluacion.js
  error/index.html                (v1.2)
  netlify/functions/              (v1.2, see addendum Section 12)
  report/                         (v1.2, content and generator of the PDF report)
  .env.example                    (v1.2, names of environment variables only)
  assets/img/           (og-image.png, favicon.svg, favicon.png, author.jpg if supplied)
  assets/fonts/         (self-hosted woff2 files)
  sitemap.xml
  robots.txt
  social/                        (source HTML templates and rendered PNG files, Section 13)
    templates/*.html
    render.mjs
    out/*.png
  README.md
  .github/workflows/ci.yml       (runs the tests, v1.2)
  netlify.toml                   (hosting, headers, function path)
```

**T-03** One shared stylesheet. Maximum size 30 KB uncompressed. No CSS framework.

**T-04** One JavaScript file for the self-assessment only. Maximum size 12 KB uncompressed (v1.2). No library. The landing page must load no JavaScript.

**T-05** Fonts must be self-hosted as woff2 with `font-display: swap`. Do not load fonts from Google Fonts at run time (privacy: avoids a third-party request). The two families are given in D-02. Download them once from Google Fonts, convert to woff2, and commit the files. Subset to Latin.

**T-06** Images: use SVG for the logo and icons. Use PNG for the Open Graph image at 1200 × 630 px. Total image weight per page: less than 200 KB.

**T-07** Hosting: Netlify. The site is built from the `main` branch of the GitHub repository. Publish directory: the repository root. No build step. Functions directory: `netlify/functions`. GitHub Pages is not used. Links should stay relative. A custom domain is needed to send e-mail (addendum R-23). (v1.2)

**T-08** Form handling: the function `/api/informe` (addendum Section 5 and 6). Do not use Formspree or Web3Forms. (v1.2)

**T-09** Spam control: add a honeypot input named `_gotcha`, hidden with CSS, not with `type="hidden"`. Do not use a CAPTCHA. The function also limits the rate (addendum R-12). (v1.2)

**T-10** PDF delivery: the e-mail contains the whitebook link from `WHITEBOOK_URL`. The repository must not contain the whitebook PDF. The report PDF is built for each request and is not stored. (v1.2)

**T-11** Security headers, set for all paths in `netlify.toml` (v1.2):
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; form-action 'self'; base-uri 'self'; frame-ancestors 'none'`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Cache-Control: no-store` for `/api/*`.

**T-12** Analytics: none in the reference build. If the author later enables analytics, use a cookieless service (for example Plausible or GoatCounter) and update the cookie page. Do not add Google Analytics.

**T-13** Accessibility: WCAG 2.2 level AA. Minimum color contrast 4.5:1 for body text and 3:1 for large text. All form controls have a visible `<label>`. The radio groups of the self-assessment use `<fieldset>` and `<legend>`. Focus is visible on all interactive elements. The page is fully usable with a keyboard.

**T-14** Metadata on every page: `<title>` (page title + ` · Supervisión de la IA`), `<meta name="description">`, `<link rel="canonical">`, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type=website`, `og:locale=es_ES`), Twitter card `summary_large_image`, `<html lang="es">`.

**T-15** Structured data: on the landing page, one JSON-LD block of type `Book` (name, author, inLanguage `es`, datePublished `[__]`) and one of type `Person` for the author with `sameAs` the LinkedIn URL.

**T-16** Print: the self-assessment page must print correctly on A4 with the answers and the result visible. Use a `@media print` stylesheet that hides navigation and the form.

**T-17** Browser support: the last two versions of Chrome, Edge, Firefox and Safari, and iOS Safari 16 or later.

---

## 8. Design requirements

The visual identity must match the whitebook. The reader must recognize the site and the PDF as one product.

**D-01 Color tokens** (CSS custom properties on `:root`):

| Token | Value | Use |
|---|---|---|
| `--ink` | `#18212F` | Headings, dark backgrounds |
| `--text` | `#1C2430` | Body text |
| `--muted` | `#5A6474` | Secondary text |
| `--paper` | `#FFFFFF` | Page background |
| `--tint` | `#F1F3F6` | Boxes, alternate sections |
| `--rule` | `#D9DCE1` | Borders, table rules |
| `--signal` | `#C8102E` | Accent: kicker, numbers, primary button, focus ring |

Use `--signal` sparingly: kickers, the large numerals, the primary button and the result bars. Never use it for body text.

**D-02 Typography**

- Headings, labels, buttons: `Poppins`, weights 400 and 600.
- Body text: `Lora`, weights 400 and 600, plus 400 italic.
- Type scale (desktop): H1 56px, H2 36px, H3 24px, body 19px, small 16px. Line height: headings 1.12, body 1.6.
- Type scale (mobile, less than 640px): H1 36px, H2 28px, H3 22px, body 18px.
- Maximum line length for body text: 68 characters (`max-width: 68ch`).
- No uppercase for labels. Sentence case everywhere.

**D-03 Layout**

- Single column. Content width 720px for text, 1040px for card grids.
- Side gutters: 24px on mobile, 48px on tablet, auto-centered on desktop.
- Section vertical spacing: 96px on desktop, 64px on mobile.
- The hero has a dark background (`--ink`) with light text, like the cover of the whitebook. A large numeral `6` in `--signal` sits at the right of the hero, partly cropped by the hero's edge, at 40 % opacity. On mobile the numeral is hidden.
- All other sections alternate between `--paper` and `--tint`.
- Cards: `--paper` background, 1px `--rule` border, 12px radius, 32px padding. No drop shadows.

**D-04 Components**

- Buttons: primary = `--signal` background, white text; secondary = transparent with 1.5px `--ink` border. Height 52px. Radius 8px. No gradients.
- Self-assessment control: each statement is a row with the statement text on the left and four radio buttons styled as 44 × 44 px squares on the right, labelled 0, 1, 2, 3. The selected square is filled `--ink` with white text. On mobile the squares go below the statement text.
- Result bars: six horizontal bars, 12px high, `--rule` track, `--signal` fill, label on the left, score on the right.
- Kicker: Poppins 600, 14px, `--signal`, sentence case, with a short 24px rule above it in `--signal`.

**D-05 Motion**: none, except a 150 ms color transition on buttons and radio squares. Respect `prefers-reduced-motion`.

**D-06 Dark mode**: not required. The site is light only. Set `color-scheme: light`.

**D-07 Imagery**: no stock photographs, no illustrations, no AI-generated images. The only images are the favicon, the Open Graph image (title on `--ink` background with the numeral `6`), and the author photograph if supplied.

**D-08 Favicon**: an SVG with the numeral `6` in `--signal` on `--ink`, rounded square.

---

## 9. Measurement

**M-01** The author measures three numbers each month:
- Leads from `/whitebook/`.
- Leads from `/autoevaluacion/`, with the average total score.
- Leads with the optional consent checkbox checked.

The author counts them from the notification e-mails that the function sends (addendum R-22). (v1.2)

**M-02** The site itself collects no other metric in the reference build.

---

## 10. Build steps (do in this sequence)

1. Create the repository structure of T-02. Create `README.md` with a title and the sections: Purpose, Local preview, Configuration (form endpoint, PDF link, author data), Deploy, Checks.
2. Download Poppins (400, 600) and Lora (400, 600, 400 italic) from Google Fonts. Convert to woff2 with Latin subset. Put the files in `assets/fonts/`. Write the `@font-face` rules in `site.css`.
3. Write `site.css` with the tokens of D-01, the type scale of D-02, the layout of D-03 and the components of D-04. Include the print stylesheet of T-16.
4. Build the landing page with the content of 5.2, in the sequence C-01 to C-06. Add the metadata of T-14 and T-15.
5. Build the self-assessment page with the content of 5.3. Write `autoevaluacion.js` for F-03 and F-04. Make the form work without JavaScript (F-01).
6. Build the whitebook page, the thank-you page and the legal pages.
6a to 6f. Build the report module, the function and the new forms. Follow Section 13 of the addendum `SPEC_informe-personalizado.md`. (v1.2)
7. Create the favicon (D-08) and the Open Graph image (D-07) as files.
8. Write `sitemap.xml`, `robots.txt` and `404.html`.
9. Write `netlify.toml` (hosting, function path, headers of T-11) and `.github/workflows/ci.yml` (runs `npm ci` and `npm test`). Do not write a GitHub Pages workflow. (v1.2)
10. Build the social templates of Section 13 and render them to PNG with the script of S-10.
11. Run the checks of Section 11 and Section 13.6. Fix all failures. Then commit and push.

---

## 11. Acceptance checks

**A-01** Validate each HTML page with the W3C validator. Zero errors.

**A-02** Run Lighthouse on `/` and `/autoevaluacion/` in mobile mode. Scores: performance ≥ 95, accessibility = 100, best practices = 100, SEO = 100.

**A-03** Disable JavaScript. Confirm: the landing page is complete; the self-assessment form can be submitted; the thank-you page shows.

**A-04** Submit the self-assessment form with 18 answers in the local test mode (`DELIVERY_MODE=download`). Confirm that the response is a PDF (addendum AR-03). (v1.2)

**A-05** Submit the whitebook form in production. Confirm that the reader receives an e-mail with the whitebook link and no attachment. The author does this check (addendum AR-13). (v1.2)

**A-06** Search the repository for `.pdf`. Confirm no PDF file is in the repository.

**A-07** Open the site at 360px, 768px and 1440px width. Confirm no horizontal scroll and no text overflow.

**A-08** Use only the keyboard to complete the self-assessment and submit. Confirm it is possible.

**A-09** Check all pages for the strings `lorem`, `TODO`, `[__]`. The build is not complete while any of them is present, except `[__]` in the legal pages until the author supplies the data.

**A-10** Confirm that no request goes to a third-party domain, on page load and on submit (check the network tab). All requests go to the site origin. (v1.2)

**A-11** Run all acceptance checks AR-01 to AR-12 of the addendum. (v1.2)

---

## 12. Open items for the author

Supply these before deployment. Section 15 of the addendum lists the steps that need a person (domain, Netlify, Brevo, addresses, legal review).

- `[__]` Legal data: full name, tax ID, postal address, contact e-mail.
- `[__]` Domain and final public URL of the site (also for the social assets, S-02). The domain is now required to send e-mail.
- `[__]` Netlify account and Brevo account, with the environment variables of addendum Section 11.
- `[__]` PDF private link for the e-mail (`WHITEBOOK_URL`).
- `[__]` Publication date of the whitebook for the JSON-LD.
- `[__]` Optional: `author.jpg`, 800 × 800 px (also for the author card, S-04, template 6).

---

## 13. Social media visual assets

### 13.1 Purpose

Produce a set of static images for LinkedIn and X (Twitter) that announce the whitebook and the self-assessment, and that send readers to the website. The images must have the same visual identity as the website and the whitebook (Section 8). A reader who sees an image and then opens the site must recognize them as one product.

### 13.2 General rules

**S-01** Build each asset as an HTML page with inline CSS, at the exact pixel size of the target format. Render it to PNG with a headless browser (see S-10). Do not design the assets in an image editor. This keeps the assets editable as text and lets the author change copy without a designer.

**S-02** Every asset shows the site URL in the footer zone, in Poppins 400, `--muted` on light backgrounds, `#9AA3B0` on dark backgrounds. The URL is `[__]`. Do not show the author's e-mail.

**S-03** Every asset uses only the tokens of D-01 and the typefaces of D-02. No gradients, no shadows, no stock photographs, no illustrations, no AI-generated images, no icons except the numeral `6` and simple rules.

**S-04** Text in images must stay legible at the smallest display size of the platform: minimum 28px at 1080px width for body text, minimum 64px for the main statement. Keep a safe margin of 80px on each side. Do not put text in the outer 6 % of the image, because platforms crop previews.

**S-05** The PNG files are sRGB, 24-bit, no alpha. Maximum file size: 1.5 MB each. Name them `social/out/<platform>-<format>-<slug>.png`.

**S-06** Each asset has an `alt` text of at most 120 characters, in Spanish, stored in `social/out/alt.json` as `{ "<file name>": "<alt text>" }`. The author pastes the alt text when he publishes.

### 13.3 Formats

| Id | Platform | Format | Size (px) | Use |
|---|---|---|---|---|
| L1 | LinkedIn | Single image post | 1200 × 1200 | Feed post |
| L2 | LinkedIn | Document (carousel) | 1080 × 1350, 7 pages | Feed post as PDF document |
| L3 | LinkedIn | Link preview | 1200 × 627 | Shown automatically when the site URL is pasted. Same file as the Open Graph image of T-14; keep the two in sync |
| L4 | LinkedIn | Profile banner | 1584 × 396 | Author profile header |
| X1 | X (Twitter) | Single image | 1600 × 900 | Feed post |
| X2 | X (Twitter) | Thread images | 1600 × 900, 4 images | One per tweet of a thread |
| X3 | X (Twitter) | Profile header | 1500 × 500 | Author profile header |

For L2, render each page as a PNG and also combine the seven pages into one PDF (`social/out/linkedin-carousel.pdf`) with a tool such as `img2pdf` or the headless browser's print function. LinkedIn shows a PDF as a swipeable carousel.

### 13.4 Templates

Build six HTML templates in `social/templates/`. Each template takes its copy from a small JSON block at the top of the file, so the author can change text without touching the layout.

**Template 1 · `statement.html`** (used by L1, X1, X2)

One large statement on a dark `--ink` background, white text in Poppins 600. The numeral `6` in `--signal` sits at the bottom right, partly cropped by the edge, at 40 % opacity. A short `--signal` rule, 48px wide, above the statement. The kicker `Supervisión de la IA · Guía breve para consejeros` in Poppins 400, `#9AA3B0`, at the top left. The site URL at the bottom left. Author name under the statement in Poppins 400, white.

Layout: statement block vertically centered, left-aligned, maximum width 78 % of the image. Statement font size: 92px for 1200 × 1200; 80px for 1600 × 900.

**Template 2 · `question.html`** (used by L1 variant, X1 variant)

Light `--paper` background. Kicker in `--signal`. A question in Lora 400 italic, `--ink`, 72px, left-aligned, maximum width 80 %. Below it, a one-line answer in Poppins 600, `--ink`, 40px. Footer with the URL. No numeral.

**Template 3 · `decision.html`** (used by L2 pages 2 to 7)

Light `--paper` background. At the top left, a large numeral (1 to 6) in Poppins 600, 240px, `--signal`. To its right, the kicker `Decisión n de 6`. Below, the decision title in Poppins 600, 64px, `--ink`. Below that, the one-sentence description in Lora 400, 40px, `--text`, maximum width 85 %. At the bottom, a progress strip: six segments, 12px high, the current one filled `--signal`, the rest `--rule`. Footer with the URL.

**Template 4 · `cover.html`** (used by L2 page 1, L3, and the Open Graph image)

Dark `--ink` background. Same composition as the whitebook cover: short `--signal` rule, title `Supervisar la IA` in Poppins 600, white, two lines; subtitle `Seis decisiones que un consejo no puede delegar` in Lora 400 italic, `#DCE1E8`; the numeral `6` large in `--signal` at the right; author name and URL at the bottom left. For 1200 × 627, reduce the title to 96px and the numeral to 420px.

**Template 5 · `banner.html`** (used by L4, X3)

Dark `--ink` background. Left zone (60 % of the width): title `Supervisar la IA sin ser técnico` in Poppins 600, white, 72px; below it, `Guía breve y autoevaluación gratuita para consejeros` in Lora 400 italic, `#DCE1E8`, 36px; URL in Poppins 400, `#9AA3B0`, 28px. Right zone: the numeral `6` in `--signal` at 40 % opacity, cropped by the top and right edges. Keep all text inside the central 70 % of the height, because the profile photograph covers the lower left corner on both platforms. Put the text block at the right of the first 20 % of the width for the same reason.

**Template 6 · `author.html`** (optional, used only if `author.jpg` is supplied)

Light `--paper` background. Left: the photograph, 480 × 480 px, `object-fit: cover`, 12px radius, grayscale filter. Right: name in Poppins 600, 56px; a two-line role description in Lora 400, 32px, `--muted`; a quotation from the whitebook in Lora 400 italic, 40px, `--ink`. Footer with the URL.

### 13.5 Copy for the assets

All copy is in Spanish and final. Do not change it. Where several variants are given, render all of them; the author chooses.

**L1 · LinkedIn single image** (Template 1 and Template 2). Render these five:

1. T1 · `La estrategia empieza por lo que no se puede comprar, porque lo que se alquila no es una ventaja.`
2. T1 · `Detrás de cada proceso automatizado tiene que haber alguien que dé la cara, porque una máquina no puede responder de nada.`
3. T1 · `Cada respuesta cuesta menos y la factura total crece. Las dos cosas son ciertas a la vez.`
4. T2 · Question: `¿Puede la dirección decirnos qué no va a hacer este año con la IA, quién puede frenar un proyecto y qué dato nos va a traer?` Answer: `Si no, el consejo todavía no supervisa la IA.`
5. T2 · Question: `¿Cuántos de sus pilotos de IA tienen fecha para ampliarse o cerrarse?` Answer: `Un piloto sin fecha es la forma más cara de aplazar una decisión.`

**L2 · LinkedIn carousel** (7 pages, 1080 × 1350):

- Page 1 (Template 4): cover.
- Pages 2 to 7 (Template 3): the six decisions, with the titles and sentences of C-02.

**L3 · Link preview / Open Graph** (Template 4, 1200 × 627).

**L4 · LinkedIn banner** (Template 5, 1584 × 396).

**X1 · X single image** (Template 1, 1600 × 900). Render statements 1, 2 and 3 of L1.

**X2 · X thread** (Template 1 and Template 2, 1600 × 900, four images):

1. T1 · `Supervisar la IA sin ser técnico. Seis decisiones que un consejo no puede delegar.`
2. T2 · Question: `¿Quién puede parar un sistema de IA mañana en su empresa?` Answer: `Si nadie sabe el nombre, no hay gobierno.`
3. T2 · Question: `¿Qué dato de valor llega al consejo, y quién responde de él?` Answer: `Los datos de uso son para la dirección; al consejo le llega el valor.`
4. T1 · `Dieciocho afirmaciones, cinco minutos. Autoevaluación gratuita para consejos.`

**X3 · X header** (Template 5, 1500 × 500).

**Post text** (not part of the images; the author publishes it with the images). Supply these as `social/out/posts.md`:

LinkedIn, launch post (with L2 carousel):

```
He escrito una guía breve para consejeros sobre cómo supervisar la IA sin ser técnico.

Explica qué exigir a la dirección, no la tecnología: seis decisiones que un consejo no puede delegar, qué pedir en las tres próximas reuniones y una autoevaluación de dieciocho afirmaciones.

Es gratuita. El enlace está en el primer comentario.
```

LinkedIn, self-assessment post (with L1 statement 4):

```
Dieciocho afirmaciones, cinco minutos.

En vez de una nota, el resultado dice qué decisiones puntúan cero, que es lo único que importa para la próxima reunión del consejo.

Autoevaluación gratuita para consejos, en el primer comentario.
```

X thread (four tweets, one image each, images X2-1 to X2-4):

```
1/ He escrito una guía breve para consejeros: cómo supervisar la IA sin ser técnico. Seis decisiones que un consejo no puede delegar. Gratuita. 🧵

2/ Primera prueba: ¿quién puede parar un sistema de IA mañana en su empresa? Si nadie sabe el nombre, no hay gobierno.

3/ Segunda: ¿qué dato de valor llega al consejo, y quién responde de él? Los datos de uso son para la dirección; al consejo le llega el valor.

4/ Hay una autoevaluación de dieciocho afirmaciones. Cinco minutos. Dice qué decisiones puntúan cero. [URL]
```

The author adds the URL in the first comment on LinkedIn (LinkedIn reduces the reach of posts with links in the body) and in the last tweet on X.

### 13.6 Rendering and acceptance

**S-10** Write `social/render.mjs`: a Node script that uses Playwright (Chromium) to open each template with each copy variant, set the viewport to the format size at device scale factor 1, wait for fonts to load (`document.fonts.ready`), and save a PNG. Fonts are the self-hosted woff2 files of T-05, loaded with `@font-face` from a relative path, so the templates render offline. The script reads a `social/manifest.json` that lists, for each output file: template, size, copy fields and alt text. Running `node social/render.mjs` must regenerate every PNG and the carousel PDF.

**S-11** Check each PNG at 100 % and at 25 % zoom. At 25 %, the main statement must still be readable. If not, increase the font size or shorten nothing: ask the author.

**S-12** Check that no text touches the safe margin of S-04.

**S-13** Open `linkedin-carousel.pdf` and confirm seven pages, portrait, in sequence.

**S-14** Confirm that `assets/img/og-image.png` and `social/out/linkedin-link-cover.png` are the same image.

**S-15** Confirm every output file is listed in `social/out/alt.json` with a non-empty alt text of at most 120 characters.

End of specification.
