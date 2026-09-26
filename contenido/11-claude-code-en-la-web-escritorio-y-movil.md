---
titulo: "Claude Code en la web, escritorio y móvil: sesiones en la nube y Remote Control"
resumen: Trabajar fuera de la terminal - sesiones en la nube (claude.ai/code, app móvil, --cloud), entornos en la nube, conexión con GitHub, traer una sesión a tu terminal con --teleport, controlar una sesión local desde otro dispositivo con Remote Control, la app de escritorio y auto-fix de PRs.
---

## Objetivos de la lección

- Distinguir **sesión local**, **sesión en la nube** y **Remote Control**.
- Lanzar tareas en la nube desde el navegador, el móvil o la terminal.
- Mover trabajo de la nube a tu terminal con `--teleport`.
- Controlar desde el móvil una sesión que corre en tu ordenador.

## Tres formas de ejecutar Claude Code

| Modalidad | Dónde se ejecuta | Desde dónde la manejas | Ideal para |
|---|---|---|---|
| **Sesión local** | Tu máquina (terminal, IDE, app de escritorio) | Esa misma máquina | El trabajo diario |
| **Sesión en la nube** | Una máquina virtual gestionada (o el entorno propio de tu organización) | Navegador, app móvil, escritorio o terminal | Lanzar tareas sin tener nada preparado en local, trabajar en paralelo, desde cualquier sitio |
| **Remote Control** | Tu máquina | claude.ai/code o la app móvil | Seguir una sesión local cuando te alejas del ordenador |

## Sesiones en la nube

Disponibles en planes Pro, Max y Team (y Enterprise con los asientos adecuados). Cada sesión clona tu repositorio de GitHub en una máquina virtual aislada, trabaja allí y puede subir una rama y abrir un PR.

### Dónde empezar una

- **Navegador**: [claude.ai/code](https://claude.ai/code).
- **Móvil**: pestaña **Code** de la app de Claude.
- **App de escritorio**: elige **Cloud** en lugar de **Local** al crear la sesión.
- **Terminal**:

    ```bash
    claude --cloud "Corrige el bug de login con emails en mayúsculas en src/auth/login.ts"
    ```

    La máquina en la nube clona el **remoto** de GitHub en tu rama actual, no tu copia local: haz push antes si tienes commits sin subir.

### Conectar GitHub

Dos opciones:

| Método | Cómo | Repos accesibles |
|---|---|---|
| **GitHub App de Claude** | Se autoriza durante el alta en la web | Públicos, y privados donde esté instalada la app |
| **`/web-setup`** | En tu terminal, envía el token de tu CLI `gh` a tu cuenta de Claude | Los que pueda ver tu token de `gh` |

En los entornos gestionados por Anthropic, tus credenciales de GitHub no entran en la máquina virtual: las operaciones de Git pasan por un proxy.

### Entornos en la nube

Cada sesión corre en un **entorno** configurable: acceso a red (qué dominios puede alcanzar), variables de entorno y un **script de preparación** (instalar dependencias, herramientas…). Configúralo una vez y lo reutilizan todas las sesiones, las *routines* (lección 52) y la app móvil.

### Qué conviene saber

- Tu `~/.claude/settings.json` local **no** viaja a la nube; sí lo hace la configuración que esté en el repositorio (`CLAUDE.md`, `.claude/settings.json`, skills y agentes del proyecto).
- Los modos disponibles en la nube son *Accept edits*, *Plan* y *Auto* (si tu organización lo permite). *Bypass permissions* no está disponible.
- Puedes compartir, archivar y borrar sesiones desde la interfaz web.

## De la nube a tu terminal: `--teleport`

¿Empezaste algo desde el móvil y quieres terminarlo en tu ordenador?

```bash
claude --teleport                 # selector de sesiones en la nube
claude --teleport <session-id>    # una sesión concreta
```

Dentro de una sesión local: `/teleport` (o `/tp`). Claude Code comprueba que estás en el repositorio correcto, trae la rama de la sesión y carga toda la conversación. Necesita un árbol de trabajo limpio (te ofrece hacer *stash* si hace falta).

!!! note "--teleport no es --resume"
    `--resume` reabre conversaciones del historial **local**. `--teleport` trae una sesión **de la nube** junto con su rama.

El paso contrario no existe tal cual: no puedes "empujar" una sesión local ya empezada a la nube, pero sí lanzar una nueva con `--cloud`.

## Remote Control: tu sesión local, desde otro dispositivo

Remote Control deja la sesión corriendo **en tu máquina** (con tus archivos, herramientas y MCP locales) y te permite seguirla y dirigirla desde claude.ai/code o la app móvil.

```bash
claude remote-control                       # modo servidor en el directorio actual
claude remote-control --name "Tienda API"   # con nombre visible en la lista
claude remote-control --permission-mode acceptEdits
```

O desde una sesión ya abierta:

```text
/remote-control
```

La primera vez pide confirmación. Aparece una URL (y la sesión en tu lista de claude.ai/code); ábrela desde el móvil para ver el progreso, responder a peticiones de permiso y enviar mensajes. Requiere haber iniciado sesión con una cuenta de claude.ai (no funciona con API key).

### Notificaciones al móvil

Con Remote Control puedes recibir notificaciones *push* cuando Claude termina o necesita tu aprobación: ideal para lanzar una tarea larga y alejarte del ordenador.

### ¿Remote Control o nube?

| Usa Remote Control si… | Usa una sesión en la nube si… |
|---|---|
| Ya estás trabajando en local y quieres continuar desde otro sitio | Quieres empezar sin preparar nada en local |
| Necesitas tus herramientas, credenciales o MCP locales | El trabajo solo necesita el repositorio |
| El proyecto no está en GitHub | Quieres varias tareas en paralelo sin cargar tu máquina |

## La app de escritorio

La app de escritorio de Claude tiene una pestaña **Code** con Claude Code en interfaz gráfica:

- Sesiones **locales** (sobre carpetas de tu máquina) o **en la nube**.
- Selector de modo de permisos junto al botón de enviar.
- Varias sesiones en paralelo, diffs visuales, gestión de plugins.
- Lee los mismos archivos de configuración que la CLI.

Útil si prefieres no usar la terminal o quieres ver varias sesiones a la vez.

## Auto-fix de pull requests

Con la GitHub App de Claude instalada, una sesión en la nube puede **vigilar un PR** y reaccionar sola: cuando falla el CI o alguien deja un comentario de revisión, investiga y sube una corrección si está clara. Se activa desde la sesión que creó el PR (o pidiéndoselo a Claude).

## Resumen

- Local, nube o Remote Control: cambia **dónde se ejecuta** Claude y **desde dónde lo manejas**.
- `claude --cloud "tarea"` lanza en la nube; `claude --teleport` trae una sesión de la nube a tu terminal.
- `claude remote-control` o `/remote-control` para dirigir una sesión local desde el móvil.
- En la nube se aplica la configuración del repo, no la de tu `~/.claude`.

## Ejercicios

1. Conecta GitHub (GitHub App o `/web-setup`) y lanza una tarea pequeña desde claude.ai/code.
2. Lanza otra con `claude --cloud` y tráela a tu terminal con `claude --teleport`.
3. Arranca `claude remote-control` en un proyecto, ábrelo desde el móvil y aprueba un permiso desde allí.
4. Revisa qué partes de tu configuración están en el repo y cuáles solo en tu `~/.claude` (y por tanto no llegarían a la nube).

## Referencias

- [Claude Code en la nube](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Entornos en la nube](https://code.claude.com/docs/en/cloud-environments)
- [Remote Control](https://code.claude.com/docs/en/remote-control)
- [App de escritorio](https://code.claude.com/docs/en/desktop) · [App móvil](https://code.claude.com/docs/en/mobile)
