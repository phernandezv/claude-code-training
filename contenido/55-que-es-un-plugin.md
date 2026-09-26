---
titulo: "Qué es un plugin: un paquete de comandos, skills, subagentes, hooks y MCP"
resumen: El plugin como unidad de empaquetado y distribución - qué componentes puede contener, estructura de carpetas, manifiesto plugin.json, espacios de nombres, marketplaces, qué añade un plugin activo a cada sesión y cuándo compensa crear uno.
---

## Objetivos de la lección

- Entender qué es un **plugin** y qué problema resuelve.
- Conocer los componentes que puede incluir y su estructura.
- Saber qué es un **marketplace**.
- Evaluar el impacto de un plugin activo (contexto, procesos, permisos).

## El problema: configuración dispersa

A estas alturas del curso puedes tener:

- Skills en `.claude/skills/` y `~/.claude/skills/`.
- Comandos en `.claude/commands/`.
- Subagentes en `.claude/agents/`.
- Hooks y sus scripts en `settings.json` y `.claude/hooks/`.
- Servidores MCP en `.mcp.json`.

Compartir todo eso con otro repositorio o con otro equipo significa copiar archivos a mano, mantener varias copias sincronizadas y no tener versiones. Un **plugin** lo resuelve.

## ¿Qué es un plugin?

Un plugin es **un directorio con componentes de Claude Code y un manifiesto**, que se instala, activa, actualiza y desactiva **como una unidad**.

| Componente | Carpeta en el plugin | Qué aporta |
|---|---|---|
| **Skills** | `skills/<nombre>/SKILL.md` | Conocimiento y procedimientos, invocables como `/plugin:skill` |
| **Comandos** | `commands/*.md` | Formato clásico de comandos (para plugins nuevos, mejor `skills/`) |
| **Subagentes** | `agents/*.md` | Asistentes especializados |
| **Hooks** | `hooks/hooks.json` | Automatizaciones en eventos del ciclo de vida |
| **Servidores MCP** | `.mcp.json` | Conexiones a servicios externos |
| **Servidores LSP** | configuración de LSP | Inteligencia de código (ir a la definición, diagnósticos) |
| **Estilos de salida** | `output-styles/` | Estilos de respuesta |
| Otros | ejecutables, ajustes por defecto, temas, monitores… | Extensiones más avanzadas |

## Estructura típica

```text
acme-dev-tools/
├── .claude-plugin/
│   └── plugin.json          ← manifiesto (solo esto va aquí dentro)
├── skills/
│   ├── release/
│   │   └── SKILL.md
│   └── nuevo-endpoint/
│       └── SKILL.md
├── agents/
│   ├── revisor-seguridad.md
│   └── ejecutor-tests.md
├── hooks/
│   └── hooks.json
├── scripts/
│   └── proteger.sh
├── .mcp.json
└── README.md
```

!!! warning "Solo el manifiesto dentro de .claude-plugin/"
    Los componentes van en la **raíz del plugin**, no dentro de `.claude-plugin/`. Lo que pongas ahí dentro (aparte de `plugin.json`) no se carga.

## El manifiesto: `plugin.json`

```json
{
  "name": "acme-dev-tools",
  "description": "Skills, agentes y hooks estándar del equipo de desarrollo de Acme",
  "version": "1.2.0",
  "author": { "name": "Equipo de Plataforma", "email": "plataforma@acme.dev" }
}
```

- `name` (obligatorio, sin espacios): identifica el plugin y es el **prefijo** de sus skills y agentes.
- `description`: lo que ven los usuarios en `/plugin`.
- `version`: si la fijas, los usuarios se quedan en esa versión hasta que la cambies.
- `author`: a quién atribuirlo.

## Espacios de nombres

Las skills y agentes de un plugin llevan el nombre del plugin como prefijo, para que dos plugins puedan tener una skill `release` sin chocar:

```text
/acme-dev-tools:release
/otro-plugin:release
@agent-acme-dev-tools:revisor-seguridad
```

## Marketplaces

Un **marketplace** es un **catálogo** (un repositorio o directorio con `.claude-plugin/marketplace.json`) que lista plugins y de dónde descargarlos. No es una tienda alojada: es un archivo en un repo.

- Claude Code añade el **marketplace oficial de Anthropic** automáticamente.
- Puedes añadir otros: el de tu empresa, el de la comunidad, uno local para pruebas.
- Una vez añadido, instalas sus plugins con `/plugin`.

Lo verás en las lecciones 56 y 58.

## Qué añade un plugin activo

Un plugin activado forma parte de **todas** tus sesiones (en su alcance), no solo cuando lo usas:

| Aspecto | Impacto |
|---|---|
| **Contexto** | Nombre y descripción de cada skill/agente que Claude puede invocar solo, en cada turno |
| **Procesos** | Sus servidores MCP arrancan con cada sesión; sus hooks se disparan en sus eventos |
| **Permisos** | Lo que ejecuta, lo ejecuta **como tú** |

Por eso conviene revisar un plugin antes de instalarlo (en `/plugin` se muestra qué instalará y, en el marketplace oficial, una estimación del **coste de contexto**), y desactivar los que no uses.

## ¿Cuándo crear un plugin?

| Situación | ¿Plugin? |
|---|---|
| Una skill solo para ti en un proyecto | No: `.claude/skills/` |
| Configuración de un único repo del equipo | No hace falta: versiona `.claude/` en el repo |
| Las mismas skills/agentes/hooks en **varios repos** | **Sí** |
| Estándares que quieres **distribuir y versionar** para varios equipos | **Sí**, con un marketplace |
| Algo útil para la comunidad | **Sí**, y publícalo |

## Resumen

- Plugin = directorio con componentes (skills, comandos, agentes, hooks, MCP, LSP, estilos…) + `plugin.json`.
- Se instala y gestiona como una unidad; sus componentes llevan el prefijo del plugin.
- Los marketplaces son catálogos en repositorios.
- Un plugin activo tiene coste de contexto y ejecuta con tus permisos: revisa antes de instalar.

## Ejercicios

1. Ejecuta `/plugin` y explora la pestaña **Discover** del marketplace oficial.
2. Elige un plugin y revisa qué instalaría y su coste de contexto (sin instalarlo aún).
3. Haz inventario de tu configuración de `.claude/` y decide qué partes tendría sentido empaquetar en un plugin.

## Referencias

- [Visión general de plugins](https://code.claude.com/docs/en/plugins/overview)
- [Componentes de un plugin](https://code.claude.com/docs/en/plugins/components)
- [Referencia del manifiesto](https://code.claude.com/docs/en/plugins/manifest-reference)
