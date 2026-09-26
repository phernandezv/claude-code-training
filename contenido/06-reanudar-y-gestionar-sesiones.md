---
titulo: Reanudar y gestionar sesiones
resumen: Cómo se guardan las sesiones, cómo retomarlas con --continue, --resume y /resume, cómo nombrarlas, ramificarlas con /branch y --fork-session, exportarlas y dónde viven los transcripts.
---

## Objetivos de la lección

- Entender qué es una **sesión** y qué se guarda.
- Retomar trabajo con `claude --continue`, `claude --resume` y `/resume`.
- Nombrar sesiones y usar el selector de sesiones con soltura.
- Ramificar una conversación para probar otro enfoque (`/branch`, `--fork-session`).
- Exportar sesiones y saber dónde están los archivos.

## ¿Qué es una sesión?

Una sesión es una conversación con Claude Code asociada a un directorio de proyecto. Se guarda **continuamente** en disco mientras trabajas, así que puedes cerrar la terminal, apagar el ordenador o ejecutar `/clear` y volver a ella después.

Al reanudar se restaura:

- **El historial completo**, incluidas las llamadas a herramientas y sus resultados.
- **El modelo** que estabas usando (salvo que fuerces otro con `--model`).
- **El modo de permisos** (al reanudar desde la terminal con `--continue` o `--resume <id|nombre>`), con excepciones: `plan` y `bypassPermissions` no se restauran.
- Los **checkpoints**, así que `/rewind` sigue funcionando.

No se restauran los procesos en segundo plano (servidores, *watchers*) ni ciertos flags de arranque como `--mcp-config`, `--settings`, `--plugin-dir` o `--add-dir`: vuelve a pasarlos si los necesitas.

## Formas de reanudar

| Comando | Qué hace |
|---|---|
| `claude --continue` (o `-c`) | Reabre la conversación más reciente del directorio actual |
| `claude --resume` (o `-r`) | Abre el **selector de sesiones** |
| `claude --resume <nombre>` | Reanuda directamente la sesión con ese nombre |
| `claude --resume <session-id>` | Reanuda por ID (lo busca en cualquier proyecto de la máquina) |
| `claude --from-pr <número>` | Selector filtrado por sesiones vinculadas a ese pull request |
| `/resume` | Cambia a otra conversación desde dentro de una sesión |

```bash
# Volver a lo último que estaba haciendo en este repo
claude -c

# Elegir de una lista
claude -r
```

!!! note "Sesiones headless"
    Las sesiones creadas con `claude -p` o con el Agent SDK no aparecen en el selector ni en `--continue`, pero puedes reanudarlas por su ID con `--resume <id>`.

## Nombrar sesiones

Cuando trabajas en varias cosas a la vez, los nombres son oro:

| Cuándo | Cómo |
|---|---|
| Al arrancar | `claude -n auth-refactor` |
| Durante la sesión | `/rename auth-refactor` |
| Desde el selector | Selecciona la sesión y pulsa `Ctrl+R` |
| Al aprobar un plan | Se genera un título automático basado en el plan |

Si no la nombras, Claude Code genera un **título** a partir de tu primer prompt, que también sirve para reanudarla.

```bash
claude --resume auth-refactor
```

## El selector de sesiones

Se abre con `claude --resume` o `/resume`. Atajos:

| Atajo | Acción |
|---|---|
| `↑` / `↓` | Moverse |
| `Enter` | Reanudar |
| `Space` | Previsualizar el contenido |
| `Ctrl+R` | Renombrar |
| `/` o empezar a escribir | Buscar (también puedes pegar la URL de un PR) |
| `Ctrl+B` | Filtrar por la rama de Git actual |
| `Ctrl+W` | Ver sesiones de todos los *worktrees* del repo |
| `Ctrl+A` | Ver sesiones de todos los proyectos de la máquina |
| `Esc` | Salir |

Cada fila muestra nombre o título, tiempo desde la última actividad, rama de Git y tamaño.

## Reanudar una sesión larga

Si reanudas una sesión muy grande (más de ~100.000 tokens) tras más de una hora de inactividad, en planes Pro/Max Claude Code te ofrece:

- **Resume from summary**: compacta primero la conversación (más barato en cada petición posterior).
- **Resume full session as-is**: carga todo tal cual (más detalle, más coste por petición).

Es un equilibrio entre conservar todos los detalles y enviar menos tokens.

## Ramificar una sesión

¿Quieres probar un enfoque alternativo sin perder el camino actual? **Ramifica**:

```text
/branch probar-con-websockets
```

Esto copia la conversación hasta este punto en una sesión nueva y te cambia a ella. La original queda intacta y puedes volver con `/resume <nombre-original>`.

Desde la línea de comandos:

```bash
claude --continue --fork-session
claude --resume auth-refactor --fork-session
```

!!! warning "No abras la misma sesión en dos terminales"
    Si reanudas la misma sesión en dos terminales sin `--fork-session`, los mensajes de ambas se mezclan en un único transcript. Usa ramas o *worktrees* (lección 27) para trabajo en paralelo.

## Gestionar el contexto dentro de una sesión

Estos comandos no cambian de sesión, pero controlan cuánto "recuerda" Claude (lección 7 y 24):

- `/clear [nombre]`: empieza una conversación nueva con contexto vacío. La anterior se guarda y puedes volver con `/resume`.
- `/compact [instrucciones]`: sustituye el historial por un resumen, opcionalmente centrado en lo que indiques.
- `/context`: muestra qué está ocupando el contexto.

## Exportar y localizar sesiones

- **`/export`**: copia la conversación al portapapeles o la guarda como texto legible. `/export sesion-auth.txt` la escribe directamente en ese archivo.
- **Transcripts en disco**: `~/.claude/projects/<proyecto>/<session-id>.jsonl`, donde `<proyecto>` es la ruta del directorio con los caracteres no alfanuméricos sustituidos por `-`.

!!! tip "No parsees los .jsonl"
    El formato interno de los `.jsonl` cambia entre versiones. Si necesitas datos de una sesión desde un script, usa `claude -p --resume <id> --output-format json`:

    ```bash
    claude -p --resume <session-id> --output-format json "resume lo que cambiamos" | jq -r '.result'
    ```

Por defecto los datos de sesiones antiguas se limpian automáticamente pasado un tiempo (unos 30 días); se puede ajustar con el ajuste `cleanupPeriodDays`.

## Flujo de trabajo recomendado

1. Una sesión por tarea: `claude -n <tarea>`.
2. Si cambias de tema, `/clear` (o una sesión nueva) en vez de arrastrar contexto irrelevante.
3. Antes de un experimento arriesgado, `/branch`.
4. Al día siguiente, `claude -r` → buscar → `Enter`.

## Resumen

- Las sesiones se guardan solas; `-c` retoma la última, `-r` abre el selector.
- Nombra las sesiones (`-n`, `/rename`) para encontrarlas y reanudarlas por nombre.
- `/branch` y `--fork-session` crean copias para explorar alternativas.
- `/export` para leer; `-p --resume … --output-format json` para scripts.

## Ejercicios

1. Abre una sesión con `claude -n prueba-sesiones`, haz dos preguntas y sal con `Ctrl+D`.
2. Reanúdala con `claude --resume prueba-sesiones` y verifica que recuerda el contexto.
3. Dentro, ejecuta `/branch alternativa`, cambia algo y vuelve a la original con `/resume`.
4. Exporta la sesión con `/export mi-sesion.txt` y revisa el archivo.
5. Localiza la carpeta de tu proyecto en `~/.claude/projects/`.

## Referencias

- [Gestionar sesiones](https://code.claude.com/docs/en/sessions)
- [Checkpointing](https://code.claude.com/docs/en/checkpointing)
- [Referencia de la CLI](https://code.claude.com/docs/en/cli-reference)
