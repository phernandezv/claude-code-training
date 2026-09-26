---
titulo: "Cómo trabaja Claude con tu repo: estado, diffs e historial"
resumen: Qué sabe Claude de tu repositorio Git al empezar, cómo consulta estado, diffs, log y blame, cómo usar el historial para entender código, /diff, y la configuración relacionada (includeGitInstructions, permisos de git).
---

## Objetivos de la lección

- Saber qué información de Git recibe Claude automáticamente.
- Usar a Claude para leer estado, diferencias e historial.
- Aprovechar `git log` y `git blame` para entender **por qué** el código es como es.
- Configurar permisos de Git razonables.

## Lo que Claude sabe de tu repo al empezar

Cuando arrancas Claude Code en un repositorio Git, recibe:

1. **Una instantánea del estado**: rama actual, rama principal, archivos modificados y commits recientes.
2. **Instrucciones integradas** sobre cómo escribir commits y pull requests (formato de mensajes, no hacer push forzado sin permiso, etc.).

Así, sin preguntar nada, Claude sabe en qué rama estás y si hay cambios pendientes. Si usas tu propio flujo de Git (por ejemplo mediante skills), puedes desactivar ambas cosas:

```json
{
  "includeGitInstructions": false
}
```

## Git es la herramienta de Claude

Claude no tiene una "integración mágica" con Git: usa la **CLI de `git`** a través de la herramienta Bash, igual que tú. Eso significa:

- Puede ejecutar cualquier comando de Git (sujeto a tus permisos).
- Los comandos de **solo lectura** (`git status`, `git diff`, `git log`, `git show`, `git blame`…) no requieren aprobación.
- Los que modifican (`git commit`, `git push`, `git reset`…) sí, salvo que los permitas.

## Estado y diferencias

```text
> ¿Qué cambios tengo sin commitear? Resúmelos por archivo.
> Compara mi rama con main y dime qué funcionalidades añade.
> ¿Hay algo en staging que no debería estar (secretos, archivos generados)?
```

Por debajo, Claude ejecutará algo como:

```bash
git status --short
git diff
git diff --cached
git diff main...HEAD --stat
```

### `/diff`: tu visor integrado

```text
/diff
```

Abre un visor de los cambios del árbol de trabajo, incluidos los que ha hecho Claude. Útil para revisar antes de commitear sin salir de la sesión.

### Mostrar el diff tú mismo

```text
! git diff --stat
```

Recuerda que con `!` la salida entra en el contexto y Claude puede comentarla.

## El historial como fuente de contexto

Git guarda el **porqué** de las cosas. Claude puede investigarlo por ti:

```text
> ¿Por qué esta función hace un reintento con backoff? Revisa el historial
  de src/payments/client.ts y los mensajes de commit relacionados.

> ¿Quién cambió por última vez la lógica de descuentos y en qué PR?

> ¿Cuándo se introdujo este bug? Busca en el historial el commit que cambió
  el cálculo de impuestos.
```

Comandos que suele usar:

```bash
git log --oneline -20 -- src/payments/client.ts
git log -S "retryWithBackoff" --oneline      # commits que añadieron/quitaron ese texto
git blame -L 40,70 src/payments/client.ts
git show <commit>
```

!!! tip "Arqueología de código"
    Preguntas como *"¿qué problema resolvía este código cuando se escribió?"* son de las más valiosas en un repo heredado. Claude combina `git log`, `git blame` y la lectura del código para darte una respuesta con referencias a commits.

## Buscar el commit que rompió algo: `git bisect`

Claude puede guiar (o ejecutar) una búsqueda binaria:

```text
> Los tests de facturación pasaban en la etiqueta v2.3.0 y fallan en HEAD.
  Usa git bisect con `pnpm test billing` para encontrar el commit culpable.
```

```bash
git bisect start HEAD v2.3.0
git bisect run pnpm test billing
git bisect reset
```

## Resumir actividad

```text
> Resume lo que se ha hecho en el repo esta semana, agrupado por área.
> Genera unas notas de versión desde v1.4.0 hasta HEAD.
```

## Permisos de Git recomendados

En `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git show *)",
      "Bash(git blame *)",
      "Bash(git branch *)",
      "Bash(git add *)",
      "Bash(git commit *)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(git rebase *)",
      "Bash(git reset *)"
    ],
    "deny": [
      "Bash(git push --force *)",
      "Bash(git push -f *)",
      "Bash(git clean *)"
    ]
  }
}
```

Recuerda: en **modo auto**, el clasificador ya bloquea por defecto operaciones destructivas como `push --force`, `reset --hard` o `clean -fd`.

## Git como red de seguridad

Trabajar con Git limpio te da el mejor "deshacer":

- Empieza las tareas con el árbol **limpio** (o en una rama nueva).
- Haz commits pequeños y frecuentes para tener puntos de retorno.
- Los **checkpoints** de Claude (`/rewind`) no ven cambios hechos por comandos; Git sí.

## Resumen

- Claude recibe una instantánea de Git e instrucciones de commit/PR al empezar.
- Usa la CLI de `git`: lectura libre, escritura según permisos.
- El historial (`log`, `blame`, `-S`, `bisect`) es una fuente de contexto muy valiosa.
- `/diff` para revisar; Git limpio como red de seguridad.

## Ejercicios

1. Pregunta a Claude qué cambios tienes pendientes y revisa con `/diff`.
2. Elige una función antigua y pide que te explique su historia con `git log` y `git blame`.
3. Crea un bug a propósito en una rama con varios commits y pide a Claude que lo encuentre con `git bisect`.
4. Añade los permisos de Git recomendados a tu proyecto.

## Referencias

- [Flujos de trabajo comunes](https://code.claude.com/docs/en/common-workflows)
- [Referencia de settings: includeGitInstructions](https://code.claude.com/docs/en/settings-reference)
- [Permisos](https://code.claude.com/docs/en/permissions)
