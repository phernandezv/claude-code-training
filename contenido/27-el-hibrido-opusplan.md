---
titulo: El híbrido opusplan
resumen: Cómo funciona el alias opusplan (Opus en modo plan, Sonnet al ejecutar), cómo activarlo, cuándo compensa, sus matices de contexto y caché, y alternativas como el advisor o combinar modelos con subagentes.
---

## Objetivos de la lección

- Entender qué hace `opusplan` y por qué existe.
- Activarlo en una sesión, al arrancar o por defecto.
- Saber cuándo compensa y cuándo no.
- Conocer alternativas para combinar modelos.

## La idea

En el flujo explorar → planificar → implementar (lección 22), las fases tienen necesidades distintas:

- **Planificar** exige razonamiento: entender el código, evaluar alternativas, anticipar riesgos. Aquí brilla **Opus**.
- **Implementar un plan claro** es más mecánico: escribir código siguiendo pasos concretos. **Sonnet** lo hace muy bien, más rápido y más barato.

`opusplan` automatiza esa combinación:

| Fase | Modelo |
|---|---|
| Modo plan (`⏸ plan mode on`) | `opus` |
| Cualquier otro modo (ejecución) | `sonnet` |

No tienes que cambiar de modelo a mano: al aprobar el plan y salir del modo plan, Claude Code pasa a Sonnet; si vuelves a planificar, vuelve a Opus.

## Activarlo

```text
/model opusplan
```

```bash
claude --model opusplan --permission-mode plan
```

```json
{
  "model": "opusplan"
}
```

## Un flujo típico

```bash
claude --model opusplan --permission-mode plan -n cache-productos
```

```text
(plan mode · Opus)
> Las páginas de producto tardan 2 s. Investiga dónde se va el tiempo y
  propón una estrategia de caché. Considera invalidación al editar productos.

  (Opus explora, mide, propone: caché en Redis con TTL + invalidación por
   evento "product.updated", con pasos, riesgos y tests)

> [No, keep planning] Usa la librería de caché que ya tenemos en src/lib/cache.ts.

> [Yes, and use auto mode]

(ejecución · Sonnet)
  (implementa pasos, ejecuta tests, resume)
```

## Cuándo compensa

| Compensa | No compensa tanto |
|---|---|
| Funcionalidades medianas/grandes con plan explícito | Cambios triviales (no hay fase de plan) |
| Equipos que usan el modo plan de forma habitual | Tareas donde la dificultad está en la implementación (algoritmos complejos, bugs sutiles que aparecen al programar) |
| Optimizar coste manteniendo buenos diseños | Sesiones donde alternas plan/ejecución constantemente |

!!! tip "Si la implementación se complica"
    Si en la fase de ejecución Sonnet se atasca, puedes volver a modo plan (`Shift+Tab` o `/plan`) para que Opus replantee, o cambiar temporalmente a `/model opus`.

## Matices

- **Caché**: cada modelo tiene su propia caché de prompts. El primer mensaje tras cambiar de fase no aprovecha la caché del otro modelo. Por eso conviene tener **pocas transiciones** plan ↔ ejecución, no decenas.
- **Contexto**: cada fase usa la ventana de contexto de su modelo.
- **Planificar a fondo, ejecutar ligero**: puedes combinar `opusplan` con la opción de **aprobar y limpiar contexto** (`showClearContextOnPlanAccept`, lección 24) para que Sonnet arranque solo con el plan.
- **Restricciones**: si tu organización limita modelos con `availableModels`, `opusplan` usa el Opus más reciente permitido.

## Alternativas para combinar modelos

| Técnica | Cómo funciona |
|---|---|
| `opusplan` | Cambio automático en la frontera plan/ejecución |
| Cambio manual (`/model`) | Tú decides cuándo cambiar (lección 26) |
| **Subagentes con modelo propio** | La sesión principal usa un modelo y cada subagente el suyo (p. ej. Haiku para buscar). Lección 57 |
| **Advisor** | Claude decide durante la tarea cuándo consultar a un segundo modelo, en lugar de cambiar en la frontera del plan (`/advisor`) |

## Resumen

- `opusplan` = Opus para planificar, Sonnet para ejecutar, sin cambios manuales.
- Actívalo con `/model opusplan`, `--model opusplan` o `"model": "opusplan"`.
- Ideal con un flujo de plan explícito; minimiza las transiciones para aprovechar la caché.

## Ejercicios

1. Activa `opusplan`, entra en modo plan y comprueba con `/status` qué modelo está activo; aprueba el plan y vuelve a comprobar.
2. Realiza una funcionalidad mediana con `opusplan` y otra similar solo con Opus. Compara coste en `/usage`.
3. Combina `opusplan` con `showClearContextOnPlanAccept` y observa `/context` al empezar la ejecución.

## Referencias

- [opusplan en la configuración de modelos](https://code.claude.com/docs/en/model-config#opusplan-model-setting)
- [Advisor](https://code.claude.com/docs/en/advisor)
