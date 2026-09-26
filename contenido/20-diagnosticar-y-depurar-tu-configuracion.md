---
titulo: Diagnosticar y depurar tu configuración
resumen: Método para averiguar por qué algo no funciona - qué se ha cargado (/context, /memory, /skills, /hooks, /mcp, /permissions, /status), claude doctor y /doctor, registros de depuración, modo seguro y configuración limpia, y los errores de ubicación y sintaxis más frecuentes.
---

## Objetivos de la lección

- Seguir un **método** para diagnosticar problemas de configuración.
- Saber qué comando revela qué parte de la configuración cargada.
- Aislar el problema con **modo seguro**, **configuración limpia** y **logs de depuración**.
- Reconocer los errores de ubicación y sintaxis más comunes.

## La causa casi siempre es una de tres

Cuando Claude ignora una instrucción o una pieza que configuraste no aparece, lo habitual es que:

1. **No se cargó** (archivo en la ubicación equivocada, sintaxis inválida, carpeta sin confianza aceptada).
2. **Se cargó desde otro sitio** del que creías.
3. **Otra configuración la sobrescribió** o la contradice.

Antes de pensar en un fallo de Claude Code, comprueba estas tres cosas.

## Paso 1: ¿qué se ha cargado?

| Comando | Qué te dice |
|---|---|
| `/context` | Todo lo que ocupa contexto: system prompt, herramientas, MCP, agentes, archivos de memoria, skills |
| `/memory` | Qué `CLAUDE.md` aplican y dónde están; memoria automática |
| `/skills` | Skills disponibles y su origen (proyecto, usuario, plugin) |
| `/hooks` | Hooks registrados por evento y de qué archivo vienen |
| `/mcp` | Servidores, estado, aprobación y herramientas |
| `/permissions` | Reglas allow/ask/deny vigentes y su origen |
| `/agents` y la mención `@` | Subagentes disponibles |
| `/plugin` → Installed / Errors | Plugins cargados y errores de carga |
| `/status` | Versión, modelo, cuenta y **qué fuentes de configuración** están activas (incluidas las gestionadas) |

Si algo no aparece donde debería, el problema es de **carga**, no de redacción.

## Paso 2: ¿está bien escrito y en su sitio?

### Revisión automática

```bash
claude doctor        # desde la shell, sin abrir sesión: instalación y archivos de settings inválidos
```

```text
/doctor              # dentro de la sesión: revisión completa que además propone arreglos
```

`/doctor` también señala extensiones sin uso frente a su coste de contexto, nombres de subagentes duplicados y contenido de `CLAUDE.md` que Claude podría deducir solo.

### Validar plugins y skills

```bash
claude plugin validate ./mi-plugin
claude plugin validate .claude/skills
```

## Paso 3: aislar

### Modo seguro

```bash
claude --safe-mode
```

Arranca sin `CLAUDE.md`, skills, plugins, hooks, MCP, comandos ni agentes personalizados. Si el problema desaparece, está en tu configuración.

### Configuración completamente limpia

```bash
cd /tmp && CLAUDE_CONFIG_DIR=/tmp/claude-limpio claude
```

Usa un directorio de configuración vacío: sin settings de usuario, memoria, plugins… (tendrás que iniciar sesión de nuevo; las políticas gestionadas de tu organización siguen aplicándose). Luego reintroduce tus archivos uno a uno hasta encontrar el culpable.

### Logs de depuración

```bash
claude --debug                         # depuración general
claude --debug=mcp                     # filtrado por categoría
claude --debug-file /tmp/claude.log    # a un archivo conocido
tail -f /tmp/claude.log
```

Dentro de una sesión:

```text
/debug los hooks de formateo no se ejecutan
```

activa el registro y pide a Claude que diagnostique usando el log y las rutas de configuración.

## Errores frecuentes y su causa

### CLAUDE.md y reglas

| Síntoma | Causa típica |
|---|---|
| Claude no sigue una instrucción | No aparece en `/context` (no cargó) **o** está redactada de forma vaga o contradice otra |
| Instrucciones de una subcarpeta "ignoradas" | Los `CLAUDE.md` anidados solo se cargan al leer archivos de esa carpeta |
| Un subagente ignora `CLAUDE.md` | Explore y Plan no lo cargan; revisa también `omitClaudeMd` |
| Regla con `paths` que no se aplica | Patrón glob que no coincide o YAML del frontmatter inválido |

### Settings y permisos

| Síntoma | Causa típica |
|---|---|
| Un valor de `settings.json` parece ignorado | La misma clave está en `settings.local.json` (más prioridad) o en *managed settings* |
| Permisos o hooks "globales" no funcionan | Se añadieron a `~/.claude.json` en lugar de `~/.claude/settings.json` |
| `defaultMode: "auto"` no tiene efecto | Está en la configuración del proyecto, donde no se admite; muévelo a la de usuario |
| Una regla de ruta no coincide | Confusión entre `/ruta` (relativa al proyecto) y `//ruta` (absoluta) |

### Skills y comandos

| Síntoma | Causa típica |
|---|---|
| No aparece en `/skills` | Archivo en `.claude/skills/nombre.md` en vez de `.claude/skills/nombre/SKILL.md` |
| Aparece pero Claude nunca la usa | `disable-model-invocation: true` o descripción que no encaja con cómo pides la tarea |
| El frontmatter no se aplica | `---` no está en la primera línea o el YAML no es válido |

### Hooks

| Síntoma | Causa típica |
|---|---|
| No se dispara nunca | `matcher` escrito como lista JSON en vez de cadena, o en minúsculas (`"bash"`) |
| No aparece en `/hooks` | Definido en un archivo suelto en lugar de bajo la clave `"hooks"` de un settings |
| "hook error" | Script sin permiso de ejecución, `jq` no instalado o ruta relativa |

### MCP

| Síntoma | Causa típica |
|---|---|
| Servidores de `.mcp.json` no cargan | Archivo dentro de `.claude/` en vez de en la raíz, o clave `servers` en vez de `mcpServers` |
| Añadidos en `settings.json` no aparecen | `settings.json` no admite `mcpServers`; usa `.mcp.json` o `claude mcp add` |
| Servidor de proyecto no aparece | Se descartó el diálogo de aprobación; apruébalo desde `/mcp` |
| Falla según desde dónde arrancas | Rutas relativas en `command` o `args` |
| Conectado pero con 0 herramientas | Pulsa *Reconnect* en `/mcp`; si sigue, `claude --debug=mcp` |

## Pedir ayuda a Claude

Claude conoce su propia documentación. Puedes preguntarle directamente:

```text
> ¿Por qué no se ejecuta mi hook PostToolUse? Revisa mi .claude/settings.json
  y el script al que apunta.
```

Si crees que es un fallo real, repórtalo con `/feedback`.

## Resumen

- Primero comprueba **qué se cargó** (`/context`, `/memory`, `/hooks`, `/mcp`, `/permissions`, `/status`).
- Luego **valida** (`claude doctor`, `/doctor`, `claude plugin validate`).
- **Aísla** con `--safe-mode`, `CLAUDE_CONFIG_DIR` limpio y `--debug-file`.
- La mayoría de problemas son de ubicación, sintaxis o precedencia.

## Ejercicios

1. Ejecuta `claude doctor` y `/doctor` y resuelve cualquier aviso.
2. Rompe a propósito un hook (matcher en minúsculas) y encuentra el error con `/hooks` y `--debug-file`.
3. Arranca con `--safe-mode` y compara `/context` con una sesión normal.
4. Pon una misma clave con valores distintos en `settings.json` y `settings.local.json` y comprueba cuál gana.

## Referencias

- [Depurar tu configuración](https://code.claude.com/docs/en/debug-your-config)
- [Solución de problemas](https://code.claude.com/docs/en/troubleshooting)
- [Settings y precedencia](https://code.claude.com/docs/en/settings)
