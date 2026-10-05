// Pruebas del motor y del generador. Ejecutar con: npm test
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { analizar, validarRespuestas, unirLista, plantilla } from "../src/engine.mjs";
import { renderizarInforme, limpiarTexto } from "../src/render-pdf.mjs";
import { cargarFuentes } from "../src/fuentes.mjs";

const dir = new URL("../", import.meta.url);
const c = JSON.parse(await readFile(new URL("content/informe.es.json", dir), "utf8"));
const perfiles = JSON.parse(await readFile(new URL("test/perfiles.json", dir), "utf8"));
let n = 0;
const ok = (nombre, fn) => Promise.resolve(fn()).then(() => { n++; console.log("ok  ", nombre); });

await ok("arquetipos de los cinco perfiles", () => {
  for (const [clave, p] of Object.entries(perfiles)) {
    const esperado = clave === "desigual_con_incoherencias" ? "avance_desigual" : clave;
    assert.equal(analizar(p.respuestas, c).arquetipo, esperado, clave);
  }
});
await ok("límites de estado por decisión (2/3 y 6/7)", () => {
  const base = Array(18).fill(0);
  const est = (v) => analizar(v, c).decisiones[0].estado;
  assert.equal(est(base), "por_decidir");
  assert.equal(est([1, 1, 0, ...base.slice(3)]), "por_decidir"); // 2 puntos
  assert.equal(est([1, 1, 1, ...base.slice(3)]), "a_medias"); // 3 puntos
  assert.equal(est([3, 3, 0, ...base.slice(3)]), "a_medias"); // 6 puntos
  assert.equal(est([3, 3, 1, ...base.slice(3)]), "decidida"); // 7 puntos
});
await ok("total y ceros", () => {
  const a = analizar(Array(18).fill(0), c);
  assert.equal(a.total, 0);
  assert.equal(a.decisionesCero.length, 6);
  assert.equal(analizar(Array(18).fill(3), c).total, 54);
});
await ok("prioridades: máximo 3, solo no decididas, desempate 2,1,4,3,5,6", () => {
  const a = analizar(Array(18).fill(0), c);
  assert.deepEqual(a.prioridades, [2, 1, 4]);
  const b = analizar(Array(18).fill(3), c);
  assert.deepEqual(b.prioridades, []);
  assert.equal(b.paraMantener.length, 3);
});
await ok("incoherencias I1 e I5", () => {
  const r = Array(18).fill(0);
  r[4] = 3; // afirmación 5
  r[3] = 0; // afirmación 4
  assert.ok(analizar(r, c).incoherencias.some((i) => i.id === "I1"));
  const s = Array(18).fill(0);
  s[12] = 2; s[13] = 0;
  assert.ok(analizar(s, c).incoherencias.some((i) => i.id === "I5"));
});
await ok("validación de entradas", () => {
  assert.throws(() => validarRespuestas([1, 2]));
  assert.throws(() => validarRespuestas(Array(18).fill(4)));
  assert.throws(() => validarRespuestas(Array(18).fill("x")));
  assert.throws(() => validarRespuestas(Array(18).fill(1.5)));
});
await ok("utilidades", () => {
  assert.equal(unirLista(["a", "b", "c"]), "a, b y c");
  assert.equal(plantilla("Hola {x} {y}", { x: "Ana" }), "Hola Ana ");
  assert.equal(limpiarTexto("  Ana\u0000 \n María  😀"), "Ana María");
});
await ok("cada afirmación y decisión tiene texto", () => {
  assert.equal(c.afirmaciones.length, 18);
  assert.equal(c.decisiones.length, 6);
  c.afirmaciones.forEach((a) => assert.ok(a.texto && a.si0 && a.si1, "afirmación " + a.id));
  c.decisiones.forEach((d) => ["por_decidir", "a_medias", "decidida"].forEach((e) => assert.ok(d.estados[e], d.id + e)));
  c.decisiones.forEach((d) => ["pedir", "decidir", "recibir", "mantener", "encargo"].forEach((k) => assert.ok(d.plan[k], d.id + k)));
});
await ok("el generador produce un PDF válido para los cinco perfiles", async () => {
  const f = cargarFuentes();
  for (const [clave, p] of Object.entries(perfiles)) {
    const pdf = await renderizarInforme({ contenido: c, analisis: analizar(p.respuestas, c), persona: p.persona, fecha: new Date("2026-10-05T10:00:00Z"), fuentes: f, sitio: "ejemplo.es", contacto: "x@ejemplo.es" });
    assert.equal(Buffer.from(pdf.slice(0, 5)).toString(), "%PDF-", clave);
    assert.ok(pdf.length > 20000 && pdf.length < 400000, clave + " tamaño " + pdf.length);
  }
});
console.log(`\n${n} pruebas superadas`);
