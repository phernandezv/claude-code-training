---
titulo: "Agent SDK: construir tus propios agentes"
resumen: Usar el motor de Claude Code como librería en Python o TypeScript - cuándo elegir el Agent SDK frente a la CLI o la API, instalación, la función query, opciones (herramientas, permisos, system prompt, MCP, subagentes, sesiones), control de permisos con código y buenas prácticas para producción.
---

## Objetivos de la lección

- Entender qué es el **Claude Agent SDK** y cuándo usarlo.
- Crear un primer agente en **Python** y en **TypeScript**.
- Configurar herramientas, permisos, prompt de sistema, MCP y subagentes desde código.
- Conocer las consideraciones para llevar un agente a producción.

## ¿Qué es el Agent SDK?

Es el mismo motor que hay dentro de Claude Code (el bucle agéntico, las herramientas, la gestión de contexto, los permisos) empaquetado como **librería** para Python y TypeScript. Te permite construir **tus propios agentes** dentro de tus aplicaciones y servicios.

| Quiero… | Uso |
|---|---|
| Trabajar de forma interactiva o tareas puntuales desde la terminal | **CLI** de Claude Code |
| Scripts sencillos y CI desde cualquier lenguaje | **`claude -p`** con `--output-format json` (lección 5) |
| Integrar un agente en mi aplicación Python/TypeScript, en un proceso que yo controlo | **Agent SDK** |
| Llamar al modelo directamente, sin herramientas de agente | **Client SDK** de la API de Claude |
| Que Anthropic aloje y ejecute el agente | **Managed Agents** (plataforma de Claude) |

Lo que ya sabes del curso se aplica: herramientas, hooks, subagentes, MCP, permisos, sesiones, e incluso skills, comandos y `CLAUDE.md` del proyecto si los cargas.

## Instalación

```bash
# Python
pip install claude-agent-sdk

# TypeScript / Node
npm install @anthropic-ai/claude-agent-sdk
```

Autenticación: define `ANTHROPIC_API_KEY` (clave de Claude Console) o las credenciales de tu proveedor cloud (Bedrock, Google Cloud, Foundry).

!!! note "Autenticación en productos propios"
    Salvo aprobación previa, un producto de terceros construido con el SDK no puede ofrecer inicio de sesión con claude.ai ni usar los límites de suscripción: usa autenticación por API key.

## Tu primer agente (Python)

Un agente que revisa un módulo y deja un informe sin tocar el código:

```python
import asyncio
from claude_agent_sdk import query, ClaudeAgentOptions, AssistantMessage, ResultMessage

async def main():
    opciones = ClaudeAgentOptions(
        allowed_tools=["Read", "Grep", "Glob", "Write"],
        permission_mode="acceptEdits",
        system_prompt="Eres un revisor de código. Escribe tus conclusiones en español.",
        max_turns=20,
    )
    async for mensaje in query(
        prompt="Revisa src/pagos/ buscando errores de manejo de excepciones y "
               "escribe un informe en informes/pagos.md. No modifiques el código fuente.",
        options=opciones,
    ):
        if isinstance(mensaje, AssistantMessage):
            for bloque in mensaje.content:
                if hasattr(bloque, "text"):
                    print(bloque.text)
                elif hasattr(bloque, "name"):
                    print(f"→ herramienta: {bloque.name}")
        elif isinstance(mensaje, ResultMessage):
            print(f"Terminado: {mensaje.subtype}")

asyncio.run(main())
```

`query` devuelve un **flujo de mensajes** a medida que el agente trabaja: razonamiento, llamadas a herramientas y, al final, un mensaje de resultado.

## El mismo agente en TypeScript

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const mensaje of query({
  prompt:
    "Revisa src/pagos/ buscando errores de manejo de excepciones y escribe " +
    "un informe en informes/pagos.md. No modifiques el código fuente.",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Write"],
    permissionMode: "acceptEdits",
    systemPrompt: "Eres un revisor de código. Escribe tus conclusiones en español.",
    maxTurns: 20,
  },
})) {
  if (mensaje.type === "result") console.log("Terminado:", mensaje.subtype);
}
```

```bash
npx tsx agente.ts
```

## Opciones principales

| Python | TypeScript | Para qué |
|---|---|---|
| `allowed_tools` / `disallowed_tools` | `allowedTools` / `disallowedTools` | Herramientas preaprobadas o prohibidas |
| `permission_mode` | `permissionMode` | Modo de permisos (`default`, `acceptEdits`, `plan`, `dontAsk`…) |
| `can_use_tool` | `canUseTool` | Función propia que decide cada permiso |
| `system_prompt` | `systemPrompt` | Instrucciones del agente |
| `model` | `model` | Modelo a usar |
| `max_turns` | `maxTurns` | Límite de turnos |
| `cwd` | `cwd` | Directorio de trabajo |
| `mcp_servers` | `mcpServers` | Servidores MCP |
| `agents` | `agents` | Subagentes definidos en código |
| `hooks` | `hooks` | Hooks como funciones de tu lenguaje |
| `setting_sources` | `settingSources` | Qué configuración de disco cargar (usuario, proyecto, local) |
| `resume` | `resume` | Reanudar una sesión anterior |
| `output_format` | `outputFormat` | Salida estructurada |

## Permisos desde código

Con `can_use_tool` decides en tiempo real, con la lógica que quieras (listas, reglas de negocio, aprobación de un humano por Slack…):

```python
import asyncio
from claude_agent_sdk import ClaudeSDKClient, ClaudeAgentOptions
from claude_agent_sdk.types import PermissionResultAllow, PermissionResultDeny, ToolPermissionContext

async def decidir(herramienta: str, entrada: dict, contexto: ToolPermissionContext):
    if herramienta == "Bash" and "rm " in entrada.get("command", ""):
        return PermissionResultDeny(message="No se permiten borrados.")
    if herramienta in ("Write", "Edit") and not entrada.get("file_path", "").startswith("informes/"):
        return PermissionResultDeny(message="Solo puedes escribir en informes/.")
    return PermissionResultAllow(updated_input=entrada)

async def main():
    # Las herramientas que quieras controlar con can_use_tool NO deben estar en allowed_tools:
    # una regla allow las aprobaría antes de llegar a tu función.
    opciones = ClaudeAgentOptions(can_use_tool=decidir, allowed_tools=["Read", "Grep", "Glob"])
    async with ClaudeSDKClient(options=opciones) as cliente:
        await cliente.query("Genera informes/deuda-tecnica.md con los TODO del proyecto agrupados por módulo.")
        async for mensaje in cliente.receive_response():
            print(mensaje)

asyncio.run(main())
```

`PermissionResultAllow` puede incluso **modificar la entrada** (`updated_input`), por ejemplo para redirigir una escritura a una carpeta segura. El control interactivo de permisos se usa con `ClaudeSDKClient` (modo de streaming); consulta la referencia de tu lenguaje para los detalles.

## Subagentes y MCP en código

```python
from claude_agent_sdk import ClaudeAgentOptions, AgentDefinition

opciones = ClaudeAgentOptions(
    agents={
        "buscador": AgentDefinition(
            description="Localiza código relevante rápidamente.",
            prompt="Busca y resume; no edites.",
            tools=["Read", "Grep", "Glob"],
            model="haiku",
        ),
    },
    mcp_servers={
        "sentry": {"type": "http", "url": "https://mcp.sentry.dev/mcp"},
    },
)
```

## Sesiones

Cada ejecución crea una sesión con su ID (llega en los mensajes). Puedes **reanudarla** con `resume` para continuar la conversación, o bifurcarla, igual que con `--resume` en la CLI.

## Casos de uso típicos

- **Bots de soporte técnico** que leen código y documentación para responder.
- **Agentes de mantenimiento** que actualizan dependencias y abren PRs de forma programada.
- **Asistentes internos** integrados en tu plataforma (portal de desarrolladores, herramientas de datos).
- **Pipelines de revisión** a medida en tu propia infraestructura.
- **Agentes no relacionados con código**: análisis de documentos, investigación, operaciones.

## Hacia producción

- **Aislamiento**: ejecuta el agente en contenedores o entornos restringidos (lección 18); el SDK puede ejecutar comandos reales.
- **Permisos mínimos** y `can_use_tool` para las decisiones sensibles.
- **Límites**: `max_turns`, tiempos máximos, presupuesto.
- **Observabilidad**: registra mensajes, herramientas usadas y coste (el mensaje de resultado incluye uso y coste).
- **Configuración explícita**: decide con `setting_sources` si cargar o no la configuración del disco, para que el comportamiento no dependa de la máquina.
- **Marca**: puedes decir que tu agente funciona con Claude ("Powered by Claude"), pero no presentarlo como "Claude Code".

## Resumen

- El Agent SDK es el motor de Claude Code como librería (Python y TypeScript).
- `query(prompt, options)` devuelve un flujo de mensajes; las opciones reflejan lo aprendido: herramientas, permisos, MCP, subagentes, hooks, sesiones.
- `can_use_tool` para permisos programáticos; aislamiento y observabilidad para producción.

## Ejercicios

1. Instala el SDK en tu lenguaje y ejecuta el agente revisor sobre un módulo tuyo.
2. Añade un `can_use_tool` que solo permita escribir en una carpeta concreta y pruébalo.
3. Define un subagente "buscador" con Haiku y pide al agente principal que lo use.
4. Guarda el ID de sesión y reanúdala con una pregunta de seguimiento.

## Referencias

- [Agent SDK: visión general](https://code.claude.com/docs/en/agent-sdk/overview)
- [Quickstart del Agent SDK](https://code.claude.com/docs/en/agent-sdk/quickstart)
- [Referencia Python](https://code.claude.com/docs/en/agent-sdk/python) · [Referencia TypeScript](https://code.claude.com/docs/en/agent-sdk/typescript)
- [Permisos en el SDK](https://code.claude.com/docs/en/agent-sdk/permissions)
