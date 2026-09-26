---
titulo: Construir tu propio plugin con las piezas que ya has hecho
resumen: Convertir tu configuración de .claude/ (skills, comandos, agentes, hooks, MCP) en un plugin - estructura, manifiesto, rutas con ${CLAUDE_PLUGIN_ROOT}, hooks.json y .mcp.json del plugin, probar con --plugin-dir, validar con claude plugin validate, depurar y versionar.
---

## Objetivos de la lección

- Empaquetar las piezas creadas en el curso en un plugin.
- Adaptar rutas y configuraciones para que funcionen dentro del plugin.
- Probar el plugin sin instalarlo (`--plugin-dir`) y validarlo.
- Preparar el plugin para versionarlo y compartirlo.

## Punto de partida

Supongamos que tu proyecto tiene esto (de lecciones anteriores):

```text
.claude/
├── skills/
│   ├── informe-dependencias/SKILL.md
│   └── nuevo-endpoint/SKILL.md
├── commands/
│   └── revisar.md
├── agents/
│   ├── revisor-seguridad.md
│   └── ejecutor-tests.md
├── hooks/
│   ├── formatear.sh
│   └── proteger.sh
└── settings.json      ← contiene la sección "hooks"
.mcp.json              ← servidor de Sentry
```

Objetivo: un plugin `acme-dev-tools` reutilizable en cualquier repo.

## Paso 1: estructura y manifiesto

```bash
mkdir -p acme-dev-tools/.claude-plugin
```

`acme-dev-tools/.claude-plugin/plugin.json`:

```json
{
  "name": "acme-dev-tools",
  "description": "Herramientas estándar de desarrollo de Acme: revisión, endpoints, dependencias, formato y protección de archivos",
  "version": "0.1.0",
  "author": { "name": "Equipo de Plataforma" },
  "repository": "https://github.com/acme/claude-plugins",
  "license": "MIT",
  "keywords": ["revision", "seguridad", "formato"]
}
```

También puedes generar un esqueleto con:

```bash
claude plugin init acme-dev-tools
```

(lo crea bajo `~/.claude/skills/`, donde se carga en todas tus sesiones mientras lo desarrollas).

## Paso 2: copiar los componentes

```bash
cp -r .claude/skills   acme-dev-tools/
cp -r .claude/commands acme-dev-tools/
cp -r .claude/agents   acme-dev-tools/
mkdir -p acme-dev-tools/scripts
cp .claude/hooks/*.sh  acme-dev-tools/scripts/
```

Resultado:

```text
acme-dev-tools/
├── .claude-plugin/plugin.json
├── skills/
├── commands/
├── agents/
├── scripts/
│   ├── formatear.sh
│   └── proteger.sh
├── hooks/
│   └── hooks.json        ← paso 3
└── .mcp.json             ← paso 4
```

## Paso 3: hooks del plugin

Los hooks pasan de `settings.json` a `hooks/hooks.json`, con el mismo formato bajo una clave `hooks`. Cambia las rutas de `$CLAUDE_PROJECT_DIR` a **`${CLAUDE_PLUGIN_ROOT}`**, que apunta a la carpeta donde está instalado el plugin:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}/scripts/formatear.sh\"" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}/scripts/proteger.sh\"" }
        ]
      }
    ]
  }
}
```

```bash
chmod +x acme-dev-tools/scripts/*.sh
```

!!! note "Los hooks de un plugin siempre están activos"
    Se registran al cargar el plugin y se disparan en sus eventos desde entonces, aunque no uses ninguna skill del plugin. Diseña los scripts para salir rápido (`exit 0`) cuando no apliquen.

También existe `${CLAUDE_PLUGIN_DATA}`: un directorio persistente del plugin que sobrevive a las actualizaciones (útil para cachés o dependencias instaladas).

## Paso 4: servidores MCP del plugin

`acme-dev-tools/.mcp.json`, con el mismo formato que el `.mcp.json` de un proyecto:

```json
{
  "mcpServers": {
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp"
    }
  }
}
```

Nunca incluyas secretos: usa `${VARIABLE}` o autenticación OAuth.

## Paso 5: revisar referencias internas

- En skills que ejecutan scripts propios, usa `${CLAUDE_SKILL_DIR}` (carpeta de la skill) o `${CLAUDE_PLUGIN_ROOT}` (raíz del plugin).
- Menciones entre componentes: los agentes y skills del plugin llevan prefijo (`acme-dev-tools:revisor-seguridad`). Actualiza las referencias en tus prompts si nombran otros componentes.
- Recuerda que los **subagentes de plugins ignoran** `hooks`, `mcpServers` y `permissionMode` en su *frontmatter* por seguridad. Si un agente los necesitaba, muévelos a `hooks/hooks.json` / `.mcp.json` del plugin o documenta la configuración necesaria.

## Paso 6: probar sin instalar

```bash
claude --plugin-dir ./acme-dev-tools
```

Dentro de la sesión comprueba:

```text
/                          ← aparecen /acme-dev-tools:informe-dependencias, etc.
/hooks                     ← los hooks del plugin
/mcp                       ← el servidor sentry
@                          ← los agentes con prefijo
/plugin                    ← pestaña Installed / Errors
```

Prueba cada pieza: ejecuta una skill, pide una edición (formateo), intenta editar `.env` (protección), delega en un agente.

Si modificas archivos del plugin durante la sesión, aplica los cambios con:

```text
/reload-plugins
```

Otras formas de cargar para probar: un `.zip` con `--plugin-dir`, un `.zip` remoto con `--plugin-url`, o la variable `CLAUDE_CODE_PLUGIN_DIRS`.

## Paso 7: validar

```bash
claude plugin validate ./acme-dev-tools
# … ✔ Validation passed
```

Comprueba la sintaxis del manifiesto, del *frontmatter* de skills y agentes, y la estructura.

## Depuración

| Síntoma | Causa probable |
|---|---|
| El plugin no carga | `plugin.json` mal formado; revisa la pestaña **Errors** de `/plugin` |
| No aparecen las skills | Están dentro de `.claude-plugin/` en vez de en la raíz; falta `SKILL.md` |
| Los hooks no se disparan | Ruta sin `${CLAUDE_PLUGIN_ROOT}`, script sin permiso de ejecución, matcher incorrecto |
| "component path isn't found" | Rutas del manifiesto que no existen |
| Funciona pero Claude no lo usa | Descripciones poco claras; mídelo con evaluaciones (`claude plugin eval`) |

`claude --debug-file /tmp/claude.log` ofrece el detalle de carga.

## Paso 8: versionar

- Pon el plugin en un repositorio Git (solo o dentro de un repositorio de marketplace, lección 64).
- Sigue **versionado semántico**: `0.1.0` → `0.2.0` (nuevas skills) → `1.0.0` (estable) → `2.0.0` (cambios incompatibles, p. ej. renombrar una skill).
- Mantén un `CHANGELOG.md` y un `README.md` con qué incluye, requisitos (p. ej. `jq`, `prettier`) y cómo configurarlo.

## Resumen

- Plugin = `.claude-plugin/plugin.json` + componentes en la raíz (`skills/`, `agents/`, `commands/`, `hooks/hooks.json`, `.mcp.json`).
- Cambia `$CLAUDE_PROJECT_DIR` por `${CLAUDE_PLUGIN_ROOT}` en hooks y scripts.
- Prueba con `claude --plugin-dir`, recarga con `/reload-plugins`, valida con `claude plugin validate`.
- Versiona y documenta antes de compartir.

## Ejercicios

1. Empaqueta tus skills, agentes y hooks del curso en un plugin y cárgalo con `--plugin-dir` en **otro** repositorio.
2. Rompe a propósito el manifiesto y observa el error en `/plugin` → Errors y en `claude plugin validate`.
3. Añade un README y un CHANGELOG a tu plugin.

## Referencias

- [Crear un plugin](https://code.claude.com/docs/en/plugins/create)
- [Componentes de plugins](https://code.claude.com/docs/en/plugins/components)
- [Referencia del manifiesto](https://code.claude.com/docs/en/plugins/manifest-reference)
- [Solución de problemas de plugins](https://code.claude.com/docs/en/plugins/troubleshooting)
