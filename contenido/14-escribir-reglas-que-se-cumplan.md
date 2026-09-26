---
titulo: Escribir reglas que se cumplan
resumen: Técnicas para que Claude siga tus instrucciones - especificidad, verificabilidad, énfasis con moderación, explicar el porqué, evitar contradicciones, y cuándo pasar de una regla escrita a un mecanismo que la haga cumplir.
---

## Objetivos de la lección

- Diagnosticar por qué una instrucción de `CLAUDE.md` no se respeta.
- Redactar reglas concretas, verificables y sin contradicciones.
- Usar el énfasis con criterio.
- Saber cuándo una regla escrita no basta y hay que **imponerla** (permisos, hooks).

## Por qué una regla "no se cumple"

`CLAUDE.md` es contexto, no un contrato. Las causas más comunes de incumplimiento:

1. **Vaga**: "escribe buen código" no se puede verificar.
2. **Enterrada**: está en la línea 340 de un archivo de 500.
3. **Contradictoria**: otra regla (o un `CLAUDE.md` anidado) dice lo contrario.
4. **Sin motivo**: Claude no entiende por qué importa y la "negocia" ante un caso raro.
5. **No se ha cargado**: el archivo no está donde crees (compruébalo con `/context`).
6. **Diluida**: la sesión es muy larga y la conversación compite con ella.

## Principio 1: concreto y verificable

| ❌ Vago | ✅ Concreto |
|---|---|
| "Formatea bien el código" | "Indentación de 2 espacios; ejecuta `pnpm format` tras editar" |
| "Prueba tus cambios" | "Ejecuta `pnpm test` antes de dar la tarea por terminada" |
| "Mantén los archivos organizados" | "Los handlers van en `src/api/handlers/`, uno por recurso" |
| "Cuidado con la seguridad" | "Nunca interpoles variables en SQL; usa siempre el query builder `db.select()`" |

Una buena regla permite responder **sí o no** a "¿se ha cumplido?".

## Principio 2: explica el porqué

Una regla con motivo se aplica mejor en casos que no previste:

```markdown
- Dinero siempre en céntimos (enteros). Motivo: tuvimos errores de redondeo
  con float en facturas; los informes contables cuadran al céntimo.
```

Con el motivo, Claude también evitará `float` en un cálculo de descuentos que no mencionaste.

## Principio 3: positivo y con alternativa

Decir solo lo que **no** hacer deja a Claude adivinando. Da la alternativa:

```markdown
- No uses `console.log` para depurar en código que se sube; usa `logger.debug()` de `src/lib/logger.ts`.
```

## Principio 4: énfasis con moderación

Puedes marcar reglas críticas con **IMPORTANTE** o **NUNCA**, y funciona... si lo usas poco. Si todo es "IMPORTANTE", nada lo es.

```markdown
## Reglas críticas
- IMPORTANTE: nunca ejecutes migraciones contra producción. Solo `DATABASE_URL` de `.env.local`.
- NUNCA hagas commit de archivos en `secrets/`.
```

Ponlas **arriba** del archivo, en una sección propia.

## Principio 5: sin contradicciones

Si dos reglas chocan, Claude elegirá una casi al azar. Revisa periódicamente:

- El `CLAUDE.md` raíz, los anidados en subcarpetas y los de `.claude/rules/`.
- Tu `~/.claude/CLAUDE.md` personal (puede contradecir al del proyecto).

Ejemplo de conflicto típico: el `CLAUDE.md` del usuario dice "usa npm" y el del proyecto dice "usa pnpm". Las instrucciones más cercanas al directorio de trabajo aparecen después en el contexto, pero es mejor eliminar la ambigüedad: en el personal escribe *"usa el gestor de paquetes que indique el proyecto; si no dice nada, npm"*.

## Principio 6: corto gana

Cada línea extra reduce la atención sobre las demás. Técnicas para adelgazar:

- Mueve procedimientos largos a **skills** (lección 44).
- Mueve reglas específicas de una carpeta a **reglas con `paths`** (lección 15).
- Sustituye explicaciones por **enlaces** a docs (`@docs/arquitectura.md` si de verdad hace falta cargarlo siempre, o solo la ruta si basta con que Claude sepa que existe).

## Ejemplos de reglas bien escritas

```markdown
## Flujo de trabajo
- Tras cambiar código TypeScript, ejecuta `pnpm typecheck`. Si falla, corrige antes de seguir.
- Prefiere ejecutar tests individuales (`pnpm test <archivo>`) en vez de la suite completa.
- Si un cambio afecta a más de 5 archivos, propón un plan antes de editar.

## Estilo
- Exporta funciones con nombre; nada de `export default` (facilita el refactor y la búsqueda).
- Errores: usa `Result<T, E>` de `src/lib/result.ts` en la capa de servicios; no lances excepciones.

## Comunicación
- Al terminar, resume en 3–5 viñetas qué cambiaste y cómo lo verificaste.
```

## Cuando escribir no basta: imponer

Algunas cosas **no pueden depender** de que Claude "se acuerde":

| Necesidad | Mecanismo |
|---|---|
| No leer ni editar `.env` o `secrets/` | Regla `deny` en permisos (lección 17) |
| No ejecutar `git push --force` | Regla `deny` o hook `PreToolUse` (lección 50) |
| Formatear siempre tras editar | Hook `PostToolUse` que ejecuta el formateador |
| Los tests deben pasar antes de terminar | Hook `Stop` que ejecuta los tests |

Regla práctica: **CLAUDE.md para guiar; permisos y hooks para garantizar.**

## Depurar una regla que falla

1. `/context` → ¿aparece el archivo en *Memory files*?
2. Pregunta a Claude: *"¿Qué dice tu CLAUDE.md sobre X?"*. Si no lo sabe, no se cargó.
3. Busca contradicciones en todos los niveles (`/memory` los lista).
4. Reescribe la regla con los principios 1–3.
5. Si es crítica, conviértela en permiso o hook.

## Resumen

- Concreto, verificable, con motivo y con alternativa.
- Énfasis solo para lo crítico, arriba del todo.
- Sin contradicciones entre niveles; corto y enfocado.
- Lo que no puede fallar se impone con permisos y hooks.

## Ejercicios

1. Toma tres reglas vagas de tu `CLAUDE.md` y reescríbelas siguiendo los principios.
2. Añade el "porqué" a tus dos reglas más importantes.
3. Busca una regla que en realidad debería ser un permiso `deny` o un hook y anótala para la lección 17/50.

## Referencias

- [Escribir instrucciones efectivas](https://code.claude.com/docs/en/memory#write-effective-instructions)
- [Solución de problemas de memoria](https://code.claude.com/docs/en/memory#troubleshoot-memory-issues)
- [Guía de hooks](https://code.claude.com/docs/en/hooks-guide)
