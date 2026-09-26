---
titulo: Skills de Claude
resumen: Qué es una skill, cómo funciona la carga progresiva (descripción siempre, contenido al usarse), tipos de skills (conocimiento y tarea), quién puede invocarlas, dónde viven, las skills incluidas (/run, /verify, /code-review…) y el estándar abierto Agent Skills.
---

## Objetivos de la lección

- Entender qué es una **skill** y qué problema resuelve.
- Conocer la **carga progresiva** y por qué hace a las skills baratas en contexto.
- Diferenciar skills de **conocimiento** y de **tarea**.
- Descubrir las skills incluidas y dónde se guardan las tuyas.

## ¿Qué es una skill?

Una skill es una **carpeta con un archivo `SKILL.md`**: instrucciones, conocimiento o un procedimiento que Claude puede usar cuando lo necesita. Puede incluir archivos de apoyo (documentación de referencia, plantillas, scripts).

```text
.claude/skills/
└── release/
    ├── SKILL.md          ← instrucciones (obligatorio)
    ├── checklist.md      ← material de referencia (opcional)
    └── scripts/
        └── bump.sh       ← script que Claude puede ejecutar (opcional)
```

Se invoca de dos formas:

- **Tú**, escribiendo `/nombre-de-la-skill` (por eso las skills también son "comandos slash").
- **Claude**, automáticamente, cuando tu petición encaja con la **descripción** de la skill.

!!! note "Comandos personalizados = skills"
    Los antiguos comandos en `.claude/commands/<nombre>.md` y las skills en `.claude/skills/<nombre>/SKILL.md` crean el mismo `/nombre` y funcionan igual. Los comandos siguen funcionando; las skills añaden carpeta propia con archivos de apoyo. Lo verás en la lección 47.

## Carga progresiva: por qué las skills son baratas

| Momento | Qué entra en el contexto |
|---|---|
| Inicio de sesión | Solo el **nombre y la descripción** de cada skill |
| Cuando se invoca | El contenido completo de `SKILL.md` |
| Si hace falta | Los archivos de apoyo que `SKILL.md` referencia, leídos bajo demanda |
| Scripts | Se **ejecutan**; su código no tiene por qué entrar en contexto |

Por eso puedes tener decenas de skills sin saturar el contexto, algo imposible si todo estuviera en `CLAUDE.md`.

## Dos tipos de contenido

### Skills de conocimiento (referencia)

Aportan información que Claude aplica a lo que esté haciendo: guías de estilo, convenciones de API, conocimiento del dominio, cómo funciona un sistema heredado.

```markdown
---
name: convenciones-api
description: Convenciones de diseño de la API REST del proyecto. Úsala al crear o modificar endpoints.
---
- Rutas en plural y kebab-case: `/order-items/{id}`.
- Errores: `{ "error": { "code": "ORDER_NOT_FOUND", "message": "…" } }` con el status adecuado.
- Paginación por cursor: `?cursor=…&limit=50`, respuesta con `next_cursor`.
- Fechas en ISO 8601 UTC.
```

### Skills de tarea (procedimiento)

Pasos concretos para una acción: publicar, migrar, generar código, preparar un informe. Suelen invocarse a mano.

```markdown
---
name: nueva-migracion
description: Crea una migración de base de datos siguiendo el flujo del equipo.
disable-model-invocation: true
---
Crea una migración para: $ARGUMENTS
1. Genera el archivo con `pnpm db:migration:new <nombre-en-kebab-case>`.
2. Implementa `up` y `down` (debe ser reversible).
3. Ejecuta `pnpm db:migrate` y luego `pnpm db:rollback` para comprobar `down`.
4. Actualiza los tipos con `pnpm db:types`.
5. Resume los cambios de esquema.
```

## Quién puede invocar una skill

| Configuración | Tú (`/nombre`) | Claude (automático) | Contexto al inicio |
|---|---|---|---|
| Por defecto | Sí | Sí | Descripción |
| `disable-model-invocation: true` | Sí | No | Nada (ni la descripción) |
| `user-invocable: false` | No | Sí | Descripción |

- Usa `disable-model-invocation: true` para acciones con efectos (desplegar, publicar, enviar mensajes): tú decides cuándo.
- Usa `user-invocable: false` para conocimiento de fondo que no tiene sentido como comando.

## Dónde viven las skills

| Ubicación | Ruta | Disponible en |
|---|---|---|
| Personal | `~/.claude/skills/<nombre>/SKILL.md` | Todos tus proyectos en esta máquina |
| Proyecto | `.claude/skills/<nombre>/SKILL.md` | Ese repositorio (súbela a Git para el equipo) |
| Anidada | `<subcarpeta>/.claude/skills/<nombre>/SKILL.md` | Al trabajar en esa subcarpeta (monorepos) |
| Plugin | `<plugin>/skills/<nombre>/SKILL.md` | Donde el plugin esté activo, como `/plugin:nombre` |
| Organización | Directorio de *managed settings* | Todos los usuarios de la organización |
| Cuenta de claude.ai | Skills activadas en tu cuenta | Sesiones en la nube, Cowork y terminal con esa cuenta |

## Skills incluidas

Claude Code trae skills listas para usar. Algunas destacadas:

| Skill | Para qué |
|---|---|
| `/code-review` (`/review`) | Revisar un diff, rama o PR (lección 33) |
| `/simplify` | Revisar el código cambiado buscando simplificaciones y aplicarlas |
| `/debug` | Depuración guiada |
| `/doctor` | Diagnóstico de la instalación y configuración |
| `/run` | Arrancar y manejar tu app para ver un cambio funcionando |
| `/verify` | Construir y ejecutar la app para confirmar que un cambio hace lo que debe |
| `/run-skill-generator` | Enseñar a `/run` y `/verify` cómo arrancar tu proyecto (guarda una skill en el repo) |
| `/loop` | Repetir un prompt a intervalos |
| `/batch` | Aplicar una instrucción a muchos elementos |
| `/claude-api` | Referencia para construir con la API de Claude |

Se pueden desactivar con el ajuste `disableBundledSkills`.

## Ver y gestionar skills: `/skills`

```text
/skills
```

Lista las skills disponibles; puedes filtrar, ordenar por tamaño en tokens (`t`) y cambiar su visibilidad para Claude y para el menú `/`. También puedes preguntar: *"¿Qué skills tienes disponibles?"*.

## Un estándar abierto

Las skills de Claude Code siguen el estándar abierto **Agent Skills**, así que una skill básica (con `name`, `description` y contenido) también funciona en otras herramientas y en claude.ai. Claude Code añade campos extra (control de invocación, subagentes, argumentos, etc.).

## Cuándo crear una skill

- Pegas a menudo las mismas instrucciones o la misma checklist en el chat.
- Una sección de `CLAUDE.md` se ha convertido en un procedimiento.
- Tienes conocimiento del dominio que Claude necesita **a veces**, no siempre.
- Quieres un comando `/algo` para un flujo repetible.

## Resumen

- Skill = carpeta con `SKILL.md` (+ archivos de apoyo), invocable por ti (`/nombre`) o por Claude.
- Carga progresiva: descripción siempre, contenido al usarse → coste de contexto bajo.
- Conocimiento vs. tarea; controla quién invoca con `disable-model-invocation` y `user-invocable`.
- Personal (`~/.claude/skills`), proyecto (`.claude/skills`), plugins y organización.

## Ejercicios

1. Ejecuta `/skills` y explora las skills incluidas. Prueba `/simplify` sobre un cambio reciente.
2. Identifica en tu `CLAUDE.md` una sección que debería ser una skill.
3. Clasifica tres procedimientos de tu equipo como skill de conocimiento o de tarea.

## Referencias

- [Skills en Claude Code](https://code.claude.com/docs/en/skills)
- [Estándar Agent Skills](https://agentskills.io)
- [Comandos y skills incluidas](https://code.claude.com/docs/en/commands)
