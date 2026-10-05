// Límite de solicitudes (anexo, R-12): 5 por IP y hora, 3 por correo y 24 horas.
// Solo se guarda el hash SHA-256 del valor, con un contador y una caducidad.
import { createHash } from "node:crypto";

export const LIMITES = [
  { clave: "ip", max: 5, ventanaMs: 60 * 60 * 1000 },
  { clave: "correo", max: 3, ventanaMs: 24 * 60 * 60 * 1000 },
];

export const hash = (v) => createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex");

export function almacenMemoria() {
  const m = new Map();
  return {
    async get(k) { return m.get(k) ?? null; },
    async set(k, v) { m.set(k, v); },
  };
}

let almacen = null;

export function usarAlmacen(a) {
  almacen = a;
}

async function almacenPorDefecto() {
  if (almacen) return almacen;
  try {
    const { getStore } = await import("@netlify/blobs");
    const store = getStore("limite-solicitudes");
    await store.get("_prueba");
    almacen = {
      async get(k) { return (await store.get(k, { type: "json" })) ?? null; },
      async set(k, v) { await store.setJSON(k, v); },
    };
  } catch {
    almacen = almacenMemoria();
  }
  return almacen;
}

/** Devuelve true si la solicitud se permite y cuenta un uso. */
export async function permitir({ ip, correo }, ahora = Date.now()) {
  const a = await almacenPorDefecto();
  const valores = { ip, correo };
  const entradas = [];
  for (const l of LIMITES) {
    const k = `${l.clave}:${hash(valores[l.clave] || "desconocido")}`;
    let e = await a.get(k);
    if (!e || e.expira <= ahora) e = { n: 0, expira: ahora + l.ventanaMs };
    if (e.n >= l.max) return false;
    entradas.push([k, e]);
  }
  for (const [k, e] of entradas) await a.set(k, { n: e.n + 1, expira: e.expira });
  return true;
}
