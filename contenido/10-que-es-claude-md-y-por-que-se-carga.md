---
titulo: Qué es CLAUDE.md y por qué se carga en cada sesión
resumen: La memoria persistente del proyecto - qué es CLAUDE.md, cómo y cuándo se carga, cómo generarlo con /init, importar otros archivos con @, la memoria automática y AGENTS.md.
---

## Objetivos de la lección

- Entender por qué cada sesión "empieza de cero" y cómo `CLAUDE.md` lo resuelve.
- Crear un `CLAUDE.md` inicial con `/init`.
- Conocer la diferencia entre `CLAUDE.md` (lo escribes tú) y la **memoria automática** (la escribe Claude).
- Importar otros archivos con la sintaxis `@ruta`.
- Saber cómo encaja `AGENTS.md`.

## El problema: amnesia entre sesiones

Cada sesión nueva arranca con una **ventana de contexto vacía**. Claude no recuerda que ayer le dijiste "en este proyecto usamos `pnpm`, no `npm`", ni que los tests necesitan Redis levantado. Sin memoria persistente acabarías repitiendo las mismas explicaciones en cada sesión.

## La solución: `CLAUDE.md`

`CLAUDE.md` es un archivo Markdown normal con instrucciones para Claude. Claude Code lo **lee al inicio de cada sesión** y lo mete en el contexto. Es como el documento de *onboarding* que le darías a un compañero nuevo:

```markdown
# Proyecto: API de reservas

## Comandos
- Instalar: `pnpm install`
- Desarrollo: `pnpm dev` (puerto 4000)
- Tests: `pnpm test` (requiere Redis: `docker compose up -d redis`)
- Lint + tipos: `pnpm lint && pnpm typecheck`

## Convenciones
- TypeScript estricto; nada de `any`.
- Los handlers HTTP van en `src/http/handlers/`, la lógica en `src/domain/`.
- Errores de negocio: lanzar `DomainError`, nunca `Error` genérico.

## Flujo
- Antes de dar una tarea por terminada, ejecuta lint, typecheck y tests.
```

!!! note "Contexto, no configuración obligatoria"
    `CLAUDE.md` se entrega a Claude como **contexto** (un mensaje después del *system prompt*). Claude intenta seguirlo, pero no es una regla que se imponga técnicamente. Si algo **nunca** debe ocurrir (p. ej. editar `.env`), usa permisos `deny` o un **hook** (lecciones 15 y 44).

### Por qué "se carga siempre"

Justamente para que las reglas importantes **no dependan de la conversación**. El chat se compacta y se borra; `CLAUDE.md` se vuelve a leer de disco al empezar y también **después de cada compactación**. Por eso todo lo que deba cumplirse siempre va ahí.

## Dónde se coloca

Lo veremos en detalle en la lección 13. Por ahora, lo básico:

| Archivo | Alcance |
|---|---|
| `./CLAUDE.md` o `./.claude/CLAUDE.md` | El proyecto; se sube a Git y lo comparte el equipo |
| `./CLAUDE.local.md` | Tus preferencias personales en este proyecto (añádelo a `.gitignore`) |
| `~/.claude/CLAUDE.md` | Tus preferencias para **todos** los proyectos |

## Generarlo con `/init`

No hace falta empezar desde cero:

```text
/init
```

Claude analiza el repositorio (`package.json`, `Makefile`, `pyproject.toml`, estructura de carpetas, README, CI…) y crea un `CLAUDE.md` con comandos de build y test, convenciones y arquitectura que detecta. Si ya existe uno, **propone mejoras** en lugar de sobrescribirlo.

Para un asistente más completo (que también propone skills, hooks y memoria personal):

```bash
CLAUDE_CODE_NEW_INIT=1 claude
# y dentro: /init
```

!!! tip "Revisa lo que genera /init"
    `/init` es un punto de partida. Borra lo obvio (Claude ya ve que es un proyecto React), corrige lo inexacto y añade lo que **no se deduce del código**: decisiones de equipo, trampas conocidas, comandos especiales.

## Importar otros archivos con `@`

Un `CLAUDE.md` puede incluir otros archivos con `@ruta`. Se expanden al cargar:

```markdown
Visión general del proyecto en @README.md y scripts disponibles en @package.json.

# Instrucciones adicionales
- Flujo de Git: @docs/git-workflow.md
- Mis preferencias personales: @~/.claude/preferencias-proyecto-x.md
```

Detalles:

- Rutas relativas **al archivo que importa**, no al directorio de trabajo.
- Los importados pueden importar otros, hasta 4 niveles de profundidad.
- Dentro de bloques de código o entre comillas invertidas (`` `@README` ``) **no** se importa.
- La primera vez que un `CLAUDE.md` de proyecto importa algo **fuera del proyecto** (p. ej. de tu home), Claude Code te pide aprobación.

## Comentarios para humanos

Los comentarios HTML de bloque se eliminan antes de enviarlos a Claude, así que no gastan tokens:

```markdown
<!-- Nota para mantenedores: revisar esta sección cuando migremos a Postgres 17 -->
- La base de datos es Postgres 16.
```

## Editar la memoria: `/memory`

```text
/memory
```

Lista todos los archivos de memoria que aplican (usuario, proyecto, local…) y te deja abrirlos en tu editor. También permite activar/desactivar la memoria automática.

También puedes pedírselo en lenguaje natural:

```text
> Añade a CLAUDE.md que las migraciones se generan con `pnpm db:migrate:new <nombre>`.
```

## La memoria automática (auto memory)

Además de lo que tú escribes, Claude puede **tomar notas por sí mismo** entre sesiones:

| | `CLAUDE.md` | Memoria automática |
|---|---|---|
| Quién la escribe | Tú | Claude |
| Qué contiene | Instrucciones y reglas | Aprendizajes: tus preferencias, correcciones que le diste, contexto que no se deduce del código |
| Dónde | En el repo / tu home | `~/.claude/projects/<proyecto>/memory/` |
| Cuánto se carga | Completo (recomendado < 200 líneas) | Las primeras 200 líneas (o 25 KB) de `MEMORY.md` |

Cuando le dices *"recuerda que los tests de la API necesitan Redis local"*, Claude lo guarda en la memoria automática y verás mensajes como "Saved 1 memory". Son archivos Markdown normales que puedes revisar y editar con `/memory`.

Para desactivarla en un proyecto:

```json
{
  "autoMemoryEnabled": false
}
```

(o con la variable de entorno `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1`).

!!! tip "¿Memoria automática o CLAUDE.md?"
    Si es una regla **del equipo**, pídele *"añádelo a CLAUDE.md"* para que se suba a Git. La memoria automática es local a tu máquina.

## ¿Y `AGENTS.md`?

`AGENTS.md` es un formato abierto que usan varias herramientas de programación con IA. Claude Code también puede leer el `AGENTS.md` de un repositorio, solo o junto a `CLAUDE.md`. Si tu equipo usa varias herramientas, una estrategia común es mantener las instrucciones en `AGENTS.md` e importarlo desde `CLAUDE.md`:

```markdown
@AGENTS.md

## Específico de Claude Code
- Usa el subagente `revisor` antes de abrir PRs.
```

## Comprobar que se ha cargado

```text
/context
```

En la sección **Memory files** verás qué archivos `CLAUDE.md` se han cargado. Si el tuyo no aparece, Claude no lo ve.

## Resumen

- Cada sesión empieza sin memoria; `CLAUDE.md` aporta contexto persistente.
- Se carga al inicio y tras cada compactación: es el lugar de las reglas permanentes.
- `/init` genera un borrador; `/memory` lo edita; `@ruta` importa otros archivos.
- La memoria automática complementa con lo que Claude aprende de ti.

## Ejercicios

1. Ejecuta `/init` en un proyecto tuyo y revisa el `CLAUDE.md` generado. Elimina tres líneas obvias y añade dos cosas que no se deducen del código.
2. Abre una sesión nueva y pregunta *"¿cómo ejecuto los tests aquí?"*. ¿Usa lo que pusiste?
3. Pídele a Claude que "recuerde" una preferencia tuya y localiza el archivo en `~/.claude/projects/…/memory/`.
4. Usa `/context` para confirmar que `CLAUDE.md` aparece en *Memory files*.

## Referencias

- [Cómo recuerda Claude tu proyecto (memoria)](https://code.claude.com/docs/en/memory)
- [Explorar la ventana de contexto](https://code.claude.com/docs/en/context-window)
- [Buenas prácticas](https://code.claude.com/docs/en/best-practices)
