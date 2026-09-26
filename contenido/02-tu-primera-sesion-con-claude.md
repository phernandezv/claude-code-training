---
titulo: Tu primera sesión con Claude
resumen: Recorrido guiado por una sesión interactiva - cómo escribir prompts, mencionar archivos con @, ejecutar comandos con !, interrumpir, pegar imágenes y usar los atajos esenciales.
---

## Objetivos de la lección

- Moverte con soltura por la interfaz interactiva de la terminal.
- Escribir prompts efectivos y dar contexto con `@archivo`.
- Ejecutar comandos de shell sin salir de la sesión con `!`.
- Interrumpir, redirigir y encolar mensajes mientras Claude trabaja.
- Conocer los atajos de teclado que usarás todos los días.

## Abrir una sesión

Una sesión se abre **dentro del directorio del proyecto**. Ese directorio es el *directorio de trabajo*: Claude puede leer y editar lo que haya dentro (y lo que añadas explícitamente).

```bash
cd ~/proyectos/tienda-online
claude
```

También puedes arrancar con una primera instrucción:

```bash
claude "explica cómo se calcula el precio final de un carrito"
```

O darle un nombre a la sesión para encontrarla después (lección 6):

```bash
claude -n refactor-carrito
```

## Anatomía de la pantalla

- **Área de conversación**: tus mensajes, las respuestas de Claude y las llamadas a herramientas (por ejemplo `Read(src/cart.ts)`, `Bash(npm test)`), con su resultado resumido.
- **Cuadro de entrada** (`>`): donde escribes.
- **Barra de estado**: muestra el modo de permisos activo (p. ej. `⏸ plan mode on`), avisos y, si la configuras, información como el modelo o el uso de contexto.

Pulsa `?` con el cuadro vacío para ver el panel de atajos.

## Cómo escribir un buen primer prompt

Claude trabaja mejor cuando le das **objetivo + contexto + criterio de éxito**.

| Prompt flojo | Prompt sólido |
|---|---|
| "arregla el login" | "Los usuarios con email en mayúsculas no pueden iniciar sesión. Revisa `@src/auth/login.ts`, normaliza el email antes de buscarlo y añade un test que lo cubra. Ejecuta `npm test` al final." |
| "mejora el rendimiento" | "La página `/productos` tarda 3 s. Encuentra consultas N+1 en `src/repos/` y propón cambios; no edites todavía." |

Consejos:

- **Describe el síntoma y el resultado esperado**, no solo "arregla X".
- **Di cómo verificar** ("ejecuta los tests", "compila con `npm run build`").
- **Acota el alcance** ("solo en este módulo", "no cambies la API pública").
- Si solo quieres entender algo, dilo: "explícame… no edites nada".

## Mencionar archivos con `@`

Escribe `@` y aparecerá un autocompletado de rutas. Al mencionar un archivo, su contenido entra directamente en el contexto:

```text
> Compara @src/api/users.ts con @src/api/orders.ts y dime qué patrón de manejo de errores es más consistente
```

También puedes mencionar carpetas (`@src/components/`) para que Claude vea su estructura.

## Ejecutar comandos de shell con `!`

Si empiezas el mensaje con `!`, entras en **modo shell**: el comando se ejecuta directamente (sin que Claude tenga que pedir permiso) y **su salida se añade a la conversación**, de modo que Claude la ve y puede reaccionar.

```text
! npm test
! git status
! ls -la src/
```

Esto es muy útil para "enseñarle" a Claude un error: ejecutas `! npm run build`, y Claude responde automáticamente analizando la salida. Sales del modo shell con `Esc` o borrando el `!`.

## Pegar imágenes y texto largo

- **Imágenes**: arrastra un archivo a la terminal o pega desde el portapapeles con `Ctrl+V` (en iTerm2 `Cmd+V`, en Windows/WSL `Alt+V`). Útil para capturas de un error visual o un diseño.
- **Texto largo** (logs, trazas): pégalo directamente. Si es enorme, mejor guárdalo en un archivo y menciónalo con `@`.

## Entrada multilínea

Para escribir varias líneas sin enviar:

| Método | Atajo |
|---|---|
| Escape rápido | `\` + `Enter` (funciona en cualquier terminal) |
| Control | `Ctrl+J` |
| Shift+Enter | Nativo en iTerm2, WezTerm, Ghostty, Kitty, Warp, Windows Terminal… |
| Editor externo | `Ctrl+G` abre tu `$EDITOR` para redactar el prompt |

Si `Shift+Enter` no funciona en tu terminal, ejecuta `/terminal-setup`.

## Interrumpir y redirigir

Claude trabaja de forma autónoma, pero **tú sigues al mando**:

- **`Esc`**: detiene lo que Claude está haciendo en ese momento. Luego puedes escribir una corrección ("no, usa `fetch` en vez de `axios`") y continuará con esa indicación.
- **Escribir mientras trabaja**: si escribes un mensaje y pulsas `Enter` mientras Claude está ocupado, el mensaje se **encola** y lo recibirá en cuanto pueda, sin cortar su trabajo.
- **`Esc` `Esc`** (con el cuadro vacío): abre el menú de *rewind* para volver a un punto anterior de la conversación y/o del código (lección 3).
- **`Ctrl+C`**: interrumpe o borra lo que has escrito. Pulsado dos veces seguidas, sale.

## Atajos esenciales

| Atajo | Acción |
|---|---|
| `Esc` | Interrumpir a Claude / cerrar un diálogo |
| `Esc` `Esc` | Borrar borrador o abrir *rewind* |
| `Shift+Tab` | Cambiar de modo de permisos (lección 4) |
| `Ctrl+O` | Ver la transcripción completa (detalles de cada herramienta) |
| `Ctrl+T` | Mostrar/ocultar la lista de tareas de Claude |
| `Ctrl+B` | Mandar a segundo plano un comando en ejecución (lección 9) |
| `Ctrl+R` | Búsqueda inversa en el historial de prompts |
| `↑` / `↓` | Navegar por prompts anteriores |
| `Ctrl+S` | Guardar temporalmente el prompt actual y recuperarlo después |
| `Option+P` / `Alt+P` | Cambiar de modelo |
| `Ctrl+D` | Salir |

!!! tip "macOS y la tecla Option"
    Los atajos con `Option`/`Alt` requieren que tu terminal trate Option como *Meta*. En iTerm2: *Profiles → Keys → Left Option key: Esc+*. En Terminal.app: *Settings → Profiles → Keyboard → Use Option as Meta key*.

## Aprobar permisos

Cuando Claude quiere hacer algo que requiere tu aprobación (editar un archivo, ejecutar un comando), verás un diálogo como:

```text
Bash command
  npm install zod
Do you want to proceed?
❯ 1. Yes
  2. Yes, and don't ask again for npm install commands in this project
  3. No, and tell Claude what to do differently (esc)
```

- **Yes**: aprueba solo esta vez.
- **Yes, and don't ask again…**: crea una regla de permiso para no volver a preguntar (lección 17).
- **No**: rechaza; puedes explicar qué prefieres.

En la lección 4 veremos cómo los **modos de permisos** cambian cuántas veces se te pregunta.

## Preguntas rápidas sin ensuciar el contexto: `/btw`

Si quieres preguntar algo lateral ("¿qué versión de Node usa este repo?") sin que forme parte del hilo principal, usa:

```text
/btw ¿qué hace la opción strict en tsconfig?
```

## Un ejemplo de sesión completo

```text
> Quiero entender el flujo de pago. ¿Qué archivos intervienen desde que el
  usuario pulsa "Pagar" hasta que se guarda el pedido? No edites nada.

  ● Grep("checkout|pagar|payment", src/)
  ● Read(src/pages/checkout.tsx)
  ● Read(src/services/payment.ts)
  ● Read(src/repos/orders.ts)

  El flujo es: 1) checkout.tsx llama a createPayment()… 2)… 3)…

> ! npm test -- payment
  (salida de los tests: 1 fallo en payment.test.ts)

  ● El test falla porque el importe se redondea antes de aplicar el IVA…
    ¿Quieres que lo corrija?

> Sí, corrígelo y vuelve a ejecutar ese test.
```

## Resumen

- Abre `claude` en la raíz del proyecto; el directorio actual define qué puede tocar.
- Buen prompt = objetivo + contexto (`@archivos`) + cómo verificar.
- `!comando` ejecuta en tu shell y comparte la salida con Claude.
- `Esc` interrumpe; escribir mientras trabaja encola mensajes; `Esc Esc` rebobina.

## Ejercicios

1. Abre una sesión y pide un resumen del proyecto usando `@README.md`.
2. Ejecuta `! git log --oneline -5` y pídele a Claude que describa los últimos cambios.
3. Pide una tarea pequeña (p. ej. "añade un comentario JSDoc a esta función") e **interrúmpela** con `Esc` a mitad; luego redirígela.
4. Practica la entrada multilínea con `\` + `Enter` y con `Ctrl+G`.

## Referencias

- [Modo interactivo y atajos](https://code.claude.com/docs/en/interactive-mode)
- [Flujos de trabajo comunes](https://code.claude.com/docs/en/common-workflows)
- [Configuración de la terminal](https://code.claude.com/docs/en/terminal-config)
