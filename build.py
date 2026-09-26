#!/usr/bin/env python3
"""Genera el sitio estático del curso a partir de los archivos Markdown en contenido/.

Uso:
    pip install markdown
    python3 build.py

El resultado queda en docs/ (listo para GitHub Pages: Settings → Pages → branch, carpeta /docs).
"""
import html
import json
import re
import shutil
from pathlib import Path

import markdown

RAIZ = Path(__file__).parent
CONTENIDO = RAIZ / "contenido"
PLANTILLA = RAIZ / "plantilla"
SALIDA = RAIZ / "docs"

SECCIONES = [
    (1, 11, "Primeros pasos"),
    (12, 21, "CLAUDE.md y configuración del proyecto"),
    (22, 29, "Planificar y elegir modelo"),
    (30, 35, "Git y flujo de trabajo"),
    (36, 42, "MCP y herramientas externas"),
    (43, 53, "Skills, comandos y hooks"),
    (54, 60, "Subagentes"),
    (61, 64, "Plugins"),
    (65, 67, "Automatización y escala"),
]


def seccion_de(num):
    for i, (desde, hasta, nombre) in enumerate(SECCIONES, 1):
        if desde <= num <= hasta:
            return i, nombre
    raise ValueError(num)


def leer_leccion(ruta):
    texto = ruta.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n", texto, re.S)
    if not m:
        raise ValueError(f"{ruta} no tiene front matter")
    meta = {}
    for linea in m.group(1).splitlines():
        clave, _, valor = linea.partition(":")
        valor = valor.strip()
        if len(valor) >= 2 and valor[0] == valor[-1] and valor[0] in "\"'":
            valor = valor[1:-1]
        meta[clave.strip()] = valor
    num = int(ruta.name.split("-", 1)[0])
    return {
        "num": num,
        "slug": ruta.stem,
        "titulo": meta["titulo"],
        "resumen": meta.get("resumen", ""),
        "cuerpo": texto[m.end():],
    }


def texto_plano(html_str):
    sin_tags = re.sub(r"<[^>]+>", " ", html_str)
    return re.sub(r"\s+", " ", html.unescape(sin_tags)).strip()


def main():
    lecciones = sorted((leer_leccion(p) for p in CONTENIDO.glob("*.md")), key=lambda l: l["num"])
    base = (PLANTILLA / "leccion.html").read_text(encoding="utf-8")
    portada = (PLANTILLA / "index.html").read_text(encoding="utf-8")

    if SALIDA.exists():
        shutil.rmtree(SALIDA)
    (SALIDA / "lecciones").mkdir(parents=True)
    shutil.copytree(PLANTILLA / "assets", SALIDA / "assets")
    (SALIDA / ".nojekyll").write_text("")

    # Navegación lateral compartida
    nav = []
    for i, (desde, hasta, nombre) in enumerate(SECCIONES, 1):
        items = [l for l in lecciones if desde <= l["num"] <= hasta]
        if not items:
            continue
        nav.append(f'<div class="nav-seccion"><p class="nav-titulo">{i}. {html.escape(nombre)}</p><ol>')
        for l in items:
            nav.append(
                f'<li data-slug="{l["slug"]}"><a href="{{PREFIJO}}lecciones/{l["slug"]}.html">'
                f'<span class="nav-num">{l["num"]}</span>{html.escape(l["titulo"])}</a></li>'
            )
        nav.append("</ol></div>")
    nav_html = "\n".join(nav)

    indice_busqueda = []
    for idx, l in enumerate(lecciones):
        md = markdown.Markdown(
            extensions=["fenced_code", "tables", "toc", "admonition", "attr_list", "sane_lists"],
            extension_configs={"toc": {"permalink": "#", "toc_depth": "2-3"}},
        )
        cuerpo = md.convert(l["cuerpo"])
        anterior = lecciones[idx - 1] if idx > 0 else None
        siguiente = lecciones[idx + 1] if idx + 1 < len(lecciones) else None
        n_sec, nombre_sec = seccion_de(l["num"])

        def enlace(lec, clase, etiqueta):
            if not lec:
                return "<span></span>"
            return (f'<a class="{clase}" href="{lec["slug"]}.html"><small>{etiqueta}</small>'
                    f'{lec["num"]}. {html.escape(lec["titulo"])}</a>')

        pagina = (base
                  .replace("{{TITULO}}", html.escape(l["titulo"]))
                  .replace("{{NUM}}", str(l["num"]))
                  .replace("{{SLUG}}", l["slug"])
                  .replace("{{SECCION}}", f"Sección {n_sec} · {html.escape(nombre_sec)}")
                  .replace("{{RESUMEN}}", html.escape(l["resumen"]))
                  .replace("{{TOC}}", md.toc)
                  .replace("{{CUERPO}}", cuerpo)
                  .replace("{{NAV}}", nav_html.replace("{PREFIJO}", "../"))
                  .replace("{{ANTERIOR}}", enlace(anterior, "prev", "← Anterior"))
                  .replace("{{SIGUIENTE}}", enlace(siguiente, "next", "Siguiente →"))
                  .replace("{{PREFIJO}}", "../"))
        (SALIDA / "lecciones" / f"{l['slug']}.html").write_text(pagina, encoding="utf-8")
        indice_busqueda.append({
            "n": l["num"], "s": l["slug"], "t": l["titulo"], "r": l["resumen"],
            "c": texto_plano(cuerpo)[:6000],
        })

    # Portada con tarjetas por sección
    tarjetas = []
    for i, (desde, hasta, nombre) in enumerate(SECCIONES, 1):
        items = [l for l in lecciones if desde <= l["num"] <= hasta]
        if not items:
            continue
        tarjetas.append(f'<section class="bloque"><h2><span>Sección {i}</span>{html.escape(nombre)}</h2><div class="tarjetas">')
        for l in items:
            tarjetas.append(
                f'<a class="tarjeta" data-slug="{l["slug"]}" href="lecciones/{l["slug"]}.html">'
                f'<span class="num">{l["num"]}</span><strong>{html.escape(l["titulo"])}</strong>'
                f'<p>{html.escape(l["resumen"])}</p></a>'
            )
        tarjetas.append("</div></section>")
    (SALIDA / "index.html").write_text(
        portada.replace("{{TARJETAS}}", "\n".join(tarjetas))
               .replace("{{TOTAL}}", str(len(lecciones)))
               .replace("{{NAV}}", nav_html.replace("{PREFIJO}", "")),
        encoding="utf-8",
    )
    (SALIDA / "assets" / "busqueda.js").write_text(
        "window.INDICE_BUSQUEDA = " + json.dumps(indice_busqueda, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(f"Generadas {len(lecciones)} lecciones en {SALIDA}/")


if __name__ == "__main__":
    main()
