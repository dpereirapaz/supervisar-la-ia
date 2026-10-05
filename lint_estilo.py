#!/usr/bin/env python3
"""
Revisor de estilo «texto natural» para castellano.
Uso:
  python3 lint_estilo.py ARCHIVO [ARCHIVO ...]            informe resumido + hallazgos
  python3 lint_estilo.py --json ARCHIVO.json               extrae todas las cadenas de un JSON
  python3 lint_estilo.py --csv salida.csv ARCHIVO          hallazgos en CSV
Acepta .txt, .md y .json. No modifica nada.
Los patrones son indicios, no pruebas: cada hallazgo se decide a mano (ver GUIA_ESTILO).
"""
import re, sys, json, statistics, csv, argparse

# (id, gravedad 1-3, patrón, qué hacer)
REGLAS = [
 # --- Muletillas y fórmulas de relleno
 ("R01",3,r"\bes (importante|fundamental|crucial|esencial|vital|clave|necesario|relevante) (destacar|señalar|mencionar|recordar|subrayar|resaltar|tener en cuenta|reconocer)\b","Fórmula de relleno. Di la cosa directamente."),
 ("R01",3,r"\bcabe (destacar|señalar|mencionar|resaltar|subrayar)\b","Fórmula de relleno. Di la cosa directamente."),
 ("R02",3,r"\b(juega|juegan|desempeña|desempeñan) un papel\b","Cliché. Usa un verbo concreto: «decide», «frena», «sostiene»."),
 ("R03",3,r"\ben (el )?(panorama|paisaje|escenario|contexto) (actual|empresarial|digital|tecnológico)\b|\ben un mundo (cada vez más|en el que|donde|que)\b|\bhoy en día\b|\ben la era (de|del)\b|\ben un entorno (cada vez más|cambiante|en constante)","Apertura de tópico. Empieza por el hecho."),
 ("R04",3,r"\ben (definitiva|conclusión|resumen)\b|\bdicho esto\b|\ben última instancia\b|\bal fin y al cabo\b|\bpor último,? pero no menos importante\b","Cierre o transición de manual."),
 ("R05",2,r"\blo cierto es que\b|\by es que\b|\bla clave (está|reside|radica) en\b|\bel verdadero (reto|desafío|problema)\b|\bno es casualidad\b|\bsin (lugar a )?dudas?\b|\binnegable\b|\bindudable\b","Énfasis retórico. Si es cierto, basta con decirlo."),
 # --- Léxico de moda
 ("L01",2,r"\b(potenciar|potencia[rn]?|impulsar|impulsa[rn]?|habilitar|empoderar|desbloquear|catalizar|apalancar|fomentar|propiciar)\b","Verbo de moda. Sustituye por el verbo concreto (hacer posible, aumentar, permitir, pedir…)."),
 ("L02",2,r"\b(robust[oa]s?|holístic[oa]s?|sinergias?|ecosistemas?|paradigmas?|transformador[a]?s?|disruptiv[oa]s?|innovador[a]?s?|de vanguardia|revolucionari[oa]s?|revolucionar|punto de inflexión|un antes y un después|piedra angular|pilar(es)?|hoja de ruta|palanca(s)?|tejido|mosaico|se erige|se alza)\b","Palabra de folleto. Usa la cosa concreta o quítala."),
 ("L03",2,r"\b(arroja[rn]? luz|pone[n]? de manifiesto|subraya[n]?|resalta[n]?|refleja[n]?|evidencia[n]?|ponen? en valor|aporta[n]? valor)\b","Verbo de análisis hueco. Di qué se ve y qué se concluye."),
 ("L04",1,r"\b(crucial|esenciales?|fundamentales?|clave|vital(es)?|imprescindibles?|innegables?)\b","Adjetivo de énfasis. Máximo uno por página; mejor, razona por qué importa."),
 ("L05",1,r"\bcada vez más\b|\ben constante (evolución|cambio)\b|\bun amplio abanico\b|\bun abanico de\b|\buna amplia (gama|variedad)\b|\bmultitud de\b|\bnumerosos?\b","Cuantificador vago. Da la cifra o el ejemplo."),
 ("L06",1,r"\b(garantiza[rn]?|asegura[rn]? que|facilita[rn]?|optimiza[rn]?|maximiza[rn]?|aprovecha[rn]? al máximo|navega[rn]? por)\b","Verbo comodín. Comprueba que garantiza de verdad."),
 # --- Estructuras
 ("E01",3,r"\bno (solo|sólo|únicamente|solamente) [^.;:]{1,80}\bsino (que )?(también|además)?","«No solo… sino también». Reescribe en afirmativo."),
 ("E02",3,r"\bno se trata de [^.;:]{1,80}[,;:]? (sino que )?se trata de\b|\bno (es|son|era|fue) [^.:;]{1,70}: (es|son|era|fue)\b|\bno (es|son) [^.]{1,60}\. (Es|Son|Se trata)\b|\bno [^.]{1,50}, sino [^.]{1,50}\b","Antítesis «no es X, es Y». Úsala una vez por capítulo como mucho."),
 ("E03",2,r"\bmás que (un|una|unos|unas|el|la|los|las) [^.,]{1,40}, (es|son)\b","Antítesis «más que X, Y»."),
 ("E04",2,r", (permitiendo|garantizando|asegurando|facilitando|generando|promoviendo|fomentando|impulsando|reflejando|destacando|subrayando|contribuyendo|logrando|mejorando|reduciendo|aumentando|creando|convirtiéndose|dando lugar)\b","Gerundio de posterioridad. Parte la frase o usa «y» + verbo conjugado."),
 ("E05",2,r"\blo que (permite|garantiza|facilita|supone|implica|convierte|hace posible)\b","«Lo que permite…»: cola explicativa típica. Parte la frase."),
 ("E06",2,r"\b(a través de|mediante|por medio de)\b","Preposición de relleno. «Con», «por» o el verbo directo."),
 ("E07",1,r"\b(así como|tanto [^.,]{1,30} como)\b","Enumeración de manual."),
 ("E08",2,r"\b(ya sea|desde [^.,]{3,40} hasta)\b[^.]{0,80}","Rango falso «desde X hasta Y». ¿Es un rango real?"),
 ("E09",2,r"\bimagin[ae]n? (que|un|una)\b|\bpiens[ae]n? en\b|\bveamos\b|\bvamos a ver\b|\bla buena noticia es\b|\bla mala noticia es\b|\bspoiler\b","Gancho de conferencia."),
 # --- Calcos del inglés
 ("C01",3,r"\ben base a\b|\ba nivel de\b|\bde cara a\b|\ben aras de\b|\btomar lugar\b|\bser capaz de\b|\bsiendo que\b|\ben orden de\b","Calco o muletilla. Ver tabla de la guía."),
 ("C02",2,r"\b(impactar|impactan|impactado|impactando)\b|\b(proveer|provee[n]?)\b|\bevidenciar\b|\bsoportar\b|\bremover\b|\bperformance\b|\bactualmente\b|\beventualmente\b|\bdesplegar\b","Calco léxico (impact, provide, support, remove, currently, eventually, deploy)."),
 ("C03",2,r"\b(el|la|los|las) mism[oa]s?\b|\bdicho[as]? [a-záéíóú]+\b|\bel hecho de que\b","Pronombre o determinante de jerga administrativa."),
 ("C04",1,r"\b(stakeholders?|insights?|roadmap|feedback|workflow|mindset|pipeline|framework|target|skills?|gap)\b","Anglicismo evitable. Si es término técnico establecido, déjalo; si no, traduce."),
 ("C05",1,r"\brealiza[rnd]*\b|\brealizaci[oó]n\b|\bllevar a cabo\b|\bse lleva a cabo\b|\bel desarrollo de\b|\bla implementación de\b|\bla puesta en marcha de\b","Nominalización o verbo vacío. «Hacer», «poner en marcha» o el verbo concreto."),
 # --- Tipografía
 ("T01",1,r" - |\s—\s|—","Raya: úsala en incisos, con moderación. Mira la densidad."),
 ("T02",1,r"\"[^\"]{1,80}\"","Comillas rectas. Usa « »."),
]

SALUDOS_CIERRE = re.compile(r"^(En (resumen|conclusión|definitiva)|Para (concluir|terminar)|Por (último|tanto))\b", re.I)

def cadenas_json(obj, ruta=""):
    if isinstance(obj, str):
        yield ruta, obj
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            yield from cadenas_json(v, f"{ruta}[{i}]")
    elif isinstance(obj, dict):
        for k, v in obj.items():
            if k in ("nota",):  # metadatos
                continue
            yield from cadenas_json(v, f"{ruta}.{k}" if ruta else k)

def cargar(ruta):
    """Devuelve lista de (etiqueta, texto)."""
    if ruta.endswith(".json"):
        d = json.load(open(ruta, encoding="utf-8"))
        return [(r, t) for r, t in cadenas_json(d) if len(t.split()) >= 3]
    txt = open(ruta, encoding="utf-8").read()
    bloques = [b.strip() for b in re.split(r"\n\s*\n", txt) if b.strip()]
    return [(f"p{i+1}", b) for i, b in enumerate(bloques)]

def frases(t):
    t = re.sub(r"\s+", " ", t)
    return [f for f in re.split(r"(?<=[.!?…])\s+(?=[A-ZÁÉÍÓÚÑ¿¡«])", t) if f.strip()]

def palabras(t):
    return re.findall(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+", t)

def analizar(ruta):
    unidades = cargar(ruta)
    hallazgos = []
    todas = []          # todas las frases
    n_pal = 0
    n_raya = n_dp = n_preg = 0
    finales_cortos = 0
    parrafos_largos = 0
    inicios_rep = 0
    triples = 0
    for etq, t in unidades:
        if re.match(r"^[+|\-=\s]{5,}$", t):  # tablas ASCII
            continue
        n_pal += len(palabras(t))
        n_raya += len(re.findall(r"—", t)) + len(re.findall(r" - ", t))
        n_dp += t.count(":")
        n_preg += t.count("¿")
        fs = frases(t)
        todas.extend(fs)
        if len(fs) >= 3:
            parrafos_largos += 1
            if len(palabras(fs[-1])) <= 9:
                finales_cortos += 1
        for a, b, c in zip(fs, fs[1:], fs[2:]):
            if palabras(a)[:1] and palabras(a)[:1] == palabras(b)[:1] == palabras(c)[:1]:
                inicios_rep += 1
        triples += len(re.findall(r"\b[a-záéíóúñ]{4,}, [a-záéíóúñ]{4,} y [a-záéíóúñ]{4,}\b", t, re.I))
        for rid, g, pat, msg in REGLAS:
            for m in re.finditer(pat, t, re.I):
                if rid == "T01" and "—" in m.group(0) and False:
                    continue
                ini = max(0, m.start() - 50); fin = min(len(t), m.end() + 50)
                hallazgos.append((etq, rid, g, m.group(0), t[ini:fin].replace("\n", " "), msg))
    longs = [len(palabras(f)) for f in todas if palabras(f)]
    media = statistics.mean(longs) if longs else 0
    desv = statistics.pstdev(longs) if longs else 0
    cortas = sum(1 for l in longs if l <= 6)
    resumen = {
        "archivo": ruta, "palabras": n_pal, "frases": len(longs),
        "long_media": round(media, 1), "desv": round(desv, 1),
        "variacion": round(desv / media, 2) if media else 0,
        "pct_frases_cortas": round(100 * cortas / len(longs), 1) if longs else 0,
        "rayas_x1000": round(1000 * n_raya / max(n_pal, 1), 1),
        "dospuntos_x1000": round(1000 * n_dp / max(n_pal, 1), 1),
        "preguntas": n_preg,
        "parrafos_cierre_corto": f"{finales_cortos}/{parrafos_largos}",
        "inicios_repetidos_3": inicios_rep,
        "triadas": triples,
    }
    return resumen, hallazgos

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("archivos", nargs="+")
    ap.add_argument("--csv")
    ap.add_argument("--max", type=int, default=400, help="máximo de hallazgos a mostrar por archivo")
    ap.add_argument("--solo-resumen", action="store_true")
    a = ap.parse_args()
    filas = []
    for ruta in a.archivos:
        res, hall = analizar(ruta)
        print("=" * 78)
        for k, v in res.items():
            print(f"  {k:24s} {v}")
        por_regla = {}
        for h in hall:
            por_regla.setdefault((h[1], h[2]), 0)
            por_regla[(h[1], h[2])] += 1
        print("  -- hallazgos por regla (id, gravedad: n) --")
        print("  " + ", ".join(f"{k[0]}/{k[1]}: {v}" for k, v in sorted(por_regla.items())))
        print(f"  TOTAL hallazgos: {len(hall)}  |  por 1000 palabras: {round(1000*len(hall)/max(res['palabras'],1),1)}")
        if not a.solo_resumen:
            for h in sorted(hall, key=lambda x: (-x[2], x[0]))[: a.max]:
                print(f"  [{h[1]}/{h[2]}] {h[0]}: «{h[3]}»  …{h[4]}…")
        filas += [(ruta,) + h for h in hall]
    if a.csv:
        with open(a.csv, "w", newline="", encoding="utf-8") as f:
            w = csv.writer(f); w.writerow(["archivo", "unidad", "regla", "gravedad", "coincidencia", "contexto", "consejo"]); w.writerows(filas)

if __name__ == "__main__":
    main()
