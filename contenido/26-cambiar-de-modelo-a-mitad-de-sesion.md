---
titulo: Cambiar de modelo a mitad de sesión
resumen: Todas las formas de elegir modelo (/model, Alt+P, --model, ANTHROPIC_MODEL, settings) y su prioridad, cambiar solo para la sesión o como predeterminado, efectos sobre la caché, subagentes y sesiones reanudadas, y modelos de respaldo.
---

## Objetivos de la lección

- Cambiar de modelo durante la sesión y al arrancar.
- Distinguir "solo esta sesión" de "mi modelo por defecto".
- Conocer el orden de prioridad de las distintas formas de fijar el modelo.
- Entender el efecto de cambiar de modelo sobre la caché de prompts y los subagentes.

## Cambiar durante la sesión

### `/model`

```text
/model              ← abre el selector
/model sonnet       ← cambia directamente
/model opus
/model claude-opus-5-5
```

En el selector:

| Tecla | Efecto |
|---|---|
| `Enter` | Cambia y lo **guarda como predeterminado** para sesiones nuevas |
| `s` | Cambia **solo para esta sesión** |
| `←` / `→` | Ajusta el nivel de esfuerzo del modelo seleccionado |

Escribir `/model <nombre>` equivale a `Enter` (se guarda como predeterminado).

### Atajo de teclado

`Option+P` (macOS) o `Alt+P` (Windows/Linux) abre el cambio de modelo sin escribir el comando.

## Elegir modelo al arrancar

```bash
claude --model sonnet
claude --model opus --effort high
claude -p "resume el README" --model haiku
```

`--model` solo afecta a esa sesión. Para tener **varias terminales con modelos distintos a la vez**, arranca cada una con su `--model` en lugar de cambiar con `/model` (que modifica tu predeterminado).

## Orden de prioridad

De mayor a menor:

1. `/model` durante la sesión.
2. `--model` al arrancar.
3. Variable de entorno `ANTHROPIC_MODEL`.
4. Campo `model` en `settings.json`.
5. Variable `ANTHROPIC_DEFAULT_MODEL` (predeterminado para sesiones nuevas).

Ejemplo en `settings.json` del proyecto:

```json
{
  "model": "sonnet"
}
```

Si el modelo de arranque viene de la configuración del proyecto o de la organización, la cabecera de inicio indica qué archivo lo fijó.

## Qué pasa al cambiar de modelo

### La conversación continúa

El historial se mantiene: el nuevo modelo "lee" toda la conversación y sigue desde ahí. Esto permite patrones como:

```text
/model opus
> Analiza este bug intermitente y encuentra la causa raíz.
  (Opus investiga y explica)
/model sonnet
> Perfecto. Implementa la corrección que propusiste y añade un test.
```

### La caché de prompts

Claude Code aprovecha la **caché de prompts**: el contexto que no cambia entre peticiones se cobra mucho más barato. La caché es **por modelo**, así que al cambiar de modelo la primera petición del nuevo modelo **no aprovecha la caché** y paga todo el contexto acumulado a precio completo. Por eso Claude Code puede pedirte confirmación al cambiar en sesiones con mucho contexto.

!!! tip "Cambia en los puntos naturales"
    El mejor momento para cambiar de modelo es tras un `/clear` o `/compact`, o al principio de una fase nueva (planificar → implementar), no cada dos mensajes.

### Subagentes

Los subagentes configurados para **heredar** el modelo (`model: inherit`) usarán el nuevo modelo desde ese momento. Los que tienen un modelo fijo (p. ej. `model: haiku`) no cambian.

### Sesiones reanudadas

Al reanudar (`--continue`, `--resume`), la sesión **conserva el modelo** con el que estaba, independientemente de tu predeterminado actual, salvo que pases `--model` explícitamente.

## Comprobar el modelo actual

```text
/status
```

También puedes mostrarlo siempre en la barra de estado (`/statusline`).

## Modelos de respaldo (fallback)

Si el modelo principal está sobrecargado o no disponible, puedes definir alternativas:

```bash
claude --fallback-model sonnet,haiku
```

Se prueban en orden. También existe el ajuste `fallbackModel` en `settings.json`.

## Restricciones de la organización

Los administradores pueden limitar qué modelos se usan con `availableModels` en *managed settings*. Si un modelo no aparece en `/model`, puede ser por esa política o porque tu plan no lo incluye.

## Patrones útiles

| Patrón | Cómo |
|---|---|
| Investigar con el grande, implementar con el mediano | `/model opus` → análisis → `/model sonnet` → implementación |
| Resolver un atasco | Si Sonnet da vueltas sin resolver un bug, `/model opus` + `/effort high` |
| Ahorro en tareas mecánicas | `/model haiku` para renombrados o formateo masivo |
| Automatizar el patrón | `opusplan` (lección 27) |

## Resumen

- `/model` o `Alt/Option+P` para cambiar; `s` en el selector = solo esta sesión.
- `--model` y `ANTHROPIC_MODEL` afectan a una sesión; `model` en settings es persistente.
- Cambiar de modelo invalida la caché para la siguiente petición: hazlo en puntos naturales.
- Las sesiones reanudadas mantienen su modelo.

## Ejercicios

1. Abre `/model`, elige otro modelo con `s` y comprueba con `/status`. Cierra y abre otra sesión: ¿qué modelo tiene?
2. Arranca dos terminales con `--model sonnet` y `--model opus` y dales la misma tarea.
3. Practica el patrón investigar con Opus → implementar con Sonnet en un bug real.

## Referencias

- [Configuración de modelos](https://code.claude.com/docs/en/model-config)
- [Caché de prompts](https://code.claude.com/docs/en/prompt-caching)
