// Lectura y validación de los campos del formulario (anexo, R-01, R-05 pasos 1 y 2, sección 6.2).
import { limpiarTexto } from "../../../report/src/render-pdf.mjs";

export const MAX_CUERPO = 8 * 1024;
const CORREO = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]+$/;

export class ErrorSolicitud extends Error {
  constructor(status, codigo, valores = {}) {
    super(codigo);
    this.status = status;
    this.codigo = codigo;
    this.valores = valores;
  }
}

export async function leerCampos(req) {
  const declarado = Number(req.headers.get("content-length") || 0);
  if (declarado > MAX_CUERPO) throw new ErrorSolicitud(413, "solicitud_invalida");
  const buf = await req.arrayBuffer();
  if (buf.byteLength > MAX_CUERPO) throw new ErrorSolicitud(413, "solicitud_invalida");

  const tipo = (req.headers.get("content-type") || "").toLowerCase();
  let datos;
  if (tipo.startsWith("application/x-www-form-urlencoded")) {
    datos = new URLSearchParams(new TextDecoder().decode(buf));
  } else if (tipo.startsWith("multipart/form-data")) {
    try {
      datos = await new Response(buf, { headers: { "content-type": req.headers.get("content-type") } }).formData();
    } catch {
      throw new ErrorSolicitud(400, "solicitud_invalida");
    }
  } else {
    throw new ErrorSolicitud(415, "solicitud_invalida");
  }
  const campos = {};
  for (const [k, v] of datos.entries()) if (typeof v === "string" && !(k in campos)) campos[k] = v;
  return campos;
}

export function esSpam(campos) {
  return (campos._gotcha || "").trim() !== "";
}

export function validar(campos) {
  const origen = campos.origen;
  if (origen !== "autoevaluacion" && origen !== "whitebook") throw new ErrorSolicitud(400, "solicitud_invalida");

  const correo = (campos.correo || "").trim();
  if (correo.length > 254 || !CORREO.test(correo)) throw new ErrorSolicitud(400, "correo_invalido");

  if (!campos.consentimiento) throw new ErrorSolicitud(400, "solicitud_invalida");

  let respuestas = null;
  if (origen === "autoevaluacion") {
    const faltan = [];
    respuestas = [];
    for (let i = 1; i <= 18; i++) {
      const v = (campos["r" + i] ?? "").trim();
      const n = /^[0-3]$/.test(v) ? Number(v) : NaN;
      if (Number.isNaN(n)) faltan.push(i);
      respuestas.push(n);
    }
    if (faltan.length) throw new ErrorSolicitud(422, "faltan_afirmaciones", { lista: faltan.join(", ") });
  }

  return {
    origen,
    correo,
    nombre: limpiarTexto(campos.nombre, 80),
    organizacion: limpiarTexto(campos.organizacion, 80),
    info: Boolean(campos.info),
    respuestas,
  };
}

export function escaparHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
