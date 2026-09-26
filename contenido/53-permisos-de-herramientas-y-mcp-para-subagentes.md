---
titulo: Permisos de herramientas y MCP para subagentes
resumen: Controlar qué puede hacer cada subagente - tools y disallowedTools, patrones de MCP por servidor, servidores MCP exclusivos de un subagente (mcpServers), permissionMode y su interacción con el modo de la sesión, reglas de permisos que también aplican a subagentes, hooks por subagente y restringir qué subagentes se pueden lanzar.
---

## Objetivos de la lección

- Aplicar **mínimo privilegio** a cada subagente.
- Restringir herramientas integradas y MCP con `tools` y `disallowedTools`.
- Dar a un subagente servidores MCP que la conversación principal no carga.
- Entender cómo se combinan `permissionMode`, las reglas de `settings.json` y los hooks.

## Por qué importa

Un subagente trabaja con cierta autonomía, a menudo en segundo plano y leyendo contenido que tú no has revisado (webs, logs, issues). Limitar lo que puede hacer reduce el impacto de errores y de *prompt injection*. Además, menos herramientas = decisiones más enfocadas.

## Capa 1: qué herramientas tiene

### Por defecto

Un subagente hereda las herramientas integradas y MCP de la conversación principal, menos algunas que nunca tienen los subagentes (por ejemplo preguntar al usuario con `AskUserQuestion` o entrar/salir del modo plan). Los subagentes en **segundo plano** tienen un conjunto algo más reducido.

### Lista blanca: `tools`

```markdown
---
name: investigador
description: Investiga código sin modificar nada.
tools: Read, Grep, Glob
---
```

Solo puede leer y buscar. Ni editar, ni ejecutar comandos, ni usar MCP.

### Lista negra: `disallowedTools`

```markdown
---
name: implementador-sin-red
description: Implementa cambios sin acceso a la web ni a GitHub.
disallowedTools: WebFetch, WebSearch, mcp__github
---
```

Hereda todo excepto lo indicado. Si usas ambos campos, primero se aplica `disallowedTools` y luego `tools` sobre lo que queda.

### Patrones de MCP

| Entrada | Efecto |
|---|---|
| `mcp__github` o `mcp__github__*` | Todas las herramientas del servidor `github` |
| `mcp__github__get_issue` | Solo esa herramienta |
| `mcp__*` (en `disallowedTools`) | Quita todas las herramientas MCP |

```markdown
---
name: triador-issues
description: Clasifica y etiqueta issues de GitHub.
tools: mcp__github__list_issues, mcp__github__get_issue, mcp__github__add_labels, Read
model: haiku
---
```

!!! warning "tools/disallowedTools trabajan con herramientas completas"
    Poner `Bash` concede Bash entero; y `Bash(git push *)` en `disallowedTools` elimina **todo** Bash. Para permitir Bash pero bloquear ciertos comandos, usa reglas `deny` en `settings.json` (capa 3).

## Capa 2: servidores MCP exclusivos del subagente

Con `mcpServers` puedes dar a un subagente servidores que **no están** en la conversación principal. Ventaja doble: la sesión principal no carga sus herramientas (menos contexto) y solo ese subagente puede usarlas.

```markdown
---
name: probador-navegador
description: Prueba flujos de la aplicación en un navegador real y hace capturas.
mcpServers:
  - playwright:
      type: stdio
      command: npx
      args: ["-y", "@playwright/mcp@latest"]
  - github
tools: Read, mcp__playwright, mcp__github__create_issue
---
Navega por la app en http://localhost:3000, ejecuta el flujo indicado,
haz capturas de cada paso y, si algo falla, crea un issue con los detalles.
```

- Las entradas pueden ser **definiciones en línea** (mismo formato que `.mcp.json`) o el **nombre** de un servidor ya configurado.
- Los servidores en línea de un agente del proyecto solo se cargan cuando has **confiado** en la carpeta.
- Las restricciones de la organización y `--strict-mcp-config`/`--bare` también aplican.

!!! note "Plugins"
    Por seguridad, los subagentes que vienen en **plugins** ignoran `hooks`, `mcpServers` y `permissionMode`. Si los necesitas, copia el agente a `.claude/agents/`.

## Capa 3: reglas de permisos (settings.json)

Las reglas `allow`/`ask`/`deny` de tus `settings.json` se aplican **también a los subagentes**. Es la forma correcta de afinar comandos:

```json
{
  "permissions": {
    "allow": ["Bash(npm test *)", "Bash(git diff *)"],
    "deny": ["Bash(git push *)", "Bash(rm -rf *)", "Read(./.env*)"]
  }
}
```

Y para controlar **qué subagentes** se pueden usar:

```json
{
  "permissions": {
    "deny": ["Agent(general-purpose)", "Agent(experimentador)"],
    "ask": ["Agent(model:opus)"]
  }
}
```

## Capa 4: modo de permisos del subagente

`permissionMode` fija el modo en que trabaja el subagente (`default`, `acceptEdits`, `auto`, `dontAsk`, `plan`, `bypassPermissions`). Cómo se combina con la sesión:

| Modo de la conversación principal | Qué modo usa el subagente |
|---|---|
| `bypassPermissions`, `acceptEdits` o `auto` | **El de la sesión** (se ignora el del subagente) |
| `default` (Manual), `dontAsk` o `plan` | El que declare el subagente (excepto `bypassPermissions`, que no se concede) |

Ejemplo útil: un subagente de solo lectura en `plan`, o uno de CI en `dontAsk` que solo usa lo preaprobado.

```markdown
---
name: auditor
description: Audita el repositorio sin cambiar nada.
permissionMode: plan
tools: Read, Grep, Glob, Bash
---
```

Los subagentes en segundo plano muestran sus peticiones de permiso en tu sesión principal.

## Capa 5: hooks por subagente

Los hooks del *frontmatter* de un subagente solo están activos **mientras ese subagente trabaja**:

```markdown
---
name: operador-bd
description: Ejecuta consultas de mantenimiento en la BD de desarrollo.
tools: Bash, Read
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/solo-bd-dev.sh"
---
```

Además, los hooks definidos en tus `settings.json` se ejecutan también dentro de los subagentes, y existen los eventos `SubagentStart` y `SubagentStop` para reaccionar a su ciclo de vida (por ejemplo, registrar qué subagentes se lanzan o validar su resultado).

## Capa 6: quién puede lanzar a quién

Cuando ejecutas una sesión entera como un agente (`claude --agent coordinador`), puedes limitar qué subagentes puede lanzar con la sintaxis `Agent(tipo)` en `tools`:

```markdown
---
name: coordinador
description: Coordina trabajo entre agentes especializados.
tools: Agent(investigador, ejecutor-tests), Read, Bash
---
```

Solo podrá delegar en `investigador` y `ejecutor-tests`. Sin `Agent` en la lista, no puede delegar en nadie.

## Plantilla de mínimo privilegio

| Tipo de subagente | tools | Modelo | Otros |
|---|---|---|---|
| Investigador | `Read, Grep, Glob` | haiku/sonnet | — |
| Revisor | `Read, Grep, Glob, Bash` + deny de escritura en settings | opus | `permissionMode: plan` |
| Ejecutor de tests | `Bash, Read` | haiku | allow `Bash(npm test *)` |
| Implementador | Hereda, `disallowedTools: WebFetch, mcp__*` | sonnet | `isolation: worktree` opcional |
| Integración externa | Solo las herramientas MCP necesarias | haiku/sonnet | `mcpServers` en línea |

## Resumen

- `tools`/`disallowedTools` deciden qué herramientas (y servidores MCP) tiene cada subagente.
- `mcpServers` da servidores exclusivos sin cargarlos en la sesión principal.
- Las reglas de `settings.json` y los hooks se aplican también a subagentes; úsalos para filtrar comandos.
- `permissionMode` del subagente solo manda si la sesión está en Manual, dontAsk o plan.

## Ejercicios

1. Convierte uno de tus subagentes en "solo lectura" con `tools` y comprueba que no puede editar.
2. Crea un subagente con un servidor MCP en línea (p. ej. Playwright) y verifica con `/context` que la sesión principal no carga sus herramientas.
3. Añade una regla `deny` de Bash y comprueba que también bloquea al subagente.
4. Añade un hook `SubagentStop` que registre en un log el nombre de cada subagente que termina.

## Referencias

- [Subagentes: controlar capacidades](https://code.claude.com/docs/en/sub-agents#control-subagent-capabilities)
- [Permisos](https://code.claude.com/docs/en/permissions)
- [Hooks: SubagentStart/SubagentStop](https://code.claude.com/docs/en/hooks)
