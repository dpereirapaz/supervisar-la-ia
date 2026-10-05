// Pruebas de validate.mjs, ratelimit.mjs e informe.mjs (anexo, paso 6b). Brevo se simula con fetch.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { validar, esSpam, leerCampos, ErrorSolicitud } from "../netlify/functions/lib/validate.mjs";
import { permitir, usarAlmacen, almacenMemoria, hash } from "../netlify/functions/lib/ratelimit.mjs";
import handler from "../netlify/functions/informe.mjs";

const URL_API = "http://localhost/api/informe";
const RESP = Array.from({ length: 18 }, (_, i) => i % 4);
const NOMBRE = "Zzyzx Qwerty";
const CORREO = "prueba@example.com";

function campos(extra = {}) {
  const c = { origen: "autoevaluacion", correo: CORREO, nombre: NOMBRE, organizacion: "Ejemplo S. A.", consentimiento: "si", _gotcha: "" };
  RESP.forEach((v, i) => (c["r" + (i + 1)] = String(v)));
  return { ...c, ...extra };
}
function peticion(c, { json = true, metodo = "POST", cuerpo } = {}) {
  const body = cuerpo ?? new URLSearchParams(c).toString();
  const headers = { "content-type": "application/x-www-form-urlencoded" };
  if (json) headers.accept = "application/json";
  return new Request(URL_API, { method: metodo, headers, body: metodo === "GET" ? undefined : body });
}
const ENV_EMAIL = {
  DELIVERY_MODE: "email", BREVO_API_KEY: "clave-falsa", MAIL_FROM: "informes@ejemplo.es", MAIL_FROM_NAME: "David Pereira Paz",
  MAIL_REPLY_TO: "respuestas@ejemplo.es", AUTHOR_EMAIL: "autor@ejemplo.es", CONTACT_EMAIL: "contacto@ejemplo.es",
  WHITEBOOK_URL: "https://ejemplo.es/wb", SITE_URL: "https://ejemplo.es", SITE_HOST: "ejemplo.es",
};
const claves = [...Object.keys(ENV_EMAIL), "BREVO_LIST_ID", "CONTEXT"];
let envAntes, fetchAntes, logs, logAntes, llamadas;

beforeEach(() => {
  envAntes = Object.fromEntries(claves.map((k) => [k, process.env[k]]));
  claves.forEach((k) => delete process.env[k]);
  process.env.DELIVERY_MODE = "download";
  usarAlmacen(almacenMemoria());
  fetchAntes = globalThis.fetch;
  llamadas = [];
  globalThis.fetch = async (url, init) => { llamadas.push({ url, cuerpo: JSON.parse(init.body) }); return new Response("{}", { status: 201 }); };
  logs = [];
  logAntes = console.log;
  console.log = (...a) => logs.push(a.join(" "));
});
afterEach(() => {
  claves.forEach((k) => (envAntes[k] === undefined ? delete process.env[k] : (process.env[k] = envAntes[k])));
  globalThis.fetch = fetchAntes;
  console.log = logAntes;
});

// ---- validate.mjs
test("validar: correo inválido, falta consentimiento, origen desconocido", () => {
  assert.throws(() => validar(campos({ correo: "no-es-un-correo" })), (e) => e.status === 400 && e.codigo === "correo_invalido");
  assert.throws(() => validar(campos({ correo: "a".repeat(250) + "@x.es" })), (e) => e.codigo === "correo_invalido");
  const c = campos(); delete c.consentimiento;
  assert.throws(() => validar(c), (e) => e.status === 400);
  assert.throws(() => validar(campos({ origen: "otro" })), (e) => e.status === 400);
});
test("validar: respuestas que faltan o fuera de rango devuelven 422 con la lista", () => {
  const c = campos({ r4: "4" }); delete c.r18;
  assert.throws(() => validar(c), (e) => e.status === 422 && e.valores.lista === "4, 18");
  const w = campos({ origen: "whitebook" }); for (let i = 1; i <= 18; i++) delete w["r" + i];
  assert.equal(validar(w).respuestas, null);
});
test("validar: limpia y recorta nombre y organización", () => {
  const d = validar(campos({ nombre: "Ana\u0000\nMaría " + "W".repeat(100), organizacion: "<b>Org</b>" }));
  assert.ok(d.nombre.length <= 80 && !/[\u0000\n]/.test(d.nombre));
  assert.equal(d.respuestas.length, 18);
});
test("honeypot y tipos de contenido", async () => {
  assert.equal(esSpam({ _gotcha: "x" }), true);
  assert.equal(esSpam({ _gotcha: "" }), false);
  await assert.rejects(leerCampos(new Request(URL_API, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" })), (e) => e.status === 415);
  await assert.rejects(leerCampos(new Request(URL_API, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "a=" + "x".repeat(20 * 1024) })), (e) => e.status === 413);
  const fd = new FormData(); fd.set("origen", "whitebook");
  assert.equal((await leerCampos(new Request(URL_API, { method: "POST", body: fd }))).origen, "whitebook");
});

// ---- ratelimit.mjs
test("límite: 5 por IP y hora, 3 por correo y día, y solo se guardan hashes", async () => {
  const almacen = almacenMemoria(); const guardadas = [];
  usarAlmacen({ get: almacen.get, set: async (k, v) => { guardadas.push(k); return almacen.set(k, v); } });
  const t = Date.UTC(2026, 9, 5);
  for (let i = 0; i < 5; i++) assert.equal(await permitir({ ip: "1.2.3.4", correo: `c${i}@x.es` }, t), true);
  assert.equal(await permitir({ ip: "1.2.3.4", correo: "otro@x.es" }, t), false);
  assert.equal(await permitir({ ip: "1.2.3.4", correo: "otro@x.es" }, t + 61 * 60 * 1000), true);
  for (let i = 0; i < 3; i++) assert.equal(await permitir({ ip: "9.9.9." + i, correo: "mismo@x.es" }, t), true);
  assert.equal(await permitir({ ip: "9.9.9.9", correo: "mismo@x.es" }, t), false);
  assert.ok(guardadas.every((k) => /^(ip|correo):[0-9a-f]{64}$/.test(k)));
  assert.ok(!guardadas.some((k) => k.includes("1.2.3.4") || k.includes("@")));
  assert.equal(hash(" A@B.es "), hash("a@b.es"));
});

// ---- informe.mjs (AR-03, AR-04, AR-05)
test("GET devuelve 405", async () => {
  assert.equal((await handler(new Request(URL_API, { method: "GET" }))).status, 405);
});
test("modo descarga: 18 respuestas devuelven un PDF y no se envía correo", async () => {
  const r = await handler(peticion(campos()), { ip: "1.1.1.1" });
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("content-type"), "application/pdf");
  assert.equal(r.headers.get("cache-control"), "no-store");
  const b = Buffer.from(await r.arrayBuffer());
  assert.equal(b.subarray(0, 5).toString(), "%PDF-");
  assert.equal(llamadas.length, 0);
});
test("errores de validación con JSON: 422, 400, 413", async () => {
  const c = campos(); delete c.r18;
  let r = await handler(peticion(c), { ip: "2.2.2.1" });
  assert.equal(r.status, 422); assert.equal((await r.json()).codigo, "faltan_afirmaciones");
  r = await handler(peticion(campos({ r3: "4" })), { ip: "2.2.2.2" });
  assert.equal(r.status, 422);
  r = await handler(peticion(campos({ correo: "no-es-un-correo" })), { ip: "2.2.2.3" });
  assert.equal(r.status, 400); assert.equal((await r.json()).codigo, "correo_invalido");
  const sin = campos(); delete sin.consentimiento;
  assert.equal((await handler(peticion(sin), { ip: "2.2.2.4" })).status, 400);
  assert.equal((await handler(peticion(campos(), { cuerpo: "origen=autoevaluacion&x=" + "y".repeat(20 * 1024) }), { ip: "2.2.2.5" })).status, 413);
});
test("honeypot: respuesta de éxito, sin PDF ni correo", async () => {
  process.env.DELIVERY_MODE = "email"; Object.assign(process.env, ENV_EMAIL);
  const r = await handler(peticion(campos({ _gotcha: "x" })), { ip: "3.3.3.3" });
  assert.equal(r.status, 200); assert.deepEqual(await r.json(), { ok: true });
  assert.equal(llamadas.length, 0);
});
test("sexta solicitud desde la misma IP en una hora: 429", async () => {
  for (let i = 0; i < 5; i++) assert.equal((await handler(peticion(campos({ correo: `p${i}@example.com` })), { ip: "4.4.4.4" })).status, 200);
  const r = await handler(peticion(campos({ correo: "p9@example.com" })), { ip: "4.4.4.4" });
  assert.equal(r.status, 429); assert.equal((await r.json()).codigo, "demasiadas_solicitudes");
});
test("modo descarga en producción: 503", async () => {
  process.env.CONTEXT = "production";
  assert.equal((await handler(peticion(campos()), { ip: "5.5.5.5" })).status, 503);
});
test("POST sin JavaScript: 303 a /gracias/ o a /error/", async () => {
  process.env.DELIVERY_MODE = "email"; Object.assign(process.env, ENV_EMAIL);
  let r = await handler(peticion(campos(), { json: false }), { ip: "6.6.6.1" });
  assert.equal(r.status, 303); assert.equal(r.headers.get("location"), "/gracias/");
  r = await handler(peticion(campos({ correo: "mal" }), { json: false }), { ip: "6.6.6.2" });
  assert.equal(r.status, 303); assert.equal(r.headers.get("location"), "/error/");
});
test("modo correo: lector con PDF adjunto, autor sin respuestas individuales, lista solo con consentimiento", async () => {
  process.env.DELIVERY_MODE = "email"; Object.assign(process.env, ENV_EMAIL, { BREVO_LIST_ID: "7" });
  const r = await handler(peticion(campos({ info: "si" })), { ip: "7.7.7.7" });
  assert.equal(r.status, 200);
  assert.equal(llamadas.length, 3);
  const [lector, autor, lista] = llamadas;
  assert.ok(lector.url.endsWith("/v3/smtp/email") && lector.cuerpo.to[0].email === CORREO);
  assert.equal(lector.cuerpo.replyTo.email, "respuestas@ejemplo.es");
  assert.match(lector.cuerpo.attachment[0].name, /^Supervision_de_la_IA_lectura_del_consejo_\d{4}-\d{2}-\d{2}\.pdf$/);
  assert.equal(Buffer.from(lector.cuerpo.attachment[0].content, "base64").subarray(0, 5).toString(), "%PDF-");
  assert.match(lector.cuerpo.textContent, /https:\/\/ejemplo\.es\/wb/);
  assert.doesNotMatch(lector.cuerpo.htmlContent + lector.cuerpo.textContent, /\{\w+\}/);
  assert.equal(autor.cuerpo.to[0].email, "autor@ejemplo.es");
  assert.equal(autor.cuerpo.attachment, undefined);
  assert.match(autor.cuerpo.textContent, /Por decisión: \d\/9 · \d\/9 · \d\/9 · \d\/9 · \d\/9 · \d\/9/);
  assert.match(autor.cuerpo.subject, /^Nuevo lead · autoevaluación · \d+\/54 · Ejemplo S\. A\.$/);
  assert.doesNotMatch(autor.cuerpo.textContent, /\{\w+\}/);
  assert.ok(lista.url.endsWith("/v3/contacts") && lista.cuerpo.listIds[0] === 7);
});
test("modo correo, whitebook: un correo sin adjunto y sin alta en la lista si no hay consentimiento", async () => {
  process.env.DELIVERY_MODE = "email"; Object.assign(process.env, ENV_EMAIL, { BREVO_LIST_ID: "7" });
  const c = campos({ origen: "whitebook" }); for (let i = 1; i <= 18; i++) delete c["r" + i];
  assert.equal((await handler(peticion(c), { ip: "8.8.8.8" })).status, 200);
  assert.equal(llamadas.length, 2);
  assert.equal(llamadas[0].cuerpo.attachment, undefined);
  assert.match(llamadas[0].cuerpo.textContent, /https:\/\/ejemplo\.es\/autoevaluacion\//);
});
test("Brevo falla con 5xx: un reintento y después 502", async () => {
  process.env.DELIVERY_MODE = "email"; Object.assign(process.env, ENV_EMAIL);
  globalThis.fetch = async (url, init) => { llamadas.push({ url }); return new Response("{}", { status: 503 }); };
  const r = await handler(peticion(campos()), { ip: "9.9.9.1" });
  assert.equal(r.status, 502);
  assert.equal(llamadas.length, 2);
});
test("falta una variable obligatoria en modo correo: 500 y el log nombra la variable, no su valor", async () => {
  process.env.DELIVERY_MODE = "email"; Object.assign(process.env, ENV_EMAIL); delete process.env.WHITEBOOK_URL;
  const r = await handler(peticion(campos()), { ip: "9.9.9.2" });
  assert.equal(r.status, 500);
  assert.ok(logs.some((l) => l.includes("WHITEBOOK_URL")));
  assert.ok(!logs.some((l) => l.includes("clave-falsa")));
});
test("los registros no contienen datos personales (AR-05)", async () => {
  process.env.DELIVERY_MODE = "email"; Object.assign(process.env, ENV_EMAIL);
  await handler(peticion(campos()), { ip: "10.0.0.1" });
  await handler(peticion(campos({ correo: "mal" })), { ip: "10.0.0.1" });
  process.env.DELIVERY_MODE = "download";
  await handler(peticion(campos()), { ip: "10.0.0.1" });
  const todo = logs.join("\n");
  assert.ok(logs.length >= 3);
  for (const prohibido of ["Zzyzx", CORREO, "@", "10.0.0.1", RESP.join(","), "Ejemplo S. A."]) assert.ok(!todo.includes(prohibido), prohibido);
});
