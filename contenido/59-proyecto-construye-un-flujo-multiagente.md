---
titulo: "Proyecto de portafolio: construye un flujo multiagente"
resumen: Proyecto final del curso - diseñar, implementar y empaquetar como plugin un flujo de trabajo con varios subagentes especializados, orquestados en paralelo y en cadena, con skills, hooks de control, permisos de mínimo privilegio y ejecución en CI.
---

## El reto

Construye un **flujo multiagente** que resuelva un problema real y recurrente de tu equipo, y empaquétalo como **plugin** para que cualquiera pueda usarlo con un comando.

Elige uno de estos escenarios (o propón el tuyo):

| Escenario | Descripción |
|---|---|
| **A. Revisión de PR multiexperto** | Especialistas en seguridad, rendimiento, tests y convenciones revisan en paralelo; un verificador confirma hallazgos; se publica un resumen en el PR |
| **B. Triage de incidentes** | Un agente recoge errores (Sentry/logs), otros investigan causas en paralelo por servicio, otro propone correcciones con tests |
| **C. Migración asistida** | Un investigador inventaría usos de una API obsoleta, implementadores migran lotes en worktrees aislados, un ejecutor de tests valida, un coordinador informa |
| **D. Documentación viva** | Agentes por módulo generan/actualizan docs a partir del código; un revisor comprueba exactitud; se abre un PR |

A continuación se detalla el escenario **A** como guía; adapta la estructura a tu elección.

## Criterios de éxito

| # | Criterio |
|---|---|
| 1 | Al menos **4 subagentes** con roles claros, descripciones precisas y prompts con formato de salida |
| 2 | **Mínimo privilegio**: cada agente con solo las herramientas que necesita; modelo adecuado a su rol |
| 3 | Orquestación con **paralelismo** (fan-out/fan-in) **y** al menos un paso en **cadena** (p. ej. verificación) |
| 4 | Una **skill/comando** de entrada con argumentos que dispara el flujo |
| 5 | Al menos un **hook** de control (seguridad, calidad o registro) |
| 6 | Todo empaquetado como **plugin** validado, en un **marketplace** (local o remoto) |
| 7 | Ejecución **en CI** o en modo headless demostrada |
| 8 | Documentación: arquitectura, uso, coste medido y limitaciones |

## Fase 1: diseño (30 min)

Dibuja el flujo antes de escribir nada:

```text
/revision-completa <PR>
        │
        ▼
  [coordinador] ── obtiene diff y contexto del PR
        │
        ├──► revisor-seguridad   (opus, solo lectura)   ┐
        ├──► revisor-rendimiento (sonnet, solo lectura) ├─ en paralelo
        ├──► revisor-tests       (sonnet, lectura+bash) │
        └──► revisor-convenciones(haiku, solo lectura)  ┘
        │
        ▼
  [verificador] (opus) ── confirma cada hallazgo contra el código real
        │
        ▼
  Resumen priorizado ── (opcional) comentario en el PR
```

Para cada agente define: responsabilidad, entradas, salida exacta, herramientas, modelo.

## Fase 2: los subagentes (60 min)

Estructura del plugin:

```text
revision-multiagente/
├── .claude-plugin/plugin.json
├── agents/
│   ├── revisor-seguridad.md
│   ├── revisor-rendimiento.md
│   ├── revisor-tests.md
│   ├── revisor-convenciones.md
│   └── verificador.md
├── skills/
│   └── revision-completa/SKILL.md
├── hooks/hooks.json
├── scripts/
│   └── registrar-subagente.sh
└── README.md
```

Ejemplo de especialista (`agents/revisor-rendimiento.md`):

```markdown
---
name: revisor-rendimiento
description: Revisa un diff buscando problemas de rendimiento (consultas N+1, bucles costosos, falta de paginación, trabajo síncrono bloqueante). Úsalo en revisiones de PR.
tools: Read, Grep, Glob
model: sonnet
maxTurns: 20
---
Eres especialista en rendimiento de backend y frontend.
Recibirás un diff y la lista de archivos cambiados.
1. Lee el contexto necesario alrededor de cada cambio.
2. Busca: consultas en bucle (N+1), ausencia de índices evidentes, carga de
   colecciones completas sin paginar, trabajo pesado en el hilo principal,
   renders innecesarios, cachés invalidadas en exceso.
3. Reporta SOLO problemas con impacto plausible.

Formato (máx. 25 líneas):
- `RENDIMIENTO | severidad (alta/media/baja) | archivo:línea | problema | corrección`
- Si no hay hallazgos: `RENDIMIENTO | sin hallazgos`
```

El verificador (`agents/verificador.md`):

```markdown
---
name: verificador
description: Verifica hallazgos de revisión contra el código real y descarta falsos positivos.
tools: Read, Grep, Glob
model: opus
---
Recibirás una lista de hallazgos de varios revisores. Para cada uno:
1. Abre el archivo y la línea citados y comprueba que el problema existe.
2. Clasifica: CONFIRMADO, DUDOSO (explica qué falta) o DESCARTADO (explica por qué).
3. Fusiona duplicados.
Devuelve solo CONFIRMADOS y DUDOSOS, ordenados por severidad, en una tabla.
```

## Fase 3: la skill de entrada (30 min)

`skills/revision-completa/SKILL.md`:

```markdown
---
name: revision-completa
description: Revisión multiexperto de un pull request con verificación de hallazgos.
argument-hint: "[número-de-PR]"
disable-model-invocation: true
allowed-tools: Bash(gh pr diff *) Bash(gh pr view *)
---
## Contexto del PR #$0
!`gh pr view $0 --json title,body,files --jq '.title + "\n\n" + .body + "\n\nArchivos:\n" + ([.files[].path] | join("\n"))'`

## Instrucciones
1. Obtén el diff con `gh pr diff $0`.
2. Lanza EN PARALELO a estos subagentes, pasando a cada uno el diff y la lista
   de archivos: revisor-seguridad, revisor-rendimiento, revisor-tests,
   revisor-convenciones.
3. Cuando terminen todos, pasa la unión de sus hallazgos al subagente verificador.
4. Presenta el resultado final:
   - Línea resumen: `N confirmados (X altos, Y medios, Z bajos), M dudosos`.
   - Tabla de hallazgos confirmados.
   - Sección de dudosos.
5. No edites archivos. No publiques nada en el PR salvo que el usuario lo pida.
```

## Fase 4: hooks de control (20 min)

Un registro de qué subagentes se lanzan y cuándo terminan, útil para medir coste y tiempo:

`hooks/hooks.json`:

```json
{
  "hooks": {
    "SubagentStart": [
      { "hooks": [{ "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}/scripts/registrar-subagente.sh\" inicio" }] }
    ],
    "SubagentStop": [
      { "hooks": [{ "type": "command", "command": "\"${CLAUDE_PLUGIN_ROOT}/scripts/registrar-subagente.sh\" fin" }] }
    ]
  }
}
```

`scripts/registrar-subagente.sh`:

```bash
#!/usr/bin/env bash
# Registra inicio/fin de subagentes en un JSONL dentro del directorio de datos del plugin.
evento="$1"
destino="${CLAUDE_PLUGIN_DATA:-$HOME/.claude}/subagentes.jsonl"
mkdir -p "$(dirname "$destino")"
jq -c --arg e "$evento" '{t: (now|todate), evento: $e, sesion: .session_id, agente: .agent_type}' >> "$destino"
exit 0
```

Además, en el `settings.json` del proyecto (no en el plugin), asegura que ningún agente puede escribir:

```json
{ "permissions": { "deny": ["Bash(git push *)", "Bash(gh pr merge *)"] } }
```

## Fase 5: empaquetar, validar y distribuir (30 min)

```bash
claude plugin validate ./revision-multiagente
claude --plugin-dir ./revision-multiagente      # prueba local
```

```text
/revision-multiagente:revision-completa 123
```

Añádelo a tu marketplace (lección 58) e instálalo desde él.

## Fase 6: ejecución en CI (30 min)

Workflow de GitHub Actions que ejecuta el flujo en cada PR listo para revisión:

```yaml
name: Revisión multiagente
on:
  pull_request:
    types: [opened, ready_for_review, synchronize]

jobs:
  revisar:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
      id-token: write
    steps:
      - uses: actions/checkout@v6
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          plugin_marketplaces: "https://github.com/acme/claude-plugins.git"
          plugins: "revision-multiagente@acme"
          prompt: "/revision-multiagente:revision-completa ${{ github.event.pull_request.number }} y publica el resultado final como comentario del PR con gh pr comment."
          claude_args: '--max-turns 60 --allowedTools "Read,Grep,Glob,Agent,Bash(gh pr diff *),Bash(gh pr view *),Bash(gh pr comment *)"'
```

O en modo headless local:

```bash
claude -p "/revision-multiagente:revision-completa 123" --output-format json \
  | jq '{resultado: .result, coste: .total_cost_usd}'
```

## Fase 7: medir y documentar (30 min)

Ejecuta el flujo sobre 3 PRs reales y registra:

| PR | Hallazgos confirmados | Falsos positivos descartados | Tiempo | Coste |
|---|---|---|---|---|
| #… | … | … | … | … |

Compara con una revisión de un solo agente (`/review high`). ¿Aporta más valor? ¿Compensa el coste?

`README.md` del plugin:

- Qué hace y para quién.
- Diagrama del flujo.
- Instalación y uso (`/revision-multiagente:revision-completa <PR>`).
- Agentes, modelos y herramientas de cada uno (y por qué).
- Coste y tiempo típicos medidos.
- Limitaciones conocidas y cómo desactivarlo.

## Rúbrica final

| Aspecto | Básico | Bueno | Excelente |
|---|---|---|---|
| Diseño | Agentes sin roles claros | Roles y salidas definidos | Diagrama, contratos de entrada/salida, justificación de modelos |
| Mínimo privilegio | Herramientas por defecto | `tools` acotados | Herramientas, modelos y reglas deny coherentes con cada rol |
| Orquestación | Secuencial | Paralelo | Paralelo + cadena de verificación + formato de síntesis |
| Empaquetado | Archivos sueltos | Plugin validado | Plugin en marketplace, versionado, con README y CHANGELOG |
| Automatización | Manual | Headless | CI con permisos mínimos y límites |
| Evaluación | Sin medir | Probado en un PR | Métricas en varios PRs y comparación con alternativa simple |

## Cierre del curso

Con este proyecto has recorrido todo el camino: instalación y sesiones, `CLAUDE.md` y permisos, planificación y modelos, Git, MCP y CLIs, skills, comandos y hooks, subagentes y plugins. El siguiente paso es convertirlo en hábito: cada vez que repitas algo, pregúntate si debería ser una regla, una skill, un hook, un agente o un plugin.

## Referencias

- [Subagentes](https://code.claude.com/docs/en/sub-agents) · [Skills](https://code.claude.com/docs/en/skills) · [Hooks](https://code.claude.com/docs/en/hooks)
- [Plugins](https://code.claude.com/docs/en/plugins/overview) · [Marketplaces](https://code.claude.com/docs/en/plugins/create-marketplace)
- [GitHub Actions](https://code.claude.com/docs/en/github-actions) · [Workflows dinámicos](https://code.claude.com/docs/en/workflows)
