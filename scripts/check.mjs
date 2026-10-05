// Comprobaciones de navegador de la sección 11 (base) y AR-04, AR-08, AR-09 (anexo).
// Ejecutar con netlify dev en marcha: npx netlify dev --offline --port 8888 (DELIVERY_MODE=download en .env)
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:8888";
const results = [];
const ok = (id, pass, evidence) => results.push({ id, pass, evidence });
const browser = await chromium.launch();
const ajenas = (page) => { const l = []; page.on("request", (r) => { if (!r.url().startsWith(BASE)) l.push(r.url()); }); return l; };
async function contestar(page, valor = (i) => i % 4) {
  for (let i = 1; i <= 18; i++) await page.click(`label[for="r${i}-${valor(i)}"]`);
}

// A-10: sin peticiones a terceros al cargar
for (const path of ["/", "/autoevaluacion/", "/whitebook/", "/gracias/", "/error/"]) {
  const page = await browser.newPage();
  const ext = ajenas(page);
  const resp = await page.goto(BASE + path, { waitUntil: "networkidle" });
  ok("A-10 carga " + path, resp.ok() && ext.length === 0, ext.join(" ") || "sin peticiones externas");
  await page.close();
}

// A-07: sin scroll horizontal
for (const path of ["/", "/autoevaluacion/", "/whitebook/", "/privacidad/", "/error/"]) {
  for (const width of [360, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(BASE + path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(`A-07 ${path} ${width}px`, overflow <= 0, `desbordamiento: ${overflow}px`);
    await page.close();
  }
}

// C-09, F-04: cálculo en pantalla y persistencia
{
  const page = await browser.newPage();
  await page.goto(BASE + "/autoevaluacion/");
  const a = [3, 2, 1, 0, 0, 0, 3, 3, 3, 1, 1, 1, 2, 2, 2, 0, 0, 0];
  await contestar(page, (i) => a[i - 1]);
  ok("C-09 total y ceros", (await page.textContent("#total")) === "24" && (await page.textContent("#ceros")) === "Cómo gobernarla, Cómo implicar a las personas", await page.textContent("#ceros"));
  await page.reload();
  ok("F-04 restaurar", (await page.isChecked("#r1-3")) && (await page.textContent("#total")) === "24", "respuestas restauradas");
  await page.click("#borrar");
  ok("F-04 borrar", (await page.evaluate(() => document.querySelectorAll("input[type=radio]:checked").length)) === 0, "sin respuestas marcadas");
  await page.close();
}

// A-08: solo teclado
{
  const page = await browser.newPage();
  await page.goto(BASE + "/autoevaluacion/");
  await page.focus("#r1-0");
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowRight");
  for (let i = 2; i <= 18; i++) { await page.keyboard.press("Tab"); await page.keyboard.press("ArrowRight"); }
  await page.focus("#correo"); await page.keyboard.type("prueba@example.com");
  await page.focus("#consentimiento"); await page.keyboard.press("Space");
  ok("A-08 teclado", (await page.isChecked("#r1-2")) && (await page.textContent("#total")) === "19" && (await page.isChecked("#consentimiento")), "18 respuestas, correo y consentimiento con teclado");
  await page.close();
}

// R-02 con JavaScript: respuesta correcta → /gracias/ y se vacían las respuestas guardadas
{
  const page = await browser.newPage();
  await page.route("**/api/informe", (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await page.goto(BASE + "/autoevaluacion/");
  await contestar(page);
  await page.fill("#correo", "prueba@example.com"); await page.check("#consentimiento");
  await page.click("button[type=submit]");
  await page.waitForURL("**/gracias/");
  const guardado = await page.evaluate(() => localStorage.getItem("autoevaluacion-respuestas"));
  ok("R-02 éxito", guardado === null && (await page.textContent("h1")) === "Gracias", `url=${page.url()} almacén=${guardado}`);
  await page.close();
}

// R-02 con JavaScript: error → mensaje en aria-live y botón activo
{
  const page = await browser.newPage();
  await page.route("**/api/informe", (r) => r.fulfill({ status: 429, contentType: "application/json", body: JSON.stringify({ ok: false, codigo: "demasiadas_solicitudes", mensaje: "Ha hecho demasiadas solicitudes. Inténtelo de nuevo más tarde." }) }));
  await page.goto(BASE + "/autoevaluacion/");
  await contestar(page);
  await page.fill("#correo", "prueba@example.com"); await page.check("#consentimiento");
  await page.click("button[type=submit]");
  await page.waitForFunction(() => document.getElementById("estado-envio").textContent.includes("demasiadas"));
  ok("R-02 error", !(await page.isDisabled("button[type=submit]")) && (await page.getAttribute("#estado-envio", "aria-live")) === "polite", await page.textContent("#estado-envio"));
  await page.close();
}

// AR-09 y A-10 al enviar: envío real a la función local; solo peticiones al propio origen
{
  const page = await browser.newPage();
  const ext = ajenas(page);
  let cuerpo = "";
  page.on("request", (r) => { if (r.url().endsWith("/api/informe")) cuerpo = r.postData() || ""; });
  await page.goto(BASE + "/autoevaluacion/");
  await contestar(page);
  await page.fill("#correo", "prueba@example.com"); await page.fill("#nombre", "Zzyzx Qwerty"); await page.check("#consentimiento");
  const resp = page.waitForResponse("**/api/informe");
  await page.click("button[type=submit]");
  const r = await resp;
  const campos = ["correo", "nombre", "organizacion", "consentimiento", "origen", "_gotcha", ...Array.from({ length: 18 }, (_, i) => "r" + (i + 1))];
  const faltan = campos.filter((c) => !cuerpo.includes(`name="${c}"`));
  ok("AR-09 solo el propio origen", ext.length === 0, ext.join(" ") || "ninguna petición externa");
  ok("A-04 envío a la función", r.status() === 200 && r.headers()["content-type"] === "application/pdf" && !faltan.length, `status=${r.status()} tipo=${r.headers()["content-type"]} faltan=${faltan.join(",") || "ninguno"}`);
  const prohibidos = ["puntuacion_total", "puntuacion_grupos", "fecha", "_next", "_subject"].filter((c) => cuerpo.includes(`name="${c}"`));
  ok("R-01 sin campos antiguos", !prohibidos.length, prohibidos.join(",") || "ninguno");
  await page.close();
}

// A-03 / AR-04 sin JavaScript
{
  const ctx = await browser.newContext({ javaScriptEnabled: false, acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto(BASE + "/");
  ok("A-03 landing sin JS", (await page.textContent("h1")) === "Supervisar la IA sin ser técnico", "h1 presente");
  await page.goto(BASE + "/whitebook/");
  await page.fill("#correo", "prueba2@example.com"); await page.check("#consentimiento");
  await page.click("button[type=submit]");
  await page.waitForURL("**/gracias/");
  ok("A-03 whitebook sin JS → /gracias/", (await page.textContent("h1")) === "Gracias", page.url());
  await page.goto(BASE + "/autoevaluacion/");
  await contestar(page);
  await page.fill("#correo", "prueba3@example.com"); await page.check("#consentimiento");
  const descarga = page.waitForEvent("download");
  await page.click("button[type=submit]");
  const d = await descarga;
  ok("A-03 autoevaluación sin JS (modo download)", d.suggestedFilename() === "lectura-del-consejo.pdf", d.suggestedFilename());
  await ctx.close();
}

await browser.close();
let failed = 0;
for (const r of results) { if (!r.pass) failed++; console.log(`${r.pass ? "PASA " : "FALLA"} ${r.id} — ${r.evidence}`); }
console.log(`\n${results.length - failed}/${results.length} comprobaciones pasan`);
process.exit(failed ? 1 : 0);
