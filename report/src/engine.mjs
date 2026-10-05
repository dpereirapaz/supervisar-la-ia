// Motor de lectura de la autoevaluación. Función pura: sin red, sin disco, sin fecha.
// Funciona igual en Node y en Cloudflare Workers.

/** Valida las 18 respuestas. Devuelve un array de 18 enteros 0..3 o lanza un Error. */
export function validarRespuestas(r) {
  if (!Array.isArray(r) || r.length !== 18) throw new Error("Se esperan 18 respuestas.");
  return r.map((v, i) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > 3) throw new Error(`Respuesta ${i + 1} fuera de rango.`);
    return n;
  });
}

const RANGO_ESTADO = (puntos) => (puntos <= 2 ? "por_decidir" : puntos <= 6 ? "a_medias" : "decidida");
const ORDEN_ESTADO = { por_decidir: 0, a_medias: 1, decidida: 2 };

export function analizar(respuestas, contenido) {
  const r = validarRespuestas(respuestas);
  const resp = (id) => r[id - 1];

  // 1. Decisiones
  const decisiones = contenido.decisiones.map((d) => {
    const puntos = d.afirmaciones.reduce((s, id) => s + resp(id), 0);
    const estado = RANGO_ESTADO(puntos);
    const ceros = d.afirmaciones.filter((id) => resp(id) === 0);
    const unos = d.afirmaciones.filter((id) => resp(id) === 1);
    const doses = d.afirmaciones.filter((id) => resp(id) === 2);
    return { id: d.id, titulo: d.titulo, puntos, estado, ceros, unos, doses };
  });

  const total = decisiones.reduce((s, d) => s + d.puntos, 0);
  const dir = [1, 2, 4].reduce((s, id) => s + decisiones[id - 1].puntos, 0); // dirección: 1, 2, 4
  const eje = [3, 5, 6].reduce((s, id) => s + decisiones[id - 1].puntos, 0); // ejecución: 3, 5, 6

  // 2. Arquetipo global (el orden importa)
  let arquetipo;
  const hayPorDecidir = decisiones.some((d) => d.estado === "por_decidir");
  if (total >= 40 && !hayPorDecidir) arquetipo = "base_solida";
  else if (total <= 12) arquetipo = "punto_de_partida";
  else if (eje - dir >= 6) arquetipo = "actividad_por_delante";
  else if (dir - eje >= 6) arquetipo = "intencion_por_delante";
  else arquetipo = "avance_desigual";

  // 3. Más avanzadas y más atrasadas (con empates, máximo dos)
  const max = Math.max(...decisiones.map((d) => d.puntos));
  const min = Math.min(...decisiones.map((d) => d.puntos));
  const masAvanzadas = max === min ? [] : decisiones.filter((d) => d.puntos === max).slice(0, 2);
  const masAtrasadas = max === min ? [] : decisiones.filter((d) => d.puntos === min).slice(0, 2);

  // 4. Decisiones que puntúan cero (suma 0) y afirmaciones «ciertas en parte»
  const decisionesCero = decisiones.filter((d) => d.puntos === 0);
  const sinDocumentar = r.filter((v) => v === 1).length;

  // 5. Incoherencias
  const incoherencias = contenido.incoherencias.reglas
    .filter((regla) =>
      regla.cuando.every((c) => (c.min === undefined || resp(c.afirmacion) >= c.min) && (c.max === undefined || resp(c.afirmacion) <= c.max))
    )
    .slice(0, contenido.incoherencias.maximo_mostradas)
    .map((regla) => ({ id: regla.id, texto: regla.texto }));

  // 6. Prioridades para los cien días
  const desempate = contenido.cien_dias.desempate;
  const prioridades = decisiones
    .filter((d) => d.estado !== "decidida")
    .sort(
      (a, b) =>
        ORDEN_ESTADO[a.estado] - ORDEN_ESTADO[b.estado] ||
        a.puntos - b.puntos ||
        desempate.indexOf(a.id) - desempate.indexOf(b.id)
    )
    .slice(0, contenido.cien_dias.max_prioridades)
    .map((d) => d.id);

  // Si todo está decidido, el peso va a «mantener» en las tres decisiones de menor puntuación.
  const paraMantener = prioridades.length
    ? []
    : [...decisiones]
        .sort((a, b) => a.puntos - b.puntos || desempate.indexOf(a.id) - desempate.indexOf(b.id))
        .slice(0, contenido.cien_dias.max_prioridades)
        .map((d) => d.id);

  return {
    respuestas: r,
    total,
    decisiones,
    direccion: dir,
    ejecucion: eje,
    arquetipo,
    masAvanzadas,
    masAtrasadas,
    decisionesCero,
    sinDocumentar,
    incoherencias,
    prioridades,
    paraMantener,
  };
}

/** Une una lista en español: «a», «a y b», «a, b y c». */
export function unirLista(items) {
  if (items.length <= 1) return items.join("");
  return items.slice(0, -1).join(", ") + " y " + items[items.length - 1];
}

/** Sustituye {clave} en una cadena. Las claves ausentes se dejan vacías. */
export function plantilla(texto, valores) {
  return texto.replace(/\{(\w+)\}/g, (_, k) => (valores[k] === undefined || valores[k] === null ? "" : String(valores[k])));
}
