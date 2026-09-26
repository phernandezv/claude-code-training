---
titulo: Reglas y permisos del proyecto
resumen: settings.json a fondo - los niveles de configuración y su precedencia, reglas allow/ask/deny, sintaxis de patrones para Bash, Read/Edit, WebFetch, MCP y subagentes, /permissions, y configuraciones de ejemplo para equipos.
---

## Objetivos de la lección

- Conocer los archivos de configuración (`settings.json`) y su orden de precedencia.
- Escribir reglas `allow`, `ask` y `deny` con la sintaxis correcta.
- Proteger archivos sensibles y comandos peligrosos.
- Gestionar reglas de forma interactiva con `/permissions`.
- Diseñar una configuración compartida para el equipo.

## Instrucciones vs. permisos

Recuerda la diferencia clave:

- `CLAUDE.md` **orienta** lo que Claude intenta hacer.
- Los **permisos los aplica Claude Code**, no el modelo. Si una regla `deny` bloquea algo, no importa lo que diga el prompt: no se ejecuta.

## Los archivos de configuración

| Nivel | Archivo | Afecta a |
|---|---|---|
| Usuario | `~/.claude/settings.json` | Tú, en todos los proyectos de esta máquina |
| Proyecto compartido | `.claude/settings.json` | Todo el que trabaje en el repo (súbelo a Git) |
| Proyecto local | `.claude/settings.local.json` | Tú, solo en este proyecto (fuera de Git) |
| Organización | *Managed settings* (`managed-settings.json`, MDM o consola de claude.ai) | Todos los equipos donde se despliegue |

### Precedencia (de mayor a menor)

1. **Managed settings** (organización): nada los sobrescribe.
2. **Argumentos de línea de comandos** (`--settings`, `--allowedTools`…), solo para esa sesión.
3. **Proyecto local** (`.claude/settings.local.json`).
4. **Proyecto compartido** (`.claude/settings.json`).
5. **Usuario** (`~/.claude/settings.json`).

!!! note "Las listas se combinan"
    Las listas como `permissions.allow` o `permissions.deny` **se suman** entre niveles, no se sustituyen. Y un `deny` en **cualquier** nivel gana a un `allow` en cualquier otro: si el proyecto prohíbe algo, tu configuración de usuario no puede permitirlo (ni al revés).

## Estructura básica

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [],
    "ask": [],
    "deny": [],
    "defaultMode": "default",
    "additionalDirectories": []
  }
}
```

La línea `$schema` activa el autocompletado y la validación en VS Code y otros editores.

### Cómo se evalúan las reglas

El orden es **deny → ask → allow**. La primera coincidencia en ese orden decide; la especificidad no cambia nada:

- `deny` coincide → bloqueado.
- `ask` coincide → te pregunta (incluso en modo auto).
- `allow` coincide → se ejecuta sin preguntar.
- Nada coincide → decide el **modo de permisos** (lección 4).

Un `deny` amplio como `Bash(aws *)` bloquea también `aws s3 ls` aunque tengas un `allow` específico para él. Un `allow` no puede abrir una excepción dentro de un `deny`.

## Sintaxis de reglas

Formato: `Herramienta` o `Herramienta(especificador)`.

### Herramienta completa

| Regla | Efecto |
|---|---|
| `Bash` | Todos los comandos de shell |
| `Read` | Todas las lecturas de archivos |
| `WebFetch` | Todas las descargas web |

Como `deny`, un nombre de herramienta sin paréntesis **elimina la herramienta** del contexto de Claude: ni siquiera sabe que existe.

### Bash: comandos y comodines

| Regla | Coincide | No coincide |
|---|---|---|
| `Bash(npm run build)` | Exactamente `npm run build` | `npm run build --watch` |
| `Bash(npm run *)` | `npm run test`, `npm run lint --fix`, `npm run` | `npm install` |
| `Bash(git log *)` | `git log`, `git log --oneline -5` | `git push` |
| `Bash(ls *)` | `ls`, `ls -la` | `lsof` |
| `Bash(ls*)` (sin espacio) | `ls -la`, `lsof` | — |

Claves:

- El **espacio antes del `*`** importa: `Bash(ls *)` exige un espacio después de `ls`.
- Pon el `*` **después del subcomando** (`git log *`, no `git *`). `Bash(git * main)` coincidiría también con `git push origin main`.
- `Bash(ls:*)` es una forma equivalente de `Bash(ls *)` (solo al final).
- Claude Code entiende comandos compuestos (`&&`, `;`, `|`): cada parte se evalúa por separado, así que `npm test && rm -rf build` no pasa solo por tener `allow` para `npm test`.

Algunos comandos de **solo lectura** (`ls`, `cat`, `pwd`, `git status`, `git diff`…) nunca piden permiso.

### Read y Edit: rutas

Usan sintaxis de `.gitignore`:

| Patrón | Significado | Ejemplo |
|---|---|---|
| `//ruta` | Absoluta desde la raíz del sistema | `Read(//etc/ssl/**)` |
| `~/ruta` | Desde tu home | `Read(~/.aws/**)` |
| `/ruta` | Relativa al origen del settings (en un proyecto, su raíz) | `Edit(/src/**/*.ts)` |
| `ruta` o `./ruta` | Relativa al directorio actual | `Read(./.env)` |

!!! warning "La barra simple no es absoluta"
    `/Users/ana/archivo` **no** es una ruta absoluta en estas reglas: se ancla al origen del settings. Para absolutas usa doble barra: `//Users/ana/archivo`.

- Un `deny` de `Read` también bloquea `Edit` y `Write` sobre esa ruta.
- Las reglas de `Read`/`Edit` se aplican también a comandos de Bash que Claude Code reconoce como lectura/escritura (`cat`, `head`, `sed`, redirecciones `>`…).

### WebFetch: dominios

```json
"allow": ["WebFetch(domain:docs.python.org)", "WebFetch(domain:*.github.com)"]
```

### MCP

| Regla | Coincide |
|---|---|
| `mcp__github` | Todas las herramientas del servidor `github` |
| `mcp__github__*` | Igual, con comodín |
| `mcp__github__create_issue` | Solo esa herramienta |

### Subagentes

```json
"deny": ["Agent(Explore)", "Agent(mi-agente-costoso)"]
```

### Parámetros de entrada

Las reglas `deny`/`ask` pueden filtrar por un parámetro de la herramienta:

```json
"ask": ["Agent(model:opus)", "Bash(run_in_background:true)"]
```

## Gestionar reglas: `/permissions`

```text
/permissions
```

Abre un diálogo donde ves todas las reglas y **de qué archivo viene cada una**, puedes añadir o quitar reglas, gestionar directorios de trabajo adicionales y revisar los rechazos recientes del modo auto.

Además, cada vez que eliges **"Yes, and don't ask again…"** en un diálogo de permiso, se añade una regla `allow` (normalmente en `.claude/settings.local.json`).

## Directorios de trabajo adicionales

Por defecto Claude solo accede al directorio donde arrancaste. Para dar acceso a otros:

```bash
claude --add-dir ../libreria-compartida
```

o dentro de la sesión `/add-dir ../libreria-compartida`, o de forma permanente:

```json
{
  "permissions": {
    "additionalDirectories": ["../libreria-compartida"]
  }
}
```

Esto da acceso a **archivos**, pero no carga la configuración `.claude/` de ese directorio.

## Configuraciones de ejemplo

### Proyecto Node compartido (`.claude/settings.json`)

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm run *)",
      "Bash(npm test *)",
      "Bash(npx vitest *)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "WebFetch(domain:developer.mozilla.org)"
    ],
    "ask": [
      "Bash(npm install *)",
      "Bash(git push *)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Bash(git push --force *)",
      "Bash(rm -rf *)",
      "Bash(curl *)",
      "Bash(wget *)"
    ]
  }
}
```

### Tus ajustes personales en el proyecto (`.claude/settings.local.json`)

```json
{
  "permissions": {
    "allow": ["Bash(docker compose *)"],
    "additionalDirectories": ["../design-system"]
  }
}
```

### Globales (`~/.claude/settings.json`)

```json
{
  "permissions": {
    "deny": ["Read(~/.ssh/**)", "Read(~/.aws/**)", "Read(~/.config/gcloud/**)"]
  },
  "autoUpdatesChannel": "stable"
}
```

## Otros ajustes útiles en `settings.json`

| Clave | Para qué |
|---|---|
| `env` | Variables de entorno para cada sesión (`{"env": {"NODE_ENV": "development"}}`) |
| `model` | Modelo por defecto |
| `hooks` | Automatizaciones (lección 44) |
| `outputStyle` | Estilo de respuesta (lección 16) |
| `claudeMdExcludes` | Excluir `CLAUDE.md` (lección 13) |
| `cleanupPeriodDays` | Días que se conservan los transcripts |
| `autoMemoryEnabled` | Activar/desactivar la memoria automática |

Puedes cambiar ajustes desde `/config` o, para una sola sesión, con `--settings archivo.json`.

## Confianza en el espacio de trabajo

La primera vez que abres Claude en una carpeta, te pide **confiar** en ella. Hasta entonces no se aplican ciertas cosas del proyecto (como hooks o reglas `allow` compartidas), para que un repositorio que acabas de clonar no pueda ejecutar comandos sin tu consentimiento. Revisa `.claude/settings.json` de proyectos ajenos antes de confiar.

## Resumen

- Cuatro niveles; precedencia: organización > CLI > local > proyecto > usuario.
- Evaluación `deny → ask → allow`; un `deny` en cualquier nivel gana.
- Cuidado con los espacios y la posición del `*` en reglas de Bash; usa `//` para rutas absolutas.
- `/permissions` para ver y editar; `.claude/settings.json` para el equipo, `.local` para ti.

## Ejercicios

1. Crea `.claude/settings.json` en tu proyecto con `allow` para tus comandos de test y lint y `deny` para `.env`.
2. Pide a Claude *"muéstrame el contenido de .env"* y observa el bloqueo.
3. Abre `/permissions` y localiza de qué archivo viene cada regla.
4. Añade el `$schema` y comprueba el autocompletado en tu editor.

## Referencias

- [Configurar permisos](https://code.claude.com/docs/en/permissions)
- [Archivos de settings y precedencia](https://code.claude.com/docs/en/settings)
- [Referencia de settings](https://code.claude.com/docs/en/settings-reference)
