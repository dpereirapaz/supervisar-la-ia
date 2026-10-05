// Genera src/fuentes.generated.mjs con las cinco fuentes en base64.
// Motivo: así el empaquetador (esbuild de Netlify) incluye las fuentes sin rutas de disco.
import { readFile, writeFile } from "node:fs/promises";
const dir = new URL("../", import.meta.url);
const mapa = {
  p4: "poppins-latin-400-normal.ttf",
  p6: "poppins-latin-600-normal.ttf",
  l4: "lora-latin-400-normal.ttf",
  l4i: "lora-latin-400-italic.ttf",
  l6: "lora-latin-600-normal.ttf",
};
let out = "// ARCHIVO GENERADO por scripts/embed-fonts.mjs. No editar a mano.\n";
for (const [k, f] of Object.entries(mapa)) {
  const b64 = (await readFile(new URL("src/fonts/" + f, dir))).toString("base64");
  out += `export const ${k} = "${b64}";\n`;
}
await writeFile(new URL("src/fuentes.generated.mjs", dir), out);
console.log("OK", out.length, "bytes");
