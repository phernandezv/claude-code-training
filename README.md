# Curso de Claude Code en español

Material de estudio **original** sobre Claude Code: 59 lecciones en español con explicaciones, comandos, ejemplos de configuración, ejercicios y proyectos de portafolio.

El contenido está escrito a partir de la documentación pública oficial de Claude Code ([code.claude.com/docs](https://code.claude.com/docs)), revisada en septiembre de 2026. Claude Code evoluciona rápido: si un comando o flag no coincide con tu versión, consulta `claude --help` y la documentación oficial.

## Temario

| Sección | Lecciones |
|---|---|
| 1. Primeros pasos | 1–9: instalación, primera sesión, bucle agéntico, modos de permisos, headless, sesiones, comandos y contexto, IDE, segundo plano |
| 2. CLAUDE.md y configuración del proyecto | 10–17: CLAUDE.md, reglas, alcances, cuándo no usarlo, permisos, estilos de salida, proyecto |
| 3. Planificar y elegir modelo | 18–24: modo plan, modelos, opusplan, contexto y coste |
| 4. Git y flujo de trabajo | 25–30: repo, commits, ramas y PRs, revisión, conflictos, proyecto |
| 5. MCP y herramientas externas | 31–37: MCP, servidores, alcances, seguridad, CLIs, CLI vs. MCP |
| 6. Skills, comandos y hooks | 38–48: skills, comandos personalizados, argumentos, hooks, CI y automatización, proyecto |
| 7. Subagentes | 49–54: concepto, integrados, paralelismo, personalizados, permisos, orquestación |
| 8. Plugins | 55–59: plugins, instalación, construir, compartir, proyecto final multiagente |

## Estructura del repositorio

```text
contenido/        Lecciones en Markdown (fuente). Una por archivo: NN-slug.md
plantilla/        Plantillas HTML, CSS y JS del sitio
build.py          Generador del sitio estático
docs/             Sitio generado (listo para GitHub Pages)
```

## Ver el sitio

**En local:** abre `docs/index.html` en el navegador.

**Publicado con GitHub Pages:** en GitHub, *Settings → Pages → Build and deployment → Deploy from a branch*, elige la rama y la carpeta `/docs`.

El sitio incluye buscador, índice lateral, tabla de contenidos por lección, modo claro/oscuro, botón para copiar código y registro de lecciones completadas (guardado en tu navegador).

## Editar y regenerar

```bash
pip install markdown
python3 build.py
```

Cada lección empieza con un bloque de metadatos:

```markdown
---
titulo: Título de la lección
resumen: Una o dos frases que aparecen en la portada y bajo el título.
---
```

Se admite Markdown estándar, tablas, bloques de código y avisos con la sintaxis `!!! tip "Título"` (también `note`, `warning`, `danger`).
