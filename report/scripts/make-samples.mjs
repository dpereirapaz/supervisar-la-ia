import { readFile, writeFile, mkdir } from "node:fs/promises";
import { analizar } from "../src/engine.mjs";
import { renderizarInforme } from "../src/render-pdf.mjs";
import { cargarFuentes } from "../src/fuentes.mjs";

const dir = new URL("../", import.meta.url);
const leer = async (p) => readFile(new URL(p, dir));
const contenido = JSON.parse(await readFile(new URL("content/informe.es.json", dir), "utf8"));
const perfiles = JSON.parse(await readFile(new URL("test/perfiles.json", dir), "utf8"));
const fuentes = cargarFuentes();
await mkdir(new URL("out/", dir), { recursive: true });
const solo = process.argv[2];
for (const [clave, p] of Object.entries(perfiles)) {
  if (solo && solo !== clave) continue;
  const analisis = analizar(p.respuestas, contenido);
  const pdf = await renderizarInforme({
    contenido, analisis, persona: p.persona, fecha: new Date("2026-10-05T10:00:00Z"),
    fuentes, sitio: "supervisarlaia.es", contacto: "contacto@ejemplo.es",
  });
  await writeFile(new URL(`out/muestra_${clave}.pdf`, dir), pdf);
  console.log(clave, "→", analisis.total, "/54", analisis.arquetipo, "prior:", analisis.prioridades.join(","), "bytes:", pdf.length);
}
