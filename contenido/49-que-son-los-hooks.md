---
titulo: "Qué son los hooks: acciones que se ejecutan solas en momentos clave"
resumen: Qué es un hook y por qué es determinista, el ciclo de vida y sus eventos (SessionStart, UserPromptSubmit, PreToolUse, PostToolUse, Stop, Notification…), la estructura evento → matcher → handler, los tipos de handler, entrada JSON, códigos de salida y /hooks.
---

## Objetivos de la lección

- Entender qué es un **hook** y en qué se diferencia de una instrucción en `CLAUDE.md` o una skill.
- Conocer los **eventos** del ciclo de vida más útiles.
- Leer y escribir la configuración de un hook (evento → matcher → handler).
- Entender cómo se comunica un hook con Claude Code: **stdin JSON**, **códigos de salida** y **JSON de salida**.

## La idea

Un hook es un **comando (u otra acción) que Claude Code ejecuta automáticamente** cuando ocurre algo concreto: antes de usar una herramienta, después de editar un archivo, al terminar de responder, al empezar la sesión…

La diferencia clave:

| | `CLAUDE.md` / skill | Hook |
|---|---|---|
| Quién lo ejecuta | El modelo **decide** seguir la instrucción | **Claude Code** lo ejecuta siempre |
| Garantía | Probable, no garantizado | **Determinista**: siempre que ocurre el evento |
| Coste de contexto | Ocupa contexto | Cero (salvo que devuelva texto a Claude) |
| Ideal para | Guiar, enseñar, procedimientos con criterio | Guardarraíles, formateo, validaciones, notificaciones, registros |

> "No edites `.env`" en `CLAUDE.md` es una **petición**. Un hook que bloquea la edición es una **garantía**.

## El ciclo de vida y sus eventos

Los más usados:

| Evento | Cuándo se dispara | Puede bloquear |
|---|---|---|
| `SessionStart` | Al iniciar o reanudar una sesión (y tras compactar) | — (añade contexto) |
| `UserPromptSubmit` | Al enviar un prompt, antes de que Claude lo procese | Sí, rechaza el prompt |
| `PreToolUse` | Antes de ejecutar una herramienta | **Sí**, bloquea la llamada |
| `PermissionRequest` | Cuando una herramienta necesita decisión de permiso | Sí, puede aprobar/denegar |
| `PostToolUse` | Después de que una herramienta termina bien | Da feedback a Claude |
| `PostToolUseFailure` | Después de que una herramienta falla | — |
| `Notification` | Cuando Claude Code notifica (espera permiso, lleva rato inactivo…) | — |
| `Stop` | Cuando Claude termina de responder | **Sí**, puede obligarle a seguir |
| `SubagentStart` / `SubagentStop` | Al lanzar / terminar un subagente | `SubagentStop` sí |
| `PreCompact` / `PostCompact` | Antes / después de compactar el contexto | — |
| `SessionEnd` | Al cerrar la sesión | — |

Hay más (`FileChanged`, `CwdChanged`, `ConfigChange`, `InstructionsLoaded`, `WorktreeCreate`, `TaskCompleted`, `PreModelSwitch`, `Elicitation`…). Consulta la referencia oficial cuando necesites uno concreto.

## Estructura de la configuración

Los hooks se definen en los archivos `settings.json`, con tres niveles:

1. **Evento** (`PreToolUse`, `Stop`…).
2. **Grupo con matcher**: filtra cuándo se dispara (p. ej. solo para la herramienta `Bash`).
3. **Handlers**: lo que se ejecuta.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/formatear.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

### Matchers

| Valor | Cómo se interpreta |
|---|---|
| `"*"`, `""` u omitido | Todo |
| Letras, números, `_`, `-`, espacios, `,` y `\|` | Nombres exactos: `Bash`, `Edit\|Write`, `Edit, Write` |
| Cualquier otro carácter | Expresión regular: `^mcp__github__`, `mcp__.*__delete.*` |

Para `PreToolUse`/`PostToolUse`, el matcher se compara con el **nombre de la herramienta**. En otros eventos se compara con otra cosa (por ejemplo, el tipo de notificación en `Notification`, o el origen en `SessionStart`: `startup`, `resume`, `clear`, `compact`).

### Tipos de handler

| `type` | Qué hace |
|---|---|
| `command` | Ejecuta un comando de shell (el más común) |
| `http` | Envía el evento por POST a una URL |
| `mcp_tool` | Llama a una herramienta de un servidor MCP conectado |
| `prompt` | Pide a un modelo una evaluación de un turno que devuelve una decisión |
| `agent` | Lanza un subagente que verifica condiciones con herramientas (experimental) |

## Cómo se comunica un hook

### Entrada: JSON por stdin

Cada hook recibe un JSON con campos comunes (`session_id`, `cwd`, `permission_mode`, `hook_event_name`, `transcript_path`…) y campos del evento. Por ejemplo, un `PreToolUse` de Bash recibe algo como:

```json
{
  "session_id": "…",
  "cwd": "/home/ana/tienda",
  "permission_mode": "default",
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": { "command": "npm test", "description": "Run tests" }
}
```

Para `Edit`/`Write`, `tool_input.file_path` contiene la ruta del archivo.

### Salida: códigos de salida

| Código | Significado |
|---|---|
| `0` | Éxito. Se sigue normalmente (y se puede devolver JSON en stdout) |
| `2` | **Error bloqueante**: en eventos que pueden bloquear, se bloquea la acción y el texto de **stderr** se envía a Claude como motivo |
| Otro | Error no bloqueante: se muestra un aviso y la acción continúa |

### Salida: JSON (control fino)

Con código 0 y un JSON en stdout, el hook puede decidir con más detalle. Por ejemplo, en `PreToolUse`:

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "No se permite modificar archivos de migraciones ya aplicadas."
  }
}
```

`permissionDecision` puede ser `allow`, `deny`, `ask` o `defer`. Si varios hooks responden, gana el más restrictivo.

## Dónde se definen

| Ubicación | Alcance |
|---|---|
| `~/.claude/settings.json` | Todos tus proyectos |
| `.claude/settings.json` | El proyecto (compartido vía Git) |
| `.claude/settings.local.json` | El proyecto, solo tú |
| *Managed settings* | Toda la organización |
| Plugin (`hooks/hooks.json`) | Donde el plugin esté activo |
| Frontmatter de una skill o subagente | Mientras esa skill/subagente esté activo |

Los hooks de distintos niveles **se suman**. Un mismo handler definido en varios archivos se ejecuta una sola vez. Todos los hooks que coinciden se ejecutan **en paralelo**.

## El menú `/hooks`

```text
/hooks
```

Muestra los hooks configurados por evento y de dónde viene cada uno. Útil para comprobar que tu configuración se ha cargado.

## Seguridad

!!! danger "Los hooks ejecutan código con tus permisos"
    Un hook es un comando que se ejecuta automáticamente en tu máquina. Revisa siempre los hooks de proyectos que clones (en `.claude/settings.json`) antes de confiar en la carpeta: hasta que aceptas la confianza del espacio de trabajo, no se ejecutan. En modo headless (`-p`) no hay diálogo de confianza, así que usa `--bare` en entornos que no controlas.

    Las organizaciones pueden limitar los hooks a los gestionados con `allowManagedHooksOnly`, y cualquiera puede desactivarlos todos con `"disableAllHooks": true`.

## Resumen

- Hook = acción automática y determinista en un evento del ciclo de vida.
- Configuración: evento → matcher → handlers (`command`, `http`, `mcp_tool`, `prompt`, `agent`).
- Entrada JSON por stdin; salida por código (0 ok, 2 bloquear) o JSON para decisiones finas.
- `/hooks` para ver lo configurado; cuidado con hooks de repos ajenos.

## Ejercicios

1. Ejecuta `/hooks` en un proyecto y comprueba si hay alguno configurado.
2. Crea un hook `PostToolUse` que registre en un archivo cada herramienta que usa Claude (`jq -r '.tool_name' >> ~/.claude/uso-herramientas.log`).
3. Clasifica tres reglas de tu `CLAUDE.md` según si deberían ser hooks.

## Referencias

- [Guía de hooks](https://code.claude.com/docs/en/hooks-guide)
- [Referencia de hooks](https://code.claude.com/docs/en/hooks)
