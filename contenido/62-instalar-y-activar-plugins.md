---
titulo: Instalar y activar plugins con /plugin, y el marketplace
resumen: El gestor /plugin (Discover, Installed, Marketplaces, Errors), instalar con alcance de usuario, proyecto o local, añadir marketplaces (GitHub, git, local, URL), activar, desactivar, actualizar y desinstalar, gestión desde la shell con claude plugin, y seguridad.
---

## Objetivos de la lección

- Usar el gestor `/plugin` para descubrir, instalar y gestionar plugins.
- Elegir el **alcance** correcto al instalar.
- Añadir marketplaces adicionales.
- Gestionar plugins desde la shell (`claude plugin …`).

## El gestor `/plugin`

```text
/plugin
```

Abre un panel con pestañas:

| Pestaña | Para qué |
|---|---|
| **Discover** | Buscar plugins de todos los marketplaces añadidos |
| **Installed** | Ver los instalados, su alcance y estado; activar, desactivar, actualizar, desinstalar |
| **Marketplaces** | Añadir, actualizar, quitar marketplaces y configurar su auto-actualización |
| **Errors** | Motivos de fallos de carga |

## Instalar un plugin

### Desde la sesión

```text
/plugin install commit-commands@claude-plugins-official
```

Formato: `<plugin>@<marketplace>`. En una sesión, esto abre la ficha del plugin para que la revises:

- **Will install**: qué comandos, agentes, skills, hooks y servidores añadirá.
- **Context cost** (marketplace oficial): cuánto añade a cada mensaje y cuánto al invocarse.

Después eliges el **alcance**:

| Opción | Alcance | Dónde se registra |
|---|---|---|
| Install for you | Usuario: todos tus proyectos | `enabledPlugins` en `~/.claude/settings.json` |
| Install for all collaborators on this repository | Proyecto: todo el equipo | `.claude/settings.json` (súbelo a Git) |
| Install for you, in this repo only | Local: solo tú, este repo | `.claude/settings.local.json` |

Si el mismo plugin está en varios alcances: **local > proyecto > usuario**.

Al terminar, el resumen indica si ya está activo o si hace falta recargar (Claude Code puede ejecutar `/reload-plugins` por ti).

### Comprobar

- Escribe `/` y busca las skills con el prefijo del plugin (p. ej. `/commit-commands:commit`).
- Pestaña **Installed** de `/plugin`.
- En la shell: `claude plugin list`.

### Instalar desde la shell

```bash
claude plugin install commit-commands@claude-plugins-official
claude plugin install formateador@mi-empresa --scope project
```

## Añadir marketplaces

Para instalar plugins que no están en el marketplace oficial:

```text
/plugin marketplace add mi-org/claude-plugins           ← GitHub owner/repo
/plugin marketplace add mi-org/claude-plugins#v2        ← rama o tag
/plugin marketplace add https://gitlab.ejemplo.com/equipo/plugins.git
/plugin marketplace add git@github.com:mi-org/plugins-privados.git
/plugin marketplace add ./mi-marketplace                 ← directorio local
/plugin marketplace add https://ejemplo.com/marketplace.json
```

(`/plugin market` funciona como abreviatura.) Desde la shell: `claude plugin marketplace add <fuente>`.

Añadir e instalar de una vez:

```text
/plugin install deploy-helper --marketplace mi-org/plugins
```

### Gestionar marketplaces

| Acción | Shell | Sesión |
|---|---|---|
| Listar | `claude plugin marketplace list` | `/plugin marketplace list` |
| Actualizar el catálogo | `claude plugin marketplace update <nombre>` | `/plugin marketplace update <nombre>` |
| Quitar | `claude plugin marketplace remove <nombre>` | pestaña Marketplaces |

Los marketplaces privados usan tus credenciales de git (SSH o token).

## Activar, desactivar, actualizar, desinstalar

Desde **Installed** en `/plugin` o desde la shell:

```bash
claude plugin list
claude plugin disable formateador@mi-empresa
claude plugin enable formateador@mi-empresa
claude plugin update formateador@mi-empresa
claude plugin uninstall formateador@mi-empresa --scope project
```

- **Desactivar** mantiene el plugin instalado pero sin cargarse (útil para reducir contexto temporalmente).
- Tras cambios, `/reload-plugins` aplica sin reiniciar.

### Actualizaciones automáticas

- Activadas por defecto en el marketplace oficial; desactivadas en marketplaces de terceros y locales.
- Se cambian por marketplace en la pestaña **Marketplaces** (*Enable/Disable auto-update*).
- La sesión en curso mantiene la versión cargada; la nueva se aplica con `/reload-plugins` o en la siguiente sesión.

## Plugins en otros entornos

| Entorno | Cómo |
|---|---|
| VS Code | `/plugins` en el panel → *Manage plugins* |
| App de escritorio | Botón **+** → Plugins |
| JetBrains | Igual que en la terminal |
| `claude -p` | `/plugin` no está disponible, pero los plugins instalados se cargan; gestiónalos con `claude plugin …` |
| Sesiones en la nube | No cargan los plugins de tu máquina; se configuran por su cuenta |
| Pruebas puntuales | `claude --plugin-dir ./ruta-al-plugin` (lección 63) |

## Seguridad

!!! danger "Un plugin ejecuta código como tú"
    Sus hooks se ejecutan en cada evento y sus servidores MCP arrancan con la sesión. Antes de instalar:

    - Revisa la ficha (**Will install**) y, si es de terceros, el repositorio.
    - Prefiere marketplaces de confianza (oficial, el de tu empresa).
    - Instala en alcance **local** para probar antes de extenderlo al equipo.
    - Desactiva o desinstala lo que no uses (la pestaña Installed agrupa los no usados recientemente).

Las organizaciones pueden restringir qué marketplaces y plugins se permiten mediante *managed settings*.

## Resumen

- `/plugin` para descubrir, instalar (eligiendo alcance) y gestionar; `claude plugin …` desde la shell.
- `plugin@marketplace` identifica cada plugin; añade marketplaces con `/plugin marketplace add`.
- Desactivar ≠ desinstalar; `/reload-plugins` aplica cambios.
- Revisa qué instala y su coste de contexto antes de activarlo.

## Ejercicios

1. Instala un plugin del marketplace oficial en alcance **local**, úsalo y luego desactívalo.
2. Añade un marketplace de GitHub (p. ej. uno de la comunidad) y explora sus plugins.
3. Compara `/context` con el plugin activado y desactivado.
4. Lista tus plugins desde la shell con `claude plugin list` e interpreta alcance y estado.

## Referencias

- [Instalar y gestionar plugins](https://code.claude.com/docs/en/plugins/install)
- [Marketplaces oficiales de Anthropic](https://code.claude.com/docs/en/plugins/anthropic-marketplaces)
- [Seguridad de plugins](https://code.claude.com/docs/en/plugins/security)
