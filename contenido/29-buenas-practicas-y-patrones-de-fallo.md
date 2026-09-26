---
titulo: Buenas prácticas y patrones de fallo comunes
resumen: Síntesis práctica de cómo trabajar bien con Claude Code - los hábitos que más mejoran los resultados, los errores que más tiempo hacen perder y cómo detectarlos a tiempo, con una checklist para antes, durante y después de cada tarea.
---

## Objetivos de la lección

- Reunir en un solo lugar los hábitos que más impacto tienen.
- Reconocer los **patrones de fallo** más habituales y su remedio.
- Tener una **checklist** reutilizable para cada tarea.

## Los siete hábitos que más rinden

### 1. Dale siempre una forma de verificar

Es la palanca número uno. Un agente que puede comprobar su trabajo (tests, compilación, un script, una captura de pantalla) corrige sus propios errores. Sin verificación, solo produce algo *plausible*.

```text
> Implementa X. Verifícalo con `pnpm test src/x` y `pnpm typecheck`.
  No des la tarea por terminada si alguno falla.
```

### 2. Explora y planifica antes de cambios medianos

Para cualquier cosa que toque varios archivos o tenga varias soluciones: modo plan o, como mínimo, "lee y proponme antes de editar" (lecciones 22–24).

### 3. Contexto específico en el prompt

Rutas con `@`, síntomas concretos, restricciones y criterio de éxito. Cuanto menos tenga que adivinar, menos leerá y mejor acertará.

### 4. Una tarea por sesión

`/clear` (o una sesión nueva) al cambiar de tema. El contexto de otras tareas encarece y confunde.

### 5. Corrige pronto

Si ves que se desvía, `Esc` y redirige en ese momento. Cuanto más avanza por un camino equivocado, más cuesta volver.

### 6. Lo permanente, en su sitio

Reglas estables en `CLAUDE.md`, procedimientos en skills, obligaciones en hooks y permisos. No repitas lo mismo en cada prompt.

### 7. Revisa como revisarías a un compañero

`/diff`, `/review` y, en trabajos largos o autónomos, una **revisión adversarial**: un subagente o una sesión limpia que solo ve el diff y los requisitos, y busca huecos.

## Patrones de fallo y su remedio

| Patrón | Cómo se reconoce | Remedio |
|---|---|---|
| **La sesión cajón de sastre** | Mezclas varias tareas; Claude cita cosas de hace una hora | `/clear` entre tareas; nombra y retoma sesiones con `/resume` |
| **Corregir en bucle** | Tercera corrección sobre lo mismo y sigue mal | Tras dos intentos fallidos, `/clear` o `/rewind` y reescribe el prompt inicial con lo aprendido |
| **CLAUDE.md inflado** | Reglas ignoradas; archivo de cientos de líneas | Poda sin piedad; procedimientos a skills y obligaciones a hooks |
| **Confiar sin verificar** | Código que "parece bien" pero falla en casos límite | Tests o comprobaciones obligatorias; no des por bueno lo que no se ha verificado |
| **Exploración infinita** | "Investiga el backend" y lee cientos de archivos | Acota la pregunta o delega en un subagente |
| **Encargo ambiguo** | Resultado correcto para un problema que no era el tuyo | Objetivo, restricciones y criterio de éxito; pide que te pregunte antes de empezar |
| **Plan aprobado sin leer** | La implementación toca cosas inesperadas | Lee el plan con la checklist de la lección 23 |
| **Demasiada autonomía sin red** | Cambios difíciles de deshacer tras una sesión larga en modo auto | Rama o worktree, commits frecuentes, sandbox o contenedor (lección 18) |
| **Coste descontrolado** | Sesiones lentas y caras | `/context`, `/usage`, modelo y esfuerzo adecuados, subagentes para lo verboso |
| **Paralelizar lo dependiente** | Subagentes que se contradicen o se pisan | Encadena en secuencia o reparte archivos disjuntos |

## Señales de que algo va mal

- Claude pide disculpas y repite el mismo enfoque.
- La lista de tareas (`Ctrl+T`) crece en vez de avanzar.
- Lee archivos que no tienen relación con la tarea.
- Sus respuestas mencionan cosas de tareas anteriores.
- Propone desactivar un test o "simplificar" una validación para que algo pase.

Ante cualquiera de ellas: detente, entiende por qué, y reencauza con un prompt mejor o un contexto limpio.

## Checklist por tarea

**Antes**

- [ ] Rama o worktree limpio.
- [ ] Sesión nueva o `/clear`; nombre con `-n` o `/rename`.
- [ ] Objetivo, restricciones, archivos relevantes y cómo verificar, en el prompt.
- [ ] Plan si el cambio es mediano o grande.

**Durante**

- [ ] Vigilar la lista de tareas y el rumbo; `Esc` si se desvía.
- [ ] `/compact` con foco si el contexto crece mucho.
- [ ] Subagentes para investigaciones o salidas voluminosas.

**Después**

- [ ] Tests, lint y tipos en verde.
- [ ] `/diff` y `/review` (y `/security-review` si procede).
- [ ] Commits atómicos con mensajes que expliquen el porqué.
- [ ] Preguntar: "¿qué deberíamos añadir a CLAUDE.md, a una skill o a un hook a partir de esta tarea?"

## Desarrolla tu criterio

Ninguna regla es absoluta. A veces conviene dejar que el contexto se acumule porque estás a fondo en un problema complejo; a veces un prompt abierto es justo lo que necesitas para explorar. Fíjate en qué hiciste cuando el resultado fue excelente y en qué falló cuando no lo fue: ese criterio propio vale más que cualquier lista.

## Resumen

- Verificación, plan, contexto específico, una tarea por sesión, corrección temprana, cada regla en su mecanismo y revisión.
- Reconoce los patrones de fallo por sus señales y aplica su remedio.
- Usa la checklist hasta que se convierta en hábito.

## Ejercicios

1. Revisa tus últimas tres sesiones: ¿cuál de los patrones de fallo apareció?
2. Convierte la checklist en un comando personalizado `/checklist` (lección 47).
3. En tu próxima tarea larga, añade una revisión adversarial con un subagente antes de hacer commit.

## Referencias

- [Buenas prácticas](https://code.claude.com/docs/en/best-practices)
- [Flujos de trabajo comunes](https://code.claude.com/docs/en/common-workflows)
