// Comprobaciones GA-02, GA-03 y GA-05 a GA-08 (SPEC_guia-en-linea.md, sección 10).
// Uso: python3 -m http.server 8000 (en la raíz) y después BASE=http://localhost:8000 node scripts/check-guia.mjs
import { chromium } from "playwright";
import { readFile } from "node:fs/promises";

const BASE = process.env.BASE || "http://localhost:8000";
const rutas = JSON.parse(await readFile("scripts/guia-urls.json", "utf8"));
let fallos = 0;
const ok = (id, pass, ev) => { if (!pass) fallos++; console.log(`${pass ? "PASA " : "FALLA"} ${id} — ${ev}`); };

const browser = await chromium.launch();
const internos = new Set();
for (const r of rutas) {
  const url = `${BASE}/${r}`;
  // GA-03: sin peticiones a terceros
  const page = await browser.newPage();
  const ajenas = [];
  page.on("request", (q) => { if (!q.url().startsWith(BASE)) ajenas.push(q.url()); });
  const resp = await page.goto(url, { waitUntil: "networkidle" });
  ok(`GA-03 ${r}`, resp.ok() && ajenas.length === 0, ajenas.join(" ") || "sin peticiones externas");

  // GA-06: JSON-LD válido con los campos exigidos
  const ld = await page.$$eval('script[type="application/ld+json"]', (s) => s.map((x) => x.textContent));
  let datos = [];
  try { datos = ld.map((t) => JSON.parse(t)); } catch (e) { ok(`GA-06 ${r}`, false, String(e)); }
  const tipos = datos.map((d) => d["@type"]);
  const art = datos.find((d) => d["@type"] === "Article");
  const exigidos = r === "guia/" ? tipos.includes("Book") && datos[0].hasPart?.length >= 16
    : r === "autor/" ? tipos.includes("Person") && datos[0].sameAs?.length
    : art && ["headline", "description", "author", "datePublished", "inLanguage", "isPartOf", "mainEntityOfPage"].every((k) => art[k]) && tipos.includes("BreadcrumbList");
  ok(`GA-06 ${r}`, Boolean(exigidos), tipos.join(", "));

  // GA-08: cadenas prohibidas
  const texto = await page.evaluate(() => document.body.innerText);
  const prohibidas = ["[__]", "lorem", "TODO", "undefined", "NaN"].filter((p) => texto.includes(p));
  ok(`GA-08 ${r}`, prohibidas.length === 0, prohibidas.join(" ") || "ninguna");

  // enlaces internos para GA-05
  for (const h of await page.$$eval("a[href]", (as) => as.map((a) => a.href))) if (h.startsWith(BASE)) internos.add(h.split("#")[0]);
  if (r.startsWith("guia/") && r !== "guia/" ) {
    const pasos = await page.$$eval(".guia-pasos a", (as) => as.length);
    const extremo = r === rutas[1] || r === "guia/fuentes/";
    ok(`GA-05 navegación ${r}`, pasos === (extremo ? 1 : 2), `${pasos} enlaces anterior/siguiente`);
  }
  await page.close();

  // GA-02: sin desbordamiento horizontal
  for (const width of [360, 768, 1440]) {
    const p2 = await browser.newPage({ viewport: { width, height: 900 } });
    await p2.goto(url);
    const o = await p2.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (o > 0) ok(`GA-02 ${r} ${width}px`, false, `desbordamiento ${o}px`);
    await p2.close();
  }
}
ok("GA-02 todas las páginas", true, "comprobadas a 360, 768 y 1440 px (solo se listan los fallos)");

// GA-05: todos los enlaces internos responden 200
const rotos = [];
for (const u of internos) { const r = await fetch(u); if (r.status !== 200) rotos.push(`${r.status} ${u}`); }
ok("GA-05 enlaces internos", rotos.length === 0, `${internos.size} enlaces; rotos: ${rotos.join(" ") || "ninguno"}`);

// GA-07: sitemap y llms.txt
const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
const llms = await (await fetch(`${BASE}/llms.txt`)).text();
const faltanSm = rutas.filter((r) => !sm.includes(`https://supervisarlaia.es/${r}<`));
const faltanLl = rutas.filter((r) => !llms.includes(`https://supervisarlaia.es/${r})`));
ok("GA-07 sitemap.xml", faltanSm.length === 0, faltanSm.join(" ") || `${rutas.length} páginas de la guía presentes`);
ok("GA-07 llms.txt", faltanLl.length === 0, faltanLl.join(" ") || `${rutas.length} páginas presentes`);

await browser.close();
console.log(fallos ? `\n${fallos} fallos` : "\nTodas las comprobaciones pasan");
process.exit(fallos ? 1 : 0);
