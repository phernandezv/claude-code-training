---
titulo: "Por qué ayudan los subagentes en paralelo: higiene del contexto y velocidad"
resumen: Las dos ganancias de paralelizar con subagentes - contexto limpio y menor tiempo total - cuándo las tareas son paralelizables, cómo pedir investigación en paralelo, límites de concurrencia y profundidad, coste real en tokens y errores comunes.
---

## Objetivos de la lección

- Entender las dos ventajas del paralelismo: **contexto** y **tiempo**.
- Reconocer tareas que se pueden paralelizar (y las que no).
- Pedir investigación en paralelo de forma eficaz.
- Conocer los límites y el coste real.

## Ventaja 1: higiene del contexto

Imagina que necesitas entender tres módulos (autenticación, facturación y notificaciones) antes de un cambio transversal.

**Secuencial en la conversación principal**: Claude lee ~30 archivos de cada módulo. Tu contexto acaba con cientos de miles de tokens de código leído, la mayoría irrelevante para la decisión final.

**Con tres subagentes**: cada uno lee su módulo en su propio contexto y devuelve un resumen de ~1 página. Tu contexto solo recibe **tres resúmenes**.

```text
Principal ──┬─► Subagente A (auth)          ─┐
            ├─► Subagente B (facturación)   ─┼─► 3 resúmenes ─► Síntesis
            └─► Subagente C (notificaciones)─┘
```

Resultado: la conversación principal sigue ágil, barata por mensaje y centrada en decidir.

## Ventaja 2: velocidad

Los subagentes en paralelo trabajan **a la vez**. Si cada investigación tarda 3 minutos, tres en paralelo tardan ~3 minutos en total en lugar de ~9. Además, mientras corren en segundo plano, tú puedes seguir trabajando.

## ¿Qué tareas se pueden paralelizar?

Una tarea es buena candidata si sus partes son **independientes**: ninguna necesita el resultado de otra y no editan los mismos archivos.

| Paralelizable ✅ | No paralelizable ❌ |
|---|---|
| Investigar módulos distintos | Paso B necesita el resultado de A |
| Revisar un PR desde varios ángulos (seguridad, rendimiento, tests) | Varios agentes editando el mismo archivo |
| Buscar usos de una API en distintos paquetes de un monorepo | Diseño que requiere una visión única y coherente |
| Migrar archivos independientes con el mismo patrón | Cambios con dependencias fuertes entre sí |
| Comparar librerías alternativas | Depurar un bug con una sola hipótesis activa |

## Cómo pedirlo

Sé explícito sobre **qué** va a cada subagente y **qué formato** quieres de vuelta:

```text
> Investiga en paralelo, con un subagente por área, cómo se gestionan hoy los
  errores en: (1) src/http, (2) src/services, (3) src/jobs.
  Cada uno debe devolver: patrón usado, ejemplos con archivo:línea, e
  inconsistencias. Máximo 20 líneas por área. Después sintetiza una propuesta
  de patrón único.
```

```text
> Revisa este PR con tres subagentes en paralelo: uno de seguridad, uno de
  rendimiento y uno de cobertura de tests. Luego une los hallazgos,
  elimina duplicados y ordénalos por severidad.
```

!!! tip "Pide resúmenes, no volcados"
    Los resultados de los subagentes **sí** vuelven a tu contexto. Si cada uno devuelve 3.000 líneas, pierdes la ventaja. Limita la extensión y pide solo lo que necesitas para decidir.

## Límites

| Límite | Por defecto | Ajuste |
|---|---|---|
| Subagentes simultáneos en una sesión | 20 | Variable de entorno correspondiente (ver docs) |
| Profundidad de anidación (subagentes que lanzan subagentes) | 3 niveles bajo la conversación principal | `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` (`1` desactiva la anidación) |

Si se alcanza el límite de concurrencia, lanzar otro subagente falla y Claude debe esperar a que terminen los activos.

## El coste real

Paralelizar **no ahorra tokens totales**; a menudo gasta más:

- Cada subagente hace sus propias peticiones y lee sus propios archivos.
- Un subagente que empieza de cero puede releer cosas que la conversación principal ya conocía.

Lo que ahorras es **contexto en la conversación principal** (mensajes siguientes más baratos y enfocados) y **tiempo**. Merece la pena cuando:

- La investigación es voluminosa.
- Las partes son realmente independientes.
- El tiempo importa.

Para reducir coste: usa modelos más baratos en subagentes de búsqueda (lección 52) y acota bien cada encargo.

## Errores comunes

| Error | Consecuencia | Solución |
|---|---|---|
| Encargos vagos ("mira el backend") | Subagentes que leen todo | Áreas y preguntas concretas |
| Sin formato de respuesta | Resúmenes largos e inconsistentes | Especifica estructura y longitud |
| Paralelizar tareas dependientes | Resultados contradictorios o rehacer trabajo | Encadena en secuencia |
| Varios subagentes editando lo mismo | Conflictos y cambios pisados | Reparte archivos o usa worktrees aislados (lección 54) |
| Paralelizar lo trivial | Más coste y latencia | Hazlo directamente |

## Más allá de los subagentes

Si el trabajo en paralelo es muy grande o largo:

- **Sesiones en paralelo** con worktrees (`claude -w`, lección 27).
- **Sesiones en segundo plano** (`/background`, `claude agents`).
- **Equipos de agentes** y **workflows dinámicos**, que coordinan muchos agentes (lección 54).

## Resumen

- Paralelo = contexto principal limpio + menos tiempo total.
- Solo para partes independientes; pide resúmenes acotados.
- No ahorra tokens totales; acota encargos y usa modelos adecuados.
- Límites de concurrencia (20) y profundidad (3 por defecto).

## Ejercicios

1. Pide una investigación de tres áreas de tu repo en paralelo con formato de respuesta fijo. Mide el tiempo y revisa `/context`.
2. Repite la misma investigación en la conversación principal sin subagentes y compara.
3. Identifica en tu backlog una tarea paralelizable y otra que no lo sea, y justifica por qué.

## Referencias

- [Subagentes: patrones comunes](https://code.claude.com/docs/en/sub-agents#common-patterns)
- [Gestionar costes](https://code.claude.com/docs/en/costs)
