# Curso de Claude Code en español

Material de estudio **original** sobre Claude Code: 67 lecciones en español con explicaciones, comandos, ejemplos de configuración, ejercicios y proyectos de portafolio.

El contenido está escrito a partir de la documentación pública oficial de Claude Code ([code.claude.com/docs](https://code.claude.com/docs)), revisada en septiembre de 2026. Claude Code evoluciona rápido: si un comando o flag no coincide con tu versión, consulta `claude --help` y la documentación oficial.

## Temario

| Sección | Lecciones |
|---|---|
| 1. Primeros pasos | 1–11: instalación, primera sesión, bucle agéntico, modos de permisos, headless, sesiones, comandos y contexto, IDE, segundo plano, personalizar el entorno, web/escritorio/móvil |
| 2. CLAUDE.md y configuración del proyecto | 12–21: CLAUDE.md, reglas, alcances, cuándo no usarlo, permisos, sandbox y contenedores, estilos de salida, diagnóstico de la configuración, proyecto |
| 3. Planificar y elegir modelo | 22–29: modo plan, modelos, opusplan, contexto y coste, buenas prácticas y patrones de fallo |
| 4. Git y flujo de trabajo | 30–35: repo, commits, ramas y PRs, revisión, conflictos, proyecto |
| 5. MCP y herramientas externas | 36–42: MCP, servidores, alcances, seguridad, CLIs, CLI vs. MCP |
| 6. Skills, comandos y hooks | 43–53: skills, comandos personalizados, argumentos, hooks, CI y automatización, proyecto |
| 7. Subagentes | 54–60: concepto, integrados, paralelismo, personalizados, permisos, orquestación, equipos de agentes y workflows |
| 8. Plugins | 61–64: plugins, instalación, construir, compartir |
| 9. Automatización y escala | 65–67: Agent SDK, Claude Code en equipos y empresas, proyecto final multiagente |

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

El progreso se guarda solo en el navegador donde marcas las lecciones. Para llevarlo a otro dispositivo, abre en la portada «Llevar mi progreso a otro dispositivo» y copia el código (por ejemplo `cc1:1-12,15`) o el enlace; en el otro dispositivo, pega el código en «Importar» o abre el enlace. Lo importado se suma a lo que ya tengas.

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
