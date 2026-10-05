// Respuestas HTTP de /api/informe (anexo, secciones 6.3 y 6.4).
import { plantilla } from "../../../report/src/engine.mjs";

const NO_STORE = { "Cache-Control": "no-store" };

export function quiereJSON(req) {
  return (req.headers.get("accept") || "").includes("application/json");
}

export function exito(req) {
  if (quiereJSON(req)) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...NO_STORE, "Content-Type": "application/json; charset=utf-8" } });
  }
  return new Response(null, { status: 303, headers: { ...NO_STORE, Location: "/gracias/" } });
}

const CLAVE_MENSAJE = {
  correo_invalido: "correo_invalido",
  faltan_afirmaciones: "faltan_afirmaciones",
  demasiadas_solicitudes: "demasiadas_solicitudes",
};

export function error(req, status, codigo, mensajes, valores = {}) {
  if (!quiereJSON(req)) {
    return new Response(null, { status: 303, headers: { ...NO_STORE, Location: "/error/" } });
  }
  const mensaje = plantilla(mensajes[CLAVE_MENSAJE[codigo] || "error_generico"], valores);
  return new Response(JSON.stringify({ ok: false, codigo, mensaje }), {
    status,
    headers: { ...NO_STORE, "Content-Type": "application/json; charset=utf-8" },
  });
}

export function metodoNoPermitido() {
  return new Response(null, { status: 405, headers: { ...NO_STORE, Allow: "POST" } });
}

export function pdf(bytes) {
  return new Response(bytes, {
    status: 200,
    headers: { ...NO_STORE, "Content-Type": "application/pdf", "Content-Disposition": 'attachment; filename="lectura-del-consejo.pdf"' },
  });
}
