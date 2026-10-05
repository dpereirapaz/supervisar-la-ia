// AR-02, AR-06 y AR-07: genera el informe de cada perfil a través de la función local
// (el mismo manejador que sirve /api/informe, en modo download), lo rasteriza con pdf.js en Chromium y comprueba
// páginas, peso, texto y márgenes. Uso: node scripts/ar-informe.mjs
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

import handler from "../netlify/functions/informe.mjs";
import { usarAlmacen, almacenMemoria } from "../netlify/functions/lib/ratelimit.mjs";
process.env.DELIVERY_MODE = "download";
process.env.SITE_HOST ||= "ejemplo.es";
process.env.CONTACT_EMAIL ||= "contacto@ejemplo.es";
delete process.env.CONTEXT;
usarAlmacen(almacenMemoria());
const logAntes = console.log;
const OUT = path.resolve("report/out/ar");
await mkdir(OUT, { recursive: true });
const perfiles = JSON.parse(await readFile("report/test/perfiles.json", "utf8"));
perfiles.nombres_largos = { persona: { nombre: "W".repeat(80), organizacion: "M".repeat(80) }, respuestas: perfiles.desigual_con_incoherencias.respuestas };

const browser = await chromium.launch();
const page = await browser.newPage();
await page.route("**/__pdfjs/**", (r) => r.fulfill({ path: path.resolve("node_modules/pdfjs-dist/build", path.basename(new URL(r.request().url()).pathname)), contentType: "text/javascript" }));
await page.route("**/__pdf/**", async (r) => r.fulfill({ body: await readFile(path.join(OUT, path.basename(new URL(r.request().url()).pathname))), contentType: "application/pdf" }));
await page.route("http://ar.local/", (r) => r.fulfill({ body: "<!DOCTYPE html><html><body></body></html>", contentType: "text/html" }));
await page.goto("http://ar.local/");

let fallos = 0;
const informe = (id, ok, ev) => { if (!ok) fallos++; console.log(`${ok ? "PASA " : "FALLA"} ${id} — ${ev}`); };

let n = 0;
for (const [clave, p] of Object.entries(perfiles)) {
  const body = new URLSearchParams({ origen: "autoevaluacion", correo: `ar${n}@example.com`, nombre: p.persona.nombre, organizacion: p.persona.organizacion, consentimiento: "si", _gotcha: "" });
  p.respuestas.forEach((v, i) => body.set("r" + (i + 1), String(v)));
  console.log = () => {};
  const r = await handler(new Request("http://localhost/api/informe", { method: "POST", body, headers: { Accept: "application/json", "content-type": "application/x-www-form-urlencoded" } }), { ip: `10.9.${n}.1` });
  console.log = logAntes;
  n++;
  const buf = Buffer.from(await r.arrayBuffer());
  if (r.status !== 200 || buf.subarray(0, 5).toString() !== "%PDF-") { informe(`AR-02 ${clave}`, false, `status ${r.status}`); continue; }
  const fichero = `${clave}.pdf`;
  await writeFile(path.join(OUT, fichero), buf);

  const datos = await page.evaluate(async ({ fichero, clave }) => {
    const pdfjs = await import("/__pdfjs/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/__pdfjs/pdf.worker.min.mjs";
    const doc = await pdfjs.getDocument("/__pdf/" + fichero).promise;
    const meta = await doc.getMetadata();
    const paginas = [];
    let texto = "";
    const fuera = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const pg = await doc.getPage(i);
      const vp = pg.getViewport({ scale: 1 });
      const tc = await pg.getTextContent();
      const lineas = tc.items.filter((it) => it.str.trim()).length;
      texto += tc.items.map((it) => it.str + (it.hasEOL ? "\n" : " ")).join("") + "\n";
      for (const it of tc.items) {
        if (!it.str.trim()) continue;
        const x = it.transform[4], y = it.transform[5];
        if (x < 0 || x + it.width > vp.width + 0.5 || y < 0 || y > vp.height) fuera.push(`p${i}:${it.str.slice(0, 20)}`);
      }
      const canvas = document.createElement("canvas");
      const v2 = pg.getViewport({ scale: 70 / 72 });
      canvas.width = v2.width; canvas.height = v2.height;
      await pg.render({ canvasContext: canvas.getContext("2d"), viewport: v2 }).promise;
      paginas.push({ ancho: Math.round(vp.width), alto: Math.round(vp.height), lineas, png: canvas.toDataURL("image/png") });
    }
    return { numPages: doc.numPages, meta: meta.info, paginas, texto, fuera };
  }, { fichero, clave }).catch((e) => ({ error: String(e) }));

  if (datos.error) { informe(`AR-02 ${clave}`, false, datos.error); continue; }
  for (const [i, pg] of datos.paginas.entries()) await writeFile(path.join(OUT, `${clave}-p${String(i + 1).padStart(2, "0")}.png`), Buffer.from(pg.png.split(",")[1], "base64"));
  const a4 = datos.paginas.every((p) => p.ancho === 595 && p.alto === 842);
  const cortas = datos.paginas.slice(0, -1).map((p, i) => [i + 1, p.lineas]).filter(([, l]) => l <= 2);
  informe(`AR-02 ${clave}`, a4 && datos.numPages >= 8 && datos.numPages <= 12 && buf.length < 300 * 1024 && !cortas.length,
    `${datos.numPages} págs, ${(buf.length / 1024).toFixed(0)} KB, A4=${a4}, páginas casi vacías: ${cortas.map((c) => c.join(":")).join(" ") || "ninguna"}`);
  const prohibidos = ["�", "undefined", "NaN", "{", "[__]", "null"].filter((s) => datos.texto.includes(s));
  const fecha = (datos.texto.match(/\[fecha\]/g) || []).length;
  const plano = datos.texto.replace(/\s+/g, " ").toLowerCase();
  const estados = ["Decidida", "A medias", "Por decidir"].filter((w) => plano.includes(w.toLowerCase()));
  informe(`AR-06 ${clave}`, !prohibidos.length && fecha <= 1 && estados.length === 3 && /[áéíóúñ]/.test(datos.texto),
    `prohibidos: ${prohibidos.join(" ") || "ninguno"}; [fecha]×${fecha}; estados presentes: ${estados.join(", ")}`);
  informe(`R-15 metadatos ${clave}`, datos.meta.Title === "Supervisión de la IA · Lectura del consejo" && datos.meta.Author === "David Pereira Paz" && !JSON.stringify(datos.meta).includes(p.persona.nombre || "\u0000"),
    `Title=${datos.meta.Title}; Author=${datos.meta.Author}; Lang=${datos.meta.Language}`);
  if (clave === "nombres_largos") informe("AR-07 nombres de 80 caracteres", !datos.fuera.length, datos.fuera.join(" ") || "todo el texto dentro de la página");
}
await browser.close();
console.log(fallos ? `\n${fallos} comprobaciones fallan` : "\nTodas las comprobaciones pasan");
process.exit(fallos ? 1 : 0);
