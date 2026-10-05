// Devuelve las cinco fuentes como Uint8Array. Funciona en Node 18+ y en cualquier runtime con atob.
import * as g from "./fuentes.generated.mjs";

const aBytes = (b64) => {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
};
let cache;
export function cargarFuentes() {
  cache ??= { p4: aBytes(g.p4), p6: aBytes(g.p6), l4: aBytes(g.l4), l4i: aBytes(g.l4i), l6: aBytes(g.l6) };
  return cache;
}
