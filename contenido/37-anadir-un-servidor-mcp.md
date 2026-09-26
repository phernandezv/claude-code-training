---
titulo: Añadir un servidor MCP
resumen: claude mcp add para servidores HTTP, SSE y stdio, el separador --, variables de entorno y cabeceras, add-json, importar desde Claude Desktop, autenticación OAuth con /mcp, y gestión con list, get, remove y /mcp.
---

## Objetivos de la lección

- Añadir servidores remotos (HTTP) y locales (stdio).
- Pasar variables de entorno y cabeceras de autenticación.
- Autenticarte con OAuth desde `/mcp`.
- Listar, inspeccionar, desactivar y eliminar servidores.

## La orden `claude mcp add`

Se ejecuta **desde tu terminal**, fuera de la sesión interactiva:

```bash
claude mcp add [opciones] <nombre> <url>              # remoto
claude mcp add [opciones] <nombre> -- <comando> [args] # local (stdio)
```

Opciones principales:

| Opción | Para qué |
|---|---|
| `--transport http\|sse\|stdio` | Tipo de conexión |
| `--scope local\|project\|user` | Dónde se guarda (lección 39). Por defecto `local` |
| `--env CLAVE=valor` | Variables de entorno para el servidor (stdio) |
| `--header "Nombre: valor"` | Cabeceras HTTP (p. ej. autenticación) |

## Servidores remotos (HTTP)

```bash
# Sintaxis
claude mcp add --transport http <nombre> <url>

# Ejemplos
claude mcp add --transport http notion https://mcp.notion.com/mcp
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp

# Con token en cabecera
claude mcp add --transport http mi-api https://api.ejemplo.com/mcp \
  --header "Authorization: Bearer $MI_TOKEN"
```

Si un servicio solo ofrece **SSE** (obsoleto), `--transport http` intenta HTTP y recurre a SSE; también puedes forzarlo con `--transport sse`.

## Servidores locales (stdio)

Claude Code lanza el proceso y se comunica por su entrada/salida estándar:

```bash
claude mcp add --transport stdio <nombre> -- <comando> [argumentos...]

# Ejemplos
claude mcp add --transport stdio playwright -- npx -y @playwright/mcp@latest

claude mcp add --env AIRTABLE_API_KEY=xxxxx --transport stdio airtable \
  -- npx -y airtable-mcp-server

claude mcp add --transport stdio mi-servidor -- python servidor.py --port 8080
```

!!! warning "El doble guion `--` es obligatorio"
    Todo lo que va **después** de `--` se pasa tal cual al servidor. Sin él, Claude Code intentaría interpretar flags del servidor (como `--port`) como propias.

    También: si el nombre del servidor va justo después de `--env`, se interpretará como otra variable. Pon otra opción en medio (como `--transport stdio`).

## Añadir desde JSON

Útil cuando la documentación del servidor te da un bloque JSON:

```bash
claude mcp add-json github '{"type":"http","url":"https://api.githubcopilot.com/mcp/","headers":{"Authorization":"Bearer ${GH_MCP_TOKEN}"}}'

claude mcp add-json postgres '{"type":"stdio","command":"npx","args":["-y","@modelcontextprotocol/server-postgres","postgresql://localhost/tienda"]}'
```

!!! warning "Variables de credenciales en servidores remotos"
    En la `url` y las `headers` de un servidor **remoto**, Claude Code **no expande** variables de credenciales conocidas (como `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, credenciales del proveedor cloud, `NPM_TOKEN`…): se leen como vacías para que un `.mcp.json` ajeno no pueda enviar tus credenciales a un servidor. Usa una variable con un nombre propio (p. ej. `GH_MCP_TOKEN`).

!!! tip "type es necesario para remotos"
    Una entrada JSON con `url` pero sin `type` es un error: sin `type`, Claude Code la trata como stdio. Usa `"type": "http"` (o `"streamable-http"`, que es un alias).

## Importar desde Claude Desktop

Si ya tienes servidores configurados en la app de escritorio:

```bash
claude mcp add-from-claude-desktop
```

## Autenticación OAuth

Muchos servidores remotos usan OAuth. El flujo:

1. Añade el servidor: `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp`
2. Abre Claude Code y ejecuta:

    ```text
    /mcp
    ```

3. Selecciona el servidor → **Authenticate** → se abre el navegador para iniciar sesión.
4. Los tokens se guardan de forma segura y se renuevan automáticamente.

Si un token caduca o se revoca, `/mcp` mostrará el servidor como pendiente de autenticación y podrás pulsar **Re-authenticate**. Al arrancar, Claude Code avisa si algún servidor necesita iniciar sesión.

## Gestionar servidores

```bash
claude mcp list              # lista con estado (✔ Connected, ✘ Failed, ⏸ Pending approval…)
claude mcp get sentry        # detalles de uno
claude mcp remove sentry     # eliminar (también borra sus tokens OAuth)
```

Dentro de la sesión:

```text
/mcp                         ← panel: estado, herramientas, autenticación
/mcp reconnect sentry        ← reconectar uno caído
/mcp disable sentry          ← desactivar sin eliminar
/mcp enable sentry
/mcp disable all
```

## Tiempos de espera y límites

| Variable | Efecto |
|---|---|
| `MCP_TIMEOUT` | Tiempo máximo de arranque del servidor (ms). Ej.: `MCP_TIMEOUT=10000 claude` |
| `MCP_TOOL_TIMEOUT` | Tiempo máximo por llamada a herramienta |
| `MAX_MCP_OUTPUT_TOKENS` | Tamaño máximo de la respuesta de una herramienta (por defecto 25.000 tokens) |

## Ejemplo completo: GitHub + PostgreSQL

```bash
# Servidor remoto de GitHub con un token personal (PAT) de permisos mínimos
export GH_MCP_TOKEN=github_pat_xxx
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \
  --header "Authorization: Bearer $GH_MCP_TOKEN"

# Base de datos local en solo lectura (usa un usuario con permisos de lectura)
claude mcp add --transport stdio db -- npx -y @bytebase/dbhub \
  --dsn "postgresql://lector:clave@localhost:5432/tienda"

claude mcp list
claude
```

```text
> /mcp          (comprueba que ambos están conectados)
> Revisa el PR #57 con las herramientas de GitHub y comprueba en la base de
  datos si la nueva columna "discount_code" ya existe en producción-réplica.
```

!!! note "Paquetes de ejemplo"
    Los nombres de paquetes y URLs de servidores de terceros cambian con el tiempo. Consulta siempre la documentación oficial de cada servidor antes de instalarlo.

## Resumen

- `claude mcp add --transport http <nombre> <url>` para remotos; `… --transport stdio <nombre> -- <comando>` para locales.
- `--env` y `--header` para credenciales; `add-json` para configuraciones en JSON.
- OAuth con `/mcp` → Authenticate.
- `claude mcp list/get/remove` y `/mcp` para gestionarlos.

## Ejercicios

1. Añade un servidor remoto que use OAuth (Sentry, Notion, Linear…) y autentícate con `/mcp`.
2. Añade un servidor stdio local (por ejemplo, Playwright) y pide a Claude que lo use.
3. Ejecuta `claude mcp list` y `claude mcp get <nombre>`; interpreta el estado.
4. Desactiva un servidor con `/mcp disable` y comprueba en `/context` la diferencia.

## Referencias

- [MCP en Claude Code](https://code.claude.com/docs/en/mcp)
- [Quickstart de MCP](https://code.claude.com/docs/en/mcp-quickstart)
- [Referencia de la CLI](https://code.claude.com/docs/en/cli-reference)
