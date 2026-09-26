---
titulo: Revisar código y PRs con Claude
resumen: Revisión local con /review (/code-review) y sus niveles de esfuerzo, --fix y --comment, /security-review, revisar PRs ajenos con gh, revisión adversarial en una sesión limpia, y la revisión automática en GitHub con REVIEW.md.
---

## Objetivos de la lección

- Revisar tus propios cambios antes de abrir un PR.
- Usar `/review` y `/security-review` y entender sus opciones.
- Revisar PRs de otras personas con ayuda de Claude.
- Conocer la revisión automática en GitHub y cómo afinarla con `REVIEW.md`.

## Por qué revisar con Claude

Claude es bueno encontrando: errores de lógica, casos límite sin cubrir, inconsistencias con el resto del código, problemas de seguridad comunes, duplicaciones y oportunidades de simplificar. **No sustituye** la revisión humana (contexto de negocio, decisiones de producto), pero la hace más rápida y enfocada.

## `/review` (alias de `/code-review`)

```text
/review
```

Revisa los commits de tu rama que aún no están en su *upstream* **más** los cambios sin commitear. Se ejecuta como un **subagente en segundo plano**, con su propio contexto, así que puedes seguir trabajando; los hallazgos llegan a la conversación al terminar.

### Objetivos distintos

```text
/review 1234                 ← un PR por número
/review feat/export-csv      ← una rama
/review src/payments/        ← una ruta
```

### Nivel de esfuerzo

```text
/review low        ← pocos hallazgos, alta confianza (menos falsos positivos)
/review high       ← más cobertura, puede incluir hallazgos dudosos
/review max
```

Si no indicas nivel, reutiliza el último que usaste.

### Aplicar o publicar

| Flag | Efecto |
|---|---|
| `--fix` | Aplica las correcciones propuestas en tu árbol de trabajo al terminar |
| `--comment` | Publica los hallazgos como comentarios en línea en el PR de GitHub (o una nota en GitLab con `glab`) |

```text
/review high --fix
/review 1234 --comment
```

!!! warning "Revisa los --fix"
    Las ediciones de una revisión en segundo plano no quedan en los checkpoints de tu sesión. Trabaja con Git limpio y revisa con `/diff` antes de commitear.

## `/security-review`

```text
/security-review
```

Analiza el diff de tu rama respecto a la rama por defecto de `origin` buscando vulnerabilidades: inyecciones, problemas de autenticación/autorización, exposición de datos, secretos, etc. Necesita un remoto `origin`.

Ideal como paso obligatorio antes de abrir PRs que tocan autenticación, pagos o datos personales.

## Revisión "a mano" con prompts

Para revisiones con un enfoque concreto:

```text
> Revisa el diff de mi rama contra main centrándote en:
  1) manejo de errores y casos límite,
  2) consultas N+1 o sin índice,
  3) coherencia con los patrones de src/services/.
  Para cada problema indica archivo:línea, severidad (alta/media/baja) y
  una propuesta de corrección. No edites nada.
```

### Revisar el PR de un compañero

```text
> Revisa el PR #482. Lee la descripción y los comentarios existentes con gh,
  luego el diff. Dame un resumen de qué hace, dudas que le plantearía al autor
  y problemas concretos con archivo:línea.
```

```bash
gh pr view 482 --comments
gh pr diff 482
gh pr checkout 482     # si quieres que Claude ejecute tests en local
```

### Revisión adversarial en una sesión limpia

Un truco potente: quien escribió el código (la sesión actual) tiene sesgos. Abre **otra sesión** sin ese contexto:

```bash
claude -p "Eres un revisor exigente. Revisa el diff de esta rama contra main y busca bugs reales, no estilo. Justifica cada hallazgo con archivo:línea." \
  --allowedTools "Bash(git diff *),Bash(git log *),Read,Grep,Glob"
```

O usa un **subagente revisor** (lección 52) con instrucciones y herramientas de solo lectura.

## Revisión automática en GitHub

Hay dos caminos para que Claude revise PRs automáticamente:

1. **Code Review gestionado** (planes Team y Enterprise): un administrador lo activa y Claude revisa los PRs al abrirse o en cada push, publicando comentarios en línea con severidad:

    | Marca | Severidad |
    |---|---|
    | 🔴 | Importante: bug a corregir antes de fusionar |
    | 🟡 | Menor (*nit*) |
    | 🟣 | Preexistente: el bug ya estaba antes del PR |

    Se puede pedir manualmente comentando `@claude review` en el PR.

2. **GitHub Actions** con tu propia infraestructura (lección 47).

### Afinar con `REVIEW.md`

En la raíz del repo, `REVIEW.md` contiene instrucciones específicas para la revisión automática:

```markdown
# Instrucciones de revisión

## Severidad
- 🔴 solo para: bugs de lógica, problemas de seguridad, pérdida de datos,
  cambios incompatibles en la API pública.
- Todo lo de estilo es 🟡.

## Límites
- Máximo 5 nits por revisión; el resto, como recuento en el resumen.

## Ignorar
- `src/generated/**`, `*.lock`, `vendor/**`, ramas `renovate/*`.

## Comprobaciones propias
- Toda ruta nueva en `src/http/routes/` necesita un test de integración.
- Cualquier consulta SQL nueva debe usar el query builder, no SQL crudo.

## Evidencia
- Afirmaciones sobre comportamiento deben citar archivo:línea.
```

(La revisión local con `/review` sigue tu `CLAUDE.md`, pero no lee `REVIEW.md`.)

## Actuar sobre los hallazgos

```text
> Corrige los hallazgos 1, 3 y 4 de la revisión. El 2 es un falso positivo
  porque la validación ya se hace en el middleware; no lo toques.
```

Después, vuelve a ejecutar tests y, si quieres, otra `/review low` para confirmar.

## Checklist de auto-revisión antes del PR

1. `/review` (o `/review high` en cambios delicados).
2. `/security-review` si tocas auth, pagos o datos personales.
3. Tests + lint en verde.
4. `/diff` final y descripción del PR con riesgos.

## Resumen

- `/review [nivel] [--fix] [--comment] [objetivo]` revisa en segundo plano.
- `/security-review` para vulnerabilidades del diff de la rama.
- Revisiones con enfoque vía prompt; revisiones adversariales en una sesión limpia.
- En GitHub: Code Review gestionado o Actions, afinado con `REVIEW.md`.

## Ejercicios

1. Ejecuta `/review low` y `/review high` sobre la misma rama. Compara número y calidad de hallazgos.
2. Introduce a propósito una inyección SQL en una rama de prueba y ejecuta `/security-review`.
3. Revisa un PR de un compañero con Claude y redacta tus comentarios a partir de su análisis.
4. Escribe un `REVIEW.md` para tu repo con al menos una comprobación propia.

## Referencias

- [Code Review (incluye /code-review local)](https://code.claude.com/docs/en/code-review)
- [Comandos: /review y /security-review](https://code.claude.com/docs/en/commands)
- [GitHub Actions](https://code.claude.com/docs/en/github-actions)
