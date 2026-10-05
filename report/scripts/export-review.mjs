// Genera una versión legible de los textos para revisión humana. No editar el resultado: editar el JSON.
import { readFile, writeFile } from "node:fs/promises";
const dir = new URL("../", import.meta.url);
const c = JSON.parse(await readFile(new URL("content/informe.es.json", dir), "utf8"));
const L = [];
const p = (t = "") => L.push(t);
p("# Textos del informe «Lectura del consejo» (vista de revisión)\n");
p("> Generado desde `content/informe.es.json`. Para cambiar un texto, edite el JSON (o envíe aquí sus cambios). No edite este archivo.\n");
p("## Lógica\n");
p("- Cada decisión puntúa de 0 a 9 (suma de sus tres afirmaciones, de 0 a 3 cada una).");
p("- Estado de la decisión: **por decidir** (0–2), **a medias** (3–6), **decidida** (7–9).");
p("- Lectura global (se evalúa en este orden): **base sólida** (total ≥ 40 y ninguna decisión por decidir); **punto de partida** (total ≤ 12); **actividad por delante** (ejecución − dirección ≥ 6); **intención por delante** (dirección − ejecución ≥ 6); **avance desigual** (resto). Dirección = decisiones 1, 2 y 4. Ejecución = decisiones 3, 5 y 6.");
p("- Prioridades de los cien días: hasta 3 decisiones no decididas, de menor a mayor puntuación; desempate por el orden 2, 1, 4, 3, 5, 6.\n");
p("## Portada y apertura\n");
p(`**${c.portada.titulo}.** ${c.portada.subtitulo}\n`);
p(`**${c.como_leer.titulo}.** ${c.como_leer.texto}\n`);
p("## Lectura global\n");
for (const [k, a] of Object.entries(c.lectura_global.arquetipos)) {
  p(`### ${a.titulo}  \`${k}\`\n`);
  p(a.texto + "\n");
  p(`**Lo primero que haría:** ${a.lo_primero}\n`);
}
p("## Respuestas que conviene contrastar\n");
p(c.incoherencias.intro + "\n");
for (const r of c.incoherencias.reglas) {
  const cond = r.cuando.map((x) => `afirmación ${x.afirmacion} ${x.min !== undefined ? "≥ " + x.min : "≤ " + x.max}`).join(" y ");
  p(`- **${r.id}** (${cond}): ${r.texto}`);
}
p("\n## Decisiones\n");
for (const d of c.decisiones) {
  p(`### ${d.id}. ${d.titulo}\n`);
  p(`*${d.pregunta}*  \n${d.tomada_cuando}\n`);
  for (const e of ["por_decidir", "a_medias", "decidida"]) p(`- **${c.estados[e]}.** ${d.estados[e]}`);
  p("\n**Qué conviene comprobar, según la respuesta:**\n");
  for (const id of d.afirmaciones) {
    const a = c.afirmaciones[id - 1];
    p(`- **${id}.** ${a.texto}\n  - Si puntúa 0: ${a.si0}\n  - Si puntúa 1: ${a.si1}`);
  }
  p("\n**Cien días:**\n");
  for (const k of ["pedir", "decidir", "recibir", "mantener"]) p(`- *${k}:* ${d.plan[k]}`);
  p(`- *encargo (se inserta tras «…presente»):* ${d.plan.encargo}\n`);
}
p("## Cien días\n");
p(c.cien_dias.intro + "\n");
for (const r of c.cien_dias.reuniones) p(`- **${r.titulo}** (${r.cuando}). Agenda base: ${r.base} *El consejo sale con:* ${r.sale}`);
p("\n**Encargo propuesto.** " + c.cien_dias.encargo.apertura + " … " + c.cien_dias.encargo.cierre + "\n");
p("**" + c.cien_dias.no_hacer.titulo + "**\n");
c.cien_dias.no_hacer.items.forEach((t) => p("- " + t));
p("\n**" + c.cien_dias.despues.titulo + ".** " + c.cien_dias.despues.texto + "\n");
p("## Registro y cierre\n");
p(c.registro.intro + "\n");
p(c.cierre.limites + "\n\n" + c.cierre.repetir + "\n\n" + c.cierre.ofrecimiento + "\n");
p("## Correo al usuario\n");
p(`**Asunto:** ${c.correo.usuario.asunto}\n`);
p(c.correo.usuario.saludo_con_nombre + "\n");
c.correo.usuario.cuerpo.forEach((t) => p(t + "\n"));
p(c.correo.usuario.firma + "\n");
p("*" + c.correo.usuario.pie + "*\n");
await writeFile(new URL("CONTENIDO_informe_revision.md", dir), L.join("\n"));
console.log("OK");
