---
titulo: Crear un subagente personalizado
resumen: Definir tus propios subagentes en .claude/agents o ~/.claude/agents - formato del archivo, frontmatter (name, description, tools, model, skills, memory, maxTurns, isolation…), escribir un buen prompt de sistema, invocarlos con @ y --agent, definirlos por CLI con --agents y ejemplos listos para usar.
---

## Objetivos de la lección

- Crear un subagente con su archivo Markdown y *frontmatter*.
- Escribir una **descripción** que haga que Claude delegue en el momento justo.
- Escribir un **prompt de sistema** eficaz.
- Invocarlo de las distintas formas y reutilizarlo.

## Dónde se guardan

| Ubicación | Alcance | Prioridad si hay nombres repetidos |
|---|---|---|
| *Managed settings* | Organización | 1 (más alta) |
| Flag `--agents` | Esa sesión | 2 |
| `.claude/agents/` | Proyecto (súbelo a Git) | 3 |
| `~/.claude/agents/` | Todos tus proyectos | 4 |
| Plugin (`agents/`) | Donde el plugin esté activo | 5 |

Se buscan de forma recursiva, así que puedes organizarlos en subcarpetas (`agents/revision/`, `agents/datos/`). Claude Code detecta cambios en estas carpetas en pocos segundos.

## Crear uno pidiéndoselo a Claude

La forma más rápida:

```text
> Crea un subagente de proyecto llamado "revisor-seguridad" que revise diffs
  buscando vulnerabilidades, solo con herramientas de lectura y git diff,
  usando el modelo opus.
```

Claude escribirá el archivo en `.claude/agents/`. Revísalo y ajústalo.

## El archivo

`.claude/agents/revisor-seguridad.md`:

```markdown
---
name: revisor-seguridad
description: Revisor de seguridad. Úsalo de forma proactiva tras cambios que toquen autenticación, permisos, entrada de usuario, SQL, ficheros o secretos, y antes de abrir un PR.
tools: Read, Grep, Glob, Bash
model: opus
maxTurns: 25
color: red
---
Eres un ingeniero de seguridad de aplicaciones que revisa cambios de código.

## Proceso
1. Obtén el diff con `git diff main...HEAD` (o el rango que te indiquen).
2. Para cada archivo cambiado, lee el contexto necesario alrededor del cambio.
3. Busca: inyección (SQL, comandos, plantillas), XSS, control de acceso roto,
   exposición de datos personales, secretos en código, deserialización insegura,
   SSRF y validación de entrada ausente.
4. Verifica cada sospecha leyendo el código real; descarta lo no confirmado.

## Formato de respuesta
- Empieza con una línea: `N hallazgos (X altos, Y medios, Z bajos)` o `Sin hallazgos`.
- Por hallazgo: severidad, archivo:línea, descripción, escenario de explotación
  y corrección propuesta.
- No incluyas problemas de estilo. No edites archivos.
```

El cuerpo Markdown es el **prompt de sistema** del subagente (sustituye al de Claude Code para ese subagente).

!!! warning "tools no filtra comandos"
    `tools` y `disallowedTools` trabajan con **herramientas completas**: poner `Bash` da acceso a Bash entero, y una entrada con patrón como `Bash(git push *)` en `disallowedTools` elimina Bash por completo. Para permitir Bash pero bloquear comandos concretos, usa reglas `permissions.deny` en `settings.json` (se aplican también a los subagentes). Lo vemos en la lección 58.

## Referencia del frontmatter

| Campo | Obligatorio | Para qué |
|---|---|---|
| `name` | Sí | Identificador único (minúsculas y guiones) |
| `description` | Sí | **Cuándo** delegar en él |
| `tools` | No | Lista blanca de herramientas (si se omite, hereda todas las disponibles) |
| `disallowedTools` | No | Lista negra (se aplica antes que `tools`) |
| `model` | No | `sonnet`, `opus`, `haiku`, `fable`, un ID completo o `inherit` |
| `permissionMode` | No | Modo de permisos del subagente |
| `maxTurns` | No | Máximo de turnos antes de parar |
| `skills` | No | Skills cuyo contenido se precarga al empezar |
| `mcpServers` | No | Servidores MCP solo para este subagente (lección 58) |
| `hooks` | No | Hooks activos mientras corre |
| `memory` | No | Memoria persistente: `user`, `project` o `local` |
| `background` | No | `true` para ejecutarse siempre en segundo plano |
| `isolation` | No | `worktree` para trabajar en un worktree temporal aislado |
| `omitClaudeMd` | No | `true` para no cargar tus `CLAUDE.md` |
| `effort` | No | Nivel de esfuerzo |
| `color` | No | Color en la interfaz |

Los nombres de campo de varias palabras van en *camelCase* (`maxTurns`, `disallowedTools`) y deben escribirse exactamente así.

## La descripción: cuándo delegar

Claude decide por la descripción. Consejos:

- Di **qué hace** y **cuándo usarlo**, con los términos que aparecerán en las peticiones.
- Para fomentar la delegación automática, incluye expresiones como *"úsalo de forma proactiva tras…"*.
- Sé breve: todas las descripciones suman contexto (Claude Code avisa si superan un umbral).

## El prompt de sistema: buenas prácticas

- **Rol claro** y límites ("no edites archivos").
- **Proceso** paso a paso.
- **Formato de salida** exacto y breve (recuerda: vuelve a la conversación principal).
- **Criterios de calidad** (verificar antes de reportar, citar archivo:línea).
- Nada de relleno: cada línea cuesta.

## Invocarlo

```text
> Usa el revisor-seguridad sobre mis cambios.                 ← lenguaje natural
> @"revisor-seguridad (agent)" revisa la rama actual          ← mención (garantiza su uso)
> @agent-revisor-seguridad revisa la rama actual              ← mención escrita a mano
```

### Toda la sesión como ese agente

```bash
claude --agent revisor-seguridad
```

La sesión principal adopta su prompt, herramientas y modelo. Para hacerlo por defecto en un proyecto:

```json
{ "agent": "revisor-seguridad" }
```

## Definirlos al vuelo: `--agents`

Útil para scripts o pruebas, sin crear archivos:

```bash
claude --agents '{
  "resumidor-logs": {
    "description": "Resume logs largos y agrupa errores por causa.",
    "prompt": "Eres un analista de logs. Agrupa errores por causa raíz, cuenta ocurrencias y señala el primero de cada tipo con su marca de tiempo. Máximo 30 líneas.",
    "tools": ["Read", "Grep", "Bash"],
    "model": "haiku"
  }
}'
```

## Memoria persistente

Con `memory`, el subagente tiene un directorio donde acumula aprendizajes entre sesiones:

```markdown
---
name: revisor-codigo
description: Revisa calidad de código y convenciones del proyecto.
memory: project
---
Revisa el código… Al terminar, anota en tu memoria patrones y errores
recurrentes del proyecto para tenerlos en cuenta en próximas revisiones.
```

| `memory` | Dónde |
|---|---|
| `user` | `~/.claude/agent-memory/<agente>/` |
| `project` | `.claude/agent-memory/<agente>/` (se puede versionar) |
| `local` | `.claude/agent-memory-local/<agente>/` (no se versiona) |

## Aislar en un worktree

```markdown
---
name: experimentador
description: Prueba cambios experimentales sin tocar tu copia de trabajo.
isolation: worktree
---
```

El subagente trabaja en un worktree temporal de Git: sus cambios no afectan a tus archivos hasta que decidas integrarlos.

## Galería de ejemplos

### Ejecutor de tests (barato)

```markdown
---
name: ejecutor-tests
description: Ejecuta tests y resume fallos. Úsalo cuando haya que correr la suite o investigar tests rotos.
tools: Bash, Read, Grep
model: haiku
---
Ejecuta los tests indicados (por defecto `npm test`). Devuelve solo:
- Número de tests pasados/fallidos.
- Por cada fallo: nombre del test, archivo:línea y el mensaje de error en ≤3 líneas.
No intentes arreglar nada.
```

### Documentador

```markdown
---
name: documentador
description: Escribe y actualiza documentación técnica (README, docs/, comentarios JSDoc/docstrings) a partir del código.
tools: Read, Grep, Glob, Edit, Write
model: sonnet
---
Documenta el código indicado para desarrolladores del equipo: propósito,
uso con ejemplos, parámetros y errores. Sigue el estilo de docs/ existente.
Solo edita archivos de documentación o comentarios; nunca lógica.
```

### Experto en consultas SQL

```markdown
---
name: experto-sql
description: Diseña y optimiza consultas SQL para la base de datos del proyecto. Úsalo para consultas lentas, índices o migraciones de esquema.
tools: Read, Grep, Glob
skills:
  - db-consultas
model: opus
---
Analiza la consulta o el problema indicado. Propón SQL optimizado, índices
necesarios y el plan de ejecución esperado. Explica los compromisos.
```

## Resumen

- Archivo Markdown en `.claude/agents/` o `~/.claude/agents/`: frontmatter + prompt de sistema.
- `name` y `description` obligatorios; `tools`, `model`, `skills`, `memory`, `isolation`… para afinar.
- Invócalo por nombre, con `@`, o como sesión completa con `--agent`.
- `--agents` para definiciones temporales en scripts.

## Ejercicios

1. Crea `revisor-seguridad` y úsalo sobre una rama con un cambio sensible.
2. Crea `ejecutor-tests` con Haiku y compara coste y contexto frente a ejecutar los tests en la conversación principal.
3. Añade `memory: project` a un subagente y comprueba qué guarda tras dos usos.
4. Arranca una sesión con `claude --agent documentador` y pide documentar un módulo.

## Referencias

- [Crear subagentes personalizados](https://code.claude.com/docs/en/sub-agents)
- [Referencia de la CLI: --agent y --agents](https://code.claude.com/docs/en/cli-reference)
