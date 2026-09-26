---
titulo: "Comandos slash personalizados: un prompt repetido convertido en atajo"
resumen: Crear tus propios comandos /nombre con .claude/commands o skills, organizarlos en subcarpetas con espacios de nombres, añadir descripción y herramientas permitidas, inyectar contexto, y una colección de comandos útiles listos para copiar.
---

## Objetivos de la lección

- Convertir un prompt que repites en un comando `/nombre`.
- Conocer los dos formatos: archivo en `.claude/commands/` y skill en `.claude/skills/`.
- Organizar comandos con subcarpetas y espacios de nombres.
- Crear una colección de comandos útiles para tu día a día.

## La idea

¿Cuántas veces escribes cosas como *"revisa mis cambios, busca bugs y problemas de seguridad, y dame una lista priorizada"*? Un comando personalizado guarda ese prompt en un archivo y lo ejecutas con una palabra:

```text
/revisar
```

## Dos formatos equivalentes

| Formato | Ruta | Comando |
|---|---|---|
| Archivo de comando (clásico) | `.claude/commands/revisar.md` | `/revisar` |
| Skill | `.claude/skills/revisar/SKILL.md` | `/revisar` |

Ambos funcionan igual y admiten el mismo *frontmatter* (salvo `name` y `paths`, que son solo de skills). Usa:

- **Un archivo en `commands/`** para prompts sencillos de un solo archivo.
- **Una skill** si necesitas archivos de apoyo, scripts o quieres que Claude también pueda activarla por su descripción.

Ubicaciones:

| Nivel | Comandos | Skills |
|---|---|---|
| Proyecto | `.claude/commands/` | `.claude/skills/` |
| Personal | `~/.claude/commands/` | `~/.claude/skills/` |

## Tu primer comando

`.claude/commands/revisar.md`:

```markdown
---
description: Revisa los cambios sin commitear buscando bugs y riesgos
---
Revisa los cambios actuales del repositorio (`git diff` y `git diff --cached`).

Busca, por este orden:
1. Bugs de lógica y casos límite no cubiertos.
2. Problemas de seguridad (inyección, secretos, validación de entrada).
3. Tests que faltan o que deberían actualizarse.
4. Inconsistencias con las convenciones de CLAUDE.md.

Devuelve una lista priorizada (alta/media/baja) con archivo:línea y una
propuesta concreta. No edites nada.
```

Úsalo:

```text
/revisar
```

## Organizar con subcarpetas

Las subcarpetas de `commands/` crean **espacios de nombres** con `:`:

```text
.claude/commands/
├── git/
│   ├── pr.md          → /git:pr
│   └── changelog.md   → /git:changelog
├── db/
│   └── consulta.md    → /db:consulta
└── revisar.md         → /revisar
```

## Frontmatter útil en comandos

```markdown
---
description: Crea un commit convencional con los cambios preparados
argument-hint: "[mensaje opcional]"
allowed-tools: Bash(git status *) Bash(git diff *) Bash(git commit *)
model: haiku
disable-model-invocation: true
---
```

| Campo | Efecto |
|---|---|
| `description` | Texto en el menú `/` (y lo que usa Claude para decidir si lo invoca) |
| `argument-hint` | Pista de argumentos en el autocompletado |
| `allowed-tools` | Herramientas sin permiso durante ese turno |
| `model` / `effort` | Modelo o esfuerzo para ese turno (p. ej. `haiku` para tareas simples) |
| `disable-model-invocation` | Solo tú puedes ejecutarlo |

## Inyectar contexto

Igual que en las skills, `` !`comando` `` ejecuta algo antes de enviar el prompt y `@archivo` incluye un archivo:

```markdown
---
description: Genera la descripción del PR de la rama actual
allowed-tools: Bash(git log *) Bash(git diff *)
---
## Commits de la rama
!`git log --oneline main..HEAD`

## Archivos cambiados
!`git diff --stat main...HEAD`

## Plantilla
@.github/pull_request_template.md

Redacta la descripción del PR siguiendo la plantilla, con: qué, por qué,
cómo probarlo y riesgos. Devuélvela en Markdown, sin crear el PR.
```

## Colección de comandos listos para usar

### `/explicar`

```markdown
---
description: Explica un archivo o función para alguien nuevo en el proyecto
argument-hint: "[ruta o símbolo]"
---
Explica $ARGUMENTS a alguien que acaba de llegar al proyecto:
qué hace, por qué existe, con qué partes se relaciona y qué trampas tiene.
Incluye un pequeño diagrama si ayuda. No edites nada.
```

### `/tests-faltantes`

```markdown
---
description: Detecta código sin tests en los cambios actuales y los escribe
---
Mira `git diff main...HEAD`. Identifica funciones y ramas nuevas o modificadas
sin cobertura de tests. Propón los casos (incluidos casos límite), espera mi
confirmación y luego escríbelos y ejecútalos.
```

### `/standup`

```markdown
---
description: Resumen de mi trabajo de ayer para la daily
allowed-tools: Bash(git log *)
---
!`git log --since="yesterday 00:00" --author="$(git config user.email)" --oneline --all`

Resume lo anterior en 3–5 viñetas para la daily: qué hice, qué queda y bloqueos
(si los deduces). Tono breve.
```

### `/limpiar-rama`

```markdown
---
description: Prepara la rama para revisión
disable-model-invocation: true
---
1. Ejecuta lint con autofix y los tests.
2. Elimina console.log/print de depuración y código comentado que hayas añadido.
3. Revisa que no haya TODOs nuevos sin ticket.
4. Resume el estado y dime si está lista para abrir el PR.
```

## Comandos de MCP y de plugins

- Los **prompts de servidores MCP** aparecen como `/mcp__servidor__prompt`.
- Los comandos de **plugins** aparecen como `/plugin:comando`.

## Buenas prácticas

- Un comando = una intención clara.
- Añade siempre `description`: es lo que ves en el menú.
- Usa `disable-model-invocation: true` en comandos con efectos (commits, despliegues, mensajes).
- Versiona los de proyecto en Git y revísalos como código.
- Si un comando crece mucho, conviértelo en skill con archivos de apoyo.

## Resumen

- `.claude/commands/<nombre>.md` o `.claude/skills/<nombre>/SKILL.md` → `/nombre`.
- Subcarpetas → espacios de nombres (`/git:pr`).
- Frontmatter para descripción, argumentos, herramientas y modelo; `` !`cmd` `` y `@archivo` para contexto.

## Ejercicios

1. Crea `/revisar` y `/explicar` en tu proyecto y úsalos.
2. Organiza tres comandos en subcarpetas con espacio de nombres.
3. Crea `/standup` en tu carpeta personal y pruébalo en dos repos distintos.

## Referencias

- [Skills y comandos personalizados](https://code.claude.com/docs/en/skills)
- [Comandos integrados](https://code.claude.com/docs/en/commands)
