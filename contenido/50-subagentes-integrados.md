---
titulo: "Subagentes integrados: Explore, Plan y general-purpose"
resumen: Los subagentes que trae Claude Code - Explore (búsqueda de solo lectura con niveles de exhaustividad), Plan (investigación en modo plan) y general-purpose (tareas complejas con edición) - más los auxiliares, cómo elegirlos, sobrescribirlos y desactivarlos.
---

## Objetivos de la lección

- Conocer los subagentes integrados y para qué los usa Claude.
- Pedir explícitamente el más adecuado para cada tarea.
- Sobrescribir o desactivar uno integrado.

## Resumen rápido

| Subagente | Herramientas | Modelo | Carga `CLAUDE.md` | Para qué |
|---|---|---|---|---|
| **Explore** | Solo lectura (sin Write/Edit) | Hereda el de la sesión (con tope en Opus) | No | Buscar y entender código rápido |
| **Plan** | Solo lectura | Hereda el de la sesión | No | Investigar durante el modo plan |
| **general-purpose** | Todas las disponibles para subagentes | El de la sesión (o `CLAUDE_CODE_SUBAGENT_MODEL`) | Sí | Tareas de varios pasos que exploran **y** modifican |

Además hay auxiliares que Claude usa solo: por ejemplo el que configura la barra de estado (`/statusline`) o el que responde preguntas sobre el propio Claude Code.

## Explore

Un agente **rápido y de solo lectura** para localizar y entender código.

- No puede editar ni escribir archivos.
- Omite `CLAUDE.md` y el estado de Git para arrancar ligero y barato.
- Claude le indica un nivel de exhaustividad: **quick** (búsqueda puntual), **medium** (equilibrado) o **very thorough** (análisis completo).

Cuándo lo usa Claude: cuando necesita buscar o entender algo sin cambiar nada. Puedes pedirlo:

```text
> Con el agente Explore (muy exhaustivo), encuentra todos los puntos donde se
  calculan impuestos y dime si hay lógica duplicada.

> Explore rápido: ¿en qué archivo se define la ruta /api/checkout?
```

!!! tip "Explore más barato"
    Explore hereda el modelo de tu sesión. Si quieres que las búsquedas usen un modelo más económico, define tu propio subagente llamado `Explore` con `model: haiku` (en `.claude/agents/` o `~/.claude/agents/`): sobrescribe al integrado.

## Plan

Un agente de investigación de **solo lectura** que Claude usa en **modo plan** para reunir contexto antes de presentar el plan. Así, la exploración no llena la conversación principal, que queda limpia para discutir el plan.

No sueles invocarlo a mano: aparece cuando planificas (lecciones 18–20).

## general-purpose

Un agente capaz para **tareas complejas de varios pasos** que requieren explorar y actuar: investigar, modificar código, ejecutar comandos, interpretar resultados.

```text
> Usa un subagente general-purpose para actualizar todas las llamadas a la
  API v1 de pagos a la v2 en src/billing/, ejecutar los tests del módulo y
  devolverme un resumen de los cambios y cualquier caso dudoso.
```

Al poder editar, sus cambios se hacen en tu árbol de trabajo. Recuerda que las ediciones de subagentes **no** se deshacen con `/rewind`: trabaja con Git limpio.

## Cómo elige Claude

| Si la tarea… | Claude suele usar |
|---|---|
| Solo requiere buscar/entender | Explore |
| Es investigación dentro del modo plan | Plan |
| Requiere varios pasos y cambios | general-purpose |
| Encaja con la descripción de un subagente tuyo | Tu subagente personalizado |

Puedes forzarlo nombrándolo o con `@`.

## Reanudar subagentes

Cada invocación crea una instancia nueva. Si quieres **continuar** el trabajo de un subagente (con todo su historial), pídele a Claude que lo retome:

```text
> Continúa la revisión anterior y ahora analiza la lógica de autorización.
```

Explore y Plan son de un solo uso y no se pueden reanudar; usa general-purpose o uno personalizado si necesitas continuidad.

## Desactivar o restringir

Con reglas de permisos:

```json
{
  "permissions": {
    "deny": ["Agent(Explore)"]
  }
}
```

o al arrancar:

```bash
claude --disallowedTools "Agent(Explore)"
```

Para forzar un modelo en **todos** los subagentes, existe la variable `CLAUDE_CODE_SUBAGENT_MODEL`.

## Ejemplo de flujo combinado

```text
> Quiero migrar el cliente HTTP a fetch nativo.

  ● Agent(Explore, very thorough): localizar usos de axios y sus opciones
    → 23 usos en 11 archivos; 3 usan interceptores

  (planificas con Claude en la conversación principal)

  ● Agent(general-purpose): migrar los 8 archivos sin interceptores y
    ejecutar sus tests → hecho, 2 tests ajustados

> Los 3 con interceptores los hacemos juntos aquí, paso a paso.
```

## Resumen

- Explore: solo lectura, rápido, sin `CLAUDE.md`, con niveles de exhaustividad.
- Plan: investigación de solo lectura en modo plan.
- general-purpose: tareas de varios pasos con edición.
- Pide el adecuado por nombre o `@`; sobrescribe (`Explore` con `model: haiku`) o deniega con `Agent(...)`.

## Ejercicios

1. Pide la misma búsqueda con Explore "quick" y "very thorough". Compara tiempo y resultado.
2. Crea `~/.claude/agents/explore.md` con `name: Explore` y `model: haiku` y comprueba el cambio.
3. Delega a general-purpose un refactor mecánico acotado y revisa el diff.

## Referencias

- [Subagentes integrados](https://code.claude.com/docs/en/sub-agents#built-in-subagents)
- [Permisos: reglas Agent(...)](https://code.claude.com/docs/en/permissions)
