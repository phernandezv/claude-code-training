---
titulo: CLAUDE.md vs. skills
resumen: Criterios para decidir si una instrucción va en CLAUDE.md o en una skill - frecuencia, tamaño, tipo de contenido, coste de contexto, comportamiento tras compactar - con ejemplos de migración y una tabla comparativa con reglas, hooks y subagentes.
---

## Objetivos de la lección

- Decidir con criterio entre `CLAUDE.md` y una skill.
- Migrar contenido de `CLAUDE.md` a skills sin perder comportamiento.
- Ubicar skills en el mapa completo de mecanismos (reglas, hooks, subagentes, MCP).

## La diferencia esencial

| | `CLAUDE.md` | Skill |
|---|---|---|
| **Cuándo se carga** | Siempre, al inicio y tras compactar | Descripción al inicio; contenido solo al invocarse |
| **Coste** | En **cada** petición | Bajo hasta que se usa |
| **Tipo de contenido** | **Hechos** que aplican casi siempre | **Procedimientos** o conocimiento que aplica a veces |
| **Invocación** | Implícita | `/nombre` o automática por descripción |
| **Archivos de apoyo** | Imports con `@` (se cargan siempre) | Archivos en su carpeta, leídos bajo demanda |
| **Puede ejecutar código al cargarse** | No | Sí (inyección dinámica con `` !`comando` ``) |
| **Puede aislarse** | No | Sí (`context: fork` en un subagente) |

Una forma de pensarlo: `CLAUDE.md` es **lo que un compañero debe saber siempre**; una skill es **el manual que consulta cuando le toca hacer algo concreto**.

## Preguntas para decidir

1. **¿Aplica a casi todas las tareas?** → `CLAUDE.md`. Si no → skill (o regla con `paths`).
2. **¿Es un hecho o un procedimiento?** Hechos cortos → `CLAUDE.md`. Pasos → skill.
3. **¿Es largo?** Más de unas pocas líneas de algo que no siempre aplica → skill.
4. **¿Quiero invocarlo como comando?** → skill.
5. **¿Depende de una zona del código?** → regla con `paths` o skill con `paths`.
6. **¿Tiene que cumplirse sí o sí?** → ni uno ni otro: **hook** o **permiso**.

## Ejemplos de clasificación

| Contenido | Destino |
|---|---|
| "Usa pnpm, no npm" | `CLAUDE.md` |
| "Los tests se ejecutan con `pnpm test`; uno solo con `pnpm test <ruta>`" | `CLAUDE.md` |
| Mapa de carpetas de 8 líneas | `CLAUDE.md` |
| Cómo publicar una versión (12 pasos) | Skill `/release` |
| Guía de estilo de componentes React (60 líneas) | Skill de conocimiento o regla con `paths: web/**/*.tsx` |
| Esquema y consultas típicas de la base de datos | Skill de conocimiento |
| Cómo investigar un incidente de producción | Skill `/incidente` |
| "Nunca edites archivos en `migrations/` ya aplicadas" | `CLAUDE.md` + hook que lo bloquee |
| "Formatea tras cada edición" | Hook `PostToolUse` |

## Migrar de CLAUDE.md a una skill

**Antes** (en `CLAUDE.md`):

```markdown
## Cómo añadir un endpoint
1. Crea el schema zod en src/schemas/.
2. Crea el handler en src/http/handlers/<recurso>.ts.
3. Regístralo en src/http/router.ts.
4. Añade el test de integración en tests/http/.
5. Actualiza openapi.yaml.
6. Ejecuta pnpm test http y pnpm lint.
```

**Después**: `.claude/skills/nuevo-endpoint/SKILL.md`

```markdown
---
name: nuevo-endpoint
description: Procedimiento para añadir un endpoint HTTP a la API. Úsala cuando haya que crear o exponer una ruta nueva.
argument-hint: "[METODO] [ruta]"
---
Añade el endpoint $ARGUMENTS siguiendo estos pasos:
1. Schema zod en `src/schemas/` (entrada y salida).
2. Handler en `src/http/handlers/<recurso>.ts`; solo valida y delega en el servicio.
3. Registro en `src/http/router.ts`.
4. Test de integración en `tests/http/` (caso feliz + validación + 404/403).
5. Actualiza `openapi.yaml`.
6. Verifica con `pnpm test http && pnpm lint`.
Ver ejemplos completos en [ejemplos.md](ejemplos.md).
```

**Y en `CLAUDE.md`** queda, como mucho, una línea:

```markdown
- Para crear endpoints usa la skill `/nuevo-endpoint`.
```

!!! tip "La descripción es la clave"
    Claude decide usar una skill por su **descripción**. Escríbela con las palabras que usaría alguien al pedir la tarea ("crear", "añadir endpoint", "nueva ruta"). Lo más importante, al principio: las descripciones largas se recortan en el listado.

## Comportamiento tras compactar

- `CLAUDE.md` raíz: se relee de disco, siempre presente.
- Skills invocadas: se reinyectan tras compactar, pero **con un límite de tamaño** por skill y total; las más antiguas pueden caer. Pon lo importante al **principio** de `SKILL.md`.

## El mapa completo

| Necesito… | Mecanismo |
|---|---|
| Hechos siempre presentes | `CLAUDE.md` |
| Instrucciones para una zona del código | `.claude/rules/*.md` con `paths` |
| Conocimiento o procedimientos bajo demanda | **Skills** |
| Comandos rápidos `/nombre` | Skills (o `.claude/commands/`) |
| Garantías deterministas | Hooks y permisos |
| Trabajo aislado con su propio contexto | Subagentes |
| Acceso a servicios externos | MCP / CLIs |
| Tono y formato de respuesta | Estilos de salida |
| Empaquetar y compartir todo lo anterior | Plugins |

## Resumen

- `CLAUDE.md`: hechos breves que aplican casi siempre (coste en cada petición).
- Skills: procedimientos y conocimiento ocasional (coste solo al usarse), invocables como comandos.
- Lo que debe cumplirse sí o sí: hooks/permisos.
- Migra procedimientos a skills y deja en `CLAUDE.md` una referencia de una línea.

## Ejercicios

1. Clasifica cada sección de tu `CLAUDE.md` con las seis preguntas.
2. Migra un procedimiento a una skill y comprueba que Claude la usa cuando pides esa tarea sin nombrarla.
3. Compara `/context` antes y después de la migración.

## Referencias

- [Skills](https://code.claude.com/docs/en/skills)
- [Memoria y CLAUDE.md](https://code.claude.com/docs/en/memory)
- [Extender Claude Code: comparativas](https://code.claude.com/docs/en/features-overview)
