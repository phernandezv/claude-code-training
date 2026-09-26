---
titulo: "Modos de permisos: mantener el control"
resumen: Los seis modos de permisos (Manual, acceptEdits, plan, auto, dontAsk, bypassPermissions), cómo cambiarlos con Shift+Tab, cómo fijar uno por defecto y cuándo usar cada uno con seguridad.
---

## Objetivos de la lección

- Conocer los **modos de permisos** y qué acciones aprueba cada uno sin preguntar.
- Cambiar de modo durante la sesión (`Shift+Tab`) o al arrancar (`--permission-mode`).
- Fijar un modo por defecto en `settings.json`.
- Elegir el modo adecuado según el riesgo de la tarea.

## ¿Por qué existen los permisos?

Claude Code puede editar archivos y ejecutar comandos en tu máquina. Eso es lo que lo hace útil y también lo que exige **control**. Los permisos se organizan en dos capas:

1. **El modo de permisos**: define la "línea base" de qué se hace sin preguntar.
2. **Las reglas de permisos** (`allow`, `ask`, `deny`): afinan herramienta por herramienta. Las verás en la lección 15.

Una regla `deny` **siempre gana**, en cualquier modo.

## Los modos disponibles

| Modo (valor de configuración) | Qué se ejecuta sin preguntar | Ideal para |
|---|---|---|
| **Manual** (`default`) | Solo lecturas | Trabajo delicado, revisar cada acción |
| **`acceptEdits`** | Lecturas, ediciones de archivos y comandos de sistema de archivos comunes (`mkdir`, `touch`, `mv`, `cp`, `rm`, `sed`…) dentro del proyecto | Iterar rápido revisando luego con `git diff` |
| **`plan`** | Lecturas (y comandos aprobados por el clasificador si hay modo auto) | Explorar y proponer antes de tocar nada |
| **`auto`** | Todo, con un **clasificador de seguridad** que revisa cada acción en segundo plano | Tareas largas en las que confías en la dirección general |
| **`dontAsk`** | Lecturas y herramientas preaprobadas; lo que normalmente preguntaría **se deniega** | CI y scripts cerrados |
| **`bypassPermissions`** | Todo, sin comprobaciones | **Solo** contenedores o VMs aislados |

!!! note "Manual = default"
    En la interfaz el modo que pregunta por todo se llama **Manual**; en archivos de configuración, hooks y SDK su valor es `default`. La CLI acepta `manual` como alias.

### Manual (`default`)

Claude te pide aprobación antes de editar archivos, ejecutar comandos no triviales o acceder a la red. Las lecturas dentro del directorio de trabajo y un conjunto de comandos de solo lectura (`ls`, `cat`, `git status`, `git diff`…) no preguntan.

### `acceptEdits`

Aprueba automáticamente las ediciones de archivos y los comandos de archivos más habituales **dentro de tu directorio de trabajo**. Los comandos arbitrarios (`npm install`, `curl`, scripts) siguen preguntando. Es un gran punto intermedio cuando trabajas con Git y revisas después con `git diff`.

### `plan`

Claude investiga y escribe un **plan**, pero no edita tu código hasta que lo apruebas. Lo trataremos a fondo en las lecciones 18–20. Atajo rápido: empieza un mensaje con `/plan`:

```text
/plan migrar el cliente HTTP de axios a fetch
```

### `auto`

En modo auto, un **segundo modelo (clasificador)** revisa cada acción en lugar de preguntarte a ti. Deja pasar el trabajo normal (editar en tu proyecto, ejecutar tests…) y **bloquea** por defecto acciones de riesgo, por ejemplo:

- Descargar y ejecutar código (`curl … | bash`).
- Enviar datos sensibles a destinos externos.
- Despliegues y migraciones en producción.
- `git push --force`, `git reset --hard`, `git clean -fd` y otras operaciones que destruyen trabajo.
- Borrar archivos que ya existían antes de la sesión de forma irreversible.
- Cambiar permisos de IAM o de repositorios.

Cuando el clasificador bloquea algo, Claude recibe el motivo y busca otra vía o te pregunta. Puedes revisar los rechazos recientes con `/permissions`.

!!! warning "Auto no es una garantía"
    El modo auto reduce muchísimo las interrupciones, pero **no sustituye tu revisión** en operaciones sensibles. Úsalo en tareas cuya dirección general te parezca bien.

En versiones recientes, **auto es el modo de arranque por defecto** en la terminal y VS Code cuando está disponible para tu cuenta y modelo. Si no está disponible, la sesión arranca en Manual.

### `dontAsk`

Pensado para ejecuciones sin persona delante: todo lo que requeriría preguntar se **deniega automáticamente**, así que solo se ejecuta lo que hayas preaprobado:

```bash
claude -p "ejecuta los tests" --permission-mode dontAsk --allowedTools "Bash(npm test)" "Read"
```

### `bypassPermissions`

Desactiva los diálogos y las comprobaciones. Equivale a `--dangerously-skip-permissions`.

```bash
# Solo dentro de un contenedor/VM desechable
claude --dangerously-skip-permissions
```

!!! danger "Nunca en tu máquina de trabajo"
    `bypassPermissions` no protege contra *prompt injection* (instrucciones maliciosas escondidas en un archivo o página web) ni contra errores. En Linux/macOS se niega a arrancar como `root`/`sudo`. Úsalo solo en entornos aislados, como un *dev container*. Las organizaciones pueden prohibirlo con `permissions.disableBypassPermissionsMode: "disable"`.

## Cambiar de modo

### Durante la sesión: `Shift+Tab`

Cada pulsación rota entre modos. El ciclo básico es:

```text
default (Manual) → acceptEdits → plan → [bypassPermissions] → [auto] → default …
```

Los modos entre corchetes solo aparecen si están habilitados. La barra de estado indica el modo actual:

| Indicador | Modo |
|---|---|
| `⏸ manual mode on` | Manual |
| `⏵⏵ accept edits on` | acceptEdits |
| `⏸ plan mode on` | plan |
| `⏵⏵ auto mode on` | auto |
| `⏵⏵ bypass permissions on` | bypassPermissions |

`dontAsk` nunca aparece en el ciclo: solo se activa con el flag.

### Al arrancar: `--permission-mode`

```bash
claude --permission-mode plan
claude --permission-mode acceptEdits
claude --permission-mode manual
```

### Como valor por defecto: `settings.json`

```json
{
  "permissions": {
    "defaultMode": "acceptEdits"
  }
}
```

¿Dónde ponerlo?

| Archivo | Alcance |
|---|---|
| `~/.claude/settings.json` | Todas tus sesiones en esta máquina |
| `.claude/settings.json` (en el repo) | Todas las sesiones de ese proyecto (compartido con el equipo) |
| `.claude/settings.local.json` | Ese proyecto, solo para ti (no se sube a Git) |
| *Managed settings* | Toda la organización (lo fija el administrador) |

!!! note "Detalle de seguridad"
    Por seguridad, `"auto"` y `"bypassPermissions"` **no tienen efecto** si están en `.claude/settings.json` o `.claude/settings.local.json` de un proyecto (un repositorio clonado no debería poder desactivar tus protecciones). Ponlos en `~/.claude/settings.json` si quieres usarlos por defecto.

### En VS Code

Haz clic en el indicador de modo debajo del cuadro de entrada: *Manual*, *Edit automatically* (acceptEdits), *Plan*, *Auto*, *Bypass permissions*. Para fijar un modo inicial usa el ajuste `claudeCode.initialPermissionMode`.

## Rutas protegidas

Ciertas rutas **nunca se aprueban automáticamente** (salvo en `bypassPermissions`), para no corromper el estado del repositorio ni la propia configuración de Claude: por ejemplo el directorio `.git`, o la configuración de Claude Code. Además, borrar rutas críticas (`rm -rf /`, `rm -rf ~`) se deniega en cualquier modo.

## ¿Qué modo elijo?

| Situación | Modo recomendado |
|---|---|
| Llego a un repo que no conozco | `plan` |
| Cambio acotado que quiero revisar paso a paso | Manual |
| Refactor largo en una rama, revisando con `git diff` al final | `acceptEdits` o `auto` |
| Tarea larga "desatendida" en mi máquina | `auto` |
| Job de CI con una lista cerrada de herramientas | `dontAsk` + `--allowedTools` |
| Contenedor efímero sin credenciales ni red sensible | `bypassPermissions` |

## Resumen

- El modo marca la línea base; las reglas `allow/ask/deny` afinan, y `deny` siempre gana.
- `Shift+Tab` rota entre modos; `--permission-mode` fija el de arranque; `permissions.defaultMode` lo deja por defecto.
- `auto` usa un clasificador que bloquea acciones peligrosas; `bypassPermissions` no protege de nada.

## Ejercicios

1. Abre una sesión y pulsa `Shift+Tab` varias veces observando la barra de estado.
2. En modo `plan`, pide *"añade un endpoint /health"*. Comprueba que no edita nada hasta que apruebas.
3. En modo `acceptEdits`, pide el mismo cambio y revisa luego con `! git diff`.
4. Crea `~/.claude/settings.json` con `"defaultMode": "acceptEdits"`, abre una sesión nueva y verifica el modo. Después, vuelve a dejarlo como estaba.

## Referencias

- [Modos de permisos](https://code.claude.com/docs/en/permission-modes)
- [Configurar el modo auto](https://code.claude.com/docs/en/auto-mode-config)
- [Permisos y reglas](https://code.claude.com/docs/en/permissions)
