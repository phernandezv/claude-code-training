---
titulo: Cómo hace Claude realmente un cambio
resumen: El bucle agéntico por dentro - herramientas, lectura antes de editar, ediciones exactas, verificación, lista de tareas y cómo deshacer con checkpoints y /rewind.
---

## Objetivos de la lección

- Entender el **bucle agéntico**: reunir contexto → actuar → verificar.
- Conocer las herramientas integradas que usa Claude y cuándo usa cada una.
- Saber cómo se aplica una edición y cómo revisarla (`/diff`, diffs en el IDE).
- Deshacer cambios con **checkpoints** (`/rewind`, `Esc Esc`) y conocer sus límites.

## El bucle agéntico

Cuando le das una tarea a Claude, no genera "la respuesta" de golpe. Recorre un ciclo:

1. **Reunir contexto**: busca archivos, lee código, ejecuta comandos de inspección.
2. **Actuar**: edita archivos, crea otros nuevos, ejecuta comandos.
3. **Verificar**: ejecuta tests, compila, lee errores… y si algo falla, **vuelve al paso 1**.

Cada llamada a una herramienta devuelve información que alimenta la siguiente decisión. Por ejemplo, ante *"arregla los tests que fallan"*:

```text
1. Bash(npm test)                  → 2 tests fallan en cart.test.ts
2. Read(tests/cart.test.ts)        → entiende qué se espera
3. Grep("applyDiscount", src/)     → localiza la función
4. Read(src/cart/discount.ts)      → encuentra el error de redondeo
5. Edit(src/cart/discount.ts)      → aplica la corrección
6. Bash(npm test)                  → todo en verde ✔
```

Tú formas parte del bucle: puedes interrumpir con `Esc` en cualquier punto y cambiar la dirección.

## Las herramientas integradas

| Categoría | Herramientas | Qué hacen |
|---|---|---|
| Lectura y búsqueda | `Read`, `Glob`, `Grep` | Leer archivos, buscar por patrón de nombre o por contenido (regex) |
| Edición | `Edit`, `Write`, `NotebookEdit` | Reemplazos exactos, crear/sobrescribir archivos, editar notebooks |
| Ejecución | `Bash` (o `PowerShell` en Windows) | Tests, builds, git, scripts… |
| Web | `WebSearch`, `WebFetch` | Buscar en internet y leer páginas/documentación |
| Orquestación | `Agent` (subagentes), `TodoWrite`/tareas, `AskUserQuestion` | Delegar trabajo, llevar una lista de tareas, preguntarte |
| Extensiones | Herramientas MCP, skills | Las que tú añadas (lecciones 31–41) |

Puedes ver cada llamada con detalle pulsando `Ctrl+O` (visor de transcripción).

## Cómo funciona una edición

La herramienta `Edit` **no reescribe el archivo entero**: reemplaza un fragmento exacto (`old_string`) por otro (`new_string`). Esto tiene consecuencias prácticas:

- Claude **debe leer el archivo antes** de editarlo, para conocer el texto exacto.
- Si el fragmento no es único o no coincide (por ejemplo, porque tú cambiaste el archivo mientras tanto), la edición falla y Claude vuelve a leer.
- Los cambios son pequeños y revisables: ves un **diff** en cada permiso.

Para archivos nuevos o reescrituras completas usa `Write`.

### Revisar los cambios

- En el diálogo de permiso ves el diff antes de aceptar (en modo `default`).
- `/diff` abre un visor con todos los cambios del árbol de trabajo, incluidos los de Claude.
- En VS Code/JetBrains, los cambios se muestran en el visor de diferencias del IDE.
- Y siempre puedes usar `git diff` (o `! git diff` dentro de la sesión).

## La lista de tareas

En tareas de varios pasos, Claude crea una **lista de tareas** (checklist) y la va marcando. Pulsa `Ctrl+T` para mostrarla u ocultarla. Es una buena señal de que ha entendido bien el alcance; si ves un paso que sobra o falta, díselo.

## Checkpoints: deshacer sin miedo

Claude Code guarda automáticamente el estado de los archivos **antes de cada prompt que envías**. Eso te permite volver atrás:

- Ejecuta **`/rewind`** (alias `/checkpoint`, `/undo`), o
- Pulsa **`Esc` `Esc`** con el cuadro de entrada vacío.

Seleccionas el mensaje al que quieres volver y eliges una acción:

| Opción | Efecto |
|---|---|
| Restore code and conversation | Vuelve atrás código **y** conversación |
| Restore conversation | Rebobina la conversación, conserva el código actual |
| Restore code | Revierte los archivos, conserva la conversación |
| Summarize from here | Resume desde ese punto hacia adelante (libera contexto) |
| Summarize up to here | Resume lo anterior a ese punto |

Los checkpoints se guardan con la sesión, así que siguen disponibles si la reanudas más tarde.

!!! warning "Límites de los checkpoints"
    - **No rastrean cambios hechos por comandos Bash** (`rm`, `mv`, scripts, migraciones…). Solo los hechos por las herramientas de edición.
    - No rastrean cambios externos (los que haces tú en el editor u otros procesos).
    - Las ediciones de subagentes no se restauran.
    - **No sustituyen a Git.** Piensa en ellos como un "deshacer local"; Git es tu historial permanente.

## Buenas prácticas derivadas

- **Dale una forma de verificar**: tests, un comando de build, un script. Un agente que puede comprobar su trabajo produce resultados mucho mejores.
- **Trabaja sobre un árbol limpio de Git** (o en una rama) para poder revisar y revertir con facilidad.
- **Pide primero exploración** en cambios grandes ("lee y explícame antes de editar") o usa el modo plan (lección 18).
- **Delegar, no dictar**: describe el objetivo y deja que Claude decida qué archivos leer; interviene si se desvía.

## Ejemplo práctico

```text
> Añade validación al endpoint POST /api/users: email válido y nombre no vacío.
  Usa la librería de validación que ya use el proyecto. Añade tests y ejecútalos.
```

Observa en la transcripción:

1. Cómo busca qué librería de validación se usa (`Grep("zod|joi|yup")`).
2. Cómo lee el endpoint antes de editarlo.
3. Cómo escribe los tests y los ejecuta.
4. Si falla algo, cómo corrige y vuelve a ejecutar.

Después ejecuta `/diff` para revisar todo, y prueba `/rewind` → *Restore code* para ver cómo desaparecen los cambios.

## Resumen

- Claude trabaja en un bucle: contexto → acción → verificación.
- Las ediciones son reemplazos exactos, siempre tras leer el archivo.
- `/diff` y `Ctrl+O` te dejan auditar todo lo que hizo.
- `/rewind` o `Esc Esc` deshacen cambios de las herramientas de edición, pero no de Bash; usa Git como red de seguridad real.

## Ejercicios

1. Pide un cambio pequeño y abre `Ctrl+O` para identificar cada herramienta usada.
2. Tras el cambio, ejecuta `/diff` y luego `/rewind` → *Restore code*. Comprueba con `git status` que no quedan cambios.
3. Pide a Claude que cree un archivo con `touch` vía Bash y luego intenta rebobinar. ¿Desaparece? ¿Por qué?

## Referencias

- [Cómo funciona Claude Code](https://code.claude.com/docs/en/how-claude-code-works)
- [Referencia de herramientas](https://code.claude.com/docs/en/tools-reference)
- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
