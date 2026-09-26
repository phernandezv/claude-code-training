---
titulo: "Alcance: proyecto vs. usuario vs. archivos anidados"
resumen: Todos los niveles de CLAUDE.md (organización, usuario, proyecto, local, subcarpetas), el orden en que se cargan, las reglas modulares de .claude/rules/ con paths, y cómo gestionar monorepos con claudeMdExcludes.
---

## Objetivos de la lección

- Conocer todas las ubicaciones posibles de `CLAUDE.md` y para qué sirve cada una.
- Entender **cuándo** se carga cada archivo (al arrancar o bajo demanda).
- Organizar reglas modulares en `.claude/rules/` y limitarlas a rutas con `paths`.
- Evitar instrucciones ajenas en monorepos con `claudeMdExcludes`.

## Los niveles

| Nivel | Ubicación | Quién lo mantiene | Para qué |
|---|---|---|---|
| **Organización** (*managed policy*) | macOS: `/Library/Application Support/ClaudeCode/CLAUDE.md`<br>Linux/WSL: `/etc/claude-code/CLAUDE.md`<br>Windows: `C:\Program Files\ClaudeCode\CLAUDE.md` | IT / plataforma | Estándares de la empresa, seguridad, cumplimiento |
| **Usuario** | `~/.claude/CLAUDE.md` | Tú | Preferencias personales para todos tus proyectos |
| **Proyecto** | `./CLAUDE.md` o `./.claude/CLAUDE.md` | El equipo (en Git) | Arquitectura, comandos, convenciones |
| **Local** | `./CLAUDE.local.md` | Tú (en `.gitignore`) | Tus URLs de sandbox, datos de prueba, atajos personales |
| **Anidado** | `./ruta/subcarpeta/CLAUDE.md` | El equipo | Instrucciones específicas de una parte del repo |

## Cómo se cargan

### Hacia arriba: al arrancar

Claude Code lee `CLAUDE.md` y `CLAUDE.local.md` del **directorio actual y de todos sus ancestros**. Si arrancas en `monorepo/apps/api/`:

```text
monorepo/CLAUDE.md            ← se carga
monorepo/apps/CLAUDE.md       ← se carga (si existe)
monorepo/apps/api/CLAUDE.md   ← se carga
```

Todos se **concatenan** (no se sobrescriben entre sí), ordenados de la raíz hacia abajo: lo más cercano a donde arrancaste aparece más tarde en el contexto.

### Hacia abajo: bajo demanda

Los `CLAUDE.md` de **subcarpetas** del directorio de trabajo no se cargan al inicio. Se incluyen cuando Claude **lee archivos de esa subcarpeta**. Así, si trabajas en el frontend, las instrucciones de `infra/CLAUDE.md` no ocupan contexto.

```text
proyecto/
├── CLAUDE.md               # siempre
├── frontend/
│   └── CLAUDE.md           # al leer algo de frontend/
└── infra/
    └── CLAUDE.md           # al leer algo de infra/
```

!!! warning "Anidados y compactación"
    Los archivos cargados bajo demanda (anidados y reglas con `paths`) entran como parte del historial, así que la compactación puede resumirlos. Se recargan cuando Claude vuelve a leer archivos de esa ruta. Si una regla tiene que sobrevivir siempre, ponla en el `CLAUDE.md` raíz.

## `CLAUDE.local.md`: lo tuyo en este proyecto

```markdown
# Local (no se sube a Git)
- Mi base de datos de pruebas: postgres://localhost:5433/tienda_pablo
- Usuario de prueba: demo@example.com / demo1234
- Prefiero que me expliques los cambios en español y de forma breve.
```

Añádelo a `.gitignore`:

```bash
echo "CLAUDE.local.md" >> .gitignore
```

!!! tip "Worktrees"
    Un `CLAUDE.local.md` ignorado por Git solo existe en el *worktree* donde lo creaste. Para compartir preferencias personales entre worktrees, impórtalas desde tu home: `@~/.claude/mi-proyecto.md`.

## `~/.claude/CLAUDE.md`: tus preferencias globales

```markdown
# Preferencias personales
- Responde en español; código y commits en inglés.
- Explica brevemente el porqué de cada cambio.
- En proyectos JS, usa el gestor de paquetes que indique el lockfile.
- No añadas comentarios obvios al código.
```

## Reglas modulares: `.claude/rules/`

En proyectos grandes, un único `CLAUDE.md` se queda corto. Puedes repartir instrucciones en archivos temáticos:

```text
mi-proyecto/
├── .claude/
│   ├── CLAUDE.md
│   └── rules/
│       ├── estilo.md
│       ├── testing.md
│       ├── seguridad.md
│       └── frontend/
│           └── componentes.md
```

- Se descubren **recursivamente** todos los `.md`.
- Las reglas **sin** `paths` se cargan siempre, igual que `CLAUDE.md`.
- Hay reglas de usuario en `~/.claude/rules/`, que aplican a todos tus proyectos.

### Reglas limitadas a rutas (`paths`)

Con *frontmatter* YAML, una regla solo se carga cuando Claude trabaja con archivos que coinciden:

```markdown
---
paths:
  - "src/api/**/*.ts"
---
# Reglas para la API
- Todo endpoint valida la entrada con zod.
- Usa el formato de error estándar `{ error: { code, message } }`.
- Documenta cada endpoint con comentarios OpenAPI.
```

Patrones útiles:

| Patrón | Coincide con |
|---|---|
| `**/*.ts` | Todos los `.ts` del proyecto |
| `src/**/*` | Todo lo que hay bajo `src/` |
| `*.md` | Markdown en la raíz |
| `src/**/*.{ts,tsx}` | `.ts` y `.tsx` bajo `src/` |
| `tests/**/*.test.ts` | Archivos de test |

`paths` es el único campo de *frontmatter* que se interpreta en las reglas.

### Compartir reglas entre proyectos

`.claude/rules/` admite enlaces simbólicos:

```bash
ln -s ~/reglas-compartidas .claude/rules/compartidas
ln -s ~/estandares-empresa/seguridad.md .claude/rules/seguridad.md
```

Si el destino está fuera del proyecto, Claude Code pedirá aprobación la primera vez (como con los imports externos).

## Monorepos: excluir instrucciones ajenas

En un monorepo, puede que el `CLAUDE.md` de otro equipo se cargue y te estorbe. Usa `claudeMdExcludes` (en `.claude/settings.local.json` si es solo para ti):

```json
{
  "claudeMdExcludes": [
    "**/monorepo/CLAUDE.md",
    "/home/pablo/monorepo/otro-equipo/.claude/rules/**"
  ]
}
```

Los patrones se comparan con rutas absolutas. El `CLAUDE.md` de organización **no** se puede excluir.

## Directorios adicionales

Si añades otro directorio con `--add-dir` o `/add-dir`, por defecto **no** se cargan sus `CLAUDE.md`. Si lo necesitas, activa la variable `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD=1`.

## Guía rápida: ¿dónde lo pongo?

| Quiero que… | Ubicación |
|---|---|
| Todo el equipo lo siga en este repo | `./CLAUDE.md` |
| Solo aplique al trabajar en `frontend/` | `frontend/CLAUDE.md` o regla con `paths: frontend/**` |
| Solo yo lo tenga en este repo | `./CLAUDE.local.md` |
| Lo tenga yo en todos mis proyectos | `~/.claude/CLAUDE.md` o `~/.claude/rules/` |
| Toda la empresa lo cumpla | CLAUDE.md de *managed policy* |
| Se organice por temas | `.claude/rules/*.md` |

## Resumen

- Cinco niveles: organización, usuario, proyecto, local y anidados.
- Hacia arriba se carga al arrancar; hacia abajo, bajo demanda al leer archivos.
- `.claude/rules/` con `paths` para instrucciones específicas de una zona del código.
- `claudeMdExcludes` para silenciar instrucciones irrelevantes en monorepos.

## Ejercicios

1. Crea `~/.claude/CLAUDE.md` con tres preferencias personales.
2. Crea `CLAUDE.local.md` en un proyecto, añádelo a `.gitignore` y comprueba con `/context` que se carga.
3. Crea `.claude/rules/tests.md` con `paths: ["**/*.test.*"]`. Pide a Claude que edite un test y pregúntale qué reglas de testing conoce.
4. Ejecuta `/memory` y revisa la lista de archivos que aplican a tu sesión.

## Referencias

- [Ubicaciones de CLAUDE.md](https://code.claude.com/docs/en/memory#choose-where-to-put-claude-md-files)
- [Reglas con .claude/rules/](https://code.claude.com/docs/en/memory#organize-rules-with-claude/rules/)
- [Bases de código grandes](https://code.claude.com/docs/en/large-codebases)
- [El directorio .claude](https://code.claude.com/docs/en/claude-directory)
