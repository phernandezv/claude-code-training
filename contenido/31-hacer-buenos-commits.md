---
titulo: "Hacer buenos commits: staging y mensajes de commit"
resumen: Cómo pedir a Claude commits atómicos y bien descritos - revisar antes de preparar, staging selectivo, Conventional Commits, mensajes que explican el porqué, la atribución Co-Authored-By y cómo automatizar mensajes en modo headless.
---

## Objetivos de la lección

- Pedir commits **atómicos** (un cambio lógico por commit).
- Hacer staging selectivo con ayuda de Claude.
- Obtener mensajes de commit que expliquen el **porqué**.
- Configurar convenciones (Conventional Commits) y la atribución de Claude.

## Qué es un buen commit

| Característica | Por qué importa |
|---|---|
| **Atómico**: un cambio lógico | Se puede revisar, revertir o hacer *cherry-pick* por separado |
| **Compila y pasa tests** | Cada commit es un punto de retorno válido (y `git bisect` funciona) |
| **Mensaje claro** | El historial se vuelve documentación |
| **Sin ruido** | Nada de archivos generados, secretos o cambios de formato mezclados |

## Pedir un commit a Claude

Lo más simple:

```text
> Haz commit de estos cambios.
```

Claude revisará `git status` y `git diff`, preparará los archivos y escribirá un mensaje. Pero puedes pedir mucho más:

```text
> Revisa mis cambios. Si hay más de un cambio lógico, divídelos en commits
  separados (por ejemplo, el refactor por un lado y la funcionalidad por otro).
  Usa Conventional Commits. Enséñame los mensajes antes de commitear.
```

## Staging selectivo

Cuando en un mismo archivo mezclaste dos cosas, Claude puede preparar solo una parte. Como el modo interactivo (`git add -p`) no funciona bien en una herramienta no interactiva, Claude suele:

- Hacer `git add` de archivos concretos.
- O construir un parche con solo los fragmentos deseados y aplicarlo al índice (`git apply --cached`).

```text
> En src/cart.ts hay un fix del redondeo y un cambio de nombres de variables.
  Haz dos commits: primero el fix, luego el renombrado.
```

!!! tip "Revisa el staging"
    Antes de confirmar, pide: *"muéstrame `git diff --cached --stat` y el diff completo de lo que vas a commitear"*.

## Mensajes que explican el porqué

El diff ya dice **qué** cambió. El mensaje debe decir **por qué** y el contexto que no se ve:

```text
fix(cart): redondear el total después de aplicar impuestos

Redondeábamos cada línea antes de sumar el IVA, lo que producía
diferencias de 1 céntimo respecto a la factura en pedidos con muchas
líneas. Ahora se suma en céntimos y se redondea una sola vez al final.

Refs: SHOP-512
```

Estructura:

1. **Asunto** (≤ 72 caracteres, imperativo): qué hace el commit.
2. Línea en blanco.
3. **Cuerpo**: motivo, contexto, efectos secundarios, alternativas descartadas.
4. **Pie**: referencias a tickets, `BREAKING CHANGE:`, co-autores.

## Conventional Commits

Si tu equipo lo usa, ponlo en `CLAUDE.md`:

```markdown
## Commits
- Formato Conventional Commits: `tipo(ámbito): descripción`.
- Tipos: feat, fix, refactor, perf, test, docs, chore, ci, build.
- Asunto en inglés, imperativo, sin punto final, ≤ 72 caracteres.
- Cuerpo explicando el porqué cuando el cambio no sea obvio.
- Incluye `Refs: <ticket>` si la rama tiene un ticket en el nombre.
```

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de bug |
| `refactor` | Cambio interno sin cambiar comportamiento |
| `perf` | Mejora de rendimiento |
| `test` | Tests |
| `docs` | Documentación |
| `chore`, `build`, `ci` | Mantenimiento, dependencias, pipelines |

## Verificar antes de commitear

Añade a `CLAUDE.md` (o impónlo con un hook, lección 50):

```markdown
- Antes de cada commit ejecuta `pnpm lint && pnpm test`. No hagas commit si fallan.
```

Si usas *pre-commit hooks* de Git (husky, pre-commit), Claude verá sus errores y los corregirá. Nunca le pidas que los salte con `--no-verify` salvo que sepas lo que haces.

## La atribución de Claude

Por defecto, los commits que crea Claude incluyen un *trailer* de co-autoría:

```text
Co-Authored-By: Claude <noreply@anthropic.com>
```

y las descripciones de PR incluyen una línea indicando que se generaron con Claude Code. Puedes personalizarlo con el ajuste `attribution`:

```json
{
  "attribution": {
    "commit": "Assisted-by: Claude Code",
    "pr": ""
  }
}
```

o ocultarlo por completo con `"attribution": false` (en versiones recientes). Consulta la política de tu equipo sobre atribución de código asistido por IA.

## Modificar commits

- **`--amend`**: útil para corregir el último commit **que aún no has subido**. En modo auto, el clasificador bloquea por defecto enmendar commits que no creó Claude en la sesión o que ya se subieron.
- **Rebase interactivo** (`git rebase -i`) requiere un editor interactivo; pide a Claude alternativas no interactivas (por ejemplo `git commit --fixup` + `git rebase --autosquash` con `GIT_SEQUENCE_EDITOR=:`), o hazlo tú.

## Mensajes de commit en modo headless

```bash
# Proponer un mensaje a partir de lo preparado
git diff --cached | claude -p "Escribe un mensaje Conventional Commits (asunto + cuerpo breve con el porqué). Devuelve solo el mensaje."

# Hacerlo todo con permisos acotados
claude -p "Revisa los cambios preparados y crea un commit adecuado" \
  --allowedTools "Bash(git diff *),Bash(git log *),Bash(git status *),Bash(git commit *)"
```

## Resumen

- Commits atómicos, que pasan tests, con mensajes que explican el porqué.
- Pide a Claude que divida cambios mezclados y que te enseñe el staging.
- Documenta tu convención en `CLAUDE.md`; verifica con lint/tests antes de commitear.
- Personaliza la atribución con `attribution`.

## Ejercicios

1. Haz dos cambios no relacionados en un archivo y pide a Claude que los separe en dos commits.
2. Pide un mensaje de commit y reescríbelo tú para que explique mejor el porqué; añade esa pauta a `CLAUDE.md`.
3. Crea un alias de shell que genere un mensaje de commit con `claude -p` a partir de `git diff --cached`.

## Referencias

- [Flujos comunes: crear commits y PRs](https://code.claude.com/docs/en/common-workflows)
- [Settings: attribution](https://code.claude.com/docs/en/settings-reference)
- [Conventional Commits](https://www.conventionalcommits.org/es/v1.0.0/)
