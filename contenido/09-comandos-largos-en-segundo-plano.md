---
titulo: Ejecutar comandos largos en segundo plano
resumen: Servidores de desarrollo, builds en modo watch y suites de tests largas sin bloquear la sesión - Ctrl+B, run_in_background, /tasks, la herramienta Monitor y sesiones en segundo plano.
---

## Objetivos de la lección

- Entender por qué un comando largo bloquea a Claude y cómo evitarlo.
- Mandar comandos a segundo plano con `Ctrl+B` o pidiéndoselo a Claude.
- Consultar y detener tareas con `/tasks`.
- Vigilar logs o procesos con la herramienta **Monitor**.
- Conocer las sesiones en segundo plano (`/background`).

## El problema

Por defecto, cuando Claude ejecuta un comando con la herramienta `Bash`, **espera a que termine** para leer la salida. Con un `npm test` de 10 segundos no pasa nada, pero con:

- un servidor de desarrollo (`npm run dev`, `rails server`, `docker compose up`),
- un build en modo *watch* (`vite`, `tsc --watch`),
- una suite de tests de 15 minutos,

la sesión quedaría bloqueada o el comando alcanzaría su tiempo máximo (por defecto 2 minutos).

## Cómo funciona el segundo plano

Un comando en segundo plano:

- Se ejecuta de forma **asíncrona** y devuelve inmediatamente un **ID de tarea**.
- Escribe su salida en un **archivo** que Claude puede leer cuando quiera.
- Permite que Claude siga trabajando (y que tú sigas escribiendo) mientras corre.
- Se limpia automáticamente al salir de Claude Code.

Además, si un comando normal **supera su timeout**, Claude Code lo mueve automáticamente a segundo plano en lugar de matarlo (excepto los que empiezan por `sleep`).

## Tres formas de enviar algo a segundo plano

### 1. Pedírselo a Claude

```text
> Arranca el servidor de desarrollo en segundo plano y luego comprueba
  que /api/health responde 200.
```

Claude usará la opción `run_in_background` de la herramienta Bash, esperará a que el servidor esté listo leyendo su salida y hará la comprobación.

### 2. `Ctrl+B` sobre un comando en marcha

Si Claude lanzó un comando que está tardando, pulsa **`Ctrl+B`** para mandarlo a segundo plano sin cancelarlo.

!!! note "Usuarios de tmux"
    En tmux `Ctrl+B` es la tecla prefijo, así que tendrás que pulsarlo **dos veces**.

### 3. Tus propios comandos con `!`

El modo shell también admite `Ctrl+B`:

```text
! npm run dev
(pulsa Ctrl+B)
```

## Ver y gestionar tareas: `/tasks`

```text
/tasks
```

Lista las tareas en segundo plano de la sesión (comandos y subagentes), su estado, y te permite ver su salida o **detenerlas**. También está disponible como `/bashes`.

Ejemplo de flujo:

```text
> Arranca `npm run dev` en segundo plano.
  ● Bash(npm run dev) → running in background (id: b1)

> Ahora añade un endpoint /api/version y comprueba que responde.
  ● Edit(src/server/routes.ts)
  ● Read(salida de b1) → "server restarted"
  ● Bash(curl -s localhost:3000/api/version) → {"version":"1.4.0"}

> /tasks   → detener b1
```

## Vigilar cosas: la herramienta Monitor

La herramienta **Monitor** permite a Claude observar algo en segundo plano y **reaccionar cuando cambia**, sin pausar la conversación. Por ejemplo:

- Seguir un archivo de log y avisar cuando aparece un error.
- Consultar el estado de un job de CI o de un PR y avisar cuando cambia.
- Vigilar un directorio.
- Seguir la salida de cualquier script largo.

```text
> Vigila logs/app.log y avísame cada vez que aparezca un ERROR o un stack trace.
  Mientras tanto, vamos a revisar el módulo de facturación.
```

Tú sigues trabajando y Claude interviene cuando llega un evento.

## Sesiones enteras en segundo plano

Además de comandos sueltos, puedes mandar **toda la sesión** a segundo plano para liberar la terminal:

| Comando | Qué hace |
|---|---|
| `/background [prompt]` | Separa la sesión actual y la deja trabajando en segundo plano |
| `/fork [prompt]` | Copia la conversación a una nueva sesión en segundo plano y tú sigues aquí |
| `claude agents` | Vista para monitorizar tus sesiones en segundo plano |

Esto es útil cuando una tarea larga (una migración, una batería de refactors) no necesita tu atención constante.

## Límites y detalles a tener en cuenta

- En **modo headless** (`claude -p`), los comandos en segundo plano se terminan unos segundos después de que Claude devuelva su resultado final.
- Las tareas en segundo plano que generan más de 5 GB de salida se terminan automáticamente.
- Un `cd` dentro de un comando movido a segundo plano **no** cambia el directorio de la sesión.
- Para desactivar por completo esta funcionalidad: variable de entorno `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`.

## Candidatos típicos para segundo plano

| Tipo | Ejemplos |
|---|---|
| Servidores de desarrollo | `npm run dev`, `python manage.py runserver`, `rails s` |
| Builds en watch | `vite`, `webpack --watch`, `tsc --watch`, `cargo watch` |
| Tests largos | `pytest`, `jest --runInBand`, tests e2e |
| Infraestructura local | `docker compose up`, `terraform plan` |
| Instalaciones pesadas | `npm ci`, `pip install -r requirements.txt` |

## Buenas prácticas

- Di explícitamente *"en segundo plano"* cuando pidas arrancar servidores.
- Pide a Claude que **espere a una señal** ("espera a ver 'ready on port 3000'") antes de continuar.
- Revisa `/tasks` antes de cerrar para no dejar procesos huérfanos (aunque se limpian al salir).
- En tareas muy largas, combina segundo plano + Monitor para que Claude te avise.

## Resumen

- Los comandos largos bloquean; el segundo plano los hace asíncronos.
- `Ctrl+B` (dos veces en tmux) o pedírselo a Claude; los que exceden el timeout pasan solos a segundo plano.
- `/tasks` lista y detiene; Monitor vigila y reacciona.
- `/background` y `/fork` llevan sesiones enteras a segundo plano.

## Ejercicios

1. Pide a Claude que arranque tu servidor de desarrollo en segundo plano y compruebe un endpoint.
2. Ejecuta `! npm test` (o equivalente) y pulsa `Ctrl+B`. Consulta después `/tasks`.
3. Pide a Claude que vigile un log mientras hace otra tarea; genera un error a propósito y observa cómo reacciona.
4. Detén todas las tareas desde `/tasks`.

## Referencias

- [Comandos Bash en segundo plano](https://code.claude.com/docs/en/interactive-mode#background-bash-commands)
- [Referencia de herramientas (Bash, Monitor)](https://code.claude.com/docs/en/tools-reference)
- [Vista de agentes y sesiones en segundo plano](https://code.claude.com/docs/en/agent-view)
