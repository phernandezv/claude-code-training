---
titulo: Equipos de agentes y workflows dinámicos
resumen: Dos niveles por encima de los subagentes - equipos de agentes (sesiones que colaboran con una lista de tareas compartida y mensajes directos, experimental) y workflows dinámicos (un script que orquesta decenas de subagentes, reanudable y guardable como comando). Cuándo usar cada uno, coste y control.
---

## Objetivos de la lección

- Entender qué aportan los **equipos de agentes** y los **workflows dinámicos** frente a los subagentes.
- Activar y dirigir un equipo de agentes.
- Ejecutar, vigilar y guardar un workflow.
- Elegir la herramienta adecuada según tamaño, coordinación y coste.

## El mapa de la orquestación

| | Subagentes | Equipos de agentes | Workflows dinámicos |
|---|---|---|---|
| **Qué es** | Trabajadores que lanza Claude en tu sesión | Un líder que coordina varias sesiones "compañeras" | Un script que ejecuta muchos subagentes |
| **Quién decide el siguiente paso** | Claude, turno a turno | El líder, turno a turno | El script |
| **Comunicación** | Devuelven un resultado a quien los lanzó | Se envían mensajes entre ellos y comparten lista de tareas | Variables del script |
| **Escala típica** | Unos pocos por turno | Un puñado de compañeros de larga duración | Decenas o cientos de agentes |
| **Si lo interrumpes** | Se reinicia el turno | Los compañeros siguen | Reanudable en la misma sesión |
| **Coste** | Moderado | Alto | Alto (proporcional al número de agentes) |

Regla práctica: **empieza por subagentes** (lecciones 54–59). Sube de nivel solo cuando el trabajo lo pida.

## Equipos de agentes

Un equipo es un grupo de **instancias de Claude Code** que trabajan juntas: una sesión actúa como **líder** (reparte tareas y sintetiza) y los **compañeros** trabajan cada uno con su propio contexto, **reclaman tareas** de una lista compartida y **se escriben entre ellos**.

!!! warning "Experimental"
    Los equipos de agentes están desactivados por defecto. Se activan con la variable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` (en tu entorno o en el `env` de `settings.json`) y requieren una sesión interactiva.

```json
{
  "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" }
}
```

### Cuándo compensan

- **Investigación y revisión** desde varios ángulos que se discuten y se contrastan entre sí.
- **Depuración con hipótesis en competencia**: cada compañero prueba una teoría y comparten lo que descubren.
- **Funcionalidades con partes independientes** (frontend, backend, tests), cada una con su dueño.

No compensan para tareas secuenciales, ediciones del mismo archivo o trabajo con muchas dependencias.

### Cómo se usan

Describe el equipo en lenguaje natural:

```text
> Crea un equipo de tres para decidir cómo implementar la exportación de datos:
  uno centrado en experiencia de usuario, otro en arquitectura y rendimiento,
  y otro que haga de abogado del diablo. Que debatan y me traigan una
  recomendación común con los puntos de desacuerdo.
```

- Los compañeros aparecen en un panel bajo el cuadro de entrada: flechas para seleccionar, `Enter` para ver su transcripción y escribirle directamente.
- Con tmux o iTerm2 puedes ver a cada compañero en su propio panel dividido (ajuste `teammateMode`, o `--teammate-mode auto`).
- Puedes pedir que planifiquen antes de implementar, reasignar tareas o cerrar compañeros.
- Puedes reutilizar tus **definiciones de subagentes** como tipos de compañero.

### Control de calidad con hooks

| Evento | Uso |
|---|---|
| `TeammateIdle` | Antes de que un compañero quede inactivo; con código 2 le devuelves feedback y sigue trabajando |
| `TaskCreated` | Validar tareas nuevas (código 2 impide crearla) |
| `TaskCompleted` | Validar antes de marcar una tarea como hecha (p. ej. exigir tests en verde) |

### Buenas prácticas

- Da a cada compañero **contexto suficiente** en el encargo: no ven tu conversación.
- Equipos **pequeños** (3–5) y tareas de tamaño razonable.
- Evita que dos compañeros editen los mismos archivos.
- Empieza por equipos de **investigación y revisión** antes que de implementación.
- Vigila y dirige: los equipos consumen muchos tokens.

## Workflows dinámicos

Un **workflow** es un script que Claude escribe para orquestar muchos subagentes (en fases, en paralelo, con verificación cruzada). Un entorno de ejecución lo corre **en segundo plano** mientras tu sesión sigue disponible. Útil para:

- Auditar todo un código buscando el mismo problema.
- Migraciones de cientos de archivos.
- Investigación con fuentes contrastadas.
- "Sigue corrigiendo hasta que pase este check".

### Probar uno incluido

```text
/deep-research ¿Qué cambió en el modelo de permisos de Node.js entre la v20 y la v22?
```

Reparte búsquedas por varios ángulos, contrasta las fuentes y devuelve un informe con citas, descartando lo que no se sostiene.

### Pedir uno para tu tarea

```text
> Escribe un workflow que revise todos los archivos de src/api/ buscando
  endpoints sin validación de entrada: un agente por archivo, un verificador
  que confirme cada hallazgo y un resumen final agrupado por severidad.
```

Antes de ejecutarlo, Claude te muestra el plan para que lo apruebes.

También existe el nivel de esfuerzo **ultracode** (`/effort ultracode`), en el que Claude decide por sí mismo cuándo orquestar un workflow para tareas sustanciales.

### Vigilar y guardar

```text
/workflows
```

- Lista los workflows en curso y terminados; selecciona uno para ver sus fases, número de agentes, tokens y tiempo.
- Pulsa `s` para **guardar** el script como comando reutilizable:
  - `.claude/workflows/` → compartido con el equipo en el repo.
  - `~/.claude/workflows/` → solo para ti, en todos tus proyectos.
- Se ejecutará después como `/<nombre>`. También se pueden distribuir en plugins.

## Coste y control

- Equipos y workflows **multiplican el consumo**: cada agente tiene su contexto y sus peticiones.
- Úsalos cuando el valor lo justifique (auditorías grandes, decisiones importantes, migraciones).
- Mide con `/usage` y revisa el detalle de tokens por fase en `/workflows`.
- Combina con permisos, hooks y, para trabajos desatendidos grandes, sandbox o contenedores.

## Resumen

- Subagentes → equipos de agentes → workflows: más coordinación y escala, más coste.
- Equipos (experimental): líder + compañeros con lista de tareas compartida y mensajes; ideales para debatir y revisar.
- Workflows: scripts que orquestan decenas de agentes, reanudables y guardables como comandos.

## Ejercicios

1. Ejecuta `/deep-research` sobre una duda técnica real y revisa el informe y el progreso en `/workflows`.
2. Pide un workflow para auditar un patrón en tu repo, apruébalo y guárdalo como comando.
3. Si puedes activar los equipos experimentales, crea un equipo de revisión de tres compañeros sobre un PR y compara con la revisión multiagente de la lección 67.

## Referencias

- [Equipos de agentes](https://code.claude.com/docs/en/agent-teams)
- [Workflows dinámicos](https://code.claude.com/docs/en/workflows)
- [Subagentes](https://code.claude.com/docs/en/sub-agents)
