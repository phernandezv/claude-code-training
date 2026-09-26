---
titulo: Usar herramientas MCP dentro de una sesión
resumen: Cómo invoca Claude las herramientas MCP, pedir su uso de forma explícita, mencionar recursos con @, ejecutar prompts MCP como comandos, permisos por herramienta, respuestas de elicitación, salidas grandes y diagnóstico con /mcp.
---

## Objetivos de la lección

- Pedir a Claude que use herramientas MCP de forma natural o explícita.
- Referenciar **recursos** MCP con `@` y ejecutar **prompts** MCP como comandos.
- Gestionar los permisos de herramientas MCP.
- Diagnosticar problemas de conexión y de salidas demasiado grandes.

## Claude decide cuándo usar una herramienta

Una vez conectado un servidor, sus herramientas están disponibles como cualquier otra. Normalmente basta con pedir la tarea:

```text
> ¿Qué errores nuevos hay en Sentry en el proyecto "checkout" desde ayer?
```

Claude busca la herramienta adecuada (con *tool search*, carga su definición solo entonces) y la llama:

```text
● mcp__sentry__search_issues(project: "checkout", query: "is:unresolved firstSeen:-24h")
  → 3 issues
```

### Ser explícito cuando hay ambigüedad

Si hay varias formas de obtener algo (por ejemplo, la CLI `gh` y el servidor MCP de GitHub), indica cuál prefieres:

```text
> Usa el servidor MCP de GitHub (no la CLI gh) para listar mis PRs abiertos.
> Consulta la base de datos con la herramienta del servidor "db", solo lectura.
```

## Recursos: mencionar datos con `@`

Escribe `@` y verás, junto a los archivos, los **recursos** que exponen los servidores conectados. El formato es `@servidor:protocolo://ruta`:

```text
> Analiza @github:issue://123 y propón un plan para resolverlo.
> Compara @postgres:schema://orders con la entidad en src/entities/order.ts.
> Revisa @docs:file://api/autenticacion y dime si nuestro cliente la cumple.
```

El contenido del recurso se incorpora directamente al contexto, igual que al mencionar un archivo.

## Prompts MCP como comandos

Los servidores pueden exponer **prompts** predefinidos. Aparecen al escribir `/` con la forma `/servidor:prompt (MCP)` y se ejecutan así:

```text
/mcp__github__list_prs
/mcp__github__pr_review 456
/mcp__jira__create_issue bug-login alta
```

Los argumentos se separan por espacios.

## Permisos de herramientas MCP

Las herramientas MCP pasan por el mismo sistema de permisos. La primera vez que Claude quiera usar una, te preguntará (en modo Manual). Puedes preaprobar o bloquear en `settings.json`:

```json
{
  "permissions": {
    "allow": [
      "mcp__sentry__search_issues",
      "mcp__sentry__get_issue_details",
      "mcp__github__*"
    ],
    "ask": [
      "mcp__github__merge_pull_request"
    ],
    "deny": [
      "mcp__db__execute_write",
      "mcp__slack__post_message"
    ]
  }
}
```

| Regla | Coincide con |
|---|---|
| `mcp__github` o `mcp__github__*` | Todas las herramientas del servidor `github` |
| `mcp__github__create_issue` | Solo esa herramienta |
| `mcp__*` (en deny/ask) | Todas las herramientas MCP de cualquier servidor |

!!! tip "Lecturas sí, escrituras con cuidado"
    Un buen punto de partida: `allow` para herramientas de lectura (buscar, obtener, listar), `ask` para las que escriben en sistemas compartidos (crear, actualizar, publicar) y `deny` para las destructivas o las que no necesitas.

Algunos servidores marcan herramientas como **"requiere interacción del usuario"**: esas piden aprobación en cada llamada, en cualquier modo (incluso auto o bypass), sin opción de "no volver a preguntar".

## Elicitación: cuando el servidor te pregunta

Un servidor MCP puede pedirte datos a mitad de tarea (*elicitation*). Verás:

- Un **formulario** con campos definidos por el servidor, o
- Una petición para **abrir una URL** en el navegador (por ejemplo, para iniciar sesión).

Rellena o acepta y el servidor continuará.

## Herramientas de larga duración

Si una herramienta MCP tarda mucho, Claude Code puede pasarla a segundo plano para que la sesión siga respondiendo, igual que con los comandos Bash (lección 9).

## Salidas grandes

Si una herramienta devuelve mucho texto:

- Claude Code avisa a partir de ~10.000 tokens y limita la salida a 25.000 tokens por defecto.
- Puedes subir el límite: `export MAX_MCP_OUTPUT_TOKENS=50000`.
- Mejor aún: **pide consultas acotadas** ("solo los 10 errores más frecuentes", "solo las columnas id, estado y fecha").

## Diagnóstico con `/mcp`

```text
/mcp
```

El panel muestra por servidor: estado (conectado, fallido, pendiente de aprobación o de autenticación), herramientas disponibles, y acciones como autenticarse, reconectar o desactivar.

Problemas típicos:

| Síntoma | Causa probable | Solución |
|---|---|---|
| `✘ Failed` | El comando no existe, falta una dependencia, URL incorrecta | `claude mcp get <nombre>`, revisa comando/URL; `claude --debug` |
| `⏸ Pending approval` | Servidor de `.mcp.json` sin aprobar | Abre `claude` en el proyecto y apruébalo |
| Necesita autenticación | Token OAuth ausente o caducado | `/mcp` → Authenticate / Re-authenticate |
| Claude no usa la herramienta | No la relaciona con tu petición | Menciona el servidor o la herramienta explícitamente |
| Respuestas truncadas | Límite de salida | Consulta más acotada o `MAX_MCP_OUTPUT_TOKENS` |
| Arranque lento | Servidor stdio pesado | `MCP_TIMEOUT=20000 claude` |

Si un servidor remoto se cae a mitad de sesión, Claude Code intenta reconectar automáticamente.

## Un ejemplo de flujo completo

```text
> Revisa en Sentry el error más frecuente de hoy en "checkout".
  ● mcp__sentry__search_issues(...)
  ● mcp__sentry__get_issue_details(id: "CHK-8841")
    TypeError: Cannot read properties of undefined (reading 'price')
    en src/cart/summary.ts:42

> Busca la causa en el código y corrígela con un test que reproduzca el caso.
  ● Read(src/cart/summary.ts) … Edit … Bash(pnpm test cart) ✔

> Crea un issue en GitHub enlazando el error de Sentry y el commit de la corrección.
  ● mcp__github__create_issue(...)
```

## Resumen

- Pide la tarea; Claude elige la herramienta. Sé explícito si hay varias opciones.
- `@servidor:protocolo://ruta` para recursos; `/mcp__servidor__prompt` para prompts.
- Permisos `mcp__servidor__herramienta` en allow/ask/deny.
- `/mcp` para diagnosticar; acota las consultas para evitar salidas enormes.

## Ejercicios

1. Con un servidor conectado, pide una tarea sin mencionarlo y observa si Claude lo usa.
2. Escribe `@` y localiza un recurso MCP; úsalo en un prompt.
3. Configura `allow` para las herramientas de lectura de un servidor y `ask` para las de escritura.
4. Provoca un fallo (URL errónea) y diagnostícalo con `/mcp` y `claude mcp get`.

## Referencias

- [MCP: recursos, prompts, permisos y límites](https://code.claude.com/docs/en/mcp)
- [Permisos para MCP](https://code.claude.com/docs/en/permissions)
