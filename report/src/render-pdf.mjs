// Generador del PDF «Lectura del consejo». Solo pdf-lib y @pdf-lib/fontkit.
// Funciona en Node y en Cloudflare Workers (no usa fs, ni Buffer, ni DOM).
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { plantilla, unirLista } from "./engine.mjs";

// ---------- Tokens (mismos que la web, Sección 8 de la especificación) ----------
const hex = (h) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const C = {
  ink: hex("#18212F"),
  text: hex("#1C2430"),
  muted: hex("#5A6474"),
  paper: hex("#FFFFFF"),
  tint: hex("#F1F3F6"),
  rule: hex("#D9DCE1"),
  signal: hex("#C8102E"),
  onDarkMuted: hex("#9AA3B0"),
  onDarkSoft: hex("#DCE1E8"),
};

// A4 en puntos
const W = 595.28;
const H = 841.89;
const M = { l: 56, r: 56, t: 72, b: 64 };
const CW = W - M.l - M.r; // ancho de contenido

/** Limpia texto escrito por el usuario: quita controles y caracteres que las fuentes no cubren. */
export function limpiarTexto(s, max = 80) {
  if (!s) return "";
  return String(s)
    .normalize("NFC")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/[^ -ÿ‐-‧€]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function fechaLarga(fecha) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Madrid" }).format(fecha);
}
export function fechaISO(fecha) {
  // AAAA-MM-DD en zona Europe/Madrid
  const p = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Europe/Madrid" }).format(fecha);
  return p;
}

/**
 * @param {object} o
 * @param {object} o.contenido  contenido/informe.es.json
 * @param {object} o.analisis   resultado de analizar()
 * @param {{nombre?:string, organizacion?:string}} o.persona
 * @param {Date} o.fecha
 * @param {{p4:ArrayBuffer,p6:ArrayBuffer,l4:ArrayBuffer,l4i:ArrayBuffer,l6:ArrayBuffer}} o.fuentes
 * @param {string} o.sitio      p. ej. «supervisarlaia.es» (se muestra en la portada)
 * @param {string} [o.contacto] correo de contacto del autor (opcional)
 * @returns {Promise<Uint8Array>}
 */
export async function renderizarInforme({ contenido: T, analisis: A, persona = {}, fecha, fuentes, sitio, contacto }) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  doc.setTitle("Supervisión de la IA · Lectura del consejo");
  doc.setAuthor("David Pereira Paz");
  doc.setSubject("Lectura orientativa de la autoevaluación del consejo");
  doc.setCreator("Supervisión de la IA");
  doc.setProducer("pdf-lib");
  doc.setLanguage("es-ES");

  const opt = { subset: true };
  const F = {
    p4: await doc.embedFont(fuentes.p4, opt),
    p6: await doc.embedFont(fuentes.p6, opt),
    l4: await doc.embedFont(fuentes.l4, opt),
    l4i: await doc.embedFont(fuentes.l4i, opt),
    l6: await doc.embedFont(fuentes.l6, opt),
  };

  const nombre = limpiarTexto(persona.nombre);
  const organizacion = limpiarTexto(persona.organizacion);
  const anio = fecha.getFullYear();

  // ---------- Utilidades de texto ----------
  // La medida con fontkit es cara. Se mide cada palabra una sola vez por fuente y se suman anchos.
  const cache = new Map();
  const palabraAncho = (t, f, s) => {
    const k = f.name + "|" + s + "|" + t;
    let v = cache.get(k);
    if (v === undefined) {
      v = f.widthOfTextAtSize(t, s);
      cache.set(k, v);
    }
    return v;
  };
  const ancho = (t, f, s) => {
    const partes = t.split(" ");
    const esp = palabraAncho(" ", f, s);
    return partes.reduce((a, p) => a + (p ? palabraAncho(p, f, s) : 0), 0) + esp * (partes.length - 1);
  };
  function envolver(texto, f, s, maxW) {
    const lineas = [];
    const esp = palabraAncho(" ", f, s);
    for (const parrafo of String(texto).split("\n")) {
      const palabras = parrafo.split(/\s+/).filter(Boolean);
      let actual = "";
      let wActual = 0;
      for (const p of palabras) {
        const wp = palabraAncho(p, f, s);
        if (!actual) {
          actual = p;
          wActual = wp;
        } else if (wActual + esp + wp <= maxW) {
          actual += " " + p;
          wActual += esp + wp;
        } else {
          lineas.push(actual);
          actual = p;
          wActual = wp;
        }
      }
      lineas.push(actual);
    }
    return lineas;
  }

  // ---------- Estado de página ----------
  let page = null;
  let y = 0; // distancia desde el borde superior
  let nPag = 0;
  const Y = (yy) => H - yy; // convierte a coordenadas pdf-lib

  function cabeceraPie() {
    page.drawText("Supervisión de la IA · Lectura del consejo", { x: M.l, y: Y(40), size: 8, font: F.p4, color: C.muted });
    page.drawLine({ start: { x: M.l, y: Y(50) }, end: { x: W - M.r, y: Y(50) }, thickness: 0.6, color: C.rule });
    const num = String(nPag);
    page.drawText(num, { x: W - M.r - ancho(num, F.p4, 8), y: Y(40), size: 8, font: F.p4, color: C.muted });
    const pie = plantilla(T.cierre.pie_legal, { anio });
    page.drawText(pie, { x: M.l, y: Y(H - 36), size: 6.5, font: F.p4, color: C.muted });
  }
  function nuevaPagina() {
    page = doc.addPage([W, H]);
    nPag += 1;
    cabeceraPie();
    y = M.t;
  }
  const asegurar = (h) => {
    if (y + h > H - M.b) nuevaPagina();
  };

  // ---------- Primitivas de dibujo ----------
  function lineas(texto, { f = F.l4, s = 10.5, color = C.text, lh = 1.5, x = M.l, w = CW, salto = 0 } = {}) {
    const ls = envolver(texto, f, s, w);
    for (const l of ls) {
      asegurar(s * lh);
      page.drawText(l, { x, y: Y(y + s), size: s, font: f, color });
      y += s * lh;
    }
    y += salto;
  }
  const altoTexto = (texto, f, s, w, lh = 1.5) => envolver(texto, f, s, w).length * s * lh;

  function kicker(texto) {
    asegurar(40);
    page.drawRectangle({ x: M.l, y: Y(y + 2), width: 24, height: 2, color: C.signal });
    y += 12;
    page.drawText(texto, { x: M.l, y: Y(y + 9), size: 9, font: F.p6, color: C.signal });
    y += 18;
  }
  function h1(texto, { kick } = {}) {
    asegurar(70);
    if (kick) kicker(kick);
    lineas(texto, { f: F.p6, s: 21, color: C.ink, lh: 1.2, salto: 10 });
  }
  function h2(texto, { salto = 6 } = {}) {
    asegurar(40);
    lineas(texto, { f: F.p6, s: 13.5, color: C.ink, lh: 1.25, salto });
  }
  function etiqueta(texto, { color = C.muted, salto = 3 } = {}) {
    asegurar(20);
    page.drawText(texto, { x: M.l, y: Y(y + 8.5), size: 8.5, font: F.p6, color });
    y += 8.5 * 1.5 + salto;
  }
  function vineta(texto, { x = M.l, w = CW, s = 10, f = F.l4, color = C.text, salto = 4, prefijo } = {}) {
    const sangria = 12;
    const ls = envolver(texto, f, s, w - sangria);
    asegurar(Math.min(ls.length, 2) * s * 1.5);
    page.drawRectangle({ x: x + 1, y: Y(y + s * 0.95), width: 3.2, height: 3.2, color: C.signal });
    for (let i = 0; i < ls.length; i++) {
      asegurar(s * 1.5);
      if (prefijo && i === 0) {
        page.drawText(prefijo, { x: x + sangria, y: Y(y + s), size: s, font: F.l6, color: C.ink });
        page.drawText(ls[i].slice(0), { x: x + sangria, y: Y(y + s), size: s, font: f, color });
      } else page.drawText(ls[i], { x: x + sangria, y: Y(y + s), size: s, font: f, color });
      y += s * 1.5;
    }
    y += salto;
  }
  function caja({ etiquetaTxt, texto, s = 10.5 }) {
    const pad = 12;
    const hTexto = altoTexto(texto, F.l4, s, CW - pad * 2 - 4);
    const h = pad * 2 + 14 + hTexto;
    asegurar(h + 8);
    page.drawRectangle({ x: M.l, y: Y(y + h), width: CW, height: h, color: C.tint });
    page.drawRectangle({ x: M.l, y: Y(y + h), width: 3, height: h, color: C.signal });
    page.drawText(etiquetaTxt, { x: M.l + pad + 3, y: Y(y + pad + 8.5), size: 8.5, font: F.p6, color: C.signal });
    let yy = y + pad + 14;
    for (const l of envolver(texto, F.l4, s, CW - pad * 2 - 4)) {
      page.drawText(l, { x: M.l + pad + 3, y: Y(yy + s), size: s, font: F.l4, color: C.text });
      yy += s * 1.5;
    }
    y += h + 12;
  }
  function regla() {
    asegurar(10);
    page.drawLine({ start: { x: M.l, y: Y(y) }, end: { x: W - M.r, y: Y(y) }, thickness: 0.6, color: C.rule });
    y += 12;
  }
  function barra(x, yTop, w, valor, max) {
    page.drawRectangle({ x, y: Y(yTop + 6), width: w, height: 6, color: C.rule });
    if (valor > 0) page.drawRectangle({ x, y: Y(yTop + 6), width: (w * valor) / max, height: 6, color: C.signal });
  }

  const D = T.decisiones;
  const textoRevision = (d) =>
    plantilla(d.doses.length === 1 ? T.comprobar.revision_una : T.comprobar.revision_varias, { lista: unirLista(d.doses.map(String)) });
  const etiquetaEstado = (e) => T.estados[e];
  const decTitulo = (id) => D[id - 1].titulo;

  // ======================= PORTADA =======================
  page = doc.addPage([W, H]);
  nPag = 1;
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: C.ink });
  page.drawText("6", { x: W - 255, y: -70, size: 640, font: F.p6, color: C.signal, opacity: 0.4 });
  page.drawText(T.portada.kicker, { x: 64, y: Y(80), size: 9.5, font: F.p4, color: C.onDarkMuted });
  page.drawRectangle({ x: 64, y: Y(250), width: 40, height: 3, color: C.signal });
  let yy = 290;
  for (const l of envolver(T.portada.titulo, F.p6, 44, 360)) {
    page.drawText(l, { x: 64, y: Y(yy), size: 44, font: F.p6, color: C.paper });
    yy += 52;
  }
  yy += 6;
  for (const l of envolver(T.portada.subtitulo, F.l4i, 15, 330)) {
    page.drawText(l, { x: 64, y: Y(yy), size: 15, font: F.l4i, color: C.onDarkSoft });
    yy += 22;
  }
  // Bloque inferior
  let yb = H - 190;
  if (nombre || organizacion) {
    page.drawText(T.portada.preparado, { x: 64, y: Y(yb), size: 8.5, font: F.p4, color: C.onDarkMuted });
    yb += 18;
    if (nombre) {
      page.drawText(nombre, { x: 64, y: Y(yb), size: 13, font: F.p6, color: C.paper });
      yb += 18;
    }
    if (organizacion) {
      page.drawText(organizacion, { x: 64, y: Y(yb), size: 11, font: F.p4, color: C.paper });
      yb += 18;
    }
    yb += 8;
  }
  page.drawText(T.portada.fecha, { x: 64, y: Y(yb), size: 8.5, font: F.p4, color: C.onDarkMuted });
  page.drawText(fechaLarga(fecha), { x: 64, y: Y(yb + 18), size: 11, font: F.p4, color: C.paper });
  page.drawText("David Pereira Paz" + (sitio ? " · " + sitio : ""), { x: 64, y: Y(H - 60), size: 9, font: F.p4, color: C.onDarkMuted });
  page.drawText(T.portada.pie, { x: 64, y: Y(H - 44), size: 7, font: F.p4, color: C.onDarkMuted });

  // ======================= PÁGINA 2: LECTURA GLOBAL =======================
  nuevaPagina();
  h1(T.como_leer.titulo, { kick: "Antes de empezar" });
  lineas(T.como_leer.texto, { salto: 14 });

  h1(T.lectura_global.titulo, { kick: "Resumen" });
  const arq = T.lectura_global.arquetipos[A.arquetipo];
  h2(arq.titulo);
  lineas(arq.texto, { salto: 8 });
  caja({ etiquetaTxt: T.lectura_global.lo_primero_etiqueta, texto: arq.lo_primero });

  const LG = T.lectura_global;
  const formatoDec = (arr) => unirLista(arr.map((d) => `«${d.titulo}»`));
  if (A.masAvanzadas.length) {
    vineta(
      plantilla(A.masAvanzadas.length > 1 ? LG.mas_avanzadas : LG.mas_avanzada, { decision: formatoDec(A.masAvanzadas), puntos: A.masAvanzadas[0].puntos })
    );
    vineta(
      plantilla(A.masAtrasadas.length > 1 ? LG.mas_atrasadas : LG.mas_atrasada, { decision: formatoDec(A.masAtrasadas), puntos: A.masAtrasadas[0].puntos })
    );
  }
  vineta(A.decisionesCero.length ? plantilla(LG.ceros_alguna, { decisiones: formatoDec(A.decisionesCero) }) : LG.ceros_ninguna);
  vineta(plantilla(LG.sin_documentar, { n: A.sinDocumentar }), { salto: 14 });

  // Mapa de seis decisiones
  h2(T.mapa.titulo, { salto: 8 });
  A.decisiones.forEach((d) => {
    asegurar(30);
    page.drawText(String(d.id), { x: M.l, y: Y(y + 15), size: 15, font: F.p6, color: C.signal });
    page.drawText(d.titulo, { x: M.l + 24, y: Y(y + 14), size: 10, font: F.p4, color: C.ink });
    const xb = M.l + 262;
    barra(xb, y + 7, 110, d.puntos, 9);
    page.drawText(`${d.puntos} / 9`, { x: xb + 118, y: Y(y + 14), size: 9, font: F.p6, color: C.ink });
    const et = etiquetaEstado(d.estado);
    page.drawText(et, { x: W - M.r - ancho(et, F.p6, 9), y: Y(y + 14), size: 9, font: F.p6, color: C.muted });
    y += 26;
    page.drawLine({ start: { x: M.l, y: Y(y - 3) }, end: { x: W - M.r, y: Y(y - 3) }, thickness: 0.5, color: C.rule });
  });
  y += 6;
  lineas(`Total: ${A.total} de 54.`, { f: F.p4, s: 9, color: C.muted, salto: 14 });

  // Respuestas que conviene contrastar
  if (A.incoherencias.length) {
    h2(T.incoherencias.titulo);
    lineas(T.incoherencias.intro, { s: 10, color: C.muted, salto: 6 });
    A.incoherencias.forEach((i) => vineta(i.texto, { salto: 6 }));
    y += 6;
  }

  // ======================= DECISIÓN POR DECISIÓN =======================
  y += 10;
  h1(T.detalle.titulo, { kick: "Lectura" });
  A.decisiones.forEach((d, idx) => {
    const def = D[idx];
    const items = [...d.ceros, ...d.unos].sort((a, b) => a - b);
    // Medir el bloque para no partirlo entre páginas
    const wTxt = CW;
    let h = 44; // cabecera con barra
    h += 12 + 10.5 * 1.5 * envolver(def.pregunta, F.l4i, 10.5, wTxt).length; // pregunta
    h += 8 + altoTexto(def.estados[d.estado], F.l4, 10.5, wTxt);
    h += 8 + 8.5 * 1.5 + 3;
    if (items.length) items.forEach((id) => (h += altoTexto(T.afirmaciones[id - 1][d.ceros.includes(id) ? "si0" : "si1"], F.l4, 10, wTxt - 12) + 4 + 14));
    else h += altoTexto(T.comprobar.ninguna, F.l4, 10, wTxt) + 4;
    if (d.doses.length) h += altoTexto(textoRevision(d), F.l4i, 10, wTxt) + 8;
    h += 26;
    asegurar(Math.min(h, 250));

    // Cabecera
    page.drawText(String(d.id), { x: M.l, y: Y(y + 24), size: 28, font: F.p6, color: C.signal });
    for (const [i, l] of envolver(d.titulo, F.p6, 14, CW - 40).entries()) {
      page.drawText(l, { x: M.l + 34, y: Y(y + 14 + i * 17), size: 14, font: F.p6, color: C.ink });
    }
    const nLin = envolver(d.titulo, F.p6, 14, CW - 40).length;
    const yBar = y + 14 + (nLin - 1) * 17 + 12;
    barra(M.l + 34, yBar, 120, d.puntos, 9);
    page.drawText(`${d.puntos} / 9 · ${etiquetaEstado(d.estado)}`, { x: M.l + 34 + 130, y: Y(yBar + 7), size: 8.5, font: F.p6, color: C.muted });
    y = Math.max(y + 36, yBar + 20);

    etiqueta(T.comprobar.pregunta_etiqueta, { color: C.signal });
    lineas(def.pregunta, { f: F.l4i, s: 10.5, color: C.ink, salto: 6 });
    lineas(def.estados[d.estado], { salto: 6 });

    etiqueta(T.comprobar.titulo);
    if (items.length) {
      items.forEach((id) => {
        const t = T.afirmaciones[id - 1];
        vineta(t[d.ceros.includes(id) ? "si0" : "si1"], { prefijo: "", s: 10 });
      });
    } else lineas(T.comprobar.ninguna, { s: 10, color: C.muted, salto: 4 });
    if (d.doses.length)
      lineas(textoRevision(d), { f: F.l4i, s: 10, color: C.muted, salto: 4 });
    y += 6;
    if (idx < 5) regla();
  });

  // ======================= CIEN DÍAS =======================
  const CD = T.cien_dias;
  y += 14;
  h1(CD.titulo, { kick: "Propuesta" });
  lineas(CD.intro, { salto: 10 });
  h2(CD.prioridades_titulo);
  if (A.prioridades.length) {
    lineas(CD.prioridades_intro_con, { salto: 4 });
    A.prioridades.forEach((id) => {
      const d = A.decisiones[id - 1];
      asegurar(24);
      page.drawText(String(id), { x: M.l, y: Y(y + 15), size: 15, font: F.p6, color: C.signal });
      page.drawText(decTitulo(id), { x: M.l + 24, y: Y(y + 14), size: 10.5, font: F.p4, color: C.ink });
      const et = `${d.puntos} / 9 · ${etiquetaEstado(d.estado)}`;
      page.drawText(et, { x: W - M.r - ancho(et, F.p6, 8.5), y: Y(y + 14), size: 8.5, font: F.p6, color: C.muted });
      y += 24;
    });
  } else lineas(CD.prioridades_intro_sin, { salto: 4 });
  y += 10;

  CD.reuniones.forEach((r, ri) => {
    const anade = A.prioridades.length
      ? A.prioridades.map((id) => ({ id, texto: D[id - 1].plan[r.clave] }))
      : r.clave === "recibir"
      ? A.paraMantener.map((id) => ({ id, texto: D[id - 1].plan.mantener }))
      : [];
    const pad = 12;
    const w = CW - pad * 2;
    let h = 26 + pad;
    h += 8.5 * 1.5 + 2 + altoTexto(r.base, F.l4, 10, w);
    h += 10 + 8.5 * 1.5 + 2;
    if (anade.length) anade.forEach((a) => (h += altoTexto(`${a.id} · ${decTitulo(a.id)}. ${a.texto}`, F.l4, 10, w - 12) + 4));
    else h += 10 * 1.5 + 4;
    h += 10 + 8.5 * 1.5 + 2 + altoTexto(r.sale, F.l4i, 10, w) + pad;
    asegurar(h + 10);

    const top = y;
    page.drawRectangle({ x: M.l, y: Y(top + h), width: CW, height: h, borderColor: C.rule, borderWidth: 0.8, color: C.paper });
    page.drawRectangle({ x: M.l, y: Y(top + 26), width: CW, height: 26, color: C.ink });
    page.drawText(r.titulo, { x: M.l + pad, y: Y(top + 17), size: 10.5, font: F.p6, color: C.paper });
    page.drawText(r.cuando, { x: W - M.r - pad - ancho(r.cuando, F.p4, 9), y: Y(top + 17), size: 9, font: F.p4, color: C.onDarkSoft });
    y = top + 26 + pad;

    const x0 = M.l + pad;
    const sub = (txt, col = C.muted) => {
      page.drawText(txt, { x: x0, y: Y(y + 8.5), size: 8.5, font: F.p6, color: col });
      y += 8.5 * 1.5 + 2;
    };
    const parr = (txt, f = F.l4, s = 10) => {
      for (const l of envolver(txt, f, s, w)) {
        page.drawText(l, { x: x0, y: Y(y + s), size: s, font: f, color: C.text });
        y += s * 1.5;
      }
    };
    sub(CD.base_etiqueta);
    parr(r.base);
    y += 10;
    sub(CD.anade_etiqueta, C.signal);
    if (anade.length)
      anade.forEach((a) => {
        const txt = `${a.id} · ${decTitulo(a.id)}. ${a.texto}`;
        const ls = envolver(txt, F.l4, 10, w - 12);
        page.drawRectangle({ x: x0 + 1, y: Y(y + 9.5), width: 3.2, height: 3.2, color: C.signal });
        ls.forEach((l) => {
          page.drawText(l, { x: x0 + 12, y: Y(y + 10), size: 10, font: F.l4, color: C.text });
          y += 15;
        });
        y += 4;
      });
    else {
      page.drawText("Su resultado no añade nada a la agenda base.", { x: x0, y: Y(y + 10), size: 10, font: F.l4i, color: C.muted });
      y += 19;
    }
    y += 10;
    sub(CD.sale_etiqueta);
    parr(r.sale, F.l4i);
    y = top + h + 14;
  });

  // Encargo propuesto
  asegurar(120);
  h2(CD.encargo.titulo);
  if (A.prioridades.length) {
    lineas(CD.encargo.apertura, { s: 10.5, salto: 4 });
    A.prioridades.forEach((id, i) => {
      const t = D[id - 1].plan.encargo;
      vineta(t + (i === A.prioridades.length - 1 ? "." : ";"), { s: 10.5, salto: 3 });
    });
    lineas(CD.encargo.cierre, { s: 10.5, salto: 14 });
  } else lineas(CD.encargo.sin_prioridades, { s: 10.5, salto: 14 });

  h2(CD.no_hacer.titulo);
  CD.no_hacer.items.forEach((t) => vineta(t, { salto: 5 }));
  y += 8;
  caja({ etiquetaTxt: CD.despues.titulo, texto: CD.despues.texto });

  // ======================= REGISTRO =======================
  nuevaPagina();
  h1(T.registro.titulo, { kick: "Registro" });
  lineas(T.registro.intro, { salto: 6 });
  lineas(Object.entries(T.escala).map(([k, v]) => `${k} · ${v}`).join("   "), { f: F.p4, s: 8, color: C.muted, lh: 1.6, salto: 10 });

  const cNum = 28;
  const cPts = 44;
  const cTxt = CW - cNum - cPts;
  A.decisiones.forEach((d, idx) => {
    asegurar(24 + 20 * 3);
    page.drawRectangle({ x: M.l, y: Y(y + 20), width: CW, height: 20, color: C.tint });
    page.drawText(`${d.id}. ${d.titulo}`, { x: M.l + 8, y: Y(y + 14), size: 9, font: F.p6, color: C.ink });
    const t = `${d.puntos} / 9`;
    page.drawText(t, { x: W - M.r - 8 - ancho(t, F.p6, 9), y: Y(y + 14), size: 9, font: F.p6, color: C.ink });
    y += 24;
    D[idx].afirmaciones.forEach((id) => {
      const af = T.afirmaciones[id - 1];
      const ls = envolver(af.texto, F.l4, 9.5, cTxt - 8);
      const h = Math.max(20, ls.length * 13.5 + 7);
      asegurar(h);
      page.drawText(String(id), { x: M.l + 8, y: Y(y + 14), size: 9, font: F.p4, color: C.muted });
      ls.forEach((l, i) => page.drawText(l, { x: M.l + cNum, y: Y(y + 14 + i * 14), size: 9.5, font: F.l4, color: C.text }));
      const v = String(A.respuestas[id - 1]);
      page.drawText(v, { x: W - M.r - 8 - ancho(v, F.p6, 11), y: Y(y + 15), size: 11, font: F.p6, color: C.ink });
      y += h;
      page.drawLine({ start: { x: M.l, y: Y(y) }, end: { x: W - M.r, y: Y(y) }, thickness: 0.4, color: C.rule });
    });
    y += 8;
  });
  lineas(`Total: ${A.total} de 54. ${T.regla_estados}`, { f: F.p4, s: 8.5, color: C.muted, salto: 16 });

  // Cierre
  asegurar(150);
  h2(T.cierre.titulo);
  lineas(T.cierre.limites, { salto: 6 });
  lineas(T.cierre.repetir, { salto: 6 });
  if (contacto && T.cierre.ofrecimiento) lineas(plantilla(T.cierre.ofrecimiento, { contacto }), { f: F.l4i, color: C.ink });

  return doc.save();
}
