import { readFile } from "node:fs/promises";
import { analizar } from "../src/engine.mjs";
import { renderizarInforme } from "../src/render-pdf.mjs";
const dir = new URL("../", import.meta.url);
const c = JSON.parse(await readFile(new URL("content/informe.es.json", dir), "utf8"));
const p = JSON.parse(await readFile(new URL("test/perfiles.json", dir), "utf8")).desigual_con_incoherencias;
const l = async (f) => readFile(new URL("src/fonts/" + f, dir));
const fuentes = { p4: await l("poppins-latin-400-normal.ttf"), p6: await l("poppins-latin-600-normal.ttf"), l4: await l("lora-latin-400-normal.ttf"), l4i: await l("lora-latin-400-italic.ttf"), l6: await l("lora-latin-600-normal.ttf") };
for (let i = 0; i < 4; i++) {
  const t0 = process.cpuUsage(); const w0 = performance.now();
  const pdf = await renderizarInforme({ contenido: c, analisis: analizar(p.respuestas, c), persona: p.persona, fecha: new Date(), fuentes, sitio: "x", contacto: "y@z.es" });
  const t1 = process.cpuUsage(t0);
  console.log(`run ${i}: cpu ${Math.round((t1.user + t1.system) / 1000)} ms, wall ${Math.round(performance.now() - w0)} ms, ${pdf.length} bytes`);
}
