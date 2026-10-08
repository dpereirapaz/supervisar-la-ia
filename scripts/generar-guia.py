#!/usr/bin/env python3
"""Genera la guía en línea (/guia/, /autor/, llms.txt) a partir del whitebook en Word.

SPEC_guia-en-linea.md, G-04 a G-21. El texto se publica literal; este script solo cambia el formato.
Uso: python3 scripts/generar-guia.py Supervision_de_la_IA_v1.1_aceptada.docx
Requiere lxml. El .docx no entra en git (F-07): se pasa como argumento.
"""
import html, json, re, sys, unicodedata, zipfile
from pathlib import Path
from lxml import etree

RAIZ = Path(__file__).resolve().parent.parent
SITIO = "https://supervisarlaia.es"
W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
FECHA_EDICION = "2026-10"          # «Primera edición · Octubre de 2026» (portada del whitebook)
EDICION = "Primera edición, octubre de 2026"
LASTMOD = "2026-10-08"
TITULO_LIBRO = "Supervisión de la IA"
SUBTITULO_LIBRO = "Seis decisiones que un consejo no puede delegar"
AUTOR = "David Pereira Paz"
LINKEDIN = "https://www.linkedin.com/in/dpereirapaz/"

# G-06: fragmentos incompletos o sin función en el documento. No se publican (ver BLOCKERS.md).
OMITIR = {
    "Los cuatro primeros cambios explican por qué funciona. El quinto, por qué nunca se controla del todo y por qué hace falta",
    "Para un consejo, la pregunta deja de ser qué modelo de lenguaje usar y pasa a ser qué tipo de sistema conviene a cada problema de negocio,",
    "Lo difícil y valioso hoy",
}

# ---------------------------------------------------------------- lectura del Word
def leer(docx):
    z = zipfile.ZipFile(docx)
    doc = etree.fromstring(z.read("word/document.xml"))
    num = etree.fromstring(z.read("word/numbering.xml"))
    abstractos = {}
    for a in num.findall(W + "abstractNum"):
        lvl = a.find(f"{W}lvl[@{W}ilvl='0']")
        abstractos[a.get(W + "abstractNumId")] = lvl.find(W + "numFmt").get(W + "val")
    formato = {n.get(W + "numId"): abstractos[n.find(W + "abstractNumId").get(W + "val")] for n in num.findall(W + "num")}
    return doc.find(W + "body"), formato

def texto(e):
    return "".join(t.text or "" for t in e.iter(W + "t"))

def rpr(r, tag):
    p = r.find(W + "rPr")
    return p is not None and p.find(W + tag) is not None and p.find(W + tag).get(W + "val") not in ("0", "false")

def run0(p):
    r = p.find(".//" + W + "r")
    return r.find(W + "rPr") if r is not None and r.find(W + "rPr") is not None else None

def firma(p):
    """Rasgos de formato del primer run: fuente, tamaño, color."""
    rp = run0(p)
    if rp is None: return ("", "", "")
    f, s, c = rp.find(W + "rFonts"), rp.find(W + "sz"), rp.find(W + "color")
    return (f.get(W + "ascii") if f is not None else "", s.get(W + "val") if s is not None else "", c.get(W + "val") if c is not None else "")

def estilo(p):
    s = p.find(f"{W}pPr/{W}pStyle")
    return s.get(W + "val") if s is not None else ""

def borde(p):
    return p.find(f"{W}pPr/{W}pBdr") is not None

def inline(p):
    """HTML en línea: negrita y cursiva de los runs, texto escapado."""
    trozos = []
    for r in p.iter(W + "r"):
        t = "".join(x.text or "" for x in r.findall(W + "t"))
        if not t: continue
        b, i = rpr(r, "b"), rpr(r, "i")
        if trozos and trozos[-1][1:] == (b, i): trozos[-1][0] += t
        else: trozos.append([t, b, i])
    out = ""
    for t, b, i in trozos:
        s = html.escape(t, quote=False)
        lead, core, trail = re.match(r"^(\s*)(.*?)(\s*)$", s, re.S).groups()
        if core and i: core = f"<em>{core}</em>"
        if core and b: core = f"<strong>{core}</strong>"
        out += lead + core + trail
    return re.sub(r"\s+", " ", out).strip()

# Enlaces internos: «capítulo N» y «anexo X» del texto apuntan a su página (solo formato, G-04)
CONTEXTO = {"guia": "", "raiz": "", "capitulos": {}, "anexos": {}}

def enlazar(h):
    g, caps, anx = CONTEXTO["guia"], CONTEXTO["capitulos"], CONTEXTO["anexos"]
    def cap(m):
        n = m.group(0)
        sola = re.fullmatch(r"cap\u00edtulo (\d+)", n)
        if sola and sola.group(1) in caps: return f'<a href="{g}{caps[sola.group(1)]}/">{n}</a>'
        return re.sub(r"\d+", lambda d: f'<a href="{g}{caps[d.group(0)]}/">{d.group(0)}</a>' if d.group(0) in caps else d.group(0), n)
    h = re.sub(r"\bcap\u00edtulos? \d+(?: y \d+)?", cap, h)
    def anexo(m):
        letra = m.group(1)
        if letra == "D": return f'<a href="{CONTEXTO["raiz"]}autoevaluacion/">anexo D</a>'
        return f'<a href="{g}{anx[letra]}/">anexo {letra}</a>' if letra in anx else m.group(0)
    return re.sub(r"\banexo ([A-D])\b", anexo, h)

def sin_envoltorio(h):
    """Quita una cursiva o negrita que envuelve todo el contenido cuando la clase ya da ese estilo."""
    m = re.fullmatch(r"<(em|strong)>(.*)</\1>", h, re.S)
    return m.group(2) if m and "<" + m.group(1) not in m.group(2) else h

def slug(s):
    s = unicodedata.normalize("NFD", s.lower())
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

# ---------------------------------------------------------------- clasificación de bloques
def tipo_parrafo(p):
    t = texto(p).strip()
    if not t: return None
    st, (fuente, sz, color) = estilo(p), firma(p)
    if st in ("Ttulo1", "Titulo"): return "h1"
    if st == "Ttulo2": return "h2"
    if st == "Ttulo3": return "h3"
    if st == "TDC1": return "toc"
    if p.find(f"{W}pPr/{W}numPr") is not None: return "li"
    if fuente == "Poppins" and color == "C8102E" and sz == "22": return "rotulo"       # «Capítulo 1», «Anexo A»
    if fuente == "Poppins" and color == "C8102E" and borde(p): return "etiqueta"       # «Primera decisión»
    if fuente == "Poppins" and sz == "25": return "destacado"
    if borde(p) and color == "4B5563": return "entradilla"
    if color == "6B7280": return "nota"
    if color == "374151": return "pregunta"
    return "p"

def es_division(tbl):
    return re.match(r"(Primera|Segunda|Tercera) parte", texto(tbl)) is not None

def celdas(tbl):
    return [[tc for tc in tr.findall(W + "tc")] for tr in tbl.findall(W + "tr")]

class Lista:
    def __init__(self): self.contador = {}

def bloques_html(elementos, formato, lista, ids):
    """Convierte una secuencia de elementos del cuerpo a HTML."""
    out, abierta = [], None   # abierta = (etiqueta, numId)
    def cerrar():
        nonlocal abierta
        if abierta: out.append(f"</{abierta[0]}>"); abierta = None
    for el in elementos:
        if el.tag == W + "p":
            k = tipo_parrafo(el)
            if k is None: continue
            t = texto(el).strip()
            if t in OMITIR: continue
            if k == "li":
                nid = el.find(f"{W}pPr/{W}numPr/{W}numId").get(W + "val")
                tag = "ol" if formato.get(nid) == "decimal" else "ul"
                if abierta != (tag, nid):
                    cerrar()
                    n = lista.contador.get(nid, 0)
                    inicio = f' start="{n + 1}"' if tag == "ol" and n else ""
                    cls = ' class="list"' if tag == "ul" else ""
                    out.append(f"<{tag}{cls}{inicio}>"); abierta = (tag, nid)
                lista.contador[nid] = lista.contador.get(nid, 0) + 1
                out.append(f"<li>{enlazar(inline(el))}</li>")
                continue
            cerrar()
            c = inline(el)
            if k in ("h2", "h3"):
                i = slug(t); base, n = i, 2
                while i in ids: i, n = f"{base}-{n}", n + 1
                ids.add(i)
                out.append(f'<{k} id="{i}">{c}</{k}>')
            elif k == "etiqueta": out.append(f'<p class="guia-etiqueta">{c}</p>')
            elif k == "destacado": out.append(f'<p class="guia-destacado">{sin_envoltorio(c)}</p>')
            elif k == "nota": out.append(f'<p class="guia-nota">{enlazar(c)}</p>')
            elif k == "pregunta": out.append(f'<p class="guia-pregunta">{sin_envoltorio(c)}</p>')
            elif k == "p": out.append(f"<p>{enlazar(c)}</p>")
            else: raise ValueError(f"bloque inesperado {k}: {t[:60]}")
        elif el.tag == W + "tbl":
            cerrar()
            out.append(tabla_html(el, formato, lista, ids))
    cerrar()
    return "\n".join(out)

def tabla_html(tbl, formato, lista, ids):
    filas = celdas(tbl)
    ncols = len(tbl.find(W + "tblGrid"))
    cabecera = tbl.find(f"{W}tr/{W}trPr/{W}tblHeader") is not None
    if ncols == 1 and len(filas) == 1:          # recuadro
        ps = list(filas[0][0])
        ps = [x for x in ps if x.tag in (W + "p", W + "tbl")]
        primero = next(x for x in ps if x.tag == W + "p" and texto(x).strip())
        fuente = firma(primero)[0]
        if fuente == "Poppins" and run0(primero) is not None and run0(primero).find(W + "b") is not None and len(ps) > 1:
            titulo = f'<p class="guia-recuadro__titulo">{sin_envoltorio(inline(primero))}</p>\n'
            resto = ps[ps.index(primero) + 1:]
        else:
            titulo, resto = "", ps
        cuerpo = bloques_html(resto, formato, lista, ids)
        return f'<div class="guia-recuadro" role="note">\n{titulo}{cuerpo}\n</div>'
    if not cabecera:                            # cifras
        items = []
        for tc in filas[0]:
            ps = [p for p in tc.findall(W + "p") if texto(p).strip()]
            if not ps: continue
            items.append(f'<div class="guia-cifra"><p class="guia-cifra__valor">{sin_envoltorio(inline(ps[0]))}</p>'
                         + "".join(f"<p>{inline(p)}</p>" for p in ps[1:]) + "</div>")
        return '<div class="guia-cifras">\n' + "\n".join(items) + "\n</div>"
    def celda(tc):
        return enlazar(" ".join(sin_envoltorio(inline(p)) for p in tc.findall(W + "p") if texto(p).strip()))
    ancha = " guia-tabla--ancha" if ncols >= 3 else ""
    h = [f'<div class="guia-tabla{ancha}"><table>', "<thead><tr>" + "".join(f'<th scope="col">{celda(tc)}</th>' for tc in filas[0]) + "</tr></thead>", "<tbody>"]
    for fila in filas[1:]:
        h.append("<tr>" + "".join((f'<th scope="row">{celda(tc)}</th>' if j == 0 else f"<td>{celda(tc)}</td>") for j, tc in enumerate(fila)) + "</tr>")
    h.append("</tbody></table></div>")
    return "\n".join(h)

# ---------------------------------------------------------------- troceo en secciones
def secciones(body):
    """Devuelve antes de empezar, partes, y secciones (rótulo, título, entradilla, elementos)."""
    els = [e for e in body if e.tag in (W + "p", W + "tbl")]
    antes, secs, partes = [], [], []
    actual, parte_actual, fase = None, None, "inicio"
    for e in els:
        if e.tag == W + "tbl" and es_division(e):
            ps = [texto(p).strip() for p in e.iter(W + "p") if texto(p).strip()]
            parte_actual = {"nombre": ps[0], "titulo": ps[1], "descripcion": ps[2]}
            partes.append(parte_actual)
            continue
        if e.tag == W + "p":
            k = tipo_parrafo(e)
            if k == "toc": fase = "toc"; continue
            if k == "h1" and texto(e).strip() == "Antes de empezar": fase = "antes"; continue
            if k == "h1" and texto(e).strip() == "Índice": fase = "toc"; continue
            if k == "rotulo":
                actual = {"rotulo": texto(e).strip(), "titulo": None, "entradilla": None, "els": [], "parte": parte_actual}
                secs.append(actual); fase = "seccion"; continue
            if fase == "seccion" and k == "h1" and actual["titulo"] is None:
                actual["titulo"] = texto(e).strip(); continue
            if fase == "seccion" and k == "entradilla" and actual["entradilla"] is None:
                actual["entradilla"] = e; continue
        if fase == "antes": antes.append(e)
        elif fase == "seccion": actual["els"].append(e)
        elif e.tag == W + "tbl" and fase == "inicio": continue   # portada
    return antes, partes, secs

# ---------------------------------------------------------------- plantilla
def cabecera_nav(prefijo, actual):
    def li(href, txt, clave):
        cur = ' aria-current="page"' if clave == actual else ""
        return f'<li><a href="{prefijo}{href}"{cur}>{txt}</a></li>'
    return (f'''  <header class="site-header">
    <div class="container">
      <a class="site-header__brand" href="{prefijo or './'}">Supervisión de la IA</a>
      <nav class="site-nav" aria-label="Principal">
        <ul>
          {li("autoevaluacion/", "Autoevaluación", "autoevaluacion")}
          {li("guia/", "Guía", "guia")}
          {li("whitebook/", "Whitebook", "whitebook")}
        </ul>
      </nav>
    </div>
  </header>''')

def pie(prefijo):
    return f'''  <footer class="site-footer">
    <div class="container">
      <p>© 2026 David Pereira Paz. Las opiniones son del autor y no representan a ninguna organización con la que colabora.</p>
      <nav aria-label="Legal">
        <ul class="site-footer__links">
          <li><a href="{prefijo}privacidad/">Privacidad</a></li>
          <li><a href="{prefijo}cookies/">Cookies</a></li>
          <li><a href="{prefijo}aviso-legal/">Aviso legal</a></li>
          <li><a href="{LINKEDIN}" target="_blank" rel="noopener">LinkedIn</a></li>
        </ul>
      </nav>
    </div>
  </footer>'''

def bloque_autoevaluacion(prefijo):
    # Copy de C-06 de la portada, sin cambios (G-12)
    return f'''    <section class="section section--ink cta" aria-labelledby="empiece">
      <div class="container">
        <h2 id="empiece">Empiece por la autoevaluación</h2>
        <p>Dieciocho afirmaciones, cinco minutos. El resultado le dice qué decisiones puntúan cero.</p>
        <a class="btn btn--primary" href="{prefijo}autoevaluacion/">Hacer la autoevaluación</a>
      </div>
    </section>'''

def pagina(*, ruta, titulo_html, descripcion, og_tipo, jsonld, prefijo, nav, main):
    url = f"{SITIO}/{ruta}"
    ld = "\n".join(f'  <script type="application/ld+json">\n{json.dumps(x, ensure_ascii=False, indent=2)}\n  </script>' for x in jsonld)
    d = html.escape(descripcion)
    t = html.escape(titulo_html)
    return f'''<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{t}</title>
  <meta name="description" content="{d}">
  <meta name="author" content="{AUTOR}">
  <link rel="canonical" href="{url}">
  <meta property="og:title" content="{t}">
  <meta property="og:description" content="{d}">
  <meta property="og:image" content="{SITIO}/assets/img/og-image.png">
  <meta property="og:url" content="{url}">
  <meta property="og:type" content="{og_tipo}">
  <meta property="og:locale" content="es_ES">
  <meta property="og:site_name" content="Supervisión de la IA">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{t}">
  <meta name="twitter:description" content="{d}">
  <meta name="twitter:image" content="{SITIO}/assets/img/og-image.png">
  <link rel="icon" href="{prefijo}assets/img/favicon.svg" type="image/svg+xml">
  <link rel="icon" href="{prefijo}assets/img/favicon.png" type="image/png" sizes="any">
  <link rel="preload" href="{prefijo}assets/fonts/lora-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{prefijo}assets/fonts/poppins-600.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{prefijo}assets/css/site.css">
{ld}
</head>
<body>
  <a class="visually-hidden" href="#contenido">Saltar al contenido</a>

{cabecera_nav(prefijo, nav)}

  <main id="contenido">
{main}
  </main>

{pie(prefijo)}
</body>
</html>
'''

PERSONA = {"@type": "Person", "name": AUTOR, "url": f"{SITIO}/autor/"}
LIBRO = {"@type": "Book", "name": f"{TITULO_LIBRO}. {SUBTITULO_LIBRO}", "url": f"{SITIO}/guia/"}

def titulo_pagina(t):
    largo = f"{t} · Supervisión de la IA"
    return largo if len(largo) <= 70 else t

def texto_plano(e):
    return re.sub(r"\s+", " ", texto(e)).strip()

# ---------------------------------------------------------------- generación
def main(docx):
    body, formato = leer(docx)
    antes, partes, secs = secciones(body)
    lista = Lista()

    resumen = next(s for s in secs if s["rotulo"] == "Resumen")
    autor = next(s for s in secs if s["rotulo"] == "El autor")
    anexo_d = next(s for s in secs if s["rotulo"] == "Anexo D")
    capitulos = [s for s in secs if s not in (resumen, autor, anexo_d)]
    for s in capitulos:
        s["slug"] = "fuentes" if s["rotulo"] == "Referencias" else slug(s["titulo"])
        s["desc"] = texto_plano(s["entradilla"])
    for s in capitulos:
        m = re.fullmatch(r"(Capítulo|Anexo) (\w+)", s["rotulo"])
        if m: CONTEXTO["capitulos" if m.group(1) == "Capítulo" else "anexos"][m.group(2)] = s["slug"]
    generadas = []

    # --- capítulos, anexos A-C y fuentes
    for n, s in enumerate(capitulos):
        CONTEXTO.update(guia="../", raiz="../../")
        ids = set()
        cuerpo = bloques_html(s["els"], formato, lista, ids)
        if "<h2" not in cuerpo:   # sin Título 2 en el capítulo: los Título 3 suben un nivel (orden de encabezados)
            cuerpo = re.sub(r"<(/?)h3([ >])", r"<\1h2\2", cuerpo)
        ruta = f"guia/{s['slug']}/"
        rotulo = s["rotulo"] if s["rotulo"] != "Referencias" else "Referencias"
        ant = capitulos[n - 1] if n else None
        sig = capitulos[n + 1] if n + 1 < len(capitulos) else None
        navcap = ['<nav class="guia-pasos" aria-label="Capítulos">']
        if ant: navcap.append(f'<a class="guia-pasos__ant" href="../{ant["slug"]}/"><span>Anterior</span> {html.escape(ant["titulo"])}</a>')
        if sig: navcap.append(f'<a class="guia-pasos__sig" href="../{sig["slug"]}/"><span>Siguiente</span> {html.escape(sig["titulo"])}</a>')
        navcap.append("</nav>")
        main_html = f'''    <article class="section">
      <div class="container guia">
        <nav class="guia-migas" aria-label="Migas"><a href="../">Guía</a> › {html.escape(rotulo)}</nav>
        <span class="kicker">{html.escape(rotulo)}</span>
        <h1>{html.escape(s["titulo"])}</h1>
        <p class="guia-entradilla">{sin_envoltorio(inline(s["entradilla"]))}</p>
        <p class="guia-firma"><a href="../../autor/">{AUTOR}</a> · {EDICION}</p>
{cuerpo}
        {"".join(navcap)}
      </div>
    </article>
{bloque_autoevaluacion("../../")}'''
        art = {"@context": "https://schema.org", "@type": "Article", "headline": s["titulo"], "description": s["desc"],
               "author": PERSONA, "datePublished": FECHA_EDICION, "inLanguage": "es-ES",
               "isPartOf": LIBRO, "mainEntityOfPage": f"{SITIO}/{ruta}"}
        migas = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Guía", "item": f"{SITIO}/guia/"},
            {"@type": "ListItem", "position": 2, "name": s["titulo"], "item": f"{SITIO}/{ruta}"}]}
        escribir(ruta, pagina(ruta=ruta, titulo_html=titulo_pagina(s['titulo']), descripcion=s["desc"],
                              og_tipo="article", jsonld=[art, migas], prefijo="../../", nav="guia", main=main_html))
        generadas.append((ruta, s["titulo"], s["desc"]))

    # --- portada de la guía
    CONTEXTO.update(guia="", raiz="../")
    ids = set()
    antes_html = bloques_html(antes, formato, lista, ids)
    resumen_html = bloques_html(resumen["els"], formato, lista, ids)
    indice = []
    for parte in partes:
        caps = [s for s in capitulos if s["parte"] is parte and s["rotulo"].startswith("Capítulo")]
        indice.append(f'<h3>{html.escape(parte["nombre"])}. {html.escape(parte["titulo"])}</h3>\n<p class="guia-nota">{html.escape(parte["descripcion"])}</p>\n<ol class="guia-indice">'
                      + "".join(f'<li><a href="{s["slug"]}/"><span>{html.escape(s["rotulo"])}</span> {html.escape(s["titulo"])}</a></li>' for s in caps) + "</ol>")
    anexos = [s for s in capitulos if s["rotulo"].startswith("Anexo")]
    indice.append('<h3>Anexos</h3>\n<ol class="guia-indice">'
                  + "".join(f'<li><a href="{s["slug"]}/"><span>{html.escape(s["rotulo"])}</span> {html.escape(s["titulo"])}</a></li>' for s in anexos)
                  + f'<li><a href="../autoevaluacion/"><span>{html.escape(anexo_d["rotulo"])}</span> {html.escape(anexo_d["titulo"])}</a></li></ol>')
    indice.append('<ol class="guia-indice"><li><a href="fuentes/"><span>Referencias</span> Fuentes</a></li><li><a href="../autor/"><span>El autor</span> Sobre el autor</a></li></ol>')
    desc_guia = f"{SUBTITULO_LIBRO}. Guía breve para consejeros, de {AUTOR}. Texto completo en abierto."
    main_html = f'''    <section class="section">
      <div class="container guia">
        <span class="kicker">Guía breve para consejeros</span>
        <h1>{TITULO_LIBRO}</h1>
        <p class="guia-entradilla">{SUBTITULO_LIBRO}.</p>
        <p class="guia-firma"><a href="../autor/">{AUTOR}</a> · {EDICION}</p>
        <p>Texto completo, capítulo a capítulo. Si prefiere leerlo de una vez, puede <a href="../whitebook/">descargar el PDF</a>.</p>
        <h2 id="antes-de-empezar">Antes de empezar</h2>
{antes_html}
        <h2 id="en-una-pagina">{html.escape(resumen["titulo"])}</h2>
        <p class="guia-entradilla">{sin_envoltorio(inline(resumen["entradilla"]))}</p>
{resumen_html}
        <h2 id="indice">Índice</h2>
{chr(10).join(indice)}
      </div>
    </section>
{bloque_autoevaluacion("../")}'''
    libro = {"@context": "https://schema.org", "@type": "Book", "name": f"{TITULO_LIBRO}. {SUBTITULO_LIBRO}",
             "author": PERSONA, "bookEdition": "Primera edición", "datePublished": FECHA_EDICION, "inLanguage": "es-ES",
             "url": f"{SITIO}/guia/", "description": texto_plano(resumen["entradilla"]),
             "hasPart": [{"@type": "Chapter", "position": i + 1, "name": s["titulo"], "url": f"{SITIO}/guia/{s['slug']}/"} for i, s in enumerate(capitulos)]}
    escribir("guia/", pagina(ruta="guia/", titulo_html=f"{TITULO_LIBRO}. {SUBTITULO_LIBRO}", descripcion=desc_guia,
                             og_tipo="book", jsonld=[libro], prefijo="../", nav="guia", main=main_html))
    generadas.insert(0, ("guia/", f"{TITULO_LIBRO}. {SUBTITULO_LIBRO}", desc_guia))

    # --- autor
    ps = [e for e in autor["els"] if e.tag == W + "p" and texto(e).strip()]
    bio = [p for p in ps if texto(p).strip() != AUTOR and "supervisarlaia.es" not in texto(p)]  # sin el nombre suelto ni el colofón
    bio_html = "\n".join(f"<p>{inline(p)}</p>" for p in bio)
    desc_autor = texto_plano(bio[0])
    main_html = f'''    <section class="section">
      <div class="container guia">
        <span class="kicker">El autor</span>
        <h1>{AUTOR}</h1>
{bio_html}
        <p><a href="{LINKEDIN}" target="_blank" rel="noopener">LinkedIn</a></p>
      </div>
    </section>
{bloque_autoevaluacion("../")}'''
    persona = {"@context": "https://schema.org", "@type": "Person", "name": AUTOR, "url": f"{SITIO}/autor/",
               "jobTitle": "Director global de Datos e Inteligencia Artificial",
               "worksFor": {"@type": "Organization", "name": "SEIDOR"},
               "alumniOf": {"@type": "CollegeOrUniversity", "name": "Universidad de Vigo"},
               "memberOf": {"@type": "Organization", "name": "Observatorio de Ética en Inteligencia Artificial de Cataluña (OEIAC)"},
               "knowsAbout": ["Gobierno de la inteligencia artificial", "Supervisión de la inteligencia artificial en consejos de administración",
                              "Reglamento europeo de inteligencia artificial", "Inteligencia artificial generativa"],
               "sameAs": [LINKEDIN]}
    escribir("autor/", pagina(ruta="autor/", titulo_html=f"{AUTOR} · Supervisión de la IA", descripcion=desc_autor,
                              og_tipo="profile", jsonld=[persona], prefijo="../", nav=None, main=main_html))
    generadas.append(("autor/", "Sobre el autor", desc_autor))

    # --- llms.txt (G-21)
    lin = [f"# {TITULO_LIBRO}", "", f"> {SUBTITULO_LIBRO}. Guía breve para consejeros de administración sobre la supervisión de la inteligencia artificial, de {AUTOR}. Texto completo en español, en abierto.", "",
           "## Guía", ""]
    for ruta, tit, desc in generadas:
        if ruta.startswith("guia/"): lin.append(f"- [{tit}]({SITIO}/{ruta}): {desc}")
    lin += ["", "## Herramientas", "", f"- [Autoevaluación del consejo]({SITIO}/autoevaluacion/): dieciocho afirmaciones, tres por decisión, puntuadas de 0 a 3.",
            "", "## Autor", "", f"- [Sobre el autor]({SITIO}/autor/): {desc_autor}", ""]
    (RAIZ / "llms.txt").write_text("\n".join(lin), encoding="utf-8")

    # --- lista para el sitemap
    (RAIZ / "scripts" / "guia-urls.json").write_text(json.dumps([r for r, _, _ in generadas], ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(generadas)} páginas, llms.txt y scripts/guia-urls.json")

def escribir(ruta, contenido):
    destino = RAIZ / ruta / "index.html"
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(contenido, encoding="utf-8")

if __name__ == "__main__":
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
