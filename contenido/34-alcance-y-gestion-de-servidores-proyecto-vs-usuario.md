---
titulo: "Alcance y gestión de servidores: proyecto vs. usuario"
resumen: Los tres alcances de MCP (local, project, user), dónde se guarda cada uno (~/.claude.json, .mcp.json), precedencia, compartir con el equipo mediante .mcp.json con variables ${VAR}, aprobación de servidores de proyecto y configuración gestionada por la organización.
---

## Objetivos de la lección

- Elegir el alcance correcto para cada servidor MCP.
- Compartir servidores con el equipo mediante `.mcp.json` sin exponer secretos.
- Entender la precedencia cuando un servidor está definido en varios sitios.
- Conocer los controles de aprobación y de organización.

## Los tres alcances

| Alcance | Se carga en | Compartido con el equipo | Dónde se guarda |
|---|---|---|---|
| **local** (por defecto) | Solo el proyecto actual | No | `~/.claude.json`, bajo la ruta del proyecto |
| **project** | Solo el proyecto actual | **Sí**, vía Git | `.mcp.json` en la raíz del proyecto |
| **user** | Todos tus proyectos | No | `~/.claude.json` |

```bash
claude mcp add --transport http stripe https://mcp.stripe.com                    # local
claude mcp add --transport http sentry --scope project https://mcp.sentry.dev/mcp # project
claude mcp add --transport http notion --scope user https://mcp.notion.com/mcp    # user
```

!!! note "Ojo con el nombre 'local'"
    El alcance *local* de MCP se guarda en `~/.claude.json` (tu home), no en `.claude/settings.local.json`. Son conceptos distintos que comparten nombre.

## ¿Cuál elijo?

| Servidor | Alcance recomendado | Motivo |
|---|---|---|
| Sentry/Linear/Jira del proyecto | **project** | Todo el equipo lo necesita en este repo |
| Base de datos de desarrollo del proyecto | **project** (con variables) | Misma configuración, credenciales por persona |
| Notion/Slack personal, un servidor que pruebas | **user** | Lo quieres en todas partes, solo tú |
| Credenciales o servidor experimental en un proyecto | **local** | Solo tú, solo aquí |

## `.mcp.json`: servidores compartidos

Con `--scope project` se crea o actualiza `.mcp.json` en la raíz:

```json
{
  "mcpServers": {
    "sentry": {
      "type": "http",
      "url": "https://mcp.sentry.dev/mcp"
    },
    "db": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "${DATABASE_URL_READONLY}"]
    },
    "api-interna": {
      "type": "http",
      "url": "${API_INTERNA_URL:-https://mcp.interno.ejemplo.com}/mcp",
      "headers": {
        "Authorization": "Bearer ${API_INTERNA_TOKEN}"
      }
    }
  }
}
```

Súbelo a Git. Cada persona define sus variables en su entorno (o en el `env` de su `settings.local.json`).

### Expansión de variables

| Sintaxis | Resultado |
|---|---|
| `${VAR}` | El valor de `VAR` |
| `${VAR:-valor}` | `VAR` si existe; si no, `valor` |

Se expanden en `command`, `args`, `env`, `url` y `headers`. Si una variable falta y no tiene valor por defecto, `claude mcp list` muestra un aviso.

!!! warning "Nunca pongas secretos en .mcp.json"
    `.mcp.json` se sube al repositorio. Usa siempre `${VARIABLE}` para tokens y cadenas de conexión.

### Aprobación de servidores de proyecto

Por seguridad, la **primera vez** que abres Claude Code en un proyecto con `.mcp.json`, te pide aprobar sus servidores (un repositorio clonado podría incluir un servidor malicioso). Hasta entonces aparecen como `⏸ Pending approval`.

```bash
claude mcp reset-project-choices   # olvidar las aprobaciones/rechazos de este proyecto
```

En `settings.json` puedes controlar esto:

```json
{
  "enabledMcpjsonServers": ["sentry", "db"],
  "disabledMcpjsonServers": ["api-interna"]
}
```

!!! danger "Modo headless y .mcp.json"
    En `claude -p`, en el Agent SDK y en sesiones en la nube **no hay diálogo de aprobación**: los servidores de `.mcp.json` se cargan sin preguntar. En CI, usa `--strict-mcp-config` con `--mcp-config` para controlar exactamente qué servidores se cargan, o `--bare`.

## Precedencia

Si el mismo servidor aparece en varios sitios, Claude Code se conecta **una sola vez** usando la definición de mayor prioridad (sin mezclar campos):

1. local
2. project
3. user
4. Servidores aportados por plugins
5. Conectores de claude.ai

(Los servidores gestionados por la organización están por encima de todos.)

Esto permite, por ejemplo, que el equipo defina `db` en `.mcp.json` y tú lo sobrescribas con tu propia versión en alcance local.

## Desactivar sin borrar

```text
/mcp disable api-interna
```

Queda desactivado para este proyecto (se guarda en la lista `disabledMcpServers`) y puedes reactivarlo con `/mcp enable`.

## Configuración de MCP para una sola ejecución

```bash
claude --mcp-config ./mcp-ci.json --strict-mcp-config -p "…"
```

- `--mcp-config` carga servidores desde un archivo o JSON.
- `--strict-mcp-config` ignora cualquier otra configuración MCP (usuario, proyecto…).

## MCP gestionado por la organización

Los administradores pueden:

- **Proveer servidores** a todo el mundo mediante *managed settings*.
- **Restringir** qué servidores se pueden usar (listas de permitidos/bloqueados).
- Controlar los **conectores de claude.ai** que llegan a Claude Code.

Si un servidor no aparece o no puedes añadirlo, puede deberse a esta política.

## Resumen

- local (tú, aquí) · project (equipo, `.mcp.json`) · user (tú, en todas partes).
- `.mcp.json` con `${VAR}` para compartir sin secretos; requiere aprobación inicial.
- Precedencia local > project > user > plugins > conectores.
- En CI: `--mcp-config` + `--strict-mcp-config` (o `--bare`).

## Ejercicios

1. Añade un servidor con `--scope project`, revisa el `.mcp.json` generado y súbelo a una rama.
2. Sustituye cualquier valor sensible por `${VARIABLE}` y define la variable en tu entorno.
3. Clona el repo en otra carpeta y observa el diálogo de aprobación.
4. Define el mismo servidor en alcance local con otra URL y comprueba cuál se usa con `claude mcp get`.

## Referencias

- [Alcances de instalación de MCP](https://code.claude.com/docs/en/mcp#mcp-installation-scopes)
- [MCP gestionado](https://code.claude.com/docs/en/managed-mcp)
- [Referencia de settings](https://code.claude.com/docs/en/settings-reference)
