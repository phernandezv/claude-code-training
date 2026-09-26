---
titulo: "Compromisos entre modelos: Opus vs. Sonnet vs. Haiku"
resumen: Qué familia de modelos usar para cada tipo de trabajo - capacidad, velocidad y coste; alias (opus, sonnet, haiku, fable, best), niveles de esfuerzo, contexto de 1M, modo rápido y una guía de decisión práctica.
---

## Objetivos de la lección

- Conocer las familias de modelos disponibles en Claude Code y sus puntos fuertes.
- Entender el triángulo **capacidad ↔ velocidad ↔ coste**.
- Usar **alias** en lugar de nombres de versión.
- Combinar modelo y **nivel de esfuerzo** (effort) según la tarea.

## Las familias

| Familia | Perfil | Úsalo para |
|---|---|---|
| **Opus** | El más capaz de uso general; mejor razonamiento en problemas complejos | Arquitectura, depuración difícil, refactors grandes, planificación |
| **Sonnet** | Excelente equilibrio calidad/velocidad/coste | La mayoría del trabajo diario de programación |
| **Haiku** | Rápido y barato | Tareas simples y acotadas, subagentes de búsqueda, clasificación, resúmenes |
| **Fable** | La gama más alta, para las tareas más difíciles y largas (según disponibilidad de tu cuenta) | Trabajos muy exigentes y de larga duración |

!!! note "Las versiones cambian"
    Los alias apuntan siempre a la versión recomendada para tu proveedor y se actualizan con el tiempo (por ejemplo, `opus` apunta hoy a Opus 5.5 y `sonnet` a Sonnet 5 en la API de Anthropic). Consulta `/model` para ver lo que tienes disponible.

## Alias de modelo

En lugar de recordar identificadores como `claude-opus-5-5`, usa alias:

| Alias | Qué selecciona |
|---|---|
| `opus` | El último Opus |
| `sonnet` | El último Sonnet |
| `haiku` | Haiku |
| `fable` | El modelo Fable de tu proveedor |
| `best` | Fable si lo tienes disponible; si no, Opus |
| `opus[1m]`, `sonnet[1m]` | Variante con ventana de contexto de 1 millón de tokens (cuando aplica) |
| `opusplan` | Opus para planificar y Sonnet para ejecutar (lección 27) |
| `default` | Vuelve al modelo por defecto de tu cuenta |

Si necesitas **fijar** una versión exacta (por ejemplo en CI, para resultados reproducibles), usa el nombre completo: `claude --model claude-opus-5-5`.

## El triángulo capacidad, velocidad, coste

- **Capacidad**: los modelos mayores resuelven mejor problemas ambiguos, con muchas piezas o que requieren razonamiento largo.
- **Velocidad**: los modelos menores responden antes; importa en iteraciones rápidas.
- **Coste**: se paga (o se consume cuota) por token de entrada y salida; los modelos mayores cuestan más por token.

Pero ojo: un modelo más capaz a veces **cuesta menos en total**, porque acierta a la primera, necesita menos vueltas y lee menos archivos innecesarios. Mide por tarea completada, no por token.

## El nivel de esfuerzo (effort)

Además del modelo, controlas **cuánto razona** en cada paso:

| Nivel | Cuándo |
|---|---|
| `low` | Tareas cortas, acotadas y sensibles a la latencia |
| `medium` | Ahorro de tokens con algo menos de profundidad (por defecto en Opus 5.5) |
| `high` | Equilibrio entre tokens e inteligencia (por defecto en la mayoría de modelos) |
| `xhigh` | Razonamiento más profundo, más gasto |
| `max` | Lo máximo; puede mejorar tareas muy exigentes pero con rendimientos decrecientes. Solo para la sesión actual |

```text
/effort high
/effort status
```

o al arrancar:

```bash
claude --model opus --effort high
```

También puedes ajustarlo en el selector de `/model` con las flechas izquierda/derecha. Y para una sola pregunta difícil, incluye la palabra **"ultrathink"** en el prompt para pedir razonamiento profundo puntual.

!!! tip "Modelo y esfuerzo son dos palancas"
    Sonnet con esfuerzo alto puede ser mejor opción que Opus con esfuerzo bajo para algunas tareas, y viceversa. Experimenta con tus tareas típicas.

## Contexto de 1 millón de tokens

Algunos modelos admiten una ventana de contexto de 1M (según plan y proveedor). Útil para sesiones muy largas o bases de código enormes. Recuerda que **más contexto no es gratis**: cada petición envía todo lo acumulado.

## Modo rápido (fast mode)

`/fast` activa una configuración de **Opus** que responde hasta ~2,5 veces más rápido, con **la misma calidad** pero un **precio por token más alto** (en suscripciones se paga con créditos de uso adicionales). Aparece un icono `↯` junto al prompt cuando está activo.

- Úsalo en depuración en vivo o iteraciones rápidas cuando la latencia importa.
- Actívalo **al principio** de la sesión: al activarlo a mitad se paga el contexto acumulado al precio del modo rápido.

## Guía de decisión

| Tarea | Recomendación |
|---|---|
| Entender un repo nuevo, diseñar una funcionalidad | Opus (o `opusplan`) |
| Implementar un plan ya aprobado | Sonnet |
| Bug difícil, intermitente, con muchas piezas | Opus, esfuerzo `high`/`xhigh` |
| Renombrar, formatear, cambios mecánicos | Sonnet o Haiku, esfuerzo `low` |
| Subagentes de búsqueda/exploración | Haiku o Sonnet |
| Scripts de CI con muchas ejecuciones | Sonnet/Haiku fijados por versión |
| Demo en directo o pair-programming rápido | Opus + `/fast` |
| Tarea larguísima y muy exigente | Fable (si disponible) o Opus con esfuerzo alto |

## Modelo de subagentes y tareas en segundo plano

Cada subagente puede tener su propio modelo (lección 57). Un patrón muy eficiente: sesión principal con Opus para razonar y subagentes con Haiku/Sonnet para buscar y leer.

## Resumen

- Opus: razonamiento; Sonnet: el caballo de batalla; Haiku: rápido y barato; Fable: lo más exigente.
- Usa alias (`opus`, `sonnet`, `haiku`) salvo que necesites fijar versión.
- El esfuerzo es la segunda palanca: `/effort`.
- Mide el coste por tarea terminada, no por token.

## Ejercicios

1. Ejecuta `/model` y anota qué modelos y precios ves.
2. Haz la misma tarea mediana con Sonnet y con Opus. Compara resultado, tiempo y coste (`/usage`).
3. Prueba una pregunta difícil con `/effort low` y luego `high`. ¿Cambia la calidad?

## Referencias

- [Configuración de modelos](https://code.claude.com/docs/en/model-config)
- [Modo rápido](https://code.claude.com/docs/en/fast-mode)
- [Modelos de Claude (plataforma)](https://platform.claude.com/docs/en/about-claude/models/overview)
