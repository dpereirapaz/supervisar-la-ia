// Función /api/informe (anexo SPEC_informe-personalizado.md, R-04 a R-25).
import contenido from "../../report/content/informe.es.json" with { type: "json" };
import { analizar, plantilla } from "../../report/src/engine.mjs";
import { renderizarInforme, fechaISO } from "../../report/src/render-pdf.mjs";
import { cargarFuentes } from "../../report/src/fuentes.mjs";
import { leerCampos, esSpam, validar, escaparHTML, ErrorSolicitud } from "./lib/validate.mjs";
import { permitir } from "./lib/ratelimit.mjs";
import { crearMailer } from "./lib/mailer.mjs";
import { exito, error, metodoNoPermitido, pdf } from "./lib/respuesta.mjs";

const PLAZO_MS = 7500;
const OBLIGATORIAS = ["BREVO_API_KEY", "MAIL_FROM", "MAIL_FROM_NAME", "MAIL_REPLY_TO", "AUTHOR_EMAIL", "CONTACT_EMAIL", "WHITEBOOK_URL", "SITE_URL", "SITE_HOST"];

function registrar({ origen, status, codigo, inicio }) {
  console.log(JSON.stringify({ t: new Date().toISOString(), origen: origen || "-", status, codigo: codigo || "-", ms: Date.now() - inicio }));
}

function componerCorreo(plant, valores, enlaces) {
  const saludo = valores.nombre ? plant.saludo_con_nombre : plant.saludo_sin_nombre;
  const parrafos = [saludo, ...plant.cuerpo, plant.firma].map((p) => plantilla(p, valores));
  const pie = plantilla(plant.pie, valores);
  const texto = [...parrafos, "", "—", pie].join("\n\n");
  const enlazar = (s) => enlaces.filter(Boolean).reduce((acc, u) => acc.split(escaparHTML(u)).join(`<a href="${escaparHTML(u)}" style="color:#18212F">${escaparHTML(u)}</a>`), escaparHTML(s));
  const html =
    `<!DOCTYPE html><html lang="es"><body style="margin:0;padding:24px;background:#FFFFFF">` +
    `<div style="max-width:600px;margin:0 auto;font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1C2430">` +
    parrafos.map((p) => `<p style="margin:0 0 16px">${enlazar(p)}</p>`).join("") +
    `<p style="margin:32px 0 0;padding-top:16px;border-top:1px solid #D9DCE1;font-size:13px;color:#5A6474">${enlazar(pie)}</p>` +
    `</div></body></html>`;
  return { texto, html };
}

function correoAutor(plant, valores) {
  const asunto = plantilla(plant.asunto, valores);
  const texto = plant.cuerpo.map((l) => plantilla(l, valores)).join("\n");
  const html = `<!DOCTYPE html><html lang="es"><body><pre style="font-family:-apple-system,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap">${escaparHTML(texto)}</pre></body></html>`;
  return { asunto, texto, html };
}

export default async function handler(req, context = {}) {
  const inicio = Date.now();
  const env = process.env;
  const mensajes = contenido.mensajes;
  const contacto = env.CONTACT_EMAIL || "";
  let origen;

  if (req.method !== "POST") {
    registrar({ status: 405, codigo: "metodo", inicio });
    return metodoNoPermitido();
  }

  try {
    const campos = await leerCampos(req);
    origen = campos.origen === "autoevaluacion" || campos.origen === "whitebook" ? campos.origen : undefined;

    if (esSpam(campos)) {
      registrar({ origen, status: 200, codigo: "honeypot", inicio });
      return exito(req);
    }

    const datos = validar(campos);

    const ip = context.ip || req.headers.get("x-nf-client-connection-ip") || "desconocida";
    if (!(await permitir({ ip, correo: datos.correo }))) {
      throw new ErrorSolicitud(429, "demasiadas_solicitudes");
    }

    const modo = env.DELIVERY_MODE === "download" ? "download" : "email";
    if (modo === "download" && env.CONTEXT === "production") {
      registrar({ origen, status: 503, codigo: "modo_descarga_en_produccion", inicio });
      return new Response(null, { status: 503, headers: { "Cache-Control": "no-store" } });
    }
    if (modo === "email") {
      const faltan = OBLIGATORIAS.filter((k) => !env[k]);
      if (faltan.length) {
        registrar({ origen, status: 500, codigo: "falta_variable:" + faltan.join(","), inicio });
        return error(req, 500, "error_interno", mensajes, { contacto });
      }
    }

    const fecha = new Date();
    let analisis = null;
    let informe = null;
    if (datos.origen === "autoevaluacion") {
      analisis = analizar(datos.respuestas, contenido);
      informe = await renderizarInforme({
        contenido,
        analisis,
        persona: { nombre: datos.nombre, organizacion: datos.organizacion },
        fecha,
        fuentes: cargarFuentes(),
        sitio: env.SITE_HOST || "",
        contacto,
      });
    }

    if (modo === "download") {
      registrar({ origen, status: 200, codigo: "descarga", inicio });
      return datos.origen === "autoevaluacion" ? pdf(informe) : exito(req);
    }

    const mailer = crearMailer({
      apiKey: env.BREVO_API_KEY,
      remitente: env.MAIL_FROM,
      nombreRemitente: env.MAIL_FROM_NAME,
      limiteMs: () => PLAZO_MS - (Date.now() - inicio),
    });

    const sitioURL = env.SITE_URL.replace(/\/$/, "");
    const valores = {
      nombre: datos.nombre,
      enlace_whitebook: env.WHITEBOOK_URL,
      sitio: env.SITE_HOST,
      url_privacidad: sitioURL + "/privacidad/",
      url_autoevaluacion: sitioURL + "/autoevaluacion/",
      contacto,
      fecha_iso: fechaISO(fecha),
    };

    const plantLector = datos.origen === "autoevaluacion" ? contenido.correo.usuario : contenido.correo.whitebook;
    const cuerpoLector = componerCorreo(plantLector, valores, [valores.enlace_whitebook, valores.url_privacidad, valores.url_autoevaluacion]);
    try {
      await mailer.enviarCorreo({
        para: datos.correo,
        asunto: plantilla(plantLector.asunto, valores),
        texto: cuerpoLector.texto,
        html: cuerpoLector.html,
        responderA: env.MAIL_REPLY_TO,
        adjuntos: informe ? [{ nombre: plantilla(contenido.correo.usuario.nombre_adjunto, valores), bytes: informe }] : [],
      });
    } catch (e) {
      throw new ErrorSolicitud(502, "envio_fallido", { codigoInterno: e.message });
    }

    const valoresAutor = {
      nombre: datos.nombre || "—",
      organizacion: datos.organizacion || "—",
      organizacion_corta: datos.organizacion ? " · " + datos.organizacion : "",
      correo: datos.correo,
      fecha_iso: valores.fecha_iso,
      marketing: datos.info ? "sí" : "no",
    };
    if (analisis) {
      valoresAutor.total = analisis.total;
      valoresAutor.grupos = analisis.decisiones.map((d) => `${d.puntos}/9`).join(" · ");
      valoresAutor.arquetipo = contenido.lectura_global.arquetipos[analisis.arquetipo].titulo;
      const pd = analisis.decisiones.filter((d) => d.estado === "por_decidir").map((d) => d.id);
      valoresAutor.por_decidir = pd.length ? pd.join(", ") : "ninguna";
    }
    const autor = correoAutor(analisis ? contenido.correo.autor : contenido.correo.autor_whitebook, valoresAutor);
    try {
      await mailer.enviarCorreo({ para: env.AUTHOR_EMAIL, asunto: autor.asunto, texto: autor.texto, html: autor.html });
    } catch (e) {
      registrar({ origen, status: 0, codigo: "aviso_autor_fallido:" + e.message, inicio });
    }

    if (datos.info && env.BREVO_LIST_ID) {
      try {
        await mailer.anadirContacto({ correo: datos.correo, nombre: datos.nombre, listaId: env.BREVO_LIST_ID });
      } catch (e) {
        registrar({ origen, status: 0, codigo: "lista_fallida:" + e.message, inicio });
      }
    }

    registrar({ origen, status: 200, codigo: "enviado", inicio });
    return exito(req);
  } catch (e) {
    if (e instanceof ErrorSolicitud) {
      registrar({ origen, status: e.status, codigo: e.valores.codigoInterno || e.codigo, inicio });
      return error(req, e.status, e.codigo, mensajes, { ...e.valores, contacto });
    }
    registrar({ origen, status: 500, codigo: "error_interno:" + (e && e.name), inicio });
    return error(req, 500, "error_interno", mensajes, { contacto });
  }
}
