---
titulo: Aprobar, editar e iterar sobre un plan
resumen: Las opciones al terminar un plan (auto mode, aprobar ediciones manualmente, seguir planificando), editar el plan con Ctrl+G, iterar con feedback, limpiar el contexto al aprobar y volver a planificar a mitad de la implementación.
---

## Objetivos de la lección

- Conocer las opciones del diálogo de aprobación y qué modo activa cada una.
- Editar el plan directamente con `Ctrl+G`.
- Iterar sobre el plan con feedback preciso.
- Volver a planificar si la implementación se tuerce.

## El diálogo de aprobación

Cuando Claude termina el plan, te lo muestra y pregunta cómo seguir. Las opciones habituales son:

| Opción | Qué pasa |
|---|---|
| **Yes, and use auto mode** | Aprueba y continúa en **modo auto** (el clasificador revisa las acciones). Si auto no está disponible, aparece como *Yes, auto-accept edits* (modo `acceptEdits`) |
| **Yes, manually approve edits** | Aprueba y vuelve a **Manual**: revisarás cada edición |
| **No, keep planning** | Sigue en modo plan; escribe qué quieres cambiar |

Al aprobar, **sales del modo plan** y Claude empieza a editar según el modo elegido. Además, la sesión recibe un título automático basado en el plan (si no la habías nombrado).

!!! tip "¿Qué opción elijo?"
    - Plan claro, cambio en una rama, confías en el enfoque → **auto mode** (o auto-accept edits).
    - Código delicado o que conoces poco → **manually approve edits**.
    - Tienes dudas → **keep planning**. Es gratis comparado con deshacer.

### Aprobar y limpiar el contexto

La exploración previa al plan puede haber llenado el contexto con archivos leídos. Si activas el ajuste `showClearContextOnPlanAccept`, aparece una opción adicional que **aprueba el plan y limpia el contexto de planificación**: Claude arranca la implementación con el plan y poco más, lo que ahorra tokens en tareas largas.

```json
{
  "showClearContextOnPlanAccept": true
}
```

## Editar el plan directamente: `Ctrl+G`

Cuando el plan está casi bien pero quieres retocar detalles, pulsa **`Ctrl+G`** en el diálogo: el plan se abre en tu editor de texto (el definido en `$EDITOR`). Cambia lo que quieras, guarda y cierra; Claude continuará con tu versión.

Útil para:

- Reordenar pasos.
- Borrar un paso que sobra ("no hace falta tocar el README").
- Añadir un requisito que se te olvidó.
- Precisar un nombre de función o una ruta.

```bash
# Si no tienes editor configurado:
export EDITOR="code --wait"   # VS Code
export EDITOR="nano"          # nano
```

## Iterar con feedback

Si eliges **No, keep planning**, escribe feedback **concreto**:

| Feedback flojo | Feedback útil |
|---|---|
| "No me convence" | "No añadas una dependencia nueva; usa `csv-stringify`, que ya está en package.json" |
| "Hazlo más simple" | "Elimina el job en segundo plano: el límite de 10.000 filas permite generar el CSV en la propia petición con streaming" |
| "Falta algo" | "Falta el caso de usuarios sin permisos de exportación: devuelve 403 y añade un test" |

Tras cada ronda, vuelve a revisar el plan completo (no solo el cambio que pediste): a veces un ajuste afecta a otros pasos.

### Patrón: dos alternativas

Cuando no tienes claro el enfoque, pide que compare:

```text
> Antes de cerrar el plan, dame dos alternativas (A: job + S3, B: streaming
  directo) con pros, contras y esfuerzo estimado. Luego recomiéndame una.
```

## Durante la implementación

El plan no es un contrato inmutable. Mientras Claude implementa:

- **Vigila la lista de tareas** (`Ctrl+T`): debería reflejar los pasos del plan.
- **Interrumpe con `Esc`** si ves que se desvía, y corrige.
- Si descubres algo que invalida el plan (una dependencia inesperada, un requisito nuevo), **vuelve a planificar**:

```text
/plan Hemos descubierto que el servicio de pedidos no expone los filtros por
fecha. Replanifica los pasos 3–5 teniendo esto en cuenta.
```

O pulsa `Shift+Tab` hasta volver a `plan mode on`.

## Recuperarse de un mal plan

Si aprobaste y el resultado no es lo que querías:

1. `Esc` para detener.
2. `/rewind` (o `Esc Esc`) → vuelve al mensaje anterior a la aprobación → *Restore code and conversation*.
3. Vuelve a planificar con lo aprendido.

Recuerda: `/rewind` no deshace cambios hechos con comandos Bash; si hubo migraciones o instalaciones, revisa con `git status`.

## Hacer que el proyecto planifique por defecto

Para repos delicados, puedes hacer que las sesiones arranquen en plan:

```json
{
  "permissions": {
    "defaultMode": "plan"
  }
}
```

(en `.claude/settings.json`). En VS Code, usa el ajuste `claudeCode.initialPermissionMode: "plan"`.

## Flujo completo de ejemplo

```text
$ claude -n export-csv --permission-mode plan

> Quiero exportar pedidos a CSV desde el panel respetando los filtros. Hazme
  primero las preguntas que necesites.
  (Claude pregunta por volumen, formato de fechas, permisos…)

> Máx. 10.000 filas, fechas ISO, solo rol "manager". Propón el plan.
  (Claude presenta el plan)

> [No, keep planning] Usa streaming en la propia petición en vez de un job.
  (plan actualizado)

> [Ctrl+G] (quitas un paso sobre el README y guardas)

> [Yes, and use auto mode]
  (Claude implementa, ejecuta tests, resume)

> /diff
> Crea un commit con un mensaje convencional.
```

## Resumen

- Al aprobar eliges el modo: auto/acceptEdits o Manual; o sigues planificando.
- `Ctrl+G` abre el plan en tu editor para retocarlo.
- Feedback concreto y verificable produce mejores iteraciones.
- Puedes volver a planificar en cualquier momento con `/plan` o `Shift+Tab`.

## Ejercicios

1. Genera un plan y rechaza la primera versión con un feedback concreto. Compara ambas versiones.
2. Usa `Ctrl+G` para eliminar un paso y añadir un requisito.
3. Aprueba con *manually approve edits* y rechaza una edición concreta explicando por qué.
4. Activa `showClearContextOnPlanAccept` y compara `/context` tras aprobar con y sin limpiar.

## Referencias

- [Revisar y aprobar un plan](https://code.claude.com/docs/en/permission-modes#review-and-approve-a-plan)
- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
