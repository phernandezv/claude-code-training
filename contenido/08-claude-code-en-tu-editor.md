---
titulo: Claude Code en tu editor
resumen: Instalar y usar la extensión de VS Code (y Cursor) y el plugin de JetBrains - panel de chat, diffs en el editor, compartir selección, @-menciones con líneas, modos de permisos y conexión desde terminales externas con /ide.
---

## Objetivos de la lección

- Instalar la extensión de **VS Code** (también funciona en Cursor y otros forks) y el plugin de **JetBrains**.
- Trabajar con el panel de Claude: selección, @-menciones con rangos de líneas, diffs.
- Conocer los atajos del editor.
- Conectar una sesión de terminal al IDE con `/ide`.

## ¿Por qué usar Claude Code en el editor?

La CLI es la experiencia completa, pero el IDE añade ventajas:

- **Diffs visuales** en el visor de diferencias del editor.
- **Contexto automático**: Claude ve el archivo abierto y el texto que tengas seleccionado.
- **Diagnósticos**: puede leer los errores y avisos del editor (lint, tipos).
- Todo sin salir de tu entorno.

Ambos comparten configuración (`CLAUDE.md`, `settings.json`, MCP, plugins), así que puedes alternar libremente.

## VS Code

### Instalación

1. Abre la vista de extensiones (`Cmd+Shift+X` / `Ctrl+Shift+X`).
2. Busca **"Claude Code"** (editor: Anthropic) e instálala.
   - En Cursor y otros forks, búscala igual o instálala desde Open VSX.
3. Haz clic en el icono de Claude (la chispa ✱) en la barra lateral o en la parte superior del editor.
4. Inicia sesión con tu cuenta la primera vez.

### El panel de Claude

- **Cuadro de entrada** con el selector de modo de permisos (Manual, Edit automatically, Plan, Auto…).
- **Historial de conversaciones** para reanudar sesiones anteriores.
- **Propuestas de edición** que se abren como diff: puedes aceptar o rechazar cada cambio.

### Compartir código

- **Selección automática**: si seleccionas líneas en el editor, Claude las ve. El pie del cuadro de entrada indica cuántas líneas hay seleccionadas.
- **@-mención con rango**: pulsa `Option+K` (Mac) / `Alt+K` (Windows/Linux) para insertar una referencia como `@app.ts#5-10`.
- **@archivo**: igual que en la terminal, escribe `@` y elige.

```text
> @src/cart.ts#40-72 esta función hace demasiadas cosas. Divídela en funciones
  pequeñas sin cambiar el comportamiento y actualiza los tests.
```

### Atajos de VS Code

| Acción | Mac | Windows/Linux |
|---|---|---|
| Alternar foco editor ↔ Claude | `Cmd+Esc` | `Ctrl+Esc` |
| Abrir conversación en nueva pestaña | `Cmd+Shift+Esc` | `Ctrl+Shift+Esc` |
| Insertar @-mención de la selección | `Option+K` | `Alt+K` |
| Reabrir sesión cerrada | `Cmd+Shift+T` | `Ctrl+Shift+T` |
| Paleta de comandos (buscar "Claude Code") | `Cmd+Shift+P` | `Ctrl+Shift+P` |

### Dónde colocar el panel

Puedes abrir Claude en la barra lateral, como pestaña del editor, en una ventana aparte o en **modo terminal** (la CLI dentro de la terminal integrada). Puedes tener **varias conversaciones** abiertas a la vez en pestañas.

### Ajustes útiles de la extensión

| Ajuste | Qué hace |
|---|---|
| `claudeCode.initialPermissionMode` | Modo con el que empiezan las conversaciones (`default`, `acceptEdits`, `plan`, `bypassPermissions`) |
| "Allow dangerously skip permissions" | Necesario para que aparezca el modo *Bypass permissions* |

### Extensión vs CLI

La extensión cubre la mayoría del trabajo diario, pero **no todos los comandos slash** de la CLI están disponibles en el panel. Si necesitas algo exclusivo de la CLI, abre la terminal integrada y ejecuta `claude`: se conectará automáticamente al editor.

## JetBrains (IntelliJ, PyCharm, WebStorm, GoLand…)

### Instalación

El plugin de JetBrains **ejecuta la CLI en la terminal del IDE** y se conecta a ella; no trae su propia copia:

1. Instala la CLI (lección 1) y asegúrate de que `claude` está en el `PATH`.
2. Instala el plugin **Claude Code** desde el JetBrains Marketplace y reinicia el IDE.

### Uso

- Abre Claude con `Cmd+Esc` (Mac) / `Ctrl+Esc` (Windows/Linux) o con el botón de Claude.
- Los **diffs** se muestran en el visor del IDE (puedes cambiarlo en `/config` → *Diff tool*).
- La **selección y la pestaña activa** se comparten automáticamente.
- Inserta referencias a archivos con `Cmd+Option+K` (Mac) / `Alt+Ctrl+K` (Linux/Windows), p. ej. `@src/auth.ts#L1-99`.
- Claude puede leer los **diagnósticos** del IDE (errores de inspección, lint).

Como es la CLI, los modos se cambian igual: `Shift+Tab`.

!!! tip "Esc en JetBrains"
    Si `Esc` no interrumpe a Claude en la terminal de JetBrains, revisa en *Settings → Tools → Terminal* la opción que hace que `Esc` mueva el foco al editor, y desactívala.

## Conectar desde una terminal externa: `/ide`

¿Prefieres tu terminal favorita (iTerm, Ghostty, Windows Terminal) pero quieres los diffs en el IDE? Arranca `claude` en la carpeta del proyecto y ejecuta:

```text
/ide
```

Claude Code detectará el IDE abierto en ese proyecto y se conectará: diffs en el editor, selección compartida y diagnósticos.

## Seguridad

La extensión de VS Code expone un pequeño servidor MCP local (solo accesible desde tu máquina) para que la CLI pueda pedir diagnósticos, abrir diffs, etc. Las reglas `deny` de lectura también bloquean que se comparta la selección de archivos protegidos (por ejemplo `.env`).

## Flujo recomendado

1. Trabaja en el panel del IDE para tareas donde quieras ver diffs uno a uno.
2. Usa la CLI (terminal integrada o externa + `/ide`) para comandos avanzados, headless o varias sesiones.
3. Revisa cada diff antes de aceptar, o usa *Edit automatically* y revisa al final con el panel de control de código fuente.

## Resumen

- VS Code: extensión "Claude Code"; JetBrains: plugin que usa la CLI.
- Selección automática + `Option/Alt+K` para @-menciones con líneas.
- `Cmd/Ctrl+Esc` alterna el foco; `/ide` conecta una terminal externa.
- Misma configuración que la CLI.

## Ejercicios

1. Instala la extensión en tu editor y abre una conversación.
2. Selecciona una función, pulsa `Option/Alt+K` y pide que le añada documentación. Acepta o rechaza el diff.
3. Desde una terminal externa, abre `claude` en el mismo proyecto y ejecuta `/ide`.
4. Cambia el modo de permisos desde el indicador del panel y observa la diferencia.

## Referencias

- [Claude Code en VS Code](https://code.claude.com/docs/en/vs-code)
- [Claude Code en JetBrains](https://code.claude.com/docs/en/jetbrains)
