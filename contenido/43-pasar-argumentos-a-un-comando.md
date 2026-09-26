---
titulo: Pasar argumentos a un comando
resumen: Hacer comandos y skills parametrizables - $ARGUMENTS, argumentos posicionales ($0, $1, $ARGUMENTS[N]), argumentos con nombre, comillas para valores con espacios, argument-hint, combinar argumentos con inyección de comandos y encadenar varias skills.
---

## Objetivos de la lección

- Usar `$ARGUMENTS` para recibir todo lo que escribes tras el comando.
- Acceder a argumentos por posición y por nombre.
- Pasar valores con espacios correctamente.
- Combinar argumentos con contexto dinámico y con otras skills.

## `$ARGUMENTS`: todo lo que sigue al comando

`.claude/commands/arreglar-issue.md`:

```markdown
---
description: Resuelve un issue de GitHub siguiendo nuestro flujo
argument-hint: "[número-de-issue]"
disable-model-invocation: true
---
Resuelve el issue #$ARGUMENTS:
1. Léelo con `gh issue view $ARGUMENTS --comments`.
2. Crea una rama `fix/$ARGUMENTS-<descripcion-corta>`.
3. Reproduce el problema con un test que falle.
4. Corrígelo y comprueba que el test pasa.
5. Haz commit con `fix: … (closes #$ARGUMENTS)`.
```

```text
/arreglar-issue 482
```

Claude recibe el texto con `482` en cada `$ARGUMENTS`.

!!! note "Si no hay marcador"
    Si invocas un comando con argumentos pero su contenido no tiene ningún marcador, Claude Code añade al final `ARGUMENTS: <lo que escribiste>` para que Claude lo vea igualmente.

## Argumentos posicionales

Para varios valores, accede por índice (empezando en 0):

| Marcador | Valor |
|---|---|
| `$ARGUMENTS[0]` o `$0` | Primer argumento |
| `$ARGUMENTS[1]` o `$1` | Segundo argumento |
| `$ARGUMENTS` | La cadena completa, tal como la escribiste |

`.claude/commands/migrar-componente.md`:

```markdown
---
description: Migra un componente entre frameworks o lenguajes
argument-hint: "[Componente] [origen] [destino]"
---
Migra el componente $0 de $1 a $2.
- Mantén el mismo comportamiento y la misma API pública.
- Migra también sus tests y asegúrate de que pasan.
- Enumera al final cualquier diferencia inevitable.
```

```text
/migrar-componente SearchBar JavaScript TypeScript
```

## Argumentos con nombre

Más legible: declara nombres en el *frontmatter* y úsalos como `$nombre`:

```markdown
---
description: Compara el rendimiento de un endpoint entre dos ramas
argument-hint: "[endpoint] [rama-base] [rama-nueva]"
arguments: [endpoint, base, nueva]
---
Compara el rendimiento de `$endpoint` entre las ramas `$base` y `$nueva`:
1. En un worktree de `$base`, arranca el servidor y mide 200 peticiones con `autocannon`.
2. Repite en `$nueva`.
3. Presenta una tabla con p50, p95, p99 y peticiones/s, y comenta la diferencia.
```

```text
/comparar-rendimiento /api/orders main feat/cache-pedidos
```

Los nombres se asignan por posición: `endpoint` = primero, `base` = segundo, `nueva` = tercero.

## Valores con espacios: comillas

Los argumentos posicionales siguen reglas de comillas tipo shell:

```text
/crear-ticket "El login falla con emails en mayúsculas" alta backend
```

- `$0` → `El login falla con emails en mayúsculas`
- `$1` → `alta`
- `$2` → `backend`
- `$ARGUMENTS` → la cadena completa tal cual

## `argument-hint`: ayuda al escribir

```markdown
argument-hint: "[archivo] [formato: json|csv]"
```

Aparece en el autocompletado cuando escribes `/comando`, recordándote qué pasar.

## Argumentos + contexto dinámico

Los marcadores de argumentos también se sustituyen dentro de los comandos inyectados con `` !`…` ``:

```markdown
---
description: Resume un PR concreto
argument-hint: "[número-de-PR]"
allowed-tools: Bash(gh pr view *) Bash(gh pr diff *)
---
## Descripción y comentarios
!`gh pr view $0 --comments`

## Diff (resumen)
!`gh pr diff $0 --name-only`

Resume el PR #$0: objetivo, cambios principales, puntos de discusión abiertos
y riesgos. Máximo 15 líneas.
```

```text
/resumen-pr 1234
```

!!! warning "Cuidado con la inyección"
    Si un argumento acaba dentro de un comando de shell, alguien podría pasar algo como `1234; rm -rf ~`. Usa comandos inyectados solo con argumentos que controlas tú, limita con `allowed-tools` y recuerda que tus reglas `deny` siguen aplicándose.

## Encadenar skills

Puedes invocar varias skills al principio de un mismo mensaje; el texto que sigue se pasa como argumentos a cada una:

```text
/escribir-tests /arreglar-issue 482
```

Se cargan ambas y las dos reciben `482`.

## Variables disponibles además de los argumentos

| Variable | Valor |
|---|---|
| `${CLAUDE_SESSION_ID}` | ID de la sesión actual |
| `${CLAUDE_EFFORT}` | Nivel de esfuerzo actual |
| `${CLAUDE_SKILL_DIR}` | Carpeta de la skill (solo skills) |
| `${CLAUDE_PROJECT_DIR}` | Raíz del proyecto |

Ejemplo: guardar un informe con el ID de sesión:

```markdown
Guarda el informe en `informes/${CLAUDE_SESSION_ID}-$0.md`.
```

## Argumentos en modo headless

Funcionan igual dentro del prompt de `claude -p`:

```bash
claude -p "/resumen-pr 1234" --output-format json | jq -r '.result'
```

Muy útil para scripts y CI (lección 47).

## Resumen

- `$ARGUMENTS` = todo; `$0`, `$1`… o `$ARGUMENTS[N]` = por posición; `$nombre` con `arguments:`.
- Comillas para valores con espacios; `argument-hint` para recordar el formato.
- Los argumentos también se sustituyen en `` !`comandos` `` (con cuidado).
- Puedes encadenar skills y usarlas en `claude -p`.

## Ejercicios

1. Crea `/arreglar-issue` y pruébalo con un issue real (o uno de prueba).
2. Crea un comando con tres argumentos con nombre y `argument-hint`.
3. Pasa un argumento con espacios usando comillas y comprueba qué recibe cada marcador.
4. Ejecuta uno de tus comandos con argumentos desde `claude -p`.

## Referencias

- [Pasar argumentos a skills](https://code.claude.com/docs/en/skills#pass-arguments-to-skills)
- [Sustituciones disponibles](https://code.claude.com/docs/en/skills)
