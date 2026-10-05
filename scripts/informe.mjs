// Informe en PDF de cada autoevaluación recibida en Formspree, para uso interno del autor.
// Uso: node scripts/informe.mjs <exportacion.csv|json> [--email correo@dominio] [--out carpeta]
// Los textos de análisis proceden del whitebook (capítulo 5, capítulo 6 y anexos A y B).
import { chromium } from "playwright";
import { readFile, writeFile, mkdir, unlink } from "node:fs/promises";
import { pathToFileURL, fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const DECISIONES = [
  {
    titulo: "Por dónde empezar",
    pregunta: "¿Qué habéis decidido no hacer este año, y por qué?",
    tomada: "Está tomada cuando la dirección sabe decir qué no hará este año y explicar el motivo.",
    afirmaciones: [
      "Existe una lista priorizada de usos de IA, con el valor, el riesgo y la viabilidad de cada uno.",
      "La dirección ha dejado por escrito qué no va a hacer este año con la IA, y por qué.",
      "El consejo ha discutido el impacto de la IA en el modelo de negocio de la compañía, con un análisis de mercado delante.",
    ],
    preguntas: [
      "¿En qué tres usos se concentra el valor que esperamos, y cuánto vale cada uno?",
      "¿Qué hemos decidido no hacer este año?",
      "¿Qué parte de nuestra ventaja es propia y qué parte es tecnología de terceros?",
      "¿Estamos automatizando los procesos de siempre o replanteándolos?",
    ],
  },
  {
    titulo: "Cómo gobernarla",
    pregunta: "Si mañana hubiera que parar un sistema, ¿quién lo haría, y lo sabe toda la organización?",
    tomada: "Está tomada cuando hay una persona concreta que puede detener cualquier sistema y todo el mundo sabe quién es.",
    afirmaciones: [
      "Hay un inventario completo de los sistemas de IA en uso, incluidos los que la plantilla utiliza por su cuenta.",
      "Una persona concreta puede detener cualquier sistema de IA, y toda la organización sabe quién es.",
      "Los sistemas que intervienen en decisiones sobre personas están identificados y clasificados por riesgo.",
    ],
    preguntas: [
      "¿Tenemos un inventario completo de los sistemas de IA en uso, incluidos los que los empleados usan por su cuenta?",
      "¿Cuáles podrían considerarse de alto riesgo, y qué haremos antes de diciembre de 2027?",
      "¿Quién puede parar un sistema, y cuándo lo hizo por última vez (o cuándo tuvo que plantearse hacerlo)?",
      "¿Qué sistemas intervienen en decisiones sobre personas, y cómo se explican esas decisiones?",
      "¿Qué incidencias relacionadas con la IA hemos tenido, y cómo se resolvieron?",
    ],
  },
  {
    titulo: "Cómo pasar de las pruebas a los resultados",
    pregunta: "¿Qué pilotos tienen fecha para ampliarse o para cerrarse, y con qué criterio?",
    tomada: "Está tomada cuando cada piloto nace con una fecha acordada para extenderlo o abandonarlo en función de un indicador de valor concreto y medible.",
    afirmaciones: [
      "Cada piloto abierto tiene una fecha acordada para ampliarse o cerrarse.",
      "Antes de empezar cada piloto se acuerda el criterio de valor con el que se evaluará.",
      "Existe una forma estable de llevar un sistema a producción, con responsables definidos.",
    ],
    preguntas: ["¿Cuántos pilotos hay abiertos, y cuántos tienen fecha para ampliarse o cerrarse?"],
  },
  {
    titulo: "Cómo medir",
    pregunta: "¿Qué dato nos vais a traer, y quién responde de él?",
    tomada: "Está tomada cuando al consejo llega un dato de impacto en generación de valor en la cuenta de resultados y hay alguien que responde de él.",
    afirmaciones: [
      "Hay un punto de partida registrado antes de empezar cada iniciativa.",
      "Al consejo llega un dato de valor con alguien que responde de él.",
      "Ningún indicador de uso se ha convertido en objetivo.",
    ],
    preguntas: [
      "¿Qué dato de valor nos vais a traer, y quién responde de él?",
      "¿Desde qué punto de partida medimos?",
      "¿Cómo evoluciona el coste por unidad de valor, además del gasto total?",
    ],
  },
  {
    titulo: "Sobre qué tecnología construir",
    pregunta: "Si mañana tuviéramos que cambiar de proveedor, ¿cuánto tardaríamos y cuánto nos costaría?",
    tomada: "Está tomada cuando cambiar de proveedor es una decisión de gestión y no obliga a rehacer sistemas.",
    afirmaciones: [
      "Cambiar de proveedor de modelos no obligaría a rehacer los sistemas.",
      "Existe una batería de casos reales que se repite antes de cada cambio de modelo.",
      "En los procesos más delicados hay un umbral de confianza y una vía para pasar el caso a una persona.",
    ],
    preguntas: [
      "¿Cuánto nos costaría cambiar de proveedor de modelos?",
      "¿Cómo sabemos que un modelo nuevo es mejor para nosotros y no simplemente más reciente?",
      "¿Quién o qué comprueba las respuestas en los procesos más delicados?",
      "¿Cuánta autonomía tienen nuestros agentes, y con qué límite de gasto?",
    ],
  },
  {
    titulo: "Cómo implicar a las personas",
    pregunta: "Si se fuera quien lo impulsa, ¿se seguiría usando?",
    tomada: "Está tomada cuando el uso se mantiene aunque cambien las personas que lo pusieron en marcha.",
    afirmaciones: [
      "El uso de la IA no depende de dos o tres personas concretas.",
      "Las medidas de alfabetización en IA están documentadas y se pueden acreditar.",
      "Hay un plan para formar a los expertos del futuro si dejan de entrar perfiles júnior.",
    ],
    preguntas: [
      "¿Se seguiría usando si se marcharan quienes lo impulsan?",
      "¿Qué hemos hecho para formar a la plantilla en IA, y cómo lo acreditaríamos?",
      "¿Cómo vamos a formar a los expertos que necesitaremos dentro de diez años?",
    ],
  },
];

// Capítulo 6 del whitebook. «a» enlaza cada punto con las afirmaciones que lo cubren (1 a 18).
const REUNIONES = [
  {
    nombre: "Primera: pedir", dias: "Días 0 a 30",
    puntos: [
      { texto: "El inventario de sistemas de IA en uso, incluido el que la plantilla usa por su cuenta.", a: [4] },
      { texto: "El mapa de pilotos con su fecha de ampliación o cierre.", a: [7] },
      { texto: "El análisis de mercado sobre el impacto en el modelo de negocio.", a: [3] },
      { texto: "El nombre de quien puede parar un sistema.", a: [5] },
    ],
    sale: "Un encargo escrito a la dirección, con fecha de entrega para la segunda reunión.",
  },
  {
    nombre: "Segunda: decidir", dias: "Días 30 a 70",
    puntos: [
      { texto: "Las seis decisiones, cada una con responsable y fecha.", decisiones: true },
      { texto: "El techo de inversión en IA del ejercicio.", a: [1] },
      { texto: "El criterio de cierre de los pilotos abiertos.", a: [8] },
      { texto: "El modelo de precio y oferta, si el análisis de mercado lo exige.", a: [3] },
    ],
    sale: "Un acta con seis responsables, seis fechas y una cifra de inversión.",
  },
  {
    nombre: "Tercera: recibir", dias: "Días 70 a 100",
    puntos: [
      { texto: "El primer cuadro de mando: indicadores de control desde el primer día.", a: [15] },
      { texto: "Indicadores de uso para la dirección, sin convertirlos en objetivo.", a: [12] },
      { texto: "La línea de partida de los indicadores de valor.", a: [10, 11] },
      { texto: "El calendario de revisión.", a: [] },
    ],
    sale: "Un dato de valor, un responsable y una fecha para la siguiente revisión.",
  },
];

const NO_HACER = [
  ["Aprobar un plan de implantación detallado.", "Es trabajo de la dirección. El consejo aprueba decisiones, inversión y criterios de parada."],
  ["Elegir proveedor.", "Lo que se decide es que cambiar de proveedor no obligue a rehacer sistemas; cuál se usa hoy es una decisión de gestión."],
  ["Fijar objetivos de valor.", "Todavía no hay punto de partida. Un objetivo sin línea base es un número que nadie podrá defender."],
  ["Convertir el uso en objetivo.", "Cuánta gente usa la herramienta es un dato para la dirección. En cuanto se exige desde el consejo, deja de ser fiable."],
];

const ESCALA = ["No es cierto", "Cierto en parte, sin documentar", "Cierto y documentado", "Cierto, documentado y revisado en el último año"];

// ---------- lectura de la exportación ----------
function parseCSV(text) {
  const rows = []; let row = [], field = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field); if (row.some((v) => v !== "")) rows.push(row);
  const head = rows.shift().map((h) => h.trim().replace(/^﻿/, ""));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ""])));
}

async function leer(file) {
  const text = await readFile(file, "utf8");
  if (file.endsWith(".json")) {
    const j = JSON.parse(text);
    const list = Array.isArray(j) ? j : j.submissions || [];
    return list.map((s) => ({ ...(s.data || s), _date: s._date || s.created_at || s.submitted_at || "" }));
  }
  return parseCSV(text);
}

function campo(row, ...nombres) {
  const keys = Object.keys(row);
  for (const n of nombres) {
    const k = keys.find((k) => k.toLowerCase() === n.toLowerCase());
    if (k && String(row[k]).trim() !== "") return String(row[k]).trim();
  }
  return "";
}

function respuestas(row) {
  const lista = campo(row, "respuestas");
  if (lista) return lista.split(",").map((v) => (v.trim() === "" ? null : Number(v)));
  return Array.from({ length: 18 }, (_, i) => { const v = campo(row, "a" + (i + 1)); return v === "" ? null : Number(v); });
}

// ---------- análisis ----------
function analizar(r) {
  const grupos = DECISIONES.map((d, g) => {
    const vals = r.slice(g * 3, g * 3 + 3);
    return { ...d, n: g + 1, vals, total: vals.reduce((s, v) => s + (v || 0), 0) };
  });
  const total = grupos.reduce((s, g) => s + g.total, 0);
  const contestadas = r.filter((v) => v !== null).length;
  const ceros = grupos.filter((g) => g.total === 0);
  const sinDocumentar = []; const sinRevisar = [];
  grupos.forEach((g) => g.vals.forEach((v, i) => {
    const item = { n: g.n * 3 - 2 + i, texto: g.afirmaciones[i], decision: g.titulo };
    if (v === 1) sinDocumentar.push(item);
    if (v === 2) sinRevisar.push(item);
  }));
  const orden = [...grupos].sort((a, b) => a.total - b.total || a.n - b.n);
  return { grupos, total, contestadas, ceros, sinDocumentar, sinRevisar, orden };
}

function estadoPunto(p, r, an) {
  if (p.decisiones) {
    const debiles = an.grupos.filter((g) => g.total <= 3).map((g) => g.titulo);
    return debiles.length
      ? { cls: "alta", etiqueta: "Prioritario", nota: "Empezar por: " + debiles.join(", ") + "." }
      : { cls: "ok", etiqueta: "Revisar", nota: "Ninguna decisión por debajo de 4 / 9: confirmar responsables y fechas." };
  }
  if (!p.a.length) return { cls: "media", etiqueta: "Pendiente", nota: "" };
  const vals = p.a.map((n) => r[n - 1]);
  const min = Math.min(...vals.map((v) => (v === null ? 0 : v)));
  const ref = "Afirmación " + p.a.join(" y ") + ": " + vals.map((v) => (v === null ? "sin respuesta" : v)).join(" y ");
  if (min <= 1) return { cls: "alta", etiqueta: "Prioritario", nota: ref + "." };
  if (min === 2) return { cls: "media", etiqueta: "Confirmar", nota: ref + "; pedir la evidencia y su revisión." };
  return { cls: "ok", etiqueta: "Cubierto", nota: ref + "; basta con verificar la evidencia." };
}

// ---------- HTML ----------
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function fechaLegible(iso) {
  const d = new Date(iso);
  return isNaN(d) ? (iso || "sin fecha") : d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

function html(row) {
  const r = respuestas(row);
  const an = analizar(r);
  const email = campo(row, "email", "_replyto");
  const nombre = campo(row, "nombre", "name");
  const fecha = campo(row, "fecha", "_date", "Submitted At", "created_at");
  const comunicaciones = /^(si|sí|on|true|yes)$/i.test(campo(row, "comunicaciones"));
  const font = (f) => pathToFileURL(path.join(ROOT, "assets/fonts", f)).href;

  const barras = an.grupos.map((g) => `
    <tr><td class="bl">${g.n}. ${esc(g.titulo)}</td>
      <td class="bt"><div><span style="width:${(g.total / 9) * 100}%"></span></div></td>
      <td class="bs">${g.total} / 9</td></tr>`).join("");

  const lista = (items) => items.length
    ? "<ul>" + items.map((i) => `<li><b>${i.n}.</b> ${esc(i.texto)} <span class="m">(${esc(i.decision)})</span></li>`).join("") + "</ul>"
    : "<p class=\"m\">Ninguna.</p>";

  const decisiones = an.orden.map((g) => `
    <section class="dec">
      <h3><span class="num">${g.n}</span>${esc(g.titulo)} <span class="pt">${g.total} / 9</span></h3>
      <table class="af">${g.vals.map((v, i) => `
        <tr><td class="v v${v ?? "x"}">${v ?? "–"}</td><td>${esc(g.afirmaciones[i])}<br><span class="m">${v === null ? "Sin respuesta" : ESCALA[v]}</span></td></tr>`).join("")}
      </table>
      <p class="q">${esc(g.pregunta)}</p>
      <p class="m">${esc(g.tomada)}</p>
    </section>`).join("");

  const plan = REUNIONES.map((m) => `
    <section class="reu">
      <h3>${esc(m.nombre)} <span class="m">· ${esc(m.dias)}</span></h3>
      <table class="pl">${m.puntos.map((p) => { const e = estadoPunto(p, r, an); return `
        <tr><td class="tag ${e.cls}">${e.etiqueta}</td><td>${esc(p.texto)}${e.nota ? `<br><span class="m">${esc(e.nota)}</span>` : ""}</td></tr>`; }).join("")}
      </table>
      <p><b>El consejo sale con:</b> ${esc(m.sale)}</p>
    </section>`).join("");

  const debiles = an.orden.filter((g) => g.total < 9).slice(0, 3);
  const preguntas = debiles.map((g) => `
    <h4>${esc(g.titulo)} (${g.total} / 9)</h4><ul>${g.preguntas.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>`).join("");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Informe de autoevaluación</title><style>
  @font-face{font-family:Poppins;font-weight:400;src:url("${font("poppins-400.woff2")}")}
  @font-face{font-family:Poppins;font-weight:600;src:url("${font("poppins-600.woff2")}")}
  @font-face{font-family:Lora;font-weight:400 600;src:url("${font("lora-regular.woff2")}")}
  @font-face{font-family:Lora;font-style:italic;src:url("${font("lora-italic.woff2")}")}
  :root{--ink:#18212F;--text:#1C2430;--muted:#5A6474;--tint:#F1F3F6;--rule:#D9DCE1;--signal:#C8102E}
  @page{size:A4;margin:18mm 18mm 20mm}
  *{box-sizing:border-box}
  body{margin:0;font:10.5pt/1.5 Lora,Georgia,serif;color:var(--text);-webkit-print-color-adjust:exact;print-color-adjust:exact}
  h1,h2,h3,h4,.k,.tag,.v,.num,.pt,.bl,.bs,th{font-family:Poppins,sans-serif;font-weight:600;color:var(--ink)}
  h1{font-size:24pt;line-height:1.1;margin:0 0 6pt}h2{font-size:15pt;margin:20pt 0 8pt;break-after:avoid}
  h3{font-size:12pt;margin:0 0 6pt;display:flex;align-items:baseline;gap:8pt}h4{font-size:10.5pt;margin:10pt 0 4pt}
  .k{font-size:9pt;color:var(--signal)}.k:before{content:"";display:block;width:18pt;height:1.5pt;background:var(--signal);margin-bottom:6pt}
  .m{color:var(--muted);font-size:9.5pt}
  .cab{background:var(--ink);color:#DCE1E8;margin:-18mm -18mm 0;padding:16mm 18mm 12mm}
  .cab h1{color:#fff}.cab .k{color:#9AA3B0}.cab dl{display:grid;grid-template-columns:auto 1fr;gap:2pt 12pt;margin:10pt 0 0;font-size:9.5pt}
  .cab dt{font-family:Poppins;color:#9AA3B0}.cab dd{margin:0;color:#fff}
  .tot{font-family:Poppins;font-weight:600;font-size:30pt;color:var(--ink);margin:14pt 0 4pt}.tot b{color:var(--signal)}
  table{width:100%;border-collapse:collapse}
  .bars td{padding:3pt 0;vertical-align:middle}.bl{font-size:9.5pt;width:44%}.bs{font-size:9.5pt;text-align:right;width:12%}
  .bt{padding:0 10pt!important}.bt div{height:7pt;background:var(--rule);border-radius:3pt;overflow:hidden}.bt span{display:block;height:100%;background:var(--signal)}
  .box{background:var(--tint);border-radius:6pt;padding:10pt 12pt;margin:10pt 0}
  .box ul{margin:4pt 0 0;padding-left:14pt}.box li{margin-bottom:3pt}
  .dec,.reu{break-inside:avoid;border-top:1px solid var(--rule);padding:10pt 0 6pt}
  .num{display:inline-block;color:var(--signal);font-size:16pt;line-height:1}.pt{margin-left:auto;font-size:10pt;color:var(--muted)}
  .af td{padding:3pt 0;vertical-align:top}.v{width:22pt;font-size:10pt;text-align:center}
  .v0,.vx{color:var(--signal)}.q{font-style:italic;color:var(--ink);margin:6pt 0 2pt}
  .pl td{padding:4pt 0;vertical-align:top;border-bottom:1px solid var(--tint)}
  .tag{width:70pt;font-size:8.5pt}.alta{color:var(--signal)}.media{color:var(--ink)}.ok{color:var(--muted)}
  ul{padding-left:14pt}.salto{break-before:page}
  .pie{margin-top:18pt;font-size:8.5pt;color:var(--muted);border-top:1px solid var(--rule);padding-top:6pt}
  </style></head><body>
  <div class="cab">
    <div class="k">Supervisión de la IA · Uso interno</div>
    <h1>Informe de autoevaluación</h1>
    <dl>
      <dt>Contacto</dt><dd>${esc(nombre || "Sin nombre")} · ${esc(email || "sin correo")}</dd>
      <dt>Fecha</dt><dd>${esc(fechaLegible(fecha))}</dd>
      <dt>Comunicaciones</dt><dd>${comunicaciones ? "Acepta recibir información del autor" : "No ha aceptado comunicaciones"}</dd>
      <dt>Respuestas</dt><dd>${an.contestadas} de 18</dd>
    </dl>
  </div>

  <div class="tot"><b>${an.total}</b> / 54</div>
  <table class="bars">${barras}</table>

  <h2>Lectura del resultado</h2>
  <p>Según el anexo B del whitebook, lo útil no es la suma, sino qué decisiones puntúan cero, qué afirmaciones son ciertas pero nadie puede demostrar, y cuánto cambia la puntuación al repetir el ejercicio dentro de un año.</p>
  <div class="box"><b>Decisiones que puntúan cero</b>${an.ceros.length ? "<ul>" + an.ceros.map((g) => `<li>${esc(g.titulo)}</li>`).join("") + "</ul>" : '<p class="m">Ninguna.</p>'}</div>
  <div class="box"><b>Ciertas, pero sin documentar (puntuación 1)</b>${lista(an.sinDocumentar)}</div>
  <div class="box"><b>Documentadas, sin revisión en el último año (puntuación 2)</b>${lista(an.sinRevisar)}</div>

  <h2 class="salto">Las seis decisiones, de la más débil a la más sólida</h2>
  ${decisiones}

  <h2 class="salto">Plan de los primeros cien días</h2>
  <p>Tres reuniones del consejo con un encargo claro en cada una (capítulo 6 del whitebook). El plan de implantación es de la dirección; la agenda es del consejo. Cada punto lleva su prioridad según las respuestas de esta autoevaluación.</p>
  ${plan}
  <section class="reu"><h3>Lo que el consejo no debería hacer en cien días</h3>
    <ul>${NO_HACER.map(([t, d]) => `<li><b>${esc(t)}</b> ${esc(d)}</li>`).join("")}</ul>
    <p class="m">Después de los cien días, los indicadores de valor llegan cada trimestre y los de control cada semestre; el inventario se renueva a los doce meses y las seis decisiones se revisan una vez al año.</p>
  </section>

  ${preguntas ? `<h2>Preguntas para la próxima sesión</h2><p>Del anexo A del whitebook, para las decisiones con menor puntuación.</p>${preguntas}` : ""}

  <p class="pie">Informe generado a partir de la autoevaluación enviada desde el sitio. Uso interno: contiene datos personales y no debe compartirse sin el consentimiento del interesado.</p>
  </body></html>`;
}

// ---------- principal ----------
const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
if (!file) {
  console.error("Uso: node scripts/informe.mjs <exportacion.csv|json> [--email correo] [--out carpeta]");
  process.exit(1);
}
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const soloEmail = opt("--email");
const outDir = path.resolve(opt("--out") || path.join(ROOT, "informes"));
await mkdir(outDir, { recursive: true });

const filas = (await leer(file)).filter((row) => {
  const origen = campo(row, "origen");
  const tieneRespuestas = respuestas(row).some((v) => v !== null);
  return (origen === "autoevaluacion" || (!origen && tieneRespuestas)) && (!soloEmail || campo(row, "email").toLowerCase() === soloEmail.toLowerCase());
});
if (!filas.length) { console.error("No hay autoevaluaciones en la exportación" + (soloEmail ? " para " + soloEmail : "") + "."); process.exit(1); }

const browser = await chromium.launch();
for (const row of filas) {
  const email = campo(row, "email") || "sin-correo";
  const fecha = (campo(row, "fecha", "_date", "Submitted At", "created_at") || "").slice(0, 10) || "sin-fecha";
  const base = `${fecha}-${email.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase()}`;
  const tmp = path.join(outDir, `.${base}.html`);
  await writeFile(tmp, html(row));
  const page = await browser.newPage();
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate(() => document.fonts.ready);
  await page.pdf({ path: path.join(outDir, base + ".pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
  if (args.includes("--html")) await writeFile(path.join(outDir, base + ".html"), html(row));
  await page.close();
  await unlink(tmp);
  console.log("ok", path.relative(process.cwd(), path.join(outDir, base + ".pdf")));
}
await browser.close();
