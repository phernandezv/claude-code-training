---
titulo: "Qué es MCP: Claude Code como cliente de herramientas externas"
resumen: El Model Context Protocol explicado - arquitectura cliente/servidor, transportes (stdio, HTTP, WebSocket), qué exponen los servidores (herramientas, recursos, prompts), casos de uso y cómo se integra en el contexto de Claude.
---

## Objetivos de la lección

- Entender qué es el **Model Context Protocol (MCP)** y qué problema resuelve.
- Conocer su arquitectura: **cliente**, **servidor** y **transporte**.
- Distinguir herramientas, recursos y prompts de un servidor MCP.
- Identificar casos de uso reales para tu equipo.

## El problema

Claude Code ya sabe leer tu código y ejecutar comandos. Pero mucha información relevante **no está en el repositorio**:

- El ticket que describe la funcionalidad (Jira, Linear, GitHub Issues).
- Los errores de producción (Sentry, Datadog).
- El esquema y los datos de la base de datos.
- Los diseños (Figma), la documentación interna (Notion, Confluence).
- Conversaciones del equipo (Slack).

Sin integración, tendrías que copiar y pegar todo eso al chat.

## La solución: un protocolo estándar

**MCP** es un protocolo abierto que define cómo una aplicación de IA (el **cliente**) se conecta a servicios externos (los **servidores**) para usar sus capacidades. La idea es parecida a un "puerto USB" para la IA: cualquier cliente compatible puede conectarse a cualquier servidor compatible.

- **Claude Code actúa como cliente MCP.**
- Cada integración (GitHub, Sentry, PostgreSQL, Notion…) es un **servidor MCP**.
- Muchos proveedores publican su propio servidor oficial; también puedes escribir el tuyo.

```text
┌──────────────┐     MCP      ┌──────────────────┐
│ Claude Code  │ ───────────▶ │ Servidor GitHub   │ ──▶ API de GitHub
│  (cliente)   │ ───────────▶ │ Servidor Sentry   │ ──▶ API de Sentry
│              │ ───────────▶ │ Servidor Postgres │ ──▶ Tu base de datos
└──────────────┘              └──────────────────┘
```

## Transportes: cómo se conectan

| Transporte | Dónde corre el servidor | Cuándo usarlo |
|---|---|---|
| **stdio** | Proceso local que Claude Code lanza en tu máquina | Herramientas locales, scripts propios, acceso al sistema de archivos o a una BD local |
| **HTTP** (*streamable HTTP*) | Servicio remoto | La opción recomendada para servicios en la nube; admite OAuth |
| **SSE** | Remoto | **Obsoleto**; usar HTTP cuando sea posible |
| **WebSocket** (`ws`) | Remoto | Servidores que envían eventos de forma espontánea |

## Qué ofrece un servidor MCP

### 1. Herramientas (*tools*)

Acciones que Claude puede invocar, como cualquier herramienta integrada: `create_issue`, `search_errors`, `run_query`… En Claude Code aparecen con el nombre `mcp__<servidor>__<herramienta>`, por ejemplo `mcp__github__create_pull_request`.

### 2. Recursos (*resources*)

Datos que puedes **mencionar con `@`**, igual que un archivo:

```text
> Analiza @github:issue://123 y propón una solución.
> Compara @postgres:schema://users con el modelo en src/models/user.ts
```

### 3. Prompts

Plantillas de prompt que el servidor expone y que aparecen como **comandos slash**:

```text
/mcp__github__pr_review 456
```

## Cómo afecta al contexto

Conectar servidores no llena el contexto de golpe:

- Por defecto, las definiciones de herramientas MCP se **cargan bajo demanda** (*tool search*): al principio solo ocupan sus nombres, y el esquema completo se carga cuando Claude va a usar una herramienta.
- Aun así, cada servidor añade algo. Revisa con `/context` y desactiva lo que no uses.
- Las respuestas de herramientas MCP muy grandes se limitan (aviso a partir de ~10.000 tokens y límite de 25.000 por defecto, ajustable con `MAX_MCP_OUTPUT_TOKENS`).

## Casos de uso

```text
> Implementa la funcionalidad descrita en el ticket ENG-4521 de Linear y abre un PR.

> Revisa en Sentry los errores de las últimas 24 h del servicio de pagos,
  agrúpalos por causa y propón correcciones.

> Consulta en Postgres cuántos pedidos se quedaron en estado "pending" más
  de una hora esta semana, y busca en el código por qué no se procesan.

> Actualiza el componente Button según el diseño nuevo en Figma.

> Resume las decisiones del hilo de Slack #checkout-v2 y añádelas a docs/adr/.
```

## MCP en ambos sentidos

Claude Code también puede **actuar como servidor MCP** para otras aplicaciones:

```bash
claude mcp serve
```

Esto expone las herramientas de Claude Code (leer, editar, etc.) a otro cliente MCP.

## Conectores de claude.ai

Si usas claude.ai con conectores configurados (Google Drive, Gmail, etc.), esos conectores también pueden estar disponibles en Claude Code con la misma cuenta. Tu organización puede controlar cuáles.

## MCP y seguridad (adelanto)

Un servidor MCP puede **leer datos** y **ejecutar acciones** en sistemas reales. Eso implica confiar en el servidor y en lo que devuelve (riesgo de *prompt injection*). Lo tratamos en profundidad en la lección 40.

## Resumen

- MCP = protocolo estándar para conectar la IA con servicios externos. Claude Code es el cliente.
- Transportes: stdio (local), HTTP (remoto, recomendado), WebSocket; SSE obsoleto.
- Los servidores ofrecen herramientas (`mcp__servidor__herramienta`), recursos (`@servidor:…`) y prompts (`/mcp__servidor__prompt`).
- Las herramientas se cargan bajo demanda, pero cada servidor tiene un coste: conecta solo lo que uses.

## Ejercicios

1. Haz una lista de 3 fuentes de información que copias a mano al chat con frecuencia. ¿Existe un servidor MCP para ellas?
2. Busca en el registro/documentación de servidores MCP uno oficial para una herramienta que uses.
3. Escribe tres prompts que usarías si tuvieras ese servidor conectado.

## Referencias

- [Conectar Claude Code a herramientas con MCP](https://code.claude.com/docs/en/mcp)
- [Quickstart de MCP](https://code.claude.com/docs/en/mcp-quickstart)
- [Especificación de Model Context Protocol](https://modelcontextprotocol.io/)
