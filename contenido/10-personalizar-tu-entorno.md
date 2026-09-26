---
titulo: "Personalizar tu entorno: barra de estado, atajos, tema y terminal"
resumen: Adaptar Claude Code a tu forma de trabajar - barra de estado con modelo, rama, contexto y coste; atajos propios en keybindings.json; temas; notificaciones; entrada multilínea; modo Vim; pantalla completa y ajustes útiles de /config.
---

## Objetivos de la lección

- Configurar una **barra de estado** que muestre la información que te importa.
- Crear o cambiar **atajos de teclado** con `~/.claude/keybindings.json`.
- Ajustar **tema**, **notificaciones**, **entrada multilínea** y **modo Vim**.
- Conocer los ajustes de `/config` que más impacto tienen en el día a día.

## La barra de estado

Por debajo del cuadro de entrada puedes mostrar una línea personalizada: modelo, rama de Git, porcentaje de contexto usado, coste, límites de uso… Es la forma más cómoda de vigilar el consumo sin ejecutar `/context` o `/usage` a cada rato.

### Opción rápida: `/statusline`

Descríbela en lenguaje natural y Claude Code genera el script y actualiza tu configuración:

```text
/statusline muestra el modelo, la rama de git, el % de contexto con una barra y el coste de la sesión
```

### Opción manual

Añade `statusLine` a `~/.claude/settings.json` (o a los settings del proyecto):

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline.sh",
    "padding": 1
  }
}
```

El script recibe por **stdin** un JSON con datos de la sesión y lo que imprima en stdout se muestra en la barra. Campos útiles:

| Campo | Contenido |
|---|---|
| `model.display_name` | Modelo actual |
| `workspace.current_dir`, `workspace.project_dir` | Directorio actual y del proyecto |
| `context_window.used_percentage` | % de la ventana de contexto usado |
| `cost.total_cost_usd` | Coste estimado de la sesión |
| `cost.total_lines_added` / `total_lines_removed` | Líneas cambiadas |
| `effort.level` | Nivel de esfuerzo |
| `fast_mode` | Si el modo rápido está activo |
| `rate_limits.five_hour.used_percentage` | Consumo del límite de 5 horas (planes de suscripción) |

Ejemplo de script propio, `~/.claude/statusline.sh`:

```bash
#!/usr/bin/env bash
# Barra de estado: modelo | rama | contexto con barra | coste
datos=$(cat)
modelo=$(jq -r '.model.display_name' <<<"$datos")
dir=$(jq -r '.workspace.current_dir' <<<"$datos")
pct=$(jq -r '.context_window.used_percentage // 0 | floor' <<<"$datos")
coste=$(jq -r '.cost.total_cost_usd // 0' <<<"$datos")
rama=$(git -C "$dir" branch --show-current 2>/dev/null)

llenos=$(( pct / 10 )); barra=""
for i in $(seq 1 10); do [ "$i" -le "$llenos" ] && barra+="█" || barra+="░"; done

printf '%s | %s | ctx %s %s%% | $%.2f' "$modelo" "${rama:-sin git}" "$barra" "$pct" "$coste"
```

```bash
chmod +x ~/.claude/statusline.sh
```

Opciones extra: `refreshInterval` (segundos) para refrescarla periódicamente, varias líneas de salida, colores ANSI y enlaces clicables. Para quitarla, elimina `statusLine` de tu configuración.

## Atajos de teclado personalizados

Ejecuta `/keybindings` para crear o abrir `~/.claude/keybindings.json`. Los cambios se aplican al guardar, sin reiniciar.

```json
{
  "$schema": "https://www.schemastore.org/claude-code-keybindings.json",
  "bindings": [
    {
      "context": "Chat",
      "bindings": {
        "ctrl+e": "chat:externalEditor",
        "ctrl+u": null
      }
    }
  ]
}
```

- Cada bloque tiene un **contexto** (`Chat`, `Transcript`, `Confirmation`, `ModelPicker`…) y un mapa de **tecla → acción**.
- `null` **desactiva** un atajo por defecto.
- Admite modificadores (`ctrl`, `alt`/`opt`, `shift`, `cmd`) y **acordes** (dos pulsaciones seguidas, como `ctrl+x ctrl+e`).
- Algunos atajos están reservados y no se pueden reasignar (por ejemplo `Ctrl+C`).

El `$schema` da autocompletado de acciones en tu editor. La lista completa de contextos y acciones está en la documentación de *keybindings*.

## Tema

```text
/theme
```

Elige un tema claro u oscuro, o la opción automática que detecta el fondo de tu terminal. También puedes crear temas propios como archivos JSON en `~/.claude/themes/`, y los plugins pueden aportar temas.

## Entrada multilínea

Si `Shift+Enter` no inserta un salto de línea en tu terminal:

```text
/terminal-setup
```

configura el atajo en terminales compatibles (VS Code, iTerm2 y otros). Alternativas que funcionan siempre: `\` + `Enter` o `Ctrl+J`.

En macOS, activa **Option como Meta** en tu terminal para que funcionen los atajos con `Option` (cambiar de modelo, activar el razonamiento extendido, etc.).

## Notificaciones

Cuando Claude termina o necesita un permiso y no estás mirando, puede avisarte:

- En Ghostty, Kitty e iTerm2 envía notificaciones de escritorio por defecto.
- En otras terminales, usa la campana:

    ```json
    { "preferredNotifChannel": "terminal_bell" }
    ```

- Para algo más elaborado (sonidos, notificaciones del sistema, mensajes al móvil), usa un hook `Notification` (lección 50).

## Modo Vim

Si editas con Vim, activa el modo Vim en el cuadro de entrada: `/config` → *Editor mode*, o `/vim`, o en settings:

```json
{ "editorMode": "vim" }
```

Admite navegación `hjkl`, selección `v`/`V` y operadores `d`/`c`/`y` con objetos de texto. `Enter` sigue enviando el prompt incluso en modo INSERT; para un salto de línea usa `o`/`O` en modo NORMAL o `Ctrl+J`.

## Pantalla completa

Si la terminal parpadea o el scroll salta mientras Claude trabaja, prueba el modo de renderizado a pantalla completa:

```text
/tui fullscreen
```

(`/tui default` para volver.)

## tmux

Si usas tmux, ten en cuenta que `Ctrl+B` es su prefijo (para mandar tareas a segundo plano en Claude Code hay que pulsarlo dos veces). Además, por defecto tmux se "come" las notificaciones y no distingue `Shift+Enter` de `Enter`. Añade a `~/.tmux.conf`:

```bash
set -g allow-passthrough on                 # deja pasar notificaciones a la terminal exterior
set -s extended-keys on                     # distingue Shift+Enter de Enter
set -as terminal-features 'xterm*:extkeys'
```

y recarga con `tmux source-file ~/.tmux.conf`.

## Ajustes de `/config` que merecen la pena

`/config` abre el panel de ajustes; también puedes cambiar valores directamente con `/config clave=valor`.

| Ajuste | Para qué |
|---|---|
| Modelo y esfuerzo | Tu combinación por defecto (lecciones 25–26) |
| Estilo de salida | Cómo te responde (lección 19) |
| Canal de actualizaciones | `latest` o `stable` |
| Herramienta de diff | Terminal o IDE |
| Modo del editor | Normal o Vim |
| Tema | Claro, oscuro, automático o personalizado |
| Notificaciones | Canal preferido |
| Memoria automática | Activar o desactivar |

## Resumen

- `/statusline` (o `statusLine` en settings) para ver modelo, rama, contexto y coste de un vistazo.
- `/keybindings` → `~/.claude/keybindings.json` para reasignar o desactivar atajos.
- `/theme`, `/terminal-setup`, notificaciones, modo Vim y `/tui fullscreen` para un entorno cómodo.
- `/config` concentra el resto de preferencias.

## Ejercicios

1. Crea tu barra de estado con `/statusline` y luego modifícala a mano para añadir el nivel de esfuerzo.
2. Reasigna un atajo que uses poco y desactiva otro que te estorbe.
3. Configura las notificaciones para enterarte cuando Claude te necesite.
4. Si usas Vim, activa `editorMode: "vim"` y prueba a editar un prompt largo.

## Referencias

- [Barra de estado](https://code.claude.com/docs/en/statusline)
- [Atajos de teclado personalizados](https://code.claude.com/docs/en/keybindings)
- [Configuración de la terminal](https://code.claude.com/docs/en/terminal-config)
