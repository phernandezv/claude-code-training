---
titulo: Orquestar varios subagentes en paralelo
resumen: Patrones de orquestación - fan-out/fan-in, cadena (pipeline), especialistas con revisión cruzada, coordinador con --agent, aislamiento con worktrees, anidación, gestión con /tasks, y cuándo pasar a equipos de agentes o workflows dinámicos.
---

## Objetivos de la lección

- Aplicar los patrones básicos de orquestación: **fan-out/fan-in**, **cadena** y **revisión cruzada**.
- Evitar conflictos cuando varios subagentes editan código (worktrees).
- Construir un **coordinador** reutilizable.
- Saber cuándo escalar a equipos de agentes o workflows dinámicos.

## Patrón 1: fan-out / fan-in

Repartir trabajo independiente y luego sintetizar.

```text
> Queremos migrar los 12 endpoints de src/http/v1/ a v2. Primero lista los
  endpoints. Después lanza un subagente por cada grupo de 3 endpoints para
  migrarlos (cada uno solo toca sus archivos) y ejecuta sus tests. Al final
  une los resultados: qué se migró, qué falló y qué requiere decisión.
```

```text
          ┌─► Subagente 1 (endpoints 1-3) ─┐
Principal ├─► Subagente 2 (endpoints 4-6) ─┼─► Síntesis y siguiente paso
          ├─► Subagente 3 (endpoints 7-9) ─┤
          └─► Subagente 4 (10-12)         ─┘
```

Claves: partes **independientes**, archivos **disjuntos** y un **formato de resultado** común.

## Patrón 2: cadena (pipeline)

Cuando cada paso necesita el resultado del anterior:

```text
> 1) Usa el subagente investigador para localizar las consultas lentas del
     módulo de informes.
  2) Pasa su lista al experto-sql para proponer índices y reescrituras.
  3) Con el implementador, aplica las propuestas aprobadas y ejecuta los tests.
  Detente entre el paso 2 y el 3 para que yo apruebe.
```

La conversación principal pasa a cada subagente solo lo relevante del paso anterior.

## Patrón 3: especialistas + revisión cruzada

Varios expertos analizan lo mismo desde ángulos distintos, y otro verifica:

```text
> Revisa este PR en paralelo con: revisor-seguridad, un subagente de
  rendimiento y otro de tests. Luego lanza un subagente verificador que
  compruebe cada hallazgo contra el código real y descarte falsos positivos.
  Entrégame solo los hallazgos confirmados, ordenados por severidad.
```

La verificación reduce el ruido de los falsos positivos.

## Patrón 4: coordinador reutilizable

Guarda la orquestación como un agente para ejecutar la sesión completa en ese rol:

`.claude/agents/coordinador-migracion.md`:

```markdown
---
name: coordinador-migracion
description: Coordina migraciones grandes repartiendo el trabajo entre subagentes.
tools: Agent(investigador, implementador, ejecutor-tests), Read, Grep, Glob, Bash
model: opus
---
Eres el coordinador de una migración. Proceso:
1. Con `investigador`, inventaría todo lo que hay que migrar y agrúpalo en
   lotes independientes (archivos disjuntos).
2. Presenta el plan de lotes y espera confirmación.
3. Lanza un `implementador` por lote, en paralelo (máx. 4 a la vez).
4. Tras cada lote, usa `ejecutor-tests` sobre los archivos afectados.
5. Mantén una tabla de estado (lote, estado, incidencias) y resume al final.
Nunca edites archivos tú directamente.
```

```bash
claude --agent coordinador-migracion
```

La sintaxis `Agent(...)` en `tools` limita en quién puede delegar.

## Evitar conflictos: worktrees

Si varios subagentes **editan** a la vez, pueden pisarse. Soluciones:

1. **Repartir archivos disjuntos** (lo más simple).
2. **Aislar cada subagente en un worktree** con `isolation: worktree` en su definición (o pidiéndolo al delegar). Cada uno trabaja en una copia aislada del repo en su propia rama; tú integras después.

```markdown
---
name: implementador
description: Implementa un lote de cambios bien definido.
isolation: worktree
model: sonnet
---
```

Después, revisa e integra las ramas resultantes (merge o cherry-pick) y resuelve conflictos si los hay (lección 34).

## Anidación

Por defecto un subagente puede lanzar sus propios subagentes hasta 3 niveles por debajo de la conversación principal. Útil, por ejemplo, para un revisor que lanza un verificador por hallazgo. Ajustable con `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (`1` desactiva la anidación). Más niveles = más coste y más difícil de seguir: úsalo con moderación.

## Supervisar la ejecución

- El panel bajo el cuadro de entrada muestra los subagentes en curso (en árbol si hay anidación).
- `/tasks` lista y permite detener trabajos en segundo plano (`Ctrl+X Ctrl+K` detiene todos los subagentes en segundo plano de la sesión).
- `Ctrl+O` abre la transcripción para ver qué hizo cada uno.
- Puedes pedir a Claude que **retome** un subagente para continuar su trabajo con su historial.

## Buenas prácticas de orquestación

| Práctica | Por qué |
|---|---|
| Plan de reparto explícito antes de lanzar | Evita solapamientos y huecos |
| Formato de resultado común | Síntesis sencilla y barata |
| Límite de paralelismo razonable (3–5) | Coste controlado, más fácil de supervisar |
| Punto de aprobación humana entre fases | Detectar errores antes de que se propaguen |
| Verificación independiente | Menos falsos positivos |
| Modelos por rol (haiku buscar, opus decidir) | Coste/calidad equilibrados |

## Cuándo escalar

| Necesidad | Herramienta |
|---|---|
| Unos pocos trabajos delegados por turno | **Subagentes** (esta sección) |
| Sesiones independientes de larga duración que hablan entre sí y comparten una lista de tareas | **Equipos de agentes** (experimental; se activa con `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`; lección 60) |
| Decenas o cientos de agentes, orquestación repetible y reanudable | **Workflows dinámicos**: Claude escribe un script que orquesta subagentes y se ejecuta en segundo plano |
| Trabajo paralelo que no cabe en una sesión | Varias sesiones con worktrees o en segundo plano (`/background`, `claude agents`) |

Los equipos de agentes y los workflows consumen bastantes más tokens: resérvalos para trabajos que de verdad lo requieran.

## Resumen

- Fan-out/fan-in para partes independientes; cadena para pasos dependientes; especialistas + verificador para revisiones.
- Coordinadores como agentes con `Agent(...)` para limitar la delegación.
- Worktrees (`isolation: worktree`) para ediciones en paralelo sin conflictos.
- Supervisa con el panel, `/tasks` y `Ctrl+O`; escala a equipos o workflows solo cuando haga falta.

## Ejercicios

1. Aplica fan-out/fan-in para investigar 3–4 áreas de tu repo con formato común.
2. Monta una cadena investigador → experto → implementador con un punto de aprobación.
3. Crea un coordinador con `Agent(...)` y ejecútalo con `claude --agent`.
4. Lanza dos implementadores con `isolation: worktree` y luego integra sus ramas.

## Referencias

- [Subagentes: patrones y anidación](https://code.claude.com/docs/en/sub-agents)
- [Equipos de agentes](https://code.claude.com/docs/en/agent-teams)
- [Workflows dinámicos](https://code.claude.com/docs/en/workflows)
- [Worktrees](https://code.claude.com/docs/en/worktrees)
