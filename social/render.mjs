// Renderiza los activos sociales de SPEC.md, sección 13 (S-10), a partir de social/manifest.json
import { chromium } from "playwright";
import { readFile, writeFile, mkdir, copyFile, unlink } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(await readFile(path.join(here, "manifest.json"), "utf8"));
const outDir = path.join(here, "out");
await mkdir(outDir, { recursive: true });

const only = process.argv.slice(2);
const browser = await chromium.launch();
const alt = {};

for (const item of manifest.items) {
  alt[item.file] = item.alt;
  if (only.length && !only.includes(item.file)) continue;

  const [width, height] = item.size;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.addInitScript(({ copy, vars }) => { window.__copy = copy; window.__vars = vars; }, { copy: item.copy || {}, vars: item.vars || {} });
  await page.goto(pathToFileURL(path.join(here, "templates", item.template)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(outDir, item.file), type: "png", omitBackground: false });
  await page.close();
  console.log("ok", item.file, `${width}x${height}`);
}

// Copias sincronizadas (S-14) y PDF del carrusel (13.3)
for (const [from, to] of Object.entries(manifest.copies || {})) {
  await copyFile(path.join(outDir, from), path.join(here, "..", to));
  console.log("copia", from, "->", to);
}

if (manifest.carousel && (!only.length || only.includes(manifest.carousel.file))) {
  const [width, height] = manifest.carousel.size;
  const html = manifest.carousel.pages.map((f) =>
    `<div style="width:${width}px;height:${height}px;break-after:page;overflow:hidden"><img src="${pathToFileURL(path.join(outDir, f)).href}" style="display:block;width:${width}px;height:${height}px"></div>`
  ).join("");
  const tmp = path.join(outDir, ".carousel.html");
  await writeFile(tmp, `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:${width}px ${height}px;margin:0}html,body{margin:0}</style></head><body>${html}</body></html>`);
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(pathToFileURL(tmp).href, { waitUntil: "load" });
  await page.pdf({ path: path.join(outDir, manifest.carousel.file), width: `${width}px`, height: `${height}px`, printBackground: true, preferCSSPageSize: true });
  await page.close();
  await unlink(tmp);
  console.log("ok", manifest.carousel.file, `${manifest.carousel.pages.length} páginas`);
}

await browser.close();
await writeFile(path.join(outDir, "alt.json"), JSON.stringify(alt, null, 2) + "\n");
console.log("ok alt.json", Object.keys(alt).length, "entradas");
