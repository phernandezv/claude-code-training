---
titulo: "Sandbox y contenedores: ejecutar con seguridad"
resumen: Aislar lo que Claude ejecuta - el sandbox de Bash (/sandbox) con aislamiento de sistema de archivos y red a nivel de sistema operativo, sus modos, configuración en settings.json, dev containers, y cuándo usar cada capa junto a permisos y modo auto.
---

## Objetivos de la lección

- Entender la diferencia entre **permisos** (si Claude pregunta) y **aislamiento** (qué puede alcanzar un comando).
- Activar y configurar el **sandbox de Bash** con `/sandbox`.
- Controlar escritura, lectura y red del sandbox en `settings.json`.
- Usar **dev containers** para trabajo desatendido.

## Permisos frente a aislamiento

Hasta ahora has controlado **si** Claude pide permiso (modos y reglas, lecciones 4 y 17). El aislamiento responde a otra pregunta: **una vez que un comando se ejecuta, ¿a qué puede llegar?**

| Capa | Qué decide | Ejemplo |
|---|---|---|
| Modo de permisos + reglas | Si Claude pregunta, ejecuta o se bloquea | `deny: ["Bash(git push *)"]` |
| **Sandbox de Bash** | Qué archivos y dominios de red puede tocar un comando, impuesto por el sistema operativo | `npm test` no puede leer `~/.ssh` ni conectarse a un dominio no permitido |
| **Contenedor / VM** | Todo el entorno está aislado de tu máquina | Un dev container sin tus credenciales |

Las capas se combinan: cuanto más autonomía das (modo auto, `bypassPermissions`, CI), más aislamiento conviene.

## El sandbox de Bash

Viene incluido en Claude Code y funciona en **macOS, Linux y WSL2** (no en Windows nativo). En macOS usa el mecanismo Seatbelt del sistema; en Linux/WSL2 necesita dos paquetes:

```bash
# Ubuntu / Debian
sudo apt install bubblewrap socat
```

### Activarlo

```text
/sandbox
```

El panel tiene pestañas para elegir el **modo**, permitir o no que los comandos que fallan en el sandbox se reintenten fuera (*Overrides*) y ver la configuración resultante.

### Los dos modos

| Modo | Comportamiento |
|---|---|
| **Auto-allow** | Los comandos que pueden ejecutarse en el sandbox se aprueban **sin preguntar**; los que no, siguen el flujo normal de permisos |
| **Regular permissions** | Todos los comandos siguen pidiendo permiso, aunque se ejecuten en el sandbox |

Aun en auto-allow: las reglas `deny` se respetan, las reglas `ask` específicas (como `Bash(git push *)`) siguen preguntando, y borrar rutas críticas nunca se aprueba solo.

**Auto-allow + sandbox** es una forma de trabajar con pocas interrupciones **sin** clasificador: el sistema operativo garantiza que los comandos no salen del perímetro.

### Qué puede hacer un comando dentro del sandbox

- **Escribir** solo en el directorio de trabajo, en un directorio temporal propio y en los directorios añadidos.
- **Red**: ningún dominio permitido de entrada. La primera vez que un comando necesita un dominio, Claude Code te pregunta; si lo apruebas, queda permitido para la sesión.
- Las restricciones se aplican también a los **subprocesos** que lance el comando.

### El "escape" controlado

Algunos comandos no funcionan dentro del sandbox (herramientas incompatibles, dominios no permitidos). Claude puede reintentarlos **fuera** del sandbox, pero entonces vuelven al flujo normal de permisos (te pregunta). Si no quieres que eso ocurra nunca:

```json
{
  "sandbox": {
    "allowUnsandboxedCommands": false
  }
}
```

## Configurar el sandbox

```json
{
  "sandbox": {
    "enabled": true,
    "filesystem": {
      "allowWrite": ["~/.cache/pip", "./build"],
      "denyRead": ["~/"],
      "allowRead": ["~/proyectos"]
    },
    "network": {
      "allowedDomains": ["registry.npmjs.org", "pypi.org", "files.pythonhosted.org", "*.github.com"]
    }
  }
}
```

- `allowWrite`: rutas adicionales donde se puede escribir (cachés de herramientas, carpetas de salida).
- `denyRead` / `allowRead`: bloquear lectura de zonas (p. ej. tu home) y reabrir partes concretas.
- `denyWrite`: prohibir escritura en rutas concretas.
- `network.allowedDomains`: dominios permitidos sin preguntar.

!!! warning "Rutas distintas a las de los permisos"
    En el sandbox, `/ruta` es **absoluta** y `./ruta` es relativa al proyecto (en settings del proyecto). En las reglas `Read`/`Edit` de permisos es distinto (`//ruta` absoluta, `/ruta` relativa al proyecto). No los mezcles.

Las listas se combinan entre los distintos niveles de configuración. Las organizaciones pueden **imponer** el sandbox y restringir los dominios con *managed settings*.

### Límites a tener en cuenta

- Solo cubre la herramienta **Bash**, no las herramientas de edición ni los servidores MCP.
- Los comandos que escribes tú con `!` en modo shell se ejecutan **fuera** del sandbox (salvo configuraciones estrictas).
- El filtrado de red se basa en el nombre del dominio; no inspecciona el contenido.

## Dev containers

Un **dev container** es un entorno de desarrollo en un contenedor Docker, definido en `.devcontainer/devcontainer.json`, que abren VS Code, GitHub Codespaces o JetBrains. Añadir Claude Code es una línea:

```json
{
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",
  "features": {
    "ghcr.io/anthropics/devcontainer-features/claude-code:1.0": {}
  }
}
```

Ventajas:

- Claude trabaja en un entorno **separado de tu máquina** y de tus credenciales personales.
- Todo el equipo tiene el mismo entorno reproducible.
- Puedes **restringir la salida a internet** del contenedor (el contenedor de referencia de Anthropic incluye un script de cortafuegos que solo permite los destinos necesarios).
- Como Claude corre como usuario no root dentro del contenedor, es el lugar adecuado para `--dangerously-skip-permissions` en tareas desatendidas.

!!! danger "Aun en un contenedor"
    Los archivos del proyecto montados en el contenedor son **tus archivos**: lo que Claude borre ahí, se borra en tu máquina. Y el contenedor puede alcanzar lo que su red permita. Trabaja sobre Git limpio, no montes credenciales innecesarias y limita la red.

## ¿Qué combinación uso?

| Situación | Recomendación |
|---|---|
| Día a día en tu portátil | Modo auto **o** Manual + sandbox en auto-allow |
| Proyecto que no conoces o con scripts dudosos | Sandbox activo + `denyRead` de tu home + red restringida |
| Tareas largas desatendidas en local | Dev container + modo auto |
| CI / automatización totalmente desatendida | Contenedor efímero sin credenciales sensibles + `bypassPermissions` o `dontAsk` con allowlist |
| Contenido no confiable (webs, issues públicos) | Contenedor/VM + red limitada |

## Resumen

- Permisos deciden **si** se ejecuta; el aislamiento decide **qué alcanza** lo que se ejecuta.
- `/sandbox`: aislamiento de archivos y red para Bash a nivel de sistema operativo (macOS, Linux, WSL2).
- Configura `sandbox.filesystem` y `sandbox.network` en `settings.json`.
- Dev containers para entornos reproducibles y trabajo desatendido.

## Ejercicios

1. Activa `/sandbox` en modo auto-allow y pide a Claude que ejecute los tests. ¿Cuántos permisos te pidió?
2. Añade `denyRead: ["~/"]` con `allowRead` para tu carpeta de proyectos y pide leer `~/.ssh/config`. Observa el bloqueo.
3. Pide a Claude que haga `curl` a un dominio nuevo y observa la petición de red.
4. Crea un `.devcontainer/devcontainer.json` con la feature de Claude Code y ábrelo en VS Code.

## Referencias

- [Sandbox de Bash](https://code.claude.com/docs/en/sandboxing)
- [Entornos aislados](https://code.claude.com/docs/en/sandbox-environments)
- [Dev containers](https://code.claude.com/docs/en/devcontainer)
- [Seguridad](https://code.claude.com/docs/en/security)
