// Comprobaciones A-03, A-04, A-07, A-08, A-10 y F-04 con Playwright (SPEC.md, sección 11)
import { chromium } from "playwright";

const BASE = process.env.BASE || "http://localhost:8000";
const results = [];
const ok = (id, pass, evidence) => results.push({ id, pass, evidence });

const browser = await chromium.launch();

// A-10: sin peticiones a terceros al cargar
for (const path of ["/", "/autoevaluacion/", "/whitebook/"]) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const external = [];
  page.on("request", (r) => { if (!r.url().startsWith(BASE)) external.push(r.url()); });
  const resp = await page.goto(BASE + path, { waitUntil: "networkidle" });
  ok("A-10 " + path, resp.ok() && external.length === 0, external.join(" ") || "sin peticiones externas");
  await ctx.close();
}

// A-07: sin scroll horizontal a 360, 768 y 1440
for (const path of ["/", "/autoevaluacion/", "/whitebook/", "/privacidad/"]) {
  for (const width of [360, 768, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + path);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(`A-07 ${path} ${width}px`, overflow <= 0, `desbordamiento horizontal: ${overflow}px`);
    await ctx.close();
  }
}

// F-03/F-04/C-09: cálculo en el navegador y persistencia
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/autoevaluacion/");
  const answers = [3, 2, 1, 0, 0, 0, 3, 3, 3, 1, 1, 1, 2, 2, 2, 0, 0, 0];
  for (let i = 0; i < 18; i++) await page.click(`label[for="a${i + 1}-${answers[i]}"]`);
  const total = await page.textContent("#total");
  const ceros = await page.textContent("#ceros");
  const bar1 = await page.textContent("#barra-1 .bar__score");
  const hidden = await page.evaluate(() => [document.querySelector('[name=puntuacion_total]').value, document.querySelector('[name=puntuacion_grupos]').value]);
  ok("C-09 total", total === "24", `total=${total}`);
  ok("C-09 ceros", ceros === "Cómo gobernarla, Cómo implicar a las personas", `ceros=${ceros}`);
  ok("C-09 barra", bar1 === "6 / 9", `barra1=${bar1}`);
  ok("F-05 ocultos", hidden[0] === "24" && hidden[1] === "6,0,9,3,6,0", hidden.join(" | "));
  await page.reload();
  const restored = await page.isChecked("#a1-3");
  const totalAfter = await page.textContent("#total");
  ok("F-04 restaurar", restored && totalAfter === "24", `a1-3=${restored} total=${totalAfter}`);
  await page.click("#borrar");
  const cleared = await page.evaluate(() => document.querySelectorAll('input[type=radio]:checked').length);
  const stored = await page.evaluate(() => localStorage.getItem("autoevaluacion-respuestas"));
  ok("F-04 borrar", cleared === 0 && stored === null, `marcados=${cleared} almacen=${stored}`);
  await ctx.close();
}

// A-08: solo teclado
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE + "/autoevaluacion/");
  await page.focus("#a1-0");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  const checked = await page.isChecked("#a1-2");
  for (let i = 2; i <= 18; i++) { await page.keyboard.press("Tab"); await page.keyboard.press("ArrowRight"); }
  const total = await page.textContent("#total");
  await page.focus("#email");
  await page.keyboard.type("prueba@example.com");
  await page.keyboard.press("Tab"); await page.keyboard.press("Tab"); await page.keyboard.press("Space");
  const priv = await page.isChecked("#privacidad");
  ok("A-08 teclado", checked && total === "19" && priv, `a1-2=${checked} total=${total} privacidad=${priv}`);
  await ctx.close();
}

// A-03 / A-04: sin JavaScript el formulario se envía con los campos
{
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  let posted = null;
  await page.route("https://formspree.io/**", async (route) => {
    posted = route.request().postData();
    await route.fulfill({ status: 302, headers: { location: BASE + "/gracias/" }, body: "" });
  });
  await page.goto(BASE + "/");
  const h1 = await page.textContent("h1");
  ok("A-03 landing sin JS", h1 === "Supervisar la IA sin ser técnico", `h1=${h1}`);
  await page.goto(BASE + "/autoevaluacion/");
  for (let i = 1; i <= 18; i++) await page.click(`label[for="a${i}-2"]`);
  await page.fill("#email", "prueba@example.com");
  await page.check("#privacidad");
  await page.click("button[type=submit]");
  await page.waitForURL("**/gracias/");
  const gracias = await page.textContent("h1");
  const fields = posted ? Object.fromEntries(new URLSearchParams(posted)) : {};
  ok("A-03 envío sin JS", posted !== null && gracias === "Gracias", `url=${page.url()} h1=${gracias}`);
  ok("A-04 campos", fields.origen === "autoevaluacion" && fields.a18 === "2" && "puntuacion_total" in fields && "fecha" in fields && fields.privacidad === "si" && !("comunicaciones" in fields), Object.keys(fields).join(","));
  await ctx.close();
}

// A-04 con JavaScript: puntuación calculada en el envío
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  let posted = null;
  await page.route("https://formspree.io/**", async (route) => {
    const req = route.request(); const ct = req.headers()["content-type"] || "";
    if (ct.includes("multipart")) { const raw = req.postDataBuffer().toString("utf8"); const b = ct.split("boundary=")[1]; posted = {}; for (const part of raw.split("--" + b)) { const i = part.indexOf("\r\n\r\n"); const m = part.match(/name="([^"]+)"/); if (i > 0 && m) posted[m[1]] = part.slice(i + 4).replace(/\r\n$/, ""); } }
    else posted = Object.fromEntries(new URLSearchParams(req.postData()));
    if ((req.headers()["accept"] || "").includes("application/json")) await route.fulfill({ status: 200, contentType: "application/json", headers: { "access-control-allow-origin": "*" }, body: '{"ok":true}' });
    else await route.fulfill({ status: 302, headers: { location: BASE + "/gracias/" }, body: "" });
  });
  await page.goto(BASE + "/autoevaluacion/");
  for (let i = 1; i <= 18; i++) await page.click(`label[for="a${i}-3"]`);
  await page.fill("#email", "prueba@example.com");
  await page.check("#privacidad");
  await page.click("button[type=submit]");
  await page.waitForURL("**/gracias/");
  ok("A-04 con JS", posted.puntuacion_total === "54" && posted.puntuacion_grupos === "9,9,9,9,9,9" && /^\d{4}-\d{2}-\d{2}T/.test(posted.fecha) && posted.respuestas === Array(18).fill(3).join(",") && /Total: 54 \/ 54/.test(posted.resumen) && page.url().endsWith("/gracias/"), `${posted.puntuacion_total} ${posted.puntuacion_grupos} resp=${posted.respuestas} resumen=${JSON.stringify((posted.resumen||"").slice(0,30))} url=${page.url()}`);
  await ctx.close();
}

await browser.close();
let failed = 0;
for (const r of results) { if (!r.pass) failed++; console.log(`${r.pass ? "PASA " : "FALLA"} ${r.id} — ${r.evidence}`); }
console.log(`\n${results.length - failed}/${results.length} comprobaciones pasan`);
process.exit(failed ? 1 : 0);
