---
titulo: "Proyecto de portafolio: lleva un cambio de principio a fin"
resumen: Proyecto práctico de las secciones 3 y 4 - desde un ticket hasta un pull request fusionable, pasando por worktree, plan con opusplan, implementación verificada, commits atómicos, auto-revisión, PR y atención a comentarios.
---

## El reto

Toma una **incidencia real** de tu backlog (o inventa una razonable) y llévala hasta un PR listo para fusionar usando todo lo aprendido. El foco no es solo el código, sino el **proceso**: plan revisado, verificación, historial limpio, revisión y comunicación.

Elige algo de tamaño **mediano**: toca de 3 a 10 archivos, necesita tests y tiene al menos una decisión de diseño. Ejemplos:

- Añadir paginación a un endpoint que devuelve listas enteras.
- Permitir que el usuario cambie su email con verificación.
- Añadir un filtro por rango de fechas a un listado.
- Sustituir una librería obsoleta en un módulo.

## Criterios de éxito

| # | Criterio | Evidencia |
|---|---|---|
| 1 | Trabajo aislado en worktree/rama | `git worktree list` o nombre de rama |
| 2 | Plan revisado con al menos una iteración | Plan guardado (con `plansDirectory`) o captura |
| 3 | Tests nuevos/actualizados y en verde | Salida de tests |
| 4 | 2–5 commits atómicos con mensajes que explican el porqué | `git log --oneline` |
| 5 | Auto-revisión con `/review` (y `/security-review` si aplica) | Hallazgos y cómo se resolvieron |
| 6 | PR con qué/por qué/cómo probar/riesgos | Enlace al PR |
| 7 | Al menos un comentario de revisión atendido | Commit posterior |
| 8 | Coste de la sesión anotado | `/usage` |

## Fase 1: preparar (10 min)

```bash
cd mi-proyecto
git switch main && git pull
claude -w paginacion-pedidos --model opusplan --permission-mode plan
```

Opcional, para versionar el plan:

```json
{ "plansDirectory": "./plans" }
```

## Fase 2: explorar y planificar (20–30 min)

```text
> Ticket: <pega aquí el ticket>. Antes de planificar, hazme las preguntas
  que necesites sobre requisitos y casos límite.
```

Responde, y luego:

```text
> Propón el plan con: archivos afectados, pasos, decisiones y alternativas,
  riesgos, verificación y fuera de alcance.
```

Revísalo con la lista de la lección 19. Itera al menos una vez con feedback concreto (lección 20). Retoca con `Ctrl+G` si hace falta.

## Fase 3: implementar (30–60 min)

Aprueba con el modo que prefieras. `opusplan` pasará a Sonnet para ejecutar.

```text
> Implementa el plan paso a paso. Tras cada paso ejecuta los tests afectados.
  Si algo contradice el plan, detente y consúltame.
```

Durante la implementación:

- Vigila la lista de tareas (`Ctrl+T`).
- Interrumpe con `Esc` si se desvía.
- Si el contexto crece mucho, `/compact` con foco en lo pendiente.
- Si la implementación destapa algo imprevisto, vuelve a `/plan`.

## Fase 4: historial limpio (10 min)

```text
> Revisa todos los cambios y organízalos en commits atómicos siguiendo
  Conventional Commits (por ejemplo: refactor previo, funcionalidad, tests,
  docs). Muéstrame los mensajes antes de commitear.
```

```bash
git log --oneline main..HEAD
```

## Fase 5: auto-revisión (15 min)

```text
/review high
```

Clasifica cada hallazgo: corregir / falso positivo (explica por qué) / fuera de alcance (crea un ticket).

Si tocas autenticación, datos personales o pagos:

```text
/security-review
```

Corrige, vuelve a pasar tests y crea un commit `fix:` o enmienda el commit afectado (si aún no has subido la rama).

## Fase 6: pull request (10 min)

```text
> Sube la rama y crea un PR hacia main. Descripción con: Qué, Por qué,
  Cómo (decisiones clave), Cómo probarlo (pasos exactos), Riesgos y
  Fuera de alcance. Enlaza el ticket.
```

Revisa la descripción y pide mejoras si hace falta.

## Fase 7: atender la revisión

Pide a un compañero que revise (o usa una sesión limpia como revisor adversarial, lección 28). Luego:

```text
> Lee los comentarios del PR con gh. Para cada uno propón cómo atenderlo;
  espera mi confirmación y después aplica, commitea y sube.
```

Si pasa tiempo y `main` avanza, practica también la integración:

```text
> Integra main en esta rama (merge). Si hay conflictos, explícame ambos lados
  antes de resolver.
```

## Fase 8: cierre y reflexión

- Ejecuta `/usage` y anota coste y duración.
- Pregunta a Claude: *"¿Qué deberíamos añadir a CLAUDE.md o a las reglas del proyecto a partir de esta tarea?"* y aplica lo que tenga sentido.
- Sal de la sesión y decide si conservar el worktree.

## Entregable

Un breve documento (puede ir en la descripción del PR o en `docs/`) con:

1. Enlace al PR.
2. El plan final y qué cambió respecto al primero.
3. Hallazgos de la revisión y su resolución.
4. Coste/tiempo y lo que harías distinto.

## Rúbrica

| Aspecto | Básico | Bueno | Excelente |
|---|---|---|---|
| Plan | Aprobado sin revisar | Revisado, una iteración | Iterado, con alternativas y riesgos explícitos |
| Verificación | Tests existentes | Tests nuevos | Tests nuevos + casos límite + lint/tipos |
| Historial | Un único commit | Varios commits | Commits atómicos con cuerpo explicativo |
| Revisión | Ninguna | `/review` | `/review` + seguridad + revisión humana atendida |
| Comunicación | PR sin descripción | Descripción completa | Descripción + pasos de prueba + riesgos + aprendizajes aplicados |

## Referencias

- [Worktrees](https://code.claude.com/docs/en/worktrees) · [Modo plan](https://code.claude.com/docs/en/permission-modes) · [Code Review](https://code.claude.com/docs/en/code-review)
- [Buenas prácticas](https://code.claude.com/docs/en/best-practices)
